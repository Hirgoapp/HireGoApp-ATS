# Submission/Pipeline Module - Implementation Guide

## Overview

The Submission module manages the candidate-to-job application pipeline for the ATS platform. It tracks candidates' progress through configurable job application stages, records outcomes, and maintains a complete audit trail of all stage transitions.

## Architecture

### Core Components

**1. Entity Layer**
- `Submission`: Main entity linking candidates to jobs with pipeline tracking
- `SubmissionHistory`: Audit trail for stage transitions and outcomes
- `SubmissionOutcome`: Enum with 4 values (REJECTED, OFFER, JOINED, WITHDRAWN)

**2. Repository Layer**
- `SubmissionRepository`: 18 methods providing data access with advanced querying

**3. Service Layer**
- `SubmissionService`: Business logic for pipeline management, outcome handling, and audit logging

**4. Controller Layer**
- `SubmissionController`: 7 REST endpoints for CRUD operations and pipeline management

**5. Module Configuration**
- `SubmissionModule`: Dependency injection setup with related modules

## Database Schema

### Submissions Table (17 columns)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| company_id | UUID | No | Tenant identifier |
| candidate_id | UUID | No | Reference to candidate |
| job_id | UUID | No | Reference to job |
| current_stage | VARCHAR(255) | No | Current pipeline stage |
| submitted_at | DATE | No | Application submission date |
| moved_to_stage_at | DATE | No | Last stage transition date |
| outcome | ENUM | Yes | REJECTED, OFFER, JOINED, WITHDRAWN |
| outcome_date | DATE | Yes | Date when outcome was recorded |
| internal_notes | TEXT | Yes | Internal HR notes |
| source | VARCHAR(255) | Yes | Application source (LinkedIn, Website, Referral) |
| score | DECIMAL(3,1) | Yes | Candidate fit score (0-10) |
| tags | JSON | Yes | Tagging system for submissions |
| created_by_id | UUID | No | User who created submission |
| updated_by_id | UUID | Yes | User who last updated submission |
| created_at | TIMESTAMP | No | Record creation timestamp |
| updated_at | TIMESTAMP | No | Last update timestamp |
| deleted_at | TIMESTAMP | Yes | Soft delete timestamp |

**Indices**:
- `IDX_submissions_company_id`: For company-scoped queries
- `IDX_submissions_company_candidate`: For candidate's applications
- `IDX_submissions_company_job`: For job's applications
- `IDX_submissions_company_stage`: For pipeline stage filtering

### Submission_Histories Table (9 columns)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| company_id | UUID | No | Tenant identifier |
| submission_id | UUID | No | Reference to submission |
| moved_from_stage | VARCHAR(255) | Yes | Previous stage |
| moved_to_stage | VARCHAR(255) | Yes | New stage |
| reason | TEXT | Yes | Reason for stage change |
| outcome_recorded | ENUM | Yes | Outcome value if outcome was recorded |
| outcome_reason | TEXT | Yes | Reason for outcome decision |
| created_by_id | UUID | No | User who made the change |
| created_at | TIMESTAMP | No | Change timestamp |

**Indices**:
- `IDX_submission_histories_company`: For company-scoped history
- `IDX_submission_histories_submission`: For submission history lookup
- `IDX_submission_histories_company_submission`: Composite for efficient queries

## API Endpoints

### Create Submission
```
POST /api/v1/submissions
Permission: submissions:create

Request Body:
{
  "candidate_id": "UUID",
  "job_id": "UUID",
  "current_stage": "applied",
  "submitted_at": "2024-01-15" (optional),
  "moved_to_stage_at": "2024-01-15" (optional),
  "internal_notes": "string (optional)",
  "source": "LinkedIn|Website|Referral (optional)",
  "score": 0-10 (optional),
  "tags": ["array", "of", "strings"] (optional),
  "customFields": { "key": "value" } (optional)
}

Response: { success: true, data: GetSubmissionDto }
```

### List Submissions
```
GET /api/v1/submissions
Permission: submissions:read

Query Parameters:
- skip: number (default: 0)
- take: number (default: 20)
- candidate_id: string (optional)
- job_id: string (optional)
- current_stage: string (optional)
- outcome: REJECTED|OFFER|JOINED|WITHDRAWN (optional)
- orderBy: created_at|updated_at|submitted_at|moved_to_stage_at (default: created_at)
- orderDirection: ASC|DESC (default: DESC)
- includeCustomFields: boolean (default: false)

Response: { success: true, data: GetSubmissionDto[], total: number }
```

### Get Single Submission
```
GET /api/v1/submissions/:id
Permission: submissions:read

Query Parameters:
- includeCustomFields: boolean (default: false)

Response: { success: true, data: GetSubmissionDto }
```

### Move to Stage
```
PUT /api/v1/submissions/:id/stage
Permission: submissions:update

Request Body:
{
  "current_stage": "string",
  "stage_change_reason": "string (optional)"
}

Response: { success: true, data: GetSubmissionDto }
```

### Record Outcome
```
PUT /api/v1/submissions/:id/outcome
Permission: submissions:update

Request Body:
{
  "outcome": "rejected|offer|joined|withdrawn",
  "reason": "string (optional)"
}

Response: { success: true, data: GetSubmissionDto }
```

### Update Submission
```
PUT /api/v1/submissions/:id
Permission: submissions:update

Request Body: UpdateSubmissionDto (all fields optional)

Response: { success: true, data: GetSubmissionDto }
```

### Delete Submission
```
DELETE /api/v1/submissions/:id
Permission: submissions:delete

Response: 204 No Content
```

### Get Submission History
```
GET /api/v1/submissions/:id/history
Permission: submissions:read

Response: { success: true, data: SubmissionHistory[] }
```

## Key Features

### 1. Tenant Isolation
- All queries scoped to company_id from JWT
- Submission created under company_id from authenticated user
- History records maintain company_id for audit trail isolation

### 2. Pipeline Stage Management
- Configurable stages per company (string-based for flexibility)
- Common stages: "applied", "phone-interview", "interview", "offer", "rejected", "joined"
- Track stage changes with timestamps and reasons
- Full audit trail of stage transitions in SubmissionHistory

### 3. Outcome Tracking
- Support for 4 outcomes: REJECTED, OFFER, JOINED, WITHDRAWN
- Optional outcome with recorded date
- Outcome reasons logged for audit trail
- Stage separate from outcome (submission can be in "offer" stage without outcome)

### 4. Audit Logging
- All stage changes logged via AuditService
- All outcomes recorded with reasons
- User tracking (created_by_id, updated_by_id)
- Timestamps for all changes
- SubmissionHistory table for compliance and analytics

### 5. Custom Fields Integration
- Support for custom fields on submissions
- Integrate with CustomFieldsService for dynamic field management
- Validation via CustomFieldValidationService
- Optional customFields in create/update DTOs

### 6. Advanced Filtering
- Filter by candidate_id (get all submissions for a candidate)
- Filter by job_id (get all applications for a job)
- Filter by current_stage (pipeline analytics)
- Filter by outcome (reporting and metrics)
- Combine multiple filters
- Pagination with skip/take
- Sorting options: created_at, updated_at, submitted_at, moved_to_stage_at

### 7. Soft Deletes
- Logical deletion via deleted_at column
- Preserves historical data for analytics
- All queries exclude deleted submissions by default
- Audit trail preserved for deleted submissions

## Service Methods

### Core CRUD
- `create(companyId, userId, dto)`: Create new submission
- `getSubmission(companyId, submissionId, includeCustomFields?)`: Get single
- `getSubmissions(companyId, options?)`: Get all with filtering
- `update(companyId, submissionId, userId, dto)`: Update submission
- `delete(companyId, submissionId, userId)`: Soft delete

### Pipeline Management
- `moveStage(companyId, submissionId, userId, dto)`: Move to next stage
- `recordOutcome(companyId, submissionId, userId, outcome, reason?)`: Record outcome
- `getHistory(companyId, submissionId)`: Get audit trail

### Analytics
- `getCount(companyId)`: Total submission count
- `getCountByStage(companyId, stage)`: Count by stage
- `getCountByOutcome(companyId, outcome)`: Count by outcome

## Repository Methods

### Submission Methods (12)
```typescript
create(data: SubmissionCreateInput): Promise<Submission>
findById(companyId: string, id: string): Promise<Submission | null>
findByIds(companyId: string, ids: string[]): Promise<Submission[]>
findByCandidate(companyId: string, candidateId: string): Promise<Submission[]>
findByJob(companyId: string, jobId: string): Promise<Submission[]>
findByCandidateAndJob(companyId: string, candidateId: string, jobId: string): Promise<Submission | null>
findByCompany(companyId: string, options: FindOptions): Promise<{ data: Submission[]; total: number }>
update(submission: Submission): Promise<Submission>
softDelete(companyId: string, id: string): Promise<void>
countByCompany(companyId: string): Promise<number>
countByStage(companyId: string, stage: string): Promise<number>
countByOutcome(companyId: string, outcome: SubmissionOutcome): Promise<number>
```

### History Methods (6)
```typescript
createHistory(data: HistoryCreateInput): Promise<SubmissionHistory>
findHistoryBySubmission(submissionId: string): Promise<SubmissionHistory[]>
findHistoryByCompany(companyId: string, options?: { submission_id?: string }): Promise<SubmissionHistory[]>
```

## DTO Definitions

### CreateSubmissionDto
```typescript
{
  candidate_id: string (UUID, required)
  job_id: string (UUID, required)
  current_stage: string (required)
  submitted_at?: string (date)
  moved_to_stage_at?: string (date)
  internal_notes?: string
  source?: string
  score?: number (0-10)
  tags?: string[]
  customFields?: Record<string, any>
}
```

### UpdateSubmissionDto
```typescript
{
  // All fields from CreateSubmissionDto are optional
  // Plus additional fields for stage changes:
  moved_from_stage?: string
  stage_change_reason?: string
  outcome?: SubmissionOutcome
  outcome_reason?: string
}
```

### GetSubmissionDto
Response DTO with all submission fields typed:
```typescript
{
  id: string
  company_id: string
  candidate_id: string
  job_id: string
  current_stage: string
  submitted_at: string
  moved_to_stage_at: string
  outcome?: SubmissionOutcome
  outcome_date?: string
  internal_notes?: string
  source?: string
  score?: number
  tags?: string[]
  created_by_id: string
  updated_by_id?: string
  created_at: Date
  updated_at: Date
  customFields?: Record<string, any>
}
```

## Integration Points

### TenantGuard
- Extracts company_id from JWT
- Validates tenant context for all operations
- Passed via @CompanyId() decorator

### RoleGuard
- Validates user roles and permissions
- Permissions: submissions:create, submissions:read, submissions:update, submissions:delete
- Used with @Require() decorator on controller endpoints

### CustomFieldsService
- Handles dynamic field values for submissions
- `getEntityValues()`: Retrieve custom field values
- `setFieldValue()`: Store custom field values
- `getFieldByKey()`: Validate field exists

### AuditService
- Logs all submission operations
- Tracks: CREATE, UPDATE, STAGE_CHANGE, OUTCOME_RECORDED, DELETE
- Records user, timestamp, and changes

## Enums

### SubmissionOutcome
```typescript
enum SubmissionOutcome {
  REJECTED = 'rejected',
  OFFER = 'offer',
  JOINED = 'joined',
  WITHDRAWN = 'withdrawn'
}
```

## Common Workflows

### Complete Application Flow
```
1. Candidate applies → Create submission with current_stage = "applied"
2. Initial screening → moveStage to "phone-interview"
3. Phone interview → moveStage to "interview"
4. Technical assessment → moveStage to "assessment"
5. Final decision → recordOutcome OFFER or REJECTED
6. Acceptance → moveStage to "offer", recordOutcome JOINED
```

### Pipeline Analytics
```
// Get all submissions by stage
GET /api/v1/submissions?current_stage=interview

// Get hired candidates
GET /api/v1/submissions?outcome=joined

// Get rejected candidates
GET /api/v1/submissions?outcome=rejected

// Get all applications for specific job
GET /api/v1/submissions?job_id=<job-id>

// Get all applications from specific candidate
GET /api/v1/submissions?candidate_id=<candidate-id>
```

### Audit Trail Review
```
// Get history of submission stage changes
GET /api/v1/submissions/<id>/history

// Shows:
// - Applied at: 2024-01-15
// - Phone Interview at: 2024-01-16 (reason: "Passed initial screening")
// - Interview at: 2024-01-17 (reason: "Qualified for technical assessment")
// - Offer at: 2024-01-18
// - Joined at: 2024-01-20 (reason: "Offer accepted")
```

## Error Handling

All errors are properly handled with appropriate HTTP status codes:

- **400 Bad Request**: Invalid input, validation errors, candidate already applied
- **404 Not Found**: Submission not found
- **409 Conflict**: Duplicate submission (candidate-job combination)
- **500 Internal Server Error**: Database or service errors

## Permissions Matrix

| Operation | Permission | Context |
|-----------|------------|---------|
| Create | submissions:create | Company-scoped |
| Read | submissions:read | Company-scoped |
| Update | submissions:update | Company-scoped |
| Delete | submissions:delete | Company-scoped |
| Move Stage | submissions:update | Company-scoped |
| Record Outcome | submissions:update | Company-scoped |

## Testing Considerations

- Test submission creation prevents duplicates (candidate-job)
- Test stage transitions with history logging
- Test outcome recording with reasons
- Test custom field integration
- Test filtering by candidate, job, stage, outcome
- Test soft deletes preserve history
- Test audit logging for all operations
- Test pagination and sorting
- Test RBAC permission enforcement

## Related Modules

- **Candidate Module**: Source of candidate_id references
- **Job Module**: Source of job_id references
- **Custom Fields Module**: Dynamic field management
- **Audit Module**: Logging and compliance tracking
- **RBAC Module**: Permission checking
- **Tenant Module**: Company isolation

## Configuration

Module is registered in `app.module.ts`:
```typescript
SubmissionModule.register({
  // Any future configuration options
})
```

All dependencies injected via NestJS DI:
- TypeOrmModule for database access
- CustomFieldsModule for dynamic fields
- AuditModule for logging
- RbacModule for permissions
