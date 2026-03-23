# BACKEND REWRITE - PHASE 2 ACTION PLAN

**Status:** Phase 1 (Entity Alignment) ✅ COMPLETE  
**Next Phase:** Phase 2 (Module Configuration & DTOs)  
**Timeline:** 2-3 hours

---

## IMMEDIATE TODO CHECKLIST

### Step 1: Update AppModule Imports (15 minutes)

**File:** `src/app.module.ts`

**Current:** Likely imports old entities with old names (Job, Submission, etc.)

**Changes Needed:**
```typescript
// OLD IMPORTS (remove)
import { Job } from './jobs/entities/job.entity';
import { Submission } from './submissions/entities/submission.entity';
import { Company } from './companies/entities/company.entity';

// NEW IMPORTS (add)
import { JobRequirement } from './jobs/entities/job-requirement.entity';
import { RequirementSubmission } from './submissions/entities/requirement-submission.entity';
import { SubmissionSkill } from './submissions/entities/submission-skill.entity';
import { Client } from './companies/entities/client.entity';
import { Location } from './common/entities/location.entity';
import { SkillMaster } from './common/entities/skill-master.entity';
import { Qualification } from './common/entities/qualification.entity';

// EXISTING IMPORTS (verify/update)
import { User } from './auth/entities/user.entity';
import { Role } from './auth/entities/role.entity';
import { Permission } from './auth/entities/permission.entity';
import { Candidate } from './candidates/entities/candidate.entity';
import { CandidateEducation } from './candidates/entities/candidate-education.entity';
import { CandidateExperience } from './candidates/entities/candidate-experience.entity';
import { CandidateSkill } from './candidates/entities/candidate-skill.entity';
import { Interview } from './interviews/entities/interview.entity';
import { Offer } from './offers/entities/offer.entity';
```

**TypeORM Configuration:**
```typescript
entities: [
  // Auth
  User,
  Role,
  Permission,
  
  // Candidates
  Candidate,
  CandidateEducation,
  CandidateExperience,
  CandidateSkill,
  
  // Jobs & Requirements
  JobRequirement,
  Client,
  Location,
  
  // Submissions
  RequirementSubmission,
  SubmissionSkill,
  
  // Hiring Process
  Interview,
  Offer,
  
  // Reference Data
  SkillMaster,
  Qualification,
]
```

---

### Step 2: Update DTOs for Candidate Entity (45 minutes)

**File:** `src/candidates/dto/create-candidate.dto.ts`

**Current:** Likely only has basic fields (first_name, last_name, email, phone)

**Changes Needed:** Add all 49 DB fields

```typescript
export class CreateCandidateDto {
  // Basic Information
  candidate_name: string; // RENAMED from first_name + last_name
  email: string;
  phone: string;
  alternate_phone?: string;
  gender?: string; // M/F/Other
  dob?: string; // Date of birth
  marital_status?: string;

  // Professional Information
  current_company?: string;
  total_experience?: number;
  relevant_experience?: number;
  current_ctc?: number;
  expected_ctc?: number;
  currency_code?: string; // USD, INR, etc.
  highest_qualification?: string;

  // Availability & Preferences
  notice_period?: string;
  willing_to_relocate?: boolean;
  buyout?: boolean;
  reason_for_job_change?: string;
  current_location_id?: number; // FK to Location
  location_preference?: string;
  job_location?: string;

  // Status & Tracking
  candidate_status: string; // = "Active"
  manager_screening_status?: string;
  last_contacted_date?: string;
  last_submission_date?: string;
  submission_date?: string;
  date_of_entry?: string;

  // IDs & References
  aadhar_number?: string;
  uan_number?: string;
  linkedin_url?: string;
  cv_portal_id?: string;
  import_batch_id?: string;

  // Quality Metrics
  is_suspicious?: boolean;
  extraction_confidence?: number;
  extraction_date?: string;
  resume_parser_used?: string;
  resume_source_type?: string;

  // Sourcing
  source_id?: number;
  source?: string;
  client?: string;
  client_name?: string;
  manager_screening?: string;

  // Meta
  notes?: string;
  extra_fields?: Record<string, any>; // JSONB

  // FK IDs (create_by, updated_by, recruiter_id managed by service)
}

export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {}
```

**File:** Update `src/candidates/entities/candidate.entity.ts` import to use DTO fields

---

### Step 3: Update DTOs for JobRequirement Entity (30 minutes)

**File:** `src/jobs/dto/create-job-requirement.dto.ts`

**Changes Needed:** Add all 35 DB fields

```typescript
export class CreateJobRequirementDto {
  // External Reference
  ecms_req_id: string; // Unique external ID

  // Client & Job Information
  client_id: number; // FK to Client
  job_title: string;
  job_description?: string;
  domain?: string;
  business_unit?: string;

  // Experience Requirements
  total_experience_min?: number;
  relevant_experience_min?: number;
  mandatory_skills?: string;
  desired_skills?: string;

  // Location & Work Mode
  country?: string;
  work_location?: string;
  wfo_wfh_hybrid?: string; // "WFO", "WFH", "Hybrid"
  shift_time?: string;

  // Hiring Details
  number_of_openings?: number;
  active_flag?: boolean;
  priority: string; // "Low", "Medium", "High"

  // Contact Information
  project_manager_name?: string;
  project_manager_email?: string;
  delivery_spoc_1_name?: string;
  delivery_spoc_1_email?: string;
  delivery_spoc_2_name?: string;
  delivery_spoc_2_email?: string;

  // BGV (Background Verification)
  bgv_timing?: string;
  bgv_vendor?: string;

  // Interview Configuration
  interview_mode?: string;
  interview_platforms?: string; // JSON array as string
  screenshot_requirement?: boolean;

  // Vendor Information
  vendor_rate?: number;
  currency?: string;

  // Email Tracking
  client_name?: string;
  email_subject?: string;
  email_received_date?: string;

  // Meta
  extra_fields?: Record<string, any>; // JSONB

  // FK IDs (created_by managed by service)
}

export class UpdateJobRequirementDto extends PartialType(CreateJobRequirementDto) {}
```

---

### Step 4: Update DTOs for RequirementSubmission Entity (30 minutes)

**File:** `src/submissions/dto/create-requirement-submission.dto.ts`

**Changes Needed:** Add all 32 DB fields (including denormalized candidate data)

```typescript
export class CreateRequirementSubmissionDto {
  // Junction Information
  job_requirement_id: number; // NOT NULL FK to JobRequirement
  submitted_by_user_id?: number;

  // Tracking Dates
  profile_submission_date?: string;
  submitted_at?: string;
  submission_status?: string;
  status_updated_at?: string;

  // Vendor Information
  daily_submission_id?: string;
  vendor_email_id?: string;
  vendor_quoted_rate?: number;

  // Denormalized Candidate Data (because submission may pre-exist candidate record)
  candidate_title?: string;
  candidate_name: string;
  candidate_phone?: string;
  candidate_email?: string;
  candidate_notice_period?: string;
  candidate_current_location?: string;
  candidate_location_applying_for?: string;
  candidate_total_experience?: number;
  candidate_relevant_experience?: number;
  candidate_skills?: string; // Comma-separated or JSON

  // Interview Information
  interview_screenshot_url?: string;
  interview_platform?: string;
  screenshot_duration_minutes?: number;

  // Background Information
  candidate_visa_type?: string;
  candidate_engagement_type?: string;
  candidate_ex_infosys_employee_id?: string;

  // Client Feedback
  client_feedback?: string;
  client_feedback_date?: string;

  // Meta
  extra_fields?: Record<string, any>; // JSONB

  // FK IDs (created_by, updated_by managed by service)
}

export class UpdateRequirementSubmissionDto extends PartialType(CreateRequirementSubmissionDto) {}
```

---

### Step 5: Update DTOs for Interview Entity (15 minutes)

**File:** `src/interviews/dto/create-interview.dto.ts`

```typescript
export class CreateInterviewDto {
  submission_id: number;
  job_requirement_id: number;
  candidate_id?: number;
  round: string; // "Screening", "First Round", "Second Round", etc.
  scheduled_date?: string;
  scheduled_time?: string;
  interviewer_id?: number;
  mode: string; // "Online", "Offline", "Phone"
  status?: string; // "Scheduled", "Completed", "Cancelled", etc.
  rating?: number; // 1-5 or similar
  feedback?: string;
  outcome?: string;
  candidate_notes?: string;
  remarks?: string;
  location?: string;
  meeting_link?: string;
  reschedule_reason?: string;
}

export class UpdateInterviewDto extends PartialType(CreateInterviewDto) {}
```

---

### Step 6: Update DTOs for Offer Entity (15 minutes)

**File:** `src/offers/dto/create-offer.dto.ts`

```typescript
export class CreateOfferDto {
  submission_id: number;
  job_requirement_id: number;
  candidate_id?: number;
  offer_status: string; // "Generated", "Sent", "Accepted", etc.
  offered_ctc?: number;
  offered_hra?: number;
  offered_conveyance?: number;
  offered_medical?: number;
  offered_designation?: string;
  offer_issue_date?: string;
  offer_expiry_date?: string;
  offer_joining_date?: string;
  offer_letter_path?: string;
  offer_letter_remarks?: string;
  counter_offer_ctc?: number;
  counter_offer_hra?: number;
  counter_offer_conveyance?: number;
  counter_offered_date?: string;
  counter_offer_reason?: string;
  hold_reason?: string;
  hold_date?: string;
  remarks?: string;
}

export class UpdateOfferDto extends PartialType(CreateOfferDto) {}
```

---

### Step 7: Generate TypeORM Migrations (10 minutes)

```bash
# In terminal, run:
npm run typeorm migration:generate -- -n AlignEntitySchemaToDatabase

# This will create a migration file in src/database/migrations/
# Review the generated migration to ensure it matches your DB schema
# Then run:
npm run typeorm migration:run
```

---

### Step 8: Update Service Files

Update each service to handle all entity fields:

**CandidateService:**
```typescript
async create(createCandidateDto: CreateCandidateDto, userId: number): Promise<Candidate> {
  const candidate = this.candidateRepository.create({
    ...createCandidateDto,
    created_by: userId,
    updated_by: userId,
  });
  return this.candidateRepository.save(candidate);
}

async update(id: number, updateCandidateDto: UpdateCandidateDto, userId: number): Promise<Candidate> {
  await this.candidateRepository.update(id, {
    ...updateCandidateDto,
    updated_by: userId,
  });
  return this.candidateRepository.findOne({ where: { id } });
}
```

Similar updates for:
- JobRequirementService
- RequirementSubmissionService
- InterviewService
- OfferService

---

### Step 9: Update Controllers

Replace all Route parameters and entity references:

**OLD:**
```typescript
@UseGuards(JwtAuthGuard)
@Post()
create(@Body() createJobDto: CreateJobDto, @Request() req) {
  return this.jobService.create(createJobDto, req.user.id);
}

@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) {
  return this.jobService.findOne(id);
}
```

**NEW:**
```typescript
@UseGuards(JwtAuthGuard)
@Post()
create(@Body() createJobRequirementDto: CreateJobRequirementDto, @Request() req) {
  return this.jobRequirementService.create(createJobRequirementDto, req.user.id);
}

@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.jobRequirementService.findOne(id);
}
```

Key changes:
- Remove `ParseUUIDPipe`, replace with `ParseIntPipe`
- Update entity names (Job → JobRequirement, Submission → RequirementSubmission)
- Update DTO names
- Update service method calls

---

### Step 10: Update Frontend API Services

**Example:** CandidateService in frontend

```typescript
// OLD
async createCandidate(data: {
  first_name: string;
  last_name: string;
  email: string;
}): Promise<Candidate> {
  return this.http.post('/candidates', data).toPromise();
}

// NEW
async createCandidate(data: {
  candidate_name: string;
  email: string;
  phone: string;
  // ... all 49 fields
}): Promise<Candidate> {
  return this.http.post('/candidates', data).toPromise();
}
```

---

## TESTING CHECKLIST

After completing all updates, verify:

- [ ] App compiles without errors
- [ ] All entity imports resolve
- [ ] TypeORM migrations generated and run successfully
- [ ] Database schema matches entity definitions
- [ ] Can create Candidate with all 49 fields
- [ ] Can create JobRequirement with all 35 fields
- [ ] Can create RequirementSubmission with denormalized candidate data
- [ ] FK relationships work (candidate → user, job → client, submission → job)
- [ ] API endpoints return data with complete field sets
- [ ] No UUID errors in logs (all should be integers)
- [ ] Candidate.candidate_name works (not first_name/last_name)
- [ ] JobRequirement.client_id works (not company_id)
- [ ] RequirementSubmission denormalized fields populate correctly

---

## ESTIMATED TIME ALLOCATION

| Task | Est. Time | Status |
|------|-----------|--------|
| AppModule updates | 15 min | 📋 TODO |
| Candidate DTOs | 45 min | 📋 TODO |
| JobRequirement DTOs | 30 min | 📋 TODO |
| RequirementSubmission DTOs | 30 min | 📋 TODO |
| Interview DTOs | 15 min | 📋 TODO |
| Offer DTOs | 15 min | 📋 TODO |
| Migrations | 10 min | 📋 TODO |
| Service Updates | 30 min | 📋 TODO |
| Controller Updates | 30 min | 📋 TODO |
| Frontend Updates | 45 min | 📋 TODO |
| Testing & Verification | 45 min | 📋 TODO |
| **TOTAL** | **~4.5 hours** | |

---

## SUCCESS CRITERIA

✅ When complete, the backend will:

1. Use 17 correctly aligned entities matching DB schema exactly
2. Accept and store all 49 candidate fields (not just 10)
3. Accept and store all 35 job requirement fields
4. Handle 32-field requirement submissions with denormalized candidate data
5. Support complete hiring pipeline (Interview + Offer with all fields)
6. Use INTEGER PKs throughout (no UUIDs)
7. FK relationships work correctly (no schema mismatch errors)
8. APIs return complete data sets from production DB
9. Ready for end-to-end testing with real production data samples

---

**Next Step:** Begin with Step 1 (AppModule updates) → Step 2-6 (DTOs) → Step 7 (Migrations) → Testing

**Questions:** All 17 entities are now aligned. DTOs, Services, and Controllers are next.
