# ATS SaaS - Database Schema

## Core Principles
- Every table has `company_id` for tenant isolation
- Soft deletes with `deleted_at` timestamp
- All relationships use surrogate keys (UUIDs)
- Timestamps: `created_at`, `updated_at` on all entities
- Metadata-driven custom fields (no schema changes per tenant)

## Tables

### 1. **companies** (Tenant Data)
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Branding
  logo_url TEXT,
  brand_color VARCHAR(7),
  
  -- License & Features
  license_tier VARCHAR(50) NOT NULL DEFAULT 'basic', -- basic, premium, enterprise
  feature_flags JSONB DEFAULT '{}', -- {feature_name: boolean}
  
  -- Settings
  settings JSONB DEFAULT '{}', -- company-wide settings (timezone, date format, etc)
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

INDEX: (slug), (is_active), (license_tier)
```

### 2. **users** (Tenant Users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- Auth
  password_hash VARCHAR(255) NOT NULL,
  auth_provider VARCHAR(50) DEFAULT 'email', -- email, google, azure, okta
  auth_provider_id VARCHAR(255), -- external provider ID for SSO
  
  -- Profile
  avatar_url TEXT,
  job_title VARCHAR(100),
  department VARCHAR(100),
  
  -- Access Control
  role VARCHAR(50) NOT NULL DEFAULT 'recruiter', -- admin, recruiter, hiring_manager, viewer
  permissions JSONB DEFAULT '{}', -- custom permissions (if granular RBAC needed)
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  
  -- Settings
  preferences JSONB DEFAULT '{}', -- user-specific settings (theme, notifications, etc)
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE (company_id, email),
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

INDEXES: (company_id, is_active), (company_id, role), (email)
```

### 3. **jobs** (Job Postings)
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  
  -- Job Details
  job_code VARCHAR(100),
  department VARCHAR(100),
  location VARCHAR(255),
  salary_min DECIMAL(12, 2),
  salary_max DECIMAL(12, 2),
  salary_currency VARCHAR(3) DEFAULT 'USD',
  employment_type VARCHAR(50), -- full_time, part_time, contract, etc
  
  -- Status & Pipeline
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, closed, paused, draft
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
  
  -- Hiring Team
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  hiring_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata & Custom Fields
  custom_fields JSONB DEFAULT '{}', -- {field_id: value}
  metadata JSONB DEFAULT '{}',
  
  -- Dates
  published_at TIMESTAMP,
  closed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

INDEXES: (company_id, status), (company_id, pipeline_id), (pipeline_id)
```

### 4. **candidates** (Candidate Database)
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  location VARCHAR(255),
  
  -- Profile
  current_company VARCHAR(255),
  current_job_title VARCHAR(255),
  experience_years INT,
  summary TEXT,
  linkedin_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  
  -- Sourcing
  source VARCHAR(100), -- job_board, linkedin, referral, inbound, etc
  sourced_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Status & Tags
  status VARCHAR(50) DEFAULT 'prospect', -- prospect, active, rejected, hired, archived
  tags TEXT[] DEFAULT '{}',
  
  -- Ratings & Metadata
  overall_rating DECIMAL(3, 2), -- 1.0 - 5.0
  notes TEXT,
  custom_fields JSONB DEFAULT '{}', -- {field_id: value}
  
  -- Deduplication
  is_duplicate_of UUID REFERENCES candidates(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE (company_id, email)
);

INDEXES: (company_id, email), (company_id, status), (company_id, created_at)
```

### 5. **applications** (Application Tracker)
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  
  -- Application Status (Pipeline Stage)
  current_stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  
  -- Application Metadata
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
  source VARCHAR(100), -- direct, referral, job_board, etc
  
  -- Rating & Feedback
  rating DECIMAL(3, 2), -- 1.0 - 5.0
  
  -- Interview Tracking
  next_interview_at TIMESTAMP,
  interview_notes TEXT,
  
  -- Evaluation
  evaluations JSONB DEFAULT '{}', -- {user_id: {score, feedback, date}}
  custom_fields JSONB DEFAULT '{}', -- {field_id: value}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  rejection_reason VARCHAR(255),
  rejected_at TIMESTAMP,
  hired_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE (job_id, candidate_id)
);

INDEXES: (company_id, job_id), (company_id, candidate_id), (current_stage_id), (company_id, applied_at)
```

### 6. **pipelines** (Customizable Pipelines per Company)
```sql
CREATE TABLE pipelines (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Configuration
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Workflow
  enable_auto_advance BOOLEAN DEFAULT false,
  auto_advance_days INT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE (company_id, name)
);

INDEXES: (company_id, is_default), (company_id, is_active)
```

### 7. **pipeline_stages** (Stages in Pipeline)
```sql
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Display & Order
  order_index INT NOT NULL,
  color_hex VARCHAR(7),
  
  -- Workflow
  is_terminal BOOLEAN DEFAULT false, -- true for rejected/hired stages
  require_action BOOLEAN DEFAULT false,
  action_template JSONB, -- {action_type: 'email', template_id: '...'}
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (pipeline_id, name),
  UNIQUE (pipeline_id, order_index)
);

INDEXES: (pipeline_id, order_index)
```

### 8. **custom_fields** (Metadata-Driven Custom Fields)
```sql
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Field Definition
  entity_type VARCHAR(50) NOT NULL, -- candidate, application, job, etc
  field_name VARCHAR(255) NOT NULL,
  field_slug VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL, -- text, number, select, multiselect, date, checkbox, etc
  
  -- Configuration
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value TEXT,
  
  -- Validation & Options
  validation_rules JSONB DEFAULT '{}', -- {min, max, pattern, etc}
  options JSONB DEFAULT '[]', -- for select fields: [{label, value}, ...]
  
  -- Display
  order_index INT,
  is_visible BOOLEAN DEFAULT true,
  help_text TEXT,
  
  -- Access Control
  visible_to_roles VARCHAR(50)[] DEFAULT '{"admin","recruiter"}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE (company_id, entity_type, field_slug)
);

INDEXES: (company_id, entity_type, is_active)
```

### 9. **documents** (Resume & File Management)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Ownership
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- File Info
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50), -- pdf, doc, docx, etc
  file_size INT,
  mime_type VARCHAR(50),
  
  -- Storage
  s3_key VARCHAR(500) NOT NULL, -- s3 path: tenants/{company_id}/documents/{id}/{filename}
  
  -- Document Type
  document_type VARCHAR(50) DEFAULT 'resume', -- resume, cover_letter, portfolio, etc
  
  -- Extracted Content (for search & parsing)
  extracted_text TEXT,
  extracted_metadata JSONB DEFAULT '{}', -- {skills, experience, education, etc}
  
  -- Processing Status
  processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

INDEXES: (company_id, candidate_id), (company_id, document_type)
```

### 10. **activity_log** (Audit Trail)
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Actor
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action
  entity_type VARCHAR(50) NOT NULL, -- candidate, application, job, etc
  entity_id UUID NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- created, updated, deleted, moved, etc
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  changes JSONB, -- {field: {old, new}}
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX: (company_id, created_at DESC), (entity_type, entity_id)
);
```

### 11. **notifications** (In-App & Email Notifications)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Type & Context
  notification_type VARCHAR(50) NOT NULL, -- application_received, stage_changed, etc
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  -- Delivery
  delivery_channels VARCHAR(50)[] DEFAULT '{"in_app"}', -- in_app, email, sms
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

INDEXES: (company_id, user_id, is_read), (user_id, created_at DESC)
```

### 12. **api_keys** (For API Access)
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_preview VARCHAR(20) NOT NULL, -- first 20 chars for display
  
  -- Access Control
  name VARCHAR(255) NOT NULL,
  scopes VARCHAR(100)[] DEFAULT '{"read","write"}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  
  -- Security
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

INDEXES: (company_id, is_active), (key_hash)
```

### 13. **webhook_subscriptions** (For Event-Driven Integration)
```sql
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  event_type VARCHAR(100) NOT NULL, -- application.created, candidate.updated, etc
  webhook_url VARCHAR(500) NOT NULL,
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff_seconds": 60}',
  headers JSONB DEFAULT '{}', -- custom headers to send
  
  -- Metadata
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

INDEXES: (company_id, event_type), (company_id, is_active)
```

### 14. **webhook_logs** (For Webhook Delivery Tracking)
```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  
  -- Event
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  
  -- Delivery Status
  status_code INT,
  is_successful BOOLEAN,
  error_message TEXT,
  
  -- Retry Information
  attempt_number INT DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW()
);

INDEXES: (company_id, subscription_id, created_at DESC)
```

## Key Design Decisions

### 1. **Tenant Isolation**
- `company_id` is the partition key for all multi-tenant tables
- Every query filters by `company_id` (enforced in application layer)
- Foreign keys don't cross company boundaries

### 2. **Soft Deletes**
- `deleted_at` field maintains data for audit trails
- Queries automatically exclude soft-deleted records (via views or application logic)
- Enable GDPR compliance with scheduled purges

### 3. **JSONB for Flexibility**
- `custom_fields`: Store arbitrary data per entity
- `metadata`: Company-specific settings
- `feature_flags`: License-based feature control
- `validation_rules`: Dynamic field validation
- Enables metadata-driven customization without schema changes

### 4. **Timestamps on Everything**
- `created_at`, `updated_at`, `deleted_at` for audit trail
- Enables time-based queries, reports, and compliance

### 5. **No Cascading Deletes for Integrity**
- Most relations use `ON DELETE RESTRICT` to prevent accidental data loss
- Exception: `companies` → other tables use `CASCADE` (full cleanup on company deletion)

### 6. **Efficient Indexing**
- Composite indexes for common queries (company_id + status)
- DESC indexes for time-series queries (created_at DESC)
- Avoids N+1 queries and slow scans

## Performance Considerations

### Query Optimization
```sql
-- Always filter by company_id first
SELECT * FROM applications 
WHERE company_id = $1 AND job_id = $2 AND current_stage_id = $3;

-- Use pagination to avoid large result sets
SELECT * FROM candidates 
WHERE company_id = $1 
ORDER BY created_at DESC 
LIMIT 50 OFFSET 0;

-- Use JSONB operators for custom field searches
SELECT * FROM applications 
WHERE company_id = $1 AND custom_fields->>'skill_level' = 'senior';
```

### Connection Pooling
- Use PgBouncer or pgpool for connection pooling
- Backend connection limit: min 5, max 20 per environment

### Caching
- Cache custom field definitions (company_id:{company_id}:custom_fields)
- Cache user permissions (user_id:{user_id}:permissions)
- TTL: 1 hour for settings, session TTL for permissions


---

## Extended Tables (Advanced Features)

### 15. **custom_fields** (Custom Field Definitions)
\\\sql
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}',
  display_order INT DEFAULT 0,
  options JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_searchable BOOLEAN DEFAULT true,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE (company_id, slug, entity_type),
  INDEX: (company_id, entity_type, is_active)
);
\\\

### 16. **custom_field_values** (Custom Field Values)
\\\sql
CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  value_text VARCHAR(MAX),
  value_number DECIMAL(18, 4),
  value_date DATE,
  value_datetime TIMESTAMP,
  value_boolean BOOLEAN,
  value_json JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (company_id, custom_field_id, entity_type, entity_id),
  INDEX: (company_id, entity_type, entity_id)
);
\\\

### 17. **licenses** (Subscription Management)
\\\sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL DEFAULT 'basic',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  billing_cycle VARCHAR(50),
  auto_renew BOOLEAN DEFAULT true,
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  custom_limits JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  INDEX: (tier, status, expires_at)
);
\\\

### 18. **license_features** (Feature Usage Tracking)
\\\sql
CREATE TABLE license_features (
  id UUID PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  usage_limit INT,
  current_usage INT DEFAULT 0,
  reset_date TIMESTAMP,
  custom_config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (license_id, feature_name),
  INDEX: (license_id)
);
\\\

### 19. **feature_flags** (Feature Flag Control)
\\\sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  flag_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  is_enabled_globally BOOLEAN DEFAULT false,
  enabled_percentage INT,
  target_tiers VARCHAR[] DEFAULT '{}',
  excluded_companies UUID[] DEFAULT '{}',
  included_companies UUID[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  scheduled_at TIMESTAMP,
  scheduled_end_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  INDEX: (status, is_enabled_globally)
);
\\\

### 20. **feature_flag_usage** (Feature Flag Analytics)
\\\sql
CREATE TABLE feature_flag_usage (
  id UUID PRIMARY KEY,
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  enabled_at TIMESTAMP,
  last_accessed_at TIMESTAMP,
  access_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (feature_flag_id, company_id),
  INDEX: (company_id, feature_flag_id)
);
\\\

### 21. **roles** (RBAC Roles)
\\\sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE (company_id, slug),
  INDEX: (company_id, is_default)
);
\\\

### 22. **permissions** (RBAC Permissions)
\\\sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  level INT DEFAULT 0,
  is_sensitive BOOLEAN DEFAULT false,
  requires_mfa BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX: (resource, action),
  INDEX: (is_sensitive)
);
\\\

### 23. **role_permissions** (Role-Permission Mapping)
\\\sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (role_id, permission_id)
);
\\\

### 24. **user_permissions** (Custom Permission Overrides)
\\\sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  grant_type VARCHAR(50) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,
  UNIQUE (company_id, user_id, permission_id),
  INDEX: (company_id, user_id, expires_at)
);
\\\

### 25. **audit_logs** (Comprehensive Audit Trail)
\\\sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  request_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX: (company_id, entity_type, created_at),
  INDEX: (company_id, user_id, created_at)
);
\\\

**Total Tables**: 25 (14 original + 11 extended)
