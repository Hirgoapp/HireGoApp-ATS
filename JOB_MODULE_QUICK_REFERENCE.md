# Job Module - Quick Reference Guide

**Quick Links**: [Architecture](#architecture) | [API Endpoints](#api-endpoints) | [Examples](#examples) | [RBAC](#rbac-permissions) | [Troubleshooting](#troubleshooting)

## Quick Start (5 minutes)

### 1. Import Module
```typescript
// src/app.module.ts
import { JobModule } from './jobs/job.module';

@Module({
  imports: [JobModule]
})
export class AppModule {}
```

### 2. Run Migration
```bash
npm run typeorm migration:run
```

### 3. Seed Sample Data
```bash
npm run seed:jobs
```

### 4. Test First Request
```bash
curl http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Architecture

```
Job Module
├── Entities: job.entity.ts (JobStatus enum)
├── Repositories: job.repository.ts (10 methods)
├── Services: job.service.ts (CRUD + custom fields + audit)
├── Controllers: job.controller.ts (7 endpoints)
├── DTOs: create/update/get
└── Module: job.module.ts (imports all)

Database: jobs table (27 columns, 4 indices)
Integrations: CustomFieldsService, AuditService, TenantGuard, RoleGuard
```

## API Endpoints (7 total)

### Create Job
```bash
POST /api/v1/jobs
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Senior Engineer",
  "description": "We are looking for...",
  "department": "Engineering",
  "level": "senior",
  "status": "open",
  "priority": 5
}
```

**Response**: `201 Created` with job object

### List Jobs
```bash
GET /api/v1/jobs?skip=0&take=20&status=open&search=engineer&department=Engineering&includeCustomFields=false
Authorization: Bearer TOKEN
```

**Query Parameters**:
- `skip` (default: 0) - Pagination offset
- `take` (default: 20) - Pagination limit
- `status` (open|on_hold|closed) - Filter by status
- `search` - Search title/description
- `department` - Filter by department
- `orderBy` (created_at|updated_at|priority|title) - Sort field
- `orderDirection` (ASC|DESC) - Sort direction
- `includeCustomFields` (true|false) - Include custom fields

**Response**: `200 OK` with array of jobs + total count

### Get Job
```bash
GET /api/v1/jobs/{jobId}?includeCustomFields=false
Authorization: Bearer TOKEN
```

**Response**: `200 OK` with single job object

### Update Job
```bash
PUT /api/v1/jobs/{jobId}
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "status": "closed",
  "priority": 1,
  "customFields": {
    "field_key": "value"
  }
}
```

**Response**: `200 OK` with updated job

### Delete Job
```bash
DELETE /api/v1/jobs/{jobId}
Authorization: Bearer TOKEN
```

**Response**: `204 No Content` (soft delete)

### Get Count
```bash
GET /api/v1/jobs/stats/count
Authorization: Bearer TOKEN
```

**Response**: `200 OK` with `{ success: true, count: N }`

### Bulk Update
```bash
PUT /api/v1/jobs/bulk/update
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "jobIds": ["id1", "id2", "id3"],
  "updates": {
    "status": "closed",
    "priority": 1
  }
}
```

**Response**: `200 OK` with `{ updated: N, failed: N, errors: [...] }`

## Examples

### Example 1: Create Job with Skills
```bash
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Backend Engineer",
    "description": "Build scalable APIs",
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
    "required_skills": ["TypeScript", "NestJS", "PostgreSQL", "Docker"],
    "preferred_skills": ["Kubernetes", "AWS"],
    "tags": ["urgent", "backend"],
    "internal_notes": "High priority position"
  }'
```

### Example 2: List Open Jobs in Engineering
```bash
curl "http://localhost:3000/api/v1/jobs?status=open&department=Engineering&take=10" \
  -H "Authorization: Bearer TOKEN"
```

### Example 3: Update Job Status
```bash
curl -X PUT http://localhost:3000/api/v1/jobs/job-id \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "closed",
    "internal_notes": "Position filled"
  }'
```

### Example 4: Search Jobs
```bash
curl "http://localhost:3000/api/v1/jobs?search=engineer&orderBy=priority&orderDirection=DESC" \
  -H "Authorization: Bearer TOKEN"
```

### Example 5: Get Job with Custom Fields
```bash
curl "http://localhost:3000/api/v1/jobs/job-id?includeCustomFields=true" \
  -H "Authorization: Bearer TOKEN"
```

### Example 6: Bulk Close Jobs
```bash
curl -X PUT http://localhost:3000/api/v1/jobs/bulk/update \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobIds": ["id1", "id2", "id3"],
    "updates": {
      "status": "closed",
      "internal_notes": "Positions filled"
    }
  }'
```

### Example 7: Get Job Count
```bash
curl "http://localhost:3000/api/v1/jobs/stats/count" \
  -H "Authorization: Bearer TOKEN"
```

## Database Schema

### jobs Table (27 columns)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| company_id | UUID | Tenant (indexed) |
| title | VARCHAR 255 | Required |
| description | TEXT | Required |
| department | VARCHAR 255 | Optional |
| level | VARCHAR 50 | junior, mid, senior, lead |
| job_type | VARCHAR 50 | full-time, part-time, contract |
| years_required | INT | Experience requirement |
| salary_min | DECIMAL 12,2 | Minimum salary |
| salary_max | DECIMAL 12,2 | Maximum salary |
| currency | VARCHAR 10 | USD, EUR, GBP |
| location | VARCHAR 255 | Job location |
| is_remote | BOOLEAN | Remote work allowed |
| is_hybrid | BOOLEAN | Hybrid arrangement |
| status | ENUM | open, on_hold, closed |
| priority | INT | 1-5 (low to critical) |
| target_hire_date | DATE | Target start date |
| openings | INT | Positions to fill |
| required_skills | JSONB | Array of skills |
| preferred_skills | JSONB | Array of skills |
| tags | JSONB | Array of tags |
| internal_notes | TEXT | Internal comments |
| source | VARCHAR 50 | internal, linkedin, etc |
| created_by_id | UUID | Creator user |
| updated_by_id | UUID | Last updater |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Update time |
| deleted_at | TIMESTAMP | Soft delete (NULL if active) |

### Indices (4)
- `(company_id, status)` - Filter by status
- `(company_id, title)` - Search by title
- `(company_id, department)` - Filter by department
- `(company_id, created_at)` - Timeline queries

## RBAC Permissions

Four permissions control job operations:

| Permission | Grants Access To |
|-----------|------------------|
| `jobs:create` | POST /api/v1/jobs |
| `jobs:read` | GET /api/v1/jobs, GET /api/v1/jobs/:id, GET stats/count |
| `jobs:update` | PUT /api/v1/jobs/:id, PUT bulk/update |
| `jobs:delete` | DELETE /api/v1/jobs/:id |

**Add to your RBAC system**:
```typescript
const permissions = [
  { name: 'jobs:create', description: 'Create jobs' },
  { name: 'jobs:read', description: 'Read/list jobs' },
  { name: 'jobs:update', description: 'Update jobs' },
  { name: 'jobs:delete', description: 'Delete jobs' },
];
```

## Job Statuses

| Status | Value | Use Case |
|--------|-------|----------|
| Open | `open` | Actively hiring (default) |
| On Hold | `on_hold` | Temporarily paused |
| Closed | `closed` | No longer available |

## Service Methods

### JobService

```typescript
// Create
async create(companyId, userId, dto): Promise<GetJobDto>

// Read
async getJob(companyId, jobId, includeCustomFields?): Promise<GetJobDto>
async getJobs(companyId, options): Promise<{data, total}>
async getCount(companyId): Promise<number>
async getCountByStatus(companyId, status): Promise<number>

// Update
async update(companyId, jobId, userId, dto): Promise<GetJobDto>
async bulkUpdate(companyId, jobIds, userId, updates): Promise<{updated, failed, errors}>

// Delete
async delete(companyId, jobId, userId): Promise<void>
```

## Repository Methods

```typescript
// Create
async create(job): Promise<Job>

// Read
async findById(companyId, jobId): Promise<Job | null>
async findByTitle(companyId, title): Promise<Job | null>
async findByIds(companyId, jobIds): Promise<Job[]>
async findByCompany(companyId, options): Promise<{data, total}>
async findByStatus(companyId, status): Promise<Job[]>
async findByDepartment(companyId, department): Promise<Job[]>

// Update
async update(job): Promise<Job>

// Delete
async softDelete(companyId, jobId): Promise<void>

// Count
async countByCompany(companyId): Promise<number>
async countByStatus(companyId, status): Promise<number>
```

## DTOs

### CreateJobDto
Required: `title`, `description`
Optional: All other fields

### UpdateJobDto
All fields optional (partial update)

### GetJobDto
Response DTO with all fields + optional `customFields`

## Custom Fields Integration

### Example: Create Custom Field
```typescript
// First, define the custom field
const field = await customFieldsService.create(companyId, {
  key: 'hiring_manager',
  entity: 'Job',
  field_type: 'text',
  label: 'Hiring Manager',
  required: true,
  validation: { min_length: 1, max_length: 100 }
});
```

### Example: Create Job with Custom Field
```typescript
const job = await jobService.create(companyId, userId, {
  title: 'Senior Engineer',
  description: '...',
  customFields: {
    hiring_manager: 'John Doe'
  }
});
```

### Example: Get Job with Custom Fields
```typescript
const job = await jobService.getJob(companyId, jobId, true);
console.log(job.customFields); 
// { hiring_manager: 'John Doe', ... }
```

## Tenant Isolation

All operations are company-scoped:

```typescript
// Even with right permission, cross-tenant access blocked
await jobService.getJob('wrong-company-id', 'job-id');
// Result: NotFoundException - job doesn't exist in their company
```

## Audit Logging

Every operation logged automatically:

```json
{
  "entity_type": "Job",
  "entity_id": "uuid",
  "action": "CREATE|UPDATE|DELETE|BULK_UPDATE",
  "user_id": "uuid",
  "changes": { /* before/after values */ },
  "created_at": "timestamp"
}
```

## Error Responses

### 400 Bad Request
```json
{ "statusCode": 400, "message": "Custom field validation failed" }
```

### 401 Unauthorized
```json
{ "statusCode": 401, "message": "Missing authentication token" }
```

### 403 Forbidden
```json
{ "statusCode": 403, "message": "Missing permission: jobs:create" }
```

### 404 Not Found
```json
{ "statusCode": 404, "message": "Job not found" }
```

### 422 Unprocessable Entity
```json
{ "statusCode": 422, "message": "Validation failed", "errors": [...] }
```

## Sample Data

6 pre-seeded jobs for testing:

1. **Senior Software Engineer** - Engineering, Open, Priority 5
2. **Product Manager** - Product, Open, Priority 4
3. **UX/UI Designer** - Design, Interviewing, Priority 3
4. **Data Scientist** - Data, On Hold, Priority 2
5. **DevOps Engineer** - Engineering, Closed, Priority 1
6. **QA Automation Engineer** - QA, Open, Priority 2

## File Structure

```
src/jobs/
├── entities/
│   └── job.entity.ts (120 lines)
├── repositories/
│   └── job.repository.ts (130 lines)
├── services/
│   └── job.service.ts (240 lines)
├── dtos/
│   ├── create-job.dto.ts (80 lines)
│   ├── update-job.dto.ts (5 lines)
│   └── get-job.dto.ts (60 lines)
├── controllers/
│   └── job.controller.ts (180 lines)
└── job.module.ts (20 lines)

src/database/
├── migrations/
│   └── 1704067400000-CreateJobsTable.ts (150 lines)
└── seeds/
    └── default-jobs.seed.ts (160 lines)
```

## Common Operations

### Filter by Department
```bash
curl "http://localhost:3000/api/v1/jobs?department=Engineering" \
  -H "Authorization: Bearer TOKEN"
```

### Sort by Priority
```bash
curl "http://localhost:3000/api/v1/jobs?orderBy=priority&orderDirection=DESC" \
  -H "Authorization: Bearer TOKEN"
```

### Search with Pagination
```bash
curl "http://localhost:3000/api/v1/jobs?search=senior&skip=0&take=10" \
  -H "Authorization: Bearer TOKEN"
```

### Multiple Filters
```bash
curl "http://localhost:3000/api/v1/jobs?status=open&department=Engineering&search=backend&take=5" \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting

### 404 Job Not Found
**Cause**: Job doesn't exist or belongs to different company
**Solution**: Verify job ID and company_id match

### 403 Permission Denied
**Cause**: User lacks required permission
**Solution**: Add permission to user role (e.g., `jobs:create`)

### 422 Validation Error
**Cause**: Invalid input format or missing required fields
**Solution**: Check DTO requirements (title, description required)

### Custom Fields Not Showing
**Solution**: Use `includeCustomFields=true` query parameter

### Soft Delete Not Working
**Cause**: Using hard delete instead of soft delete
**Solution**: Use DELETE endpoint (sets deleted_at, doesn't remove)

## Related Modules

- **Candidates Module** - Similar structure
- **Custom Fields** - Dynamic field support
- **Audit** - Change logging
- **RBAC** - Permission checking
- **Auth** - JWT token validation

## Integration Checklist

- [ ] Import JobModule in AppModule
- [ ] Run TypeORM migrations
- [ ] Seed sample data
- [ ] Add RBAC permissions (jobs:create/read/update/delete)
- [ ] Test endpoints with Bearer token
- [ ] Verify audit logs created
- [ ] Test custom field integration
- [ ] Verify tenant isolation
- [ ] Load test pagination
- [ ] Test bulk operations

## Next Steps

1. **Implement Applications Module** - Link candidates to jobs
2. **Add Interview Scheduling** - Calendar management
3. **Create Job Posting** - Publish jobs externally
4. **Build Pipeline Dashboard** - Visual hiring stages
5. **Add Analytics** - Metrics and reporting

## Response Format

All endpoints follow consistent format:

**Success**:
```json
{
  "success": true,
  "data": {},
  "total": 0
}
```

**Error**:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error type"
}
```

## Performance Tips

- Use `take` parameter to limit results
- Filter before search for better performance
- Use `orderBy=created_at` for timeline queries
- Batch operations with bulk update

## Security Notes

- All endpoints require `Authorization` header
- Tenant isolation enforced at database level
- RBAC permissions checked on every endpoint
- Audit trail preserved for compliance
- Soft deletes maintain data integrity

---

**Questions?** Check JOB_MODULE_IMPLEMENTATION.md for detailed documentation.
