# Database Migrations Guide

## Overview

This document describes all 23 TypeORM migrations implementing the complete ATS SaaS database schema with full multi-tenant support, constraints, indexes, and referential integrity.

**Total Tables**: 25 (14 core + 11 advanced features)
**Total Migrations**: 23 (separate files for dependency order)

---

## Migration Files & Execution Order

### Core Tables (1-13)

| Order | Migration File | Table | Purpose | company_id |
|-------|---|---|---|---|
| 1 | 1704067200000-CreateCompaniesTable.ts | `companies` | Tenant data | None (root) |
| 2 | 1704067201000-CreateUsersTable.ts | `users` | Tenant users | ✓ FK |
| 3 | 1704067202000-CreatePipelinesTable.ts | `pipelines` | Job pipelines | ✓ FK |
| 4 | 1704067203000-CreatePipelineStagesTable.ts | `pipeline_stages` | Pipeline stages | ✓ FK |
| 5 | 1704067204000-CreateJobsTable.ts | `jobs` | Job postings | ✓ FK |
| 6 | 1704067205000-CreateCandidatesTable.ts | `candidates` | Candidate database | ✓ FK |
| 7 | 1704067206000-CreateApplicationsTable.ts | `applications` | Application tracker | ✓ FK |
| 8 | 1704067207000-CreateCustomFieldsTable.ts | `custom_fields` | Field definitions | ✓ FK |
| 9 | 1704067208000-CreateCustomFieldValuesTable.ts | `custom_field_values` | Field values | ✓ FK |
| 10 | 1704067209000-CreateDocumentsTable.ts | `documents` | Resumes & files | ✓ FK |
| 11 | 1704067210000-CreateActivityLogTable.ts | `activity_log` | Audit trail | ✓ FK |
| 12 | 1704067211000-CreateNotificationsTable.ts | `notifications` | Notifications | ✓ FK |
| 13 | 1704067212000-CreateApiKeysTable.ts | `api_keys` | API access | ✓ FK |

### Integration Tables (14-15)

| Order | Migration File | Table | Purpose | company_id |
|-------|---|---|---|---|
| 14 | 1704067213000-CreateWebhookSubscriptionsTable.ts | `webhook_subscriptions` | Webhook setup | ✓ FK |
| 15 | 1704067214000-CreateWebhookLogsTable.ts | `webhook_logs` | Webhook delivery | ✓ FK |

### Advanced Feature Tables (16-23)

| Order | Migration File | Table | Purpose | company_id |
|-------|---|---|---|---|
| 16 | 1704067215000-CreateLicensesTable.ts | `licenses` | Subscription | ✓ FK |
| 17 | 1704067216000-CreateLicenseFeaturesTable.ts | `license_features` | Usage tracking | ✗ (via license) |
| 18 | 1704067217000-CreateFeatureFlagsTable.ts | `feature_flags` | Feature control | ✗ (global) |
| 19 | 1704067218000-CreateFeatureFlagUsageTable.ts | `feature_flag_usage` | Adoption tracking | ✓ FK |
| 20 | 1704067219000-CreateRolesTable.ts | `roles` | RBAC roles | ✓ FK |
| 21 | 1704067220000-CreatePermissionsTable.ts | `permissions` | RBAC permissions | ✗ (global) |
| 22 | 1704067221000-CreateRolePermissionsTable.ts | `role_permissions` | Role mappings | ✗ (via role) |
| 23 | 1704067222000-CreateUserPermissionsTable.ts | `user_permissions` | Permission overrides | ✓ FK |
| 24 | 1704067223000-CreateAuditLogsTable.ts | `audit_logs` | Comprehensive audit | ✓ FK |

---

## Key Design Principles

### Multi-Tenant Enforcement

Every table with `company_id` is tenant-aware:
- **Foreign Keys**: `company_id REFERENCES companies(id) ON DELETE CASCADE`
- **Enforcement**: Application layer filters by `company_id` on all queries
- **Isolation**: No cross-tenant data access possible (even accidental)

**Tenant-Aware Tables** (20 tables with company_id):
- users, pipelines, pipeline_stages, jobs, candidates, applications
- custom_fields, custom_field_values, documents, activity_log, notifications
- api_keys, webhook_subscriptions, webhook_logs
- licenses, feature_flag_usage, roles, user_permissions, audit_logs

**Global Tables** (2 tables without company_id):
- permissions (global atomic actions across all tenants)
- feature_flags (global feature control with per-company targeting)

### Constraints & Referential Integrity

**Foreign Keys**:
- `ON DELETE CASCADE`: Deleting company deletes all related data (intentional)
- `ON DELETE RESTRICT`: Prevents accidental deletion of critical data (pipelines in jobs)
- `ON DELETE SET NULL`: Allows deletion of optional references (user fields)

**Unique Constraints**:
- `(company_id, email)` on users → Prevent duplicate emails per company
- `(company_id, slug, entity_type)` on custom_fields → Prevent duplicate field slugs
- `(job_id, candidate_id)` on applications → One application per job per candidate
- `(company_id, slug)` on roles → Prevent duplicate role slugs per company
- `(feature_flag_id, company_id)` on feature_flag_usage → One usage record per company per flag

**Check Constraints**:
- Email validation pattern on users table (regex validation)

### Indexes for Performance

**Composite Indexes** (filter by company_id first):
- `(company_id, status)` on candidates, jobs, applications
- `(company_id, entity_type, entity_id)` on custom_field_values
- `(company_id, user_id, is_read)` on notifications
- `(company_id, is_active)` on pipelines, api_keys
- `(company_id, expires_at)` on user_permissions

**Non-Composite Indexes** (on global tables):
- `(resource, action)` on permissions
- `(is_sensitive)` on permissions
- `(status, is_enabled_globally)` on feature_flags

**Covering Indexes** (for ordering):
- `(company_id, created_at DESC)` on activity_log, audit_logs

---

## Running Migrations

### Development

```bash
# Run all pending migrations
npm run typeorm migration:run

# Generate migration from entities
npm run typeorm migration:generate -- -n MigrationName

# Revert last migration
npm run typeorm migration:revert
```

### Production

```bash
# Dry-run before applying
npm run typeorm migration:show

# Apply migrations with logging
npm run typeorm migration:run -- --transaction all

# Rollback specific migration
npm run typeorm migration:revert
```

### TypeORM Configuration

```typescript
// ormconfig.json
{
  "type": "postgres",
  "host": "localhost",
  "port": 5432,
  "username": "ats_user",
  "password": "secure_password",
  "database": "ats_saaS",
  "migrations": ["src/database/migrations/*.ts"],
  "migrationsTableName": "migrations",
  "logging": true,
  "synchronize": false
}
```

---

## Table Dependency Graph

```
companies (root)
  ├── users
  ├── pipelines
  │   └── pipeline_stages
  │       └── applications
  ├── jobs (depends on pipelines, users)
  ├── candidates
  │   └── applications, documents
  ├── custom_fields
  │   └── custom_field_values
  ├── activity_log
  ├── notifications (depends on users)
  ├── api_keys (depends on users)
  ├── webhook_subscriptions (depends on users)
  │   └── webhook_logs
  ├── licenses (unique company_id)
  │   └── license_features
  ├── feature_flag_usage
  ├── roles (company-scoped)
  │   └── role_permissions (depends on permissions)
  ├── permissions (global)
  └── user_permissions (depends on permissions)
  └── audit_logs
```

---

## Column Naming Conventions

All migrations follow consistent naming:
- `id`: UUID primary key with `gen_random_uuid()`
- `company_id`: Foreign key to companies.id (except global tables)
- `*_at`: Timestamp fields (created_at, updated_at, deleted_at)
- `is_*`: Boolean flags
- `*_by_id`: Foreign key to users.id (creator/actor)
- `*_id`: Foreign keys to other entities

---

## Soft Delete Implementation

All tables include `deleted_at` timestamp (except migrations table):
```sql
WHERE deleted_at IS NULL  -- Application-layer filtering
```

This enables:
- **Audit trails**: Forensic investigation of deleted data
- **GDPR compliance**: Scheduled purges after retention period
- **Recovery**: Restore accidentally deleted data

---

## Indexing Strategy

### Problem Solved
- **N+1 queries**: Composite indexes on (company_id, foreign_key)
- **Slow filters**: Indexes on status, is_active, is_read
- **Time-series queries**: DESC indexes on created_at
- **Sorting performance**: Indexes on (company_id, created_at DESC)

### Not Indexed
- Foreign key columns individually (created by migration)
- Low-cardinality columns (is_system, is_default)
- Frequently changing columns (current_usage)

---

## Constraints Enforced

| Type | Table | Constraint | Impact |
|------|-------|-----------|--------|
| UNIQUE | companies | slug | One slug per system |
| UNIQUE | users | (company_id, email) | One email per company |
| UNIQUE | pipelines | (company_id, name) | One name per company |
| UNIQUE | pipeline_stages | (pipeline_id, name) | One name per pipeline |
| UNIQUE | pipeline_stages | (pipeline_id, order_index) | No duplicate order per pipeline |
| UNIQUE | custom_fields | (company_id, slug, entity_type) | Unique field slug per entity type |
| UNIQUE | custom_field_values | (company_id, custom_field_id, entity_type, entity_id) | One value per entity per field |
| UNIQUE | applications | (job_id, candidate_id) | One application per candidate per job |
| UNIQUE | role_permissions | (role_id, permission_id) | No duplicate role assignments |
| UNIQUE | user_permissions | (company_id, user_id, permission_id) | No duplicate overrides |
| UNIQUE | feature_flag_usage | (feature_flag_id, company_id) | One usage record per company per flag |
| UNIQUE | api_keys | key_hash | Unique API key hash |
| UNIQUE | licenses | company_id | One license per company |
| UNIQUE | license_features | (license_id, feature_name) | One feature per license |
| UNIQUE | feature_flags | name | One feature flag by name |
| UNIQUE | permissions | name | One permission by name |
| UNIQUE | roles | (company_id, slug) | One slug per company |

---

## Foreign Key Relationships

### CASCADE Deletes (Full Cleanup)
- companies → all child tables (company deletion removes all data)

### RESTRICT Deletes (Prevent Accidents)
- pipelines in jobs (prevent pipeline deletion while jobs exist)
- pipeline_stages in applications (prevent stage deletion while in use)

### SET NULL Deletes (Soft Reference)
- users (created_by_id, hiring_manager_id, sourced_by_id)
- documents (uploaded_by_id)
- custom_fields (created_by_id)
- webhook_subscriptions (created_by_id)
- feature_flags (created_by_id)
- user_permissions (created_by_id)
- audit_logs (user_id)

---

## Data Types Used

| Type | Columns | Reason |
|------|---------|--------|
| UUID | id, *_id | Distributed, non-sequential IDs |
| VARCHAR(n) | name, email, slug | Fixed-length text |
| TEXT | description, notes, extracted_text | Unbounded text |
| JSONB | custom_fields, validation_rules, config | Flexible schema |
| NUMERIC(12,2) | salary_min, salary_max | Precise currency |
| INT | usage_limit, current_usage, display_order | Integer counts |
| BOOLEAN | is_active, is_required, is_system | Binary state |
| TIMESTAMP | created_at, updated_at, deleted_at | Audit trail |
| TIMESTAMP WITH TZ | expires_at | Timezone-aware expiration |
| INET | ip_address | IP address storage |
| TEXT[] | tags, scopes, target_tiers | Array of values |
| UUID[] | excluded_companies, included_companies | Array of company IDs |

---

## Soft Delete Best Practices

### Implement in QueryRunner

```typescript
// Always filter soft-deleted records
async getCandidates(companyId: string) {
  return this.candidateRepository.find({
    where: {
      company_id: companyId,
      deleted_at: IsNull(),  // TypeORM helper
    },
  });
}
```

### Scheduled Purge (Optional)

```typescript
// After 90-day retention period
async purgeSoftDeletedData(retentionDays = 90) {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  
  await this.candidateRepository
    .createQueryBuilder()
    .delete()
    .where('deleted_at IS NOT NULL AND deleted_at < :cutoff', { cutoff: cutoffDate })
    .execute();
}
```

---

## Performance Tuning

### Connection Pooling
```typescript
// Recommended settings for NestJS
pool: {
  min: 5,
  max: 20,
},
```

### Query Optimization
```sql
-- Always filter by company_id first
SELECT * FROM applications 
WHERE company_id = 'abc-123'  -- Index start
  AND job_id = 'def-456'      -- Index used
  AND current_stage_id = 'ghi-789'
LIMIT 50;
```

### Cache Invalidation
- User changes: Invalidate `user:{user_id}:permissions`
- Role changes: Invalidate `role:{role_id}:permissions`
- Custom fields: Invalidate `company:{company_id}:custom_fields`

---

## Monitoring & Maintenance

### Query Performance
```sql
-- Find slow queries
SELECT * FROM pg_stat_statements
WHERE mean_time > 100  -- > 100ms average
ORDER BY total_time DESC
LIMIT 20;
```

### Index Usage
```sql
-- Find unused indexes
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY idx_blks_read DESC;
```

### Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Backup & Recovery

### Full Database Backup
```bash
pg_dump -U ats_user -h localhost ats_saaS > backup.sql
```

### Point-in-Time Recovery (With WAL)
```bash
# Restore to specific timestamp
pg_restore --create -U ats_user -h localhost backup.sql
```

### Selective Table Recovery
```bash
# Recover specific table
pg_dump -U ats_user -t candidates backup.sql | psql -U ats_user ats_saaS
```

---

## Testing Migrations

### Unit Tests for Migration Safety

```typescript
describe('Migrations', () => {
  it('should create companies table with correct schema', async () => {
    const migration = new CreateCompaniesTable1704067200000();
    await migration.up(queryRunner);
    
    const table = await queryRunner.getTable('companies');
    expect(table).toBeDefined();
    expect(table.columns).toContainEqual(
      jasmine.objectContaining({ name: 'id', type: 'uuid' })
    );
  });

  it('should maintain referential integrity', async () => {
    const user = { company_id: 'invalid-id' };
    expect(async () => {
      await usersRepository.save(user);
    }).rejects.toThrow(ForeignKeyConstraintError);
  });
});
```

---

## Troubleshooting

### Migration Fails with "Table Already Exists"
```bash
# Check migration history
SELECT * FROM migrations ORDER BY timestamp DESC;

# Manually mark as complete (be careful)
INSERT INTO migrations (timestamp, name) VALUES (1704067200000, 'CreateCompaniesTable1704067200000');
```

### Foreign Key Constraint Violation
```sql
-- Check for orphaned references
SELECT * FROM users WHERE company_id NOT IN (SELECT id FROM companies);

-- Clean up before constraint enforcement
DELETE FROM users WHERE company_id NOT IN (SELECT id FROM companies);
```

### Slow Migration on Large Table
```sql
-- Add index after bulk insert
CREATE INDEX CONCURRENTLY idx_candidates_company_status 
ON candidates(company_id, status);
```

---

## Deployment Checklist

- [ ] Migrations tested locally with `npm run typeorm migration:run`
- [ ] Dry-run executed in staging with `npm run typeorm migration:show`
- [ ] Backup taken before production migration
- [ ] High-traffic windows avoided (off-peak deployment)
- [ ] Rollback plan documented (migration reversions)
- [ ] Indexes verified created (`\d table_name` in psql)
- [ ] Foreign keys verified active (query violations)
- [ ] Soft delete filtering implemented in queries
- [ ] Query performance tested with indexes
- [ ] Monitoring alerts configured for slow queries

---

**Total Migrations**: 24 files
**Total Tables**: 25
**Company_id Tables**: 20 (tenant-aware)
**Global Tables**: 2 (permissions, feature_flags)
**Seed Tables**: 3 (companies, users, roles - initial setup)

All migrations ready for TypeORM execution via `npm run typeorm migration:run`
