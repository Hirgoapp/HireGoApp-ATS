# Offer Module Implementation Guide

## Overview

The Offer module manages employment offers in the ATS platform. It handles the complete offer lifecycle from creation (draft) through acceptance/rejection, with support for offer revisions and comprehensive audit logging.

**Key Capabilities**:
- Create and manage offer documents
- Support for offer revisions/versioning
- Multi-status workflow (draft → sent → accepted/rejected)
- Detailed salary breakup and compensation tracking
- Expiration management
- Comprehensive audit logging
- Tenant isolation and RBAC enforcement

---

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│         HTTP Requests (REST API)                    │
└─────────────────────────────────┬───────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────┐
│  OfferController (12 endpoints)                     │
│  - Guards: TenantGuard, RoleGuard                  │
│  - Decorators: @CompanyId(), @UserId()             │
└─────────────────────────────────┬───────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────┐
│  OfferService (18 methods)                          │
│  - Business logic & validations                    │
│  - Status transitions                              │
│  - AuditService integration                        │
└─────────────────────────────────┬───────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────┐
│  OfferRepository (17 methods)                       │
│  - Data access abstraction                         │
│  - Company-scoped queries                          │
│  - Advanced filtering & pagination                 │
└─────────────────────────────────┬───────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────┐
│  Database Layer (TypeORM)                           │
│  - offers table (23 columns)                        │
│  - 6 performance indices                           │
└─────────────────────────────────────────────────────┘
```

### Module Composition

**Components**:
1. **Entity** (`offer.entity.ts`): Data model with TypeORM decorators
2. **Repository** (`offer.repository.ts`): Data access layer with 17 methods
3. **Service** (`offer.service.ts`): Business logic layer with 18 methods
4. **Controller** (`offer.controller.ts`): HTTP endpoint handling
5. **DTOs** (`dtos/`): Request/response validation and transformation

---

## Database Schema

### Offers Table (23 columns)

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| **id** | UUID | PK | Unique offer identifier |
| **company_id** | UUID | FK, Index | Tenant isolation, company reference |
| **submission_id** | UUID | FK, Index | Link to candidate-job submission |
| **current_version** | INT | Default: 1 | Tracks offer revision number |
| **status** | ENUM | Not null | Current offer status (6 values) |
| **ctc** | DECIMAL(12,2) | Not null | Annual cost to company |
| **breakup** | JSONB | Not null | Salary component breakdown |
| **designation** | VARCHAR(255) | Not null | Job title offered |
| **joining_date** | DATE | Not null | Expected joining date |
| **department** | VARCHAR(255) | Nullable | Department/team |
| **reporting_manager** | VARCHAR(255) | Nullable | Manager name |
| **location** | VARCHAR(255) | Nullable | Work location |
| **terms_and_conditions** | TEXT | Nullable | T&C details |
| **rejection_reason** | TEXT | Nullable | Reason for rejection/withdrawal |
| **internal_notes** | TEXT | Nullable | Internal remarks (includes revision history) |
| **sent_at** | TIMESTAMP | Nullable | When offer was sent |
| **expires_at** | TIMESTAMP | Nullable | Offer expiration date |
| **accepted_at** | TIMESTAMP | Nullable | When offer was accepted |
| **closed_at** | TIMESTAMP | Nullable | When offer was finalized |
| **created_by_id** | UUID | Not null | Creator user ID |
| **updated_by_id** | UUID | Nullable | Last updater user ID |
| **created_at** | TIMESTAMP | Default: NOW | Creation timestamp |
| **updated_at** | TIMESTAMP | Default: NOW | Last update timestamp |
| **deleted_at** | TIMESTAMP | Nullable | Soft delete timestamp |

### Indices (6 total)

1. **IDX_offers_company_id** (`company_id`)
   - Used for tenant isolation, company-wide queries
   
2. **IDX_offers_company_submission** (`company_id`, `submission_id`)
   - Fast lookup of offers for specific submissions
   
3. **IDX_offers_company_status** (`company_id`, `status`)
   - Filter offers by status (pending, accepted, etc.)
   
4. **IDX_offers_company_version** (`company_id`, `current_version`)
   - Track and filter by offer versions
   
5. **IDX_offers_company_created** (`company_id`, `created_at`)
   - Timeline and historical queries
   
6. **IDX_offers_deleted_at** (`deleted_at`)
   - Soft delete filtering for all queries

### Enums

**OfferStatus** (6 values):
- `DRAFT`: Initial state, being prepared
- `SENT`: Offer sent to candidate
- `ACCEPTED`: Candidate accepted
- `REJECTED`: Candidate rejected
- `WITHDRAWN`: Offer withdrawn by company
- `EXPIRED`: Offer acceptance deadline passed

---

## Entity Definition

### Offer Entity (23 fields)

```typescript
@Entity('offers')
export class Offer {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  companyId: string;

  @Column('uuid')
  submissionId: string;

  @Column('int', { default: 1 })
  currentVersion: number;

  @Column('enum', { enum: OfferStatus })
  status: OfferStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  ctc: number;

  @Column('json')
  breakup: OfferBreakup;

  // ... additional columns
}
```

### OfferBreakup Interface

```typescript
interface OfferBreakup {
  baseSalary: number;
  dearness?: number;
  houseRent?: number;
  specialAllowance?: number;
  bonus?: number;
  stockOptions?: number;
  signingBonus?: number;
  performanceBonus?: number;
  otherBenefits?: number;
  totalCTC?: number;
}
```

---

## API Endpoints

### 1. Create Offer (Draft)
**POST** `/api/v1/offers`
- Permission: `offers:create`
- Creates new offer in DRAFT status
- Returns: `GetOfferDto`
- Status Code: `201 Created`

Request:
```json
{
  "submissionId": "uuid",
  "ctc": 1200000,
  "breakup": {
    "baseSalary": 800000,
    "dearness": 60000,
    "houseRent": 200000,
    "specialAllowance": 80000,
    "bonus": 60000,
    "totalCTC": 1200000
  },
  "designation": "Product Manager",
  "joiningDate": "2025-04-01",
  "department": "Product",
  "reportingManager": "Sarah Johnson",
  "location": "Mumbai",
  "expiresAt": "2025-02-05"
}
```

### 2. List Offers
**GET** `/api/v1/offers`
- Permission: `offers:read`
- Query Parameters:
  - `status`: Filter by status
  - `designation`: Search by designation (ILIKE)
  - `submissionId`: Filter by submission
  - `skip`: Pagination offset (default: 0)
  - `take`: Records per page (default: 20)
  - `sortBy`: Sort column (createdAt|updatedAt|joiningDate)
  - `sortOrder`: ASC or DESC
- Returns: `{ data: GetOfferDto[], total: number }`

### 3. Get Single Offer
**GET** `/api/v1/offers/:id`
- Permission: `offers:read`
- Returns: `GetOfferDto`

### 4. Update Offer (Draft Only)
**PUT** `/api/v1/offers/:id`
- Permission: `offers:update`
- Only allows updates to DRAFT offers
- Partial update supported
- Returns: `GetOfferDto`

### 5. Send Offer
**PUT** `/api/v1/offers/:id/send`
- Permission: `offers:update`
- Transitions: DRAFT → SENT
- Sets `sentAt` timestamp
- Returns: `GetOfferDto`

### 6. Accept Offer
**PUT** `/api/v1/offers/:id/accept`
- Permission: `offers:update`
- Transitions: SENT → ACCEPTED
- Sets `acceptedAt` timestamp
- Validates offer not expired
- Returns: `GetOfferDto`

### 7. Reject Offer
**PUT** `/api/v1/offers/:id/reject`
- Permission: `offers:update`
- Transitions: DRAFT/SENT → REJECTED
- Optional rejection reason
- Sets `closedAt` timestamp
- Returns: `GetOfferDto`

Request:
```json
{
  "reason": "Candidate declined due to salary expectation mismatch"
}
```

### 8. Withdraw Offer
**PUT** `/api/v1/offers/:id/withdraw`
- Permission: `offers:update`
- Transitions: DRAFT/SENT → WITHDRAWN
- Optional withdrawal reason
- Sets `closedAt` timestamp
- Returns: `GetOfferDto`

### 9. Create Revision
**POST** `/api/v1/offers/:id/revisions`
- Permission: `offers:update`
- Creates new version with incremented `currentVersion`
- Only for DRAFT/SENT offers
- New revision starts as DRAFT
- Returns: `GetOfferDto` (new version)

Request:
```json
{
  "revisionReason": "Increased salary based on candidate negotiation",
  "ctc": 1300000,
  "breakup": { ... }
}
```

### 10. Get Offer Versions
**GET** `/api/v1/offers/submission/:submissionId/versions`
- Permission: `offers:read`
- Returns all versions for a submission
- Returns: `GetOfferDto[]` (ordered by version DESC)

### 11. Get Pending Offers
**GET** `/api/v1/offers/status/pending`
- Permission: `offers:read`
- Filters: DRAFT or SENT status
- Pagination supported
- Returns: `{ data: GetOfferDto[], total: number }`

### 12. Get Expiring Offers
**GET** `/api/v1/offers/status/expiring`
- Permission: `offers:read`
- Query: `days` (default: 7)
- Returns offers expiring within N days
- Returns: `GetOfferDto[]`

### 13. Get Status Distribution
**GET** `/api/v1/offers/stats/distribution`
- Permission: `offers:read`
- Returns count by status
- Returns: `{ draft: 5, sent: 3, accepted: 10, ... }`

### 14. Get Total Count
**GET** `/api/v1/offers/stats/count`
- Permission: `offers:read`
- Returns: `number`

### 15. Get Average CTC
**GET** `/api/v1/offers/stats/average-ctc`
- Permission: `offers:read`
- Returns: `number`

### 16. Delete Offer (Soft Delete)
**DELETE** `/api/v1/offers/:id`
- Permission: `offers:delete`
- Status Code: `204 No Content`
- Sets `deletedAt` timestamp
- Returns: `void`

---

## Service Methods

### Creation & Retrieval (6 methods)

1. **createOffer** (companyId, userId, dto)
   - Creates offer in DRAFT status
   - Prevents duplicate offers per submission
   - Logs to AuditService
   - Returns: GetOfferDto

2. **getOffer** (companyId, offerId)
   - Retrieves single offer
   - Throws NotFoundException if not found
   - Returns: GetOfferDto

3. **getOffers** (companyId, options)
   - Lists all offers with advanced filtering
   - Supports pagination and sorting
   - Returns: { data: [], total: number }

4. **getOfferVersions** (companyId, submissionId)
   - Gets all versions for a submission
   - Ordered by version descending
   - Returns: GetOfferDto[]

5. **getPendingOffers** (companyId, skip, take)
   - Gets DRAFT or SENT offers
   - Pagination supported
   - Returns: { data: [], total: number }

6. **getOffersBySubmissions** (companyId, submissionIds)
   - Bulk fetch offers by submissions
   - Returns: Map<submissionId, GetOfferDto>

### Status Transitions (5 methods)

7. **sendOffer** (companyId, offerId, userId)
   - DRAFT → SENT
   - Sets sentAt timestamp
   - Logs to AuditService
   - Returns: GetOfferDto

8. **acceptOffer** (companyId, offerId, userId)
   - SENT → ACCEPTED
   - Validates not expired
   - Sets acceptedAt timestamp
   - Logs to AuditService
   - Returns: GetOfferDto

9. **rejectOffer** (companyId, offerId, userId, reason)
   - DRAFT/SENT → REJECTED
   - Sets closedAt timestamp
   - Stores rejection reason
   - Logs to AuditService
   - Returns: GetOfferDto

10. **withdrawOffer** (companyId, offerId, userId, reason)
    - DRAFT/SENT → WITHDRAWN
    - Sets closedAt timestamp
    - Stores withdrawal reason
    - Logs to AuditService
    - Returns: GetOfferDto

11. **createRevision** (companyId, offerId, userId, dto)
    - Creates new version
    - Increments currentVersion
    - New revision starts as DRAFT
    - Only for DRAFT/SENT offers
    - Logs to AuditService
    - Returns: GetOfferDto

### Updates & Deletion (3 methods)

12. **updateOffer** (companyId, offerId, userId, dto)
    - Updates offer details
    - Only for DRAFT offers
    - Supports partial update
    - Logs to AuditService
    - Returns: GetOfferDto

13. **deleteOffer** (companyId, offerId, userId)
    - Soft delete (sets deletedAt)
    - Logs to AuditService
    - Returns: void

14. **getExpiringOffers** (companyId, daysFrom)
    - Gets offers expiring within N days
    - Filters: SENT status only
    - Returns: GetOfferDto[]

### Analytics (4 methods)

15. **getCount** (companyId)
    - Total offer count
    - Returns: number

16. **getCountByStatus** (companyId, status)
    - Count by specific status
    - Returns: number

17. **getStatusDistribution** (companyId)
    - Distribution across all statuses
    - Returns: Record<status, count>

18. **getAverageCTC** (companyId)
    - Average CTC across all offers
    - Returns: number

---

## Repository Methods

### Query Methods (11 methods)

1. **create** (offer): Partial<Offer> → Offer
2. **findById** (companyId, offerId) → Offer | null
3. **findBySubmission** (companyId, submissionId) → Offer | null (latest version)
4. **findAllVersionsBySubmission** (companyId, submissionId) → Offer[]
5. **findByStatus** (companyId, status, skip, take) → [Offer[], count]
6. **findByCompany** (companyId, options) → [Offer[], count] (advanced filtering)
7. **findPending** (companyId, skip, take) → [Offer[], count] (DRAFT or SENT)
8. **findExpiringOffers** (companyId, daysFrom) → Offer[]
9. **findAccepted** (companyId, skip, take) → [Offer[], count]
10. **findByJoiningDateRange** (companyId, fromDate, toDate, skip, take) → [Offer[], count]

### Update/Delete Methods (2 methods)

11. **update** (companyId, offerId, data: Partial<Offer>) → Offer | null
12. **softDelete** (companyId, offerId) → void

### Analytics Methods (4 methods)

13. **countByCompany** (companyId) → number
14. **countByStatus** (companyId, status) → number
15. **getStatusDistribution** (companyId) → Record<status, count>
16. **getAverageCTC** (companyId) → number
17. **getOffersCreatedByMonth** (companyId, months) → Record

---

## DTOs

### CreateOfferDto (9 fields)
```typescript
{
  submissionId: string (UUID);
  ctc: number (≥0);
  breakup: OfferBreakup;
  designation: string;
  joiningDate: Date;
  department?: string;
  reportingManager?: string;
  location?: string;
  termsAndConditions?: string;
  internalNotes?: string;
  expiresAt?: Date;
}
```

### UpdateOfferDto (extends PartialType)
All fields optional for partial updates.

### CreateRevisionDto (partial fields)
```typescript
{
  revisionReason?: string;
  ctc?: number;
  breakup?: OfferBreakup;
  designation?: string;
  joiningDate?: string;
  department?: string;
  reportingManager?: string;
  location?: string;
  termsAndConditions?: string;
  expiresAt?: string;
}
```

### GetOfferDto (response DTO)
All offer fields + timestamps, for response formatting.

---

## Integration Points

### 1. Tenant Guard
- Extracts `company_id` from JWT
- Ensures company-scoped access
- Applied globally to all endpoints

### 2. Role Guard
- Checks user permissions
- Validates `offers:create`, `offers:read`, `offers:update`, `offers:delete`
- Permission decorators on each endpoint

### 3. Audit Service
**Logged Actions**:
- `OFFER_CREATED`: New offer created
- `OFFER_SENT`: Offer sent to candidate
- `OFFER_ACCEPTED`: Candidate accepted
- `OFFER_REJECTED`: Offer rejected
- `OFFER_WITHDRAWN`: Offer withdrawn
- `OFFER_REVISED`: New version created
- `OFFER_UPDATED`: Offer details updated
- `OFFER_DELETED`: Offer deleted

**Logged Data**: All field changes, timestamps, user IDs

### 4. Submission Integration
- Offers link to submissions (submission_id foreign key)
- When offer ACCEPTED → update Submission status to "offered"
- Future: Integration with onboarding (offer → joined)

---

## Key Features

### 1. Multi-Tenant Isolation
- All queries filtered by `company_id`
- Company-scoped indices for performance
- No cross-tenant data access possible

### 2. Offer Versioning
- Supports multiple revisions per submission
- Each revision tracked with version number
- Revision history stored in internal_notes
- Old versions preserved for audit trail

### 3. Status Workflow
- Clear state transitions (DRAFT → SENT → ACCEPTED)
- Prevents invalid state changes
- Tracks state change timestamps

### 4. Salary Breakup
- JSON-based flexible structure
- Supports various compensation components
- Base salary, allowances, bonuses, stock options
- Total CTC calculation

### 5. Expiration Management
- Offers can have expiration dates
- Automatic expiry validation on acceptance
- Can query expiring offers (within N days)

### 6. Soft Deletes
- `deleted_at` column for preservation
- All queries filter deleted offers
- Historical audit trail preserved

### 7. Audit Logging
- All operations logged via AuditService
- Action type recorded
- User ID and timestamp captured
- Field changes tracked

### 8. Advanced Filtering
- Filter by status, designation, submission
- Pagination support (skip/take)
- Multiple sort options (created, updated, joining date)
- ILIKE search for designations

---

## Workflows

### Workflow 1: Create & Send Offer

```
1. HR Manager creates draft offer
   POST /offers → DRAFT status
   
2. Reviews offer internally
   PUT /offers/:id → Update details
   
3. Sends to candidate
   PUT /offers/:id/send → SENT status
   
4. Candidate receives notification
   (External: email/candidate portal)
   
5. Candidate accepts or rejects
   PUT /offers/:id/accept → ACCEPTED
   or
   PUT /offers/:id/reject → REJECTED
```

**Audit Trail**:
- OFFER_CREATED: Initial creation
- OFFER_UPDATED: Any details changed
- OFFER_SENT: Sent to candidate
- OFFER_ACCEPTED: Candidate accepted

### Workflow 2: Revise Offer

```
1. Initial offer sent but candidate negotiates
   Initial: DRAFT → SENT
   
2. Company increases salary and revises
   POST /offers/:id/revisions → New version (DRAFT)
   
3. Review revised offer
   PUT /offers/:id → Update in new version
   
4. Send revised offer
   PUT /offers/:id/send → SENT
   
5. Candidate accepts revised offer
   PUT /offers/:id/accept → ACCEPTED
```

**Audit Trail**:
- OFFER_CREATED: Initial creation
- OFFER_SENT: Initial version sent
- OFFER_REVISED: New version created
- OFFER_UPDATED: Revisions to new version
- OFFER_SENT: Revised version sent
- OFFER_ACCEPTED: Final acceptance

### Workflow 3: Reject/Withdraw

```
Option A: Candidate Rejects
1. Offer sent: SENT status
2. Candidate rejects
   PUT /offers/:id/reject → REJECTED
   
Option B: Company Withdraws
1. Offer sent or draft: DRAFT/SENT status
2. Company withdraws (business need change)
   PUT /offers/:id/withdraw → WITHDRAWN
```

**Audit Trail**:
- Action type recorded
- Reason stored in rejectionReason
- Timestamp captured in closedAt

---

## Error Handling

### BadRequestException
- Creating duplicate offer for same submission
- Status transition violations
- Updating non-draft offers
- Accepting expired offers
- Invalid revisions

### NotFoundException
- Offer not found
- Submission not found
- Update/delete of non-existent offer

### Status Code Responses
| Status | Scenario |
|--------|----------|
| 201 | Offer created successfully |
| 200 | GET/PUT successful |
| 204 | DELETE successful (no content) |
| 400 | Bad request (validation, state violation) |
| 404 | Resource not found |
| 401 | Unauthorized |
| 403 | Forbidden (RBAC) |
| 500 | Server error |

---

## Testing Considerations

### Unit Tests
- Service method validation
- Status transition logic
- Score validation (if added)
- Date expiry checks

### Integration Tests
- Create offer flow (create → send → accept)
- Revision workflow
- Rejection/withdrawal paths
- Filtering and pagination
- Audit logging verification

### Test Data
- 10 seed offers covering all statuses
- Multiple versions for some submissions
- Expiring offers for deadline testing
- Salary breakup variety

---

## Related Modules

- **Submission Module**: Offers link to submissions
- **Candidate Module**: Candidates referenced through submissions
- **Job Module**: Jobs referenced through submissions
- **Interview Module**: Interviews precede offers
- **RBAC Module**: Permission enforcement
- **Audit Module**: Logging and compliance

---

## Future Enhancements

1. **Offer Templates**: Reusable templates for common roles
2. **E-Signature**: Digital offer signing
3. **Notifications**: Email/SMS to candidates
4. **Offer Customization**: Company branding in offers
5. **Offer History**: Track all offer changes visually
6. **Batch Operations**: Create offers for multiple submissions
7. **Offer Analytics**: Dashboard with KPIs
8. **Integration**: Auto-update Submission status
9. **Document Generation**: PDF offer letters
10. **Candidate Portal**: Self-service offer acceptance

---

## Database Statistics

| Metric | Value |
|--------|-------|
| Table Name | offers |
| Total Columns | 23 |
| Primary Key | id (UUID) |
| Foreign Keys | submission_id (implicit) |
| Indices | 6 |
| Enum Values | 6 (OfferStatus) |
| Soft Delete | Yes (deleted_at) |

---

## Performance Considerations

### Query Optimization
- 6 strategic indices on frequently queried columns
- Company-scoped indices prevent full table scans
- Pagination enforced (default 20 per page)
- Soft delete index for faster filtering

### Scalability
- Partition by company_id for large datasets
- Archive old offers (deleted_at > N months)
- Materialized views for analytics
- Read replicas for reporting queries

---

## Security & Compliance

### Multi-Tenant Isolation
✅ Company_id scoped queries
✅ No cross-tenant data leakage
✅ Indices prevent bypass

### RBAC Enforcement
✅ 4 permission levels (create, read, update, delete)
✅ Decorators on all endpoints
✅ Role-based access control

### Audit Trail
✅ All changes logged
✅ User attribution (createdById, updatedById)
✅ Timestamps preserved
✅ Soft deletes maintain history

### Data Privacy
✅ Sensitive data (salary) in single field
✅ No plain text storage
✅ JSON structure for future encryption

---

## Deployment Checklist

- [ ] Run migration: `1701000003000-CreateOffersTable`
- [ ] Verify indices created: 6 indices on offers table
- [ ] Load seed data: 10 test offers
- [ ] Test endpoints with test data
- [ ] Verify RBAC permissions assigned
- [ ] Check audit logging working
- [ ] Performance test pagination
- [ ] Monitor database query performance
- [ ] Document any customizations
- [ ] Train support team

---

**Last Updated**: December 2025  
**Version**: 1.0  
**Status**: Production Ready
