# Custom Field Engine - Integration Checklist

## Pre-Integration Verification

- [ ] Read CUSTOM_FIELD_ENGINE.md (specification)
- [ ] Read CUSTOM_FIELD_ENGINE_IMPLEMENTATION.md (implementation guide)
- [ ] Review PHASE_4_COMPLETION_SUMMARY.md (what was built)
- [ ] Review CUSTOM_FIELD_ENGINE_QUICK_REFERENCE.md (quick reference)
- [ ] All 22 files created successfully
- [ ] No syntax errors in any files

## Module Integration

### Add to AppModule

```typescript
// src/app.module.ts
import { CustomFieldsModule } from './custom-fields/custom-fields.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(/* config */),
    // ... other modules
    CustomFieldsModule,  // ADD THIS
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] Import CustomFieldsModule in AppModule
- [ ] Verify no circular dependencies
- [ ] Check that LicensingModule is available (required by CustomFieldsModule)

### Verify Dependencies

The CustomFieldsModule requires:
- [ ] TypeOrmModule configured
- [ ] LicensingModule imported (for FeatureFlagService)
- [ ] Existing TenantGuard available
- [ ] Existing AuditService available

## Database Integration

### Run Migrations

```bash
# In order
npm run typeorm migration:run -- -d src/database/data-source.ts
```

Or update your data-source.ts to include migrations:

```typescript
import { CreateCustomFieldsTable1704067229000 } from './migrations/1704067229000-CreateCustomFieldsTable';
import { CreateCustomFieldValuesTable1704067230000 } from './migrations/1704067230000-CreateCustomFieldValuesTable';
import { CreateCustomFieldGroupsTable1704067231000 } from './migrations/1704067231000-CreateCustomFieldGroupsTable';

export const dataSource = new DataSource({
  migrations: [
    CreateCustomFieldsTable1704067229000,
    CreateCustomFieldValuesTable1704067230000,
    CreateCustomFieldGroupsTable1704067231000,
  ],
});
```

- [ ] Add migrations to data-source.ts
- [ ] Run migrations successfully
- [ ] Verify tables created:
  - [ ] custom_fields table exists
  - [ ] custom_field_values table exists
  - [ ] custom_field_groups table exists
- [ ] Verify indices created
- [ ] Verify foreign keys created

### Run Seeds

```typescript
// src/database/index.ts or seed runner
import { seedCustomFields } from './seeds/default-custom-fields.seed';

export async function runSeeds(dataSource: DataSource) {
  await seedCustomFields(dataSource);
}
```

- [ ] Import seedCustomFields
- [ ] Run seed function
- [ ] Verify 31 default custom fields created
- [ ] Check custom_fields table has data

## Feature Flag Integration

### Verify Licensing Module

The custom_fields feature must be defined in your licensing system:

```typescript
// In licensing seeding or feature flag configuration
await featureFlagService.enableFeature(
  companyId,
  'custom_fields',
  'BASIC'  // or relevant tier
);
```

- [ ] 'custom_fields' feature flag exists in licensing system
- [ ] Feature is enabled for test company
- [ ] Feature is in BASIC tier (or your minimum tier)
- [ ] FeatureFlagService is properly injected in CustomFieldFeatureGuard

### Test Feature Flag

```bash
curl -X POST http://localhost:3000/api/v1/custom-fields \
  -H "Authorization: Bearer TOKEN_WITHOUT_FEATURE" \
  -d '{...}'
# Should return 403 ForbiddenException
```

- [ ] Routes with @RequireCustomFields() return 403 when flag disabled
- [ ] Routes allow requests when flag enabled

## API Endpoint Verification

Test all 8 endpoints:

### Field Management Endpoints

```bash
# 1. CREATE FIELD
curl -X POST http://localhost:3000/api/v1/custom-fields \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Field",
    "entityType": "candidate",
    "fieldType": "text",
    "isRequired": false
  }'
# Expected: 201 Created with field data
```
- [ ] POST /api/v1/custom-fields works
- [ ] Returns created field with id, slug, timestamps

```bash
# 2. LIST FIELDS
curl -X GET "http://localhost:3000/api/v1/custom-fields?entityType=candidate" \
  -H "Authorization: Bearer TOKEN"
# Expected: 200 OK with array of fields
```
- [ ] GET /api/v1/custom-fields?entityType=candidate works
- [ ] Returns only fields for specified entity type
- [ ] Returns ordered by display_order
- [ ] Filters out is_active=false

```bash
# 3. GET SINGLE FIELD
curl -X GET http://localhost:3000/api/v1/custom-fields/FIELD_ID \
  -H "Authorization: Bearer TOKEN"
# Expected: 200 OK with field details
```
- [ ] GET /api/v1/custom-fields/:fieldId works
- [ ] Returns 404 for nonexistent field
- [ ] Includes validation_rules and options

```bash
# 4. UPDATE FIELD
curl -X PUT http://localhost:3000/api/v1/custom-fields/FIELD_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "displayOrder": 5
  }'
# Expected: 200 OK with updated field
```
- [ ] PUT /api/v1/custom-fields/:fieldId works
- [ ] Partial updates work (not all fields required)
- [ ] Returns updated field

```bash
# 5. DELETE FIELD
curl -X DELETE http://localhost:3000/api/v1/custom-fields/FIELD_ID \
  -H "Authorization: Bearer TOKEN"
# Expected: 204 No Content
```
- [ ] DELETE /api/v1/custom-fields/:fieldId works
- [ ] Returns 204 No Content
- [ ] Performs soft delete (deleted_at set)
- [ ] Values remain but orphaned

### Value Management Endpoints

```bash
# 6. SET VALUE
curl -X POST http://localhost:3000/api/v1/custom-fields/FIELD_ID/candidate/ENTITY_ID/values \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "John Doe"}'
# Expected: 201 Created with value stored
```
- [ ] POST /api/v1/custom-fields/:fieldId/:entityType/:entityId/values works
- [ ] Validates value against field type and validation rules
- [ ] Stores in correct column (value_text, value_number, etc.)
- [ ] Returns 400 for validation errors

```bash
# 7. GET VALUE
curl -X GET http://localhost:3000/api/v1/custom-fields/FIELD_ID/candidate/ENTITY_ID/value \
  -H "Authorization: Bearer TOKEN"
# Expected: 200 OK with { value: ... }
```
- [ ] GET /api/v1/custom-fields/:fieldId/:entityType/:entityId/value works
- [ ] Returns 404 if value not set
- [ ] Returns correct value type

```bash
# 8. GET ALL VALUES FOR ENTITY
curl -X GET http://localhost:3000/api/v1/custom-fields/candidate/ENTITY_ID/values \
  -H "Authorization: Bearer TOKEN"
# Expected: 200 OK with { slug: value, slug: value, ... }
```
- [ ] GET /api/v1/custom-fields/:entityType/:entityId/values works
- [ ] Returns all custom field values for entity as { slug: value } map
- [ ] Omits null values
- [ ] Orders by display_order

```bash
# 9. BULK SET VALUES
curl -X POST http://localhost:3000/api/v1/custom-fields/FIELD_ID/candidate/bulk-values \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityIds": ["entity1", "entity2", "entity3"],
    "value": "bulk_value"
  }'
# Expected: 200 OK with { updated: 3, failed: 0, errors: {} }
```
- [ ] POST /api/v1/custom-fields/:fieldId/:entityType/bulk-values works
- [ ] Sets value for multiple entities
- [ ] Returns update count and error details
- [ ] Validates each value independently

## Validation Testing

Test validation across field types:

```bash
# TEXT - minLength validation
curl -X POST http://localhost:3000/api/v1/custom-fields/FIELD_ID/candidate/ENTITY_ID/values \
  -d '{"value": "a"}' # If minLength: 2
# Expected: 400 with validation error
```
- [ ] Text validation (minLength, maxLength, pattern) works
- [ ] Number validation (min, max) works
- [ ] Date validation (past/future dates) works
- [ ] Email validation works
- [ ] URL validation works
- [ ] Phone validation works
- [ ] Select validation (options exist) works
- [ ] Multiselect validation (array of valid options) works
- [ ] Rating validation (1-5) works
- [ ] Boolean validation works
- [ ] Required field validation works
- [ ] Unique field validation works
- [ ] Custom error messages display correctly

## Tenant Isolation Testing

Verify multi-tenancy:

```bash
# Create field in company A
curl -X POST http://localhost:3000/api/v1/custom-fields \
  -H "Authorization: Bearer TOKEN_COMPANY_A" \
  -d '{"name": "Field A", ...}'
# Returns field_a_id

# Try to access from company B with same field ID
curl -X GET http://localhost:3000/api/v1/custom-fields/field_a_id \
  -H "Authorization: Bearer TOKEN_COMPANY_B"
# Expected: 404 Not Found or 403 Forbidden
```

- [ ] Fields isolated by company_id
- [ ] Values isolated by company_id
- [ ] Can't access another company's fields
- [ ] Can't access another company's values
- [ ] Slug uniqueness only per company

## Error Handling Testing

Test error responses:

```bash
# 403 - Feature Disabled
curl -X POST http://localhost:3000/api/v1/custom-fields \
  -H "Authorization: Bearer TOKEN_WITHOUT_FEATURE"
# Expected: 403 Forbidden - "Custom fields feature is not enabled"

# 400 - Validation Error
curl -X POST http://localhost:3000/api/v1/custom-fields/FIELD_ID/candidate/ENTITY_ID/values \
  -d '{"value": "invalid"}'
# Expected: 400 Bad Request with validation errors

# 404 - Not Found
curl -X GET http://localhost:3000/api/v1/custom-fields/NONEXISTENT_ID
# Expected: 404 Not Found
```

- [ ] 400 Bad Request - validation errors detailed
- [ ] 403 Forbidden - feature not enabled
- [ ] 404 Not Found - field not found
- [ ] 500 Internal Server Error - logs properly
- [ ] Error messages are clear and actionable

## Integration with Business Entities

### Candidates Module Integration

- [ ] Import CustomFieldsService in CandidateService
- [ ] Add customFields to GetCandidateDto
- [ ] When retrieving candidate, include custom fields:
  ```typescript
  const customFields = await this.customFieldsService.getEntityValues(
    companyId, 'candidate', candidateId
  );
  return { ...candidate, customFields };
  ```
- [ ] When creating candidate, save custom field values if provided
- [ ] Test create/read/update candidate with custom fields

### Jobs Module Integration

- [ ] Import CustomFieldsService in JobService
- [ ] Add customFields to GetJobDto
- [ ] Retrieve job with custom fields
- [ ] Test create/read/update job with custom fields

### Applications Module Integration

- [ ] Import CustomFieldsService in ApplicationService
- [ ] Add customFields to GetApplicationDto
- [ ] Retrieve application with custom fields
- [ ] Test with interview feedback, status, notes

### Users Module Integration (If Needed)

- [ ] Verify user entity supports custom_fields
- [ ] Create user profile custom fields in seed data
- [ ] Test user custom field operations

## Audit Trail Testing

Verify audit logging:

```bash
# After creating a field
SELECT * FROM audits 
WHERE entity_type = 'CustomField' 
AND action = 'CREATE'
ORDER BY created_at DESC LIMIT 1;
# Expected: Row with user_id, changes recorded
```

- [ ] Field creation logged
- [ ] Field update logged
- [ ] Field deletion logged (soft delete)
- [ ] Value set operations logged
- [ ] Bulk operations logged with entity count
- [ ] Audit entries have user_id
- [ ] Audit entries have before/after changes

## Performance Testing

### Load Testing

```bash
# Create 100 fields
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/v1/custom-fields \
    -d "{\"name\": \"Field $i\", ...}"
done
```

- [ ] Can create many fields without performance degradation
- [ ] Bulk set values across 1000+ entities
- [ ] Query by entity type returns quickly
- [ ] Index usage is efficient

### Database Query Performance

- [ ] Verify custom_fields table has all indices
- [ ] Verify custom_field_values table has all indices
- [ ] Check query plans for entity_id lookups
- [ ] Monitor long-running queries

## Documentation Review

- [ ] CUSTOM_FIELD_ENGINE.md is accurate
- [ ] CUSTOM_FIELD_ENGINE_IMPLEMENTATION.md is accurate
- [ ] PHASE_4_COMPLETION_SUMMARY.md is complete
- [ ] CUSTOM_FIELD_ENGINE_QUICK_REFERENCE.md is helpful
- [ ] API documentation updated with new endpoints
- [ ] Integration guide accessible to team

## Team Readiness

- [ ] Team has access to documentation
- [ ] Team trained on custom field concepts
- [ ] Team understands when to use custom fields vs schema changes
- [ ] Team aware of feature flag requirement
- [ ] Team aware of tenant isolation
- [ ] Support documentation available

## Production Readiness

### Pre-Deployment

- [ ] All tests passing (unit, integration, e2e)
- [ ] Code reviewed and approved
- [ ] No syntax errors or warnings
- [ ] No breaking changes to existing APIs
- [ ] Migrations tested on staging database
- [ ] Seed data reviewed and approved
- [ ] Feature flag tested on/off
- [ ] Performance benchmarks acceptable

### Deployment

- [ ] Backup database before migration
- [ ] Run migrations in maintenance window
- [ ] Run seed data
- [ ] Verify tables and data created
- [ ] Enable feature flag for pilot companies
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Rollout plan documented

### Post-Deployment

- [ ] Verify all endpoints working
- [ ] Test with real data
- [ ] Monitor audit logs
- [ ] Check database disk space
- [ ] Verify feature flag enforcement
- [ ] Document any issues
- [ ] Plan rollout to all companies

## Rollback Plan

If issues discovered:

```bash
# Option 1: Disable feature flag
await featureFlagService.disableFeature(companyId, 'custom_fields');

# Option 2: Revert migrations (data loss!)
npm run typeorm migration:revert

# Option 3: Restore database backup
# (better to have backup before migration)
```

- [ ] Backup strategy documented
- [ ] Rollback steps clear
- [ ] Communication plan if issues arise

## Sign-Off

- [ ] ______________________ (Developer) - Implementation reviewed
- [ ] ______________________ (Reviewer) - Code approved
- [ ] ______________________ (QA) - Testing complete
- [ ] ______________________ (DevOps) - Deployment ready
- [ ] ______________________ (Product) - Feature approved for release

## Final Verification

Run this final check:

```typescript
// Test all major flows
async testCompleteFlow() {
  const companyId = 'test-company';
  const userId = 'test-user';
  
  // 1. Create field
  const field = await customFieldsService.createField(companyId, userId, {
    name: 'Test',
    entityType: 'candidate',
    fieldType: 'text'
  });
  
  // 2. Set value
  await customFieldsService.setFieldValue(
    companyId, userId, field.id, 'candidate', 'entity123', 'test value'
  );
  
  // 3. Get value
  const value = await customFieldsService.getFieldValue(
    companyId, field.id, 'candidate', 'entity123'
  );
  
  // 4. Get all values
  const allValues = await customFieldsService.getEntityValues(
    companyId, 'candidate', 'entity123'
  );
  
  // 5. Update field
  await customFieldsService.updateField(
    companyId, field.id, userId, { description: 'Updated' }
  );
  
  // 6. Delete field
  await customFieldsService.deleteField(companyId, field.id, userId);
  
  console.log('✅ All flows working!');
}
```

- [ ] testCompleteFlow() passes
- [ ] No console errors
- [ ] All database operations successful

---

**Checklist Status**: ☐ Not Started | ⊙ In Progress | ✓ Complete

**Integration Date**: _____________  
**Deployed By**: _____________  
**Verified By**: _____________
