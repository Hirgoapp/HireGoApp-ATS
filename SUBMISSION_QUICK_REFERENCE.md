# Submission/Pipeline Module - Quick Reference

## Table of Contents
1. Quick API Reference
2. Common Use Cases
3. Status Codes & Errors
4. Database Queries
5. Environment Setup

## Quick API Reference

### Submission Endpoints

| Method | Endpoint | Permission | Purpose |
|--------|----------|------------|---------|
| POST | /api/v1/submissions | submissions:create | Create new submission |
| GET | /api/v1/submissions | submissions:read | List submissions |
| GET | /api/v1/submissions/:id | submissions:read | Get single submission |
| PUT | /api/v1/submissions/:id | submissions:update | Update submission |
| PUT | /api/v1/submissions/:id/stage | submissions:update | Move to new stage |
| PUT | /api/v1/submissions/:id/outcome | submissions:update | Record outcome |
| DELETE | /api/v1/submissions/:id | submissions:delete | Delete submission |
| GET | /api/v1/submissions/:id/history | submissions:read | Get audit trail |

## Common Use Cases

### Use Case 1: Create New Submission (Candidate Applies)
```bash
curl -X POST http://localhost:3000/api/v1/submissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "ca000000-0000-0000-0000-000000000001",
    "job_id": "j0000000-0000-0000-0000-000000000001",
    "current_stage": "applied",
    "submitted_at": "2024-01-15",
    "source": "LinkedIn",
    "tags": ["senior-level", "technical"]
  }'
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "company_id": "c0000000-0000-0000-0000-000000000001",
    "candidate_id": "ca000000-0000-0000-0000-000000000001",
    "job_id": "j0000000-0000-0000-0000-000000000001",
    "current_stage": "applied",
    "submitted_at": "2024-01-15",
    "moved_to_stage_at": "2024-01-15",
    "outcome": null,
    "score": null,
    "tags": ["senior-level", "technical"],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Use Case 2: Move Candidate to Phone Interview Stage
```bash
curl -X PUT http://localhost:3000/api/v1/submissions/a0000000-0000-0000-0000-000000000001/stage \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_stage": "phone-interview",
    "stage_change_reason": "Passed initial screening"
  }'
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "current_stage": "phone-interview",
    "moved_to_stage_at": "2024-01-16",
    "updated_at": "2024-01-16T14:22:00Z"
  }
}
```

### Use Case 3: Record Rejection
```bash
curl -X PUT http://localhost:3000/api/v1/submissions/a0000000-0000-0000-0000-000000000001/outcome \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "outcome": "rejected",
    "reason": "Did not meet technical requirements"
  }'
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "outcome": "rejected",
    "outcome_date": "2024-01-16",
    "updated_at": "2024-01-16T15:45:00Z"
  }
}
```

### Use Case 4: Extend Offer and Mark as Joined
```bash
# 1. First move to offer stage
curl -X PUT http://localhost:3000/api/v1/submissions/a0000000-0000-0000-0000-000000000002/stage \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_stage": "offer"
  }'

# 2. Record joined outcome when offer accepted
curl -X PUT http://localhost:3000/api/v1/submissions/a0000000-0000-0000-0000-000000000002/outcome \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "outcome": "joined",
    "reason": "Offer accepted, onboarding scheduled Feb 1"
  }'
```

### Use Case 5: View Submission History
```bash
curl -X GET http://localhost:3000/api/v1/submissions/a0000000-0000-0000-0000-000000000001/history \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "h0000000-0000-0000-0000-000000000001",
      "moved_from_stage": null,
      "moved_to_stage": "applied",
      "reason": "Initial submission",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "h0000000-0000-0000-0000-000000000002",
      "moved_from_stage": "applied",
      "moved_to_stage": "phone-interview",
      "reason": "Passed initial screening",
      "created_at": "2024-01-16T14:22:00Z"
    },
    {
      "id": "h0000000-0000-0000-0000-000000000003",
      "moved_from_stage": "phone-interview",
      "moved_to_stage": "interview",
      "reason": "Qualified for technical assessment",
      "created_at": "2024-01-17T09:15:00Z"
    }
  ]
}
```

### Use Case 6: List All Submissions for a Job
```bash
curl -X GET "http://localhost:3000/api/v1/submissions?job_id=j0000000-0000-0000-0000-000000000001&take=20" \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "a0000000-0000-0000-0000-000000000001",
      "candidate_id": "ca000000-0000-0000-0000-000000000001",
      "job_id": "j0000000-0000-0000-0000-000000000001",
      "current_stage": "interview",
      "outcome": null,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "a0000000-0000-0000-0000-000000000002",
      "candidate_id": "ca000000-0000-0000-0000-000000000002",
      "job_id": "j0000000-0000-0000-0000-000000000001",
      "current_stage": "offer",
      "outcome": "joined",
      "created_at": "2024-01-14T11:00:00Z"
    }
  ],
  "total": 2
}
```

### Use Case 7: Get All Submissions by Stage
```bash
curl -X GET "http://localhost:3000/api/v1/submissions?current_stage=phone-interview&orderBy=created_at&orderDirection=DESC" \
  -H "Authorization: Bearer <token>"
```

### Use Case 8: List Hired Candidates
```bash
curl -X GET "http://localhost:3000/api/v1/submissions?outcome=joined&orderBy=moved_to_stage_at&orderDirection=DESC" \
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
| 400 | Candidate has already applied | Duplicate submission | Handle duplicate application |
| 401 | Unauthorized | Missing/invalid token | Provide valid JWT token |
| 403 | Forbidden | Missing permission | User needs submissions:X permission |
| 404 | Not Found | Submission doesn't exist | Verify submission ID exists |
| 409 | Conflict | Business logic violation | Check for duplicate candidates |
| 500 | Internal Server Error | Database/service error | Check server logs |

### Common Error Examples

**Duplicate Application**:
```json
{
  "statusCode": 400,
  "message": "Candidate has already applied to this job",
  "error": "Bad Request"
}
```

**Not Found**:
```json
{
  "statusCode": 404,
  "message": "Submission not found",
  "error": "Not Found"
}
```

**Permission Denied**:
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions: submissions:create required",
  "error": "Forbidden"
}
```

## Database Queries

### High-Performance Queries

**Get pipeline funnel (submissions by stage)**:
```sql
SELECT current_stage, COUNT(*) as count
FROM submissions
WHERE company_id = $1 AND deleted_at IS NULL
GROUP BY current_stage
ORDER BY created_at DESC;
```

**Get hiring metrics (outcomes)**:
```sql
SELECT outcome, COUNT(*) as count
FROM submissions
WHERE company_id = $1 AND deleted_at IS NULL AND outcome IS NOT NULL
GROUP BY outcome;
```

**Get all applications for a job with candidate info**:
```sql
SELECT s.* FROM submissions s
WHERE s.company_id = $1 AND s.job_id = $2 AND s.deleted_at IS NULL
ORDER BY s.created_at DESC;
```

**Get all applications from a candidate**:
```sql
SELECT s.* FROM submissions s
WHERE s.company_id = $1 AND s.candidate_id = $2 AND s.deleted_at IS NULL
ORDER BY s.created_at DESC;
```

**Get submission timeline (history)**:
```sql
SELECT sh.*, u.email
FROM submission_histories sh
LEFT JOIN users u ON sh.created_by_id = u.id
WHERE sh.submission_id = $1
ORDER BY sh.created_at ASC;
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
npm run seed -- --seed=CreateSubmissionsSeeder
```

### Start Application
```bash
npm run start
```

## HTTP Request Examples

### Create with cURL
```bash
curl -X POST http://localhost:3000/api/v1/submissions \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "ca000000-0000-0000-0000-000000000001",
    "job_id": "j0000000-0000-0000-0000-000000000001",
    "current_stage": "applied"
  }'
```

### Create with JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/api/v1/submissions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    candidate_id: 'ca000000-0000-0000-0000-000000000001',
    job_id: 'j0000000-0000-0000-0000-000000000001',
    current_stage: 'applied'
  })
});
const data = await response.json();
```

### Create with Python
```python
import requests

response = requests.post(
    'http://localhost:3000/api/v1/submissions',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json={
        'candidate_id': 'ca000000-0000-0000-0000-000000000001',
        'job_id': 'j0000000-0000-0000-0000-000000000001',
        'current_stage': 'applied'
    }
)
```

## Pagination Best Practices

### Get First Page (20 items)
```bash
GET /api/v1/submissions?skip=0&take=20
```

### Get Next Page
```bash
GET /api/v1/submissions?skip=20&take=20
```

### Get Last Page Logic
```javascript
// Total: 150 submissions
// Page size: 20
// Last page starts at: Math.floor(150 / 20) * 20 = 140
GET /api/v1/submissions?skip=140&take=20
```

## Filtering Combinations

### Pipeline Analysis
```bash
# Get all phone interviews
GET /api/v1/submissions?current_stage=phone-interview

# Get all rejections
GET /api/v1/submissions?outcome=rejected

# Get all who joined in last 30 days
GET /api/v1/submissions?outcome=joined&orderBy=outcome_date&orderDirection=DESC
```

### Candidate Tracking
```bash
# All applications from single candidate
GET /api/v1/submissions?candidate_id=ca000000-0000-0000-0000-000000000001

# Candidate's active applications (exclude rejected/withdrawn)
GET /api/v1/submissions?candidate_id=ca000000-0000-0000-0000-000000000001
```

### Job Analysis
```bash
# Get all applicants for a job
GET /api/v1/submissions?job_id=j0000000-0000-0000-0000-000000000001

# Get most recent applicants
GET /api/v1/submissions?job_id=j0000000-0000-0000-0000-000000000001&orderBy=created_at&orderDirection=DESC

# Get qualified candidates for a job
GET /api/v1/submissions?job_id=j0000000-0000-0000-0000-000000000001&current_stage=interview&orderBy=score&orderDirection=DESC
```

## Custom Fields Integration

### Create with Custom Fields
```bash
curl -X POST http://localhost:3000/api/v1/submissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "ca000000-0000-0000-0000-000000000001",
    "job_id": "j0000000-0000-0000-0000-000000000001",
    "current_stage": "applied",
    "customFields": {
      "interview_notes": "Great communication skills",
      "technical_score": 85,
      "cultural_fit": true
    }
  }'
```

### Get with Custom Fields
```bash
GET /api/v1/submissions/a0000000-0000-0000-0000-000000000001?includeCustomFields=true
```

## Troubleshooting

### Submission Not Found
- Verify submission ID is correct UUID format
- Check submission hasn't been deleted
- Verify you're in the correct company context

### Permission Denied
- Check JWT token is valid and not expired
- Verify user role has `submissions:create/read/update/delete` permissions
- Check role-based access control configuration

### Duplicate Error
- Check if candidate has already applied to this job
- Use `findByCandidate` or `findByJob` to check existing submissions

### Custom Field Error
- Verify custom field key exists in CustomFieldsService
- Check field value matches expected type
- Validate field is in correct format (JSON for arrays, etc.)
