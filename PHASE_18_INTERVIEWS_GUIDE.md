# Phase 18: Interviews Module - Implementation Complete

**Status: ✓ DELIVERED & LOCKED**  
**Date: January 8, 2026**  
**Build: PASSING**

---

## Overview

The **Interviews Module** is a comprehensive interview lifecycle management system fully integrated into the ATS platform. It enforces strict state machine rules, supports multi-interviewer assignments, captures structured feedback, and maintains complete audit trails.

### Key Metrics
- **Endpoints**: 17 REST endpoints
- **Entities**: 4 core entities + supporting relations
- **Services**: 3 (main, status machine, assignment/feedback)
- **Repositories**: 3 (interviews, feedback, status history)
- **Migrations**: 5 (ENUMs, 4 tables with indexes)
- **Test Coverage**: Designed for 95%+ coverage
- **Permissions**: 6 granular interview permissions

---

## Architecture & Design

### Status Lifecycle (Immutable State Machine)

```
SCHEDULED (initial)
  ├─ → COMPLETED → EVALUATED (terminal)
  └─ → CANCELLED (terminal)

Terminal States (Hard-blocking):
  • EVALUATED: No further transitions allowed
  • CANCELLED: No further transitions allowed

Restrictions:
  • Only SCHEDULED interviews can be updated
  • Status transitions validated server-side
  • History recorded on every transition
```

### Entity Model

#### interviews (UUID)
- Belongs to: Submission (FK)
- Tenant-scoped: company_id (UUID)
- Schedule: scheduled_start, scheduled_end (TIMESTAMPTZ)
- Type: interview_type ENUM
- Status: status ENUM with history tracking
- Audit: created_by_id, updated_by_id, soft delete (deleted_at)
- Indexes: company_status, company_submission, schedule window, soft delete

#### interview_interviewers (join table)
- Unique constraint: (interview_id, user_id) per company
- Role: interviewer_role ENUM
- Prevents duplicate assignments

#### interview_feedback
- Unique constraint: (interview_id, reviewer_id) per company
- Rating: 1-5 numeric
- Recommendation: hire | no_hire | neutral
- Enforces: assigned-only submission, post-completion only

#### interview_status_history
- Immutable audit trail
- Reason: nullable string for cancellations
- Changed by: user_id with SET NULL fallback
- Indexes: interview + company lookup

### Core Services

**InterviewStatusService** (Immutable State Machine)
- Validates all transitions against fixed rules
- Terminal state enforcement (no transitions)
- Update-only-when-scheduled enforcement
- Status descriptions for UI/logging

**InterviewService** (Main Lifecycle)
- Create: Submission validation, schedule conflict detection
- Read: Paginated, filterable, tenant-scoped
- Update: Scheduled-only, re-conflict-check
- Complete: scheduled → completed with history
- Cancel: Any non-terminal → cancelled with reason
- Evaluate: completed → evaluated (terminal)
- Delete: Soft delete via deleted_at
- Conflict detection: Only non-deleted, non-cancelled interviews

**InterviewAssignmentService** (Interviewer & Feedback)
- Assign: Unique per interview
- Remove: Clean cascading deletion
- Submit Feedback: Assigned-only, post-completion, 1-5 rating
- View Feedback: Assigned-only access control
- Summary: Average rating, recommendation distribution

### Repositories

**InterviewRepository**
- Conflict detection query (overlapping schedules)
- Status counting by company
- Pagination with filters
- Upcoming interviews (scheduled, non-deleted, future-dated)

**InterviewFeedbackRepository**
- Unique reviewer constraint enforcement
- Summary aggregation (average rating, counts)
- Reviewer lookup

**InterviewStatusHistoryRepository**
- Immutable append-only pattern
- Latest status change query
- Average completion time analytics

### Controllers (17 Endpoints)

| Endpoint | Method | Permission | Purpose |
|----------|--------|-----------|---------|
| /api/v1/interviews | POST | create | Schedule interview |
| /api/v1/interviews | GET | read | List all (paginated) |
| /api/v1/interviews/upcoming | GET | read | Get scheduled interviews |
| /api/v1/interviews/:id | GET | read | Get interview detail |
| /api/v1/interviews/:id | PATCH | update | Update (reschedule, type, location) |
| /api/v1/interviews/:id/complete | POST | update | Mark completed |
| /api/v1/interviews/:id/cancel | POST | cancel | Cancel with reason |
| /api/v1/interviews/:id/evaluate | POST | update | Evaluate (terminal) |
| /api/v1/interviews/:id | DELETE | delete | Soft delete |
| /api/v1/interviews/:id/interviewers | POST | update | Assign interviewer |
| /api/v1/interviews/:id/interviewers | GET | read | List assigned |
| /api/v1/interviews/:id/interviewers/:uid | DELETE | update | Remove interviewer |
| /api/v1/interviews/:id/feedback | POST | submit_feedback | Submit feedback |
| /api/v1/interviews/:id/feedback | GET | view_feedback | View all feedback |
| /api/v1/interviews/:id/feedback/summary | GET | view_feedback | Feedback summary |
| /api/v1/interviews/:id/status-history | GET | read | Status change log |
| /api/v1/interviews/stats/by-status | GET | read | Status distribution |

### Permissions Matrix

```
interviews:create       - Schedule interviews
interviews:read        - View interviews and feedback
interviews:update      - Update, complete, evaluate, cancel
interviews:delete      - Soft delete interviews
interviews:cancel      - Cancel with permissions
interviews:submit_feedback - Submit feedback (assigned-only)
interviews:view_feedback   - View feedback (assigned-only)
```

---

## Implementation Details

### Migrations

**1767900000000-CreateInterviewsEnums.ts**
- Creates: interview_status_enum, interview_type_enum, interviewer_role_enum, recommendation_enum

**1767900001000-CreateInterviewsTable.ts**
- Table: interviews with company_id, submission_id, status, schedule fields
- FKs: company (CASCADE), submission (CASCADE), created_by (SET NULL), updated_by (SET NULL)
- Indexes: status, submission, schedule, soft delete

**1767900002000-CreateInterviewInterviewersTable.ts**
- Table: interview_interviewers with unique (interview_id, user_id)
- Cascades: interview, user

**1767900003000-CreateInterviewFeedbackTable.ts**
- Table: interview_feedback with unique (interview_id, reviewer_id)
- Cascades: interview, user

**1767900004000-CreateInterviewStatusHistoryTable.ts**
- Table: interview_status_history (immutable audit)
- FK: user (SET NULL), interview (CASCADE)

### Validation Rules

**Schedule Conflict Detection**
- Scope: Same submission, non-deleted, non-cancelled interviews
- Check: Overlapping scheduled_start and scheduled_end
- Applied: Create and update operations

**Feedback Submission**
- Interview must be COMPLETED
- Reviewer must be ASSIGNED to interview
- One feedback per reviewer (unique constraint)
- Rating: 1-5 numeric range

**Status Transitions**
- Immutable rules enforced at service layer
- Terminal states (CANCELLED, EVALUATED) block all transitions
- Update-only-when-scheduled enforced at service
- History logged on every state change

**Tenant Isolation**
- All queries filtered by company_id
- Relations use FK constraints
- Soft delete respects deleted_at flag

---

## Data Flow Examples

### Schedule Interview
```
POST /api/v1/interviews
↓
InterviewService.create()
  ├─ Validate submission (non-terminal)
  ├─ Conflict check (overlapping schedules)
  ├─ Create interview (SCHEDULED)
  └─ Log status history
↓
Response: Interview object with SCHEDULED status
```

### Complete & Evaluate
```
POST /api/v1/interviews/:id/complete
↓
InterviewService.complete()
  ├─ Validate transition (scheduled → completed)
  ├─ Update status
  └─ Log history
↓
POST /api/v1/interviews/:id/evaluate
↓
InterviewService.evaluate()
  ├─ Validate transition (completed → evaluated)
  ├─ Update status (TERMINAL)
  └─ Log history
↓
Response: Interview in EVALUATED terminal state
```

### Submit Feedback (Post-Completion)
```
POST /api/v1/interviews/:id/feedback
Body: { rating: 4, recommendation: 'hire', comments: '...' }
↓
InterviewAssignmentService.submitFeedback()
  ├─ Verify interview status = COMPLETED
  ├─ Verify reviewer assigned
  ├─ Check duplicate feedback
  ├─ Validate rating range
  └─ Create feedback
↓
Response: Feedback object
```

---

## Testing Strategy

### Unit Tests (Target: 95%)
- StatusService: All transitions and restrictions
- InterviewService: CRUD, conflict detection, pagination
- AssignmentService: Unique constraints, feedback rules
- Repositories: Queries, aggregations, edge cases

### Integration Tests
- Full lifecycle: create → update → complete → evaluate
- Schedule conflict scenarios
- Feedback constraints (assigned, post-completion)
- Soft delete and filtering

### E2E Tests
- API endpoint contracts
- Permission enforcement
- Tenant isolation
- State machine validation

---

## Performance & Scalability

### Indexes
- `idx_interviews_company_status`: Fast status filtering
- `idx_interviews_company_submission`: Submission lookup
- `idx_interviews_schedule`: Schedule conflict queries
- `idx_interviews_deleted`: Soft delete filtering
- `unique_feedback_per_reviewer`: Integrity + lookup

### Queries
- Conflict detection: Indexed window query
- Pagination: Skip/take with ordering
- Status counts: GROUP BY aggregation
- Upcoming: Indexed future-date filter

### Limitations (Known)
- No full-text search on feedback comments (use async job)
- Schedule conflicts limited to same submission (by design)
- Feedback readonly post-submission (delete only via admin)

---

## Security & Compliance

### Authorization
- RBAC guards on all endpoints
- Assigned-only feedback viewing
- Tenant isolation via company_id

### Audit Trail
- Status history table (immutable)
- User tracking (created_by, updated_by)
- Timestamps (UTC)
- Soft deletes preserve data

### Data Validation
- Input DTOs with class-validator
- ENUM constraints (DB level)
- Unique constraints enforced
- Schedule validation (start < end)

---

## API Documentation

### Swagger Integration
- All endpoints auto-documented
- DTOs defined with @ApiProperty
- Response models specified
- Error codes documented

### Example Request/Response

```bash
POST /api/v1/interviews
Authorization: Bearer <JWT>

{
  "submission_id": "uuid",
  "interview_type": "video",
  "scheduled_start": "2026-01-15T10:00:00Z",
  "scheduled_end": "2026-01-15T11:00:00Z",
  "location_or_link": "https://zoom.us/j/..."
}

Response (201):
{
  "id": "uuid",
  "company_id": "uuid",
  "submission_id": "uuid",
  "status": "scheduled",
  "interview_type": "video",
  "scheduled_start": "2026-01-15T10:00:00Z",
  "scheduled_end": "2026-01-15T11:00:00Z",
  "location_or_link": "https://zoom.us/j/...",
  "created_at": "2026-01-08T12:00:00Z",
  "updated_at": "2026-01-08T12:00:00Z"
}
```

---

## Integration Points

### Submissions Module
- FK dependency: interview.submission_id → submissions.id
- Validation: Submission must be non-terminal
- Cascading: Delete submission cascades to interviews

### Users Module
- FK dependency: created_by_id, updated_by_id, interviewer_id, reviewer_id
- Assignment: Unique per interview
- Feedback: Role-based access control

### Audit & Compliance
- Audit log entries for create/update/delete
- Status history as immutable log
- Soft delete support

---

## Migration & Deployment

### Pre-Deploy Checklist
- ✓ All migrations tested (ENUMs, FKs, indexes)
- ✓ Backward compatible (no breaking changes)
- ✓ Build passing (clean compile)
- ✓ No disabled features in production

### Deployment Steps
1. Run migrations (ENUMs first, then tables)
2. Verify table creation and indexes
3. Deploy service (no data migration needed)
4. Smoke test: Schedule → Complete → Evaluate flow
5. Monitor for errors

### Rollback Plan
- Keep migration history
- Soft deletes prevent data loss
- Service restart if needed

---

## Maintenance & Monitoring

### Recommended Metrics
- Interview scheduling rate
- Time to completion (scheduled → evaluated)
- Feedback submission rate
- Terminal state distribution

### Admin Operations
- Bulk cancel interviews (urgent)
- Feedback export for analysis
- Schedule conflict resolution (admin force)
- Status history audits

---

## Module Lock Policy

**This module is LOCKED for Phase 18. Changes require:**
1. Design document update
2. Architecture review approval
3. Full test suite execution
4. Deployment verification

**Allowed during lock:**
- Bug fixes (no API changes)
- Performance optimizations (no schema changes)
- Documentation updates
- Logging/monitoring additions

**Prohibited during lock:**
- New endpoints
- Status lifecycle changes
- Permission structure changes
- Entity schema changes

---

## Files Manifest

### Core
- `src/modules/interviews/interviews.module.ts` - Module export
- `src/modules/interviews/interview.controller.ts` - 17 endpoints

### Services
- `src/modules/interviews/services/interview.service.ts` - Main lifecycle
- `src/modules/interviews/services/interview-status.service.ts` - State machine
- `src/modules/interviews/services/interview-assignment.service.ts` - Assignment + feedback

### Repositories
- `src/modules/interviews/repositories/interview.repository.ts`
- `src/modules/interviews/repositories/interview-feedback.repository.ts`
- `src/modules/interviews/repositories/interview-status-history.repository.ts`

### Entities
- `src/modules/interviews/entities/interview.entity.ts`
- `src/modules/interviews/entities/interview-interviewer.entity.ts`
- `src/modules/interviews/entities/interview-feedback.entity.ts`
- `src/modules/interviews/entities/interview-status-history.entity.ts`

### DTOs
- `src/modules/interviews/dto/interview.dto.ts`

### Migrations
- `src/database/migrations/1767900000000-CreateInterviewsEnums.ts`
- `src/database/migrations/1767900001000-CreateInterviewsTable.ts`
- `src/database/migrations/1767900002000-CreateInterviewInterviewersTable.ts`
- `src/database/migrations/1767900003000-CreateInterviewFeedbackTable.ts`
- `src/database/migrations/1767900004000-CreateInterviewStatusHistoryTable.ts`

### Documentation
- `PHASE_18_INTERVIEWS_DESIGN.md` - Design document
- `PHASE_18_INTERVIEWS_GUIDE.md` - This document
- `PHASE_18_INTERVIEWS_LOCKED.md` - Lock notice

---

## Questions & Support

For questions on this module:
1. Review the design document (approved clarifications)
2. Check the migration files (schema source of truth)
3. Inspect the service logic (business rules)
4. Reference controller endpoints (API contract)

---

**End of Phase 18 Interviews Module Documentation**
