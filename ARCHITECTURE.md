   # ATS SaaS - System Architecture

   ## High-Level Overview

   ```
   ┌─────────────────────────────────────────────────────────────────┐
   │                      Frontend Layer (React + TS)                │
   │  (Web App - Desktop/Responsive) | (Shared UI Component Library)│
   └────────────────────────┬────────────────────────────────────────┘
                           │
                           ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                    API Gateway & Security Layer                 │
   │  • Authentication (JWT) | Tenant Validation | Rate Limiting    │
   │  • Request Logging | Error Handling                             │
   └────────────────────────┬────────────────────────────────────────┘
                           │
                           ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │               Backend API (NestJS + TypeScript)                 │
   │  ┌──────────────────────────────────────────────────────────┐   │
   │  │ Core Modules:                                            │   │
   │  │ • Auth & Multi-Tenancy | Companies | Users              │   │
   │  │ • Candidates | Applications | Jobs | Pipelines          │   │
   │  │ • Custom Fields | Document Management | Notifications   │   │
   │  │ • Analytics | Audit Logs | Licensing                    │   │
   │  └──────────────────────────────────────────────────────────┘   │
   └────────────────────────┬────────────────────────────────────────┘
                           │
                           ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │              Data Access & Business Logic Layer                 │
   │  • TypeORM Repositories | Queries | Caching (Redis)            │
   │  • Event Bus | Background Jobs (Bull Queue)                     │
   │  • Tenant Isolation Enforcement                                 │
   └────────────────────────┬────────────────────────────────────────┘
                           │
                           ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                    Database Layer                               │
   │  ┌──────────────────────────────────────────────────────────┐   │
   │  │ PostgreSQL - Single Database (Tenant Data Isolated)     │   │
   │  │ • Multi-tenant using company_id partitioning           │   │
   │  │ • Row-level security policies (FUTURE)                 │   │
   │  │ • Metadata tables for custom fields                     │   │
   │  └──────────────────────────────────────────────────────────┘   │
   │  ┌──────────────────────────────────────────────────────────┐   │
   │  │ Redis - Cache & Session Storage                         │   │
   │  │ • Session tokens | Distributed caching                  │   │
   │  └──────────────────────────────────────────────────────────┘   │
   └─────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────┐
   │                    External Integrations                         │
   │  • Email Service (SendGrid) | File Storage (S3)                │
   │  • Webhooks | Future: Calendar, Email Sync, AI Services        │
   └──────────────────────────────────────────────────────────────────┘
   ```

   ## Multi-Tenancy Strategy

   ### Approach: **Shared Database with Data Isolation**
   - **Single PostgreSQL database** for all tenants
   - **company_id** as primary tenant identifier
   - Data isolation at **application layer** (enforced in every query)
   - **Metadata-driven customization** (no schema changes per tenant)
   - Row-level security policies (PostgreSQL RLS) for future optimization

   ### Security & Isolation
   ```
   Request Flow:
   1. User authenticates → JWT token includes company_id + user_id + role
   2. Every API endpoint validates JWT + extracts company_id
   3. All database queries automatically filtered by company_id
   4. Middleware enforces tenant boundaries (no cross-tenant data access)
   5. Audit logs track all data access with tenant + user context
   ```

   ## Licensing & Feature Control

   ### License Tiers
   - **Basic**: Core recruitment features (limited custom fields, pipelines)
   - **Premium**: Advanced analytics, unlimited custom fields, API access
   - **Enterprise**: White-label, SSO, dedicated support

   ### Feature Flags Implementation
   ```
   - Stored in: companies.license_tier + feature_flags (JSONB)
   - Checked at: Route guards + service layer
   - Example: Premium feature requires license check in guard
   ```

   ## API Design Principles

   1. **RESTful with consistency**: `/api/v1/{resource}/{id}/{action}`
   2. **Tenant-aware**: company_id always implicit (from JWT), never in URL
   3. **Pagination & Filtering**: Standard query params (limit, offset, sort, filters)
   4. **Soft deletes**: deleted_at timestamp for audit trail
   5. **Timestamps**: created_at, updated_at on all entities
   6. **Error handling**: Standardized error responses with tenant context

   ## Data Flow Examples

   ### Example 1: Create Job Posting
   ```
   User (Company A) → POST /api/v1/jobs
   ↓
   Auth Middleware: Validate JWT, extract company_id = "comp_123"
   ↓
   Jobs Controller: Validate user has CREATE_JOB permission in comp_123
   ↓
   Jobs Service: Create job with company_id = "comp_123"
   ↓
   Database: INSERT job WHERE company_id = 'comp_123'
   ↓
   Response: Job created with all custom fields from company's metadata
   ```

   ### Example 2: View Applications
   ```
   User (Company B) → GET /api/v1/jobs/{jobId}/applications
   ↓
   Auth Middleware: Extract company_id = "comp_456"
   ↓
   Applications Repository: Query applications WHERE job_id = {jobId} AND company_id = 'comp_456'
   ↓
   Only Company B's applications returned (Company A cannot access)
   ↓
   Custom fields rendered based on Company B's field configuration
   ```

   ## Caching Strategy

   - **Company settings** (fields, stages, users): Redis with 1-hour TTL
   - **User permissions**: Redis with session TTL
   - **Candidate list**: Invalidated on update, cached for 5 minutes
   - **Cache key format**: `tenant:{company_id}:entity:{id}`

   ## Background Jobs

   - **Document processing**: Extract text from resumes
   - **Notification delivery**: Email, in-app notifications
   - **Audit log archival**: Move old logs to cold storage
   - **Webhook notifications**: Async event delivery
   - **Report generation**: Scheduled exports

   ## Monitoring & Observability

   - **Structured logging**: Winston (JSON format with company_id, user_id)
   - **Error tracking**: Sentry (with tenant context)
   - **Performance monitoring**: APM (DataDog/New Relic)
   - **Audit logs**: Immutable record of all tenant actions
   - **Database monitoring**: Query performance, connection pooling

   ## Scalability Considerations

   - **Database**: Connection pooling (PgBouncer), query optimization, indexing
   - **API**: Horizontal scaling with load balancer
   - **Storage**: S3 for documents (multi-tenant buckets with prefixes)
   - **Cache**: Redis cluster for distributed caching
   - **Jobs**: Bull queue with multiple workers
   - **Future**: Database sharding by company_id if needed at scale

   ## Security Layers

   1. **Transport**: HTTPS/TLS only
   2. **Authentication**: JWT with expiry + refresh tokens
   3. **Authorization**: RBAC (admin, recruiter, viewer roles)
   4. **Data**: Tenant isolation, encryption at rest (PII fields)
   5. **Audit**: Immutable logs of all actions
   6. **Rate limiting**: Per-user/tenant API rate limits
   7. **Input validation**: Schema validation + sanitization
   8. **SQL injection prevention**: Parameterized queries (TypeORM)

   ## Deployment Architecture

   ```
   Production:
   - Docker containers (API, Worker nodes)
   - Kubernetes orchestration (or Docker Compose initially)
   - CI/CD: GitHub Actions → Docker Registry → K8s
   - Database: Managed PostgreSQL (AWS RDS / Azure Database)
   - Redis: Managed Redis (AWS ElastiCache / Azure Cache)
   - Storage: S3-compatible (AWS S3 or MinIO)
   - CDN: CloudFront for static assets
   - Monitoring: Datadog / CloudWatch
   ```

   ## Version Control & API Versioning

   - **API versions**: /api/v1/, /api/v2/ (breaking changes only)
   - **Database migrations**: Flyway/TypeORM migrations (immutable)
   - **Backwards compatibility**: Support at least 2 API versions


   ---

   ## Advanced Architecture Sections (New)

   ### Multi-Tenant Enforcement Architecture

   **Objective**: Ensure zero cross-tenant data leakage at every layer

   **Enforcement Stack** (Request → Response):

   1. **API Gateway Layer**
      - All requests require valid JWT token (TenantContextMiddleware)
      - Token validated against JWT_SECRET
      - tenant context extracted: { companyId, userId, role, permissions, ip, userAgent }
      - Request decorated with req.tenant object

   2. **Guard Layer** (NestJS Guards)
      - JwtAuthGuard: Validates JWT signature + expiration
      - TenantGuard: Verifies user.companyId matches requested resource.companyId
      - PermissionGuard: Checks user has required permission for action
      - Throws ForbiddenException if fails

   3. **Service Layer**
      - Every service receives companyId from authenticated request
      - companyId NEVER comes from request body (only from JWT)
      - Services validate all entity relationships include same companyId
      - Example: getCandidates(companyId) always filters by company_id

   4. **Repository Layer** (Data Access)
      - Every query includes WHERE company_id = \ filter
      - Bulk operations validate ALL items belong to same company_id
      - Cross-tenant relationship prevention enforced
      - Example: Update [candidates] only if company_id matches JWT

   5. **Audit Trail**
      - Every operation logged: { action, entity_type, company_id, user_id, ip, user_agent, timestamp }
      - Allows forensic investigation if breach suspected

   **Data Isolation Guarantees**:
   - Company A cannot query Company B's candidates (query-level isolation)
   - Company A cannot modify Company B's jobs (permission checks)
   - Company A cannot access Company B's custom fields (ownership validation)
   - Company A cannot escalate permissions within Company B (role isolation)

   **Testing Strategy**:
   - Multi-tenant isolation test: Verify Company A cannot access Company B data
   - Bulk operation test: Verify cross-company bulk update rejected
   - Cross-tenant relationship test: Verify cannot link Company A candidate to Company B job
   - Permission isolation test: Verify Company A user cannot access Company B RBAC roles

   ---

   ### Custom Fields Architecture

   **Concept**: Type-agnostic metadata storage enabling schema-free customization

   **Data Model**:
   \\\
   custom_fields (definitions)
      ├── id, company_id, entity_type (candidate|job|user)
      ├── name, slug, field_type (text|number|date|select|...)
      ├── validation_rules (JSONB: minLength, pattern, min/max, etc)
      └── options (JSONB: for select/multiselect field choices)

   custom_field_values (storage)
      ├── entity_type, entity_id (links to candidate.id, etc)
      ├── value_text, value_number, value_date, value_json
      └── One row per entity per field
   \\\

   **Type System** (13 field types):
   - **String types**: text (VARCHAR), textarea (TEXT), rich_text (HTML)
   - **Numeric types**: number (DECIMAL), rating (1-5)
   - **Date types**: date (DATE), datetime (TIMESTAMP)
   - **Boolean type**: boolean (BOOLEAN)
   - **URL/Contact types**: url (validation), email (validation), phone (validation)
   - **Choice types**: select (single), multiselect (array)

   **Validation Flow**:
   \\\
   1. CustomFieldsService.setFieldValue(entityId, fieldId, value)
   2. Load custom_field definition: { field_type, validation_rules }
   3. CustomFieldValidationService.validateValue(value, field_type, validation_rules)
      - Type check: Is value correct type?
      - Constraint check: minLength, pattern, min/max values?
      - Required check: Is field required?
      - Unique check: Is value unique (if is_unique=true)?
      - Options check: Is value in allowed options (for select)?
   4. If valid: Save to custom_field_values table
   5. If invalid: Throw BadRequestException with specific error
   \\\

   **API Integration**:
   - GET /candidates/{id} returns candidate + custom_field_values[] in response
   - POST /candidates/{id}/custom-fields/{fieldId}/values sets value
   - GET /candidates?customField[fieldId]=value searches by custom field
   - Bulk operations: POST /candidates/bulk/custom-fields/{fieldId}/values

   **Performance Considerations**:
   - JSONB columns indexed for fast filtering
   - custom_field_values indexed on (company_id, entity_type, entity_id)
   - Validation happens before save (fail fast)
   - Custom field definitions cached (1 hour TTL) per company

   ---

   ### License Enforcement Flow

   **Decision Tree** (Feature Availability):

   \\\
   User requests feature (e.g., export candidates)
      │
      ├─ 1. Is license ACTIVE & not EXPIRED?
      │      NO  → ForbiddenException (License suspended)
      │      YES → Continue
      │
      ├─ 2. Does license TIER include feature?
      │      NO  → ForbiddenException (Feature not in tier)
      │      YES → Continue
      │
      ├─ 3. Is feature FLAG enabled?
      │      NO  → ForbiddenException (Feature not available yet)
      │      YES (check percentage rollout)
      │
      ├─ 4. Calculate: hash(company_id) % 100
      │      If hash < enabled_percentage: Allowed
      │      Else: ForbiddenException (Gradual rollout)
      │
      ├─ 5. Check usage LIMIT (if enforced)
      │      If usage >= limit: ForbiddenException (Quota exceeded)
      │      Else: Continue
      │
      └─ 6. ALLOW & INCREMENT usage counter
   \\\

   **Gradual Rollout Logic** (Example):
   \\\
   feature_flag: { name: 'bulk_export', enabled_percentage: 10 }
   company_ids: [A, B, C, D, E, F, G, H, I, J]

   For each company:
   hash = CRC32(company_id) % 100
   allowed = hash < 10  // Only 10% of companies get feature

   Deterministic: Same company always gets same result
   Balanced: ~10% of customers in pilot
   \\\

   **Guards & Decorators**:
   \\\	ypescript
   @LicenseGuard
   @Get('/export')
   async exportCandidates(@Req() req: Request) {
   // Guard already checked: license active + tier allows export
   // Now check usage limit
   const allowed = await this.licenseService.checkFeatureUsage(
      req.tenant.companyId, 
      'bulk_export', 
      1  // Amount: 1 export operation
   );
   if (!allowed.allowed) throw new QuotaExceededException();
   
   // Perform export...
   await this.licenseService.incrementUsage(req.tenant.companyId, 'bulk_export', 1);
   }
   \\\

   **License Enforcement Points**:
   - Feature access: @RequireFeature('feature_name') decorator
   - Tier check: @RequireLicense('premium') decorator
   - Usage limit: @LimitUsage('feature_name', amount) decorator
   - Custom limits: ENTERPRISE tier can override limits in custom_limits JSONB

   **Usage Tracking**:
   - license_features table tracks current_usage per feature per license
   - Reset dates handle monthly/annual resets
   - Incremental updates ensure accurate quotas

