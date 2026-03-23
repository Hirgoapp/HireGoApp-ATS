# ATS SaaS - Feature Licensing & Feature Flag System

## Overview

This document defines the production-grade licensing and feature flag system that controls feature availability based on customer subscription tier, feature quota, and runtime flags.

**Goal**: Flexible monetization + runtime control + tenant-aware enforcement  
**Approach**: License tiers + Feature flags + Rate limiting + Route guards

---

## 1. License Tiers

### Tier Definitions

```typescript
enum LicenseTier {
  BASIC = 'basic',        // Starter plan
  PREMIUM = 'premium',    // Professional plan
  ENTERPRISE = 'enterprise' // Custom enterprise
}

interface LicenseTierFeatures {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: Record<string, LicenseFeatureLimit>;
  maxUsers: number;
  maxCandidates: number;
  apiCallsPerDay: number;
  customFieldsLimit: number;
  pipelineStagesLimit: number;
  supportLevel: 'email' | 'priority' | 'dedicated';
}
```

### Tier Specifications

**BASIC Tier** ($29/month)
```json
{
  "name": "Basic - Startup",
  "monthlyPrice": 29,
  "annualPrice": 290,
  "maxUsers": 3,
  "maxCandidates": 1000,
  "apiCallsPerDay": 10000,
  "features": {
    "jobs": { "enabled": true, "limit": 5 },
    "candidates": { "enabled": true, "limit": 1000 },
    "applications": { "enabled": true, "limit": null },
    "custom_fields": { "enabled": true, "limit": 5 },
    "pipelines": { "enabled": true, "limit": 2 },
    "bulk_import": { "enabled": false, "limit": null },
    "api_access": { "enabled": false, "limit": null },
    "webhooks": { "enabled": false, "limit": null },
    "analytics": { "enabled": false, "limit": null },
    "sso": { "enabled": false, "limit": null },
    "white_label": { "enabled": false, "limit": null }
  }
}
```

**PREMIUM Tier** ($99/month)
```json
{
  "name": "Premium - Growing Teams",
  "monthlyPrice": 99,
  "annualPrice": 990,
  "maxUsers": 15,
  "maxCandidates": 10000,
  "apiCallsPerDay": 100000,
  "features": {
    "jobs": { "enabled": true, "limit": null },
    "candidates": { "enabled": true, "limit": 10000 },
    "applications": { "enabled": true, "limit": null },
    "custom_fields": { "enabled": true, "limit": 50 },
    "pipelines": { "enabled": true, "limit": 10 },
    "bulk_import": { "enabled": true, "limit": null },
    "api_access": { "enabled": true, "limit": null },
    "webhooks": { "enabled": true, "limit": 100 },
    "analytics": { "enabled": true, "limit": null },
    "sso": { "enabled": false, "limit": null },
    "white_label": { "enabled": false, "limit": null }
  }
}
```

**ENTERPRISE Tier** (Custom)
```json
{
  "name": "Enterprise - Custom",
  "monthlyPrice": null,
  "annualPrice": null,
  "maxUsers": null,
  "maxCandidates": null,
  "apiCallsPerDay": null,
  "features": {
    "jobs": { "enabled": true, "limit": null },
    "candidates": { "enabled": true, "limit": null },
    "applications": { "enabled": true, "limit": null },
    "custom_fields": { "enabled": true, "limit": null },
    "pipelines": { "enabled": true, "limit": null },
    "bulk_import": { "enabled": true, "limit": null },
    "api_access": { "enabled": true, "limit": null },
    "webhooks": { "enabled": true, "limit": null },
    "analytics": { "enabled": true, "limit": null },
    "sso": { "enabled": true, "limit": null },
    "white_label": { "enabled": true, "limit": null }
  }
}
```

---

## 2. Database Schema

### Table 1: licenses

```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  
  -- License Details
  tier VARCHAR(50) NOT NULL,        -- basic, premium, enterprise
  status VARCHAR(50) NOT NULL,      -- active, trial, suspended, expired, cancelled
  
  -- Billing Cycle
  billing_cycle VARCHAR(50),        -- monthly, annual, custom
  auto_renew BOOLEAN DEFAULT true,
  
  -- Dates
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  
  -- Custom Limits (for ENTERPRISE)
  custom_limits JSONB DEFAULT '{}', -- Override standard limits
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  INDEX: (company_id),
  INDEX: (tier, status),
  INDEX: (expires_at)
);
```

### Table 2: license_features

```sql
CREATE TABLE license_features (
  id UUID PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  
  -- Feature Reference
  feature_name VARCHAR(100) NOT NULL, -- 'custom_fields', 'api_access', 'sso', etc
  
  -- Limit Configuration
  is_enabled BOOLEAN DEFAULT true,
  usage_limit INT,                   -- NULL = unlimited
  current_usage INT DEFAULT 0,       -- Track usage
  reset_date TIMESTAMP,              -- When usage counter resets (monthly)
  
  -- Custom Override
  custom_config JSONB DEFAULT '{}',  -- Feature-specific config
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (license_id, feature_name),
  INDEX: (license_id)
);
```

### Table 3: feature_flags

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  
  -- Flag Identity
  name VARCHAR(100) NOT NULL UNIQUE,       -- 'dark_mode', 'new_dashboard', etc
  description TEXT,
  
  -- Flag Configuration
  flag_type VARCHAR(50) NOT NULL,          -- 'boolean', 'percentage', 'user_list'
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, archived
  
  -- Global Settings
  is_enabled_globally BOOLEAN DEFAULT false,
  enabled_percentage INT,                  -- For gradual rollout (0-100)
  
  -- Audience Targeting
  target_tiers VARCHAR[],                  -- Which license tiers: ['premium', 'enterprise']
  excluded_companies UUID[],               -- Exclude specific companies
  included_companies UUID[],               -- Include specific companies (whitelist)
  
  -- Configuration
  config JSONB DEFAULT '{}',               -- Feature-specific config
  
  -- Scheduling
  scheduled_at TIMESTAMP,
  scheduled_end_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL
);
```

### Table 4: feature_flag_usage

```sql
CREATE TABLE feature_flag_usage (
  id UUID PRIMARY KEY,
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Usage Tracking
  enabled_at TIMESTAMP,
  last_accessed_at TIMESTAMP,
  access_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (feature_flag_id, company_id),
  INDEX: (company_id, feature_flag_id)
);
```

---

## 3. License Service

### License Service Implementation

```typescript
// services/license.service.ts

@Injectable()
export class LicenseService {
  private readonly tierDefinitions: Record<LicenseTier, LicenseTierFeatures>;

  constructor(
    private licenseRepository: Repository<License>,
    private licenseFeatureRepository: Repository<LicenseFeature>,
    private companiesRepository: Repository<Company>,
    private auditService: AuditService
  ) {
    // Initialize tier definitions
    this.tierDefinitions = {
      [LicenseTier.BASIC]: { /* BASIC tier config */ },
      [LicenseTier.PREMIUM]: { /* PREMIUM tier config */ },
      [LicenseTier.ENTERPRISE]: { /* ENTERPRISE tier config */ }
    };
  }

  /**
   * Get license for company
   */
  async getLicense(companyId: string): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: {
        company_id: companyId,
        deleted_at: IsNull()
      },
      relations: ['company']
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    return license;
  }

  /**
   * Check if license is active
   */
  async isLicenseActive(companyId: string): Promise<boolean> {
    const license = await this.getLicense(companyId);

    // Check status and expiration
    if (license.status !== 'active') {
      return false;
    }

    if (license.expires_at < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Check if company has access to feature
   */
  async hasFeatureAccess(
    companyId: string,
    featureName: string
  ): Promise<boolean> {
    const license = await this.getLicense(companyId);

    if (!license || license.status !== 'active') {
      return false;
    }

    const tierFeatures = this.tierDefinitions[license.tier as LicenseTier];
    const feature = tierFeatures.features[featureName];

    return feature?.enabled ?? false;
  }

  /**
   * Check feature usage limit
   */
  async checkFeatureUsage(
    companyId: string,
    featureName: string,
    amount: number = 1
  ): Promise<{ allowed: boolean; remaining: number; limit: number | null }> {
    const license = await this.getLicense(companyId);

    // Get feature configuration
    const tierFeatures = this.tierDefinitions[license.tier as LicenseTier];
    const featureConfig = tierFeatures.features[featureName];

    if (!featureConfig?.enabled) {
      return {
        allowed: false,
        remaining: 0,
        limit: null
      };
    }

    // If no limit (unlimited)
    if (featureConfig.limit === null) {
      return {
        allowed: true,
        remaining: Infinity,
        limit: null
      };
    }

    // Check against license_features table
    let licenseFeature = await this.licenseFeatureRepository.findOne({
      where: {
        license_id: license.id,
        feature_name: featureName
      }
    });

    if (!licenseFeature) {
      licenseFeature = this.licenseFeatureRepository.create({
        license_id: license.id,
        feature_name: featureName,
        is_enabled: true,
        usage_limit: featureConfig.limit,
        current_usage: 0
      });
      licenseFeature = await this.licenseFeatureRepository.save(licenseFeature);
    }

    // Check usage
    const remaining = licenseFeature.usage_limit - licenseFeature.current_usage;
    const allowed = remaining >= amount;

    return {
      allowed,
      remaining: Math.max(0, remaining),
      limit: licenseFeature.usage_limit
    };
  }

  /**
   * Increment feature usage
   */
  async incrementFeatureUsage(
    companyId: string,
    featureName: string,
    amount: number = 1
  ): Promise<void> {
    const license = await this.getLicense(companyId);

    const licenseFeature = await this.licenseFeatureRepository.findOne({
      where: {
        license_id: license.id,
        feature_name: featureName
      }
    });

    if (licenseFeature) {
      licenseFeature.current_usage += amount;
      await this.licenseFeatureRepository.save(licenseFeature);
    }
  }

  /**
   * Get tier features
   */
  getTierFeatures(tier: LicenseTier): LicenseTierFeatures {
    return this.tierDefinitions[tier];
  }

  /**
   * Upgrade license to new tier
   */
  async upgradeLicense(
    companyId: string,
    newTier: LicenseTier,
    billingCycle: 'monthly' | 'annual'
  ): Promise<License> {
    const license = await this.getLicense(companyId);
    const tierConfig = this.tierDefinitions[newTier];

    // Calculate new expiration
    const now = new Date();
    const expiresAt =
      billingCycle === 'annual'
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    license.tier = newTier;
    license.status = 'active';
    license.starts_at = now;
    license.expires_at = expiresAt;
    license.billing_cycle = billingCycle;

    const updated = await this.licenseRepository.save(license);

    // Audit log
    await this.auditService.log(companyId, null, {
      entityType: 'license',
      entityId: license.id,
      action: 'UPGRADE',
      newValues: { tier: newTier, expiresAt }
    });

    return updated;
  }

  /**
   * Override feature limit (for ENTERPRISE)
   */
  async setCustomLimit(
    companyId: string,
    featureName: string,
    newLimit: number | null
  ): Promise<LicenseFeature> {
    const license = await this.getLicense(companyId);

    if (license.tier !== LicenseTier.ENTERPRISE) {
      throw new BadRequestException('Custom limits only available for ENTERPRISE');
    }

    let feature = await this.licenseFeatureRepository.findOne({
      where: {
        license_id: license.id,
        feature_name: featureName
      }
    });

    if (!feature) {
      feature = this.licenseFeatureRepository.create({
        license_id: license.id,
        feature_name: featureName,
        is_enabled: true
      });
    }

    feature.usage_limit = newLimit;
    return this.licenseFeatureRepository.save(feature);
  }
}
```

---

## 4. Feature Flag Service

### Feature Flag Service Implementation

```typescript
// services/feature-flag.service.ts

@Injectable()
export class FeatureFlagService {
  constructor(
    private featureFlagRepository: Repository<FeatureFlag>,
    private featureFlagUsageRepository: Repository<FeatureFlagUsage>,
    private licenseService: LicenseService
  ) {}

  /**
   * Check if feature is enabled for company
   */
  async isFeatureEnabled(
    companyId: string,
    flagName: string
  ): Promise<boolean> {
    const flag = await this.featureFlagRepository.findOne({
      where: {
        name: flagName,
        status: 'active',
        deleted_at: IsNull()
      }
    });

    if (!flag) {
      return false;
    }

    // Check scheduling
    const now = new Date();
    if (flag.scheduled_at && flag.scheduled_at > now) {
      return false; // Not yet scheduled
    }
    if (flag.scheduled_end_at && flag.scheduled_end_at < now) {
      return false; // Scheduling ended
    }

    // Check global enable
    if (!flag.is_enabled_globally) {
      return false;
    }

    // Check company exclusion
    if (flag.excluded_companies?.includes(companyId)) {
      return false;
    }

    // Check whitelist (if exists)
    if (
      flag.included_companies &&
      flag.included_companies.length > 0 &&
      !flag.included_companies.includes(companyId)
    ) {
      return false;
    }

    // Check license tier targeting
    if (flag.target_tiers && flag.target_tiers.length > 0) {
      const license = await this.licenseService.getLicense(companyId);
      if (!flag.target_tiers.includes(license.tier)) {
        return false;
      }
    }

    // Check gradual rollout percentage
    if (flag.enabled_percentage && flag.enabled_percentage < 100) {
      const hash = this.hashCompanyId(companyId);
      if (hash % 100 >= flag.enabled_percentage) {
        return false;
      }
    }

    // Record usage
    await this.recordFlagUsage(companyId, flag.id);

    return true;
  }

  /**
   * Get all enabled features for company
   */
  async getEnabledFeatures(companyId: string): Promise<string[]> {
    const flags = await this.featureFlagRepository.find({
      where: {
        status: 'active',
        is_enabled_globally: true,
        deleted_at: IsNull()
      }
    });

    const enabled: string[] = [];

    for (const flag of flags) {
      const isEnabled = await this.isFeatureEnabled(companyId, flag.name);
      if (isEnabled) {
        enabled.push(flag.name);
      }
    }

    return enabled;
  }

  /**
   * Create new feature flag
   */
  async createFlag(dto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    const flag = this.featureFlagRepository.create({
      ...dto,
      status: 'draft',
      is_enabled_globally: false
    });

    return this.featureFlagRepository.save(flag);
  }

  /**
   * Enable flag globally
   */
  async enableFlag(flagId: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagRepository.findOne({
      where: { id: flagId }
    });

    if (!flag) throw new NotFoundException('Flag not found');

    flag.status = 'active';
    flag.is_enabled_globally = true;

    return this.featureFlagRepository.save(flag);
  }

  /**
   * Disable flag
   */
  async disableFlag(flagId: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagRepository.findOne({
      where: { id: flagId }
    });

    if (!flag) throw new NotFoundException('Flag not found');

    flag.is_enabled_globally = false;

    return this.featureFlagRepository.save(flag);
  }

  /**
   * Gradual rollout - enable for percentage
   */
  async rolloutFlag(
    flagId: string,
    percentage: number
  ): Promise<FeatureFlag> {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Percentage must be 0-100');
    }

    const flag = await this.featureFlagRepository.findOne({
      where: { id: flagId }
    });

    if (!flag) throw new NotFoundException('Flag not found');

    flag.enabled_percentage = percentage;
    flag.status = 'active';

    return this.featureFlagRepository.save(flag);
  }

  /**
   * Add company to whitelist
   */
  async includeCompany(flagId: string, companyId: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagRepository.findOne({
      where: { id: flagId }
    });

    if (!flag) throw new NotFoundException('Flag not found');

    const included = flag.included_companies || [];
    if (!included.includes(companyId)) {
      included.push(companyId);
      flag.included_companies = included;
    }

    return this.featureFlagRepository.save(flag);
  }

  /**
   * Exclude company from flag
   */
  async excludeCompany(flagId: string, companyId: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagRepository.findOne({
      where: { id: flagId }
    });

    if (!flag) throw new NotFoundException('Flag not found');

    const excluded = flag.excluded_companies || [];
    if (!excluded.includes(companyId)) {
      excluded.push(companyId);
      flag.excluded_companies = excluded;
    }

    return this.featureFlagRepository.save(flag);
  }

  private async recordFlagUsage(
    companyId: string,
    flagId: string
  ): Promise<void> {
    let usage = await this.featureFlagUsageRepository.findOne({
      where: {
        feature_flag_id: flagId,
        company_id: companyId
      }
    });

    if (!usage) {
      usage = this.featureFlagUsageRepository.create({
        feature_flag_id: flagId,
        company_id: companyId,
        enabled_at: new Date(),
        access_count: 0
      });
    }

    usage.last_accessed_at = new Date();
    usage.access_count++;

    await this.featureFlagUsageRepository.save(usage);
  }

  private hashCompanyId(companyId: string): number {
    let hash = 0;
    for (let i = 0; i < companyId.length; i++) {
      const char = companyId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```

---

## 5. License & Feature Guards

### License Guard

```typescript
// guards/license.guard.ts

@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(
    private licenseService: LicenseService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route requires license check
    const requiredTier = this.reflector.get<LicenseTier>(
      'LICENSE_TIER',
      context.getHandler()
    );

    if (!requiredTier) {
      return true; // No license check required
    }

    const request = context.switchToHttp().getRequest();
    const companyId = request.tenant?.companyId;

    if (!companyId) {
      throw new UnauthorizedException('Tenant context missing');
    }

    try {
      const license = await this.licenseService.getLicense(companyId);

      if (license.tier !== requiredTier && license.tier !== LicenseTier.ENTERPRISE) {
        throw new ForbiddenException(
          `This feature requires ${requiredTier} license`
        );
      }

      return true;
    } catch (error) {
      throw new ForbiddenException('License validation failed');
    }
  }
}
```

### Feature Guard

```typescript
// guards/feature.guard.ts

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private licenseService: LicenseService,
    private featureFlagService: FeatureFlagService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route requires feature access
    const requiredFeature = this.reflector.get<string>(
      'REQUIRED_FEATURE',
      context.getHandler()
    );

    if (!requiredFeature) {
      return true; // No feature check required
    }

    const request = context.switchToHttp().getRequest();
    const companyId = request.tenant?.companyId;

    if (!companyId) {
      throw new UnauthorizedException('Tenant context missing');
    }

    try {
      // Check license feature access
      const hasAccess = await this.licenseService.hasFeatureAccess(
        companyId,
        requiredFeature
      );

      if (!hasAccess) {
        throw new ForbiddenException(
          `Feature "${requiredFeature}" not available in your plan`
        );
      }

      // Check feature flag
      const isEnabled = await this.featureFlagService.isFeatureEnabled(
        companyId,
        requiredFeature
      );

      if (!isEnabled) {
        throw new ForbiddenException(
          `Feature "${requiredFeature}" is not currently enabled`
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Feature access check failed');
    }
  }
}
```

### Usage Limit Guard

```typescript
// guards/usage-limit.guard.ts

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private licenseService: LicenseService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route requires usage limit check
    const limitConfig = this.reflector.get<{ feature: string; amount: number }>(
      'USAGE_LIMIT',
      context.getHandler()
    );

    if (!limitConfig) {
      return true; // No usage limit check
    }

    const request = context.switchToHttp().getRequest();
    const companyId = request.tenant?.companyId;

    if (!companyId) {
      throw new UnauthorizedException('Tenant context missing');
    }

    const { feature, amount } = limitConfig;

    const usage = await this.licenseService.checkFeatureUsage(
      companyId,
      feature,
      amount
    );

    if (!usage.allowed) {
      throw new ForbiddenException(
        `Usage limit exceeded for "${feature}". Limit: ${usage.limit}, Remaining: ${usage.remaining}`
      );
    }

    // Store usage result in request for service layer to increment later
    request.featureUsage = usage;

    return true;
  }
}
```

---

## 6. Decorators

### License Tier Decorator

```typescript
// decorators/require-license.decorator.ts

export function RequireLicense(tier: LicenseTier) {
  return SetMetadata('LICENSE_TIER', tier);
}

// Usage
@Get()
@RequireLicense(LicenseTier.PREMIUM)
async getPremiumFeature() {
  return { data: 'premium feature' };
}
```

### Feature Decorator

```typescript
// decorators/require-feature.decorator.ts

export function RequireFeature(featureName: string) {
  return SetMetadata('REQUIRED_FEATURE', featureName);
}

// Usage
@Post('webhooks')
@RequireFeature('webhooks')
async createWebhook(@Body() dto: CreateWebhookDto) {
  return { webhook: 'created' };
}
```

### Usage Limit Decorator

```typescript
// decorators/limit-usage.decorator.ts

export function LimitUsage(feature: string, amount: number = 1) {
  return SetMetadata('USAGE_LIMIT', { feature, amount });
}

// Usage
@Post('candidates/import')
@LimitUsage('bulk_import', 1)
async bulkImportCandidates(@Body() dto: BulkImportDto) {
  // If check passes, increment usage in service
  return { imported: 100 };
}
```

---

## 7. Example Enforcement Flows

### Flow 1: Accessing Premium Feature

```
User Request (Company A, BASIC tier)
  ↓
POST /api/v1/webhooks
  ↓
@RequireFeature('webhooks')
  ↓
FeatureGuard.canActivate()
  • Check: LicenseService.hasFeatureAccess('webhooks')
  • Result: BASIC tier doesn't have 'webhooks' feature
  ↓
Response (403 Forbidden):
{
  "success": false,
  "error": "ForbiddenException",
  "message": "Feature 'webhooks' not available in your plan"
}
```

### Flow 2: Hitting Usage Limit

```
User Request (Company B, PREMIUM tier, 100 custom fields already created)
  ↓
POST /api/v1/custom-fields
  ↓
@LimitUsage('custom_fields', 1)
  ↓
UsageLimitGuard.canActivate()
  • Check: LicenseService.checkFeatureUsage('custom_fields', 1)
  • Current usage: 50
  • Limit: 50 (PREMIUM tier)
  • Remaining: 0
  • Allowed: false
  ↓
Response (403 Forbidden):
{
  "success": false,
  "error": "ForbiddenException",
  "message": "Usage limit exceeded for 'custom_fields'. Limit: 50, Remaining: 0"
}
```

### Flow 3: Feature Flag Gradual Rollout

```
Admin enables new "advanced_analytics" flag with 10% rollout:
  • FeatureFlag.is_enabled_globally = true
  • FeatureFlag.enabled_percentage = 10
  • FeatureFlag.status = 'active'

Requests:
  • Company A hash = 1234 % 100 = 34 (34 >= 10) → DISABLED
  • Company B hash = 5678 % 100 = 78 (78 >= 10) → DISABLED
  • Company C hash = 9012 % 100 = 12 (12 >= 10) → DISABLED
  • Company D hash = 3456 % 100 = 56 (56 >= 10) → DISABLED
  • Company E hash = 7890 % 100 = 90 (90 >= 10) → DISABLED
  • Company F hash = 0123 % 100 = 23 (23 >= 10) → DISABLED
  • Company G hash = 4567 % 100 = 67 (67 >= 10) → DISABLED
  • Company H hash = 8901 % 100 = 1 (1 < 10) → ENABLED ✓
  • Company I hash = 2345 % 100 = 45 (45 >= 10) → DISABLED
  • Company J hash = 6789 % 100 = 89 (89 >= 10) → DISABLED

Result: ~10% of companies get the feature
```

---

## 8. API Examples

### Create Feature Flag

```
POST /api/v1/admin/feature-flags
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "dark_mode",
  "description": "Dark theme support",
  "flagType": "boolean",
  "targetTiers": ["premium", "enterprise"],
  "isEnabledGlobally": false
}

Response (201):
{
  "success": true,
  "data": {
    "id": "ff_123",
    "name": "dark_mode",
    "status": "draft",
    "isEnabledGlobally": false
  }
}
```

### Enable Feature Flag with Rollout

```
POST /api/v1/admin/feature-flags/{flagId}/rollout
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "percentage": 25,
  "scheduledAt": "2025-01-15T00:00:00Z"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "ff_123",
    "enabledPercentage": 25,
    "scheduledAt": "2025-01-15T00:00:00Z"
  }
}
```

### Whitelist Company for Feature Flag

```
POST /api/v1/admin/feature-flags/{flagId}/include-company
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "companyId": "comp_456"
}

Response (200):
{
  "success": true,
  "message": "Company added to whitelist"
}
```

### Check Feature Availability

```
GET /api/v1/features/available
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "license": {
      "tier": "premium",
      "expiresAt": "2025-06-01T00:00:00Z",
      "features": {
        "custom_fields": {
          "enabled": true,
          "limit": 50,
          "current_usage": 23,
          "remaining": 27
        },
        "api_access": {
          "enabled": true,
          "limit": null,
          "remaining": "unlimited"
        },
        "webhooks": {
          "enabled": true,
          "limit": 100
        }
      }
    },
    "featureFlags": {
      "dark_mode": true,
      "advanced_analytics": false,
      "new_dashboard": true
    }
  }
}
```

### Upgrade License

```
POST /api/v1/license/upgrade
Authorization: Bearer <token>
Content-Type: application/json

{
  "newTier": "premium",
  "billingCycle": "annual"
}

Response (200):
{
  "success": true,
  "data": {
    "license": {
      "id": "lic_456",
      "tier": "premium",
      "status": "active",
      "expiresAt": "2026-01-01T00:00:00Z"
    }
  }
}
```

---

## 9. Testing

### License Service Tests

```typescript
describe('LicenseService', () => {
  let service: LicenseService;
  let licenseRepository: Repository<License>;

  beforeEach(async () => {
    // Setup test module
  });

  it('should check feature access based on tier', async () => {
    const basicLicense = {
      id: 'lic_1',
      tier: 'basic',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    // Mock repository
    jest
      .spyOn(licenseRepository, 'findOne')
      .mockResolvedValue(basicLicense as License);

    const hasAccess = await service.hasFeatureAccess('comp_1', 'api_access');

    expect(hasAccess).toBe(false); // BASIC doesn't have API access
  });

  it('should check usage limits correctly', async () => {
    const usage = await service.checkFeatureUsage(
      'comp_1',
      'custom_fields',
      1
    );

    expect(usage.allowed).toBe(true);
    expect(usage.remaining).toBeLessThan(5); // BASIC limit is 5
  });
});
```

---

## Summary

| Component | Purpose |
|-----------|---------|
| **licenses table** | Stores company license tiers, status, expiration |
| **license_features table** | Tracks usage limits and feature configuration per license |
| **feature_flags table** | Stores feature flag definitions with targeting rules |
| **LicenseService** | Checks license status, feature access, usage limits |
| **FeatureFlagService** | Manages feature flag state and enablement logic |
| **Guards** | Enforce license/feature access at route level |
| **Decorators** | Mark routes with required license/feature/usage limit |

This system enables:
- ✅ Multiple monetization tiers
- ✅ Runtime feature control
- ✅ Gradual feature rollout
- ✅ Usage-based limiting
- ✅ Enterprise customization
- ✅ A/B testing capabilities
