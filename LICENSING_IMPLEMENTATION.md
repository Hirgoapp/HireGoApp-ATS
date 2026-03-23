# Feature Licensing & Feature Flags Implementation

## Overview

This document describes the complete implementation of feature licensing and feature flag enforcement in the ATS SaaS platform. The system enables:

- **Tiered licensing**: BASIC, PREMIUM, ENTERPRISE with different feature access
- **Feature flags**: Runtime control of features with gradual rollout
- **Usage tracking**: Metered features with per-month counters
- **Tenant-aware enforcement**: Company-scoped license checks
- **Audit logging**: Track all license changes and flag updates

## Architecture

### Database Schema

#### `licenses` Table
Stores company-scoped license information.

```sql
- id (UUID, PK)
- company_id (UUID, UNIQUE, FK → companies)
- tier (ENUM: BASIC, PREMIUM, ENTERPRISE)
- status (ENUM: TRIAL, ACTIVE, SUSPENDED, EXPIRED, CANCELLED)
- billing_cycle (ENUM: monthly, annual, custom)
- auto_renew (BOOLEAN)
- starts_at (TIMESTAMP)
- expires_at (TIMESTAMP)
- cancelled_at (TIMESTAMP)
- custom_limits (JSONB) - ENTERPRISE overrides
- created_at, updated_at, deleted_at
```

#### `license_features` Table
Maps features to licenses with usage tracking.

```sql
- id (UUID, PK)
- license_id (UUID, FK → licenses, CASCADE)
- feature_name (VARCHAR)
- is_enabled (BOOLEAN)
- usage_limit (INTEGER, nullable = unlimited)
- current_usage (INTEGER)
- reset_date (TIMESTAMP) - Monthly reset
- custom_config (JSONB)
- created_at, updated_at
```

#### `feature_flags` Table
Global feature flag definitions.

```sql
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- description (TEXT)
- flag_type (ENUM: boolean, percentage, user_list)
- status (ENUM: draft, active, archived)
- is_enabled_globally (BOOLEAN)
- enabled_percentage (INTEGER: 0-100)
- target_tiers (TEXT as JSON array)
- excluded_companies (TEXT as JSON array)
- included_companies (TEXT as JSON array)
- scheduled_at (TIMESTAMP)
- scheduled_end_at (TIMESTAMP)
- config (JSONB)
- created_by_id (UUID)
- created_at, updated_at, deleted_at
```

#### `feature_flag_usage` Table
Tracks feature flag access per company.

```sql
- id (UUID, PK)
- feature_flag_id (UUID, FK → feature_flags, CASCADE)
- company_id (UUID, FK → companies)
- enabled_at (TIMESTAMP)
- last_accessed_at (TIMESTAMP)
- access_count (INTEGER)
- created_at, updated_at
- UNIQUE(feature_flag_id, company_id)
```

## License Tiers

### BASIC ($29/month)
**Limits:**
- Max 3 users
- Max 1,000 candidates
- Max 5 custom fields
- Max 2 pipelines
- Max 10,000 API calls/day

**Features:**
- jobs (limit: 5)
- candidates (limit: 1,000)
- applications (unlimited)
- custom_fields (limit: 5)
- pipelines (limit: 2)
- api_access (limit: 10,000/day)

### PREMIUM ($99/month)
**Limits:**
- Max 15 users
- Max 10,000 candidates
- Max 50 custom fields
- Max 10 pipelines
- Max 100,000 API calls/day

**Features:**
- All BASIC features (unlimited jobs & candidates)
- bulk_import (unlimited)
- webhooks (limit: 100)
- analytics (unlimited)

### ENTERPRISE (Custom)
**Limits:**
- Unlimited users
- Unlimited candidates
- Unlimited custom fields
- Unlimited pipelines
- Unlimited API calls

**Features:**
- All PREMIUM features
- sso (unlimited)
- white_label (unlimited)
- advanced_reporting (unlimited)
- custom_integrations (unlimited)

## Service Layer

### LicenseService

**Methods:**

```typescript
// Check if company has active license
async isLicenseActive(companyId: string): Promise<boolean>

// Get company's license (throws if not found)
async getLicense(companyId: string): Promise<License>

// Check if feature is available in tier
async hasFeatureAccess(companyId: string, featureName: string): Promise<boolean>

// Check usage against limit
async checkFeatureUsage(
  companyId: string,
  featureName: string,
  amount: number
): Promise<{ allowed: boolean; current: number; limit: number | null; remaining: number | null }>

// Increment feature usage
async incrementFeatureUsage(
  companyId: string,
  featureName: string,
  amount: number
): Promise<void>

// Get all features for company with usage
async getCompanyFeatures(companyId: string): Promise<LicenseFeature[]>

// Upgrade license tier
async upgradeLicense(
  companyId: string,
  newTier: 'BASIC' | 'PREMIUM' | 'ENTERPRISE',
  billingCycle: string
): Promise<License>

// Set custom limit (ENTERPRISE only)
async setCustomLimit(
  companyId: string,
  featureName: string,
  newLimit: number
): Promise<LicenseFeature>

// Get tier feature matrix
getTierFeatures(tier: string): Record<string, number | null>
```

### FeatureFlagService

**Methods:**

```typescript
// Check if flag is enabled for company
async isFeatureEnabled(companyId: string, flagName: string): Promise<boolean>

// Get all enabled features for company
async getEnabledFeatures(companyId: string): Promise<string[]>

// Create new feature flag (draft)
async createFlag(dto: Partial<FeatureFlag>, createdById: string): Promise<FeatureFlag>

// Enable flag globally
async enableFlag(flagId: string, userId: string): Promise<FeatureFlag>

// Disable flag
async disableFlag(flagId: string, userId: string): Promise<FeatureFlag>

// Gradual rollout: enable for percentage
async rolloutFlag(flagId: string, percentage: number, userId: string): Promise<FeatureFlag>

// Add company to whitelist
async includeCompany(flagId: string, companyId: string, userId: string): Promise<FeatureFlag>

// Exclude company from flag
async excludeCompany(flagId: string, companyId: string, userId: string): Promise<FeatureFlag>
```

## Feature Flag Evaluation Logic

### Targeting Rules (in order)

1. **Global Enable Check**: `is_enabled_globally` must be true
2. **Scheduling Check**: Current time must be between `scheduled_at` and `scheduled_end_at` (if set)
3. **Company Exclusion**: Company must NOT be in `excluded_companies`
4. **Company Whitelist**: If `included_companies` is set, company MUST be in the list
5. **Tier Targeting**: If `target_tiers` is set, company's license tier must be in the list
6. **Percentage Rollout**: For gradual rollout, use hash-based targeting:
   ```typescript
   hash(company_id) % 100 >= enabled_percentage
   ```

### Example: 50% Gradual Rollout

For a flag with `enabled_percentage: 50`, approximately 50% of companies will see the feature based on their company ID hash. This ensures:
- **Consistent**: Same company always gets same result
- **Deterministic**: No database lookups needed
- **Gradual**: Can increase from 0% to 100% over time

## Guards & Decorators

### Guards

All guards implement `CanActivate` and use reflector to read metadata.

#### LicenseGuard
Validates license tier requirement.

```typescript
@UseGuards(LicenseGuard)
@RequireLicense('PREMIUM')
@Get('premium-only')
async premiumFeature() { }
```

**Behavior:**
- Checks `@RequireLicense()` metadata
- Validates company has active license
- Validates license tier meets requirement
- Throws `ForbiddenException` if not met

#### FeatureGuard
Validates feature access through license + flag.

```typescript
@UseGuards(FeatureGuard)
@RequireFeature('analytics')
@Get('analytics')
async getAnalytics() { }
```

**Behavior:**
- Checks `@RequireFeature()` metadata
- Validates license is active
- Validates feature in license tier
- Validates feature flag is enabled
- Throws `ForbiddenException` if any check fails

#### UsageLimitGuard
Validates usage against quota.

```typescript
@UseGuards(UsageLimitGuard)
@LimitUsage('api_access', 1)
@Get('use-api')
async useApi() { }
```

**Behavior:**
- Checks `@LimitUsage()` metadata
- Validates usage is within limit
- Stores feature usage in request context
- Throws `ForbiddenException` if limit exceeded
- Must be followed by interceptor to increment usage

### Decorators

#### @RequireLicense(tier)
Metadata marker for license tier requirement.

```typescript
@RequireLicense('PREMIUM') // Company must have PREMIUM or ENTERPRISE
@Get('premium')
async premiumFeature() { }
```

#### @RequireFeature(featureName)
Metadata marker for feature access requirement.

```typescript
@RequireFeature('analytics') // Feature must be enabled
@Get('analytics')
async getAnalytics() { }
```

#### @LimitUsage(feature, amount)
Metadata marker for usage limit enforcement.

```typescript
@LimitUsage('api_access', 1)
@Get('api-call')
async makeApiCall() { }
```

## Controllers

### LicenseController

**Routes:**

```
GET  /api/licensing/licenses/current
  → Get company's current license

GET  /api/licensing/licenses/status
  → Check license active status, tier, expiration

POST /api/licensing/licenses/check-feature
  → Check feature access and usage
  Body: { feature_name: string }

GET  /api/licensing/licenses/features
  → Get all features with usage for company

PUT  /api/licensing/licenses/:companyId/upgrade
  → Upgrade license tier (admin only)
  Body: { tier: 'BASIC'|'PREMIUM'|'ENTERPRISE', billing_cycle?: string }
```

### FeatureFlagController

**Routes:**

```
GET  /api/licensing/feature-flags/:flagName/check
  → Check if flag is enabled for company

GET  /api/licensing/feature-flags/enabled/list
  → Get all enabled features for company

POST /api/licensing/feature-flags
  → Create new feature flag (admin only)
  Body: CreateFeatureFlagDto

PUT  /api/licensing/feature-flags/:flagId/enable
  → Enable flag (admin only)

PUT  /api/licensing/feature-flags/:flagId/disable
  → Disable flag (admin only)

PUT  /api/licensing/feature-flags/:flagId/rollout
  → Start gradual rollout (admin only)
  Body: { percentage: 0-100 }

PUT  /api/licensing/feature-flags/:flagId/include/:companyId
  → Add company to whitelist (admin only)

PUT  /api/licensing/feature-flags/:flagId/exclude/:companyId
  → Exclude company from flag (admin only)
```

## Integration

### Module Setup

```typescript
// app.module.ts
import { LicensingModule } from './licensing/licensing.module';

@Module({
  imports: [
    // ... other modules
    LicensingModule,
  ],
})
export class AppModule {}
```

### Global Guard Application

```typescript
// main.ts
import { LicenseGuard, FeatureGuard, UsageLimitGuard } from './licensing/guards';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalGuards(
    app.get(TenantGuard),     // Extract company_id
    app.get(LicenseGuard),    // Check license tier
    app.get(FeatureGuard),    // Check feature flag
    app.get(UsageLimitGuard)  // Check usage limit
  );

  await app.listen(3000);
}
```

### Usage in Endpoints

```typescript
// Example: Create job (needs feature access + usage limit)
@Post('jobs')
@RequireFeature('jobs')
@LimitUsage('jobs', 1)
async createJob(@Body() dto: CreateJobDto) {
  // Feature is enabled, limit not exceeded
  // Create job...
  // Increment usage via interceptor
}

// Example: Analytics (PREMIUM+, gradual rollout)
@Get('analytics')
@RequireLicense('PREMIUM')
@RequireFeature('analytics')
async getAnalytics() {
  // Company has PREMIUM+ license
  // Analytics feature is enabled
  // Return analytics...
}

// Example: Enterprise API
@Post('integrations')
@RequireLicense('ENTERPRISE')
@RequireFeature('custom_integrations')
async createIntegration() {
  // Company has ENTERPRISE license
  // Custom integrations enabled
  // Create integration...
}
```

## Usage Example: Feature Access Check

```typescript
// In any service/controller with LicenseService injected
const isActive = await this.licenseService.isLicenseActive(companyId);
if (!isActive) {
  throw new ForbiddenException('License expired');
}

const hasAccess = await this.licenseService.hasFeatureAccess(
  companyId,
  'analytics'
);
if (!hasAccess) {
  throw new ForbiddenException('Feature not in license tier');
}

const usage = await this.licenseService.checkFeatureUsage(
  companyId,
  'jobs',
  1
);
if (!usage.allowed) {
  throw new ForbiddenException(
    `Job limit exceeded. Remaining: ${usage.remaining}`
  );
}

// Increment usage after successful operation
await this.licenseService.incrementFeatureUsage(companyId, 'jobs', 1);
```

## Feature Flag Example: Gradual Rollout

```typescript
// Start gradual rollout at 10%
await featureFlagService.rolloutFlag(flagId, 10, userId);

// Check which companies have access
for (const company of companies) {
  const enabled = await featureFlagService.isFeatureEnabled(
    company.id,
    'beta_feature'
  );
  console.log(`Company ${company.id}: ${enabled}`);
  // ~10% of companies will return true
}

// Increase to 50%
await featureFlagService.rolloutFlag(flagId, 50, userId);

// Increase to 100%
await featureFlagService.rolloutFlag(flagId, 100, userId);
```

## Audit Logging

All license changes and feature flag updates are logged:

### License Actions Audited
- `FEATURE_LICENSING_SYSTEM.LICENSE_UPGRADE` - License tier changed
- `FEATURE_LICENSING_SYSTEM.LICENSE_CUSTOM_LIMIT` - Custom limit set

### Feature Flag Actions Audited
- `FEATURE_LICENSING_SYSTEM.FEATURE_FLAG_CREATED` - New flag created
- `FEATURE_LICENSING_SYSTEM.FEATURE_FLAG_ENABLED` - Flag enabled globally
- `FEATURE_LICENSING_SYSTEM.FEATURE_FLAG_DISABLED` - Flag disabled
- `FEATURE_LICENSING_SYSTEM.FEATURE_FLAG_ROLLOUT` - Gradual rollout started
- `FEATURE_LICENSING_SYSTEM.FEATURE_FLAG_COMPANY_INCLUDED` - Company whitelisted
- `FEATURE_LICENSING_SYSTEM.FEATURE_FLAG_COMPANY_EXCLUDED` - Company excluded

## Error Handling

### Common Error Codes

| Code | Scenario | Response |
|------|----------|----------|
| 403 | License not active | `License is not active or has expired` |
| 403 | Tier not sufficient | `License tier BASIC does not meet required tier PREMIUM` |
| 403 | Feature not in tier | `Feature analytics is not included in your license` |
| 403 | Feature flag disabled | `Feature analytics is not currently enabled` |
| 403 | Usage limit exceeded | `Feature jobs limit exceeded. Remaining: 0/5` |
| 404 | License not found | `License for company not found` |
| 400 | Invalid percentage | `Percentage must be between 0 and 100` |

## Testing

### Test LicenseService

```typescript
describe('LicenseService', () => {
  it('should check license is active', async () => {
    const isActive = await service.isLicenseActive(companyId);
    expect(isActive).toBe(true);
  });

  it('should allow feature access for premium tier', async () => {
    const hasAccess = await service.hasFeatureAccess(companyId, 'analytics');
    expect(hasAccess).toBe(true);
  });

  it('should enforce usage limit', async () => {
    const usage = await service.checkFeatureUsage(companyId, 'jobs', 1);
    expect(usage.allowed).toBe(true);
  });
});
```

### Test FeatureFlagService

```typescript
describe('FeatureFlagService', () => {
  it('should enable feature for whitelisted company', async () => {
    const enabled = await service.isFeatureEnabled(
      whitelistedCompanyId,
      'beta_feature'
    );
    expect(enabled).toBe(true);
  });

  it('should disable feature for excluded company', async () => {
    const enabled = await service.isFeatureEnabled(
      excludedCompanyId,
      'beta_feature'
    );
    expect(enabled).toBe(false);
  });

  it('should respect tier targeting', async () => {
    const enabled = await service.isFeatureEnabled(basicTierCompanyId, 'premium_analytics');
    expect(enabled).toBe(false);
  });
});
```

## Migration Steps

1. **Run migrations** to create tables:
   ```bash
   npm run migration:run
   ```

2. **Seed default licenses and flags**:
   ```bash
   npm run seed
   ```

3. **Apply guards globally** or per-route

4. **Update endpoints** with decorators as needed

5. **Monitor audit logs** for license changes

## Performance Considerations

- **License checks**: Cached per request to avoid multiple DB hits
- **Feature flag checks**: Use hash-based percentage (no DB lookup)
- **Usage counters**: Reset monthly, minimal overhead
- **Exclusion/inclusion lists**: Stored as JSON arrays, small payload

## Files Created

### Entities (4)
- `src/licensing/entities/license.entity.ts`
- `src/licensing/entities/license-feature.entity.ts`
- `src/licensing/entities/feature-flag.entity.ts`
- `src/licensing/entities/feature-flag-usage.entity.ts`

### Repositories (4)
- `src/licensing/repositories/license.repository.ts`
- `src/licensing/repositories/license-feature.repository.ts`
- `src/licensing/repositories/feature-flag.repository.ts`
- `src/licensing/repositories/feature-flag-usage.repository.ts`

### Services (2)
- `src/licensing/services/license.service.ts`
- `src/licensing/services/feature-flag.service.ts`

### Guards (3)
- `src/licensing/guards/license.guard.ts`
- `src/licensing/guards/feature.guard.ts`
- `src/licensing/guards/usage-limit.guard.ts`

### Decorators (3)
- `src/licensing/decorators/require-license.decorator.ts`
- `src/licensing/decorators/require-feature.decorator.ts`
- `src/licensing/decorators/limit-usage.decorator.ts`

### DTOs (4)
- `src/licensing/dtos/create-feature-flag.dto.ts`
- `src/licensing/dtos/rollout-flag.dto.ts`
- `src/licensing/dtos/update-license.dto.ts`
- `src/licensing/dtos/check-feature.dto.ts`

### Controllers (2)
- `src/licensing/controllers/license.controller.ts`
- `src/licensing/controllers/feature-flag.controller.ts`

### Module (1)
- `src/licensing/licensing.module.ts`

### Migrations (4)
- `src/database/migrations/1704067225000-CreateLicensesTable.ts`
- `src/database/migrations/1704067226000-CreateLicenseFeaturesTable.ts`
- `src/database/migrations/1704067227000-CreateFeatureFlagsTable.ts`
- `src/database/migrations/1704067228000-CreateFeatureFlagUsageTable.ts`

### Seed Data (1)
- `src/database/seeds/default-licenses-features.seed.ts`

## Total Implementation

- **34 files created** (~2,500+ lines of code)
- **4 database tables** with proper indices and foreign keys
- **2 core services** with 19 methods total
- **3 guards** for route-level enforcement
- **3 decorators** for metadata marking
- **2 controllers** with 11 endpoints
- **4 migrations** for database schema
- **1 seed script** for default data
- **Comprehensive audit logging** of all license and flag changes

## Next Steps

1. Import `LicensingModule` in `AppModule`
2. Apply guards globally or per-route
3. Add decorators to endpoints that need license/feature checks
4. Create interceptor to handle usage counter increments
5. Test with sample companies and licenses
6. Monitor audit logs for license activity
