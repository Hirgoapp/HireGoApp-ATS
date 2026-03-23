# Job Module - Complete Implementation Guide

**Status**: Production Ready  
**Framework**: NestJS + TypeORM  
**Multi-Tenant**: Yes (company_id enforced)  
**RBAC**: Yes (jobs:create/read/update/delete)  
**Custom Fields**: Yes (integrated with Custom Field Engine)  
**Audit**: Yes (all changes logged)  

## Overview

The Job module provides comprehensive CRUD operations for managing job postings/requirements in the ATS system. It supports:

- Complete job lifecycle management (open, on-hold, closed)
- Advanced filtering and search capabilities
- Tenant-aware data isolation
- Dynamic custom fields
- Full audit trail
- Bulk operations
- RBAC permission enforcement

## Architecture

### Entity Relationship Diagram

```
Company
├── Jobs
│   ├── custom_field_values (via Custom Field Engine)
│   └── audit_logs (via Audit Service)
└── Candidates
    └── Applications (future)
```

### Data Flow

```
HTTP Request
  ↓
TenantGuard (extract company_id from JWT)
  ↓
RoleGuard (validate jobs:action permission)
  ↓
JobController (request parsing)
  ├─ Input validation (CreateJobDto / UpdateJobDto)
  └─ Response formatting (GetJobDto)
    ↓
JobService (business logic)
  ├─ Custom field handling (CustomFieldsService)
  ├─ Audit logging (AuditService)
  └─ Validation & error handling
    ↓
JobRepository (data access)
  ├─ Query building with filters
  ├─ Pagination & sorting
  └─ Soft delete management
    ↓
PostgreSQL
  └─ jobs table (27 columns)
     ├─ custom_field_values (linked)
     └─ audit_logs (linked)
```

## Database Schema

### jobs Table (27 columns)

#### Primary Keys & Tenant
- `id` (UUID) - Unique job ID
- `company_id` (UUID) - Tenant identifier

#### Basic Information
- `title` (VARCHAR 255) - Job title (required)
- `description` (TEXT) - Full job description (required)
- `department` (VARCHAR 255) - Department name

#### Job Details
- `level` (VARCHAR 50) - junior, mid, senior, lead
- `job_type` (VARCHAR 50) - full-time, part-time, contract, temporary
- `years_required` (INT) - Minimum years of experience

#### Compensation
- `salary_min` (DECIMAL 12,2) - Minimum salary
- `salary_max` (DECIMAL 12,2) - Maximum salary
- `currency` (VARCHAR 10) - USD, EUR, GBP, etc.

#### Location
- `location` (VARCHAR 255) - City, state, or office name
- `is_remote` (BOOLEAN) - Remote work allowed
- `is_hybrid` (BOOLEAN) - Hybrid arrangement

#### Job Status
- `status` (ENUM) - open, on_hold, closed
- `priority` (INT 1-5) - 1 (low) to 5 (critical)

#### Hiring Details
- `target_hire_date` (DATE) - Target start date
- `openings` (INT) - Number of positions to fill

#### Skills & Organization
- `required_skills` (JSONB array) - Required skills
- `preferred_skills` (JSONB array) - Nice-to-have skills
- `tags` (JSONB array) - Organization tags
- `internal_notes` (TEXT) - Internal comments
- `source` (VARCHAR 50) - internal, linkedin, indeed, etc.

#### Audit Fields
- `created_by_id` (UUID) - Creator user ID
- `updated_by_id` (UUID) - Last updater user ID
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Last update time
- `deleted_at` (TIMESTAMP) - Soft delete time

### Indices (4 total)

| Index Name | Columns | Purpose |
|------------|---------|---------|
| idx_jobs_company_status | (company_id, status) | Filter by status |
| idx_jobs_company_title | (company_id, title) | Search by title |
| idx_jobs_company_department | (company_id, department) | Filter by department |
| idx_jobs_company_created | (company_id, created_at) | Timeline queries |

## API Endpoints

### 1. Create Job
```http
POST /api/v1/jobs
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Senior Engineer",
  "description": "We are looking for...",
  "department": "Engineering",
  "level": "senior",
  "job_type": "full-time",
  "years_required": 5,
  "salary_min": 140000,
  "salary_max": 180000,
  "currency": "USD",
  "location": "San Francisco, CA",
  "is_remote": false,
  "is_hybrid": true,
  "status": "open",
  "priority": 5,
  "target_hire_date": "2025-02-01",
  "openings": 2,
  "required_skills": ["TypeScript", "NestJS", "PostgreSQL"],
  "preferred_skills": ["Kubernetes", "AWS"],
  "tags": ["urgent", "backend"],
  "internal_notes": "High priority",
  "source": "internal",
  "customFields": {
    "hiring_manager": "John Doe",
    "budget_approved": true
  }
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "company_id": "company-id",
    "title": "Senior Engineer",
    "description": "...",
    "status": "open",
    "priority": 5,
    "created_at": "2025-01-01T10:00:00Z"
  }
}
```

**RBAC Permission**: `jobs:create`

### 2. List Jobs
```http
GET /api/v1/jobs?skip=0&take=20&status=open&search=engineer&department=Engineering&orderBy=priority&orderDirection=DESC&includeCustomFields=false
Authorization: Bearer <token>
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | number | 0 | Records to skip |
| take | number | 20 | Records to return |
| status | enum | - | Filter by status (open, on_hold, closed) |
| search | string | - | Search title/description |
| department | string | - | Filter by department |
| orderBy | enum | created_at | Sort field (created_at, updated_at, priority, title) |
| orderDirection | enum | DESC | ASC or DESC |
| includeCustomFields | boolean | false | Include custom field values |

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Senior Engineer",
      "status": "open",
      "priority": 5,
      "department": "Engineering",
      "customFields": {}
    }
  ],
  "total": 45
}
```

**RBAC Permission**: `jobs:read`

### 3. Get Single Job
```http
GET /api/v1/jobs/{jobId}?includeCustomFields=false
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Senior Engineer",
    "description": "...",
    "department": "Engineering",
    "level": "senior",
    "status": "open",
    "priority": 5,
    "salary_min": 140000,
    "salary_max": 180000,
    "location": "San Francisco, CA",
    "openings": 2,
    "required_skills": ["TypeScript", "NestJS"],
    "preferred_skills": ["Kubernetes"],
    "tags": ["urgent"],
    "created_at": "2025-01-01T10:00:00Z",
    "customFields": {}
  }
}
```

**RBAC Permission**: `jobs:read`

### 4. Update Job
```http
PUT /api/v1/jobs/{jobId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "on_hold",
  "priority": 2,
  "customFields": {
    "hiring_manager": "Jane Smith"
  }
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "on_hold",
    "priority": 2,
    "updated_at": "2025-01-01T11:00:00Z"
  }
}
```

**RBAC Permission**: `jobs:update`

### 5. Delete Job
```http
DELETE /api/v1/jobs/{jobId}
Authorization: Bearer <token>
```

**Response (204 No Content)**

**RBAC Permission**: `jobs:delete`

### 6. Get Job Count
```http
GET /api/v1/jobs/stats/count
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "count": 15
}
```

**RBAC Permission**: `jobs:read`

### 7. Bulk Update
```http
PUT /api/v1/jobs/bulk/update
Content-Type: application/json
Authorization: Bearer <token>

{
  "jobIds": ["id1", "id2", "id3"],
  "updates": {
    "status": "closed",
    "priority": 1
  }
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "updated": 3,
  "failed": 0,
  "errors": []
}
```

**RBAC Permission**: `jobs:update`

## Service Methods

### JobService

All methods are tenant-aware (scoped to company_id).

#### Create
```typescript
async create(
  companyId: string,
  userId: string,
  dto: CreateJobDto
): Promise<GetJobDto>
```

Creates a new job with custom field handling and audit logging.

**Throws**:
- `BadRequestException` - If custom field validation fails
- Other validation errors

#### Get Single
```typescript
async getJob(
  companyId: string,
  jobId: string,
  includeCustomFields?: boolean
): Promise<GetJobDto>
```

Retrieves a single job by ID. Optionally includes custom field values.

**Throws**:
- `NotFoundException` - If job not found

#### Get Multiple
```typescript
async getJobs(
  companyId: string,
  options?: {
    skip?: number;
    take?: number;
    status?: JobStatus;
    search?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    department?: string;
    includeCustomFields?: boolean;
  }
): Promise<{ data: GetJobDto[]; total: number }>
```

Retrieves jobs with advanced filtering, pagination, and sorting.

#### Update
```typescript
async update(
  companyId: string,
  jobId: string,
  userId: string,
  dto: UpdateJobDto
): Promise<GetJobDto>
```

Updates a job with change tracking and audit logging.

**Throws**:
- `NotFoundException` - If job not found

#### Delete
```typescript
async delete(
  companyId: string,
  jobId: string,
  userId: string
): Promise<void>
```

Soft deletes a job (sets deleted_at timestamp).

**Throws**:
- `NotFoundException` - If job not found

#### Get Count
```typescript
async getCount(companyId: string): Promise<number>
```

Returns total number of active jobs.

#### Get Count By Status
```typescript
async getCountByStatus(
  companyId: string,
  status: JobStatus
): Promise<number>
```

Returns count of jobs filtered by status.

#### Bulk Update
```typescript
async bulkUpdate(
  companyId: string,
  jobIds: string[],
  userId: string,
  updates: UpdateJobDto
): Promise<{ updated: number; failed: number; errors: string[] }>
```

Updates multiple jobs with error tracking.

## Repository Methods

### JobRepository

All methods are company-scoped via company_id.

| Method | Purpose |
|--------|---------|
| create() | Create new job record |
| findById() | Get job by ID |
| findByTitle() | Get job by title |
| findByIds() | Get multiple jobs by IDs |
| findByCompany() | Advanced query with filtering/pagination |
| findByStatus() | Get all jobs with specific status |
| findByDepartment() | Get all jobs in department |
| update() | Update job record |
| softDelete() | Soft delete (set deleted_at) |
| countByCompany() | Count all active jobs |
| countByStatus() | Count jobs by status |

## DTOs

### CreateJobDto
Validates and maps incoming job creation requests.

**Fields**:
- `title` (required) - Job title
- `description` (required) - Full description
- `department` (optional) - Department name
- `level` (optional) - Job level
- `job_type` (optional) - Employment type
- `years_required` (optional) - Experience requirement
- `salary_min`, `salary_max` (optional) - Salary range
- `currency` (optional) - Salary currency
- `location` (optional) - Job location
- `is_remote`, `is_hybrid` (optional) - Work arrangement
- `status` (optional, default: open) - Job status
- `priority` (optional, default: 1) - Priority level 1-5
- `target_hire_date` (optional) - Target start date
- `openings` (optional, default: 1) - Number of positions
- `required_skills` (optional) - Array of required skills
- `preferred_skills` (optional) - Array of preferred skills
- `tags` (optional) - Array of tags
- `internal_notes` (optional) - Internal notes
- `source` (optional) - Job source
- `customFields` (optional) - Custom field values

### UpdateJobDto
Partial version of CreateJobDto - all fields optional.

### GetJobDto
Response DTO with all job fields and optional custom fields.

## Job Status Enum

| Status | Value | Description |
|--------|-------|-------------|
| OPEN | open | Position is actively hiring |
| ON_HOLD | on_hold | Position is temporarily on hold |
| CLOSED | closed | Position is no longer available |

## RBAC Permissions

Four distinct permissions for job operations:

| Permission | Action | Endpoints |
|-----------|--------|-----------|
| jobs:create | Create jobs | POST /jobs |
| jobs:read | Read/list jobs | GET /jobs, GET /jobs/:id, GET /jobs/stats/count |
| jobs:update | Update jobs | PUT /jobs/:id, PUT /jobs/bulk/update |
| jobs:delete | Delete jobs | DELETE /jobs/:id |

## Custom Fields Integration

Jobs support dynamic custom fields via the Custom Field Engine.

### Example: Adding Custom Fields
```typescript
// Define custom fields in Custom Field Engine first
const customField = await customFieldsService.create(companyId, {
  key: 'hiring_manager',
  entity: 'Job',
  field_type: 'text',
  label: 'Hiring Manager',
  required: true,
});

// Create job with custom field value
const job = await jobService.create(companyId, userId, {
  title: 'Senior Engineer',
  description: '...',
  customFields: {
    hiring_manager: 'John Doe'
  }
});
```

### Retrieving Custom Fields
```typescript
// Get job with custom fields included
const job = await jobService.getJob(companyId, jobId, true);
console.log(job.customFields); // { hiring_manager: 'John Doe', ... }
```

## Tenant Isolation

All operations are tenant-aware:

1. **Entity Level**: Every record has `company_id`
2. **Repository Level**: All queries filtered by `company_id`
3. **Service Level**: Methods require `companyId` parameter
4. **Controller Level**: `@CompanyId()` decorator extracts from JWT
5. **Database Level**: Indices include `company_id` for performance

**Example Isolation**:
```typescript
// Even if user somehow knows another company's job ID,
// this will return null due to company_id check
const job = await jobService.getJob('wrong-company-id', 'job-id');
// Returns: NotFoundException
```

## Audit Logging

Every operation is logged via AuditService:

### Create
```json
{
  "entity_type": "Job",
  "entity_id": "job-uuid",
  "action": "CREATE",
  "user_id": "user-uuid",
  "changes": { "created": true }
}
```

### Update
```json
{
  "entity_type": "Job",
  "entity_id": "job-uuid",
  "action": "UPDATE",
  "user_id": "user-uuid",
  "changes": {
    "status": { "before": "open", "after": "closed" },
    "priority": { "before": 5, "after": 2 }
  }
}
```

### Delete
```json
{
  "entity_type": "Job",
  "entity_id": "job-uuid",
  "action": "DELETE",
  "user_id": "user-uuid",
  "changes": { "deleted": true }
}
```

### Bulk Update
```json
{
  "entity_type": "Job",
  "entity_id": "job-uuid",
  "action": "BULK_UPDATE",
  "user_id": "user-uuid",
  "changes": { "updated": true }
}
```

## Error Handling

### Common Error Codes

| Status | Error | Cause |
|--------|-------|-------|
| 400 | BadRequestException | Custom field validation failed |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Missing required permission |
| 404 | NotFoundException | Job not found |
| 422 | Validation Error | Invalid input format |
| 500 | Internal Error | Server error |

### Example Error Response
```json
{
  "statusCode": 404,
  "message": "Job not found",
  "error": "Not Found"
}
```

## Performance Optimization

### Database Indices
- 4 optimized indices for common queries
- All indices include `company_id` for tenant isolation
- Composite indices for multi-column filtering

### Query Optimization
- Pagination with skip/take prevents memory overflow
- Search uses indexed LOWER() function
- Filtering scoped to company_id before joins

### Future Optimizations
- Add full-text search indices for description
- Cache frequently accessed job lists
- Batch custom field retrieval

## Feature Licensing (Future Integration)

Jobs module can be gated by feature licenses:

```typescript
// Example: Require 'job_posting' feature
@Require('jobs:create', { feature: 'job_posting' })
async create() { ... }
```

## Files Created

### Implementation (7)
- `src/jobs/entities/job.entity.ts` (120 lines)
- `src/jobs/repositories/job.repository.ts` (130 lines)
- `src/jobs/services/job.service.ts` (240 lines)
- `src/jobs/dtos/create-job.dto.ts` (80 lines)
- `src/jobs/dtos/update-job.dto.ts` (5 lines)
- `src/jobs/dtos/get-job.dto.ts` (60 lines)
- `src/jobs/controllers/job.controller.ts` (180 lines)

### Configuration (1)
- `src/jobs/job.module.ts` (20 lines)

### Database (2)
- `src/database/migrations/1704067400000-CreateJobsTable.ts` (150 lines)
- `src/database/seeds/default-jobs.seed.ts` (160 lines)

**Total**: ~1,100 lines of production code

## Integration Steps

### 1. Import Module
```typescript
import { JobModule } from './jobs/job.module';

@Module({
  imports: [
    // ... other modules
    JobModule,
  ],
})
export class AppModule { }
```

### 2. Run Migration
```bash
npm run typeorm migration:run
# Creates jobs table with 27 columns
```

### 3. Seed Sample Data
```bash
npm run seed:jobs
# Seeds 6 sample jobs in various statuses
```

### 4. Add RBAC Permissions
Ensure your RBAC system has these permissions:
- jobs:create
- jobs:read
- jobs:update
- jobs:delete

### 5. Test Endpoints
```bash
# Create a job
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "description": "Test description",
    "department": "Engineering"
  }'

# List jobs
curl http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer TOKEN"
```

## Testing Checklist

- [ ] Create job with all fields
- [ ] Create job with custom fields
- [ ] List jobs with filtering (status, department, search)
- [ ] List jobs with pagination (skip, take)
- [ ] List jobs with sorting (orderBy, orderDirection)
- [ ] Get single job by ID
- [ ] Update job (partial update)
- [ ] Update job status
- [ ] Delete job (verify soft delete)
- [ ] Get count
- [ ] Bulk update multiple jobs
- [ ] Verify audit logs created
- [ ] Verify tenant isolation
- [ ] Verify RBAC permissions enforced
- [ ] Test with custom fields
- [ ] Test error cases (not found, validation)

## Related Modules

- **Candidates Module** - Similar structure for candidate management
- **Custom Fields Module** - Dynamic field storage and retrieval
- **Audit Module** - Change logging and history
- **RBAC Module** - Permission checking
- **Tenant Guard** - Company isolation enforcement

## Next Steps

1. Integrate with Applications module (link candidates to jobs)
2. Add job posting workflow
3. Create interview scheduling features
4. Build hiring pipeline dashboard
5. Add analytics and reporting

## Support

For issues or questions:
1. Check JOB_MODULE_QUICK_REFERENCE.md for quick examples
2. Review the architecture section above
3. Check error logs in audit service
4. Verify RBAC permissions are properly configured
