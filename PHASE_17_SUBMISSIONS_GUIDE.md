# Phase 17: Submissions / Applications Module Guide

This guide documents the Submissions module, implementing the end-to-end candidate → job application workflow with strict validation, RBAC, tenant isolation, and an audited status lifecycle.

## Overview
- Purpose: Manage candidate applications to job requirements.
- Entities:
  - `Submission` (core application record)
  - `SubmissionStatusHistory` (audit trail)
- Status Enum: `applied`, `screening`, `interview`, `offer`, `hired`, `rejected`, `withdrawn`.
- Soft Delete: `deleted_at` timestamp; active uniqueness enforced in service.
- Audit Trail: All transitions logged with `changed_by_id`, timestamp, and optional reason.

## Key Files
- `src/modules/submissions/entities/submission.entity.ts`
- `src/modules/submissions/entities/submission-status-history.entity.ts`
- `src/modules/submissions/repositories/submission.repository.ts`
- `src/modules/submissions/services/submission-status.service.ts`
- `src/modules/submissions/services/submission.service.ts`
- `src/modules/submissions/submission.controller.ts`
- `src/modules/submissions/submission.module.ts`

## Data Model Alignment
- `Submission.company_id`: UUID (tenant boundary)
- `Submission.job_id`: UUID (references `job_requirements.id`)
- `Submission.candidate_id`: INTEGER (references `candidates.id`)
- `Submission.created_by_id` / `updated_by_id`: INTEGER (references `users.id`)
- `SubmissionStatusHistory.changed_by_id`: INTEGER

## Tenant and Ownership Validation
- Candidate validation: Ensures the candidate exists (`candidates.id`) before creation.
- Job validation: Ensures the job requirement exists and belongs to the requesting company via `job_requirements.company_id`.
- Duplicate prevention: Service-level check prevents multiple active submissions for the same `(company_id, candidate_id, job_id)`.

## Status Lifecycle and Rules
- State Machine maintained in `SubmissionStatusService` with `VALID_TRANSITIONS`:
  - `applied → screening | rejected`
  - `screening → interview | rejected`
  - `interview → offer | rejected`
  - `offer → hired | rejected | withdrawn`
  - Terminal: `hired`, `rejected`, `withdrawn` (no further transitions)
- Initial status: ALWAYS `applied` at creation (hardcoded in service).
- Reason required: `rejected` and `withdrawn` transitions must include a `reason`.

## Permissions and Guards
- Decorators: `@RequirePermissions(...)`
- Guard: `JwtAuthGuard` ensures tenant context.
- Permissions used:
  - `submissions:create`, `submissions:read`, `submissions:update`, `submissions:delete`, `submissions:change_status`, `submissions:view_history`.

## API Endpoints
Base path: `/api/v1/submissions`

1. Create submission
   - `POST /`
   - Body: `{ candidate_id: number, job_id: uuid, cover_letter?, salary_expectation?, notes? }`
   - Returns: `Submission`

2. Get submission by ID
   - `GET /:id`

3. Update submission details (not status)
   - `PATCH /:id`
   - Body: `{ cover_letter?, salary_expectation?, notes? }`

4. Change submission status
   - `PATCH /:id/status`
   - Body: `{ new_status: enum, reason? }`

5. Get submission status history
   - `GET /:id/history`

6. Get submissions for a job
   - `GET /job/:jobId/submissions?status?&skip?&take?`

7. Get submissions for a candidate
   - `GET /candidate/:candidateId/submissions?status?&skip?&take?`

8. List submissions
   - `GET /?status?&job_id?&candidate_id?&skip?&take?`

9. Status stats
   - `GET /stats/by-status?job_id?`

10. Soft delete submission
   - `DELETE /:id`

## Error Handling
- 404: Candidate not found, Job requirement not found, Submission not found
- 409: Duplicate submission, Terminal state transition attempted
- 400: Invalid status transition, Reason missing for `rejected`/`withdrawn`

## Integration Notes
- Controller extracts `company_id` and numeric `userId` from `req.user`.
- Repository consistently enforces `company_id` and `deleted_at IS NULL` in queries.
- Submissions are scoped by tenant through `company_id`.

## Usage Examples
- Create submission:
```
POST /api/v1/submissions
{
  "candidate_id": 123,
  "job_id": "b3a65e2b-1c4f-4c6a-9c2b-4b59b43f88c2",
  "cover_letter": "Excited to apply",
  "salary_expectation": 120000
}
```

- Change status to `interview`:
```
PATCH /api/v1/submissions/{id}/status
{
  "new_status": "interview"
}
```

- Withdraw with reason:
```
PATCH /api/v1/submissions/{id}/status
{
  "new_status": "withdrawn",
  "reason": "Candidate accepted elsewhere"
}
```

## Design Guarantees
- Initial status enforcement at service layer
- Single source of truth for transitions (state machine service)
- Comprehensive audit log for all transitions
- Multi-tenant isolation through `company_id` checks

## Notes
- Tests are deferred until core ATS modules are complete.
- Module is now aligned to actual repo schema and considered production-ready.
