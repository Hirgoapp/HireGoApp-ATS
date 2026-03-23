# Phase 18 — Interviews Module (Design-First)

Status: Design-only. No implementation yet.
Date: 2026-01-08

## Module Purpose
Interviews represent scheduled and completed interview rounds for a specific submission. Interviews belong to submissions (not directly to candidates or jobs), ensuring correct ATS flow and preventing duplication.

## Data Model

### Tables

1) interviews
- id: UUID (PK)
- company_id: UUID (tenant ownership)
- submission_id: UUID (FK to submissions.id; required)
- status: ENUM('scheduled','completed','evaluated','cancelled')
- interview_type: ENUM('phone','video','onsite','other')
- scheduled_start: TIMESTAMP WITH TIME ZONE
- scheduled_end: TIMESTAMP WITH TIME ZONE
- location_or_link: VARCHAR(500) (meeting URL or on-site location)
- created_by_id: INTEGER (FK to users.id)
- updated_by_id: INTEGER (FK to users.id)
- created_at: TIMESTAMP DEFAULT now()
- updated_at: TIMESTAMP DEFAULT now()
- deleted_at: TIMESTAMP NULL (soft delete)

Indexes/Constraints
- idx_interviews_company_status: (company_id, status)
- idx_interviews_company_submission: (company_id, submission_id)
- idx_interviews_schedule: (company_id, scheduled_start, scheduled_end)
- Foreign keys:
  - submission_id → submissions(id) ON DELETE CASCADE
  - created_by_id, updated_by_id → users(id) ON DELETE SET NULL
- Soft-delete respected in uniqueness and queries

2) interview_interviewers (join table)
- id: UUID (PK)
- company_id: UUID
- interview_id: UUID (FK to interviews.id)
- user_id: INTEGER (FK to users.id)
- role: ENUM('interviewer','panelist','observer')

Indexes/Constraints
- unique_interviewer_assignment: UNIQUE(company_id, interview_id, user_id)
- idx_interviewer_user: (company_id, user_id)
- FKs: interview_id → interviews(id) ON DELETE CASCADE, user_id → users(id) ON DELETE CASCADE

3) interview_feedback
- id: UUID (PK)
- company_id: UUID
- interview_id: UUID (FK to interviews.id)
- reviewer_id: INTEGER (FK to users.id)
- rating: NUMERIC(3,1) (Scale: 0.0–10.0)
- recommendation: ENUM('hire','no_hire','neutral')
- comments: TEXT
- submitted_at: TIMESTAMP DEFAULT now()

Indexes/Constraints
- unique_feedback_per_reviewer: UNIQUE(company_id, interview_id, reviewer_id)
- idx_feedback_interview: (company_id, interview_id)
- FKs: interview_id → interviews(id) ON DELETE CASCADE; reviewer_id → users(id) ON DELETE CASCADE

4) interview_status_history (audit)
- id: UUID (PK)
- company_id: UUID
- interview_id: UUID (FK to interviews.id)
- old_status: ENUM('scheduled','completed','evaluated','cancelled') NULL
- new_status: ENUM('scheduled','completed','evaluated','cancelled')
- changed_by_id: INTEGER (FK to users.id)
- changed_at: TIMESTAMP DEFAULT now()
- reason: TEXT NULL
- metadata: JSONB NULL

Indexes/Constraints
- idx_history_interview: (company_id, interview_id, changed_at)
- idx_history_changed_by: (company_id, changed_by_id, changed_at)

## Interview Lifecycle (State Machine)
- States: scheduled, completed, evaluated, cancelled
- Initial: scheduled only
- Transitions:
  - scheduled → completed
  - scheduled → cancelled (terminal)
  - completed → evaluated
- Terminal: cancelled and evaluated (no further transitions or updates after either)
- Rules:
  - No skipping states (e.g., scheduled → evaluated not allowed)
  - No backward transitions
  - Updates to interview details (schedule, location, interviewer assignments) allowed only when status = scheduled

VALID_TRANSITIONS (conceptual)
- scheduled: [completed, cancelled]
- completed: [evaluated]
- evaluated: []
- cancelled: []

## Permissions (Explicit)
Actions
- interviews:create
- interviews:read
- interviews:update
- interviews:cancel
- interviews:submit_feedback
- interviews:view_feedback

Role Expectations
- Recruiter: create, read, update, cancel, submit_feedback, view_feedback
- Hiring Manager: read, submit_feedback, view_feedback
- Interviewer: read, submit_feedback
- Viewer: read
- Super Admin: read across tenants (global read bypass with role-based exception)

Permission Enforcement
- Endpoint-level permission checks
- Tenant guard ensures `company_id` isolation
- Super Admin exception for read-only endpoints (explicit role check)

## API Endpoints (Design Only)
Base path: /api/v1/interviews

Interview Management
1) POST /api/v1/interviews
- Body: { submission_id (UUID), interview_type, scheduled_start, scheduled_end, location_or_link, interviewer_assignments: [{ user_id, role }] }
- AuthZ: interviews:create
- Validations: submission must exist and not be terminal; interviewer_assignments unique; schedule conflict checks

2) PATCH /api/v1/interviews/:id
- Body: { interview_type?, scheduled_start?, scheduled_end?, location_or_link?, add_interviewers?:[], remove_interviewers?:[] }
- AuthZ: interviews:update
- Validations: schedule conflict checks; no changes if status is cancelled; interviewer duplicates prevented

3) PATCH /api/v1/interviews/:id/cancel
- Body: { reason? }
- AuthZ: interviews:cancel
- Effect: status: scheduled → cancelled
- Validations: only scheduled interviews can be cancelled; audit recorded

4) GET /api/v1/interviews/:id
- AuthZ: interviews:read
- Scope: tenant-isolated

5) GET /api/v1/interviews/by-submission/:submissionId
- Query: { status?, skip?, take? }
- AuthZ: interviews:read
- Scope: tenant-isolated; returns paginated list

Status
6) PATCH /api/v1/interviews/:id/complete
- Body: { actual_start?, actual_end?, notes? }
- AuthZ: interviews:update
- Effect: status: scheduled → completed
- Validations: only scheduled can transition to completed; audit recorded

7) PATCH /api/v1/interviews/:id/evaluate
- Body: { summary?, decision_notes? }
- AuthZ: interviews:update
- Effect: status: completed → evaluated
- Validations: only completed can transition to evaluated; audit recorded

Feedback
8) POST /api/v1/interviews/:id/feedback
- Body: { rating, recommendation, comments }
- AuthZ: interviews:submit_feedback
- Validations: only assigned interviewers/panelists/observers can submit feedback; interview must be completed

9) GET /api/v1/interviews/:id/feedback
- AuthZ: interviews:view_feedback
- Scope: tenant-isolated; supports pagination

## Validation Rules (Mandatory)
- Submission state: cannot create interviews for submissions in terminal states (hired, rejected, withdrawn)
- Schedule conflicts: prevent overlaps per interviewer within company for interviews not cancelled and not soft-deleted
  - Conflict definition: requested [scheduled_start, scheduled_end) overlaps any existing assignment window
  - Apply conflicts only across interviews where deleted_at IS NULL and status != cancelled
- Assigned-only feedback: only users present in `interview_interviewers` for that interview can submit feedback
- Feedback timing: feedback allowed only when interview status is completed
- Tenant isolation: all queries filter by company_id; FK checks ensure submission.company_id matches
- Duplicate assignments: enforce UNIQUE(company_id, interview_id, user_id) in join table
- Status transitions: enforce VALID_TRANSITIONS; no backward or skipping transitions; cancelled/evaluated treated as terminal

## Audit Strategy
- Create `interview_status_history`
  - Log status changes with old/new status, changed_by_id, changed_at, reason, metadata
- Feedback audit
  - Log feedback creation: reviewer_id, submitted_at, rating, recommendation
  - Option: append a lightweight entry in status history with metadata { event: 'feedback_submitted', reviewer_id }

## Migration Plan
1) ENUM types
- interview_status_enum: scheduled, completed, evaluated, cancelled
- interview_type_enum: phone, video, onsite, other
- interviewer_role_enum: interviewer, panelist, observer
- recommendation_enum: hire, no_hire, neutral

2) Tables
- Create `interviews` with columns and indexes listed above
- Create `interview_interviewers` join table with unique composite key
- Create `interview_feedback` with unique feedback per reviewer
- Create `interview_status_history` for auditing

3) Indexes & Constraints
- Company + submission + status indexes for fast filtering
- Schedule index (company_id, scheduled_start, scheduled_end)
- All FK constraints with ON DELETE behavior (CASCADE for interview_id links; SET NULL for user references)
- Soft delete handled via `deleted_at` filtering (no hard delete endpoints)

4) Backfill/Compatibility
- None required; Interviews are net-new and scoped to submissions

## Open Assumptions
- Time zone: store timestamps in UTC; clients can display in local time
- Minimum interview duration: not enforced (scheduled_end must be after scheduled_start)
- Evaluation preconditions: evaluation does not require feedback (can be added later by policy); business can require at least one feedback externally
- Super Admin: read-only across tenants (no create/update/cancel)

Design ready for review. Awaiting approval to implement.
