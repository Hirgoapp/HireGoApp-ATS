# Employee Tracker → ATS SaaS Migration Roadmap

**Goal:** Migrate ALL 130 Employee Tracker tables into ATS as multi-tenant SaaS modules

**Architecture:** Keep ATS multi-tenant foundation intact, add Employee Tracker business power

---

## Migration Strategy Overview

### What We're Doing
- ✅ Keep ATS multi-tenant core (Super Admin, Companies, Tenants, Auth, RBAC)
- ✅ Add ALL Employee Tracker modules as tenant-scoped features
- ✅ Convert integer PKs → UUIDs
- ✅ Add `company_id` to every business table
- ✅ Apply tenant guards to all controllers
- ✅ Migrate business logic, validations, workflows

### What We're NOT Doing
- ❌ NOT removing multi-tenancy
- ❌ NOT using employee_tracker database at runtime
- ❌ NOT breaking existing ATS foundation

---

## Phase-by-Phase Execution Plan

### PHASE 0: Foundation Lock (DO NOT TOUCH) ✅

**Status:** LOCKED - No changes allowed

**Modules:**
- Super Admin
- Company/Tenant Management
- Authentication (JWT, tokens)
- RBAC (roles, permissions)
- Tenant Middleware
- UUID handling
- Audit logging

**Action:** These stay as-is. Reference only.

---

### PHASE 1: Core ATS Modules (Priority 1)

**Goal:** Migrate core recruitment workflow

**Duration:** 2-3 days

#### Module 1.1: Candidates (Rich Profile)

**Tables to Migrate:**
1. `candidates` → Multi-tenant candidates
2. `candidate_skills` → candidate_skills (with company_id)
3. `candidate_education` → candidate_education (with company_id)
4. `candidate_experience` → candidate_experience (with company_id)
5. `candidate_documents` → candidate_documents (with company_id)
6. `candidate_address` → candidate_addresses (with company_id)
7. `candidate_history` → candidate_history (with company_id)
8. `candidate_attachments` → candidate_attachments (with company_id)

**Schema Changes:**
```sql
-- Old (Employee Tracker)
candidates:
  id: integer (PK)
  name: varchar
  email: varchar
  phone: varchar
  source_id: integer (FK)
  status: varchar
  created_at: timestamp
  
-- New (ATS SaaS)
candidates:
  id: uuid (PK)
  company_id: uuid (FK to companies) ← ADDED
  name: varchar
  email: varchar
  phone: varchar
  source_id: uuid (FK)
  status: varchar
  created_at: timestamp
  created_by: uuid (FK to users)
  updated_at: timestamp
  updated_by: uuid (FK to users)
```

**Implementation Steps:**
1. Create migration files for all 8 tables
2. Create TypeORM entities with UUID + company_id
3. Create DTOs (CreateCandidateDto, UpdateCandidateDto, etc.)
4. Update CandidateService with tenant scoping
5. Update CandidateController with @TenantGuard
6. Add validation, business rules
7. Create API tests
8. Update frontend components

**Files to Create/Update:**
- `src/candidate/entities/candidate.entity.ts`
- `src/candidate/entities/candidate-skill.entity.ts`
- `src/candidate/entities/candidate-education.entity.ts`
- `src/candidate/entities/candidate-experience.entity.ts`
- `src/candidate/entities/candidate-document.entity.ts`
- `src/candidate/entities/candidate-address.entity.ts`
- `src/candidate/dto/*.dto.ts`
- `src/candidate/candidate.service.ts`
- `src/candidate/candidate.controller.ts`
- `migrations/xxx-migrate-candidate-module.ts`

---

#### Module 1.2: Job Requirements (Full Lifecycle)

**Tables to Migrate:**
1. `job_requirements` → job_requirements
2. `requirement_skills` → requirement_skills
3. `requirement_assignments` → requirement_assignments
4. `requirement_import_logs` → requirement_import_logs
5. `requirement_tracker_templates` → requirement_templates

**Schema Changes:**
```sql
-- Old
job_requirements:
  id: integer
  title: varchar
  client_id: integer
  status: varchar
  
-- New
job_requirements:
  id: uuid
  company_id: uuid ← ADDED
  title: varchar
  client_id: uuid
  status: varchar
  priority: varchar
  salary_min: decimal
  salary_max: decimal
  created_by: uuid
  updated_by: uuid
```

**Implementation Steps:**
1. Create migrations (5 tables)
2. Create entities (5 files)
3. Create DTOs (create, update, filter)
4. Update JobService with tenant scoping
5. Update JobController with guards
6. Add business logic (status transitions, assignments)
7. API tests
8. Frontend updates

---

#### Module 1.3: Submissions (Candidate-to-Job Matching)

**Tables to Migrate:**
1. `requirement_submissions` → submissions
2. `submission_documents` → submission_documents
3. `submission_skills` → submission_skills
4. `submission_audit` → submission_audit
5. `daily_submissions` → daily_submission_stats

**Schema Changes:**
```sql
-- Old
requirement_submissions:
  id: integer
  requirement_id: integer
  candidate_id: integer
  status: varchar
  vendor_email: varchar
  
-- New
submissions:
  id: uuid
  company_id: uuid ← ADDED
  requirement_id: uuid
  candidate_id: uuid
  status: varchar
  vendor_email: varchar
  submitted_by: uuid
  submitted_at: timestamp
  bill_rate: decimal
  pay_rate: decimal
```

**Implementation Steps:**
1. Migrations (5 tables)
2. Entities (5 files)
3. DTOs (create, update, status change)
4. SubmissionService with tenant + workflow logic
5. SubmissionController with guards
6. Status transition rules
7. API tests
8. Frontend workflow UI

---

#### Module 1.4: Interviews (Scheduling & Feedback)

**Tables to Migrate:**
1. `interviews` → interviews

**Schema Changes:**
```sql
-- Old
interviews:
  id: integer
  submission_id: integer
  interview_date: timestamp
  status: varchar
  feedback: text
  
-- New
interviews:
  id: uuid
  company_id: uuid ← ADDED
  submission_id: uuid
  candidate_id: uuid
  job_requirement_id: uuid
  interview_date: timestamp
  interview_type: varchar (phone, video, onsite)
  status: varchar
  interviewer_id: uuid
  feedback: text
  rating: integer
  scheduled_by: uuid
  completed_at: timestamp
```

**Implementation Steps:**
1. Migration (1 table)
2. Entity (interview.entity.ts)
3. DTOs (schedule, reschedule, complete, feedback)
4. InterviewService (scheduling logic, notifications)
5. InterviewController with guards
6. Calendar integration prep
7. API tests
8. Frontend calendar view

---

#### Module 1.5: Offers (Offer Management)

**Tables to Migrate:**
1. `offers` → offers

**Schema Changes:**
```sql
-- Old
offers:
  id: integer
  submission_id: integer
  salary: decimal
  status: varchar
  
-- New
offers:
  id: uuid
  company_id: uuid ← ADDED
  submission_id: uuid
  candidate_id: uuid
  job_requirement_id: uuid
  offer_type: varchar (full-time, contract, etc.)
  salary: decimal
  bill_rate: decimal
  pay_rate: decimal
  start_date: date
  end_date: date
  status: varchar (draft, sent, accepted, rejected, withdrawn)
  sent_at: timestamp
  responded_at: timestamp
  created_by: uuid
```

**Implementation Steps:**
1. Migration (1 table)
2. Entity (offer.entity.ts)
3. DTOs (create, send, accept, reject, withdraw)
4. OfferService (workflow, email prep)
5. OfferController with guards
6. Status transitions
7. API tests
8. Frontend offer management UI

---

#### Module 1.6: Clients & Sources (Master Data)

**Tables to Migrate:**
1. `clients` → clients
2. `sources` → sources (candidate sources)
3. `locations` → locations
4. `company_master` → (merge into companies if needed)

**Schema Changes:**
```sql
-- clients
clients:
  id: uuid
  company_id: uuid ← ADDED
  name: varchar
  contact_person: varchar
  email: varchar
  phone: varchar
  address: text
  status: varchar (active, inactive)
  
-- sources
sources:
  id: uuid
  company_id: uuid ← ADDED
  name: varchar (Indeed, LinkedIn, Referral, etc.)
  type: varchar (job_board, referral, social)
  is_active: boolean
```

**Implementation Steps:**
1. Migrations (4 tables)
2. Entities (4 files)
3. DTOs (CRUD)
4. Services (ClientService, SourceService, LocationService)
5. Controllers with guards
6. API tests
7. Frontend master data UI

---

### PHASE 2: Skills & Qualifications (Priority 2)

**Duration:** 1 day

#### Module 2.1: Skills Management

**Tables to Migrate:**
1. `skills` → skills (candidate skills lookup)
2. `skill_masters` → skill_categories
3. `skills_backup` → (skip, backup table)

**Schema Changes:**
```sql
skills:
  id: uuid
  company_id: uuid ← ADDED (or make it global/shared)
  name: varchar
  category_id: uuid
  is_active: boolean
```

**Implementation:**
- Migration + Entity + Service + Controller
- Skills autocomplete API
- Frontend skill selector

---

#### Module 2.2: Education & Experience

**Tables to Migrate:**
1. `education_details` → education_levels (Master data)
2. `experience_details` → experience_types (Master data)
3. `qualification_masters` → qualifications (degrees, certs)
4. `qualifications` → (duplicate? merge)

**Implementation:**
- Migrations + Entities + Services
- Master data management UI

---

### PHASE 3: Support Ticketing System (Priority 2)

**Duration:** 2 days

#### Module 3.1: Full Ticketing System

**Tables to Migrate:**
1. `tickets` → tickets
2. `ticket_comments` → ticket_comments
3. `ticket_attachments` → ticket_attachments
4. `ticket_assignments` → ticket_assignments
5. `ticket_status_history` → ticket_status_history
6. `ticket_sla_tracking` → ticket_sla_tracking
7. `ticket_timers` → ticket_timers
8. `ticket_notifications` → ticket_notifications
9. `ticket_assets` → ticket_assets (if asset management enabled)
10. `support_tickets` → (merge with tickets or separate?)

**Schema Changes:**
```sql
tickets:
  id: uuid
  company_id: uuid ← ADDED
  ticket_number: varchar (auto-generated)
  title: varchar
  description: text
  priority: varchar (low, medium, high, critical)
  status: varchar (open, in_progress, resolved, closed)
  category: varchar
  requester_id: uuid (user who created)
  assigned_to: uuid (user assigned)
  created_at: timestamp
  resolved_at: timestamp
  closed_at: timestamp
  sla_due_date: timestamp
```

**Implementation Steps:**
1. Migrations (10 tables)
2. Entities (10 files)
3. DTOs (create, update, comment, assign, close)
4. TicketService (workflow, SLA calculation, notifications)
5. TicketController with guards
6. SLA rules engine
7. API tests
8. Frontend ticket management UI (list, detail, kanban view)

---

#### Module 3.2: SLA Policies

**Tables to Migrate:**
1. `sla_policies` → sla_policies
2. `sla_rules` → sla_rules

**Implementation:**
- SLA configuration UI
- Auto-calculation on ticket creation
- SLA breach alerts

---

### PHASE 4: Asset Management (Priority 3)

**Duration:** 2 days

**Tables to Migrate:**
1. `assets` → assets
2. `asset_history` → asset_history
3. `asset_assignment_history` → asset_assignments
4. `asset_lifecycle_events` → asset_lifecycle_events
5. `asset_maintenance_history` → asset_maintenance
6. `asset_relationships` → asset_relationships
7. `user_assets` → user_asset_assignments
8. `maintenance_schedules` → maintenance_schedules
9. `it_setup` → it_setup_requests

**Schema:**
```sql
assets:
  id: uuid
  company_id: uuid ← ADDED
  asset_tag: varchar (unique)
  name: varchar
  category: varchar (laptop, monitor, phone, etc.)
  model: varchar
  serial_number: varchar
  purchase_date: date
  warranty_expiry: date
  status: varchar (available, assigned, maintenance, retired)
  location_id: uuid
  assigned_to: uuid (user)
  assigned_at: timestamp
```

**Implementation:**
- Full asset lifecycle tracking
- Assignment workflow
- Maintenance scheduling
- Asset depreciation (optional)

---

### PHASE 5: Communication & Collaboration (Priority 3)

**Duration:** 1.5 days

**Tables to Migrate:**
1. `announcements` → announcements
2. `announcement_comments` → announcement_comments
3. `announcement_reactions` → announcement_reactions
4. `announcement_reads` → announcement_reads
5. `announcement_tags` → announcement_tags
6. `announcement_analytics` → announcement_analytics
7. `messages` → internal_messages
8. `notifications` → notifications
9. `user_notification_preferences` → notification_preferences

**Features:**
- Company-wide announcements
- Internal messaging
- Real-time notifications (WebSocket prep)
- Email digests

---

### PHASE 6: Workflow & Approvals (Priority 3)

**Duration:** 2 days

**Tables to Migrate:**
1. `workflows` → workflows
2. `approvals` → approvals
3. `timesheet_approvals` → timesheet_approvals

**Features:**
- Multi-step approval workflows
- Configurable workflow templates
- Approval hierarchy
- Timesheet management

---

### PHASE 7: Reporting & Analytics (Priority 4)

**Duration:** 2 days

**Tables to Migrate:**
1. `reports` → reports
2. `custom_reports` → custom_reports
3. `module_reports` → module_reports
4. `report_permissions` → report_permissions
5. `report_access_logs` → report_access_logs
6. `report_logs` → report_logs
7. `role_report_map` → role_report_access
8. `training_reports` → training_reports
9. `department_performance` → department_performance

**Features:**
- Pre-built report templates
- Custom report builder
- Export to PDF/Excel
- Scheduled reports
- Dashboard widgets

---

### PHASE 8: Advanced Features (Priority 4)

**Duration:** 3 days

**Tables to Migrate:**
1. `feedback` → feedback
2. `feedback_replies` → feedback_replies
3. `performance` → performance_reviews
4. `webhooks` → webhooks
5. `api_tokens` → api_tokens
6. `forms` → dynamic_forms
7. `form_fields` → form_fields
8. `search_index` → (use Elasticsearch/TypeORM full-text)
9. `navigation_config` → navigation_config

**Features:**
- 360° feedback system
- Performance review module
- Webhook integrations
- API token management
- Dynamic form builder
- Global search

---

### PHASE 9: Data Import & Integration (Priority 4)

**Duration:** 1.5 days

**Tables to Migrate:**
1. `import_jobs` → import_jobs
2. `resume_import_jobs` → resume_imports
3. `resume_candidates` → resume_parsing_results
4. `naukri_candidates` → (external integration data)
5. `naukri_download_history` → external_sync_logs
6. `synced_emails` → synced_emails
7. `email_ingestion_config` → email_config
8. `jd_email_processing_logs` → jd_parsing_logs
9. `extracted_jd_fields` → jd_extracted_data
10. `extracted_jd_history` → jd_extraction_history
11. `requirement_import_logs` → requirement_import_logs

**Features:**
- Bulk import (CSV, Excel)
- Resume parsing (third-party API)
- Email ingestion for job descriptions
- External job board integration prep
- Import history & rollback

---

### PHASE 10: Audit & Compliance (Priority 4)

**Duration:** 1 day

**Tables to Migrate:**
1. `audit_logs` → (already exists in ATS? merge or enhance)
2. `activity_log` → activity_logs
3. `activity_logs` → (duplicate? merge)
4. `clearance_audit_logs` → clearance_audit_logs
5. `employee_clearance_tracker` → clearance_tracker
6. `clearance_documents` → clearance_documents
7. `dropdown_change_log` → system_change_logs
8. `system_setting_logs` → system_setting_logs
9. `file_deletes` → file_deletion_logs
10. `login_tracker` → (merge with existing auth logs)

**Features:**
- Comprehensive audit trail
- Compliance reporting
- Data retention policies
- GDPR/privacy controls

---

### PHASE 11: User & Authentication Enhancements (Priority 4)

**Duration:** 1 day

**Tables to Migrate:**
1. `users` → (enhance existing users table)
2. `user_profiles` → user_profiles
3. `user_profiles_archive` → user_profile_archives
4. `user_roles` → (already in ATS)
5. `user_permissions` → (already in ATS)
6. `user_sessions` → user_sessions
7. `user_statuses` → user_statuses
8. `user_documents` → user_documents
9. `password_reset_tokens` → (already exists?)
10. `reset_tokens` → (merge)
11. `temp_inactive_users` → inactive_user_archive

**Enhancements:**
- Extended user profiles
- Session management UI
- Document uploads per user
- User status workflow

---

### PHASE 12: System Configuration (Priority 5)

**Duration:** 1 day

**Tables to Migrate:**
1. `system_settings` → system_settings
2. `document_types` → document_types
3. `document_type_master` → (merge)
4. `modules` → enabled_modules
5. `dashboard_modules` → dashboard_config
6. `organization_profile` → (merge into companies)
7. `rmg_pocs` → (client POCs - merge into clients)

**Features:**
- System-wide settings UI
- Module enable/disable
- Dashboard customization
- Document type management

---

### PHASE 13: Monitoring & Observability (Priority 5)

**Duration:** 1 day

**Tables to Migrate:**
1. `system_metrics` → system_metrics
2. `error_events` → error_logs
3. `work_logs` → work_logs (time tracking)

**Features:**
- System health dashboard
- Error tracking & alerting
- Performance monitoring
- Time tracking (if needed)

---

### PHASE 14: Miscellaneous & Cleanup (Priority 5)

**Duration:** 0.5 day

**Tables to Review:**
1. `alembic_version` → (skip, migration tool metadata)
2. `attachments` → (generic, merge with other attachment tables)

---

## Summary Statistics

**Total Tables:** 130
**Phases:** 14
**Estimated Duration:** ~25-30 working days (5-6 weeks)

**Breakdown by Priority:**
- Priority 1 (Core ATS): 6 modules, ~3 days
- Priority 2 (Skills, Ticketing): 3 modules, ~3 days
- Priority 3 (Assets, Communication, Workflow): 3 modules, ~5.5 days
- Priority 4 (Advanced): 4 modules, ~8.5 days
- Priority 5 (System): 3 modules, ~2.5 days

---

## Migration Checklist Template (Per Module)

For EACH module, we complete:

### 1. Database Layer
- [ ] Create TypeORM migration file(s)
- [ ] Add UUID primary keys
- [ ] Add company_id foreign key
- [ ] Add created_by, updated_by tracking
- [ ] Add timestamps (created_at, updated_at)
- [ ] Add indexes (company_id, status, dates)
- [ ] Add constraints (unique, check, FK)
- [ ] Run migration against ats_saas database
- [ ] Verify schema in pgAdmin

### 2. Backend - Entities
- [ ] Create TypeORM entity class
- [ ] Add @Entity, @Column decorators
- [ ] Add relations (@ManyToOne, @OneToMany)
- [ ] Add validation decorators
- [ ] Export from module

### 3. Backend - DTOs
- [ ] CreateDto with validation
- [ ] UpdateDto (partial)
- [ ] FilterDto (query params)
- [ ] ResponseDto (output shape)

### 4. Backend - Service
- [ ] Inject repository
- [ ] Implement CRUD operations
- [ ] Add tenant scoping (WHERE company_id = ?)
- [ ] Add business logic
- [ ] Add error handling
- [ ] Add transaction support
- [ ] Add audit logging

### 5. Backend - Controller
- [ ] Add @TenantGuard
- [ ] Add @RequirePermissions
- [ ] Implement endpoints (GET, POST, PUT, DELETE)
- [ ] Add Swagger decorators
- [ ] Add validation pipes
- [ ] Handle errors

### 6. Testing
- [ ] Unit tests (service)
- [ ] Integration tests (controller)
- [ ] E2E tests (API)
- [ ] Test tenant isolation
- [ ] Test permissions

### 7. Frontend
- [ ] Create page component
- [ ] Create form components
- [ ] Add API calls (service)
- [ ] Add state management (Zustand)
- [ ] Add routing
- [ ] Add navigation menu item
- [ ] Style with Tailwind

### 8. Documentation
- [ ] Update API docs
- [ ] Update user guide
- [ ] Add migration notes

---

## Execution Protocol

### Daily Workflow
1. Pick ONE module from current phase
2. Complete ALL 8 checklist items
3. Test thoroughly
4. Commit with clear message
5. Move to next module

### Branching Strategy
```
main (production)
  └─ develop
      └─ feature/phase-1-candidates
      └─ feature/phase-1-jobs
      └─ feature/phase-1-submissions
      (etc.)
```

### Testing Strategy
- Unit tests: 80% coverage minimum
- Integration tests: All API endpoints
- E2E tests: Critical user flows
- Tenant isolation: Verify no cross-company data leakage

---

## Risk Mitigation

### Risk 1: Data Loss
- **Mitigation:** All migrations are reversible (up/down)
- **Backup:** Full DB backup before each phase

### Risk 2: Performance Degradation
- **Mitigation:** Add indexes on company_id + frequently queried fields
- **Monitoring:** Track query performance

### Risk 3: Breaking Changes
- **Mitigation:** Feature flags per module
- **Rollback:** Keep old code until new is proven

### Risk 4: Scope Creep
- **Mitigation:** Stick to priority order
- **Rule:** Complete one phase before starting next

---

## Success Criteria

### Phase Completion
- ✅ All tables migrated with UUID + company_id
- ✅ All services tenant-scoped
- ✅ All controllers guarded
- ✅ All tests passing
- ✅ Frontend functional
- ✅ Documentation updated

### Project Completion
- ✅ All 130 tables migrated
- ✅ Multi-tenancy verified (3+ test companies)
- ✅ Performance benchmarked (< 200ms avg response)
- ✅ Security audit passed
- ✅ User acceptance testing complete

---

## Ready to Begin

**Current Status:** ✅ Planning Complete

**Next Action:** Start PHASE 1, Module 1.1 (Candidates)

**Command to Execute:**
```bash
# Create feature branch
git checkout -b feature/phase-1-candidates

# Generate migration
npm run migration:generate -- -n MigrateCandidates
```

---

**Questions before we start?**
