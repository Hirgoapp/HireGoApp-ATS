# Custom Field Engine Implementation

## Overview

The Custom Field Engine enables companies to define and track custom data on core entities (candidates, jobs, applications, users) without database schema changes. All custom data is stored in JSONB columns with metadata-driven validation and type enforcement.

## Architecture

```
Request
    ↓
TenantGuard (extract company_id)
    ↓
CustomFieldFeatureGuard (check custom_fields feature flag)
    ↓
CustomFieldsService
    ├─ CustomFieldValidationService (validate values)
    ├─ CustomFieldRepository (manage definitions)
    └─ CustomFieldValueRepository (manage values)
    ↓
Response
```

## Database Schema

### Table: custom_fields

Stores field definitions per company.

```sql
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL,  -- candidate, job, application, user
  field_type VARCHAR(50) NOT NULL,   -- text, number, date, select, etc.
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}',
  display_order INT DEFAULT 0,
  visibility_settings JSONB,
  options JSONB DEFAULT '[]',  -- For select/multiselect
  is_active BOOLEAN DEFAULT true,
  is_searchable BOOLEAN DEFAULT true,
  created_by_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  UNIQUE (company_id, slug, entity_type),
  INDEX: (company_id, entity_type, is_active),
  INDEX: (company_id, display_order)
);
```

### Table: custom_field_values

Stores field values per entity.

```sql
CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  custom_field_id UUID NOT NULL FK → custom_fields,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  value_text TEXT,           -- Text, email, url, phone, select, rich_text
  value_number DECIMAL,      -- Number, currency, rating
  value_date DATE,           -- Date only
  value_datetime TIMESTAMP,  -- Date + time
  value_boolean BOOLEAN,     -- Yes/No
  value_json JSONB,          -- Arrays (multiselect), complex data
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  UNIQUE (company_id, custom_field_id, entity_type, entity_id),
  INDEX: (company_id, custom_field_id),
  INDEX: (company_id, entity_type, entity_id),
  INDEX: (company_id, value_text) WHERE value_text IS NOT NULL
);
```

### Table: custom_field_groups

Organizes fields into logical sections.

```sql
CREATE TABLE custom_field_groups (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  UNIQUE (company_id, name, entity_type)
);
```

## Field Types

| Type | Storage | Use Case | Examples |
|------|---------|----------|----------|
| text | value_text | Single-line text | Name, city, title |
| textarea | value_text | Multi-line text | Notes, comments, bio |
| number | value_number | Integer/decimal | Age, experience, count |
| date | value_date | Date only | Birth date, availability |
| datetime | value_datetime | Date + time | Application time, interview |
| boolean | value_boolean | Yes/No | Certified, visa sponsorship |
| select | value_text | Single option | Status, level, department |
| multiselect | value_json (array) | Multiple options | Skills, certifications |
| url | value_text | Web link | Portfolio, GitHub, LinkedIn |
| email | value_text | Email address | Backup email, contact |
| phone | value_text | Phone number | Mobile, home, office |
| currency | value_number | Money amount | Salary, budget, fee |
| rating | value_number | 1-5 stars | Quality, satisfaction |
| rich_text | value_text | Formatted text | Description with formatting |

## Validation Rules

Validation rules are flexible and type-specific:

```typescript
// Text validation
{
  minLength?: number;
  maxLength?: number;
  pattern?: string;  // Regex
  customErrorMessage?: string;
}

// Number validation
{
  min?: number;
  max?: number;
  decimalPlaces?: number;
}

// Date validation
{
  disablePastDates?: boolean;
  disableFutureDates?: boolean;
  minDate?: string;  // ISO 8601
  maxDate?: string;
}

// Select validation
{
  allowCustomOptions?: boolean;  // Allow entries not in options
}
```

## Service Layer

### CustomFieldsService

Main service for field and value management.

```typescript
// Field operations
async createField(companyId, userId, dto): CustomField
async getFieldsByEntity(companyId, entityType): CustomField[]
async getField(companyId, fieldId): CustomField
async updateField(companyId, fieldId, userId, dto): CustomField
async deleteField(companyId, fieldId, userId): void

// Value operations
async setFieldValue(companyId, userId, fieldId, entityType, entityId, value): CustomFieldValue
async getFieldValue(companyId, fieldId, entityType, entityId): any
async getEntityValues(companyId, entityType, entityId): Record<string, any>
async bulkSetValues(companyId, userId, fieldId, entityType, entityIds, value): {updated, failed, errors}
```

### CustomFieldValidationService

Validates field values against configuration.

```typescript
validateValue(
  value: any,
  fieldType: CustomFieldType,
  validationRules: ValidationRules,
  options: FieldOption[],
  isRequired: boolean
): ValidationResult
```

## API Endpoints

### Field Management

```
POST   /api/v1/custom-fields
  Create new field
  Body: { name, description?, entityType, fieldType, isRequired?, isUnique?, validationRules?, options?, displayOrder? }
  Response: { success, data: CustomField }

GET    /api/v1/custom-fields?entityType=candidate
  List fields for entity type
  Response: { success, data: CustomField[], count }

GET    /api/v1/custom-fields/:fieldId
  Get single field
  Response: { success, data: CustomField }

PUT    /api/v1/custom-fields/:fieldId
  Update field
  Body: { ...partial CustomField properties }
  Response: { success, data: CustomField }

DELETE /api/v1/custom-fields/:fieldId
  Delete field (soft delete)
  Response: 204 No Content
```

### Value Management

```
POST   /api/v1/custom-fields/:fieldId/:entityType/:entityId/values
  Set value for field on entity
  Body: { value: any }
  Response: { success, data: CustomFieldValue }

GET    /api/v1/custom-fields/:fieldId/:entityType/:entityId/value
  Get value for field on entity
  Response: { success, data: { value: any } }

GET    /api/v1/custom-fields/:entityType/:entityId/values
  Get all custom field values for entity
  Response: { success, data: { slug: value, ... } }

POST   /api/v1/custom-fields/:fieldId/:entityType/bulk-values
  Set value for multiple entities
  Body: { entityIds: string[], value: any }
  Response: { success, data: { updated, failed, errors } }
```

## Example API Flows

### Create Field: Years of Experience

```http
POST /api/v1/custom-fields
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Years of Experience",
  "description": "Total years of professional experience",
  "entityType": "candidate",
  "fieldType": "number",
  "isRequired": true,
  "validationRules": {
    "min": 0,
    "max": 70
  },
  "displayOrder": 5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cf_123",
    "companyId": "comp_456",
    "name": "Years of Experience",
    "slug": "years_of_experience",
    "fieldType": "number",
    "entityType": "candidate",
    "isRequired": true,
    "validationRules": { "min": 0, "max": 70 },
    "createdAt": "2025-01-01T10:00:00Z"
  }
}
```

### Set Field Value

```http
POST /api/v1/custom-fields/cf_123/candidate/cand_456/values
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": 8
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cfv_789",
    "customFieldId": "cf_123",
    "entityType": "candidate",
    "entityId": "cand_456",
    "valueNumber": 8,
    "updatedAt": "2025-01-01T10:05:00Z"
  }
}
```

### Get Entity with All Custom Fields

```http
GET /api/v1/custom-fields/candidate/cand_456/values
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "years_of_experience": 8,
    "certifications": ["aws", "kubernetes"],
    "availability_date": "2025-02-01",
    "linkedin_url": "https://linkedin.com/in/johndoe"
  }
}
```

### Bulk Set Values

```http
POST /api/v1/custom-fields/cf_status/candidate/bulk-values
Authorization: Bearer <token>
Content-Type: application/json

{
  "entityIds": ["cand_1", "cand_2", "cand_3"],
  "value": "rejected"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "updated": 3,
    "failed": 0,
    "errors": {}
  }
}
```

## Validation Examples

### Text Field with Pattern

```json
{
  "name": "LinkedIn Profile",
  "fieldType": "url",
  "validationRules": {
    "pattern": "^https:\\/\\/linkedin\\.com\\/in\\/",
    "customErrorMessage": "Must be a valid LinkedIn profile URL"
  }
}
```

### Select Field with Options

```json
{
  "name": "Job Status",
  "fieldType": "select",
  "options": [
    { "id": "draft", "label": "Draft" },
    { "id": "open", "label": "Open" },
    { "id": "closed", "label": "Closed" }
  ]
}
```

### Multiselect Field

```json
{
  "name": "Certifications",
  "fieldType": "multiselect",
  "options": [
    { "id": "aws", "label": "AWS Certified", "color": "#FF9900" },
    { "id": "gcp", "label": "GCP Certified", "color": "#4285F4" },
    { "id": "azure", "label": "Azure Certified", "color": "#0078D4" }
  ]
}
```

## Integration Guide

### 1. Import Module

```typescript
// app.module.ts
import { CustomFieldsModule } from './custom-fields/custom-fields.module';

@Module({
  imports: [CustomFieldsModule, /* ... */]
})
export class AppModule {}
```

### 2. Use in Business Logic

```typescript
// candidate.service.ts
import { CustomFieldsService } from './custom-fields/services/custom-fields.service';

@Injectable()
export class CandidateService {
  constructor(
    private customFieldsService: CustomFieldsService
  ) {}

  async getCandidate(companyId: string, candidateId: string) {
    const candidate = await this.repository.findOne(candidateId);
    
    // Include custom fields
    const customFields = await this.customFieldsService.getEntityValues(
      companyId,
      'candidate',
      candidateId
    );

    return {
      ...candidate,
      customFields
    };
  }

  async createCandidate(companyId: string, userId: string, dto: CreateCandidateDto) {
    const candidate = await this.repository.create(dto);

    // Set custom field values if provided
    if (dto.customFields) {
      const fields = await this.customFieldsService.getFieldsByEntity(
        companyId,
        'candidate'
      );

      for (const field of fields) {
        if (dto.customFields[field.slug] !== undefined) {
          await this.customFieldsService.setFieldValue(
            companyId,
            userId,
            field.id,
            'candidate',
            candidate.id,
            dto.customFields[field.slug]
          );
        }
      }
    }

    return candidate;
  }
}
```

### 3. Add Decorators to Routes (Feature Flag Control)

```typescript
import { RequireCustomFields } from './custom-fields/decorators/require-custom-fields.decorator';

@Post('candidates')
@RequireCustomFields()  // Checks custom_fields feature flag
async createCandidate(@Body() dto: CreateCandidateDto) {
  // Will be blocked if feature is not enabled
}
```

## Error Handling

### Validation Errors

When validation fails, returns 400 with details:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    { "field": "value", "message": "Minimum value is 0" }
  ]
}
```

### Common Errors

| Status | Message | Cause |
|--------|---------|-------|
| 403 | Custom fields feature is not enabled | Feature flag disabled |
| 404 | Custom field not found | Field ID doesn't exist |
| 400 | Field type mismatch | Entity type doesn't match |
| 400 | Options required for select fields | Missing options for select/multiselect |
| 400 | This value must be unique | Uniqueness constraint violated |

## Performance Considerations

- **Field definitions**: Cached per request to avoid multiple DB hits
- **Value storage**: Type-specific columns for efficient queries
- **Searchability**: Index on value_text for full-text search capability
- **Bulk operations**: Batch insert/update for performance
- **Soft deletes**: Preserve audit trail while logically deleting

## Security

- **Tenant Isolation**: All operations scoped to company_id
- **Feature Control**: Disabled via licensing/feature flags
- **Validation**: All values validated before storage
- **Audit Trail**: All changes logged with user_id
- **RBAC**: Respect existing role-based access control

## Files Created

### Entities (3)
- `custom-field.entity.ts` - Field definitions
- `custom-field-value.entity.ts` - Field values
- `custom-field-group.entity.ts` - Field organization

### Repositories (3)
- `custom-field.repository.ts` - Field CRUD
- `custom-field-value.repository.ts` - Value CRUD
- `custom-field-group.repository.ts` - Group CRUD

### Services (2)
- `custom-fields.service.ts` - Main business logic
- `custom-field-validation.service.ts` - Validation engine

### Guards & Decorators (2)
- `custom-field-feature.guard.ts` - Feature flag enforcement
- `require-custom-fields.decorator.ts` - Route metadata

### DTOs (4)
- `create-custom-field.dto.ts` - Create field
- `update-custom-field.dto.ts` - Update field
- `set-custom-field-value.dto.ts` - Set value
- `bulk-set-custom-field-values.dto.ts` - Bulk set

### Controller (1)
- `custom-fields.controller.ts` - API endpoints

### Module (1)
- `custom-fields.module.ts` - Module configuration

### Migrations (3)
- `1704067229000-CreateCustomFieldsTable.ts`
- `1704067230000-CreateCustomFieldValuesTable.ts`
- `1704067231000-CreateCustomFieldGroupsTable.ts`

## Next Steps

1. Import `CustomFieldsModule` in `AppModule`
2. Run migrations to create tables
3. Integrate with candidate/job/application services
4. Add custom field support to entity endpoints
5. Create seed data with sample fields
6. Test with various field types and validations
7. Monitor usage via audit logs

## Testing

Test with multiple field types:
- Text: "John"
- Number: 8
- Date: "2025-01-15"
- Select: "aws"
- Multiselect: ["aws", "gcp"]
- Boolean: true
- Currency: 150000

Validate:
- Required fields
- Unique constraints
- Type validation
- Custom patterns
- Range validation
- Tenant isolation
