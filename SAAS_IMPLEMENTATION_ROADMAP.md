# ATS SaaS – Step-by-Step Implementation Roadmap

This document is the **single source of truth** for development order. Follow steps in sequence; complete validations before moving to the next step.

**Architecture hierarchy:**
1. **Product Owner (Global / Super Admin)** – platform owner, manages companies and subscriptions  
2. **Company (Tenant)** – one workspace per customer  
3. **Company Super Admin (Tenant Admin)** – admin for one company only  
4. **Company Users** – role-based users under the tenant admin  

---

## Phase 1: Multi-Tenant Backend Foundation

**Goal:** Every tenant-scoped request has a validated tenant context; no API can access another tenant’s data.

### Step 1.1 – Tenant context and middleware

**What to implement:**
- Ensure **TenantContextMiddleware** runs on all tenant routes (already applied in `app.module.ts`).
- JWT for tenant users must include `companyId` (or `company_id`) and `userId`/`sub`.
- Reject requests with invalid or missing token; attach `req.tenant = { companyId, userId, role, permissions }`.

**Files / modules:**
- `src/common/middleware/tenant-context.middleware.ts`
- `src/common/types/tenant-context.ts`
- `src/app.module.ts` (exclude list: super-admin, auth/login, auth/refresh, health, metrics)
- `src/auth/services/auth.service.ts` (ensure `generateAccessToken` sets `companyId` from `user.company_id`)

**Validations before moving on:**
- [ ] Login as a tenant user → JWT payload contains `companyId` (or `company_id`) and `sub`/`userId`.
- [ ] Request to a tenant route without token → 401.
- [ ] Request with token missing `companyId` → 401.
- [ ] Request with valid token → `req.tenant.companyId` is set in controllers that use it.

---

### Step 1.2 – Tenant-scoped data access

**What to implement:**
- All tenant-scoped services and repositories receive `companyId` from the caller (controller reading from `req.tenant`).
- No tenant-scoped query runs without `company_id` in the WHERE clause.
- Use `@CompanyId()` decorator (or equivalent) in tenant controllers to get `companyId` from request; never take `company_id` from request body.

**Files / modules:**
- `src/common/decorators/company-id.decorator.ts` (already exists)
- `src/common/guards/tenant.guard.ts` (use where needed)
- `src/common/utils/tenant-enforcement.utils.ts` (reject body with `company_id`)
- Every tenant controller: inject `companyId` from `req.tenant` and pass to service.
- Every tenant service/repository: add `company_id: companyId` to all queries for tenant-scoped entities.

**Validations before moving on:**
- [ ] Audit all tenant controllers: no endpoint reads `company_id` from body; all use decorator or `req.tenant`.
- [ ] For at least one tenant entity (e.g. Job): verify service methods accept `companyId` and filter by it.
- [ ] Manual test: change JWT `companyId` to another company’s ID → API must not return that company’s data (or must return 403/404).

---

### Step 1.3 – Database and entity checklist

**What to implement:**
- Confirm every tenant-scoped table has `company_id` column and that TypeORM entities reflect it.
- Ensure migrations are applied; no tenant table missing `company_id`.

**Files / modules:**
- All entities under `src/**/*.entity.ts` that represent tenant data (companies, users, jobs, candidates, submissions, etc.).
- Migrations in `src/database/migrations/`.

**Validations before moving on:**
- [ ] List all tenant-scoped tables; each has `company_id` (or equivalent) and it is used in queries.
- [ ] Run migrations; no errors.
- [ ] Optional: add a simple health check or script that verifies `company_id` exists on key tables.

---

**Phase 1 sign-off:** Tenant context is the only source of tenant identity; no tenant API can act on another tenant’s data. Document any exception (e.g. read-only reporting) and secure it explicitly.

---

## Phase 2: Global / Super Admin Control Layer

**Goal:** Product Owner can manage the platform: create companies, manage subscriptions/plans, and control access. Super Admin cannot see or edit tenant data (jobs, candidates, etc.).

### Step 2.1 – Super Admin authentication and routing

**What to implement:**
- Super Admin login uses a **separate** table (`super_admin_users`) and **separate** JWT (no `companyId`).
- Routes under `api/super-admin/*` are **excluded** from TenantContextMiddleware (already in place).
- Super Admin guard validates super-admin JWT and attaches `req.user` (e.g. `userId`, `email`, `role`). No tenant context.

**Files / modules:**
- `src/super-admin/entities/super-admin-user.entity.ts`
- `src/super-admin/controllers/super-admin-auth.controller.ts`
- `src/super-admin/services/super-admin-auth.service.ts`
- `src/super-admin/guards/super-admin.guard.ts`
- `src/app.module.ts` (exclude `api/super-admin/(.*)` from tenant middleware)

**Validations before moving on:**
- [ ] Super Admin login returns a token that does **not** include `companyId` (or has a dedicated claim like `isSuperAdmin: true`).
- [ ] Request to `api/super-admin/*` with tenant JWT → 401 or 403.
- [ ] Request to `api/super-admin/*` with Super Admin JWT → 200 (for existing endpoints).
- [ ] Request to tenant route `api/v1/*` with Super Admin JWT only (no companyId) → 401 (tenant middleware rejects).

---

### Step 2.2 – Company (tenant) lifecycle

**What to implement:**
- Super Admin can **create company**: insert into `companies` (name, slug, email, license_tier, settings, etc.).
- Super Admin can **list / get / update / deactivate** companies (no access to companies’ jobs, candidates, or users’ sensitive data).
- On company creation, optionally create initial **Company Admin** user in `users` with `company_id` and role `admin` (or `company_admin`).

**Files / modules:**
- `src/super-admin/controllers/super-admin.controller.ts` (companies CRUD)
- `src/super-admin/services/super-admin.service.ts`
- `src/companies/entities/company.entity.ts`
- `src/auth/entities/user.entity.ts` (tenant users with `company_id`)

**Validations before moving on:**
- [ ] Create company via Super Admin API → row in `companies`; optional first user in `users` with that `company_id`.
- [ ] Super Admin cannot list or query tenant-scoped tables (jobs, candidates, submissions) through tenant APIs (enforced by not using tenant JWT for Super Admin).
- [ ] Company slug/email uniqueness enforced.

---

### Step 2.3 – Subscriptions, plans, and limits (foundation)

**What to implement:**
- Define **plans** (e.g. basic, premium, enterprise) and store per-company **subscription** or **license** (e.g. in `companies.license_tier` or a `licenses` / `subscriptions` table).
- Super Admin can assign or change plan for a company.
- Optional: store usage or limits (e.g. max users, max jobs) and expose to tenant APIs so they can enforce limits later.

**Files / modules:**
- `src/super-admin/` (assign plan to company)
- `src/companies/entities/company.entity.ts` (license_tier, feature_flags, or link to license table)
- `src/licensing/` (if present: licenses, features, usage)

**Validations before moving on:**
- [ ] Super Admin can set/update company plan or license tier.
- [ ] Tenant APIs can read company’s plan (e.g. from `req.tenant` or company record) for future feature gating.

---

**Phase 2 sign-off:** Product Owner can create and manage companies and plans; Super Admin auth is separate from tenant auth; no cross-layer data leakage.

---

## Phase 3: Tenant (Company) Admin Layer

**Goal:** Each company has at least one Company Admin (tenant admin) who can manage that company’s users and roles. Company Admin cannot see other companies or Super Admin functions.

### Step 3.1 – Company Admin role and first user

**What to implement:**
- Define role **Company Admin** (e.g. `admin` or `company_admin`) at tenant level.
- When Super Admin creates a company, create first user with that role and link to `company_id`.
- That user logs in via **tenant auth** (`api/v1/auth/login`); JWT contains `companyId`. This user is the first Company Admin.

**Files / modules:**
- `src/super-admin/services/super-admin.service.ts` (create company + first admin user)
- `src/auth/services/auth.service.ts` (tenant login; ensure company_id in token)
- `src/auth/entities/user.entity.ts` (role, company_id)

**Validations before moving on:**
- [ ] Create company via Super Admin → first user exists with `company_id` and admin role.
- [ ] First user can log in via `POST /api/v1/auth/login` and receives JWT with `companyId` = that company.
- [ ] That user cannot access `api/super-admin/*` with this token (Super Admin routes require Super Admin JWT).

---

### Step 3.2 – Tenant user management (Company Admin only)

**What to implement:**
- Company Admin can **create, list, update, deactivate** users **for their company only** (all filtered by `company_id` from JWT).
- Endpoints under e.g. `api/v1/users` (or `api/v1/companies/me/users`). All queries use `req.tenant.companyId`.
- Only users with Company Admin role can call these endpoints (enforce with guard).

**Files / modules:**
- New or existing **Users** module under tenant API (e.g. `src/auth/` or `src/modules/users/`).
- Controller: list/create/update/deactivate users; inject `companyId` from tenant context; service filters by `company_id`.
- Guard: require role `admin` or `company_admin` for these routes.

**Validations before moving on:**
- [ ] Company Admin can create a second user in the same company; new user has same `company_id`.
- [ ] Company Admin cannot create user with a different `company_id` (service ignores body `company_id` and uses JWT).
- [ ] Non-admin tenant user cannot create/list/update users (403).
- [ ] List users returns only users for `req.tenant.companyId`.

---

### Step 3.3 – Invitation and onboarding (optional but recommended)

**What to implement:**
- Company Admin can invite user by email (create pending invitation or send link with token).
- Invited user can set password and join company (optional: email verification).

**Files / modules:**
- Invitation entity or table (e.g. `user_invitations` with `company_id`, email, token, expires_at).
- Endpoints: create invitation, accept invitation (set password, create user with `company_id`).
- Email sending (if applicable): use existing email module or stub.

**Validations before moving on:**
- [ ] Invitation is scoped to one company (`company_id`).
- [ ] Accepting invitation creates user with correct `company_id` and does not allow overriding it.

---

**Phase 3 sign-off:** Company Admin can manage users for their company only; all user management is tenant-scoped and role-protected.

---

## Phase 4: Role and Permission System

**Goal:** Tenant users have roles and optionally fine-grained permissions; tenant APIs enforce them. Company Admin can assign roles to users.

### Step 4.1 – Roles and permissions (tenant-scoped)

**What to implement:**
- **Roles** can be global names (e.g. `admin`, `recruiter`, `viewer`) or tenant-defined. If tenant-defined, add `company_id` to roles table; if global, keep roles as templates and assign per tenant.
- **User–role assignment** is tenant-scoped: user belongs to one company; assignment is within that company.
- **Permissions** (e.g. `jobs:read`, `jobs:create`, `candidates:write`) either attached to roles or directly to users (e.g. `user_permissions` with `company_id` or user’s company implied).

**Files / modules:**
- `src/auth/entities/role.entity.ts` (add `company_id` if roles are per-tenant; otherwise keep global and ensure assignment is tenant-scoped)
- `src/auth/entities/permission.entity.ts`, `role-permission.entity.ts`, `user-permission.entity.ts`
- `src/auth/repositories/*` and `src/auth/services/authorization.service.ts`
- Migrations if schema changes (e.g. add `company_id` to `roles` or new assignment table)

**Validations before moving on:**
- [ ] Every permission check uses tenant context (user’s company); no user can get permissions for another company.
- [ ] Company Admin can assign roles to users in their company only.
- [ ] Guards (e.g. PermissionGuard, RoleGuard) use `req.tenant` and user’s company.

---

### Step 4.2 – Enforce permissions on tenant APIs

**What to implement:**
- Protect tenant endpoints with **PermissionGuard** or **RoleGuard** (e.g. `@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)` and required permission).
- JWT or session should include resolved permissions or role so guards can allow/deny without DB hit on every request (optional: cache per user).

**Files / modules:**
- `src/auth/guards/permission.guard.ts`, `any-permission.guard.ts`
- `src/rbac/guards/role.guard.ts`
- Controllers: add `@UseGuards(...)` and `@RequirePermissions(...)` (or equivalent) on tenant routes.
- Auth service: include permissions or role in JWT or load after login and attach to request.

**Validations before moving on:**
- [ ] User with only `jobs:read` cannot call `POST /api/v1/jobs` (403).
- [ ] User with `jobs:create` can create job for their company only (companyId from token).
- [ ] Unauthenticated or wrong-tenant requests are rejected before permission check (401/403).

---

**Phase 4 sign-off:** Roles and permissions are tenant-scoped and enforced on all relevant tenant APIs; Company Admin can assign roles within their company.

---

## Phase 5: Core Platform Services

**Goal:** Build shared, enterprise-grade platform services (notifications, file storage, audit logging, feature flags, internal events) that all product modules can use consistently, while keeping strict tenant isolation.

### Step 5.1 – Platform services layer & architecture

**What to implement:**
- Introduce a **Platform Services Layer** in the codebase; these services are shared across modules but always respect tenant context:
  - Notification service (email, in-app, future SMS).
  - File storage service (for resumes, documents, exports).
  - Audit logging service.
  - Feature flags / plan-based feature control.
  - Event / activity emitter for internal domain events.
- Keep platform services in a dedicated area (for example `src/modules/notifications/`, `src/modules/documents/`, `src/modules/metrics/`, `src/modules/feature-flags/`, `src/common/services/`).
- Document the high-level architecture in this roadmap so all modules use these services rather than re‑implementing their own.

**Architecture diagrams (text):**

Tenant request flow:

```text
Tenant User (Browser)
    ↓  (JWT with companyId)
API Gateway / Nest App
    ↓  (TenantContextMiddleware attaches tenant)
Controller (Jobs, Candidates, etc.)
    ↓
Platform Services Layer
  • NotificationService
  • FileStorageService
  • AuditLogService
  • FeatureFlagService
  • EventBus / ActivityService
    ↓
Database + External Providers
  • PostgreSQL (tenant tables with company_id)
  • Redis / Queue
  • Email provider / storage (S3, etc.)
```

Role hierarchy:

```text
Product Owner (Super Admin; global, no company_id)
    ↓ manages
Companies (Tenants; companies.id)
    ↓ each has
Company Super Admin (tenant admin; users.company_id)
    ↓ creates / manages
Company Users (recruiters, hiring managers, viewers; users.company_id)
```

Platform vs tenant separation:

```text
Global / Platform Layer
  • SuperAdmin APIs (/api/super-admin/*)
  • Licensing, feature flags, global settings

Tenant Layer
  • Tenant APIs (/api/v1/*)
  • Recruitment modules (Jobs, Candidates, etc.)

Shared Platform Services (used by tenant modules, configured by Super Admin)
  • Notifications, storage, audit logs, metrics, events
```

**Files / modules (examples):**
- `src/modules/notifications/` – in-app + email notification service and entities.
- `src/modules/documents/` – file storage abstraction (e.g. S3) for resumes/documents.
- `src/common/services/audit.service.ts` and `src/common/entities/audit-log.entity.ts` – audit logging.
- `src/modules/feature-flags/` and `src/licensing/` – feature flags + plan logic.
- `src/common/events/` or `src/modules/async-jobs/` – activity/event publishing to queues.

**Validations before moving on:**
- [ ] There is a clear **Platform Services Layer** section in the code (folders and naming).
- [ ] Product modules (e.g. Jobs) call shared services (notifications, audit, storage) through these abstractions, not via ad‑hoc logic.
- [ ] All platform services that touch tenant data still receive `companyId` from tenant context (never from request body).

---

### Step 5.2 – Audit Logs module design

**What to implement:**
- Treat **Audit Logs** as a first‑class module used by all other modules for sensitive actions (e.g. logins, user creation, role changes, job updates, offer decisions).
- Use a normalized audit table and a lightweight service that is easy to call from any module.

**Recommended table structure (PostgreSQL):**

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,              -- tenant
  user_id UUID,                          -- actor (nullable for system actions)
  action VARCHAR(100) NOT NULL,          -- LOGIN, USER_CREATED, JOB_UPDATED, ROLE_CHANGED, OFFER_ISSUED, etc.
  entity_type VARCHAR(100) NOT NULL,     -- 'user', 'job', 'candidate', 'submission', 'offer', etc.
  entity_id UUID NOT NULL,               -- ID of the entity acted on
  metadata JSONB DEFAULT '{}'::jsonb,    -- arbitrary details: { old, new, ip, userAgent, reason }
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_company_created
  ON audit_logs (company_id, created_at DESC);

CREATE INDEX idx_audit_logs_company_entity
  ON audit_logs (company_id, entity_type, entity_id, created_at DESC);
```

**Logging requirements for every sensitive action:**
- `company_id` – from tenant context (JWT), not from body.
- `user_id` – ID of actor (or null for system jobs).
- `action` – stable action name (e.g. `LOGIN`, `JOB_CREATED`, `ROLE_ASSIGNED`).
- `entity_type` and `entity_id`.
- `metadata` – JSON with important context (e.g. old/new values, reason, IP, user agent).
- `created_at` – automatic timestamp.

**Files / modules:**
- `src/common/entities/audit-log.entity.ts`
- `src/common/services/audit.service.ts`
- `src/common/controllers/audit.controller.ts` (if exposing logs to Super Admin or tenant admins).

**Validations before moving on:**
- [ ] Every sensitive mutation (company creation, user creation, role/permission changes, job create/update/delete, offer decisions) calls `AuditService.log(...)`.
- [ ] Audit logs always include `company_id` from tenant context; system/global actions that have no `company_id` are explicitly labeled as such.
- [ ] There is at least one endpoint to view audit logs with filters by company and date (exposed either to Super Admin, tenant admin, or both with proper permissions).

---

### Step 5.3 – Notifications platform (email + in‑app)

**What to implement:**
- Introduce a **Notifications module** that supports:
  - In‑app notifications.
  - Email notifications (via existing EmailModule).
  - Future SMS (design extension points, even if not implemented now).
- Standardize a notification payload and channel selection:
  - Examples: `APPLICATION_SUBMITTED`, `INTERVIEW_SCHEDULED`, `OFFER_ISSUED`.
  - Each notification carries `company_id` and `user_id` (recipient).
- Use background jobs/queues where appropriate so email sending does not block the HTTP request.

**Files / modules:**
- `src/modules/notifications/` (entities, service, controller).
- `src/modules/async-jobs/` or queue worker for sending notifications.
- `src/modules/email/email.module.ts` and `EmailService`.

**Validations before moving on:**
- [ ] Creating at least one event (e.g. submission created, interview scheduled) enqueues or directly sends a notification using NotificationService.
- [ ] Notifications are always scoped by `company_id` and only delivered to users of that tenant.
- [ ] Email configuration is environment‑driven and safe for production (no hard‑coded secrets).

---

### Step 5.4 – File storage service (documents & resumes)

**What to implement:**
- Introduce a **File Storage abstraction** used for:
  - Candidate resumes.
  - Job attachments.
  - Exports/reports.
- Back it with S3‑compatible storage (or local for dev), organized by tenant:

```text
tenants/{company_id}/candidates/{candidate_id}/resumes/{document_id}.pdf
tenants/{company_id}/jobs/{job_id}/attachments/{file_name}
```

- Expose only **pre‑signed URLs** or download endpoints that validate tenant ownership before returning a file.

**Files / modules:**
- `src/modules/documents/` (document entity, service, controller).
- Storage abstraction (e.g. `StorageService` in a shared module).

**Validations before moving on:**
- [ ] Uploading a document from a tenant request stores it under a path that includes `company_id`.
- [ ] Downloading a document requires a token or request where tenant context matches the document’s `company_id`.
- [ ] No endpoint returns a raw storage key or unscoped URL that would allow cross‑tenant access.

---

### Step 5.5 – Feature flags and plan‑based feature control

**What to implement:**
- Extend the licensing and Super Admin layers so features can be toggled per company:
  - Use `companies.license_tier` and/or a `feature_flags` JSONB column.
  - Optionally, maintain dedicated tables in `src/licensing/` and `src/modules/feature-flags/` for richer modeling.
- On each tenant request, resolve the company’s plan and flags into a `FeatureFlagService` that can answer:
  - `isEnabled(companyId, 'advanced_reports')`
  - `maxValue(companyId, 'max_jobs')`
- Use **feature flags** both:
  - In **backend** (guards, validation).
  - In **frontend** (show/hide navigation and actions).

**Files / modules:**
- `src/companies/entities/company.entity.ts` (`license_tier`, `feature_flags`).
- `src/licensing/` – license + features + usage tracking.
- `src/modules/feature-flags/` – central service + guards/decorators.
- `src/super-admin/controllers/super-admin.controller.ts` – APIs to configure plans and features.

**Validations before moving on:**
- [ ] Super Admin can enable/disable at least one feature per company (e.g. advanced reports).
- [ ] Tenant APIs check feature flags before performing plan‑restricted operations.
- [ ] Frontend hides or disables UI for features that are not enabled by plan.

---

### Step 5.6 – Internal events / activity system

**What to implement:**
- Define a simple internal **event bus** or activity system for domain events such as:
  - `CandidateCreated`, `CandidateSubmitted`,
  - `JobCreated`, `JobClosed`,
  - `InterviewScheduled`, `OfferIssued`, etc.
- Each event contains:
  - `companyId`, `actorUserId` (if applicable),
  - `type` (event name),
  - `payload` (JSON), and `occurredAt`.
- Use this event system to fan out to:
  - Notifications.
  - Audit logs.
  - Analytics/metrics.
  - Integrations/webhooks.

**Files / modules:**
- `src/common/events/` or `src/modules/async-jobs/` event/emitter abstractions.
- Consumers in notifications, audit, analytics, and webhooks modules.

**Validations before moving on:**
- [ ] At least one core action (e.g. job created, submission created) emits an internal event with `companyId`.
- [ ] Notifications or audit logs subscribe to these events rather than duplicating logic everywhere.
- [ ] Event payloads never take `company_id` from request body; they only use the tenant context.

---

**Phase 5 sign-off:** Core platform services (audit logging, notifications, storage, feature flags, events) exist as shared, tenant‑aware services and are used by at least one product module. Tenant identity still always comes from JWT/tenant context.

---

## Phase 6: Product Modules and Features

**Goal:** Enable and build product features (Jobs, Candidates, Submissions, Interviews, Offers, etc.) on top of the foundation and platform services. Every feature is tenant-scoped and permission-aware.

### Step 6.1 – Enable and wire tenant modules

**What to implement:**
- In `src/app.module.ts`, **import** all tenant feature modules (e.g. Candidates, Submissions, Interviews, Offers, Pipelines, Documents, etc.).
- Ensure each module’s controllers use tenant context (`companyId` from request) and appropriate guards (JWT + tenant + permission where needed).
- Resolve dependencies (e.g. SuperAdminModule → EmailModule → MetricsModule); fix or stub if any module is missing.

**Files / modules:**
- `src/app.module.ts` (add CandidateModule, SubmissionModule, InterviewsModule, OffersModule, PipelinesModule, DocumentsModule, etc.)
- Each module’s controller and service: accept `companyId`, filter by `company_id`, use guards.

**Validations before moving on:**
- [ ] Backend starts without errors after adding modules.
- [ ] At least one endpoint per added module is callable with tenant JWT and returns only that tenant’s data.
- [ ] Super Admin and tenant routes remain separate; tenant routes require tenant JWT with `companyId`.

---

### Step 6.2 – Jobs module (reference implementation)

**What to implement:**
- Jobs CRUD and list: all queries and mutations use `company_id` from tenant context.
- Create/update: never accept `company_id` from body; set from `req.tenant.companyId`.
- Apply permission checks (e.g. `jobs:read`, `jobs:create`, `jobs:update`, `jobs:delete`).

**Files / modules:**
- `src/modules/jobs/job.controller.ts`, `job.service.ts`
- `src/modules/jobs/entities/job.entity.ts`
- DTOs: no `company_id` in create/update DTOs.

**Validations before moving on:**
- [ ] List jobs returns only current tenant’s jobs.
- [ ] Create job assigns `company_id` from JWT.
- [ ] Update/delete job verifies job belongs to tenant (by `company_id`).

---

### Step 6.3 – Candidates, Submissions, Interviews, Offers

**What to implement:**
- Same pattern as Jobs: tenant-scoped CRUD, `companyId` from context, no `company_id` from body, permission guards where defined.
- Submissions/Interviews/Offers reference job and candidate; ensure all belong to same tenant (e.g. submission.job_id and job.company_id = tenant).

**Files / modules:**
- `src/candidates/` or `src/candidate/`, `src/modules/submissions/`, `src/modules/interviews/`, `src/offers/`
- Controllers and services: inject `companyId`, filter and validate ownership.

**Validations before moving on:**
- [ ] Full flow: create job → create candidate → create submission for that job/candidate → create interview → create offer; all under one tenant.
- [ ] Cross-tenant test: try to reference another company’s job or candidate (e.g. by ID) → 404 or 403.

---

### Step 6.4 – Additional modules (Pipelines, Documents, Custom Fields, etc.)

**What to implement:**
- Enable remaining modules (Pipelines, Documents, Custom Fields, Reports, Analytics, etc.) in `app.module.ts`.
- Apply same tenant and permission rules; add feature flags or plan limits if required (e.g. premium-only features).

**Validations before moving on:**
- [ ] Each module’s API is tenant-scoped and guarded.
- [ ] No endpoint returns or modifies another tenant’s data.
- [ ] Optional: run a simple E2E test per module (create/read/update with tenant JWT).

---

**Phase 6 sign-off:** All product modules are tenant-scoped, permission-aware, integrated with core platform services, and end-to-end recruitment flow works within one tenant.

---

## General Rules (All Phases)

1. **Tenant from server only** – Never trust `company_id` from request body or query params for authorization; always use JWT/tenant context.
2. **Global vs tenant** – Super Admin routes and auth are separate from tenant routes and auth; no shared JWT for both.
3. **Audit** – Log sensitive actions (company creation, user creation, role assignment) with actor and tenant/company for compliance.
4. **Review before next step** – Complete all checkboxes for the current step before starting the next; fix any failing validation.

---

## Frontend Application Structure (Guidance)

**Goal:** Ensure the Business and Super Admin frontends follow a consistent, role-aware layout and navigation that maps cleanly to backend modules and feature flags.

**Recommended structure:**
- **Global layout:**
  - Sidebar navigation with module groups.
  - Top bar with current user, company, and quick actions (e.g. “Create Job”).
- **Role-based navigation:**
  - Show links based on role and feature flags (e.g. recruiters see Jobs and Candidates; admins see Admin/Settings; super admins see Companies/Modules).
- **Module grouping (example for Business UI):**
  - **Dashboard** – key metrics and shortcuts.
  - **Recruitment** – Jobs, Candidates, Submissions, Interviews, Offers.
  - **Clients / Companies** – client records, contacts (if applicable).
  - **Reports & Analytics** – funnels, performance, exports.
  - **Admin** – users, roles, notifications, integrations, audit logs (tenant admin).

**Validations:**
- [ ] Navigation items are driven by role + feature flags, not hard-coded assumptions.
- [ ] Frontend uses the same concept of tenant and platform separation as the backend (no mixing super-admin and tenant views).

---

## Performance & Scalability Considerations

**Caching strategy (Redis or similar):**
- Cache read-heavy, rarely changing data:
  - Company settings, feature flags, license/plan details.
  - Common lookup lists (locations, skills, education levels).
- Use keys that include `company_id`, e.g. `tenant:{companyId}:settings`.

**Background jobs / queues:**
- Use a queue (Bull or similar) for:
  - Email sending (welcome emails, notifications).
  - Resume/document processing (parsing, OCR, AI enrichment).
  - Report generation and exports.
- Ensure job payloads contain `companyId` and relevant IDs; workers always re-verify tenant context from DB.

**API rate limiting:**
- Use `ThrottlerModule` or similar per IP and, where appropriate, per tenant:
  - Prevent abuse and noisy neighbors.
  - Keep rate limits configurable per plan (e.g. higher limits for enterprise).

**Database indexing:**
- Always index on `company_id` plus the most common filters:
  - `company_id, status`, `company_id, created_at DESC`, etc.
- Verify indexes exist for audit logs, jobs, candidates, submissions, and other high-volume tables.

**Validations:**
- [ ] Key tables (jobs, candidates, submissions, audit_logs) are indexed by `company_id` and common query fields.
- [ ] Expensive operations (emails, document parsing, analytics) are offloaded to background jobs.
- [ ] Cache invalidation strategies are documented for settings and feature flags.

---

## Quick Reference: Key Files

| Purpose | Path |
|--------|------|
| Tenant middleware | `src/common/middleware/tenant-context.middleware.ts` |
| Tenant context type | `src/common/types/tenant-context.ts` |
| Company ID decorator | `src/common/decorators/company-id.decorator.ts` |
| Tenant guard | `src/common/guards/tenant.guard.ts` |
| Tenant utils | `src/common/utils/tenant-enforcement.utils.ts` |
| App module (middleware + imports) | `src/app.module.ts` |
| Tenant auth (login, JWT) | `src/auth/services/auth.service.ts` |
| Super Admin auth | `src/super-admin/` |
| Companies entity | `src/companies/entities/company.entity.ts` |
| Tenant users | `src/auth/entities/user.entity.ts` |
| Super Admin users | `src/super-admin/entities/super-admin-user.entity.ts` |
| Roles / permissions | `src/auth/entities/role.entity.ts`, permission, role-permission, user-permission |

---

*Document version: 1.0. Use this roadmap as the single sequence for implementation; do not skip steps or reorder phases without updating this file and aligning with the architecture.*
