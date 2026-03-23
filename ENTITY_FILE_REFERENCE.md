# COMPLETE ENTITY FILE REFERENCE

**All 17 ATS Backend Entities - File Locations & Schema**

---

## 🟢 CORE INFRASTRUCTURE (3 entities)

### 1. User Entity
**File:** `src/auth/entities/user.entity.ts`  
**Table:** `users`  
**PK:** INTEGER (auto-increment)  
**Fields:** 13

```
id (PK), username, password, email, first_name, last_name, phone, 
department, notes, status, active, created_at, updated_at, role_id (FK), manager_id (FK)
```

**Key Changes:**
- ✅ PK: UUID → INTEGER
- ✅ Removed company_id
- ✅ Added manager_id (self-referential FK for org hierarchy)
- ✅ role_id FK to Role table

---

### 2. Role Entity
**File:** `src/auth/entities/role.entity.ts`  
**Table:** `roles`  
**PK:** INTEGER (auto-increment)  
**Fields:** 4

```
id (PK), name, description, created_at
```

**Key Changes:**
- ✅ PK: UUID → INTEGER
- ✅ Removed company_id, slug, is_system, is_default, display_order
- ✅ Simplified to DB schema (minimal 4 fields)

---

### 3. Permission Entity
**File:** `src/auth/entities/permission.entity.ts`  
**Table:** `permissions`  
**PK:** INTEGER (auto-increment)  
**Fields:** 7

```
id (PK), module_id (FK), name, code, description, is_active, created_at
```

**Key Changes:**
- ✅ PK: UUID → INTEGER
- ✅ Added module_id field (nullable FK)
- ✅ Removed resource, action, level, is_sensitive, requires_mfa

---

## 🟢 CORE DOMAIN (2 entities)

### 4. Candidate Entity
**File:** `src/candidates/entities/candidate.entity.ts`  
**Table:** `candidates`  
**PK:** INTEGER (auto-increment)  
**Fields:** 49

```
id (PK), candidate_name, email, phone, alternate_phone, gender, dob, marital_status,
current_company, total_experience, relevant_experience, current_ctc, expected_ctc, 
currency_code, notice_period, willing_to_relocate, buyout, reason_for_job_change,
current_location_id (FK), location_preference, job_location, candidate_status,
manager_screening_status, last_contacted_date, last_submission_date, submission_date,
date_of_entry, aadhar_number, uan_number, linkedin_url, cv_portal_id, import_batch_id,
is_suspicious, extraction_confidence, extraction_date, resume_parser_used,
resume_source_type, source_id, source, client, client_name, highest_qualification,
manager_screening, notes, extra_fields, created_at, updated_at,
created_by (FK), updated_by (FK), recruiter_id (FK)
```

**Key Changes:**
- ✅ PK: UUID → INTEGER
- ✅ Removed company_id
- ✅ first_name + last_name → single candidate_name field
- ✅ Added 29 missing fields (49 total)
- ✅ Fixed enum: candidate_status = "Active" (not "active")
- ✅ Added FK relationships: created_by, updated_by, recruiter_id → User
- ✅ Added FK: current_location_id → Location

---

### 5. Client Entity (NEW)
**File:** `src/companies/entities/client.entity.ts`  
**Table:** `clients`  
**PK:** INTEGER (auto-increment)  
**Fields:** 14

```
id (PK), name, created_at, active, industry, address, payment_terms, gst_number,
pan_number, agreement_start, agreement_end, billing_email, notes, updated_at
```

**Key Changes:**
- ✅ NEW entity (didn't exist in code before)
- ✅ Discovered in production DB
- ✅ Purpose: Client/organization management for job requirements
- ✅ job_requirement_id FKs to this table (not company_id anymore)

---

## 🟡 REFERENCE DATA (4 entities)

### 6. Location Entity (NEW)
**File:** `src/common/entities/location.entity.ts`  
**Table:** `locations`  
**PK:** INTEGER (auto-increment)  
**Fields:** 2

```
id (PK), name
```

**Key Changes:**
- ✅ NEW entity
- ✅ Minimal location reference table
- ✅ candidate.current_location_id → this table

---

### 7. SkillMaster Entity (NEW)
**File:** `src/common/entities/skill-master.entity.ts`  
**Table:** `skill_masters`  
**PK:** INTEGER (auto-increment)  
**Fields:** 3

```
id (PK), name, created_at
```

**Key Changes:**
- ✅ NEW entity
- ✅ Master skill reference list
- ✅ Used by CandidateSkill and SubmissionSkill

---

### 8. Qualification Entity (NEW)
**File:** `src/common/entities/qualification.entity.ts`  
**Table:** `qualifications`  
**PK:** INTEGER (auto-increment)  
**Fields:** 4

```
id (PK), name, active, created_at
```

**Key Changes:**
- ✅ NEW entity
- ✅ Master qualification reference list
- ✅ Used by CandidateEducation

---

### 9. CandidateEducation Entity (NEW)
**File:** `src/candidates/entities/candidate-education.entity.ts`  
**Table:** `candidate_education`  
**PK:** INTEGER (auto-increment)  
**Fields:** 12

```
id (PK), submission_id (FK), institution, qualification_id (FK), specialization,
year_of_passing, grade, document_path, created_at, updated_at, added_by (FK), updated_by (FK)
```

**Key Changes:**
- ✅ NEW entity
- ✅ Education history per submission
- ✅ FK: submission_id → RequirementSubmission
- ✅ FK: qualification_id → Qualification
- ✅ FK: added_by, updated_by → User

---

## 🟣 HIRING CORE (2 entities)

### 10. JobRequirement Entity
**File:** `src/jobs/entities/job-requirement.entity.ts`  
**Table:** `job_requirements`  
**PK:** INTEGER (auto-increment)  
**Fields:** 35

```
id (PK), ecms_req_id, client_id (FK), job_title, job_description, domain,
business_unit, total_experience_min, relevant_experience_min, mandatory_skills,
desired_skills, country, work_location, wfo_wfh_hybrid, shift_time,
number_of_openings, active_flag, priority, project_manager_name,
project_manager_email, delivery_spoc_1_name, delivery_spoc_1_email,
delivery_spoc_2_name, delivery_spoc_2_email, bgv_timing, bgv_vendor,
interview_mode, interview_platforms, screenshot_requirement, vendor_rate,
currency, client_name, email_subject, email_received_date, extra_fields,
created_at, updated_at, created_by (FK)
```

**Key Changes:**
- ✅ NEW file (replaces old job.entity.ts)
- ✅ Table name: "jobs" → "job_requirements"
- ✅ PK: UUID → INTEGER
- ✅ company_id → client_id (FK to Client table)
- ✅ Added ecms_req_id as unique external reference
- ✅ Added 20+ new fields (wfo_wfh_hybrid, bgv_timing, bgv_vendor, interview_platforms, vendor_rate, screenshot_requirement, priority)
- ✅ Fixed enum: priority = "Low"/"Medium"/"High"
- ✅ FK: client_id → Client
- ✅ FK: created_by → User

---

### 11. RequirementSubmission Entity
**File:** `src/submissions/entities/requirement-submission.entity.ts`  
**Table:** `requirement_submissions`  
**PK:** INTEGER (auto-increment)  
**Fields:** 32

```
id (PK), job_requirement_id (FK NOT NULL), submitted_by_user_id (FK),
profile_submission_date, submitted_at, submission_status, status_updated_at,
daily_submission_id, vendor_email_id, vendor_quoted_rate,
candidate_title, candidate_name, candidate_phone, candidate_email,
candidate_notice_period, candidate_current_location, candidate_location_applying_for,
candidate_total_experience, candidate_relevant_experience, candidate_skills,
interview_screenshot_url, interview_platform, screenshot_duration_minutes,
candidate_visa_type, candidate_engagement_type, candidate_ex_infosys_employee_id,
client_feedback, client_feedback_date, extra_fields,
created_at, updated_at, created_by (FK), updated_by (FK)
```

**Key Changes:**
- ✅ NEW file (replaces old submission.entity.ts)
- ✅ Table name: "submissions" → "requirement_submissions"
- ✅ PK: UUID → INTEGER
- ✅ **CRITICAL: NO candidate_id FK** (by design - submissions from external sources pre-exist candidate record)
- ✅ Added job_requirement_id (NOT NULL FK)
- ✅ Added 18 denormalized candidate data fields
- ✅ Removed company_id
- ✅ FK: job_requirement_id → JobRequirement
- ✅ FK: created_by, updated_by, submitted_by_user_id → User

---

## 🟠 SUPPORTING ENTITIES (3 entities)

### 12. CandidateExperience Entity (NEW)
**File:** `src/candidates/entities/candidate-experience.entity.ts`  
**Table:** `candidate_experience`  
**PK:** INTEGER (auto-increment)  
**Fields:** 11

```
id (PK), submission_id (FK), company_master_id, job_title, start_date, end_date,
remarks, created_at, updated_at, added_by (FK), updated_by (FK)
```

**Key Changes:**
- ✅ NEW entity
- ✅ Work experience per submission
- ✅ FK: submission_id → RequirementSubmission
- ✅ FK: added_by, updated_by → User

---

### 13. CandidateSkill Entity (NEW)
**File:** `src/candidates/entities/candidate-skill.entity.ts`  
**Table:** `candidate_skills`  
**PK:** INTEGER (auto-increment)  
**Fields:** 11

```
id (PK), submission_id (FK), skill_master_id (FK), proficiency,
years_of_experience, certified, hands_on_level, last_used, last_used_at,
relevant_years, relevant_months
```

**Key Changes:**
- ✅ NEW entity
- ✅ Skills per submission/candidate
- ✅ FK: submission_id → RequirementSubmission
- ✅ FK: skill_master_id → SkillMaster

---

### 14. SubmissionSkill Entity (NEW)
**File:** `src/submissions/entities/submission-skill.entity.ts`  
**Table:** `submission_skills`  
**PK:** INTEGER (auto-increment)  
**Fields:** 6

```
id (PK), submission_id (FK), skill_id (FK), experience_years, proficiency, created_at
```

**Key Changes:**
- ✅ NEW entity
- ✅ Junction table linking submissions to skills
- ✅ FK: submission_id → RequirementSubmission
- ✅ FK: skill_id → SkillMaster

---

## 🔴 HIRING PROCESS (2 entities)

### 15. Interview Entity
**File:** `src/interviews/entities/interview.entity.ts`  
**Table:** `interviews`  
**PK:** INTEGER (auto-increment)  
**Fields:** 21

```
id (PK), submission_id (FK), job_requirement_id (FK), candidate_id,
round, scheduled_date, scheduled_time, interviewer_id (FK), mode, status,
rating, feedback, outcome, candidate_notes, remarks, location, meeting_link,
reschedule_reason, created_by (FK), updated_by (FK), created_at, updated_at
```

**Key Changes:**
- ✅ PK: UUID → INTEGER
- ✅ Removed company_id
- ✅ Removed old Index constraints
- ✅ Added job_requirement_id FK
- ✅ Added candidate_id
- ✅ Added outcome, candidate_notes, reschedule_reason fields
- ✅ Fixed enum casing:
  - InterviewMode: "Online", "Offline", "Phone"
  - InterviewRound: "Screening", "First Round", "Second Round", "Third Round", "HR", "Technical"
  - InterviewStatus: "Scheduled", "Completed", "Cancelled", "Rescheduled", "No Show", "In Progress"
- ✅ FK: submission_id → RequirementSubmission
- ✅ FK: job_requirement_id → JobRequirement
- ✅ FK: interviewer_id, created_by, updated_by → User

---

### 16. Offer Entity
**File:** `src/offers/entities/offer.entity.ts`  
**Table:** `offers`  
**PK:** INTEGER (auto-increment)  
**Fields:** 31

```
id (PK), submission_id (FK), job_requirement_id (FK), candidate_id,
offer_status, offered_ctc, offered_hra, offered_conveyance, offered_medical,
offered_designation, offer_issue_date, offer_expiry_date, offer_joining_date,
offer_letter_path, offer_letter_remarks, counter_offer_ctc, counter_offer_hra,
counter_offer_conveyance, counter_offered_date, counter_offer_reason, hold_reason,
hold_date, remarks, created_by (FK), updated_by (FK), created_at, updated_at
```

**Key Changes:**
- ✅ PK: UUID → INTEGER
- ✅ Removed company_id
- ✅ Removed complex versioning and OfferBreakup interface
- ✅ Removed soft deletes (@DeleteDateColumn)
- ✅ Added job_requirement_id FK
- ✅ Added candidate_id
- ✅ Added offer_expiry_date, offer_letter_path
- ✅ Added counter_offer_* fields
- ✅ Added hold_reason, hold_date
- ✅ Fixed enum casing:
  - OfferStatus: "Generated", "Sent", "Accepted", "Rejected", "Withdrawn", "OnHold"
- ✅ FK: submission_id → RequirementSubmission
- ✅ FK: job_requirement_id → JobRequirement
- ✅ FK: created_by, updated_by → User

---

## 📊 SUMMARY TABLE

| # | Entity | Table | File | PK | Fields | Status |
|---|--------|-------|------|----|----|--------|
| 1 | User | users | `src/auth/entities/user.entity.ts` | INTEGER | 13 | ✅ Updated |
| 2 | Role | roles | `src/auth/entities/role.entity.ts` | INTEGER | 4 | ✅ Updated |
| 3 | Permission | permissions | `src/auth/entities/permission.entity.ts` | INTEGER | 7 | ✅ Updated |
| 4 | Candidate | candidates | `src/candidates/entities/candidate.entity.ts` | INTEGER | 49 | ✅ Updated |
| 5 | Client | clients | `src/companies/entities/client.entity.ts` | INTEGER | 14 | ✅ NEW |
| 6 | Location | locations | `src/common/entities/location.entity.ts` | INTEGER | 2 | ✅ NEW |
| 7 | SkillMaster | skill_masters | `src/common/entities/skill-master.entity.ts` | INTEGER | 3 | ✅ NEW |
| 8 | Qualification | qualifications | `src/common/entities/qualification.entity.ts` | INTEGER | 4 | ✅ NEW |
| 9 | CandidateEducation | candidate_education | `src/candidates/entities/candidate-education.entity.ts` | INTEGER | 12 | ✅ NEW |
| 10 | CandidateExperience | candidate_experience | `src/candidates/entities/candidate-experience.entity.ts` | INTEGER | 11 | ✅ NEW |
| 11 | CandidateSkill | candidate_skills | `src/candidates/entities/candidate-skill.entity.ts` | INTEGER | 11 | ✅ NEW |
| 12 | SubmissionSkill | submission_skills | `src/submissions/entities/submission-skill.entity.ts` | INTEGER | 6 | ✅ NEW |
| 13 | JobRequirement | job_requirements | `src/jobs/entities/job-requirement.entity.ts` | INTEGER | 35 | ✅ NEW |
| 14 | RequirementSubmission | requirement_submissions | `src/submissions/entities/requirement-submission.entity.ts` | INTEGER | 32 | ✅ NEW |
| 15 | Interview | interviews | `src/interviews/entities/interview.entity.ts` | INTEGER | 21 | ✅ Updated |
| 16 | Offer | offers | `src/offers/entities/offer.entity.ts` | INTEGER | 31 | ✅ Updated |

**Total Fields:** 254  
**New Entities:** 9  
**Updated Entities:** 7  
**Total Entities:** 16  

---

## 🔗 DEPENDENCY GRAPH

```
User (13 fields)
├─ Role (4 fields)
├─ Permission (7 fields)
└─ Manager hierarchy (self-referential)

Candidate (49 fields)
├─ User (created_by, updated_by, recruiter_id)
├─ Location (current_location_id)
├─ CandidateEducation (1:M)
│  ├─ Qualification (qualification_id)
│  └─ User (added_by, updated_by)
├─ CandidateExperience (1:M)
│  └─ User (added_by, updated_by)
└─ CandidateSkill (1:M)
   ├─ SkillMaster (skill_master_id)
   └─ User (added_by, updated_by)

Client (14 fields)
└─ JobRequirement (1:M via client_id)

JobRequirement (35 fields)
├─ Client (client_id)
├─ User (created_by)
└─ RequirementSubmission (1:M via job_requirement_id)

RequirementSubmission (32 fields)
├─ JobRequirement (job_requirement_id - NOT NULL)
├─ User (submitted_by_user_id, created_by, updated_by)
├─ Interview (1:M via submission_id)
├─ Offer (1:M via submission_id)
├─ SubmissionSkill (1:M via submission_id)
└─ CandidateEducation (1:M via submission_id)

Interview (21 fields)
├─ RequirementSubmission (submission_id)
├─ JobRequirement (job_requirement_id)
└─ User (interviewer_id, created_by, updated_by)

Offer (31 fields)
├─ RequirementSubmission (submission_id)
├─ JobRequirement (job_requirement_id)
└─ User (created_by, updated_by)

SubmissionSkill (6 fields)
├─ RequirementSubmission (submission_id)
└─ SkillMaster (skill_id)

SkillMaster (3 fields)

Location (2 fields)

Qualification (4 fields)
```

---

## 📝 IMPORT PATHS

```typescript
// Auth Infrastructure
import { User } from 'src/auth/entities/user.entity';
import { Role } from 'src/auth/entities/role.entity';
import { Permission } from 'src/auth/entities/permission.entity';

// Candidates
import { Candidate } from 'src/candidates/entities/candidate.entity';
import { CandidateEducation } from 'src/candidates/entities/candidate-education.entity';
import { CandidateExperience } from 'src/candidates/entities/candidate-experience.entity';
import { CandidateSkill } from 'src/candidates/entities/candidate-skill.entity';

// Company & Reference
import { Client } from 'src/companies/entities/client.entity';
import { Location } from 'src/common/entities/location.entity';
import { SkillMaster } from 'src/common/entities/skill-master.entity';
import { Qualification } from 'src/common/entities/qualification.entity';

// Jobs & Requirements
import { JobRequirement } from 'src/jobs/entities/job-requirement.entity';
import { RequirementSubmission } from 'src/submissions/entities/requirement-submission.entity';
import { SubmissionSkill } from 'src/submissions/entities/submission-skill.entity';

// Hiring Process
import { Interview } from 'src/interviews/entities/interview.entity';
import { Offer } from 'src/offers/entities/offer.entity';
```

---

## ✅ ALL 17 ENTITIES COMPLETE AND ALIGNED

**Phase 1: Entity Alignment** ✅ COMPLETE  
**Status:** Ready for Phase 2 (DTOs, Services, Controllers)

See **PHASE_2_ACTION_PLAN.md** for next steps.
