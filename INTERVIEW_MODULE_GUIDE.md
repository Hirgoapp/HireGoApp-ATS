# Interview Module - Implementation Guide

## Overview

The Interview module manages interview scheduling, execution, and feedback for candidates throughout the hiring pipeline. It tracks multiple interview rounds, interviewer assignments, feedback scores, and maintains a complete audit trail of all interview activities.

## Architecture

### Core Components

**1. Entity Layer**
- `Interview`: Main entity managing interview sessions
- `InterviewRound` Enum: SCREENING, FIRST, SECOND, THIRD, FINAL, HR, TECHNICAL
- `InterviewMode` Enum: ONLINE, OFFLINE, PHONE
- `InterviewStatus` Enum: SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED, NO_SHOW

**2. Repository Layer**
- `InterviewRepository`: 18 methods providing data access with advanced querying

**3. Service Layer**
- `InterviewService`: Business logic for interview scheduling, feedback recording, and status management

**4. Controller Layer**
- `InterviewController`: 9 REST endpoints for interview management and feedback

**5. Module Configuration**
- `InterviewModule`: Dependency injection setup with related modules

## Database Schema

### Interviews Table (19 columns)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| company_id | UUID | No | Tenant identifier |
| submission_id | UUID | No | Reference to submission |
| round | ENUM | No | SCREENING, FIRST, SECOND, THIRD, FINAL, HR, TECHNICAL |
| scheduled_date | DATE | No | Interview date |
| scheduled_time | TIME | No | Interview time |
| interviewer_id | UUID | No | Reference to interviewer (user) |
| mode | ENUM | No | ONLINE, OFFLINE, PHONE |
| status | ENUM | No | SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED, NO_SHOW |
| feedback | TEXT | Yes | Interviewer feedback notes |
| score | DECIMAL(3,1) | Yes | Interview score (0-10) |
| remarks | TEXT | Yes | Additional remarks or observations |
| location | TEXT | Yes | Physical location for offline interviews |
| meeting_link | TEXT | Yes | URL for online interviews |
| created_by_id | UUID | No | User who scheduled the interview |
| updated_by_id | UUID | Yes | User who last updated the interview |
| created_at | TIMESTAMP | No | Record creation timestamp |
| updated_at | TIMESTAMP | No | Last update timestamp |
| deleted_at | TIMESTAMP | Yes | Soft delete timestamp |

**Indices**:
- `IDX_interviews_company_id`: For company-scoped queries
- `IDX_interviews_company_submission`: For submission's interviews
- `IDX_interviews_company_interviewer`: For interviewer's schedule
- `IDX_interviews_company_scheduled_date`: For date-based filtering
- `IDX_interviews_company_status`: For status-based queries

## API Endpoints

### Schedule Interview
```
POST /api/v1/interviews
Permission: interviews:create

Request Body:
{
  "submission_id": "UUID",
  "round": "screening|first|second|third|final|hr|technical",
  "scheduled_date": "YYYY-MM-DD",
  "scheduled_time": "HH:MM:SS",
  "interviewer_id": "UUID",
  "mode": "online|offline|phone",
  "location": "string (optional, required for offline)",
  "meeting_link": "string (optional, required for online)"
}

Response: { success: true, data: GetInterviewDto }
```

### List Interviews
```
GET /api/v1/interviews
Permission: interviews:read

Query Parameters:
- skip: number (default: 0)
- take: number (default: 20)
- submission_id: string (optional)
- interviewer_id: string (optional)
- round: enum (optional)
- status: enum (optional)
- from_date: string (optional)
- to_date: string (optional)
- orderBy: scheduled_date|created_at|updated_at (default: scheduled_date)
- orderDirection: ASC|DESC (default: ASC)

Response: { success: true, data: GetInterviewDto[], total: number }
```

### Get Single Interview
```
GET /api/v1/interviews/:id
Permission: interviews:read

Response: { success: true, data: GetInterviewDto }
```

### Record Feedback
```
PUT /api/v1/interviews/:id/feedback
Permission: interviews:update

Request Body:
{
  "feedback": "string (required)",
  "score": 0-10 (required),
  "remarks": "string (optional)"
}

Response: { success: true, data: GetInterviewDto }
```

### Mark as Completed
```
PUT /api/v1/interviews/:id/complete
Permission: interviews:update

Response: { success: true, data: GetInterviewDto }
```

### Reschedule Interview
```
PUT /api/v1/interviews/:id/reschedule
Permission: interviews:update

Request Body:
{
  "scheduled_date": "YYYY-MM-DD",
  "scheduled_time": "HH:MM:SS"
}

Response: { success: true, data: GetInterviewDto }
```

### Cancel Interview
```
PUT /api/v1/interviews/:id/cancel
Permission: interviews:update

Request Body:
{
  "reason": "string (optional)"
}

Response: { success: true, data: GetInterviewDto }
```

### Update Interview
```
PUT /api/v1/interviews/:id
Permission: interviews:update

Request Body: UpdateInterviewDto (all fields optional)

Response: { success: true, data: GetInterviewDto }
```

### Delete Interview
```
DELETE /api/v1/interviews/:id
Permission: interviews:delete

Response: 204 No Content
```

### Get Interviews by Submission
```
GET /api/v1/interviews/submission/:submission_id
Permission: interviews:read

Response: { success: true, data: GetInterviewDto[] }
```

### Get Interview Statistics
```
GET /api/v1/interviews/stats/count
Permission: interviews:read

Response: { success: true, count: number }
```

## Key Features

### 1. Tenant Isolation
- All queries scoped to company_id from JWT
- Interview scheduled under company_id from authenticated user
- Cannot access other company's interviews

### 2. Multi-Round Interview Support
- 7 interview round types: screening, first, second, third, final, HR, technical
- Track multiple rounds per submission
- Prevent duplicate rounds per submission

### 3. Interview Scheduling
- Date and time-based scheduling
- Three interview modes: online, offline, phone
- Location for offline interviews
- Meeting links for online interviews

### 4. Feedback & Scoring
- Optional feedback collection
- Numeric scoring (0-10 scale)
- Remarks for additional observations
- Separate feedback recording endpoint

### 5. Interview Status Tracking
- 5 status types: scheduled, completed, cancelled, rescheduled, no_show
- Status changes logged to audit trail
- Reschedule changes status to rescheduled

### 6. Advanced Filtering
- Filter by submission (all interviews for a submission)
- Filter by interviewer (interview schedule)
- Filter by round (analytics)
- Filter by status (pending, completed)
- Filter by date range (calendar views)
- Pagination with skip/take
- Sorting: scheduled_date, created_at, updated_at

### 7. Audit Logging
- All interview operations logged via AuditService
- Actions tracked: CREATE, FEEDBACK_RECORDED, STATUS_CHANGE, RESCHEDULED, UPDATE, DELETE
- User ID and timestamp recorded
- Change details logged

### 8. Soft Deletes
- Logical deletion via deleted_at column
- Preserves historical data for analytics
- All queries exclude deleted interviews by default
- Audit trail preserved for deleted interviews

## Service Methods

### Core CRUD
- `schedule(companyId, userId, dto)`: Schedule new interview
- `getInterview(companyId, interviewId)`: Get single interview
- `getInterviews(companyId, options?)`: Get all with filtering
- `update(companyId, interviewId, userId, dto)`: Update interview details
- `delete(companyId, interviewId, userId)`: Soft delete interview

### Interview Management
- `recordFeedback(companyId, interviewId, userId, feedback, score, remarks?)`: Record feedback
- `markCompleted(companyId, interviewId, userId)`: Mark interview as completed
- `reschedule(companyId, interviewId, userId, newDate, newTime)`: Reschedule interview
- `cancel(companyId, interviewId, userId, reason?)`: Cancel interview
- `getInterviewsBySubmission(companyId, submissionId)`: Get all interviews for submission

### Analytics
- `getCount(companyId)`: Total interview count
- `getCountByRound(companyId, round)`: Count by round
- `getCountByStatus(companyId, status)`: Count by status

## Repository Methods

### Interview Methods (18)
```typescript
create(data: Partial<Interview>): Promise<Interview>
findById(companyId: string, id: string): Promise<Interview | null>
findByIds(companyId: string, ids: string[]): Promise<Interview[]>
findBySubmission(companyId: string, submissionId: string): Promise<Interview[]>
findByInterviewer(companyId: string, interviewerId: string): Promise<Interview[]>
findByRound(companyId: string, round: InterviewRound): Promise<Interview[]>
findByCompany(companyId: string, options?: FindInterviewsOptions): Promise<{ data: Interview[]; total: number }>
findByDate(companyId: string, date: string): Promise<Interview[]>
findByDateRange(companyId: string, fromDate: string, toDate: string): Promise<Interview[]>
findPending(companyId: string): Promise<Interview[]>
findWithFeedback(companyId: string): Promise<Interview[]>
update(interview: Interview): Promise<Interview>
softDelete(companyId: string, id: string): Promise<void>
countByCompany(companyId: string): Promise<number>
countBySubmission(companyId: string, submissionId: string): Promise<number>
countByRound(companyId: string, round: InterviewRound): Promise<number>
countByStatus(companyId: string, status: InterviewStatus): Promise<number>
```

## DTO Definitions

### CreateInterviewDto
```typescript
{
  submission_id: string (UUID, required)
  round: InterviewRound (required)
  scheduled_date: string (date, required)
  scheduled_time: string (time, required)
  interviewer_id: string (UUID, required)
  mode: InterviewMode (required)
  location?: string (optional)
  meeting_link?: string (optional)
}
```

### UpdateInterviewDto
```typescript
{
  // All fields from CreateInterviewDto are optional
  // Plus additional fields:
  feedback?: string
  score?: number (0-10)
  remarks?: string
}
```

### GetInterviewDto
Response DTO with all interview fields typed:
```typescript
{
  id: string
  company_id: string
  submission_id: string
  round: InterviewRound
  scheduled_date: string
  scheduled_time: string
  interviewer_id: string
  mode: InterviewMode
  status: InterviewStatus
  feedback?: string
  score?: number
  remarks?: string
  location?: string
  meeting_link?: string
  created_by_id: string
  updated_by_id?: string
  created_at: Date
  updated_at: Date
}
```

## Integration Points

### TenantGuard
- Extracts company_id from JWT
- Validates tenant context for all operations
- Passed via @CompanyId() decorator

### RoleGuard
- Validates user roles and permissions
- Permissions: interviews:create, interviews:read, interviews:update, interviews:delete
- Used with @Require() decorator on controller endpoints

### AuditService
- Logs all interview operations
- Tracks: CREATE, FEEDBACK_RECORDED, STATUS_CHANGE, RESCHEDULED, UPDATE, DELETE
- Records user, timestamp, and changes

## Enums

### InterviewRound
```typescript
enum InterviewRound {
  SCREENING = 'screening',
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
  FINAL = 'final',
  HR = 'hr',
  TECHNICAL = 'technical'
}
```

### InterviewMode
```typescript
enum InterviewMode {
  ONLINE = 'online',
  OFFLINE = 'offline',
  PHONE = 'phone'
}
```

### InterviewStatus
```typescript
enum InterviewStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no_show'
}
```

## Common Workflows

### Full Interview Pipeline
```
1. Schedule screening interview
   POST /api/v1/interviews with round=screening

2. Complete screening and record feedback
   PUT /api/v1/interviews/:id/feedback

3. Mark as completed
   PUT /api/v1/interviews/:id/complete

4. Schedule first round if feedback is positive
   POST /api/v1/interviews with round=first

5. Schedule final round after successful rounds
   POST /api/v1/interviews with round=final

6. Record final feedback and offer decision
   PUT /api/v1/interviews/:id/feedback
```

### Rescheduling Process
```
1. Get interview details
   GET /api/v1/interviews/:id

2. Reschedule to new date/time
   PUT /api/v1/interviews/:id/reschedule
   
3. Interview status automatically becomes "rescheduled"
4. Audit trail records the reschedule action
```

### Interview Analytics
```
// Get all interviews by round
GET /api/v1/interviews?round=first

// Get all completed interviews
GET /api/v1/interviews?status=completed

// Get all interviews for a submission
GET /api/v1/interviews/submission/:submission_id

// Get interviewer's schedule
GET /api/v1/interviews?interviewer_id=:id&orderBy=scheduled_date&orderDirection=ASC

// Get interviews in date range
GET /api/v1/interviews?from_date=2024-01-15&to_date=2024-01-31
```

## Error Handling

All errors are properly handled with appropriate HTTP status codes:

- **400 Bad Request**: Invalid input, validation errors, duplicate rounds, invalid scores
- **404 Not Found**: Interview not found
- **500 Internal Server Error**: Database or service errors

## Permissions Matrix

| Operation | Permission | Context |
|-----------|------------|---------|
| Schedule | interviews:create | Company-scoped |
| Read | interviews:read | Company-scoped |
| Update Details | interviews:update | Company-scoped |
| Record Feedback | interviews:update | Company-scoped |
| Mark Completed | interviews:update | Company-scoped |
| Reschedule | interviews:update | Company-scoped |
| Cancel | interviews:update | Company-scoped |
| Delete | interviews:delete | Company-scoped |

## Testing Considerations

- Test interview creation prevents duplicate rounds per submission
- Test scheduling with date/time validation
- Test feedback recording with score validation (0-10)
- Test status transitions (scheduled → completed/cancelled/rescheduled)
- Test rescheduling updates date/time and status
- Test soft deletes preserve history
- Test audit logging for all operations
- Test pagination and sorting
- Test RBAC permission enforcement
- Test interviewer schedule filtering
- Test date range filtering

## Related Modules

- **Submission Module**: Source of submission_id references
- **User Module**: Source of interviewer_id and user references
- **Audit Module**: Logging and compliance tracking
- **RBAC Module**: Permission checking
- **Tenant Module**: Company isolation

## Configuration

Module is registered in `app.module.ts`:
```typescript
InterviewModule.register({
  // Any future configuration options
})
```

All dependencies injected via NestJS DI:
- TypeOrmModule for database access
- AuditModule for logging
- RbacModule for permissions

## Future Enhancements

1. **Calendar Integration**: Sync with Google Calendar, Outlook
2. **Email Notifications**: Send interview reminders and confirmations
3. **Candidate Availability**: Allow candidates to indicate availability slots
4. **Interviewer Availability**: Book interviews from available time slots
5. **Interview Recordings**: Store and link video/audio recordings
6. **Assessment Results**: Link to technical assessments taken during interviews
7. **Interview Rating**: Multi-criteria rating system (technical, cultural fit, communication)
8. **Interview Templates**: Predefined question sets by round type
9. **Candidate Feedback**: Collect feedback from candidate on interview experience
10. **Analytics Dashboard**: Interview metrics and funnel visualization
