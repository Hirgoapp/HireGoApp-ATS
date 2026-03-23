# Phase 17 Completion: Submissions / Applications Module

Status: COMPLETE and LOCKED

## Summary
- Implemented a full candidate → job application workflow with tenant isolation, audited status lifecycle, and explicit RBAC permissions.
- Aligned validations and IDs to actual repository schema:
  - Job validation uses `job_requirements.company_id` (UUID) for tenant ownership
  - Candidate validation ensures existence against `candidates.id` (INTEGER)
  - Submission stores `candidate_id` as INTEGER and `job_id`/`company_id` as UUID
  - User IDs stored as INTEGER for creator/updater and history `changed_by_id`

## Deliverables
- Entities
  - `src/modules/submissions/entities/submission.entity.ts`
  - `src/modules/submissions/entities/submission-status-history.entity.ts`
- Repository
  - `src/modules/submissions/repositories/submission.repository.ts`
- Services
  - `src/modules/submissions/services/submission.service.ts`
  - `src/modules/submissions/services/submission-status.service.ts`
- Controller
  - `src/modules/submissions/submission.controller.ts` (11 endpoints)
- Module
  - `src/modules/submissions/submission.module.ts`
- Documentation
  - `PHASE_17_SUBMISSIONS_GUIDE.md`

## Endpoint List
1. `POST /api/v1/submissions` (create)
2. `GET /api/v1/submissions/:id` (read)
3. `PATCH /api/v1/submissions/:id` (update non-status)
4. `PATCH /api/v1/submissions/:id/status` (change status)
5. `GET /api/v1/submissions/:id/history` (view history)
6. `GET /api/v1/submissions/job/:jobId/submissions` (list by job)
7. `GET /api/v1/submissions/candidate/:candidateId/submissions` (list by candidate)
8. `GET /api/v1/submissions` (list with filters)
9. `GET /api/v1/submissions/stats/by-status` (status counts)
10. `DELETE /api/v1/submissions/:id` (soft delete)

## State Machine & Rules
- Transitions strictly enforced via `SubmissionStatusService`
- Terminal states (`hired`, `rejected`, `withdrawn`) are immutable
- Reasons required for `rejected` and `withdrawn`
- Initial status is always `applied`
- All transitions logged to `submission_status_history`

## RBAC
- `JwtAuthGuard` + `@RequirePermissions` on all endpoints
- Permissions used: `submissions:create`, `submissions:read`, `submissions:update`, `submissions:delete`, `submissions:change_status`, `submissions:view_history`

## Build Verification
- `npm run build` passes cleanly
- All imports and types aligned to repository structure

## Next Steps
- Tests to be added after core ATS modules completion (per directive)
- Module is LOCKED; no further changes without explicit approval
