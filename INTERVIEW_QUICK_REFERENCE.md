# Interview Module - Quick Reference

## Table of Contents
1. Quick API Reference
2. Common Use Cases
3. Status Codes & Errors
4. Database Queries
5. Environment Setup

## Quick API Reference

### Interview Endpoints

| Method | Endpoint | Permission | Purpose |
|--------|----------|------------|---------|
| POST | /api/v1/interviews | interviews:create | Schedule interview |
| GET | /api/v1/interviews | interviews:read | List interviews |
| GET | /api/v1/interviews/:id | interviews:read | Get single interview |
| PUT | /api/v1/interviews/:id | interviews:update | Update interview |
| PUT | /api/v1/interviews/:id/feedback | interviews:update | Record feedback |
| PUT | /api/v1/interviews/:id/complete | interviews:update | Mark completed |
| PUT | /api/v1/interviews/:id/reschedule | interviews:update | Reschedule |
| PUT | /api/v1/interviews/:id/cancel | interviews:update | Cancel interview |
| DELETE | /api/v1/interviews/:id | interviews:delete | Delete interview |
| GET | /api/v1/interviews/submission/:id | interviews:read | Get by submission |

## Common Use Cases

### Use Case 1: Schedule Phone Screening
```bash
curl -X POST http://localhost:3000/api/v1/interviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "a0000000-0000-0000-0000-000000000001",
    "round": "screening",
    "scheduled_date": "2024-02-01",
    "scheduled_time": "10:00:00",
    "interviewer_id": "u0000000-0000-0000-0000-000000000001",
    "mode": "phone"
  }'
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "i0000000-0000-0000-0000-000000000001",
    "company_id": "c0000000-0000-0000-0000-000000000001",
    "submission_id": "a0000000-0000-0000-0000-000000000001",
    "round": "screening",
    "scheduled_date": "2024-02-01",
    "scheduled_time": "10:00:00",
    "interviewer_id": "u0000000-0000-0000-0000-000000000001",
    "mode": "phone",
    "status": "scheduled",
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```

### Use Case 2: Schedule Online Interview with Meeting Link
```bash
curl -X POST http://localhost:3000/api/v1/interviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "a0000000-0000-0000-0000-000000000001",
    "round": "first",
    "scheduled_date": "2024-02-05",
    "scheduled_time": "14:00:00",
    "interviewer_id": "u0000000-0000-0000-0000-000000000002",
    "mode": "online",
    "meeting_link": "https://zoom.us/j/1234567890"
  }'
```

### Use Case 3: Record Interview Feedback and Score
```bash
curl -X PUT http://localhost:3000/api/v1/interviews/i0000000-0000-0000-0000-000000000001/feedback \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "feedback": "Excellent communication skills, strong technical knowledge",
    "score": 8.5,
    "remarks": "Approved for next round"
  }'
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "i0000000-0000-0000-0000-000000000001",
    "feedback": "Excellent communication skills, strong technical knowledge",
    "score": 8.5,
    "remarks": "Approved for next round",
    "status": "scheduled",
    "updated_at": "2024-02-01T10:35:00Z"
  }
}
```

### Use Case 4: Mark Interview as Completed
```bash
curl -X PUT http://localhost:3000/api/v1/interviews/i0000000-0000-0000-0000-000000000001/complete \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "i0000000-0000-0000-0000-000000000001",
    "status": "completed",
    "updated_at": "2024-02-01T10:35:00Z"
  }
}
```

### Use Case 5: Reschedule Interview
```bash
curl -X PUT http://localhost:3000/api/v1/interviews/i0000000-0000-0000-0000-000000000002/reschedule \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduled_date": "2024-02-10",
    "scheduled_time": "15:00:00"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "i0000000-0000-0000-0000-000000000002",
    "scheduled_date": "2024-02-10",
    "scheduled_time": "15:00:00",
    "status": "rescheduled",
    "updated_at": "2024-02-02T09:15:00Z"
  }
}
```

### Use Case 6: Cancel Interview
```bash
curl -X PUT http://localhost:3000/api/v1/interviews/i0000000-0000-0000-0000-000000000003/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Candidate declined to proceed"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "i0000000-0000-0000-0000-000000000003",
    "status": "cancelled",
    "remarks": "Cancelled: Candidate declined to proceed",
    "updated_at": "2024-02-02T10:00:00Z"
  }
}
```

### Use Case 7: Get All Interviews for a Submission
```bash
curl -X GET "http://localhost:3000/api/v1/interviews/submission/a0000000-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "i0000000-0000-0000-0000-000000000001",
      "round": "screening",
      "scheduled_date": "2024-02-01",
      "status": "completed",
      "score": 8.5
    },
    {
      "id": "i0000000-0000-0000-0000-000000000002",
      "round": "first",
      "scheduled_date": "2024-02-05",
      "status": "scheduled",
      "score": null
    }
  ]
}
```

### Use Case 8: Get Interviewer's Schedule
```bash
curl -X GET "http://localhost:3000/api/v1/interviews?interviewer_id=u0000000-0000-0000-0000-000000000001&orderBy=scheduled_date&orderDirection=ASC" \
  -H "Authorization: Bearer <token>"
```

### Use Case 9: Get Interviews by Status
```bash
# Get all pending interviews
curl -X GET "http://localhost:3000/api/v1/interviews?status=scheduled&orderBy=scheduled_date&orderDirection=ASC" \
  -H "Authorization: Bearer <token>"

# Get all completed interviews
curl -X GET "http://localhost:3000/api/v1/interviews?status=completed" \
  -H "Authorization: Bearer <token>"
```

### Use Case 10: Get Interviews in Date Range
```bash
curl -X GET "http://localhost:3000/api/v1/interviews?from_date=2024-02-01&to_date=2024-02-28" \
  -H "Authorization: Bearer <token>"
```

## Status Codes & Errors

### Success Codes
- **200 OK**: GET, PUT operations
- **201 Created**: POST operations
- **204 No Content**: DELETE operations

### Error Codes
| Code | Error | Cause | Solution |
|------|-------|-------|----------|
| 400 | Bad Request | Invalid input data | Check DTO validation rules |
| 400 | Round already exists | Duplicate interview round | Check existing interviews for submission |
| 400 | Score must be 0-10 | Invalid score range | Ensure score is between 0 and 10 |
| 401 | Unauthorized | Missing/invalid token | Provide valid JWT token |
| 403 | Forbidden | Missing permission | User needs interviews:X permission |
| 404 | Not Found | Interview doesn't exist | Verify interview ID exists |
| 500 | Internal Server Error | Database/service error | Check server logs |

### Common Error Examples

**Duplicate Round**:
```json
{
  "statusCode": 400,
  "message": "Interview round first already exists for this submission",
  "error": "Bad Request"
}
```

**Invalid Score**:
```json
{
  "statusCode": 400,
  "message": "Score must be between 0 and 10",
  "error": "Bad Request"
}
```

**Not Found**:
```json
{
  "statusCode": 404,
  "message": "Interview not found",
  "error": "Not Found"
}
```

## Database Queries

### High-Performance Queries

**Get interviewer's upcoming interviews**:
```sql
SELECT * FROM interviews
WHERE company_id = $1 AND interviewer_id = $2 AND deleted_at IS NULL
AND status = 'scheduled' AND scheduled_date >= CURDATE()
ORDER BY scheduled_date ASC, scheduled_time ASC;
```

**Get interview statistics by round**:
```sql
SELECT round, COUNT(*) as total, 
       SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
       AVG(CAST(score AS FLOAT)) as avg_score
FROM interviews
WHERE company_id = $1 AND deleted_at IS NULL
GROUP BY round;
```

**Get all interviews for a submission with feedback**:
```sql
SELECT * FROM interviews
WHERE company_id = $1 AND submission_id = $2 AND deleted_at IS NULL
ORDER BY scheduled_date DESC;
```

**Get interviews by status and date**:
```sql
SELECT * FROM interviews
WHERE company_id = $1 AND status = $2 AND deleted_at IS NULL
AND scheduled_date >= $3 AND scheduled_date <= $4
ORDER BY scheduled_date ASC;
```

## Environment Setup

### Required Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/ats_db
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Run Database Migration
```bash
npm run typeorm migration:run -- -d src/database/config.ts
```

### Seed Sample Data
```bash
npm run seed -- --seed=CreateInterviewsSeeder
```

### Start Application
```bash
npm run start
```

## HTTP Request Examples

### Schedule with cURL
```bash
curl -X POST http://localhost:3000/api/v1/interviews \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "a0000000-0000-0000-0000-000000000001",
    "round": "screening",
    "scheduled_date": "2024-02-01",
    "scheduled_time": "10:00:00",
    "interviewer_id": "u0000000-0000-0000-0000-000000000001",
    "mode": "phone"
  }'
```

### Schedule with JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/api/v1/interviews', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    submission_id: 'a0000000-0000-0000-0000-000000000001',
    round: 'screening',
    scheduled_date: '2024-02-01',
    scheduled_time: '10:00:00',
    interviewer_id: 'u0000000-0000-0000-0000-000000000001',
    mode: 'phone'
  })
});
const data = await response.json();
```

### Schedule with Python
```python
import requests

response = requests.post(
    'http://localhost:3000/api/v1/interviews',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json={
        'submission_id': 'a0000000-0000-0000-0000-000000000001',
        'round': 'screening',
        'scheduled_date': '2024-02-01',
        'scheduled_time': '10:00:00',
        'interviewer_id': 'u0000000-0000-0000-0000-000000000001',
        'mode': 'phone'
    }
)
```

## Pagination Best Practices

### Get First Page (20 items)
```bash
GET /api/v1/interviews?skip=0&take=20&orderBy=scheduled_date&orderDirection=ASC
```

### Get Next Page
```bash
GET /api/v1/interviews?skip=20&take=20&orderBy=scheduled_date&orderDirection=ASC
```

### Get Interview Schedule for Week
```bash
GET /api/v1/interviews?from_date=2024-02-01&to_date=2024-02-07&orderBy=scheduled_date&orderDirection=ASC&take=50
```

## Filtering Combinations

### Interview Pipeline
```bash
# Get all screening rounds
GET /api/v1/interviews?round=screening

# Get all completed interviews
GET /api/v1/interviews?status=completed

# Get all pending interviews (scheduled)
GET /api/v1/interviews?status=scheduled&orderBy=scheduled_date&orderDirection=ASC
```

### Interviewer Management
```bash
# Get interviewer's interview schedule
GET /api/v1/interviews?interviewer_id=:id&status=scheduled&orderBy=scheduled_date

# Get interviewer's past interviews
GET /api/v1/interviews?interviewer_id=:id&status=completed&orderBy=scheduled_date&orderDirection=DESC
```

### Candidate Tracking
```bash
# Get all interviews for a submission
GET /api/v1/interviews/submission/:submission_id

# Get submission's completed interviews with feedback
GET /api/v1/interviews/submission/:submission_id?status=completed
```

### Analytics
```bash
# Get high-scoring interviews
GET /api/v1/interviews?status=completed&orderBy=score&orderDirection=DESC

# Get interviews from past month
GET /api/v1/interviews?status=completed&from_date=2024-01-01&to_date=2024-01-31
```

## Interview Round Types

| Round | Purpose | Typical Interviewer | Mode |
|-------|---------|-------------------|------|
| screening | Initial qualification | HR / Recruiter | Phone |
| first | Technical/skill assessment | Tech Lead | Online/Offline |
| second | Deeper technical assessment | Senior Engineer | Online/Offline |
| third | Team fit and culture | Hiring Manager | Online/Offline |
| final | Executive/decision maker | Director/Manager | Online/Offline |
| hr | Benefits and logistics | HR Manager | Phone/Online |
| technical | Specialized technical test | Principal Engineer | Online/Offline |

## Interview Mode Selection

| Mode | Use Case | Equipment |
|------|----------|-----------|
| phone | Initial screening, follow-ups | Phone line |
| online | Technical rounds, remote teams | Video conferencing (Zoom/Teams) |
| offline | Final rounds, on-site assessment | Physical office space |

## Score Interpretation

| Score Range | Assessment | Recommendation |
|-------------|------------|-----------------|
| 0-3 | Poor fit | Reject |
| 3-5 | Below expectations | Reject or wait for other rounds |
| 5-7 | Acceptable | Move to next round |
| 7-8.5 | Good fit | Advance |
| 8.5-10 | Excellent fit | Fast track / Strong candidate |

## Troubleshooting

### Interview Not Found
- Verify interview ID is correct UUID format
- Check interview hasn't been deleted
- Verify you're in the correct company context

### Cannot Schedule Duplicate Round
- Check if this round already exists for the submission
- Use GET to view all interviews for the submission
- Cancel or reschedule the existing round

### Permission Denied
- Check JWT token is valid and not expired
- Verify user role has `interviews:create/read/update/delete` permissions
- Check role-based access control configuration

### Feedback Recording Error
- Ensure score is between 0 and 10
- Provide feedback text (required)
- Check interview exists before updating

### Rescheduling Failed
- Verify new date is in valid format (YYYY-MM-DD)
- Verify new time is in valid format (HH:MM:SS)
- Check interview hasn't already been completed
