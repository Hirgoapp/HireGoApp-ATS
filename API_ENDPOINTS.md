# ATS SaaS - API Endpoints Reference

## Base URL
```
http://localhost:3000/api/v1
https://api.ats.com/api/v1 (production)
```

## Authentication
All endpoints (except `/auth/login` and `/auth/register`) require JWT token:
```
Authorization: Bearer <jwt_token>
```

The JWT token includes:
```json
{
  "sub": "user_id",
  "email": "user@company.com",
  "companyId": "company_uuid",
  "role": "admin|recruiter|hiring_manager|viewer"
}
```

---

## Error Response Format

All endpoints return consistent error responses:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "BadRequestException",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2025-01-01T12:00:00Z",
  "path": "/api/v1/candidates"
}
```

---

## Success Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Request successful",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

For paginated responses:
```json
{
  "success": true,
  "statusCode": 200,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "pages": 5,
    "currentPage": 1
  }
}
```

---

## Auth Endpoints

### `POST /auth/register`
**Description**: Register a new company and admin user
**Auth**: None
**Body**:
```json
{
  "companyName": "TechCorp Recruitment",
  "email": "admin@techcorp.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```
**Response (201)**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "companyId": "uuid",
    "email": "admin@techcorp.com",
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### `POST /auth/login`
**Description**: Login user
**Auth**: None
**Body**:
```json
{
  "email": "user@company.com",
  "password": "password"
}
```
**Response (200)**:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "firstName": "John",
      "role": "admin",
      "company": {
        "id": "uuid",
        "name": "TechCorp"
      }
    }
  }
}
```

### `POST /auth/refresh`
**Description**: Refresh access token
**Auth**: Required (refresh token in body)
**Body**:
```json
{
  "refreshToken": "refresh_token"
}
```
**Response (200)**: New JWT token

### `POST /auth/logout`
**Description**: Logout user
**Auth**: Required
**Response (200)**: Success message

### `POST /auth/forgot-password`
**Description**: Request password reset
**Auth**: None
**Body**:
```json
{
  "email": "user@company.com"
}
```
**Response (200)**: Email sent confirmation

### `POST /auth/reset-password`
**Description**: Reset password with token
**Auth**: None
**Body**:
```json
{
  "token": "reset_token",
  "password": "NewPassword123!"
}
```
**Response (200)**: Password reset successful

---

## Companies Endpoints

### `GET /companies/me`
**Description**: Get current company details
**Auth**: Required
**Query Params**: None
**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "TechCorp",
    "slug": "techcorp",
    "email": "admin@techcorp.com",
    "licenseTier": "premium",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "settings": {
      "timezone": "UTC",
      "dateFormat": "MM/DD/YYYY",
      "currency": "USD"
    },
    "featureFlags": {
      "customFields": true,
      "advancedAnalytics": true,
      "apiAccess": true
    }
  }
}
```

### `PUT /companies/me`
**Description**: Update company settings
**Auth**: Required (admin role)
**Body**:
```json
{
  "name": "Updated Company Name",
  "settings": {
    "timezone": "America/New_York",
    "dateFormat": "DD/MM/YYYY"
  }
}
```
**Response (200)**: Updated company object

### `PUT /companies/me/settings`
**Description**: Update company-wide settings
**Auth**: Required (admin role)
**Body**:
```json
{
  "timezone": "America/New_York",
  "dateFormat": "DD/MM/YYYY",
  "currency": "EUR"
}
```
**Response (200)**: Updated settings

### `GET /companies/me/license`
**Description**: Get current license info
**Auth**: Required (admin role)
**Response (200)**:
```json
{
  "success": true,
  "data": {
    "tier": "premium",
    "features": ["customFields", "advancedAnalytics", "apiAccess"],
    "quotas": {
      "customFields": 100,
      "users": 50,
      "candidates": 10000
    },
    "usageCount": {
      "customFields": 25,
      "users": 12,
      "candidates": 3500
    },
    "renewalDate": "2025-12-31"
  }
}
```

---

## Users Endpoints

### `GET /users`
**Description**: List company users with pagination
**Auth**: Required (admin/recruiter)
**Query Params**:
```
?limit=20&offset=0&role=recruiter&search=john&sort=-createdAt
```
**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@company.com",
      "role": "recruiter",
      "department": "Recruiting",
      "isActive": true,
      "lastLoginAt": "2025-01-15T10:30:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### `GET /users/:id`
**Description**: Get user details
**Auth**: Required
**Response (200)**: User object

### `POST /users`
**Description**: Create new user (invite to company)
**Auth**: Required (admin)
**Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@company.com",
  "role": "recruiter",
  "department": "Recruiting"
}
```
**Response (201)**: Created user + invitation email sent

### `PUT /users/:id`
**Description**: Update user details
**Auth**: Required (admin or self)
**Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "jobTitle": "Senior Recruiter",
  "department": "Recruiting"
}
```
**Response (200)**: Updated user

### `PUT /users/:id/role`
**Description**: Update user role
**Auth**: Required (admin only)
**Body**:
```json
{
  "role": "hiring_manager"
}
```
**Response (200)**: Updated user

### `DELETE /users/:id`
**Description**: Deactivate user (soft delete)
**Auth**: Required (admin)
**Response (200)**: Deactivation confirmed

### `POST /users/:id/resend-invitation`
**Description**: Resend invitation email
**Auth**: Required (admin)
**Response (200)**: Invitation sent

### `GET /users/me`
**Description**: Get current user profile
**Auth**: Required
**Response (200)**: Current user object

### `PUT /users/me`
**Description**: Update own profile
**Auth**: Required
**Body**:
```json
{
  "firstName": "John",
  "jobTitle": "Senior Recruiter"
}
```
**Response (200)**: Updated user

### `PUT /users/me/password`
**Description**: Change own password
**Auth**: Required
**Body**:
```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123!"
}
```
**Response (200)**: Password changed

### `PUT /users/me/preferences`
**Description**: Update user preferences
**Auth**: Required
**Body**:
```json
{
  "theme": "dark",
  "emailNotifications": true,
  "inAppNotifications": true,
  "language": "en"
}
```
**Response (200)**: Updated preferences

---

## Candidates Endpoints

### `GET /candidates`
**Description**: List candidates with advanced filtering
**Auth**: Required
**Query Params**:
```
?limit=50&offset=0&search=john&status=active&source=linkedin&tags=senior,python&sort=-createdAt
```
**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "currentCompany": "TechCo",
      "currentJobTitle": "Senior Developer",
      "experienceYears": 8,
      "location": "San Francisco, CA",
      "status": "active",
      "rating": 4.5,
      "tags": ["python", "senior", "backend"],
      "source": "linkedin",
      "customFields": { ... },
      "createdAt": "2025-01-10T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### `POST /candidates`
**Description**: Create new candidate
**Auth**: Required (recruiter+)
**Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "currentCompany": "StartupXYZ",
  "currentJobTitle": "Product Manager",
  "experienceYears": 5,
  "location": "New York, NY",
  "source": "referral",
  "summary": "Experienced PM with strong background in B2B SaaS",
  "linkedinUrl": "https://linkedin.com/in/jane",
  "customFields": {
    "field_id_1": "value",
    "field_id_2": "value"
  }
}
```
**Response (201)**: Created candidate

### `GET /candidates/:id`
**Description**: Get candidate profile
**Auth**: Required
**Response (200)**: Full candidate object with related data

### `PUT /candidates/:id`
**Description**: Update candidate
**Auth**: Required
**Body**: Any updatable fields
**Response (200)**: Updated candidate

### `PUT /candidates/:id/status`
**Description**: Update candidate status
**Auth**: Required
**Body**:
```json
{
  "status": "hired|archived|rejected"
}
```
**Response (200)**: Updated

### `PUT /candidates/:id/rating`
**Description**: Rate candidate
**Auth**: Required
**Body**:
```json
{
  "rating": 4.5
}
```
**Response (200)**: Updated

### `DELETE /candidates/:id`
**Description**: Soft delete candidate
**Auth**: Required (admin+)
**Response (200)**: Deleted

### `POST /candidates/import`
**Description**: Bulk import candidates from CSV
**Auth**: Required (admin/recruiter)
**Body**: Multipart form-data with CSV file
**Response (202)**: Import queued

### `GET /candidates/:id/applications`
**Description**: Get all applications for candidate
**Auth**: Required
**Response (200)**: Array of applications

### `PUT /candidates/:id/merge`
**Description**: Merge duplicate candidates
**Auth**: Required (admin+)
**Body**:
```json
{
  "mergeWithCandidateId": "uuid",
  "keepData": "primary_candidate" // or "merge_candidate"
}
```
**Response (200)**: Merged result

---

## Jobs Endpoints

### `GET /jobs`
**Description**: List jobs with filters
**Auth**: Required
**Query Params**:
```
?limit=50&offset=0&status=open&department=sales&search=manager&sort=-createdAt
```
**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Senior Recruiter",
      "department": "HR",
      "location": "San Francisco, CA",
      "status": "open",
      "jobCode": "JOB-001",
      "employmentType": "full_time",
      "salaryMin": 80000,
      "salaryMax": 120000,
      "salaryCurrency": "USD",
      "pipelineId": "uuid",
      "hiringManagerId": "uuid",
      "createdBy": { ... },
      "applicationCount": 15,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### `POST /jobs`
**Description**: Create job posting
**Auth**: Required (recruiter+)
**Body**:
```json
{
  "title": "Senior Developer",
  "description": "We're looking for...",
  "requirements": "5+ years experience...",
  "department": "Engineering",
  "location": "Remote",
  "employmentType": "full_time",
  "salaryMin": 120000,
  "salaryMax": 160000,
  "salaryCurrency": "USD",
  "pipelineId": "uuid",
  "hiringManagerId": "uuid"
}
```
**Response (201)**: Created job

### `GET /jobs/:id`
**Description**: Get job details
**Auth**: Required
**Response (200)**: Full job object

### `PUT /jobs/:id`
**Description**: Update job
**Auth**: Required (recruiter+)
**Response (200)**: Updated job

### `PUT /jobs/:id/status`
**Description**: Update job status (open/closed/paused/draft)
**Auth**: Required
**Body**:
```json
{
  "status": "closed"
}
```
**Response (200)**: Updated

### `DELETE /jobs/:id`
**Description**: Delete job (soft delete)
**Auth**: Required (admin+)
**Response (200)**: Deleted

### `GET /jobs/:id/applications`
**Description**: Get all applications for job
**Auth**: Required
**Query Params**: ?limit=50&offset=0&stage=screening
**Response (200)**: Paginated applications

### `GET /jobs/:id/analytics`
**Description**: Get job analytics
**Auth**: Required
**Response (200)**:
```json
{
  "success": true,
  "data": {
    "totalApplications": 45,
    "stageBreakdown": {
      "applied": 45,
      "screening": 12,
      "interview": 5,
      "offer": 2,
      "hired": 1
    },
    "timeToHire": 28,
    "conversionRate": 2.2,
    "topSources": ["linkedin", "job_board"]
  }
}
```

---

## Applications Endpoints

### `GET /applications`
**Description**: List applications with advanced filtering
**Auth**: Required
**Query Params**:
```
?limit=50&offset=0&jobId=uuid&stage=screening&candidateId=uuid&search=john&sort=-createdAt
```
**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "jobId": "uuid",
      "candidateId": "uuid",
      "job": { ... },
      "candidate": { ... },
      "currentStageId": "uuid",
      "currentStageName": "Screening",
      "appliedAt": "2025-01-10T00:00:00Z",
      "rating": 4.0,
      "nextInterviewAt": "2025-01-20T14:00:00Z",
      "evaluations": [ ... ],
      "customFields": { ... }
    }
  ],
  "pagination": { ... }
}
```

### `POST /applications`
**Description**: Create new application
**Auth**: Required
**Body**:
```json
{
  "jobId": "uuid",
  "candidateId": "uuid",
  "source": "direct",
  "customFields": { ... }
}
```
**Response (201)**: Created application

### `GET /applications/:id`
**Description**: Get application details
**Auth**: Required
**Response (200)**: Full application

### `PUT /applications/:id`
**Description**: Update application
**Auth**: Required
**Body**: Updatable fields
**Response (200)**: Updated

### `PUT /applications/:id/stage`
**Description**: Move application to different stage
**Auth**: Required
**Body**:
```json
{
  "stageId": "uuid"
}
```
**Response (200)**: Updated

### `POST /applications/:id/evaluations`
**Description**: Add evaluation/feedback
**Auth**: Required
**Body**:
```json
{
  "score": 8,
  "feedback": "Strong technical background, great communication skills"
}
```
**Response (201)**: Created evaluation

### `GET /applications/:id/evaluations`
**Description**: Get all evaluations for application
**Auth**: Required
**Response (200)**: Array of evaluations

### `POST /applications/:id/schedule-interview`
**Description**: Schedule interview
**Auth**: Required
**Body**:
```json
{
  "interviewerIds": ["uuid1", "uuid2"],
  "scheduledAt": "2025-01-20T14:00:00Z",
  "duration": 60,
  "notes": "Technical round"
}
```
**Response (201)**: Interview scheduled

### `PUT /applications/:id/reject`
**Description**: Reject application
**Auth**: Required
**Body**:
```json
{
  "reason": "Not a good fit"
}
```
**Response (200)**: Rejected

### `PUT /applications/:id/hire`
**Description**: Move application to hired
**Auth**: Required (hiring manager+)
**Body**:
```json
{
  "notes": "Offer accepted"
}
```
**Response (200)**: Hired

### `POST /applications/bulk-action`
**Description**: Bulk move/reject/hire applications
**Auth**: Required
**Body**:
```json
{
  "action": "move_stage|reject|hire",
  "applicationIds": ["uuid1", "uuid2", "uuid3"],
  "payload": {
    "stageId": "uuid" // for move_stage
  }
}
```
**Response (200)**: Bulk action result

---

## Pipelines Endpoints

### `GET /pipelines`
**Description**: List company pipelines
**Auth**: Required
**Response (200)**: Array of pipelines

### `POST /pipelines`
**Description**: Create new pipeline
**Auth**: Required (admin/recruiter)
**Body**:
```json
{
  "name": "Sales Pipeline",
  "description": "For sales positions",
  "isDefault": false
}
```
**Response (201)**: Created pipeline

### `GET /pipelines/:id`
**Description**: Get pipeline with stages
**Auth**: Required
**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Sales Pipeline",
    "stages": [
      {
        "id": "uuid",
        "name": "Applied",
        "orderIndex": 1,
        "isTerminal": false
      },
      { ... }
    ]
  }
}
```

### `PUT /pipelines/:id`
**Description**: Update pipeline
**Auth**: Required (admin+)
**Response (200)**: Updated

### `DELETE /pipelines/:id`
**Description**: Delete pipeline (cannot delete if has active applications)
**Auth**: Required (admin+)
**Response (200)**: Deleted

### `GET /pipelines/:id/stages`
**Description**: Get all stages in pipeline
**Auth**: Required
**Response (200)**: Array of stages

### `POST /pipelines/:id/stages`
**Description**: Add stage to pipeline
**Auth**: Required (admin+)
**Body**:
```json
{
  "name": "Interview",
  "orderIndex": 2,
  "colorHex": "#FF5733"
}
```
**Response (201)**: Created stage

### `PUT /pipelines/:pipelineId/stages/:stageId`
**Description**: Update stage
**Auth**: Required (admin+)
**Response (200)**: Updated

### `DELETE /pipelines/:pipelineId/stages/:stageId`
**Description**: Delete stage
**Auth**: Required (admin+)
**Response (200)**: Deleted

---

## Custom Fields Endpoints

### `GET /custom-fields`
**Description**: List custom fields
**Auth**: Required
**Query Params**: ?entityType=candidate|job|application
**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fieldName": "Skills",
      "fieldSlug": "skills",
      "fieldType": "multiselect",
      "entityType": "candidate",
      "isRequired": false,
      "options": ["Python", "JavaScript", "Java"],
      "orderIndex": 1,
      "isVisible": true
    }
  ]
}
```

### `POST /custom-fields`
**Description**: Create custom field
**Auth**: Required (admin+)
**Body**:
```json
{
  "entityType": "candidate",
  "fieldName": "Skills",
  "fieldSlug": "skills",
  "fieldType": "multiselect",
  "options": ["Python", "JavaScript", "Java"],
  "isRequired": false,
  "isVisible": true,
  "helpText": "What programming languages does the candidate know?"
}
```
**Response (201)**: Created

### `PUT /custom-fields/:id`
**Description**: Update custom field
**Auth**: Required (admin+)
**Response (200)**: Updated

### `DELETE /custom-fields/:id`
**Description**: Delete custom field
**Auth**: Required (admin+)
**Response (200)**: Deleted

---

## Documents Endpoints

### `POST /documents/upload`
**Description**: Upload resume or document
**Auth**: Required
**Body**: Multipart form-data
```
candidateId: uuid
documentType: resume|cover_letter|portfolio
file: <binary>
```
**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "candidateId": "uuid",
    "fileName": "resume.pdf",
    "documentType": "resume",
    "uploadedAt": "2025-01-15T10:00:00Z"
  }
}
```

### `GET /documents/:id/download`
**Description**: Download document
**Auth**: Required
**Response (200)**: File download

### `DELETE /documents/:id`
**Description**: Delete document
**Auth**: Required
**Response (200)**: Deleted

### `GET /candidates/:candidateId/documents`
**Description**: List candidate documents
**Auth**: Required
**Response (200)**: Array of documents

---

## Notifications Endpoints

### `GET /notifications`
**Description**: Get user notifications
**Auth**: Required
**Query Params**: ?limit=50&unreadOnly=true
**Response (200)**: Array of notifications

### `GET /notifications/unread-count`
**Description**: Get unread notification count
**Auth**: Required
**Response (200)**:
```json
{
  "success": true,
  "data": { "count": 5 }
}
```

### `PUT /notifications/:id/read`
**Description**: Mark notification as read
**Auth**: Required
**Response (200)**: Updated

### `PUT /notifications/mark-all-read`
**Description**: Mark all notifications as read
**Auth**: Required
**Response (200)**: Updated

### `DELETE /notifications/:id`
**Description**: Delete notification
**Auth**: Required
**Response (200)**: Deleted

---

## Analytics Endpoints

### `GET /analytics/funnel`
**Description**: Get recruitment funnel analytics
**Auth**: Required
**Query Params**: ?jobId=uuid&startDate=2025-01-01&endDate=2025-01-31
**Response (200)**:
```json
{
  "success": true,
  "data": {
    "applied": 100,
    "screening": 40,
    "interview": 12,
    "offer": 3,
    "hired": 1,
    "conversionRate": 1.0
  }
}
```

### `GET /analytics/time-to-hire`
**Description**: Get time-to-hire metrics
**Auth**: Required
**Query Params**: ?startDate=2025-01-01&endDate=2025-01-31
**Response (200)**:
```json
{
  "success": true,
  "data": {
    "average": 28,
    "median": 25,
    "min": 5,
    "max": 90,
    "byDepartment": { ... }
  }
}
```

### `GET /analytics/sources`
**Description**: Get source effectiveness analytics
**Auth**: Required
**Response (200)**:
```json
{
  "success": true,
  "data": {
    "linkedin": { "applications": 150, "hires": 5, "conversionRate": 3.3 },
    "job_board": { "applications": 80, "hires": 2, "conversionRate": 2.5 },
    "referral": { "applications": 20, "hires": 2, "conversionRate": 10.0 }
  }
}
```

### `POST /analytics/report`
**Description**: Generate custom report (CSV/PDF)
**Auth**: Required
**Body**:
```json
{
  "reportType": "recruitment_summary|funnel|sources|time_to_hire",
  "format": "csv|pdf",
  "filters": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "department": "sales"
  }
}
```
**Response (202)**: Report generation queued, email when ready

---

## Webhooks Endpoints

### `GET /webhooks`
**Description**: List webhook subscriptions
**Auth**: Required (admin+)
**Response (200)**: Array of subscriptions

### `POST /webhooks`
**Description**: Create webhook subscription
**Auth**: Required (admin+)
**Body**:
```json
{
  "eventType": "application.created",
  "webhookUrl": "https://external.com/webhook",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```
**Response (201)**: Created

### `DELETE /webhooks/:id`
**Description**: Delete webhook
**Auth**: Required (admin+)
**Response (200)**: Deleted

### `GET /webhooks/:id/logs`
**Description**: Get webhook delivery logs
**Auth**: Required (admin+)
**Query Params**: ?limit=50&offset=0&status=success|failed
**Response (200)**: Array of logs

---

## API Keys Endpoints

### `GET /api-keys`
**Description**: List API keys
**Auth**: Required (admin+)
**Response (200)**: Array of keys (without secrets)

### `POST /api-keys`
**Description**: Generate new API key
**Auth**: Required (admin+)
**Body**:
```json
{
  "name": "Mobile App Integration",
  "scopes": ["read", "write"],
  "expiresIn": "1y"
}
```
**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Mobile App Integration",
    "keyPreview": "redacted_key_preview",
    "key": "redacted_key_value", // Full key shown once
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

### `DELETE /api-keys/:id`
**Description**: Revoke API key
**Auth**: Required (admin+)
**Response (200)**: Revoked

---

## Health Endpoints

### `GET /health`
**Description**: API health check
**Auth**: None
**Response (200)**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:00:00Z",
  "uptime": 3600
}
```

### `GET /health/detailed`
**Description**: Detailed health check (database, cache, S3)
**Auth**: None
**Response (200)**:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "s3": "connected",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

## Pagination & Filtering Standards

### Query Parameters
```
limit: 1-100 (default: 20)
offset: 0+ (default: 0)
sort: field name, prefix with - for DESC (default: -createdAt)
search: full-text search
filters: JSON string or query string params
```

### Example Calls
```
GET /candidates?limit=50&offset=0&status=active&source=linkedin&search=john&sort=-createdAt
GET /jobs?limit=20&offset=40&department=engineering&status=open
GET /applications?limit=100&jobId=uuid&stage=interview
```

### Response Pagination
```json
{
  "pagination": {
    "total": 250,
    "limit": 20,
    "offset": 0,
    "pages": 13,
    "currentPage": 1,
    "hasMore": true
  }
}
```

---

## Rate Limiting

All endpoints are rate-limited per tenant:
- **Default**: 100 requests per minute per user
- **Burst**: 1000 requests per minute per tenant
- **API Key**: 10,000 requests per day

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642259400
```

---

## API Versioning

Current version: **v1**

Breaking changes in new versions:
- URL changes: `/api/v2/...`
- Old version continues to work (with deprecation warnings)
- Deprecation notice in response headers: `Deprecation: true`, `Sunset: <date>`

