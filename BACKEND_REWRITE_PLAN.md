# BACKEND REWRITE EXECUTION PLAN

**Objective:** Rebuild entire ATS backend to match production database schema exactly

**Status:** IN PROGRESS

---

## PHASE 1: Core Infrastructure Entities

### 1.1 Rewrite User Entity
**Current Issues:**
- PK type: UUID (wrong) → should be INTEGER
- company_id field (wrong) → not in DB
- Unique index on (company_id, email) (wrong) → should just be username unique

**Target:** Match `users` table exactly (13 fields, INTEGER PK)

### 1.2 Rewrite Role Entity
**Current Issues:**
- PK type: UUID (wrong) → should be INTEGER

**Target:** Match `roles` table exactly (3 fields, INTEGER PK)

### 1.3 Rewrite Permission Entity
**Current Issues:**
- PK type: UUID (wrong) → should be INTEGER
- Missing: module_id field

**Target:** Match `permissions` table exactly (5 fields, INTEGER PK)

---

## PHASE 2: Core Domain Entities

### 2.1 Rewrite Candidate Entity
**Current Issues:**
- PK type: UUID (wrong) → should be INTEGER
- company_id field (wrong) → not in DB
- first_name + last_name (wrong) → should be candidate_name (single field)
- Missing 29 fields

**Target:** Match `candidates` table exactly (49 fields, INTEGER PK)

### 2.2 CREATE Client Entity (NEW)
**Current Issues:**
- Doesn't exist in code
- job_requirements FK to clients, not companies

**Target:** Match `clients` table exactly (13 fields, INTEGER PK)

### 2.3 CREATE Location Entity (NEW)
**Current Issues:**
- Doesn't exist in code
- candidates.current_location_id FK to locations

**Target:** Match `locations` table exactly (2 fields, INTEGER PK)

### 2.4 Rewrite Job Entity → JobRequirement Entity
**Current Issues:**
- Table name wrong: `jobs` → should be `job_requirements`
- PK type: UUID (wrong) → should be INTEGER
- company_id field (wrong) → should be client_id
- Missing 20 fields

**Target:** Match `job_requirements` table exactly (35 fields, INTEGER PK)

---

## PHASE 3: Junction & Supporting Entities

### 3.1 Rewrite Submission Entity → RequirementSubmission Entity
**Current Issues:**
- Table name wrong: `submissions` → should be `requirement_submissions`
- PK type: UUID (wrong) → should be INTEGER
- Data model wrong: should NOT have candidate_id FK, instead has denormalized candidate fields
- Missing 27 fields

**Target:** Match `requirement_submissions` table exactly (32 fields, INTEGER PK)

### 3.2 CREATE CandidateEducation Entity (NEW)
**Target:** Match `candidate_education` table exactly (10 fields, INTEGER PK)

### 3.3 CREATE CandidateExperience Entity (NEW)
**Target:** Match `candidate_experience` table exactly (10 fields, INTEGER PK)

### 3.4 CREATE CandidateSkill Entity (NEW)
**Target:** Match `candidate_skills` table exactly (10 fields, INTEGER PK)

### 3.5 CREATE SkillMaster Entity (NEW)
**Target:** Match `skill_masters` table exactly (3 fields, INTEGER PK)

### 3.6 CREATE Qualification Entity (NEW)
**Target:** Match `qualifications` table exactly (4 fields, INTEGER PK)

---

## PHASE 4: Hiring Process Entities

### 4.1 Rewrite Interview Entity
**Current Issues:**
- PK type: UUID (wrong) → should be INTEGER
- Missing 5+ fields

**Target:** Match `interviews` table exactly (20 fields, INTEGER PK)

### 4.2 CREATE SubmissionSkill Entity (NEW)
**Target:** Match `submission_skills` table exactly (5 fields, INTEGER PK)

### 4.3 Rewrite Offer Entity
**Current Issues:**
- PK type: UUID (wrong) → should be INTEGER
- Missing 7 fields

**Target:** Match `offers` table exactly (31 fields, INTEGER PK)

---

## PHASE 5: Update TypeORM Configuration & Module Setup

- Update data source configuration to use new entities
- Update module imports to reference new entity paths
- Generate fresh migrations
- Verify entities compile

---

## PHASE 6: Update DTOs

- Update CreateCandidateDto → Include ALL 49 fields
- Update UpdateCandidateDto → Include ALL 49 fields
- Update all other DTOs similarly
- Remove demo fields
- Enforce required/optional based on DB nullability

---

## PHASE 7: Update Services

- Update CandidateService to handle all 49 fields
- Update all CRUD methods to work with complete schema
- Implement proper error handling
- Verify FK relationships resolve correctly

---

## PHASE 8: Update Controllers

- Update endpoints to use new DTOs
- Verify all routes still work
- Test end-to-end integration

---

## PHASE 9: Frontend Alignment

- Update forms to include all real DB fields
- Implement edit/update flows
- Remove placeholder logic
- Test with real backend data

---

## DETAILED IMPLEMENTATION STEPS

### Step 1: Backup Current Entities
```bash
# Create backup directory
mkdir -p src/_backup_old_entities
# Copy all entity files for reference
```

### Step 2: Start Fresh Entity Rewrite
- Begin with User (no dependencies)
- Move to Role, Permission
- Then Candidate, Client, Location
- Then Job Requirements
- Then Requirement Submissions (depends on Candidate, Job Requirements)
- Then Interview, Offer (depends on Requirement Submissions, Job Requirements)
- Then supporting entities (Education, Experience, Skills, etc.)

### Step 3: Update AppModule
- Update TypeORM configuration entities array
- Verify all entities compile

### Step 4: Generate Migrations
```bash
npm run typeorm migration:generate -- -n AlignWithProductionDatabase
```

### Step 5: Test Migrations
- Run on dev DB first
- Verify schema matches
- Check for data inconsistencies

### Step 6: Update DTOs
- Sync with new entity structure
- Ensure all DB fields are represented
- Add proper validation

### Step 7: Update Services
- Reflect new entity structure
- Implement full CRUD
- Add proper FK handling

### Step 8: Test
- Unit tests for entities
- Integration tests for services
- E2E tests for APIs
- Load production sample data

---

## KEY RULES DURING REWRITE

1. ✅ Database is FINAL - code must adapt, not vice versa
2. ✅ Match field names EXACTLY (candidate_name, not firstName + lastName)
3. ✅ Use INTEGER PKs, not UUID
4. ✅ Match enum casing EXACTLY (Active, not active)
5. ✅ Define ALL ForeignKey relationships
6. ✅ Include ALL nullable and default constraints
7. ✅ DO NOT invent fields
8. ✅ DO NOT keep assumptions (company_id, multi-tenancy if not in DB)
9. ✅ Document every field mapping
10. ✅ Test after each phase

---

## DELIVERABLES AT END

1. All entities match DB schema 1:1
2. No UUID primary keys
3. No company_id assumptions
4. All 17 entities properly defined
5. All ForeignKey relationships correct
6. All DTOs reflect real fields
7. All services handle complete data
8. All controllers work with real data
9. Migrations generated and tested
10. Summary document with old → new mappings

---

## TIMELINE

- Phase 1-2 (Core entities): 30 min
- Phase 3 (Junction entities): 30 min
- Phase 4 (Hiring entities): 20 min
- Phase 5 (Config): 15 min
- Phase 6-7 (DTOs & Services): 45 min
- Phase 8-9 (Controllers & Frontend): 1 hour
- Testing & Verification: 1 hour

**Total:** ~4 hours estimated

---

**Status:** Ready to begin Phase 1
