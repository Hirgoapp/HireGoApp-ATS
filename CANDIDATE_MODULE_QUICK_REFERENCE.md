# Candidate Module - Quick Reference

## 🚀 Quick Start

### Import Module
```typescript
// src/app.module.ts
import { CandidateModule } from './candidates/candidate.module';

@Module({
  imports: [CandidateModule]
})
export class AppModule {}
```

### Run Migration
```bash
npm run typeorm migration:run
```

### Seed Data
```bash
npm run seed:candidates
```

## 📋 API Endpoints (7 total)

```
POST   /api/v1/candidates                    Create candidate
GET    /api/v1/candidates                    List candidates (paginated, filterable)
GET    /api/v1/candidates/:id                Get single candidate
PUT    /api/v1/candidates/:id                Update candidate
DELETE /api/v1/candidates/:id                Delete candidate (soft)
GET    /api/v1/candidates/stats/count        Get candidate count
PUT    /api/v1/candidates/bulk/update        Bulk update candidates
```

## 🔐 RBAC Permissions

```
candidates:create    - Create new candidate
candidates:read      - List and view candidates
candidates:update    - Update candidate
candidates:delete    - Delete candidate
```

## 📊 Database Schema

**26 columns** in candidates table:

### Basic Information
- `first_name` (VARCHAR, required)
- `last_name` (VARCHAR, required)
- `email` (VARCHAR, unique per company)
- `phone` (VARCHAR)

### Professional
- `title` (VARCHAR)
- `current_company` (VARCHAR)
- `years_of_experience` (INT)
- `summary` (TEXT)

### Location
- `city` (VARCHAR)
- `country` (VARCHAR)
- `timezone` (VARCHAR)

### Availability
- `availability_date` (DATE)
- `notice_period` (VARCHAR)

### Status & Rating
- `status` (ENUM) - active, applied, interviewing, offer, hired, rejected, inactive
- `rating` (NUMERIC 0-5)

### Links
- `linkedin_url` (VARCHAR)
- `portfolio_url` (VARCHAR)
- `resume_url` (VARCHAR)

### Metadata
- `internal_notes` (TEXT)
- `tags` (JSONB array)
- `source` (VARCHAR) - linkedin, referral, job_board, recruiter, website

### Audit
- `created_by_id` (UUID)
- `updated_by_id` (UUID)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `deleted_at` (TIMESTAMP, soft delete)

## 📝 DTOs

### CreateCandidateDto
All fields from basic info to metadata, plus `customFields` (object)

### UpdateCandidateDto
Partial version of CreateCandidateDto - all fields optional

### GetCandidateDto
Response DTO with typed fields + optional `customFields`

## 🔄 Service Methods

```typescript
// Create
create(companyId, userId, dto): Promise<GetCandidateDto>

// Read
getCandidate(companyId, candidateId, includeCustomFields): Promise<GetCandidateDto>
getCandidates(companyId, options): Promise<{data, total}>
getCount(companyId): Promise<number>

// Update
update(companyId, candidateId, userId, dto): Promise<GetCandidateDto>
bulkUpdate(companyId, candidateIds, userId, updates): Promise<{updated, failed, errors}>

// Delete
delete(companyId, candidateId, userId): Promise<void>
```

## 🗂️ Repository Methods

```typescript
create(candidate): Promise<Candidate>
findById(companyId, candidateId): Promise<Candidate>
findByEmail(companyId, email): Promise<Candidate>
findByIds(companyId, candidateIds): Promise<Candidate[]>
findByCompany(companyId, options): Promise<{data, total}>
findByStatus(companyId, status): Promise<Candidate[]>
findBySource(companyId, source): Promise<Candidate[]>
update(candidate): Promise<Candidate>
softDelete(companyId, candidateId): Promise<void>
countByCompany(companyId): Promise<number>
```

## 📝 Create Example

```bash
curl -X POST http://localhost:3000/api/v1/candidates \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com",
    "phone": "+1-555-0101",
    "title": "Senior Software Engineer",
    "current_company": "Tech Corp",
    "years_of_experience": 8,
    "city": "San Francisco",
    "country": "USA",
    "timezone": "America/Los_Angeles",
    "status": "active",
    "rating": 4.5,
    "tags": ["backend", "nodejs"],
    "source": "linkedin",
    "customFields": {
      "certifications": ["aws", "kubernetes"]
    }
  }'
```

## 📖 List with Filtering

```bash
# List with pagination
curl "http://localhost:3000/api/v1/candidates?skip=0&take=20" \
  -H "Authorization: Bearer TOKEN"

# Filter by status
curl "http://localhost:3000/api/v1/candidates?status=interviewing" \
  -H "Authorization: Bearer TOKEN"

# Search by name/email
curl "http://localhost:3000/api/v1/candidates?search=john" \
  -H "Authorization: Bearer TOKEN"

# With custom fields
curl "http://localhost:3000/api/v1/candidates?includeCustomFields=true" \
  -H "Authorization: Bearer TOKEN"

# Multiple filters
curl "http://localhost:3000/api/v1/candidates?status=active&search=john&orderBy=rating&orderDirection=DESC&skip=0&take=10" \
  -H "Authorization: Bearer TOKEN"
```

## 🔍 Get Single Candidate

```bash
curl http://localhost:3000/api/v1/candidates/{candidateId} \
  -H "Authorization: Bearer TOKEN"

# With custom fields
curl "http://localhost:3000/api/v1/candidates/{candidateId}?includeCustomFields=true" \
  -H "Authorization: Bearer TOKEN"
```

## ✏️ Update Example

```bash
curl -X PUT http://localhost:3000/api/v1/candidates/{candidateId} \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "interviewing",
    "rating": 4.8,
    "internal_notes": "Strong technical skills",
    "customFields": {
      "interview_feedback_score": 5
    }
  }'
```

## 🗑️ Delete

```bash
curl -X DELETE http://localhost:3000/api/v1/candidates/{candidateId} \
  -H "Authorization: Bearer TOKEN"
# Returns 204 No Content
```

## 📊 Count

```bash
curl http://localhost:3000/api/v1/candidates/stats/count \
  -H "Authorization: Bearer TOKEN"
# Response: { success: true, count: 42 }
```

## 🔄 Bulk Update

```bash
curl -X PUT http://localhost:3000/api/v1/candidates/bulk/update \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateIds": ["id1", "id2", "id3"],
    "updates": {
      "status": "rejected",
      "internal_notes": "Batch rejection"
    }
  }'
```

## ✅ Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | number | 0 | Pagination offset |
| take | number | 20 | Records per page |
| status | string | - | Filter by status |
| search | string | - | Search in name/email |
| orderBy | string | created_at | created_at, updated_at, rating, first_name |
| orderDirection | string | DESC | ASC or DESC |
| includeCustomFields | boolean | false | Include custom field values |

## 🔗 Custom Field Integration

### Available Custom Fields
- years_of_experience (number)
- certifications (multiselect)
- availability_date (date)
- linkedin_url (URL)
- github_profile (URL)
- expected_salary_usd (currency)
- willing_to_relocate (boolean)
- visa_sponsorship_required (boolean)
- phone_number (phone)
- professional_summary (rich_text)

### Using Custom Fields

```typescript
// In service layer
const customFields = await customFieldsService.getEntityValues(
  companyId,
  'candidate',
  candidateId
);

// Create with custom fields
const dto = {
  first_name: 'John',
  email: 'john@example.com',
  customFields: {
    years_of_experience: 8,
    certifications: ['aws']
  }
};

// Update custom fields
const updateDto = {
  customFields: {
    interview_feedback_score: 5
  }
};
```

## 🎯 Candidate Statuses

```
active       - Candidate is active in system
applied      - Candidate applied to job
interviewing - Currently interviewing
offer        - Offer extended
hired        - Hired and accepted
rejected     - Application rejected
inactive     - No longer active
```

## 🔒 Tenant Isolation

- All queries automatically scoped to company_id
- Email uniqueness enforced per company
- Cannot access other companies' candidates
- Soft deletes preserve isolation

## 📝 Audit Logging

All operations logged:
- **CREATE**: New candidate with all data
- **UPDATE**: Before/after values
- **DELETE**: Candidate data at time of deletion

Access via AuditService with entity_type='Candidate'

## 📦 Sample Data

6 pre-seeded candidates:
1. John Smith - Senior Engineer, Interviewing
2. Sarah Johnson - Product Manager, Applied
3. Michael Chen - DevOps Engineer, Offer
4. Emily Davis - UX/UI Designer, Active
5. David Wilson - Data Scientist, Hired
6. Jessica Martinez - QA Engineer, Rejected

## 🛠️ Service Layer Usage

```typescript
// In another service
constructor(private candidateService: CandidateService) {}

// Get candidate
const candidate = await this.candidateService.getCandidate(
  companyId,
  candidateId,
  true  // includeCustomFields
);

// Update status
await this.candidateService.update(companyId, candidateId, userId, {
  status: 'hired'
});

// Get all active candidates
const { data, total } = await this.candidateService.getCandidates(companyId, {
  status: 'active',
  take: 50
});

// Bulk operations
const result = await this.candidateService.bulkUpdate(
  companyId,
  candidateIds,
  userId,
  { status: 'rejected' }
);
```

## 📊 Response Examples

### Create/Get Response
```json
{
  "success": true,
  "data": {
    "id": "cand_uuid",
    "company_id": "comp_uuid",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com",
    "status": "active",
    "rating": 4.5,
    "tags": ["backend"],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z",
    "customFields": {
      "years_of_experience": 8,
      "certifications": ["aws"]
    }
  }
}
```

### List Response
```json
{
  "success": true,
  "data": [
    { ... candidate 1 ... },
    { ... candidate 2 ... }
  ],
  "total": 42
}
```

### Bulk Update Response
```json
{
  "success": true,
  "updated": 3,
  "failed": 0,
  "errors": {}
}
```

## ⚠️ Error Responses

```json
// 400: Duplicate email
{
  "statusCode": 400,
  "message": "Candidate with this email already exists"
}

// 404: Not found
{
  "statusCode": 404,
  "message": "Candidate not found"
}

// 403: Insufficient permissions
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

## 📚 Files Created

- `src/candidates/entities/candidate.entity.ts` - 26 columns
- `src/candidates/repositories/candidate.repository.ts` - 10 methods
- `src/candidates/services/candidate.service.ts` - Core logic
- `src/candidates/controllers/candidate.controller.ts` - 7 endpoints
- `src/candidates/dtos/create-candidate.dto.ts`
- `src/candidates/dtos/update-candidate.dto.ts`
- `src/candidates/dtos/get-candidate.dto.ts`
- `src/candidates/candidate.module.ts`
- `src/database/migrations/1704067300000-CreateCandidatesTable.ts`
- `src/database/seeds/default-candidates.seed.ts`

---

**Status**: ✅ PRODUCTION READY
