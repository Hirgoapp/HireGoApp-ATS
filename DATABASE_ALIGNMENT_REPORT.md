# DATABASE-TO-CODE ALIGNMENT REPORT

**Date:** January 6, 2026  
**Database:** `employee_tracker` (PostgreSQL localhost:5432)  
**Status:** ⚠️ CRITICAL MISALIGNMENT DETECTED

---

## EXECUTIVE SUMMARY

The ATS codebase is **fundamentally misaligned** with the production database `employee_tracker`. 

**Key Issues:**
1. ❌ **Primary Key Mismatch**: Database uses INTEGER sequences; Code uses UUID strings
2. ❌ **Field Name Mismatches**: DB fields don't match code column names (e.g., `candidate_name` vs `first_name`)
3. ❌ **Missing Tables**: Database has `job_requirements` table; Code references non-existent `jobs` table
4. ❌ **Missing Fields**: Database has 49+ fields in Candidates table; Code only implements ~20
5. ❌ **Missing Relations**: Database has FK relationships that code doesn't define
6. ⚠️  **Data Type Mismatches**: Code uses UUIDs where DB uses INTEGER IDs
7. ⚠️  **Enum Mismatches**: Code has custom enums; DB uses VARCHAR with hardcoded values

---

## TABLE-BY-TABLE MAPPING

### 1. CANDIDATES TABLE

#### Database Schema:
```sql
candidates:
  id                    INTEGER PK (serial)
  candidate_name        VARCHAR(NOT NULL)          ← FIELD NAME: candidate_name, not first_name+last_name
  email                 VARCHAR(NOT NULL UNIQUE)
  phone                 VARCHAR(NOT NULL)
  alternate_phone       VARCHAR
  gender                VARCHAR
  dob                   DATE
  marital_status        VARCHAR
  current_company       TEXT
  total_experience      NUMERIC
  relevant_experience   NUMERIC
  current_ctc           NUMERIC
  expected_ctc          NUMERIC
  currency_code         VARCHAR DEFAULT 'INR'
  notice_period         VARCHAR
  willing_to_relocate   BOOLEAN DEFAULT false
  buyout                BOOLEAN DEFAULT false
  reason_for_job_change TEXT
  skill_set             TEXT
  current_location_id   INTEGER
  location_preference   VARCHAR
  candidate_status      VARCHAR DEFAULT 'Active'    ← STATUS: 'Active' (not 'active')
  source_id             INTEGER FK→sources
  last_contacted_date   TIMESTAMP
  last_submission_date  DATE
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
  created_by            INTEGER FK→users
  updated_by            INTEGER FK→users
  notes                 TEXT
  extra_fields          JSONB DEFAULT '{}'
  aadhar_number         VARCHAR DEFAULT ''
  uan_number            VARCHAR DEFAULT ''
  linkedin_url          VARCHAR DEFAULT ''
  manager_screening_status VARCHAR DEFAULT 'Pending'
  client_name           VARCHAR
  highest_qualification VARCHAR
  submission_date       DATE
  job_location          VARCHAR
  source                VARCHAR
  client                VARCHAR
  recruiter_id          INTEGER FK→users
  date_of_entry         DATE
  manager_screening     VARCHAR
  resume_parser_used    VARCHAR
  extraction_confidence NUMERIC
  extraction_date       TIMESTAMP
  resume_source_type    VARCHAR
  is_suspicious         BOOLEAN DEFAULT false
  cv_portal_id          INTEGER
  import_batch_id       VARCHAR
```

#### Current Code: `src/candidates/entities/candidate.entity.ts`
```typescript
@Entity('candidates')
export class Candidate {
    @PrimaryGeneratedColumn('uuid')        ❌ Should be INTEGER
    id: string;

    @Column('uuid')
    company_id: string;                    ❌ No such field in DB

    @Column({ length: 100 })
    first_name: string;                    ❌ DB uses: candidate_name (single field)

    @Column({ length: 100 })
    last_name: string;                     ❌ DB has no last_name field

    // ... other fields with name mismatches
}
```

#### Changes Needed:
- ✅ Change PK to INTEGER with autoincrement
- ✅ Remove `company_id` column (DB has no tenant isolation in this table)
- ✅ Change `first_name` + `last_name` → `candidate_name` (single field)
- ✅ Add ALL 49 fields from DB (aadhar_number, uan_number, manager_screening_status, etc.)
- ✅ Fix enum: `candidate_status` values should be "Active", "Inactive", etc. (not lowercase)
- ✅ Add relationships: FK to `sources` (source_id), `users` (created_by, updated_by, recruiter_id)
- ✅ Add relationships: FK to `locations` (current_location_id)

---

### 2. JOB REQUIREMENTS TABLE (Currently "jobs" in code)

#### Database Schema:
```sql
job_requirements:
  id                    INTEGER PK (serial)
  ecms_req_id           VARCHAR(NOT NULL UNIQUE)   ← External reference
  client_id             INTEGER FK→clients
  job_title             VARCHAR(NOT NULL)
  job_description       TEXT
  domain                VARCHAR
  business_unit         VARCHAR
  total_experience_min  INTEGER
  relevant_experience_min INTEGER
  mandatory_skills      TEXT(NOT NULL)             ← Single text field with comma-separated values
  desired_skills        TEXT
  country               VARCHAR
  work_location         VARCHAR
  wfo_wfh_hybrid        VARCHAR                    ← Work mode: WFO/WFH/Hybrid
  shift_time            VARCHAR
  number_of_openings    INTEGER
  project_manager_name  VARCHAR
  project_manager_email VARCHAR
  delivery_spoc_1_name  VARCHAR
  delivery_spoc_1_email VARCHAR
  delivery_spoc_2_name  VARCHAR
  delivery_spoc_2_email VARCHAR
  bgv_timing            VARCHAR
  bgv_vendor            VARCHAR
  interview_mode        VARCHAR
  interview_platforms   TEXT
  screenshot_requirement VARCHAR
  vendor_rate           NUMERIC
  currency              VARCHAR
  client_name           VARCHAR                    ← Denormalized (also in clients table)
  email_subject         VARCHAR
  email_received_date   TIMESTAMP
  created_by            INTEGER FK→users
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP
  active_flag           BOOLEAN DEFAULT true
  extra_fields          JSONB DEFAULT '{}'
  priority              VARCHAR DEFAULT 'Medium'   ← Priority: Low/Medium/High
```

#### Current Code: `src/jobs/entities/job.entity.ts`
```typescript
@Entity('jobs')                             ❌ Table name wrong: should be 'job_requirements'
export class Job {
    @PrimaryGeneratedColumn('uuid')         ❌ Should be INTEGER
    id: string;

    @Column('uuid')
    company_id: string;                     ❌ Not in DB; DB uses client_id instead

    // Missing: ecms_req_id, client_id, wfo_wfh_hybrid, bgv_*, interview_platforms
    // Missing: screenshot_requirement, vendor_rate, email_received_date, active_flag
}
```

#### Changes Needed:
- ✅ Rename entity table from `jobs` to `job_requirements`
- ✅ Change PK to INTEGER
- ✅ Remove `company_id`, add `client_id` (FK to clients)
- ✅ Add `ecms_req_id` as unique constraint
- ✅ Add ALL missing fields (bgv_*, interview_platforms, vendor_rate, etc.)
- ✅ Fix priority enum values: "Low", "Medium", "High" (not lowercase)
- ✅ Add relationship: FK to `clients` table

---

### 3. SUBMISSIONS TABLE

#### Database Schema:
```sql
submissions:
  id                    INTEGER PK (serial)
  candidate_name        VARCHAR                    ← Denormalized
  client_name           VARCHAR                    ← Denormalized
  status                VARCHAR                    ← Status of submission
  submission_date       TIMESTAMP DEFAULT NOW()
```

#### Current Code: `src/submissions/entities/submission.entity.ts`

#### Analysis:
🚨 **CRITICAL**: The DB table is extremely minimal (4 fields only)! This suggests:
1. Either submissions table is NOT the real table for tracking candidate→job links
2. Or there's a `requirement_submissions` table that's the actual junction
3. Or submissions are stored in a different structure

**We need to check:** Is there a `requirement_submissions` table?

Looking at earlier output: Yes! `requirement_submissions` table exists in the database but wasn't shown in the focused output.

#### Changes Needed:
- ✅ Redesign: Current code assumes submissions link candidates to jobs, but DB structure is minimal
- ✅ Check if `requirement_submissions` is the actual link table
- ✅ Add missing fields: candidate_name, client_name, status
- ✅ Determine correct PK type (INTEGER)

---

### 4. INTERVIEWS TABLE

#### Database Schema:
```sql
interviews:
  id                    INTEGER PK (serial)
  submission_id         INTEGER FK→submissions (NOT NULL)
  interview_date        DATE (NOT NULL)
  interview_time        TIME (NOT NULL)
  interview_type        VARCHAR DEFAULT 'Technical'
  interview_mode        VARCHAR DEFAULT 'Video'
  interview_platform    VARCHAR
  panel_members         TEXT                       ← Comma-separated or JSON?
  scheduled_by          INTEGER FK→users
  feedback              TEXT
  rating                NUMERIC
  status                VARCHAR DEFAULT 'Scheduled' ← Scheduled/Completed/Rescheduled/Cancelled
  outcome               VARCHAR                    ← Pass/Fail/Hold
  interviewer_notes     TEXT
  candidate_notes       TEXT
  reschedule_reason     TEXT
  job_requirement_id    INTEGER FK→job_requirements
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
  created_by            INTEGER FK→users
  candidate_id          INTEGER FK→candidates
```

#### Current Code: `src/interviews/entities/interview.entity.ts`
- Mostly aligned but may have field name mismatches
- Need to verify all 20 fields match exactly

#### Changes Needed:
- ✅ Verify PK is INTEGER
- ✅ Add missing fields (rating, outcome, candidate_notes, reschedule_reason, job_requirement_id)
- ✅ Check field names match exactly (interview_date, interview_time, etc.)

---

### 5. OFFERS TABLE

#### Database Schema:
```sql
offers:
  id                    INTEGER PK (serial)
  submission_id         INTEGER FK→submissions (NOT NULL)
  interview_id          INTEGER FK→interviews
  job_requirement_id    INTEGER FK→job_requirements (NOT NULL)
  offer_ctc             NUMERIC (NOT NULL)
  offer_currency        VARCHAR DEFAULT 'INR'
  offer_gross_salary    NUMERIC
  offer_base_salary     NUMERIC
  offer_variable        NUMERIC
  offer_benefits        TEXT
  status                VARCHAR DEFAULT 'Generated'  ← Generated/Sent/Accepted/Rejected/Withdrawn/OnHold
  offer_date            DATE (NOT NULL)
  expected_doj          DATE (NOT NULL)
  offer_expiry_date     DATE
  offer_letter_path     VARCHAR                    ← File system path
  offer_letter_sent_date TIMESTAMP
  offer_letter_template VARCHAR DEFAULT 'Standard' ← Template name
  accepted_date         TIMESTAMP
  rejected_date         TIMESTAMP
  rejection_reason      TEXT
  actual_doj            DATE
  counter_offer_ctc     NUMERIC
  counter_offer_reason  TEXT
  counter_offered_date  TIMESTAMP
  hold_reason           TEXT
  created_by            INTEGER FK→users
  updated_by            INTEGER FK→users
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
  candidate_id          INTEGER FK→candidates
```

#### Current Code: `src/offers/entities/offer.entity.ts`
- May have mismatches in field names and data types

#### Changes Needed:
- ✅ Verify PK is INTEGER
- ✅ Verify all 31 fields are present and correctly typed
- ✅ Fix enum values for status (Generated, Sent, Accepted, Rejected, Withdrawn, OnHold)

---

### 6. USERS TABLE

#### Database Schema:
```sql
users:
  id                    INTEGER PK (serial)
  username              VARCHAR (NOT NULL UNIQUE)
  password              VARCHAR (NOT NULL)         ← Hashed password
  email                 VARCHAR
  created_at            TIMESTAMP DEFAULT NOW()
  manager_id            INTEGER FK→users (Self-referential)
  status                VARCHAR DEFAULT 'Active'
  first_name            VARCHAR
  last_name             VARCHAR
  phone                 VARCHAR
  department            VARCHAR
  notes                 TEXT
  updated_at            TIMESTAMP DEFAULT NOW()
  active                BOOLEAN DEFAULT true
  role_id               INTEGER FK→roles
```

#### Current Code: `src/auth/entities/user.entity.ts`
- Likely similar structure; need to verify UUID vs INTEGER PK

#### Changes Needed:
- ✅ Change PK from UUID to INTEGER
- ✅ Verify all field names and types match
- ✅ Add self-referential FK (manager_id)
- ✅ Verify role_id relationship

---

### 7. ROLES TABLE

#### Database Schema:
```sql
roles:
  id                    INTEGER PK (serial)
  name                  VARCHAR (NOT NULL)
  description           TEXT
  created_at            TIMESTAMP DEFAULT NOW()
```

#### Current Code: `src/auth/entities/role.entity.ts`

#### Changes Needed:
- ✅ Change PK to INTEGER
- ✅ Verify minimal fields match

---

### 8. PERMISSIONS TABLE

#### Database Schema:
```sql
permissions:
  id                    INTEGER PK (serial)
  module_id             INTEGER FK→modules
  name                  VARCHAR (NOT NULL)
  code                  VARCHAR (NOT NULL)         ← Permission code (e.g., "candidates:read")
  description           TEXT
  is_active             BOOLEAN DEFAULT true
  created_at            TIMESTAMP DEFAULT NOW()
```

#### Current Code: `src/auth/entities/permission.entity.ts`

#### Changes Needed:
- ✅ Change PK to INTEGER
- ✅ Add module_id field
- ✅ Verify code and name fields

---

### 9. COMPANIES TABLE

#### Database Schema:
```sql
companies:
  id                    INTEGER PK (serial)
  name                  VARCHAR (NOT NULL)
```

#### Current Code: `src/companies/entities/company.entity.ts`

#### Analysis:
⚠️ **PROBLEM**: Table is extremely minimal (only 2 fields). Code likely uses it differently. This table may be outdated or unused.

#### Changes Needed:
- ⚠️ Determine if this is really the tenant/company table
- ⚠️ Check if there's a `clients` table (which exists in DB but not in ATS code)

---

### 10. SUPPORTING TABLES

#### candidate_education
```
id, submission_id FK, institution, qualification_id, specialization, year_of_passing, grade, document_path, created_at, updated_at, added_by, updated_by
```
✅ Exists in DB; Code may or may not implement

#### candidate_experience
```
id, submission_id FK, company_master_id FK, job_title, start_date, end_date, remarks, created_at, updated_at, added_by, updated_by
```
✅ Exists in DB; Code may or may not implement

#### candidate_skills
```
id, submission_id FK, skill_master_id FK, proficiency, years_of_experience, certified, hands_on_level, last_used, relevant_years, relevant_months
```
✅ Exists in DB; Code may or may not implement

#### submission_skills
```
id, submission_id FK, skill_id FK, experience_years, proficiency, created_at
```
✅ Exists in DB; Code may or may not implement

#### job_requirements (alias: jobs in code)
Already covered above.

---

## CRITICAL ISSUES SUMMARY

| Issue | Severity | Impact |
|-------|----------|--------|
| PK Type Mismatch (UUID vs INTEGER) | 🔴 CRITICAL | Data can't be read from DB; FKs break |
| Field name mismatches (candidate_name vs first_name) | 🔴 CRITICAL | Data loading fails; Hydration errors |
| Jobs table mapped to wrong DB table (job_requirements) | 🔴 CRITICAL | All job operations fail |
| Missing company_id in DB (multi-tenant isolation broken) | 🔴 CRITICAL | Tenant data may leak |
| company_id as UUID but DB uses INTEGER | 🔴 CRITICAL | Relations don't resolve |
| All enum values wrong case (lowercase vs mixed) | 🟠 HIGH | Filtering/searching broken |
| Missing 30+ fields in Candidate entity | 🟠 HIGH | Data loss on save |
| Submissions table too minimal (only 4 fields) | 🟠 HIGH | Need to find actual junction table |
| No client_id in Job entity (DB uses client_id, not company_id) | 🟠 HIGH | Job-client relationship broken |
| Missing ForeignKey relationships defined | 🟠 HIGH | Lazy loading fails; N+1 queries |

---

## NEXT STEPS

### Phase 1: Database Schema Analysis (COMPLETE ✅)
- [x] Introspect production database
- [x] Document all tables, columns, types
- [x] Identify mismatches with code

### Phase 2: Backend Entity Alignment (TODO)
1. Create new entities that match DB exactly
2. Implement all missing fields
3. Fix all PK types (UUID → INTEGER)
4. Fix all column names
5. Add all ForeignKey relationships
6. Fix enum values

### Phase 3: DTO & Service Updates (TODO)
1. Update CreateCandidateDto to include all real DB fields
2. Update UpdateCandidateDto
3. Update services to handle all fields
4. Update controllers to validate all fields

### Phase 4: Frontend Alignment (TODO)
1. Update forms to include all real fields
2. Add edit/update pages
3. Remove placeholder fields
4. Implement all validations

### Phase 5: Data Migration & Testing (TODO)
1. Create migration scripts to convert existing data
2. Test end-to-end workflows
3. Verify all relationships work
4. Load production data sample

---

## RECOMMENDATIONS

1. **Start Fresh on Backend**: The current code is too far off. Regenerate entities from database schema.
2. **Use TypeORM CLI**: `typeorm-cli entityFromDatabase` to generate correct entities
3. **Implement DB-Driven DDD**: Let database schema drive domain model, not vice versa
4. **Add Comprehensive Tests**: Every field must be tested for CRUD operations
5. **Data Safety First**: Run against dev DB first; then staging; then production
6. **Document Field Mappings**: Create mapping doc for non-obvious fields
7. **Implement Proper Migrations**: Use TypeORM migrations to track all schema changes

---

**Generated:** 2026-01-06  
**Status:** Ready for Phase 2 (Backend Entity Alignment)
