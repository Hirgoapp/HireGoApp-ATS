# Candidate Module Implementation

## Overview

The Candidate module provides complete CRUD functionality for managing candidates in the ATS system. It integrates with the Custom Field Engine for dynamic fields, RBAC for permission control, and the Audit system for tracking changes.

## Architecture

```
Request
  ↓
TenantGuard (extract company_id from JWT)
  ↓
RoleGuard (check candidates:create/read/update/delete permissions)
  ↓
CandidateController
  ├─ POST /api/v1/candidates → create()
  ├─ GET /api/v1/candidates → getAll()
  ├─ GET /api/v1/candidates/:id → getOne()
  ├─ PUT /api/v1/candidates/:id → update()
  ├─ DELETE /api/v1/candidates/:id → delete()
  ├─ GET /api/v1/candidates/stats/count → getCount()
  └─ PUT /api/v1/candidates/bulk/update → bulkUpdate()
     ↓
CandidateService
  ├─ Validate inputs
  ├─ Handle custom fields via CustomFieldsService
  ├─ Log changes via AuditService
  └─ Call CandidateRepository
     ↓
CandidateRepository
  └─ Database operations (TypeORM)
```

## Database Schema

### candidates table

```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  
  -- Basic Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- Professional Information
  title VARCHAR(255),
  current_company VARCHAR(255),
  years_of_experience INT,
  summary TEXT,
  
  -- Location
  city VARCHAR(100),
  country VARCHAR(100),
  timezone VARCHAR(50),
  
  -- Availability
  availability_date DATE,
  notice_period VARCHAR(50),
  
  -- Status & Rating
  status ENUM('active', 'applied', 'interviewing', 'offer', 'hired', 'rejected', 'inactive'),
  rating NUMERIC(3,1),
  
  -- External Links
  linkedin_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  resume_url VARCHAR(500),
  
  -- Internal Notes
  internal_notes TEXT,
  
  -- Tags (JSON array)
  tags JSONB DEFAULT '[]',
  
  -- Source (linkedin, referral, job_board, recruiter, website)
  source VARCHAR(50),
  
  -- Audit
  created_by_id UUID NOT NULL,
  updated_by_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  UNIQUE (company_id, email),
  INDEX (company_id, status),
  INDEX (company_id, created_at),
  INDEX (company_id, rating)
);
```

## API Endpoints

### Create Candidate

```http
POST /api/v1/candidates
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john@example.com",
  "phone": "+1-555-0101",
  "title": "Senior Software Engineer",
  "current_company": "Tech Corp",
  "years_of_experience": 8,
  "summary": "Experienced full-stack developer",
  "city": "San Francisco",
  "country": "USA",
  "timezone": "America/Los_Angeles",
  "availability_date": "2025-02-01",
  "notice_period": "2 weeks",
  "status": "active",
  "rating": 4.5,
  "linkedin_url": "https://linkedin.com/in/johnsmith",
  "portfolio_url": "https://johnsmith.dev",
  "tags": ["backend", "nodejs"],
  "source": "linkedin",
  "customFields": {
    "years_of_experience": 8,
    "certifications": ["aws", "kubernetes"]
  }
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "candidate-uuid",
    "company_id": "company-uuid",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com",
    ... (all fields),
    "customFields": {
      "years_of_experience": 8,
      "certifications": ["aws", "kubernetes"]
    },
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
}
```

### Get All Candidates

```http
GET /api/v1/candidates?skip=0&take=20&status=active&search=john&orderBy=created_at&orderDirection=DESC&includeCustomFields=true
Authorization: Bearer TOKEN
```

**Query Parameters**
- `skip` (default: 0) - Pagination offset
- `take` (default: 20) - Records per page
- `status` - Filter by candidate status
- `search` - Search in first_name, last_name, email
- `orderBy` - created_at, updated_at, rating, first_name (default: created_at)
- `orderDirection` - ASC or DESC (default: DESC)
- `includeCustomFields` - true/false (default: false)

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "first_name": "John",
      ... (candidate data),
      "customFields": { ... }
    }
  ],
  "total": 42
}
```

### Get Single Candidate

```http
GET /api/v1/candidates/{candidateId}?includeCustomFields=true
Authorization: Bearer TOKEN
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "candidate-uuid",
    ... (all fields),
    "customFields": { ... }
  }
}
```

### Update Candidate

```http
PUT /api/v1/candidates/{candidateId}
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "status": "interviewing",
  "rating": 4.8,
  "internal_notes": "Strong technical skills",
  "customFields": {
    "interview_feedback_score": 5
  }
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "candidate-uuid",
    ... (updated fields),
    "customFields": { ... }
  }
}
```

### Delete Candidate

```http
DELETE /api/v1/candidates/{candidateId}
Authorization: Bearer TOKEN
```

**Response (204 No Content)**

### Get Candidate Count

```http
GET /api/v1/candidates/stats/count
Authorization: Bearer TOKEN
```

**Response (200 OK)**
```json
{
  "success": true,
  "count": 42
}
```

### Bulk Update Candidates

```http
PUT /api/v1/candidates/bulk/update
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "candidateIds": ["id1", "id2", "id3"],
  "updates": {
    "status": "rejected",
    "internal_notes": "Batch rejection"
  }
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "updated": 3,
  "failed": 0,
  "errors": {}
}
```

## Service Methods

### CandidateService

```typescript
// Create new candidate
create(companyId: string, userId: string, dto: CreateCandidateDto): Promise<GetCandidateDto>

// Get single candidate
getCandidate(companyId: string, candidateId: string, includeCustomFields?: boolean): Promise<GetCandidateDto>

// Get all candidates with filtering
getCandidates(companyId: string, options?: {
  skip?: number;
  take?: number;
  status?: CandidateStatus;
  search?: string;
  orderBy?: 'created_at' | 'updated_at' | 'rating' | 'first_name';
  orderDirection?: 'ASC' | 'DESC';
  includeCustomFields?: boolean;
}): Promise<{ data: GetCandidateDto[]; total: number }>

// Update candidate
update(companyId: string, candidateId: string, userId: string, dto: UpdateCandidateDto): Promise<GetCandidateDto>

// Delete candidate (soft delete)
delete(companyId: string, candidateId: string, userId: string): Promise<void>

// Get candidate count
getCount(companyId: string): Promise<number>

// Bulk update candidates
bulkUpdate(companyId: string, candidateIds: string[], userId: string, updates: Partial<UpdateCandidateDto>): Promise<{
  updated: number;
  failed: number;
  errors: Record<string, string>;
}>
```

## Repository Methods

### CandidateRepository

```typescript
// Create candidate
create(candidate: Partial<Candidate>): Promise<Candidate>

// Find by ID (scoped to company)
findById(companyId: string, candidateId: string): Promise<Candidate | null>

// Find by email (scoped to company)
findByEmail(companyId: string, email: string): Promise<Candidate | null>

// Find multiple by IDs
findByIds(companyId: string, candidateIds: string[]): Promise<Candidate[]>

// Find by company with filtering
findByCompany(companyId: string, options?: {...}): Promise<{ data: Candidate[]; total: number }>

// Update candidate
update(candidate: Candidate): Promise<Candidate>

// Soft delete
softDelete(companyId: string, candidateId: string): Promise<void>

// Count by company
countByCompany(companyId: string): Promise<number>

// Find by status
findByStatus(companyId: string, status: CandidateStatus): Promise<Candidate[]>

// Find by source
findBySource(companyId: string, source: string): Promise<Candidate[]>
```

## RBAC Permissions

All endpoints require specific permissions:

| Endpoint | Permission | Description |
|----------|-----------|-------------|
| POST /candidates | candidates:create | Create new candidate |
| GET /candidates | candidates:read | List candidates |
| GET /candidates/:id | candidates:read | Get single candidate |
| PUT /candidates/:id | candidates:update | Update candidate |
| DELETE /candidates/:id | candidates:delete | Delete candidate |
| GET /candidates/stats/count | candidates:read | Get count |
| PUT /candidates/bulk/update | candidates:update | Bulk update |

Permission format: `candidates:action`

## Custom Fields Integration

Custom fields are automatically integrated:

### Creating with Custom Fields

```http
POST /api/v1/candidates
{
  "first_name": "John",
  "email": "john@example.com",
  "customFields": {
    "years_of_experience": 8,
    "certifications": ["aws"],
    "linkedin_url": "https://linkedin.com/in/john"
  }
}
```

### Retrieving with Custom Fields

```http
GET /api/v1/candidates/123?includeCustomFields=true
```

Returns:
```json
{
  "data": {
    "id": "...",
    "first_name": "John",
    ...,
    "customFields": {
      "years_of_experience": 8,
      "certifications": ["aws"],
      "linkedin_url": "https://linkedin.com/in/john"
    }
  }
}
```

### Updating Custom Fields

```http
PUT /api/v1/candidates/123
{
  "internal_notes": "Updated",
  "customFields": {
    "interview_feedback_score": 5
  }
}
```

## Tenant Isolation

All operations are scoped to company_id:

- Email uniqueness enforced per company
- All queries filter by company_id
- Cannot access other companies' candidates
- Soft deletes preserve company isolation

## Audit Trail

All operations are logged:

- **CREATE** - New candidate created with full data
- **UPDATE** - Changes logged with before/after values
- **DELETE** - Deletion logged with candidate data

Access audit logs via AuditService.

## Candidate Statuses

```typescript
enum CandidateStatus {
  ACTIVE = 'active',           // Candidate is active in system
  APPLIED = 'applied',         // Candidate applied to job
  INTERVIEWING = 'interviewing', // Currently interviewing
  OFFER = 'offer',             // Offer extended
  HIRED = 'hired',             // Hired and accepted
  REJECTED = 'rejected',       // Application rejected
  INACTIVE = 'inactive'        // No longer active
}
```

## Files Created

### Implementation (9 files)
- `src/candidates/entities/candidate.entity.ts` - Entity with 26 columns
- `src/candidates/repositories/candidate.repository.ts` - 10 repository methods
- `src/candidates/services/candidate.service.ts` - Core business logic
- `src/candidates/controllers/candidate.controller.ts` - 7 API endpoints
- `src/candidates/dtos/create-candidate.dto.ts` - Input validation
- `src/candidates/dtos/update-candidate.dto.ts` - Partial updates
- `src/candidates/dtos/get-candidate.dto.ts` - Response formatting
- `src/candidates/candidate.module.ts` - Module configuration

### Database (2 files)
- `src/database/migrations/1704067300000-CreateCandidatesTable.ts` - Table creation
- `src/database/seeds/default-candidates.seed.ts` - 6 sample candidates

## Integration Steps

### 1. Import Module

```typescript
// src/app.module.ts
import { CandidateModule } from './candidates/candidate.module';

@Module({
  imports: [CandidateModule, /* ... */]
})
export class AppModule {}
```

### 2. Run Migration

```bash
npm run typeorm migration:run
```

### 3. Seed Data

```bash
npm run seed:candidates
```

### 4. Create Permissions

Ensure RBAC system has these permissions:
- candidates:create
- candidates:read
- candidates:update
- candidates:delete

### 5. Test Endpoints

```bash
# Create candidate
curl -X POST http://localhost:3000/api/v1/candidates \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe","email":"john@example.com"}'

# List candidates
curl -X GET http://localhost:3000/api/v1/candidates \
  -H "Authorization: Bearer TOKEN"

# Get single
curl -X GET http://localhost:3000/api/v1/candidates/{id} \
  -H "Authorization: Bearer TOKEN"

# Update
curl -X PUT http://localhost:3000/api/v1/candidates/{id} \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status":"interviewing"}'

# Delete
curl -X DELETE http://localhost:3000/api/v1/candidates/{id} \
  -H "Authorization: Bearer TOKEN"
```

## Error Handling

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Candidate with this email already exists | Duplicate email |
| 404 | Candidate not found | ID doesn't exist or belongs to other company |
| 403 | Insufficient permissions | User lacks candidates:action permission |
| 400 | Custom field not found | Invalid custom field slug |
| 400 | Validation failed | Invalid input data |

## Performance

- Indexed on (company_id, email) for uniqueness
- Indexed on (company_id, status) for filtering
- Indexed on (company_id, created_at) for sorting
- Indexed on (company_id, rating) for rating queries
- Soft deletes use deleted_at filter
- Pagination support via skip/take

## Features

✅ Full CRUD operations  
✅ Tenant isolation  
✅ RBAC permission enforcement  
✅ Custom field integration  
✅ Audit trail logging  
✅ Soft delete support  
✅ Bulk operations  
✅ Advanced filtering & search  
✅ Pagination support  
✅ Email uniqueness per company  

## Sample Seed Data

6 pre-configured candidates with various statuses, titles, and backgrounds for testing:

- John Smith (Senior Engineer, Interviewing)
- Sarah Johnson (Product Manager, Applied)
- Michael Chen (DevOps Engineer, Offer)
- Emily Davis (UX/UI Designer, Active)
- David Wilson (Data Scientist, Hired)
- Jessica Martinez (QA Engineer, Rejected)
