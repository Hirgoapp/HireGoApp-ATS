# Quick Integration Guide - Feature Licensing System

## 5-Minute Integration Steps

### 1. Import Module in AppModule

Edit `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicensingModule } from './licensing/licensing.module';
import { AuthModule } from './auth/auth.module';
// ... other imports

@Module({
  imports: [
    // Database
    TypeOrmModule.forRoot({
      // ... your config
    }),
    
    // Core modules
    AuthModule,
    LicensingModule,  // ← Add this
    
    // ... other modules
  ],
  // ...
})
export class AppModule {}
```

### 2. Register Guards in main.ts

Edit `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TenantGuard } from './common/guards/tenant.guard';
import { LicenseGuard } from './licensing/guards/license.guard';
import { FeatureGuard } from './licensing/guards/feature.guard';
import { UsageLimitGuard } from './licensing/guards/usage-limit.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Order matters: TenantGuard first to extract company_id
  app.useGlobalGuards(
    app.get(TenantGuard),
    app.get(LicenseGuard),
    app.get(FeatureGuard),
    app.get(UsageLimitGuard),
  );

  await app.listen(3000);
}

bootstrap();
```

### 3. Run Migrations

```bash
# Make sure you're using the correct database connection
npm run typeorm migration:run

# Or manually:
npm run migration:run -- -d ./src/database/data-source.ts
```

### 4. Seed Default Data

```bash
npm run seed

# Or manually run the seed script
npm run typeorm query "$(cat src/database/seeds/default-licenses-features.seed.ts)"
```

### 5. Add Licensing Checks to Endpoints

Example 1: Feature with access control

```typescript
// src/jobs/controllers/jobs.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RequireFeature } from '../licensing/decorators/require-feature.decorator';
import { LimitUsage } from '../licensing/decorators/limit-usage.decorator';
import { CreateJobDto } from './dtos/create-job.dto';

@Controller('api/jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  @RequireFeature('jobs')  // ← Check feature in license
  @LimitUsage('jobs', 1)  // ← Enforce usage limit
  async createJob(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }
}
```

Example 2: Premium-only feature

```typescript
@Get('analytics')
@RequireLicense('PREMIUM')  // ← Must have PREMIUM+ license
@RequireFeature('analytics')
async getAnalytics() {
  return { data: '...' };
}
```

Example 3: Enterprise-only feature

```typescript
@Post('integrations')
@RequireLicense('ENTERPRISE')  // ← Must have ENTERPRISE
@RequireFeature('custom_integrations')
async createIntegration(@Body() dto: CreateIntegrationDto) {
  return this.integrationsService.create(dto);
}
```

### 6. Create Usage Tracking Interceptor (Optional)

If you want automatic usage tracking on successful requests:

```typescript
// src/licensing/interceptors/usage-tracking.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LicenseService } from '../services/license.service';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  constructor(private licenseService: LicenseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(async () => {
        // If guard set feature usage in request context, increment it
        if (request.featureUsage) {
          const { feature, amount } = request.featureUsage;
          await this.licenseService.incrementFeatureUsage(
            request.user.company_id,
            feature,
            amount
          );
        }
      })
    );
  }
}

// Register globally in main.ts
app.useGlobalInterceptors(app.get(UsageTrackingInterceptor));
```

## Testing Integration

### Test 1: Check Current License

```bash
curl -X GET http://localhost:3000/api/licensing/licenses/current \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "id": "...",
  "company_id": "...",
  "tier": "BASIC",
  "status": "ACTIVE",
  "expires_at": "2024-01-31T00:00:00Z"
}
```

### Test 2: Check Feature Access

```bash
curl -X POST http://localhost:3000/api/licensing/licenses/check-feature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feature_name": "analytics"}'
```

Response:
```json
{
  "allowed": false,
  "message": "Feature analytics is not available in your license tier"
}
```

### Test 3: Access Protected Endpoint (BASIC tier)

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer BASIC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Engineer"}'
```

Response:
```json
{
  "statusCode": 403,
  "message": "License tier BASIC does not meet required tier PREMIUM"
}
```

### Test 4: Access Protected Endpoint (PREMIUM tier)

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer PREMIUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Engineer"}'
```

Response: 201 Created with job data

## Troubleshooting

### Issue: "Company context required"
**Cause**: TenantGuard not extracting company_id from JWT
**Solution**: Ensure TenantGuard is applied first, before licensing guards

### Issue: "License not found"
**Cause**: Company doesn't have a license record
**Solution**: Run seed script or manually create license via API

### Issue: "Feature X is not available in your license tier"
**Cause**: Feature not in tier definition
**Solution**: Check tier features in `LicenseService.getTierFeatures()`

### Issue: "Feature flag is not currently enabled"
**Cause**: Flag not enabled or company excluded
**Solution**: Check flag status and company targeting in FeatureFlagService

## File Locations

```
src/licensing/
├── entities/
│   ├── license.entity.ts
│   ├── license-feature.entity.ts
│   ├── feature-flag.entity.ts
│   └── feature-flag-usage.entity.ts
├── repositories/
├── services/
├── guards/
├── decorators/
├── dtos/
├── controllers/
└── licensing.module.ts

src/database/
├── migrations/
│   ├── 1704067225000-CreateLicensesTable.ts
│   ├── 1704067226000-CreateLicenseFeaturesTable.ts
│   ├── 1704067227000-CreateFeatureFlagsTable.ts
│   └── 1704067228000-CreateFeatureFlagUsageTable.ts
└── seeds/
    └── default-licenses-features.seed.ts
```

## Decorator Reference

| Decorator | Usage | Effect |
|-----------|-------|--------|
| `@RequireLicense('PREMIUM')` | Route/method | Company must have PREMIUM+ tier |
| `@RequireFeature('analytics')` | Route/method | Feature must be enabled + in tier |
| `@LimitUsage('jobs', 1)` | Route/method | Enforce usage quota |

## API Endpoints Reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/licensing/licenses/current` | Get company license |
| GET | `/api/licensing/licenses/status` | Check license status |
| POST | `/api/licensing/licenses/check-feature` | Check feature access |
| GET | `/api/licensing/licenses/features` | Get all features with usage |
| PUT | `/api/licensing/licenses/:id/upgrade` | Upgrade license (admin) |
| GET | `/api/licensing/feature-flags/:name/check` | Check if flag enabled |
| GET | `/api/licensing/feature-flags/enabled/list` | List enabled features |

## Environment Setup

Ensure your database supports:
- UUID type (for PostgreSQL, use `uuid-ossp` extension)
- JSONB type (for flexible configuration storage)
- Soft delete pattern (includes `deleted_at` column)

## Next: Integrate with Business Modules

Once licensing is integrated, add to business endpoints:

```typescript
// Jobs
@Post('jobs')
@RequireFeature('jobs')
@LimitUsage('jobs', 1)

// Candidates
@Post('candidates')
@RequireFeature('candidates')
@LimitUsage('candidates', 1)

// Custom Fields
@Post('custom-fields')
@RequireFeature('custom_fields')
@LimitUsage('custom_fields', 1)

// Pipelines
@Post('pipelines')
@RequireFeature('pipelines')
@LimitUsage('pipelines', 1)

// Analytics (PREMIUM+)
@Get('analytics')
@RequireLicense('PREMIUM')
@RequireFeature('analytics')

// Webhooks (PREMIUM+)
@Post('webhooks')
@RequireLicense('PREMIUM')
@RequireFeature('webhooks')

// Custom Integrations (ENTERPRISE)
@Post('integrations')
@RequireLicense('ENTERPRISE')
@RequireFeature('custom_integrations')
```

## Performance Tips

1. **Cache license checks** per request
2. **Use feature flags** for gradual rollouts instead of code deployments
3. **Monitor audit logs** for license violations
4. **Set monthly reset** for usage counters
5. **Test tier transitions** for feature availability changes

## Support

For detailed documentation, see: `LICENSING_IMPLEMENTATION.md`
For phase summary, see: `PHASE_3_COMPLETION_SUMMARY.md`
