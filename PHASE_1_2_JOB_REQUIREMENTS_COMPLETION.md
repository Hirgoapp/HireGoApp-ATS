# Phase 1.2 - Job Requirements Module Implementation

**Status:** ✅ **COMPLETE**  
**Date:** January 2025  
**Module:** Job Requirements  
**Pattern:** Multi-tenant with UUID PKs, company_id enforcement

---

## Overview

Phase 1.2 implements the Job Requirements module following the exact pattern established in Phase 1.1 (Candidates). This module manages job postings, requirement tracking, skill mappings, recruiter assignments, email import logs, and tracker templates.

---

## Tables Implemented (5)

| Table | Rows | Purpose |
|-------|------|---------|
| `job_requirements` | 38 columns | Main job/requirement data with ECMS integration |
| `requirement_skills` | 7 columns | Maps jobs to required skills with proficiency levels |
| `requirement_assignments` | 13 columns | Tracks which recruiters are assigned to each job |
| `requirement_import_logs` | 19 columns | Audit trail for email-based job imports |
| `requirement_tracker_templates` | 11 columns | Configuration for tracker spreadsheet formats |

---

## Database Schema

### 1. job_requirements
```sql
CREATE TABLE job_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    ecms_req_id VARCHAR(50) NOT NULL UNIQUE,
    client_id UUID NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    job_description TEXT,
    domain VARCHAR(100),
    business_unit VARCHAR(100),
    total_experience_min INTEGER,
    relevant_experience_min INTEGER,
    mandatory_skills TEXT NOT NULL,
    desired_skills TEXT,
    country VARCHAR(50),
    work_location VARCHAR(255),
    wfo_wfh_hybrid VARCHAR(50),
    shift_time VARCHAR(100),
    number_of_openings INTEGER,
    project_manager_name VARCHAR(100),
    project_manager_email VARCHAR(100),
    delivery_spoc_1_name VARCHAR(100),
    delivery_spoc_1_email VARCHAR(100),
    delivery_spoc_2_name VARCHAR(100),
    delivery_spoc_2_email VARCHAR(100),
    bgv_timing VARCHAR(100),
    bgv_vendor VARCHAR(100),
    interview_mode VARCHAR(100),
    interview_platforms TEXT,
    screenshot_requirement VARCHAR(255),
    vendor_rate NUMERIC,
    currency VARCHAR(3),
    client_name VARCHAR(100),
    email_subject VARCHAR(255),
    email_received_date TIMESTAMP,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    active_flag BOOLEAN DEFAULT true,
    extra_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IDX_JOB_REQUIREMENTS_COMPANY ON job_requirements(company_id);
CREATE INDEX IDX_JOB_REQUIREMENTS_CLIENT ON job_requirements(client_id);
CREATE INDEX IDX_JOB_REQUIREMENTS_ECMS_ID ON job_requirements(ecms_req_id);
CREATE INDEX IDX_JOB_REQUIREMENTS_PRIORITY ON job_requirements(priority);
CREATE INDEX IDX_JOB_REQUIREMENTS_ACTIVE ON job_requirements(active_flag);
CREATE INDEX IDX_JOB_REQUIREMENTS_COMPANY_ACTIVE ON job_requirements(company_id, active_flag);
```

### 2. requirement_skills
```sql
CREATE TABLE requirement_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_requirement_id UUID NOT NULL REFERENCES job_requirements(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL,
    is_mandatory BOOLEAN,
    proficiency_required VARCHAR(50),
    years_required NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_REQUIREMENT_SKILLS_COMPANY ON requirement_skills(company_id);
CREATE INDEX IDX_REQUIREMENT_SKILLS_JOB ON requirement_skills(job_requirement_id);
CREATE INDEX IDX_REQUIREMENT_SKILLS_SKILL ON requirement_skills(skill_id);
```

### 3. requirement_assignments
```sql
CREATE TABLE requirement_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_requirement_id UUID NOT NULL REFERENCES job_requirements(id) ON DELETE CASCADE,
    assigned_to_user_id UUID NOT NULL,
    assigned_by_user_id UUID,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assignment_notes TEXT,
    target_count INTEGER,
    target_submission_date DATE,
    status VARCHAR(50),
    completion_notes TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_REQUIREMENT_ASSIGNMENTS_COMPANY ON requirement_assignments(company_id);
CREATE INDEX IDX_REQUIREMENT_ASSIGNMENTS_JOB ON requirement_assignments(job_requirement_id);
CREATE INDEX IDX_REQUIREMENT_ASSIGNMENTS_USER ON requirement_assignments(assigned_to_user_id);
```

### 4. requirement_import_logs
```sql
CREATE TABLE requirement_import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_requirement_id UUID REFERENCES job_requirements(id) ON DELETE CASCADE,
    import_source VARCHAR(50) NOT NULL,
    import_method VARCHAR(100),
    email_from VARCHAR(100),
    email_subject VARCHAR(255),
    email_received_date TIMESTAMP,
    raw_email_content TEXT,
    ecms_req_id_extracted VARCHAR(50),
    parse_status VARCHAR(50),
    parse_errors TEXT,
    extracted_fields_count INTEGER,
    processed_by_user_id UUID,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_notes TEXT,
    status VARCHAR(50),
    is_duplicate BOOLEAN,
    extra_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_REQUIREMENT_IMPORT_LOGS_COMPANY ON requirement_import_logs(company_id);
CREATE INDEX IDX_REQUIREMENT_IMPORT_LOGS_JOB ON requirement_import_logs(job_requirement_id);
CREATE INDEX IDX_REQUIREMENT_IMPORT_LOGS_STATUS ON requirement_import_logs(status);
```

### 5. requirement_tracker_templates
```sql
CREATE TABLE requirement_tracker_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_requirement_id UUID REFERENCES job_requirements(id) ON DELETE CASCADE,
    tracker_source VARCHAR(255),
    tracker_type VARCHAR(50),
    columns JSONB DEFAULT '[]',
    total_columns INTEGER,
    column_mapping JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_REQUIREMENT_TRACKER_TEMPLATES_COMPANY ON requirement_tracker_templates(company_id);
CREATE INDEX IDX_REQUIREMENT_TRACKER_TEMPLATES_JOB ON requirement_tracker_templates(job_requirement_id);
```

---

## Files Created

### Migration
- `src/migrations/1736162400000-MigrateJobRequirementsModule.ts`

### Entities (5)
- `src/modules/jobs/entities/job-requirement.entity.ts`
- `src/modules/jobs/entities/requirement-skill.entity.ts`
- `src/modules/jobs/entities/requirement-assignment.entity.ts`
- `src/modules/jobs/entities/requirement-import-log.entity.ts`
- `src/modules/jobs/entities/requirement-tracker-template.entity.ts`

### DTOs (4)
- `src/modules/jobs/dto/create-job.dto.ts` (38 fields with validation)
- `src/modules/jobs/dto/update-job.dto.ts`
- `src/modules/jobs/dto/job-response.dto.ts`
- `src/modules/jobs/dto/filter-job.dto.ts`

### Service
- `src/modules/jobs/job.service.ts`

### Controller
- `src/modules/jobs/job.controller.ts`

### Module
- `src/modules/jobs/job.module.ts`

---

## API Endpoints

All endpoints protected with `@UseGuards(JwtAuthGuard)` and `@RequirePermissions('jobs:*')`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/api/v1/jobs` | `jobs:create` | Create new job requirement |
| GET | `/api/v1/jobs` | `jobs:read` | List all jobs with pagination/filters |
| GET | `/api/v1/jobs/stats` | `jobs:read` | Get job statistics (total, by priority, by client) |
| GET | `/api/v1/jobs/search/skills?skills=Java,React` | `jobs:read` | Search jobs by mandatory skills |
| GET | `/api/v1/jobs/my-assignments` | `jobs:read` | Get jobs assigned to current user |
| GET | `/api/v1/jobs/ecms/:ecmsReqId` | `jobs:read` | Get job by ECMS requirement ID |
| GET | `/api/v1/jobs/:id` | `jobs:read` | Get single job with relations |
| PATCH | `/api/v1/jobs/:id` | `jobs:update` | Update job requirement |
| DELETE | `/api/v1/jobs/:id` | `jobs:delete` | Soft delete (set active_flag = false) |
| DELETE | `/api/v1/jobs/:id/hard` | `jobs:delete` | Hard delete (permanent removal) |
| PATCH | `/api/v1/jobs/bulk/priority` | `jobs:update` | Bulk update priority for multiple jobs |

---

## Service Methods (Tenant-Scoped)

All methods filter by `company_id` from JWT token:

1. **create(createJobDto, companyId, userId)**
   - Validates unique ECMS req ID
   - Sets company_id, created_by, updated_by
   
2. **findAll(filters, companyId)**
   - Pagination support (page, limit)
   - Filters: job_title, client_id, ecms_req_id, domain, business_unit, priority, active_flag, mandatory_skills, country, work_location, wfo_wfh_hybrid
   - Sorting: sortBy, sortOrder (ASC/DESC)
   - Returns: { data, total, page, limit }
   
3. **findOne(id, companyId)**
   - Returns job with relations: skills, assignments, importLogs, trackerTemplates
   
4. **findByEcmsId(ecmsReqId, companyId)**
   - Lookup by ECMS requirement ID
   
5. **update(id, updateJobDto, companyId, userId)**
   - Validates unique ECMS req ID on update
   
6. **remove(id, companyId)**
   - Soft delete: sets active_flag = false
   
7. **hardDelete(id, companyId)**
   - Permanent removal
   
8. **getStats(companyId)**
   - Returns: totalJobs, activeJobs, inactiveJobs, totalOpenings
   - Groups: jobsByPriority, topClients (top 10)
   
9. **searchBySkills(skills[], companyId)**
   - ILIKE search on mandatory_skills column
   
10. **findJobsAssignedToUser(userId, companyId)**
    - Returns jobs with assignments for specific user
    
11. **bulkUpdatePriority(jobIds[], priority, companyId)**
    - Mass priority update

---

## Multi-Tenant Enforcement

### Database Level
- All 5 tables have `company_id UUID NOT NULL`
- Foreign key: `REFERENCES companies(id) ON DELETE CASCADE`
- Indexes: All tables indexed on `(company_id)` and `(company_id, active_flag)` where applicable

### Service Level
```typescript
// Every query scoped by company_id
const job = await this.jobRepository.findOne({
  where: {
    id,
    company_id: companyId, // ← Tenant isolation
  },
});
```

### Controller Level
```typescript
// company_id extracted from JWT token
@Post()
@RequirePermissions('jobs:create')
async create(@Body() createJobDto: CreateJobDto, @Request() req) {
  const companyId = req.user.company_id; // ← From JWT
  return this.jobService.create(createJobDto, companyId, req.user.userId);
}
```

---

## Validation Rules

### CreateJobDto (38 fields)
- **ecms_req_id**: @IsString @IsNotEmpty (unique per company)
- **client_id**: @IsUUID @IsNotEmpty
- **job_title**: @IsString @IsNotEmpty
- **mandatory_skills**: @IsString @IsNotEmpty
- **total_experience_min**: @IsInt @Min(0)
- **relevant_experience_min**: @IsInt @Min(0)
- **number_of_openings**: @IsInt @Min(1)
- **project_manager_email**: @IsEmail
- **delivery_spoc_1_email**: @IsEmail
- **delivery_spoc_2_email**: @IsEmail
- **vendor_rate**: @IsNumber
- **priority**: ['Low', 'Medium', 'High', 'Critical']
- **active_flag**: @IsBoolean
- **extra_fields**: @IsObject (JSONB for custom fields)

### FilterJobDto
- **Filters**: job_title, client_id, ecms_req_id, domain, business_unit, priority, active_flag, mandatory_skills, country, work_location, wfo_wfh_hybrid
- **Pagination**: page (default 1), limit (default 20)
- **Sorting**: sortBy (default 'created_at'), sortOrder ('ASC'|'DESC', default 'DESC')

---

## Permissions Added

Updated `src/auth/services/auth.service.ts` to include:
- `jobs:read`
- `jobs:create`
- `jobs:update`
- `jobs:delete` (admin only via wildcard `*`)

Non-admin users get: `['candidates:read', 'jobs:read', 'jobs:create', 'jobs:update', 'submissions:read', 'interviews:read', 'offers:read']`

---

## Testing Checklist

### Manual Testing
- [ ] Create job requirement via POST `/api/v1/jobs`
- [ ] Verify ECMS req ID uniqueness validation
- [ ] List jobs with pagination (GET `/api/v1/jobs?page=1&limit=10`)
- [ ] Filter by priority (GET `/api/v1/jobs?priority=High`)
- [ ] Filter by client (GET `/api/v1/jobs?client_id=<uuid>`)
- [ ] Search by skills (GET `/api/v1/jobs/search/skills?skills=Java,Python`)
- [ ] Get job by ECMS ID (GET `/api/v1/jobs/ecms/ECM-12345`)
- [ ] Get job stats (GET `/api/v1/jobs/stats`)
- [ ] Get my assignments (GET `/api/v1/jobs/my-assignments`)
- [ ] Update job (PATCH `/api/v1/jobs/:id`)
- [ ] Soft delete job (DELETE `/api/v1/jobs/:id`) → verify active_flag = false
- [ ] Hard delete job (DELETE `/api/v1/jobs/:id/hard`)
- [ ] Bulk priority update (PATCH `/api/v1/jobs/bulk/priority`)

### Tenant Isolation Testing
- [ ] Create job with company_id A
- [ ] Login as user from company_id B
- [ ] Attempt to access company A's job → should return 404
- [ ] Verify all queries filtered by company_id in logs

### Permission Testing
- [ ] Admin user → all endpoints accessible
- [ ] Recruiter user → read, create, update accessible
- [ ] Viewer user → only read accessible
- [ ] Unauthorized user → 401 error

---

## Module Integration

### app.module.ts
```typescript
import { JobModule } from './modules/jobs/job.module';

@Module({
  imports: [
    // ... other modules
    JobModule, // ← Already imported
  ],
})
export class AppModule {}
```

### job.module.ts
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobRequirement,
      RequirementSkill,
      RequirementAssignment,
      RequirementImportLog,
      RequirementTrackerTemplate,
    ]),
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService, TypeOrmModule], // ← Exported for other modules
})
export class JobModule {}
```

---

## Key Features

### 1. ECMS Integration
- `ecms_req_id` field for external system integration
- Import logs track email-based requirement imports
- Parse status tracking with error logging

### 2. Skill Mapping
- Links jobs to skills with proficiency levels
- Mandatory vs. desired skill differentiation
- Years of experience requirements

### 3. Recruiter Assignments
- Track who's assigned to each job
- Target submission counts and dates
- Assignment status and completion tracking

### 4. Tracker Templates
- JSONB column configuration for tracker spreadsheets
- Column mapping for import/export
- Multiple template versions per job

### 5. Rich Metadata
- SPOC (Single Point of Contact) tracking for delivery
- BGV (Background Verification) requirements
- Interview mode and platform preferences
- Screenshot requirements
- Vendor rates with currency

---

## Business Logic

### Duplicate Prevention
- ECMS req ID must be unique within company
- Check on create and update operations
- Returns 400 BadRequest with descriptive error

### Soft Delete Support
- `active_flag` for logical deletion
- Queries can filter by active_flag
- Hard delete available for permanent removal

### Priority Management
- 4 levels: Low, Medium (default), High, Critical
- Bulk update endpoint for mass priority changes
- Statistics grouped by priority

### Assignment Tracking
- Multiple recruiters can be assigned to one job
- Target counts for submissions
- Status tracking (assigned, in_progress, completed)
- Completion notes and timestamps

---

## Migration Notes

### Running the Migration
```bash
npm run migration:run
```

### Rollback
```bash
npm run migration:revert
```

### Verify Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%requirement%' OR table_name = 'job_requirements';
```

---

## Next Steps (Phase 1.3)

**Module:** Submissions  
**Tables:** submissions, submission_history, submission_documents, submission_feedback  
**Dependencies:** Candidates (Phase 1.1), Jobs (Phase 1.2)  
**Pattern:** Same multi-tenant UUID approach  

---

## Notes

- All queries use TypeORM QueryBuilder for complex filters
- JSONB columns (`extra_fields`, `extra_metadata`, `columns`, `column_mapping`) allow schema flexibility
- Indexes optimized for common query patterns (company_id, active_flag, priority)
- Swagger documentation auto-generated from DTOs
- Follows exact same pattern as Candidates module for consistency

---

**✅ Phase 1.2 COMPLETE - Ready for Phase 1.3 (Submissions)**
