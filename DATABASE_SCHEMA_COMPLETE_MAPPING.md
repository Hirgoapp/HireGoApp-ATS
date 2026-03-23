# COMPLETE DATABASE-TO-CODE ALIGNMENT REPORT v2

**Date:** January 6, 2026  
**Database:** `employee_tracker` (PostgreSQL)  
**Status:** 🔴 CRITICAL MISALIGNMENT - Requires Complete Backend Rewrite

---

## KEY DISCOVERY: ACTUAL DATA MODEL

The real database structure is significantly different from what the code implements:

### Real Model (from database):
```
candidates  ← Basic candidate info (no direct link to jobs)
    ↓
requirement_submissions  ← The actual candidate→job junction table
    ↓ (job_requirement_id)
job_requirements  ← All job postings/requirements
```

### Code Assumption (WRONG):
```
candidates
    ↓
submissions  ← Mini table with only 4 fields
    ↓
jobs  ← Non-existent table (code invented it)
```

---

## COMPLETE TABLE MAPPING

### TABLE 1: candidates (INTEGER PK, 49 fields)

**Database Field Name** → **Code Field Name** ❌ Status

```
id → id (but UUID in code, should be INTEGER)
candidate_name → first_name + last_name (WRONG: DB has single field)
email → email ✓
phone → phone ✓
alternate_phone → (MISSING in code)
gender → (MISSING)
dob → (MISSING)
marital_status → (MISSING)
current_company → current_company ✓
total_experience → years_of_experience (close, but NUMERIC vs INT)
relevant_experience → (MISSING)
current_ctc → (MISSING)
expected_ctc → (MISSING)
currency_code → (MISSING)
notice_period → notice_period ✓
willing_to_relocate → (MISSING)
buyout → (MISSING)
reason_for_job_change → (MISSING)
skill_set → (MISSING)
current_location_id → (MISSING, FK to locations)
location_preference → (MISSING)
candidate_status → status (but value mismatches: "Active" vs "active")
source_id → (MISSING, FK to sources table)
last_contacted_date → (MISSING)
last_submission_date → (MISSING)
created_at → created_at ✓
updated_at → updated_at ✓
created_by → (MISSING, FK to users)
updated_by → (MISSING, FK to users)
notes → notes ✓
extra_fields → (MISSING, JSONB field)
aadhar_number → (MISSING)
uan_number → (MISSING)
linkedin_url → linkedin_url ✓
manager_screening_status → (MISSING)
client_name → (MISSING, denormalized)
highest_qualification → (MISSING)
submission_date → (MISSING)
job_location → (MISSING)
source → (MISSING)
client → (MISSING)
recruiter_id → (MISSING, FK to users)
date_of_entry → (MISSING)
manager_screening → (MISSING)
resume_parser_used → (MISSING)
extraction_confidence → (MISSING)
extraction_date → (MISSING)
resume_source_type → (MISSING)
is_suspicious → (MISSING)
cv_portal_id → (MISSING)
import_batch_id → (MISSING)
```

**Action:** Rewrite entire Candidate entity; drop company_id; add 30+ missing fields

---

### TABLE 2: job_requirements (INTEGER PK, 35 fields)

**Current Code:** References non-existent `jobs` table in `jobs` module

```
id → id (but UUID in code, should be INTEGER)
ecms_req_id → (MISSING, unique external ref)
client_id → company_id (WRONG: DB uses client_id, not company_id; FK to clients)
job_title → title ✓
job_description → description ✓
domain → (MISSING)
business_unit → (MISSING)
total_experience_min → min_years_experience (maybe similar)
relevant_experience_min → (MISSING)
mandatory_skills → skills_required (maybe similar, but TEXT not array)
desired_skills → (MISSING)
country → country ✓
work_location → location (similar)
wfo_wfh_hybrid → (MISSING, important field: "WFO"/"WFH"/"Hybrid")
shift_time → (MISSING)
number_of_openings → openings ✓
project_manager_name → (MISSING)
project_manager_email → (MISSING)
delivery_spoc_1_name → (MISSING)
delivery_spoc_1_email → (MISSING)
delivery_spoc_2_name → (MISSING)
delivery_spoc_2_email → (MISSING)
bgv_timing → (MISSING)
bgv_vendor → (MISSING)
interview_mode → (MISSING)
interview_platforms → (MISSING, TEXT field)
screenshot_requirement → (MISSING)
vendor_rate → (MISSING)
currency → (MISSING)
client_name → (MISSING, denormalized)
email_subject → (MISSING)
email_received_date → (MISSING)
created_by → created_by ✓ (FK to users)
created_at → created_at ✓
updated_at → updated_at ✓
active_flag → status or is_active (MISSING)
extra_fields → (MISSING, JSONB)
priority → (MISSING, VARCHAR DEFAULT 'Medium': Low/Medium/High)
```

**Action:** Rename table from `jobs` to `job_requirements`; add 20+ missing fields; change FKs

---

### TABLE 3: requirement_submissions (INTEGER PK, 32 fields) ⭐ THE REAL JUNCTION TABLE

**Current Code:** Has minimal `submissions` table with only 4 fields (WRONG DATA MODEL)

```
id → id (but should be INTEGER not UUID)
job_requirement_id → job_id (FK to job_requirements, NOT NULL)
daily_submission_id → (MISSING)
profile_submission_date → submission_date (DATE field)
vendor_email_id → (MISSING)
candidate_title → (MISSING)
candidate_name → (MISSING, denormalized)
candidate_phone → (MISSING)
candidate_email → (MISSING)
candidate_notice_period → (MISSING)
candidate_current_location → (MISSING)
candidate_location_applying_for → (MISSING)
candidate_total_experience → (MISSING)
candidate_relevant_experience → (MISSING)
candidate_skills → (MISSING, TEXT field)
vendor_quoted_rate → (MISSING)
interview_screenshot_url → (MISSING)
interview_platform → (MISSING)
screenshot_duration_minutes → (MISSING)
candidate_visa_type → (MISSING)
candidate_engagement_type → (MISSING)
candidate_ex_infosys_employee_id → (MISSING)
submitted_by_user_id → created_by (FK to users)
submitted_at → created_at ✓
submission_status → status (VARCHAR)
status_updated_at → (MISSING)
client_feedback → (MISSING)
client_feedback_date → (MISSING)
created_by → created_by (FK to users)
updated_by → updated_by (FK to users)
created_at → created_at ✓
updated_at → updated_at ✓
extra_fields → extra_fields (JSONB)
```

⚠️ **PROBLEM:** Code assumes `submissions` links candidates to jobs, but actual schema has:
- Embedded candidate data (candidate_name, candidate_email, etc.)
- Does NOT have `candidate_id` field
- Only has `job_requirement_id`

**Action:** Completely redesign Submission entity; remove candidate_id FK; add all denormalized candidate fields; fix status values

---

### TABLE 4: interviews (INTEGER PK, 20 fields)

```
id → id (UUID in code, should be INTEGER)
submission_id → submission_id ✓ (FK to requirement_submissions)
interview_date → scheduled_date (DATE field, NOT NULL)
interview_time → scheduled_time (TIME field, NOT NULL)
interview_type → type ✓ (VARCHAR DEFAULT 'Technical')
interview_mode → mode ✓ (VARCHAR DEFAULT 'Video')
interview_platform → platform ✓
panel_members → (MISSING, TEXT field)
scheduled_by → created_by (FK to users)
feedback → feedback ✓
rating → (MISSING, NUMERIC field)
status → status ✓ (VARCHAR DEFAULT 'Scheduled')
outcome → (MISSING, VARCHAR: Pass/Fail/Hold)
interviewer_notes → notes ✓
candidate_notes → (MISSING)
reschedule_reason → (MISSING)
job_requirement_id → (MISSING, FK to job_requirements)
created_at → created_at ✓
updated_at → updated_at ✓
created_by → created_by ✓ (FK to users)
candidate_id → (MISSING, FK to candidates - for denormalization?)
```

**Action:** Update entity; add 5+ missing fields; verify all field names match exactly

---

### TABLE 5: offers (INTEGER PK, 31 fields)

```
id → id (UUID in code, should be INTEGER)
submission_id → submission_id ✓ (FK to requirement_submissions)
interview_id → interview_id (FK to interviews)
job_requirement_id → job_id (FK to job_requirements, NOT NULL)
offer_ctc → ctc ✓ (NUMERIC NOT NULL)
offer_currency → currency ✓ (VARCHAR DEFAULT 'INR')
offer_gross_salary → gross_salary ✓ (NUMERIC)
offer_base_salary → base_salary ✓ (NUMERIC)
offer_variable → variable_pay ✓ (NUMERIC)
offer_benefits → benefits ✓ (TEXT)
status → status ✓ (VARCHAR DEFAULT 'Generated')
offer_date → offer_date ✓ (DATE NOT NULL)
expected_doj → expected_doj ✓ (DATE NOT NULL)
offer_expiry_date → (MISSING)
offer_letter_path → (MISSING)
offer_letter_sent_date → (MISSING)
offer_letter_template → (MISSING)
accepted_date → accepted_date ✓
rejected_date → rejected_date ✓
rejection_reason → rejection_reason ✓
actual_doj → actual_doj ✓
counter_offer_ctc → (MISSING)
counter_offer_reason → (MISSING)
counter_offered_date → (MISSING)
hold_reason → (MISSING)
created_by → created_by ✓ (FK to users)
updated_by → updated_by ✓ (FK to users)
created_at → created_at ✓
updated_at → updated_at ✓
candidate_id → (MISSING, FK to candidates)
```

**Action:** Update entity; add 7+ missing fields; ensure status enums match DB values

---

### TABLE 6: users (INTEGER PK, 13 fields)

```
id → id (UUID in code, should be INTEGER)
username → username ✓ (UNIQUE)
password → password ✓
email → email ✓
created_at → created_at ✓
manager_id → (MISSING, self-referential FK to users)
status → status ✓ (DEFAULT 'Active')
first_name → first_name ✓
last_name → last_name ✓
phone → phone ✓
department → department ✓
notes → notes ✓
updated_at → updated_at ✓
active → is_active (BOOLEAN DEFAULT true)
role_id → role_id ✓ (FK to roles)
```

**Action:** Change PK from UUID to INTEGER; add manager_id self-referential FK

---

### TABLE 7: roles (INTEGER PK, 3 fields)

```
id → id (UUID in code, should be INTEGER)
name → name ✓
description → description ✓
created_at → created_at ✓
```

**Action:** Change PK to INTEGER

---

### TABLE 8: permissions (INTEGER PK, 5 fields)

```
id → id (UUID in code, should be INTEGER)
module_id → (MISSING, FK to modules table)
name → name ✓
code → code ✓
description → description ✓
is_active → is_active ✓
created_at → created_at ✓
```

**Action:** Change PK to INTEGER; add module_id field

---

### TABLE 9: companies (INTEGER PK, 1 field) ⚠️ MINIMAL

```
id → id (UUID in code, should be INTEGER)
name → name ✓
```

**Analysis:** This table is either:
1. Unused (deprecated)
2. A placeholder that should be removed
3. Should be merged with `clients` table

**Action:** Clarify purpose; likely should be replaced with `clients` table

---

### TABLE 10: clients (INTEGER PK, 13 fields) - NEW (Not in code)

```
id → (NOT IN CODE)
name → (NOT IN CODE)
created_at → (NOT IN CODE)
active → (NOT IN CODE)
industry → (NOT IN CODE)
address → (NOT IN CODE)
payment_terms → (NOT IN CODE)
gst_number → (NOT IN CODE)
pan_number → (NOT IN CODE)
agreement_start → (NOT IN CODE)
agreement_end → (NOT IN CODE)
billing_email → (NOT IN CODE)
notes → (NOT IN CODE)
updated_at → (NOT IN CODE)
```

**Action:** Create Client entity; add to code; update job_requirements to FK to clients

---

### SUPPORTING TABLES (Needed for full features)

#### candidate_education
```
id, submission_id FK, institution, qualification_id FK, specialization, year_of_passing, grade, document_path, created_at, updated_at, added_by FK, updated_by FK
```
**Status:** NOT IN CODE - Need to add

#### candidate_experience
```
id, submission_id FK, company_master_id FK, job_title, start_date, end_date, remarks, created_at, updated_at, added_by FK, updated_by FK
```
**Status:** NOT IN CODE - Need to add

#### candidate_skills
```
id, submission_id FK, skill_master_id FK, proficiency, years_of_experience, certified, hands_on_level, last_used, relevant_years, relevant_months
```
**Status:** NOT IN CODE - Need to add

#### submission_skills
```
id, submission_id FK, skill_id FK, experience_years, proficiency, created_at
```
**Status:** NOT IN CODE - Need to add

#### locations
```
id, name
```
**Status:** NOT IN CODE - Need to add; referenced by candidates.current_location_id

#### skill_masters
```
id, name, created_at
```
**Status:** NOT IN CODE - Need to add; referenced by candidate_skills

#### qualifications
```
id, name, created_at, active
```
**Status:** NOT IN CODE - Need to add; referenced by candidate_education

---

## CRITICAL DATA MODEL ISSUES

### Issue #1: Multi-Tenancy Missing
- Database has NO `company_id` or `tenant_id` field in candidates/jobs/submissions
- Code assumes all tables are multi-tenant with `company_id`
- **Impact:** Code will break on save; FKs won't resolve; queries wrong

### Issue #2: Primary Key Type Mismatch
- Database: All tables use INTEGER with SEQUENCE
- Code: All entities use UUID strings
- **Impact:** Cannot read any data from DB; FKs won't resolve

### Issue #3: Data Model Mismatch
- Code assumes: `candidates` → `submissions` → `jobs` (wrong)
- Database has: `candidates`, `requirement_submissions`, `job_requirements` (correct)
- **Impact:** Entire submission flow is broken

### Issue #4: Missing Foreign Key Relationships
- Code doesn't define: submitted_by_user_id, created_by, updated_by relationships
- Code doesn't define: clients table relationships
- **Impact:** Lazy loading fails; N+1 queries; data consistency lost

### Issue #5: Enum Value Case Mismatch
- Code uses: lowercase enums (e.g., "active", "technical")
- Database uses: mixed case (e.g., "Active", "Technical")
- **Impact:** Filtering/search fails; status checks fail

### Issue #6: Denormalized Data in Submissions
- `requirement_submissions` has embedded candidate data:
  - candidate_name, candidate_email, candidate_phone, etc.
  - Does NOT reference candidates.id as FK
- Code assumes each submission references a candidate by ID
- **Impact:** Data design conflict; need to sync denormalized data

---

## IMPLEMENTATION PLAN

### Phase 1: Backend Entity Rewrite (CRITICAL)

#### Step 1.1: Fix User & Role Entities
- [ ] User: Change PK from UUID → INTEGER
- [ ] User: Add manager_id self-referential FK
- [ ] User: Verify all 13 fields match DB
- [ ] Role: Change PK from UUID → INTEGER
- [ ] Role: Verify 3 fields match DB
- [ ] Permission: Change PK from UUID → INTEGER
- [ ] Permission: Add module_id FK

#### Step 1.2: Create Client Entity
- [ ] New entity: Client (id, name, industry, address, payment_terms, etc.)
- [ ] FK from job_requirements to clients

#### Step 1.3: Create Location Entity  
- [ ] New entity: Location (id, name)
- [ ] FK from candidates to locations (current_location_id)

#### Step 1.4: Rewrite Candidate Entity
- [ ] Change PK from UUID → INTEGER
- [ ] Remove company_id (not in DB)
- [ ] Split candidate_name into single field (not first_name + last_name)
- [ ] Add 30+ missing fields (aadhar, uan, etc.)
- [ ] Add FKs: source_id, created_by, updated_by, recruiter_id, current_location_id
- [ ] Fix enum: candidate_status values ("Active", "Inactive", etc., not lowercase)

#### Step 1.5: Rewrite Job (rename to JobRequirement) Entity
- [ ] Rename from `jobs` table to `job_requirements`
- [ ] Change PK from UUID → INTEGER
- [ ] Remove company_id; add client_id FK to clients
- [ ] Add ecms_req_id unique field
- [ ] Add 20+ missing fields (wfo_wfh_hybrid, bgv_*, vendor_rate, etc.)
- [ ] Fix priority enum: "Low", "Medium", "High"

#### Step 1.6: Rewrite Submission Entity
- [ ] Rename from `submissions` to Submission (but map to `requirement_submissions` table)
- [ ] Change PK from UUID → INTEGER
- [ ] Change table name in entity to `requirement_submissions`
- [ ] Add job_requirement_id FK (NOT NULL)
- [ ] Remove candidate_id FK (not in DB)
- [ ] Add 25+ denormalized candidate fields
- [ ] Fix submission_status enum values
- [ ] Clarify: Does code need to sync candidate data into these fields?

#### Step 1.7: Update Interview Entity
- [ ] Change PK from UUID → INTEGER
- [ ] Verify submission_id FK points to requirement_submissions
- [ ] Add missing fields: rating, outcome, candidate_notes, reschedule_reason, job_requirement_id
- [ ] Fix field names: interview_date (not scheduled_date), interview_time, etc.
- [ ] Add candidate_id FK (for denormalization reference)

#### Step 1.8: Update Offer Entity
- [ ] Change PK from UUID → INTEGER
- [ ] Verify FKs: submission_id, interview_id, job_requirement_id, candidate_id
- [ ] Add missing fields: offer_expiry_date, offer_letter_path, counter_offer_*, hold_reason
- [ ] Fix status enum values: "Generated", "Sent", "Accepted", "Rejected", "Withdrawn", "OnHold"

#### Step 1.9: Create Supporting Entities
- [ ] CandidateEducation
- [ ] CandidateExperience
- [ ] CandidateSkill
- [ ] SubmissionSkill
- [ ] SkillMaster
- [ ] Qualification
- [ ] CompanyMaster (if needed)

### Phase 2: Update DTOs & Services

- [ ] CandidateService: Add all 49 fields to CreateCandidateDto
- [ ] CandidateService: Add all 49 fields to UpdateCandidateDto
- [ ] JobRequirementService: Update all DTOs to match 35 fields
- [ ] SubmissionService: Rewrite to work with requirement_submissions model
- [ ] InterviewService: Add missing fields to DTOs
- [ ] OfferService: Add missing fields to DTOs
- [ ] All services: Implement find/create/update for all fields

### Phase 3: Frontend Alignment

- [ ] Candidate forms: Add all 49 fields (aadhar, uan, manager_screening_status, etc.)
- [ ] Job forms: Map company_id → client_id; add all 35 fields
- [ ] Submission forms: Redesign to handle denormalized candidate data
- [ ] Interview forms: Add missing fields (rating, outcome, panel_members, etc.)
- [ ] Offer forms: Add all 31 fields (expiry_date, letter_path, counter_offer, hold_reason)
- [ ] All screens: Implement edit/update flows (not just create + view)

### Phase 4: Data Migration & Testing

- [ ] Create data migration scripts to convert existing records
- [ ] Test full CRUD for each module
- [ ] Load production sample data
- [ ] Verify all FKs resolve correctly
- [ ] Test permission enforcement
- [ ] Load test with production-like data volume

---

## FIELD-BY-FIELD MIGRATION GUIDE

### Candidate Fields (49 DB fields → Code fields)

| DB Field | Code Field | Type | Status | Notes |
|----------|-----------|------|--------|-------|
| id | id | INTEGER | ❌ UUID | Change PK type |
| candidate_name | first_name + last_name | VARCHAR | ❌ SPLIT | Merge into 1 field |
| email | email | VARCHAR | ✓ OK | |
| phone | phone | VARCHAR | ✓ OK | |
| alternate_phone | - | VARCHAR | ❌ MISSING | Add field |
| gender | - | VARCHAR | ❌ MISSING | Add field |
| dob | - | DATE | ❌ MISSING | Add field |
| marital_status | - | VARCHAR | ❌ MISSING | Add field |
| current_company | current_company | TEXT | ✓ OK | |
| total_experience | years_of_experience | NUMERIC | ⚠️ TYPE | Change INT→NUMERIC |
| relevant_experience | - | NUMERIC | ❌ MISSING | Add field |
| current_ctc | - | NUMERIC | ❌ MISSING | Add field |
| expected_ctc | - | NUMERIC | ❌ MISSING | Add field |
| currency_code | - | VARCHAR | ❌ MISSING | Add field (default 'INR') |
| notice_period | notice_period | VARCHAR | ✓ OK | |
| willing_to_relocate | - | BOOLEAN | ❌ MISSING | Add field |
| buyout | - | BOOLEAN | ❌ MISSING | Add field |
| reason_for_job_change | - | TEXT | ❌ MISSING | Add field |
| skill_set | - | TEXT | ❌ MISSING | Add field |
| current_location_id | - | INTEGER FK | ❌ MISSING | Add FK to locations |
| location_preference | - | VARCHAR | ❌ MISSING | Add field |
| candidate_status | status | VARCHAR | ⚠️ ENUM | Change "active" → "Active" |
| source_id | - | INTEGER FK | ❌ MISSING | Add FK to sources |
| last_contacted_date | - | TIMESTAMP | ❌ MISSING | Add field |
| last_submission_date | - | DATE | ❌ MISSING | Add field |
| created_at | created_at | TIMESTAMP | ✓ OK | |
| updated_at | updated_at | TIMESTAMP | ✓ OK | |
| created_by | - | INTEGER FK | ❌ MISSING | Add FK to users |
| updated_by | - | INTEGER FK | ❌ MISSING | Add FK to users |
| notes | notes | TEXT | ✓ OK | |
| extra_fields | - | JSONB | ❌ MISSING | Add field |
| aadhar_number | - | VARCHAR | ❌ MISSING | Add field |
| uan_number | - | VARCHAR | ❌ MISSING | Add field |
| linkedin_url | linkedin_url | VARCHAR | ✓ OK | |
| manager_screening_status | - | VARCHAR | ❌ MISSING | Add field |
| client_name | - | VARCHAR | ❌ MISSING | Add field |
| highest_qualification | - | VARCHAR | ❌ MISSING | Add field |
| submission_date | - | DATE | ❌ MISSING | Add field |
| job_location | - | VARCHAR | ❌ MISSING | Add field |
| source | - | VARCHAR | ❌ MISSING | Add field |
| client | - | VARCHAR | ❌ MISSING | Add field |
| recruiter_id | - | INTEGER FK | ❌ MISSING | Add FK to users |
| date_of_entry | - | DATE | ❌ MISSING | Add field |
| manager_screening | - | VARCHAR | ❌ MISSING | Add field |
| resume_parser_used | - | VARCHAR | ❌ MISSING | Add field |
| extraction_confidence | - | NUMERIC | ❌ MISSING | Add field |
| extraction_date | - | TIMESTAMP | ❌ MISSING | Add field |
| resume_source_type | - | VARCHAR | ❌ MISSING | Add field |
| is_suspicious | - | BOOLEAN | ❌ MISSING | Add field |
| cv_portal_id | - | INTEGER | ❌ MISSING | Add field |
| import_batch_id | - | VARCHAR | ❌ MISSING | Add field |

**Summary:** 49 fields in DB; code has ~20; missing 29 fields

---

## ENUM VALUE MAPPINGS

### Candidate Status
- DB: "Active", "Inactive" (mixed case, capital letters)
- Code: "active", "inactive" (lowercase - WRONG!)
- **Fix:** `candidate_status: "Active" | "Inactive" | ...`

### Interview Status
- DB: "Scheduled", "Completed", "Rescheduled", "Cancelled"
- **Fix:** Use exact DB values in code

### Interview Outcome
- DB: "Pass", "Fail", "Hold"
- **Fix:** Ensure code uses these exact values

### Offer Status
- DB: "Generated", "Sent", "Accepted", "Rejected", "Withdrawn", "OnHold"
- **Fix:** Update all enum values in code

### Job Priority
- DB: "Low", "Medium", "High" (with "Medium" as default)
- **Fix:** Ensure code enums match

### Job Interview Mode
- DB: "Technical", "HR", "Manager" (inferred from code logic)
- **Fix:** Verify exact values from DB

---

## SUMMARY OF CHANGES

| Entity | PK Type | Removed Fields | Added Fields | Renamed Fields | FK Changes |
|--------|---------|---|---|---|---|
| Candidate | UUID→INTEGER | company_id | 29 new | candidate_name split | +4 FKs |
| Job | UUID→INTEGER | company_id | 20 new | jobs→job_requirements | company_id→client_id |
| Submission | UUID→INTEGER | - | 25 new | submissions→requirement_submissions | ±0 (structure change) |
| Interview | UUID→INTEGER | - | 5 new | - | +1 (job_requirement_id) |
| Offer | UUID→INTEGER | - | 7 new | - | +1 (candidate_id) |
| User | UUID→INTEGER | - | 0 new | - | +1 (manager_id) |
| Role | UUID→INTEGER | - | 0 new | - | ±0 |
| Permission | UUID→INTEGER | - | 1 new | - | +1 (module_id) |
| - | - | - | **Client** | - | new table |
| - | - | - | **Location** | - | new table |
| - | - | - | **CandidateEducation** | - | new table |
| - | - | - | **CandidateExperience** | - | new table |
| - | - | - | **CandidateSkill** | - | new table |
| - | - | - | **SubmissionSkill** | - | new table |
| - | - | - | **SkillMaster** | - | new table |
| - | - | - | **Qualification** | - | new table |

---

## RISKS & MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Data loss from UUID→INTEGER conversion | 🔴 CRITICAL | Read current data; transform IDs carefully; backup DB |
| ForeignKey constraint violations | 🔴 CRITICAL | Disable FK checks during migration; re-enable after |
| Enum value mismatch breaks queries | 🟠 HIGH | Update all enums in single pass; test queries |
| Denormalized data in requirement_submissions out of sync | 🟠 HIGH | Implement sync triggers or application logic |
| Multi-tenancy logic breaks | 🟠 HIGH | Remove company_id assumptions; test tenant isolation |
| Production data corruption | 🔴 CRITICAL | Test migration on staging first; backup production |

---

## NEXT IMMEDIATE ACTIONS

1. ✅ **Done**: Database introspection complete
2. ✅ **Done**: Mapping report generated
3. **TODO**: Decide - modify existing code or rewrite from scratch?
   - Option A: Incremental updates (risky, complex)
   - Option B: Complete rewrite using TypeORM from DB (recommended)
4. **TODO**: Create migrations for PK type changes
5. **TODO**: Implement new entities first (no dependencies)
6. **TODO**: Update dependent entities
7. **TODO**: Update services and controllers
8. **TODO**: Update frontend forms
9. **TODO**: Load production data sample and test end-to-end

---

**Report Generated:** 2026-01-06  
**Author:** Database Alignment Agent  
**Status:** 🔴 Ready for Phase 2 - Backend Entity Rewrite
