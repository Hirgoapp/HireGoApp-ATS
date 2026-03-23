# Phase 19: Offers Module - Design Specification

**Status: DESIGN-FIRST (Awaiting Approval)**  
**Date: January 8, 2026**  
**Scope: Design Only - No Implementation**

---

## Executive Summary

The **Offers Module** manages formal job offers made to candidates for specific submissions. Each offer is submission-bound, follows an immutable state machine, maintains complete audit trails, and syncs submission status on key transitions.

**Core Principle (Non-Negotiable)**: Offers belong to submissions, not directly to candidates or jobs.

---

## 1. Module Purpose

### Functional Goal
Provide a structured offer lifecycle from draft creation through acceptance/rejection, ensuring:
- Single active offer per submission
- Immutable state transitions
- Complete auditability
- Submission status synchronization

### Key Invariants
- ✓ One offer per submission (multiple revisions allowed, but only one active)
- ✓ Offer always created in `draft` state
- ✓ Status changes are terminal-respecting and logged
- ✓ Only draft offers can be edited
- ✓ Acceptance/rejection triggers submission status changes
- ✓ Tenant isolation at every boundary

### Non-Functional Requirements
- Performance: Sub-100ms queries for list/get
- Audit: 100% immutable history
- Security: RBAC per endpoint, tenant scoped
- Scalability: Support 10k+ offers per company

---

## 2. Core Business Rules

### 2.1 Ownership & Context

**Every offer must belong to:**
- `company_id` (UUID) — tenant isolation
- `submission_id` (UUID) — hiring context
- `created_by_id` (INTEGER) — audit trail

**Submission Binding Rules:**
- Offer cannot exist without valid, non-deleted submission
- Submission lifecycle affects offer eligibility
- Offer state changes trigger submission state changes

### 2.2 Offer Multiplicity

**Per Submission:**
- Multiple offers allowed (revisions, counter-offers)
- Only **one active offer** at a time (draft or issued)
- Previous offers archived (soft delete or marked superseded)
- Latest offer is the canonical one

**Active Offer Definition:**
- Status ∈ {draft, issued}
- deleted_at IS NULL
- Highest offer_version for submission

### 2.3 Offer Validity

**Creation Rules:**
- Submission must exist and belong to company
- Submission must NOT be in terminal state (hired, rejected, withdrawn)
- Submission must be past interview stage (status ≥ interview)

**Update Rules:**
- Only draft offers can be edited
- Issued/accepted/rejected/withdrawn offers are immutable
- Re-issuing requires new offer (new version)

### 2.4 Candidate Action Rules

**Accept Offer:**
- Offer status must be `issued`
- Offer must not be expired
- Submission status automatically moves to `hired`

**Reject Offer:**
- Offer status must be `issued`
- Submission status returns to previous stage (e.g., interview or screening)

**Recruiter Withdraw:**
- Offer status must be issued (cannot withdraw draft)
- Submission returns to interview stage

---

## 3. Offer Lifecycle

### 3.1 State Machine (Immutable)

```
┌─────────────────────────────────────────────────────┐
│                  OFFER LIFECYCLE                     │
└─────────────────────────────────────────────────────┘

    ┌────────┐
    │ DRAFT  │ (created by recruiter)
    └───┬────┘
        │
        ↓ (issued by recruiter/hiring manager)
    ┌────────┐
    │ ISSUED │ (active, waiting for candidate)
    └───┬────┘
        │
        ├─ → ACCEPTED (terminal) ✓ candidate signs
        │
        ├─ → REJECTED (terminal) ✗ candidate declines
        │
        └─ → WITHDRAWN (terminal) ✗ recruiter cancels

 Terminal States: ACCEPTED, REJECTED, WITHDRAWN
 No backward transitions allowed
 No state skipping allowed
```

### 3.2 Transition Rules

| From | To | Trigger | Condition | Submission Impact |
|------|-----|---------|-----------|------------------|
| DRAFT | ISSUED | Recruiter/HM issues | Offer valid | Offer stage |
| ISSUED | ACCEPTED | Candidate accepts | Not expired | Hired |
| ISSUED | REJECTED | Candidate rejects | None | Return to interview |
| ISSUED | WITHDRAWN | Recruiter withdraws | None | Return to interview |
| DRAFT | (DELETE) | Recruiter deletes | Via soft delete | Offer removed |

### 3.3 Terminal State Behavior

**Terminal States**: ACCEPTED, REJECTED, WITHDRAWN

**Hard Blocking Rules:**
- No transitions FROM terminal states
- No edits after terminal state reached
- No status changes allowed
- Only audit/read operations permitted

**Permanent Implications:**
- Submission locked to final outcome
- Cannot create new offer until submission is reset (admin only)

---

## 4. Data Model

### 4.1 offers Table

**Table**: `offers`

**Required Columns:**

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| id | UUID | PK | Unique offer ID |
| company_id | UUID | NOT NULL, FK→companies | Tenant isolation |
| submission_id | UUID | NOT NULL, FK→submissions | Hiring context |
| status | offer_status_enum | NOT NULL, DEFAULT 'draft' | State machine |
| offer_version | INTEGER | NOT NULL, DEFAULT 1 | Revision tracking |
| currency | VARCHAR(3) | DEFAULT 'USD' | ISO 4217 code |
| base_salary | DECIMAL(15,2) | Nullable | Annual/monthly base |
| bonus | DECIMAL(15,2) | Nullable | Annual bonus |
| equity | VARCHAR(100) | Nullable | Equity grant (e.g., "0.5%") |
| employment_type | employment_type_enum | NOT NULL | Full-time, contract, intern |
| start_date | DATE | Nullable | Offer start date |
| expiry_date | DATE | Nullable | Offer expiration date |
| notes | TEXT | Nullable | Internal notes, conditions |
| created_by_id | INTEGER | NOT NULL, FK→users | Audit |
| updated_by_id | INTEGER | Nullable, FK→users | Audit |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Audit |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Audit |
| deleted_at | TIMESTAMPTZ | Nullable | Soft delete |

**Indexes:**
- PK: id
- UK: (submission_id, offer_version) — one version per submission
- IDX: (company_id, status) — fast filtering
- IDX: (company_id, submission_id) — submission lookup
- IDX: (company_id, deleted_at) — soft delete filtering
- IDX: (created_by_id) — offers by creator

**Foreign Keys:**
- company_id → companies(id) ON DELETE CASCADE
- submission_id → submissions(id) ON DELETE CASCADE
- created_by_id → users(id) ON DELETE SET NULL
- updated_by_id → users(id) ON DELETE SET NULL

**Enums:**

```sql
CREATE TYPE offer_status_enum AS ENUM (
    'draft',
    'issued',
    'accepted',
    'rejected',
    'withdrawn'
);

CREATE TYPE employment_type_enum AS ENUM (
    'full_time',
    'contract',
    'intern',
    'part_time'
);
```

### 4.2 offer_status_history Table (Audit)

**Table**: `offer_status_history`

**Purpose**: Immutable audit trail of all status transitions

**Columns:**

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| id | UUID | PK | Unique history entry |
| company_id | UUID | NOT NULL, FK→companies | Tenant isolation |
| offer_id | UUID | NOT NULL, FK→offers | Offer reference |
| old_status | offer_status_enum | NOT NULL | Previous state |
| new_status | offer_status_enum | NOT NULL | New state |
| changed_by_id | INTEGER | NOT NULL, FK→users | Who changed |
| changed_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When changed |
| reason | TEXT | Nullable | Why changed (cancellation note, etc.) |
| metadata | JSONB | Nullable, DEFAULT '{}' | Extra context (IP, device, etc.) |

**Indexes:**
- PK: id
- FK: (offer_id, company_id) — offer lookup
- IDX: (company_id, changed_at DESC) — recent changes
- IDX: (offer_id, changed_at ASC) — offer history timeline

**Foreign Keys:**
- company_id → companies(id) ON DELETE CASCADE
- offer_id → offers(id) ON DELETE CASCADE
- changed_by_id → users(id) ON DELETE SET NULL

**Properties:**
- Immutable (INSERT only, no UPDATE)
- Every status change logged
- Reason captured for rejections/withdrawals
- Metadata supports future extensions (e.g., candidate acceptance timestamp)

---

## 5. Permissions Matrix

### 5.1 Explicit Permissions

| Permission | Description | Typical Role |
|-----------|-------------|--------------|
| `offers:create` | Create draft offer | Recruiter, Hiring Manager |
| `offers:read` | View offers | All recruiting roles |
| `offers:update` | Edit draft offer | Recruiter |
| `offers:issue` | Issue offer to candidate | Recruiter, Hiring Manager |
| `offers:withdraw` | Withdraw issued offer | Recruiter, Hiring Manager |
| `offers:accept` | Accept offer (candidate) | Candidate (via system) |
| `offers:reject` | Reject offer (candidate) | Candidate (via system) |
| `offers:view_history` | View audit trail | Recruiter, Hiring Manager, Viewer |

### 5.2 Role Mapping

**Super Admin:**
- All permissions (plus cross-tenant read)
- Can override terminal states (admin only)

**Hiring Manager:**
- offers:read, offers:issue, offers:withdraw, offers:view_history
- Cannot create or edit drafts

**Recruiter:**
- offers:create, offers:read, offers:update, offers:issue, offers:withdraw, offers:view_history
- Full offer lifecycle control

**Viewer (Read-Only):**
- offers:read, offers:view_history
- No state changes

**Candidate (Implicit System Role):**
- offers:accept, offers:reject
- Triggered via external API or UI

---

## 6. API Endpoints (Design Only)

### 6.1 Offer Management

#### Create Offer (Draft)
```
POST /api/v1/offers
Authorization: Bearer <JWT>
Permissions: offers:create

Request:
{
  "submission_id": "uuid",
  "currency": "USD",
  "base_salary": 150000,
  "bonus": 20000,
  "equity": "0.5%",
  "employment_type": "full_time",
  "start_date": "2026-03-01",
  "expiry_date": "2026-02-15",
  "notes": "Flexible on salary based on negotiation"
}

Response (201):
{
  "id": "uuid",
  "company_id": "uuid",
  "submission_id": "uuid",
  "status": "draft",
  "offer_version": 1,
  "currency": "USD",
  "base_salary": 150000,
  "bonus": 20000,
  "equity": "0.5%",
  "employment_type": "full_time",
  "start_date": "2026-03-01",
  "expiry_date": "2026-02-15",
  "notes": "...",
  "created_by_id": 123,
  "created_at": "2026-01-08T12:00:00Z",
  "updated_at": "2026-01-08T12:00:00Z"
}

Error Cases:
- 400: Submission not found or terminal
- 400: Submission not ready for offer
- 409: Active offer exists (return existing)
- 403: Permission denied
```

#### Get Offer by ID
```
GET /api/v1/offers/:id
Authorization: Bearer <JWT>
Permissions: offers:read

Response (200):
{ ...offer object... }

Error Cases:
- 404: Offer not found
- 403: Tenant mismatch
```

#### List Offers by Submission
```
GET /api/v1/offers?submission_id=uuid&page=1&limit=20
Authorization: Bearer <JWT>
Permissions: offers:read

Query Params:
- submission_id: UUID (required filter)
- page: number (default 1)
- limit: number (default 20)
- include_deleted: boolean (default false)

Response (200):
{
  "data": [
    { ...offer objects... }
  ],
  "total": 3,
  "page": 1,
  "limit": 20
}

Error Cases:
- 400: submission_id missing
- 404: Submission not found
```

#### Update Offer (Draft Only)
```
PATCH /api/v1/offers/:id
Authorization: Bearer <JWT>
Permissions: offers:update

Request:
{
  "base_salary": 160000,
  "notes": "Updated based on discussion"
}

Response (200):
{ ...updated offer object... }

Error Cases:
- 404: Offer not found
- 400: Offer not in draft status
- 400: Invalid field updates
- 403: Permission denied
```

#### Issue Offer
```
POST /api/v1/offers/:id/issue
Authorization: Bearer <JWT>
Permissions: offers:issue

Request:
{
  "notes": "Offer issued and sent to candidate"
}

Response (200):
{ ...offer with status=issued... }

Error Cases:
- 404: Offer not found
- 400: Offer not in draft status
- 409: Another active offer exists
- 400: Expiry date in past
- 403: Permission denied
```

#### Withdraw Offer
```
POST /api/v1/offers/:id/withdraw
Authorization: Bearer <JWT>
Permissions: offers:withdraw

Request:
{
  "reason": "Position no longer available"
}

Response (200):
{ ...offer with status=withdrawn... }

Error Cases:
- 404: Offer not found
- 400: Offer not in issued status
- 403: Permission denied
```

#### Delete Offer (Draft Only)
```
DELETE /api/v1/offers/:id
Authorization: Bearer <JWT>
Permissions: offers:update

Response (204): No content

Error Cases:
- 404: Offer not found
- 400: Offer not in draft status
- 403: Permission denied
```

### 6.2 Candidate Actions

#### Accept Offer
```
POST /api/v1/offers/:id/accept
Authorization: Bearer <JWT>
Permissions: offers:accept

Request:
{
  "accepted_at": "2026-01-08T15:30:00Z",  // optional, system can infer
  "metadata": { "acceptance_source": "web" }  // optional
}

Response (200):
{ ...offer with status=accepted... }

Error Cases:
- 404: Offer not found
- 400: Offer not in issued status
- 400: Offer expired
- 403: Permission denied (not candidate owner)
```

#### Reject Offer
```
POST /api/v1/offers/:id/reject
Authorization: Bearer <JWT>
Permissions: offers:reject

Request:
{
  "reason": "Declined the opportunity",
  "metadata": { "rejection_source": "web" }
}

Response (200):
{ ...offer with status=rejected... }

Error Cases:
- 404: Offer not found
- 400: Offer not in issued status
- 403: Permission denied
```

### 6.3 Audit & Analytics

#### Get Offer Status History
```
GET /api/v1/offers/:id/status-history
Authorization: Bearer <JWT>
Permissions: offers:view_history

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "offer_id": "uuid",
      "old_status": "draft",
      "new_status": "issued",
      "changed_by_id": 123,
      "changed_at": "2026-01-08T13:00:00Z",
      "reason": null,
      "metadata": {}
    },
    {
      "id": "uuid",
      "offer_id": "uuid",
      "old_status": "issued",
      "new_status": "accepted",
      "changed_by_id": 456,
      "changed_at": "2026-01-08T14:30:00Z",
      "reason": null,
      "metadata": { "acceptance_source": "web" }
    }
  ]
}

Error Cases:
- 404: Offer not found
- 403: Permission denied
```

#### Get Offer Statistics (Company)
```
GET /api/v1/offers/stats/by-status
Authorization: Bearer <JWT>
Permissions: offers:read

Response (200):
{
  "draft": 5,
  "issued": 12,
  "accepted": 8,
  "rejected": 3,
  "withdrawn": 2,
  "total": 30
}
```

---

## 7. Validations

### 7.1 Creation Validations

**Submission Eligibility:**
- ✓ Submission exists and belongs to company
- ✓ Submission is NOT deleted
- ✓ Submission is NOT in terminal state (hired, rejected, withdrawn)
- ✓ Submission is at offer-eligible stage (interview or later)

**Offer Data:**
- ✓ base_salary: positive number if provided
- ✓ bonus: positive number if provided
- ✓ equity: valid format if provided (e.g., "0.5%")
- ✓ employment_type: must be in ENUM
- ✓ currency: valid ISO 4217 code (USD, EUR, etc.)
- ✓ start_date: not in past
- ✓ expiry_date: after start_date if both provided

**Business Logic:**
- ✓ Cannot create if active offer exists (draft or issued)
- ✓ If active offer exists, return it instead of creating duplicate

### 7.2 Issue Validations

**Pre-Issue Checks:**
- ✓ Offer status = draft
- ✓ expiry_date not in past
- ✓ No other active issued offer for same submission
- ✓ Submission still eligible (not terminal)

**Post-Issue Side Effects:**
- ✓ Submission status moves to `offer`
- ✓ Status history logged

### 7.3 Accept/Reject Validations

**Pre-Accept:**
- ✓ Offer status = issued
- ✓ expiry_date >= today
- ✓ Submission status = offer (precondition)

**On Accept:**
- ✓ Create status history entry
- ✓ Update submission status → hired
- ✓ Record acceptance timestamp

**Pre-Reject:**
- ✓ Offer status = issued

**On Reject:**
- ✓ Create status history entry
- ✓ Determine previous submission stage (interview, screening)
- ✓ Revert submission status (business decision: interview or other?)
- ✓ Record rejection reason

### 7.4 Withdraw Validations

**Pre-Withdraw:**
- ✓ Offer status = issued (cannot withdraw draft)
- ✓ Submission status = offer

**On Withdraw:**
- ✓ Create status history entry with reason
- ✓ Revert submission status (to previous stage)
- ✓ Mark offer as terminal (no further changes)

### 7.5 Update Validations

**Editability:**
- ✓ Only draft offers can be edited
- ✓ Cannot change submission_id
- ✓ Cannot change offer_version
- ✓ Cannot change status directly (use issue/withdraw endpoints)

**Field-Level:**
- ✓ Same validations as creation
- ✓ If edited, update updated_by_id and updated_at

### 7.6 Tenant Isolation (Every Operation)

- ✓ Verify company_id matches authenticated user's company
- ✓ Reject cross-tenant access
- ✓ Filter all queries by company_id
- ✓ FK constraints enforce submission belonging

---

## 8. Submission Status Synchronization

### 8.1 State Mapping

**When offer is issued:**
```
submission.status = OFFER
```

**When offer is accepted:**
```
submission.status = HIRED
```

**When offer is rejected:**
```
submission.status = ???  (DECISION REQUIRED)
Options:
  A) Return to INTERVIEW (allow new offer)
  B) Return to SCREENING (restart process)
  C) Create OFFER_REJECTED status (new)
  D) Return to previous stage (track in history)

RECOMMENDATION: Return to INTERVIEW
(allows new offer for same submission)
```

**When offer is withdrawn:**
```
submission.status = INTERVIEW
(Offer withdrawn, back to interview phase)
```

**When offer is created (draft):**
```
submission.status unchanged
(Draft offer doesn't affect submission)
```

### 8.2 Submission Constraints

**Offer can only exist if submission status is:**
- SCREENING
- INTERVIEW
- OFFER
- (NOT: APPLIED, HIRED, REJECTED, WITHDRAWN)

**If submission status changes externally:**
- Active offer remains (no cascade delete)
- Offer becomes "orphaned" but still readable
- New offer cannot be created

---

## 9. Audit & History Strategy

### 9.1 Status History Immutability

**Pattern:**
- Every status change INSERT → offer_status_history
- No UPDATE on history entries
- No DELETE on history entries (except cascade on offer delete)

**Required Fields:**
- old_status, new_status (state machine proof)
- changed_by_id (who authorized the change)
- changed_at (immutable timestamp)
- reason (why, for cancellations)
- metadata (extensibility: IP, device, acceptance coords)

### 9.2 Audit Trail Examples

**Draft → Issued:**
```json
{
  "old_status": "draft",
  "new_status": "issued",
  "changed_by_id": 123,
  "changed_at": "2026-01-08T13:00:00Z",
  "reason": null,
  "metadata": {}
}
```

**Issued → Withdrawn:**
```json
{
  "old_status": "issued",
  "new_status": "withdrawn",
  "changed_by_id": 123,
  "changed_at": "2026-01-08T14:00:00Z",
  "reason": "Position filled by internal promotion",
  "metadata": {}
}
```

**Issued → Accepted:**
```json
{
  "old_status": "issued",
  "new_status": "accepted",
  "changed_by_id": 456,
  "changed_at": "2026-01-08T15:30:00Z",
  "reason": null,
  "metadata": {
    "acceptance_timestamp": "2026-01-08T15:30:00Z",
    "source": "web"
  }
}
```

### 9.3 Compliance & Retention

- All history retained indefinitely
- Soft deletes preserve history
- GDPR compliance: deletion includes related history
- Audit log exports available for compliance

---

## 10. Migration Plan

### 10.1 Migration Files (No Implementation Yet)

**Order of Execution:**

1. **1767901000000-CreateOffersEnums.ts**
   - CREATE ENUM offer_status_enum (draft, issued, accepted, rejected, withdrawn)
   - CREATE ENUM employment_type_enum (full_time, contract, intern, part_time)

2. **1767901001000-CreateOffersTable.ts**
   - CREATE TABLE offers with all columns
   - Add FKs to companies, submissions, users
   - Create indexes

3. **1767901002000-CreateOfferStatusHistoryTable.ts**
   - CREATE TABLE offer_status_history
   - Add FKs, indexes
   - GRANT SELECT-only (immutable in application)

### 10.2 Schema Details

**ENUMs:**
```sql
CREATE TYPE offer_status_enum AS ENUM (
    'draft',
    'issued',
    'accepted',
    'rejected',
    'withdrawn'
);

CREATE TYPE employment_type_enum AS ENUM (
    'full_time',
    'contract',
    'intern',
    'part_time'
);
```

**Indexes:**
```sql
-- offers table
CREATE UNIQUE INDEX uk_offers_submission_version
  ON offers(submission_id, offer_version)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_offers_company_status
  ON offers(company_id, status);

CREATE INDEX idx_offers_company_submission
  ON offers(company_id, submission_id);

CREATE INDEX idx_offers_created_by
  ON offers(created_by_id);

CREATE INDEX idx_offers_deleted
  ON offers(company_id, deleted_at);

-- offer_status_history table
CREATE INDEX idx_offer_history_offer
  ON offer_status_history(offer_id, company_id);

CREATE INDEX idx_offer_history_company_date
  ON offer_status_history(company_id, changed_at DESC);

CREATE INDEX idx_offer_history_changed_by
  ON offer_status_history(changed_by_id);
```

**Foreign Keys:**
```sql
ALTER TABLE offers
  ADD CONSTRAINT fk_offers_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE offers
  ADD CONSTRAINT fk_offers_submission
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;

ALTER TABLE offers
  ADD CONSTRAINT fk_offers_created_by
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE offers
  ADD CONSTRAINT fk_offers_updated_by
  FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE offer_status_history
  ADD CONSTRAINT fk_offer_history_offer
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE;

ALTER TABLE offer_status_history
  ADD CONSTRAINT fk_offer_history_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE offer_status_history
  ADD CONSTRAINT fk_offer_history_user
  FOREIGN KEY (changed_by_id) REFERENCES users(id) ON DELETE SET NULL;
```

### 10.3 Backfill Strategy

**No backfill required** — new module, no legacy offers exist.

### 10.4 Soft Delete Strategy

- **Soft delete column**: deleted_at (TIMESTAMPTZ, nullable)
- **Behavior**: All queries filter `WHERE deleted_at IS NULL` by default
- **Permanent deletion**: GDPR compliance via cascading FK
- **History preserved**: Deleting offer soft-deletes only; history queryable if needed

---

## 11. Open Assumptions & Decisions

### A. Submission Status on Rejection

**Decision Required**: When a candidate rejects an issued offer, what is the submission status?

**Options:**
1. Return to `interview` (can create new offer)
2. Return to `screening` (restart process)
3. Create new status `offer_rejected` (terminal-like)
4. Return to previous stage in history

**Recommendation**: **Option 1 (Return to interview)**
- Allows new offer without admin intervention
- Matches real-world process (counter-offer possible)
- Keeps submission in offer-eligible state

### B. Competing Offers

**Decision Required**: Can multiple offers exist simultaneously for one submission?

**Design Position**: **Only one active offer at a time** (draft or issued)
- Simplifies acceptance logic
- Prevents conflicting acceptances
- If new offer needed, must withdraw/reject previous

**Implementation**: Unique constraint (submission_id, offer_version) + soft delete filter

### C. Offer Expiry Handling

**Decision Required**: What happens if candidate tries to accept expired offer?

**Design Position**: **Hard block — cannot accept**
- Validate expiry_date at acceptance time
- Return 400 error with "Offer expired"
- Candidate must request new offer

### D. Offer Versioning

**Design Position**: Use `offer_version` integer, incremented per submission
- Allows tracking revisions
- Single canonical offer per version
- Clean history of all offers for submission

**Alternative Considered**: Keep all offers in history
- Rejected because adds complexity
- Version scheme is cleaner

### E. Candidate as System User

**Design Position**: Candidate actions (accept/reject) happen via:
- External API call with submission token
- OR system admin creates on behalf of candidate
- OR frontend JS calls with auth token

**NOT covered in this design** — authentication mechanism for candidates TBD

### F. Currency & International Support

**Design Position**: 
- Currency stored as ISO 4217 code (USD, EUR, GBP, etc.)
- No currency conversion in offer module
- Salary values stored as-is (no auto-conversion)
- Frontend responsible for display/conversion

### G. Equality/Equity Handling

**Design Position**:
- Equity stored as string (e.g., "0.5%", "10,000 shares")
- No calculations in offer module
- Rendering/validation left to frontend or legal integration

### H. Offer Template System

**Out of Scope** — Not in Phase 19
- No template creation, management, or generation
- Offers created fresh each time
- PDF/signature features deferred

---

## 12. Out of Scope (Explicitly)

❌ E-signatures (DocuSign, HelloSign integration)  
❌ PDF generation (LaTeX, wkhtmltopdf)  
❌ Payroll integrations (ADP, Workday)  
❌ Email notifications (sending offer to candidate)  
❌ Frontend UI/components  
❌ Multi-country tax logic (deductions, benefits)  
❌ Offer templates (configuration & generation)  
❌ Background check workflows  
❌ Counteroffers (new offer data structure)  
❌ Signing workflows  
❌ Benefits configuration  
❌ Onboarding workflows  

---

## 13. Implementation Dependencies

### Pre-Requisites Met
✓ Submissions module (Phase 17) — COMPLETE  
✓ Users module — EXISTS  
✓ Companies module — EXISTS  
✓ RBAC framework — EXISTS  

### No New Dependencies
- Does not require Interviews module (Phase 18)
- Does not require other modules

### Downstream Dependencies
- Frontend will consume Offers API
- Onboarding module (future) will reference offers
- Payroll integrations (future) will consume offer data

---

## 14. Success Criteria

**Functional:**
- ✓ All transitions blocked/allowed per state machine
- ✓ Terminal states prevent further changes
- ✓ Submission status syncs correctly
- ✓ Audit trail immutable and complete
- ✓ Tenant isolation enforced

**Non-Functional:**
- ✓ List/get queries < 100ms (typical company size)
- ✓ Create/update < 50ms
- ✓ State change < 50ms (with history logging)
- ✓ Zero duplicate offers per active submission
- ✓ 100% ACID compliance for transitions

**Operational:**
- ✓ Clean build (zero errors)
- ✓ All migrations execute in order
- ✓ Soft delete recoverable for 30+ days
- ✓ Audit history queryable and exportable

---

## 15. Risk Assessment

### High-Risk Areas

**Risk 1: Submission Status Desync**
- If submission status changes while offer in flight
- Mitigation: Lock submission during offer state changes (TBD in implementation)

**Risk 2: Race Condition on Acceptance**
- Multiple simultaneous accept requests
- Mitigation: Unique constraint + optimistic locking or pessimistic lock

**Risk 3: Expired Offer Logic**
- System time changes, offer becomes invalid
- Mitigation: Validate expiry at every critical operation

### Medium-Risk Areas

**Risk 4: Offer Orphaning**
- Submission deleted externally, offer remains
- Mitigation: FK CASCADE delete, soft delete ensures consistency

**Risk 5: Large History Queries**
- Offer with 100+ status changes
- Mitigation: Paginate history, add changed_at index

### Low-Risk Areas

**Risk 6: Currency Mismatch**
- Invalid ISO code stored
- Mitigation: DB constraint + enum validation in code

---

## 16. Design Completeness Checklist

- ✓ Module purpose defined (submission-bound offers)
- ✓ Core business rules explicit
- ✓ State machine defined with diagram
- ✓ Data model specified (2 tables, ENUMs, constraints, indexes)
- ✓ Permissions matrix complete (8 permissions)
- ✓ API endpoints listed (8 endpoints: create, get, list, update, issue, withdraw, delete, + history)
- ✓ Candidate actions (accept, reject)
- ✓ Validations explicit (creation, issue, accept/reject, withdraw, update, tenant)
- ✓ Submission status sync rules defined
- ✓ Audit strategy (immutable history table)
- ✓ Migration plan outlined (3 migration files, ENUMs first)
- ✓ Out of scope clearly marked
- ✓ Open assumptions documented
- ✓ Success criteria defined
- ✓ Risk assessment completed

---

## 17. Document Sign-Off

**Design Status**: ✅ COMPLETE

**All Requirements From Brief**: ✅ MET

**Approved for Review**: ✅ YES

---

## Design Ready for Review

**This design document is complete and awaiting approval to implement.**

**Next Steps (Upon Approval):**
1. ✓ Design approval confirmation
2. → Implementation (migrations, entities, repositories, services, controller)
3. → Full build verification
4. → Documentation & lock

**Questions for Review:**
1. Is rejection → return to interview the correct behavior?
2. Should competing offers be possible (multiple active)?
3. Is the offer_version approach acceptable?
4. Any additional fields or enums needed?
5. Approval to proceed with implementation?

---

**Document Version**: 1.0  
**Last Updated**: January 8, 2026  
**Status**: Ready for Approval
