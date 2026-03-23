# ATS SaaS - Core Modules & Architecture

## Module Breakdown

### **1. Auth & Multi-Tenancy Module** (`auth/`)
**Purpose**: Handle authentication, authorization, and tenant isolation

**Responsibilities**:
- JWT token generation & validation
- Email/password authentication
- SSO integration (Google, Azure, Okta - future)
- Multi-tenant context extraction
- Role-based access control (RBAC)
- Permission validation
- API key management for integrations

**Key Services**:
- `AuthService`: Login, logout, token refresh
- `JwtService`: Token creation & validation
- `TenantService`: Tenant context management
- `PermissionService`: RBAC enforcement
- `ApiKeyService`: API key generation & validation

**Guards**:
- `JwtAuthGuard`: Validate JWT and extract tenant context
- `TenantGuard`: Verify user belongs to requested tenant
- `RoleGuard`: Check role-based access
- `PermissionGuard`: Verify specific permissions
- `LicenseGuard`: Check feature availability

---

### **2. Companies Module** (`companies/`)
**Purpose**: Manage tenant/company data and settings

**Responsibilities**:
- Company registration & onboarding
- Company profile management (name, logo, branding)
- License management (tier, features, quota)
- Feature flags & settings per company
- Company settings (timezone, date format, currency)
- Company status (active, suspended, deleted)

**Entities**:
- `Company` (database model)

**Key Services**:
- `CompanyService`: CRUD for companies
- `LicenseService`: License validation, quota checking
- `SettingsService`: Company settings management
- `OnboardingService`: New company setup workflow

**DTOs**:
- `CreateCompanyDto`
- `UpdateCompanyDto`
- `CompanySettingsDto`

---

### **3. Users Module** (`users/`)
**Purpose**: Manage team members and user access

**Responsibilities**:
- User creation, update, deletion
- Role assignment (admin, recruiter, hiring_manager, viewer)
- Permission management
- User profile management (avatar, bio, job title)
- User deactivation (soft delete)
- User invitation & email verification

**Entities**:
- `User` (database model)

**Key Services**:
- `UserService`: User CRUD operations
- `UserInvitationService`: Invite new team members
- `RoleService`: Role assignment & permission mapping
- `PermissionService`: Fine-grained permission control

**DTOs**:
- `CreateUserDto`
- `UpdateUserDto`
- `UserProfileDto`

---

### **4. Candidates Module** (`candidates/`)
**Purpose**: Manage candidate database and profiles

**Responsibilities**:
- Candidate CRUD operations
- Candidate profile enrichment (skills, experience, etc.)
- Candidate tagging & categorization
- Candidate source tracking
- Candidate deduplication detection
- Candidate status management (prospect, active, hired, archived)
- Bulk import (CSV, API)
- Candidate search & filtering

**Entities**:
- `Candidate` (database model)

**Key Services**:
- `CandidateService`: CRUD operations
- `CandidateSearchService`: Advanced search & filtering
- `CandidateDeduplicationService`: Detect & merge duplicates
- `CandidateBulkImportService`: CSV import, Excel import
- `CandidateEnrichmentService`: Data enrichment (future)

**DTOs**:
- `CreateCandidateDto`
- `UpdateCandidateDto`
- `CandidateProfileDto`
- `CandidateSearchDto`

---

### **5. Jobs Module** (`jobs/`)
**Purpose**: Manage job postings and requisitions

**Responsibilities**:
- Job creation & management (open, close, pause)
- Job details (title, description, requirements, salary)
- Job status tracking
- Job publishing (to job boards - future)
- Job templates for reusable job descriptions
- Job analytics (views, applications, time-to-hire)
- Multi-department jobs support

**Entities**:
- `Job` (database model)

**Key Services**:
- `JobService`: Job CRUD & status management
- `JobTemplateService`: Reusable job templates
- `JobAnalyticsService`: Metrics & reporting

**DTOs**:
- `CreateJobDto`
- `UpdateJobDto`
- `JobDetailDto`

---

### **6. Applications Module** (`applications/`)
**Purpose**: Track candidate applications across pipeline stages

**Responsibilities**:
- Application creation & management
- Stage transitions (move candidate through pipeline)
- Application status tracking
- Interview scheduling & tracking
- Candidate evaluations & ratings
- Rejection & hire decision tracking
- Application filtering & search
- Bulk actions (move to stage, reject, etc.)

**Entities**:
- `Application` (database model)

**Key Services**:
- `ApplicationService`: Application CRUD & workflow
- `ApplicationStageService`: Manage pipeline stages for applications
- `InterviewService`: Schedule & track interviews
- `EvaluationService`: Store candidate ratings & feedback
- `ApplicationBulkActionService`: Bulk operations

**DTOs**:
- `CreateApplicationDto`
- `UpdateApplicationDto`
- `MoveApplicationDto`
- `ApplicationFilterDto`

---

### **7. Pipelines Module** (`pipelines/`)
**Purpose**: Manage customizable recruitment pipelines

**Responsibilities**:
- Pipeline creation & customization per company
- Pipeline stages (CRUD)
- Stage ordering & workflow
- Default pipeline configuration
- Pipeline templates (future)
- Auto-advance workflow configuration
- Stage actions (email notifications, webhooks)

**Entities**:
- `Pipeline` (database model)
- `PipelineStage` (database model)

**Key Services**:
- `PipelineService`: Pipeline CRUD
- `PipelineStageService`: Stage management
- `PipelineValidationService`: Ensure valid stage transitions

**DTOs**:
- `CreatePipelineDto`
- `UpdatePipelineDto`
- `CreateStageDto`
- `UpdateStageDto`

---

### **8. Custom Fields Module** (`custom-fields/`)
**Purpose**: Enable metadata-driven customization for all entities

**Responsibilities**:
- Define custom fields for candidates, applications, jobs
- Field types: text, number, select, multiselect, date, checkbox, textarea, etc.
- Field validation rules
- Field visibility & access control (role-based)
- Field reordering & organization
- Field value storage (in JSONB columns)
- Field usage tracking & cleanup
- Default values & templates

**Entities**:
- `CustomField` (database model)

**Key Services**:
- `CustomFieldService`: Field CRUD & management
- `CustomFieldValidationService`: Validate field values
- `CustomFieldRenderService`: Format fields for API response

**DTOs**:
- `CreateCustomFieldDto`
- `UpdateCustomFieldDto`
- `CustomFieldValueDto`

---

### **9. Documents Module** (`documents/`)
**Purpose**: Manage resumes, cover letters, and files

**Responsibilities**:
- Document upload to S3 (multi-tenant buckets)
- Document storage & retrieval
- Resume parsing & text extraction (future)
- Document type classification
- Document versioning (multiple resumes per candidate)
- Virus scanning & security (future)
- Document cleanup on candidate deletion

**Entities**:
- `Document` (database model)

**Key Services**:
- `DocumentService`: Upload, retrieve, delete documents
- `DocumentStorageService`: S3 integration & file paths
- `DocumentParsingService`: Extract text & metadata (future)
- `DocumentScannerService`: Virus & malware scanning (future)

**DTOs**:
- `UploadDocumentDto`
- `DocumentMetadataDto`

---

### **10. Notifications Module** (`notifications/`)
**Purpose**: Handle in-app and email notifications

**Responsibilities**:
- Create & send notifications (in-app, email, SMS - future)
- Notification templates & rendering
- Notification preferences per user
- Notification history & read status
- Email template management
- Batch notification sending
- Notification scheduling (future)

**Entities**:
- `Notification` (database model)

**Key Services**:
- `NotificationService`: Create & manage notifications
- `EmailService`: Email sending (SendGrid, AWS SES)
- `NotificationTemplateService`: Template management
- `NotificationQueueService`: Batch processing with Bull

**DTOs**:
- `SendNotificationDto`
- `NotificationPreferencesDto`

---

### **11. Audit & Logging Module** (`audit/`)
**Purpose**: Track all user actions for compliance & debugging

**Responsibilities**:
- Log all CRUD operations with before/after values
- Track user actions (who, what, when, where)
- Immutable audit trail
- Audit log retention & archival
- Compliance reporting (GDPR, SOC2)
- Data access logging

**Entities**:
- `ActivityLog` (database model)

**Key Services**:
- `AuditService`: Log activities
- `AuditQueryService`: Query audit trail
- `ComplianceService`: Generate compliance reports

**Interceptors**:
- `AuditInterceptor`: Automatically log all mutations

---

### **12. Analytics Module** (`analytics/`)
**Purpose**: Provide recruitment metrics & insights

**Responsibilities**:
- Recruitment funnel analytics (applications by stage)
- Time-to-hire calculations
- Source effectiveness (which channels bring best hires)
- Recruiter performance (hires per recruiter)
- Job analytics (applications per job, conversion rates)
- Dashboard data aggregation
- Report generation (PDF, CSV exports)
- Historical data tracking

**Key Services**:
- `AnalyticsService`: Core analytics calculations
- `ReportService`: Generate reports
- `DashboardService`: Aggregate metrics for dashboard

**DTOs**:
- `AnalyticsFilterDto`
- `ReportRequestDto`

---

### **13. Webhooks Module** (`webhooks/`)
**Purpose**: Enable event-driven integrations

**Responsibilities**:
- Webhook subscription management
- Event publishing (application created, stage changed, etc.)
- Webhook payload construction
- Delivery tracking & retry logic
- Failed delivery handling & alerts
- Webhook signature validation (HMAC)
- Rate limiting per webhook

**Entities**:
- `WebhookSubscription` (database model)
- `WebhookLog` (database model)

**Key Services**:
- `WebhookService`: Manage subscriptions
- `WebhookPublisherService`: Publish events
- `WebhookDeliveryService`: Handle delivery with retries (Bull)

**Event Types**:
- `application.created`
- `application.stage_changed`
- `candidate.created`
- `candidate.updated`
- `job.published`
- `job.closed`

---

### **14. API Keys Module** (`api-keys/`)
**Purpose**: Enable API authentication for third-party integrations

**Responsibilities**:
- API key generation & rotation
- Key scoping (read, write, delete)
- Key expiration & revocation
- Key usage tracking & rate limiting
- Key rotation reminders
- Last-used timestamp tracking

**Entities**:
- `ApiKey` (database model)

**Key Services**:
- `ApiKeyService`: Key generation & management
- `ApiKeyValidationService`: Validate incoming keys

**DTOs**:
- `CreateApiKeyDto`
- `RotateApiKeyDto`

---

### **15. Search Module** (`search/`)
**Purpose**: Full-text search across candidates, jobs, applications (future enhancement)

**Responsibilities**:
- Index candidates, jobs, applications in Elasticsearch (future)
- Full-text search with filters
- Autocomplete suggestions
- Advanced search filters
- Search analytics

**Note**: Initially use PostgreSQL full-text search; upgrade to Elasticsearch for scale

---

### **16. Health & Monitoring Module** (`health/`)
**Purpose**: System health & API availability

**Responsibilities**:
- Health check endpoints (database, cache, S3)
- Metrics collection (request count, latency, errors)
- System status reporting
- Dependency status checks

---

## Cross-Cutting Concerns

### **Middleware Stack**
1. **TenantMiddleware**: Extract & validate company_id from JWT
2. **LoggingMiddleware**: Structured logging (Winston)
3. **RateLimitMiddleware**: API rate limiting (Redis-backed)
4. **ErrorHandlingMiddleware**: Standardized error responses
5. **CorrelationIdMiddleware**: Trace requests across services

### **Interceptors**
1. **AuditInterceptor**: Automatically log mutations
2. **TransformInterceptor**: Serialize/format responses
3. **CacheInterceptor**: Cache GET endpoints

### **Exception Filters**
1. **TenantNotFoundException**: Tenant not found or invalid
2. **AuthorizationException**: User lacks permissions
3. **ValidationException**: Invalid input data
4. **DatabaseException**: Database errors (wrapped)
5. **ExternalServiceException**: Third-party API failures

---

## Module Dependencies

```
Health                                      (no dependencies)
├── Auth & Multi-Tenancy
│   ├── Companies
│   ├── Users
│   │   ├── Candidates
│   │   ├── Jobs
│   │   │   └── Applications
│   │   │       └── Pipelines
│   │   │           └── Custom Fields
│   │   ├── Documents
│   │   ├── Notifications
│   │   ├── Webhooks
│   │   ├── API Keys
│   │   └── Audit & Logging (cross-cutting)
│   └── Analytics
│       └── Search (future)
```

---

## Communication Patterns

### **Synchronous (REST API)**
- Direct request/response
- Example: GET /api/v1/candidates/{id}

### **Asynchronous (Event Bus / Message Queue)**
- Bull Queue for background jobs
- Event emitters for inter-module communication
- Example: Application created → trigger notification email

### **Publish-Subscribe (Webhooks)**
- External systems subscribe to events
- System publishes events to webhooks
- Example: POST to external webhook when application moves to stage

---

## Error Handling Strategy

All modules should throw custom exceptions:
```
- NotFoundException: Resource not found (404)
- BadRequestException: Invalid input (400)
- UnauthorizedException: Missing authentication (401)
- ForbiddenException: Lacks permission (403)
- ConflictException: Resource conflict (409)
- InternalServerErrorException: Server error (500)
```

---

## Testing Strategy per Module

1. **Unit Tests**: Service logic, no database
2. **Integration Tests**: Service + database interactions
3. **E2E Tests**: Full API flows (authentication to response)
4. **Tenant Isolation Tests**: Verify company_id filtering


---

## Advanced Feature Modules (New)

### **11. Custom Fields Module** ('custom-fields/')
**Purpose**: Enable companies to define and manage custom metadata fields on core entities

**Responsibilities**:
- Custom field definition (CRUD)
- Field type validation (13+ types)
- Field value storage & retrieval
- Bulk field operations
- Field searching & filtering
- Custom field groups & organization
- Field access control

**Key Services**:
- 'CustomFieldsService': CRUD for field definitions, value operations
- 'CustomFieldValidationService': Type-specific validation (text, number, date, select, etc.)
- 'CustomFieldValuesService': Get entity values with custom fields
- 'CustomFieldSearchService': Search entities by custom field values

**DTOs**:
- 'CreateCustomFieldDto': name, slug, entity_type, field_type, validation_rules, options
- 'SetFieldValueDto': entity_type, entity_id, custom_field_id, value
- 'CustomFieldValueDto': field_id, field_name, field_type, value
- 'GetEntityWithFieldsDto': entity with all custom field values populated

**Guards**:
- 'CustomFieldAccessGuard': Verify company owns field definition

**Key Validations**:
- Field slug unique per company + entity_type
- Value types match field_type definition
- Required fields enforced
- Pattern/length constraints (if defined)
- Unique constraint enforcement (if enabled)

---

### **12. License & Billing Module** ('licensing/')
**Purpose**: Manage feature licensing, usage limits, and monetization

**Responsibilities**:
- License tier management (BASIC, PREMIUM, ENTERPRISE)
- License activation & expiration
- Feature flag control with percentage rollout
- Usage tracking per feature
- Custom limits for enterprise tier
- License upgrades & downgrades
- Feature availability enforcement

**Key Services**:
- 'LicenseService': License operations, feature access, usage tracking
- 'FeatureFlagService': Feature availability, targeting, gradual rollout
- 'UsageService': Track & enforce usage limits
- 'BillingService': Subscription management (future)

**Tier Definitions**:
- **BASIC** (/mo): 3 users, 1000 candidates, 5 jobs, 5 custom fields
- **PREMIUM** (/mo): 15 users, unlimited candidates, unlimited jobs, 50 custom fields, API access
- **ENTERPRISE** (custom): Unlimited with custom_limits overrides

**Guards**:
- 'LicenseGuard': Verify license tier active
- 'FeatureGuard': Check feature enabled + license allows
- 'UsageLimitGuard': Verify usage quota available

**Decorators**:
- '@RequireLicense(tier)': Require minimum license tier
- '@RequireFeature(name)': Require feature enabled
- '@LimitUsage(feature, amount)': Enforce usage quota

**Key Methods**:
- 'checkFeatureAccess(companyId, featureName)': Verify access (license + flag + limits)
- 'incrementUsage(companyId, featureName, amount)': Track usage
- 'checkUsageRemaining(companyId, featureName)': Get remaining quota
- 'isFeatureEnabled(companyId, featureName)': Check feature flag status with rollout

---

### **13. RBAC Module** ('rbac/')
**Purpose**: Implement fine-grained role-based access control with permission management

**Responsibilities**:
- Role management (system & custom roles per company)
- Permission definition & assignment
- User role assignment
- Custom permission grants & revokes (temporary overrides)
- Permission validation & enforcement
- Sensitive action tracking
- Role-permission audit trail

**Key Services**:
- 'AuthorizationService': Check user permissions, wildcard matching, caching (1 hour TTL)
- 'RoleService': CRUD for roles, assign/unassign users
- 'PermissionService': Permission definitions & metadata
- 'AuditService': Log RBAC changes

**DTOs**:
- 'RoleDto': id, company_id, name, slug, is_system, is_default, permissions[]
- 'PermissionDto': name, resource, action, level, is_sensitive, requires_mfa
- 'AssignRoleDto': user_id, role_id
- 'GrantPermissionDto': user_id, permission_id, expires_at (optional), reason

**Default Roles** (per company):
- **Admin**: Full access to all features
- **Recruiter**: CRUD candidates/jobs/applications, view reports
- **Hiring Manager**: Read candidates, update applications, view reports
- **Viewer**: Read-only access to candidates/jobs/applications

**Core Permissions** (20+ total):
- candidates:read, candidates:create, candidates:update, candidates:delete
- jobs:read, jobs:create, jobs:publish, jobs:delete
- applications:read, applications:update, applications:move
- users:read, users:create, users:update, users:delete, users:invite
- reports:view, reports:export
- settings:manage, roles:manage, audit:view, api:access, webhooks:manage

**Guards**:
- 'PermissionGuard': Enforce @RequirePermissions() decorator

**Decorators**:
- '@RequirePermissions(...perms)': Check all permissions
- '@RequireAnyPermission(...perms)': Check any permission
- '@TrackSensitiveAction(action)': Log sensitive action

**Key Methods**:
- 'getUserPermissions(userId)': Get combined role + custom grants/revokes
- 'hasPermission(userId, permission)': Check single permission
- 'hasAnyPermission(userId, permissions[])': Check any match
- 'hasAllPermissions(userId, permissions[])': Check all match
- 'grantPermission(userId, permission, expiresAt)': Temporary override
- 'revokePermission(userId, permission)': Remove override

**Permission Levels**:
- 0: Basic (candidate:read)
- 1: Intermediate (candidate:update)
- 2: Admin (candidate:delete, users:manage)

**Wildcard Support**:
- candidates:* matches all candidate actions
- *:* matches everything (super admin)

**Sensitive Action Tracking**:
- Track all Admin-level permissions
- Log IP, user_agent, path, exact action
- Alert on unusual patterns

