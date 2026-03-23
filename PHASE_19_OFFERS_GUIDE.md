# Phase 19: Offers Module - Complete Implementation Guide

**Status**: ✅ PRODUCTION-READY  
**Build**: Clean (0 errors)  
**Last Updated**: 2025-01-08

---

## Overview

The Offers module manages job offer creation, state transitions, versioning, acceptance/rejection lifecycle, and maintains an immutable audit trail. This module enforces business rules such as "only one active offer per submission" and "rejected offer returns submission to interview status."

### Key Features
- **State Machine**: Immutable transitions with terminal states (accepted, rejected, withdrawn)
- **Offer Versioning**: Integer counter per submission for revision tracking
- **Update Restriction**: Only draft offers can be edited
- **Active Offer Rule**: Only one issued offer allowed per submission at a time
- **Submission Sync**: Automatic submission status updates on offer transitions
- **Audit Trail**: Complete history tracking with reason/metadata support
- **RBAC Integration**: Permission-based access control for all operations

---

## Architecture

### Database Schema

#### 1. Enums
```sql
-- Offer Status (5 states)
CREATE TYPE offer_status_enum AS ENUM (
    'draft',      -- Initial state, editable
    'issued',     -- Active offer sent to candidate
    'accepted',   -- Terminal state (candidate accepted)
    'rejected',   -- Terminal state (candidate rejected)
    'withdrawn'   -- Terminal state (company withdrew)
);

-- Employment Type (4 types)
CREATE TYPE employment_type_enum AS ENUM (
    'full_time',
    'contract',
    'intern',
    'part_time'
);
```

#### 2. Offers Table (18 columns)
```sql
CREATE TABLE offers (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    
    -- Status & Versioning
    status offer_status_enum NOT NULL DEFAULT 'draft',
    offer_version INTEGER NOT NULL DEFAULT 1,
    
    -- Compensation
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    base_salary DECIMAL(15,2),
    bonus DECIMAL(15,2),
    equity VARCHAR(100),
    
    -- Employment Details
    employment_type employment_type_enum NOT NULL,
    start_date DATE,
    expiry_date DATE,
    notes TEXT,
    
    -- Audit
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE UNIQUE INDEX idx_offers_submission_version ON offers(submission_id, offer_version) WHERE deleted_at IS NULL;
CREATE INDEX idx_offers_company_status ON offers(company_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_offers_company_submission ON offers(company_id, submission_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_offers_created_by ON offers(created_by_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_offers_deleted ON offers(deleted_at) WHERE deleted_at IS NOT NULL;
```

#### 3. Offer Status History Table (Immutable Audit)
```sql
CREATE TABLE offer_status_history (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    
    -- Transition Data
    old_status offer_status_enum,
    new_status offer_status_enum NOT NULL,
    
    -- Metadata
    changed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_offer_history_offer_company ON offer_status_history(offer_id, company_id);
CREATE INDEX idx_offer_history_company_date ON offer_status_history(company_id, changed_at DESC);
CREATE INDEX idx_offer_history_changed_by ON offer_status_history(changed_by_id);
```

---

## State Machine

### Valid Transitions
```typescript
VALID_TRANSITIONS = {
    [OfferStatusEnum.DRAFT]: [OfferStatusEnum.ISSUED],
    [OfferStatusEnum.ISSUED]: [
        OfferStatusEnum.ACCEPTED,
        OfferStatusEnum.REJECTED,
        OfferStatusEnum.WITHDRAWN,
    ],
    [OfferStatusEnum.ACCEPTED]: [],   // Terminal
    [OfferStatusEnum.REJECTED]: [],   // Terminal
    [OfferStatusEnum.WITHDRAWN]: [],  // Terminal
};
```

### State Diagram
```
┌───────┐
│ DRAFT │ (editable, deletable)
└───┬───┘
    │
    │ issue
    ▼
┌────────┐
│ ISSUED │ (active, one per submission)
└───┬────┘
    │
    ├─► ACCEPTED (terminal, submission→hired)
    ├─► REJECTED (terminal, submission→interview)
    └─► WITHDRAWN (terminal, submission→interview)
```

### Business Rules
1. **Draft State**:
   - Only draft offers can be updated or deleted
   - Can transition to: issued

2. **Issued State**:
   - One active issued offer per submission maximum
   - Expiry date must be in the future
   - Can transition to: accepted, rejected, withdrawn

3. **Terminal States**:
   - No transitions allowed
   - Cannot be updated or deleted
   - Submission status synchronized:
     - accepted → submission becomes 'hired'
     - rejected/withdrawn → submission returns to 'interview'

---

## API Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/api/v1/offers` | `offers:create` | Create new offer (draft state) |
| GET | `/api/v1/offers` | `offers:read` | List all offers with pagination |
| GET | `/api/v1/offers/:id` | `offers:read` | Get single offer by ID |
| GET | `/api/v1/offers/submission/:submissionId` | `offers:read` | Get all offers for a submission |
| PATCH | `/api/v1/offers/:id` | `offers:update` | Update offer (draft only) |
| POST | `/api/v1/offers/:id/issue` | `offers:issue` | Issue offer (draft→issued) |
| POST | `/api/v1/offers/:id/accept` | `offers:accept` | Accept offer (issued→accepted) |
| POST | `/api/v1/offers/:id/reject` | `offers:reject` | Reject offer (issued→rejected) |
| POST | `/api/v1/offers/:id/withdraw` | `offers:withdraw` | Withdraw offer (issued→withdrawn) |
| DELETE | `/api/v1/offers/:id` | `offers:update` | Delete offer (draft only, soft) |
| GET | `/api/v1/offers/:id/status-history` | `offers:view_history` | Get offer status history |
| GET | `/api/v1/offers/stats/by-status` | `offers:read` | Get offer count by status |

---

## Services

### OfferService (10 Methods)
Primary business logic service for offer lifecycle management.

**Methods**:
1. `createOffer(data, companyId, createdById)` → Creates draft offer with versioning
2. `getOffer(id, companyId)` → Retrieves single offer with tenant isolation
3. `getOffersBySubmission(submissionId, companyId, page, limit)` → Lists offers for submission
4. `getAllOffers(companyId, page, limit)` → Lists all offers with pagination
5. `updateOffer(id, data, companyId, userId)` → Updates draft offer only
6. `issueOffer(id, companyId, userId, reason?)` → Transitions draft→issued
7. `acceptOffer(id, companyId, userId, metadata?)` → Transitions issued→accepted
8. `rejectOffer(id, companyId, userId, reason?, metadata?)` → Transitions issued→rejected
9. `withdrawOffer(id, companyId, userId, reason)` → Transitions issued→withdrawn
10. `deleteOffer(id, companyId)` → Soft-deletes draft offer only

**Key Validations**:
- Submission eligibility check (must be in 'interview' or 'offer' status)
- Active offer conflict detection (only one issued offer per submission)
- Expiry date validation (must be in future when issuing)
- Terminal state blocking (no updates/deletes allowed)
- Date range validation (expiry > start)

### OfferStatusService (State Machine)
Enforces state transition rules and provides status metadata.

**Methods**:
1. `validateTransition(from, to)` → Throws exception if transition invalid
2. `getAllowedTransitions(status)` → Returns array of valid next states
3. `isTerminal(status)` → Returns true for accepted/rejected/withdrawn
4. `canUpdate(status)` → Returns true only for draft
5. `getStatusDescription(status)` → Returns human-readable status text
6. `assertNotTerminal(status)` → Throws exception if status is terminal

---

## Repositories

### OfferRepository (11 Methods)
```typescript
create(data: Partial<Offer>): Promise<Offer>
findOne(id: string, companyId: string): Promise<Offer | null>
findBySubmission(submissionId, companyId, page, limit): Promise<{data, total, page, limit}>
findActiveBySubmission(submissionId, companyId): Promise<Offer | null>
findLatestBySubmission(submissionId, companyId): Promise<Offer | null>
countByStatus(companyId, status): Promise<number>
countAllStatuses(companyId): Promise<Record<string, number>>
getPaginated(companyId, page, limit): Promise<{data, total, page, limit}>
update(id: string, data: Partial<Offer>): Promise<Offer>
delete(id: string): Promise<void>  // Soft delete
getNextOfferVersion(submissionId, companyId): Promise<number>
```

### OfferStatusHistoryRepository (6 Methods)
```typescript
create(data): Promise<OfferStatusHistory>
findByOfferId(offerId, companyId): Promise<OfferStatusHistory[]>
findByOfferIdPaginated(offerId, companyId, page, limit): Promise<{data, total}>
getLatestStatusChange(offerId, companyId): Promise<OfferStatusHistory | null>
countReachedStatus(offerId, status): Promise<number>
getTransitionTimeline(offerId): Promise<OfferStatusHistory[]>
```

---

## DTOs

### CreateOfferDto
```typescript
{
    submission_id: string (required, UUID)
    employment_type: EmploymentTypeEnum (required)
    base_salary?: number (optional, ≥0)
    bonus?: number (optional, ≥0)
    equity?: string (optional)
    currency?: string (optional, default: 'USD')
    start_date?: string (optional, ISO date)
    expiry_date?: string (optional, ISO date)
    notes?: string (optional)
}
```

### UpdateOfferDto
All fields optional (partial update):
```typescript
{
    base_salary?: number
    bonus?: number
    equity?: string
    employment_type?: EmploymentTypeEnum
    currency?: string
    start_date?: string
    expiry_date?: string
    notes?: string
}
```

### IssueOfferDto
```typescript
{
    notes?: string (optional, reason for issuance)
}
```

### AcceptOfferDto
```typescript
{
    accepted_at?: string (optional, ISO datetime)
    metadata?: Record<string, any> (optional, additional data)
}
```

### RejectOfferDto
```typescript
{
    reason?: string (optional, rejection reason)
    metadata?: Record<string, any> (optional, additional data)
}
```

### WithdrawOfferDto
```typescript
{
    reason: string (required, withdrawal reason)
}
```

---

## Validation Rules

### Create/Update Validations
1. **Base Salary**: Must be ≥ 0 if provided
2. **Bonus**: Must be ≥ 0 if provided
3. **Date Range**: If both start_date and expiry_date provided, expiry > start
4. **Currency**: 3-character code (e.g., 'USD', 'EUR')
5. **Employment Type**: Must be valid enum value

### State Transition Validations
1. **Issue**:
   - Current status must be draft
   - Expiry date must be in future (if set)
   - No other issued offer exists for submission

2. **Accept**:
   - Current status must be issued
   - Offer not expired

3. **Reject/Withdraw**:
   - Current status must be issued

4. **Update/Delete**:
   - Current status must be draft

---

## Submission Status Synchronization

The Offers module automatically updates submission status based on offer transitions:

| Offer Transition | Submission Status Change |
|------------------|--------------------------|
| draft → issued | submission → 'offer' |
| issued → accepted | submission → 'hired' |
| issued → rejected | submission → 'interview' |
| issued → withdrawn | submission → 'interview' |

**Design Decision**: Rejected offers return submissions to 'interview' status (not 'rejected') to allow continued candidate consideration.

---

## Versioning Strategy

### Offer Version Calculation
```typescript
async getNextOfferVersion(submissionId: string, companyId: string): Promise<number> {
    const latest = await this.repository
        .createQueryBuilder('offer')
        .where('offer.submission_id = :submissionId', { submissionId })
        .andWhere('offer.company_id = :companyId', { companyId })
        .andWhere('offer.deleted_at IS NULL')
        .orderBy('offer.offer_version', 'DESC')
        .getOne();

    return latest ? latest.offer_version + 1 : 1;
}
```

**Usage**:
- Each submission maintains independent version sequence (1, 2, 3...)
- Version increments when creating new offer for same submission
- Deleted offers do not affect version counter
- Unique constraint: `(submission_id, offer_version)` prevents duplicates

---

## Testing Strategy

### Unit Tests (Services)
1. **OfferService**:
   - createOffer: version calculation, submission validation, active offer check
   - updateOffer: draft-only enforcement, date conversion
   - issueOffer: expiry validation, active offer conflict
   - acceptOffer: terminal state, submission sync to 'hired'
   - rejectOffer: submission sync to 'interview'
   - withdrawOffer: reason requirement
   - deleteOffer: draft-only enforcement

2. **OfferStatusService**:
   - validateTransition: all valid/invalid combinations
   - isTerminal: terminal state detection
   - canUpdate: draft-only detection

### Integration Tests (Controller)
1. Full lifecycle: create → issue → accept
2. Full lifecycle: create → issue → reject
3. Full lifecycle: create → issue → withdraw
4. Update restrictions: attempt update on non-draft
5. Delete restrictions: attempt delete on non-draft
6. Active offer conflict: issue second offer for same submission
7. Pagination: list offers with page/limit
8. Status history: verify audit trail completeness

### Database Tests (Repositories)
1. Version uniqueness: test unique constraint on (submission_id, offer_version)
2. Soft delete: verify deleted_at excludes from queries
3. Cascading deletes: company/submission deletion cascades
4. Index performance: query plans for status/submission lookups

---

## Performance Considerations

### Query Optimization
1. **Indexes Used**:
   - `idx_offers_company_status`: Fast status filtering
   - `idx_offers_company_submission`: Fast submission lookup
   - `idx_offers_submission_version`: Unique constraint + version lookup
   - `idx_offer_history_offer_company`: Fast history retrieval

2. **Pagination**:
   - All list endpoints use LIMIT/OFFSET
   - Default limit: 10 (configurable up to 100)
   - Index-supported ORDER BY created_at DESC

3. **Relations**:
   - Lazy loading by default
   - Eager load company/submission/created_by/updated_by only when needed

### Caching Strategy
1. **Status Counts**: Cache `countAllStatuses` result (5-minute TTL)
2. **Active Offer Check**: Cache per submission (invalidate on state change)
3. **Submission Eligibility**: Cache submission status (invalidate on submission update)

---

## Security Notes

### Authentication
- All endpoints require JWT authentication (JwtAuthGuard)
- Company ID extracted from JWT token (tenant isolation)
- User ID extracted from JWT token (audit trail)

### Authorization (RBAC)
- Permission checks via `@RequirePermissions` decorator
- Required permissions:
  - `offers:create`: Create draft offers
  - `offers:read`: View offers and statistics
  - `offers:update`: Update/delete draft offers
  - `offers:issue`: Issue offers to candidates
  - `offers:accept`: Accept offers (internal only for now)
  - `offers:reject`: Reject offers (internal only for now)
  - `offers:withdraw`: Withdraw offers
  - `offers:view_history`: View status history

### Data Isolation
- All queries filtered by `company_id` (multi-tenant enforcement)
- Foreign key constraints enforce referential integrity
- Soft delete prevents accidental data loss

### Audit Trail
- All state changes logged to `offer_status_history`
- Immutable history records (no updates/deletes)
- Metadata field stores additional context (JSON)

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run migrations: `npm run migration:run`
- [ ] Verify enum types created: `\dT+ offer_status_enum`
- [ ] Verify tables created: `\dt offers offer_status_history`
- [ ] Verify indexes created: `\di idx_offers_*`
- [ ] Run seeds (if applicable): `npm run seed`

### Post-Deployment
- [ ] Verify build: `npm run build` (0 errors)
- [ ] Run tests: `npm run test` (all passing)
- [ ] Test create endpoint: POST `/api/v1/offers`
- [ ] Test issue endpoint: POST `/api/v1/offers/:id/issue`
- [ ] Test status history: GET `/api/v1/offers/:id/status-history`
- [ ] Verify submission sync: Check submission status after offer transitions
- [ ] Monitor logs for errors

---

## Monitoring & Observability

### Key Metrics
1. **Offer Lifecycle**:
   - Offers created per day
   - Average time in draft state
   - Acceptance rate (accepted / issued)
   - Rejection rate (rejected / issued)
   - Withdrawal rate (withdrawn / issued)

2. **Performance**:
   - API response times (p50, p95, p99)
   - Database query duration
   - Active offer conflicts (should be rare)

3. **Errors**:
   - Invalid state transitions
   - Active offer conflicts
   - Submission sync failures

### Log Examples
```typescript
// Success
logger.info('Offer created', { offerId, submissionId, version });
logger.info('Offer issued', { offerId, submissionId });
logger.info('Offer accepted', { offerId, submissionId });

// Errors
logger.error('Active offer conflict', { submissionId, existingOfferId });
logger.error('Invalid state transition', { offerId, from, to });
logger.error('Submission sync failed', { offerId, submissionId, error });
```

---

## Future Enhancements

### Phase 20+ Considerations
1. **Candidate Authentication**: Add candidate-facing accept/reject endpoints
2. **Offer Templates**: Pre-configured offer templates for common roles
3. **Approval Workflows**: Multi-stage approval before issuing
4. **Offer Comparison**: Side-by-side comparison of multiple offer versions
5. **Email Integration**: Automatic email on offer issuance
6. **Document Generation**: PDF offer letter generation
7. **E-Signature Integration**: DocuSign/HelloSign for offer acceptance
8. **Salary Benchmarking**: Integration with salary data providers

---

## Related Documentation
- [PHASE_17_SUBMISSIONS_GUIDE.md](./PHASE_17_SUBMISSIONS_GUIDE.md) - Submission module integration
- [PHASE_18_INTERVIEWS_GUIDE.md](./PHASE_18_INTERVIEWS_GUIDE.md) - Interview module integration
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete database schema
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - All API endpoints
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview

---

## Support

For questions or issues with the Offers module:
1. Check this guide first
2. Review error logs in CloudWatch/console
3. Check database constraints: `\d offers`
4. Verify permissions: `SELECT * FROM role_permissions WHERE permission LIKE 'offers:%'`
5. Test state machine: Use status service methods directly

---

**Document Version**: 1.0  
**Last Reviewed**: 2025-01-08  
**Approved By**: Phase 19 Implementation  
**Status**: Production-Ready ✅
