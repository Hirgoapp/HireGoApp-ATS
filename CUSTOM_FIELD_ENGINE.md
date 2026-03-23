# ATS SaaS - Custom Field Engine Design

## Overview

The Custom Field Engine enables companies to define and track custom data on core entities (candidates, jobs, applications) without schema changes. This document covers the design, database schema, validation rules, and API flows.

**Scope**: Custom fields for Candidates, Jobs, Applications, Users  
**Type**: Extensible metadata engine  
**Approach**: JSONB columns + separate metadata tables

---

## 1. Custom Fields Concept

### Why Custom Fields?

Different companies track different information:

```
Company A (Tech Startup):
  • Coding Language Preference (checkbox list)
  • GitHub Profile (URL)
  • Years with Python (number)

Company B (Healthcare Recruiter):
  • Certifications (multi-select)
  • License Expiration (date)
  • Shift Preference (radio)

Company C (Finance):
  • CPA Status (yes/no)
  • Years in Current Role (number)
  • Salary Expectation (currency)
```

**Benefit**: No database schema changes per company - all stored in JSONB

### Custom Field Types

```typescript
enum CustomFieldType {
  TEXT = 'text',                    // Single-line text
  TEXTAREA = 'textarea',            // Multi-line text
  NUMBER = 'number',               // Integer or decimal
  DATE = 'date',                   // Date only
  DATETIME = 'datetime',           // Date + time
  BOOLEAN = 'boolean',             // Yes/No checkbox
  SELECT = 'select',               // Dropdown (single)
  MULTISELECT = 'multiselect',     // Checkboxes (multiple)
  URL = 'url',                     // URL validation
  EMAIL = 'email',                 // Email validation
  PHONE = 'phone',                 // Phone validation
  CURRENCY = 'currency',           // Money amount
  RATING = 'rating',               // 1-5 stars
  RICH_TEXT = 'rich_text'          // Formatted text
}

enum CustomFieldEntity {
  CANDIDATE = 'candidate',
  JOB = 'job',
  APPLICATION = 'application',
  USER = 'user'
}
```

---

## 2. Database Schema

### Table 1: custom_fields (Field Definitions)

```sql
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Field Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,        -- URL-friendly identifier
  description TEXT,
  entity_type VARCHAR(50) NOT NULL,  -- candidate, job, application, user
  
  -- Field Configuration
  field_type VARCHAR(50) NOT NULL,   -- text, number, select, etc
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,   -- Enforce uniqueness per company
  
  -- Validation Rules
  validation_rules JSONB DEFAULT '{}', -- Type-specific validation
  
  -- Display Configuration
  display_order INT DEFAULT 0,        -- Order on forms
  visibility_settings JSONB DEFAULT '{"show_in_list": true, "show_in_profile": true}',
  
  -- Options (for select/multiselect)
  options JSONB DEFAULT '[]',        -- [{"id": "opt1", "label": "Option 1", "color": "#fff"}, ...]
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_searchable BOOLEAN DEFAULT true, -- Enable full-text search on this field
  
  -- Metadata
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE (company_id, slug, entity_type),
  INDEX: (company_id, entity_type, is_active),
  INDEX: (company_id, display_order)
);
```

### Table 2: custom_field_values (Field Values)

```sql
CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Field Reference
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  
  -- Entity Reference (dynamic based on field type)
  entity_type VARCHAR(50) NOT NULL,  -- candidate, job, application
  entity_id UUID NOT NULL,           -- ID of the entity
  
  -- Value Storage
  value_text VARCHAR(MAX),           -- For text/textarea/email/url
  value_number DECIMAL(18, 4),       -- For numbers/currency
  value_date DATE,                   -- For dates
  value_datetime TIMESTAMP,          -- For datetimes
  value_boolean BOOLEAN,             -- For yes/no
  value_json JSONB,                  -- For arrays (multiselect), complex data
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (company_id, custom_field_id, entity_type, entity_id),
  INDEX: (company_id, custom_field_id),
  INDEX: (company_id, entity_type, entity_id),
  INDEX: (company_id, value_text) WHERE value_text IS NOT NULL,
  FOREIGN KEY: Ensure entity exists (handled at application level)
);
```

### Table 3: custom_field_groups (Organization)

```sql
CREATE TABLE custom_field_groups (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,        -- e.g., "Technical Skills", "Location"
  description TEXT,
  entity_type VARCHAR(50) NOT NULL,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (company_id, name, entity_type)
);

-- Link custom_fields to groups
ALTER TABLE custom_fields ADD COLUMN custom_field_group_id UUID REFERENCES custom_field_groups(id) ON DELETE SET NULL;
```

---

## 3. Validation Rules Configuration

### Validation Schema

```typescript
// types/custom-field.ts

export interface ValidationRules {
  // Text validation
  minLength?: number;
  maxLength?: number;
  pattern?: string;               // Regex pattern
  
  // Number validation
  min?: number;
  max?: number;
  decimalPlaces?: number;
  
  // Date validation
  minDate?: string;              // ISO 8601
  maxDate?: string;
  disablePastDates?: boolean;
  disableFutureDates?: boolean;
  
  // Select validation
  allowCustomOptions?: boolean;  // Allow entries not in options list
  
  // General
  customErrorMessage?: string;
}

export interface CustomFieldConfig {
  id: string;
  name: string;
  fieldType: CustomFieldType;
  isRequired: boolean;
  validationRules: ValidationRules;
  options?: Array<{ id: string; label: string; color?: string }>;
}
```

### Example Configurations

**Example 1: Years of Experience (Number)**
```json
{
  "id": "exp_years",
  "name": "Years of Experience",
  "fieldType": "number",
  "isRequired": true,
  "validationRules": {
    "min": 0,
    "max": 70,
    "decimalPlaces": 1,
    "customErrorMessage": "Experience must be between 0 and 70 years"
  }
}
```

**Example 2: Certifications (Multiselect)**
```json
{
  "id": "certifications",
  "name": "Certifications",
  "fieldType": "multiselect",
  "isRequired": false,
  "validationRules": {
    "allowCustomOptions": false
  },
  "options": [
    { "id": "aws", "label": "AWS Certified" },
    { "id": "gcp", "label": "GCP Certified" },
    { "id": "azure", "label": "Azure Certified" },
    { "id": "kubernetes", "label": "Kubernetes Certified" }
  ]
}
```

**Example 3: LinkedIn Profile (URL)**
```json
{
  "id": "linkedin_url",
  "name": "LinkedIn Profile",
  "fieldType": "url",
  "isRequired": false,
  "validationRules": {
    "pattern": "^https:\\/\\/linkedin\\.com\\/in\\/",
    "customErrorMessage": "Must be a valid LinkedIn profile URL"
  }
}
```

**Example 4: Availability (Date)**
```json
{
  "id": "availability_date",
  "name": "Available From",
  "fieldType": "date",
  "isRequired": true,
  "validationRules": {
    "disablePastDates": true,
    "minDate": "today"
  }
}
```

---

## 4. Validation Service

### Validation Engine

```typescript
// services/custom-field-validation.service.ts

@Injectable()
export class CustomFieldValidationService {
  constructor(
    private customFieldRepository: Repository<CustomField>,
    private customFieldValueRepository: Repository<CustomFieldValue>
  ) {}

  /**
   * Validate custom field value against field configuration
   */
  async validateValue(
    companyId: string,
    fieldId: string,
    value: any,
    entityId?: string
  ): Promise<ValidationResult> {
    // 1. Load field configuration
    const field = await this.customFieldRepository.findOne({
      where: { id: fieldId, company_id: companyId }
    });

    if (!field) {
      return {
        valid: false,
        errors: [{ field: fieldId, message: 'Field not found' }]
      };
    }

    const errors: ValidationError[] = [];

    // 2. Check required
    if (field.is_required && (value === null || value === undefined || value === '')) {
      errors.push({
        field: field.name,
        message: `${field.name} is required`
      });
      return { valid: false, errors };
    }

    // 3. If not required and empty, pass
    if (value === null || value === undefined || value === '') {
      return { valid: true, errors: [] };
    }

    // 4. Type-specific validation
    const typeErrors = this.validateByType(
      field.field_type,
      value,
      field.validation_rules,
      field.options || []
    );
    errors.push(...typeErrors);

    // 5. Uniqueness validation (if applicable)
    if (field.is_unique && entityId) {
      const existingValue = await this.customFieldValueRepository.findOne({
        where: {
          company_id: companyId,
          custom_field_id: fieldId,
          entity_id: Not(entityId),  // Exclude current entity
          value_text: value
        }
      });

      if (existingValue) {
        errors.push({
          field: field.name,
          message: `${field.name} must be unique`
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateByType(
    fieldType: string,
    value: any,
    rules: ValidationRules,
    options: Array<{ id: string; label: string }>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (fieldType) {
      case 'text':
      case 'textarea':
        errors.push(...this.validateText(value, rules));
        break;

      case 'number':
      case 'currency':
        errors.push(...this.validateNumber(value, rules));
        break;

      case 'date':
        errors.push(...this.validateDate(value, rules));
        break;

      case 'datetime':
        errors.push(...this.validateDateTime(value, rules));
        break;

      case 'url':
        errors.push(...this.validateUrl(value, rules));
        break;

      case 'email':
        errors.push(...this.validateEmail(value));
        break;

      case 'phone':
        errors.push(...this.validatePhone(value));
        break;

      case 'select':
        errors.push(...this.validateSelect(value, options, rules));
        break;

      case 'multiselect':
        errors.push(...this.validateMultiSelect(value, options, rules));
        break;

      case 'boolean':
        errors.push(...this.validateBoolean(value));
        break;

      case 'rating':
        errors.push(...this.validateRating(value));
        break;
    }

    return errors;
  }

  private validateText(value: any, rules: ValidationRules): ValidationError[] {
    const errors: ValidationError[] = [];
    const strValue = String(value).trim();

    if (rules.minLength && strValue.length < rules.minLength) {
      errors.push({
        field: 'value',
        message: `Minimum length is ${rules.minLength} characters`
      });
    }

    if (rules.maxLength && strValue.length > rules.maxLength) {
      errors.push({
        field: 'value',
        message: `Maximum length is ${rules.maxLength} characters`
      });
    }

    if (rules.pattern) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(strValue)) {
        errors.push({
          field: 'value',
          message: rules.customErrorMessage || 'Invalid format'
        });
      }
    }

    return errors;
  }

  private validateNumber(value: any, rules: ValidationRules): ValidationError[] {
    const errors: ValidationError[] = [];

    if (isNaN(value)) {
      errors.push({ field: 'value', message: 'Must be a number' });
      return errors;
    }

    const num = Number(value);

    if (rules.min !== undefined && num < rules.min) {
      errors.push({
        field: 'value',
        message: `Minimum value is ${rules.min}`
      });
    }

    if (rules.max !== undefined && num > rules.max) {
      errors.push({
        field: 'value',
        message: `Maximum value is ${rules.max}`
      });
    }

    return errors;
  }

  private validateDate(value: any, rules: ValidationRules): ValidationError[] {
    const errors: ValidationError[] = [];

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      errors.push({ field: 'value', message: 'Invalid date format' });
      return errors;
    }

    if (rules.disablePastDates && date < new Date(new Date().toDateString())) {
      errors.push({ field: 'value', message: 'Past dates are not allowed' });
    }

    if (rules.disableFutureDates && date > new Date(new Date().toDateString())) {
      errors.push({ field: 'value', message: 'Future dates are not allowed' });
    }

    return errors;
  }

  private validateEmail(value: any): ValidationError[] {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(value))) {
      return [{ field: 'value', message: 'Invalid email format' }];
    }
    return [];
  }

  private validateUrl(value: any, rules: ValidationRules): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      new URL(value);
    } catch {
      errors.push({ field: 'value', message: 'Invalid URL format' });
      return errors;
    }

    if (rules.pattern) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(String(value))) {
        errors.push({
          field: 'value',
          message: rules.customErrorMessage || 'Invalid URL'
        });
      }
    }

    return errors;
  }

  private validateSelect(
    value: any,
    options: Array<{ id: string }>,
    rules: ValidationRules
  ): ValidationError[] {
    const allowCustom = rules.allowCustomOptions !== false;
    const optionIds = options.map(o => o.id);

    if (!allowCustom && !optionIds.includes(String(value))) {
      return [{ field: 'value', message: 'Invalid option selected' }];
    }

    return [];
  }

  private validateMultiSelect(
    value: any,
    options: Array<{ id: string }>,
    rules: ValidationRules
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const allowCustom = rules.allowCustomOptions !== false;
    const optionIds = options.map(o => o.id);

    if (!Array.isArray(value)) {
      return [{ field: 'value', message: 'Must be an array' }];
    }

    for (const item of value) {
      if (!allowCustom && !optionIds.includes(String(item))) {
        errors.push({
          field: 'value',
          message: `Invalid option: ${item}`
        });
      }
    }

    return errors;
  }

  private validateBoolean(value: any): ValidationError[] {
    if (typeof value !== 'boolean' && value !== '0' && value !== '1') {
      return [{ field: 'value', message: 'Must be true or false' }];
    }
    return [];
  }

  private validateRating(value: any): ValidationError[] {
    const num = Number(value);
    if (isNaN(num) || num < 1 || num > 5 || !Number.isInteger(num)) {
      return [{ field: 'value', message: 'Rating must be an integer from 1 to 5' }];
    }
    return [];
  }

  // ... other validation methods
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
```

---

## 5. Custom Field Service

### Main Service

```typescript
// services/custom-fields.service.ts

@Injectable()
export class CustomFieldsService {
  constructor(
    private customFieldRepository: Repository<CustomField>,
    private customFieldValueRepository: Repository<CustomFieldValue>,
    private validationService: CustomFieldValidationService,
    private auditService: AuditService
  ) {}

  /**
   * Create custom field for a company
   */
  async createField(
    companyId: string,
    userId: string,
    dto: CreateCustomFieldDto
  ): Promise<CustomField> {
    // Validate field configuration
    if (dto.fieldType === 'select' || dto.fieldType === 'multiselect') {
      if (!dto.options || dto.options.length === 0) {
        throw new BadRequestException('Options required for select fields');
      }
    }

    const field = this.customFieldRepository.create({
      company_id: companyId,
      created_by_id: userId,
      ...dto,
      slug: this.generateSlug(dto.name)
    });

    const saved = await this.customFieldRepository.save(field);

    // Audit log
    await this.auditService.log(companyId, userId, {
      entityType: 'custom_field',
      entityId: saved.id,
      action: 'CREATE',
      newValues: saved
    });

    return saved;
  }

  /**
   * Get all custom fields for entity type
   */
  async getFieldsByEntity(
    companyId: string,
    entityType: string
  ): Promise<CustomField[]> {
    return this.customFieldRepository.find({
      where: {
        company_id: companyId,
        entity_type: entityType,
        is_active: true,
        deleted_at: IsNull()
      },
      order: { display_order: 'ASC' }
    });
  }

  /**
   * Set custom field value for entity
   */
  async setFieldValue(
    companyId: string,
    userId: string,
    fieldId: string,
    entityType: string,
    entityId: string,
    value: any
  ): Promise<CustomFieldValue> {
    // 1. Load field
    const field = await this.customFieldRepository.findOne({
      where: { id: fieldId, company_id: companyId }
    });

    if (!field) throw new NotFoundException('Field not found');
    if (field.entity_type !== entityType) {
      throw new BadRequestException('Field type mismatch');
    }

    // 2. Validate value
    const validation = await this.validationService.validateValue(
      companyId,
      fieldId,
      value,
      entityId
    );

    if (!validation.valid) {
      throw new BadRequestException(
        validation.errors.map(e => e.message).join(', ')
      );
    }

    // 3. Find or create value record
    let fieldValue = await this.customFieldValueRepository.findOne({
      where: {
        company_id: companyId,
        custom_field_id: fieldId,
        entity_type: entityType,
        entity_id: entityId
      }
    });

    if (!fieldValue) {
      fieldValue = this.customFieldValueRepository.create({
        company_id: companyId,
        custom_field_id: fieldId,
        entity_type: entityType,
        entity_id: entityId
      });
    }

    // 4. Store value in appropriate column
    this.storeValueByType(fieldValue, field.field_type, value);

    const saved = await this.customFieldValueRepository.save(fieldValue);

    // Audit log
    await this.auditService.log(companyId, userId, {
      entityType: 'custom_field_value',
      entityId: fieldId,
      action: 'UPDATE',
      newValues: { [field.name]: value }
    });

    return saved;
  }

  /**
   * Get all custom field values for entity
   */
  async getEntityValues(
    companyId: string,
    entityType: string,
    entityId: string
  ): Promise<Record<string, any>> {
    const values = await this.customFieldValueRepository.find({
      where: {
        company_id: companyId,
        entity_type: entityType,
        entity_id: entityId
      }
    });

    // Convert to { fieldName: value } format
    const result: Record<string, any> = {};

    for (const fieldValue of values) {
      const field = await this.customFieldRepository.findOne({
        where: { id: fieldValue.custom_field_id }
      });

      if (field) {
        result[field.slug] = this.extractValue(fieldValue, field.field_type);
      }
    }

    return result;
  }

  private storeValueByType(
    fieldValue: CustomFieldValue,
    fieldType: string,
    value: any
  ): void {
    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
      case 'phone':
        fieldValue.value_text = String(value);
        break;

      case 'number':
      case 'currency':
        fieldValue.value_number = Number(value);
        break;

      case 'date':
        fieldValue.value_date = new Date(value);
        break;

      case 'datetime':
        fieldValue.value_datetime = new Date(value);
        break;

      case 'boolean':
        fieldValue.value_boolean = Boolean(value);
        break;

      case 'select':
        fieldValue.value_text = String(value);
        break;

      case 'multiselect':
        fieldValue.value_json = Array.isArray(value) ? value : [value];
        break;

      case 'rich_text':
        fieldValue.value_text = String(value);
        break;

      case 'rating':
        fieldValue.value_number = Number(value);
        break;
    }
  }

  private extractValue(fieldValue: CustomFieldValue, fieldType: string): any {
    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
      case 'phone':
      case 'select':
      case 'rich_text':
        return fieldValue.value_text;

      case 'number':
      case 'currency':
      case 'rating':
        return fieldValue.value_number;

      case 'date':
        return fieldValue.value_date;

      case 'datetime':
        return fieldValue.value_datetime;

      case 'boolean':
        return fieldValue.value_boolean;

      case 'multiselect':
        return fieldValue.value_json;

      default:
        return null;
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }
}
```

---

## 6. Example API Flows

### Flow 1: Define Custom Field

**Request**:
```
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

**Response** (201):
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
    "validationRules": {
      "min": 0,
      "max": 70
    },
    "createdAt": "2025-01-01T10:00:00Z"
  }
}
```

### Flow 2: Set Custom Field Value

**Request**:
```
POST /api/v1/candidates/{candidateId}/custom-fields/{fieldId}/values
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": 8
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "cfv_789",
    "customFieldId": "cf_123",
    "entityId": "cand_456",
    "value": 8,
    "updatedAt": "2025-01-01T10:05:00Z"
  }
}
```

### Flow 3: Get Entity with All Custom Fields

**Request**:
```
GET /api/v1/candidates/{candidateId}?includeCustomFields=true
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "cand_456",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "customFields": {
      "years_of_experience": 8,
      "certifications": ["aws", "kubernetes"],
      "availability_date": "2025-02-01",
      "linkedin_url": "https://linkedin.com/in/johndoe"
    }
  }
}
```

### Flow 4: Bulk Set Custom Field Values

**Request**:
```
POST /api/v1/candidates/bulk/custom-fields/{fieldId}/values
Authorization: Bearer <token>
Content-Type: application/json

{
  "candidateIds": ["cand_1", "cand_2", "cand_3"],
  "value": "rejected"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "updated": 3,
    "failed": 0,
    "results": [
      { "candidateId": "cand_1", "status": "success" },
      { "candidateId": "cand_2", "status": "success" },
      { "candidateId": "cand_3", "status": "success" }
    ]
  }
}
```

### Flow 5: List Custom Fields for Entity Type

**Request**:
```
GET /api/v1/custom-fields?entityType=candidate&includeOptions=true
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "cf_123",
      "name": "Years of Experience",
      "slug": "years_of_experience",
      "fieldType": "number",
      "isRequired": true,
      "validationRules": { "min": 0, "max": 70 }
    },
    {
      "id": "cf_456",
      "name": "Certifications",
      "slug": "certifications",
      "fieldType": "multiselect",
      "isRequired": false,
      "options": [
        { "id": "aws", "label": "AWS Certified" },
        { "id": "gcp", "label": "GCP Certified" }
      ]
    },
    {
      "id": "cf_789",
      "name": "Availability Date",
      "slug": "availability_date",
      "fieldType": "date",
      "isRequired": true
    }
  ]
}
```

### Flow 6: Search Candidates by Custom Field

**Request**:
```
GET /api/v1/candidates?customField[years_of_experience]=gt:5&customField[certifications]=aws
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "cand_1",
      "firstName": "Alice",
      "customFields": {
        "years_of_experience": 8,
        "certifications": ["aws", "kubernetes"]
      }
    },
    {
      "id": "cand_2",
      "firstName": "Bob",
      "customFields": {
        "years_of_experience": 10,
        "certifications": ["aws"]
      }
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

### Flow 7: Create Job with Custom Fields

**Request**:
```
POST /api/v1/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior DevOps Engineer",
  "description": "...",
  "pipelineId": "pipe_123",
  "customFields": {
    "preferred_languages": ["python", "go"],
    "certification_required": true,
    "budget_usd": 150000
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "job_123",
    "title": "Senior DevOps Engineer",
    "customFields": {
      "preferred_languages": ["python", "go"],
      "certification_required": true,
      "budget_usd": 150000
    }
  }
}
```

---

## 7. Frontend Integration (Reference)

### Custom Field Form Component

```typescript
// components/CustomFieldForm.tsx (REFERENCE ONLY - NOT IMPLEMENTED)

interface CustomFieldFormProps {
  field: CustomField;
  value: any;
  onValueChange: (value: any) => void;
  error?: string;
}

export const CustomFieldForm: React.FC<CustomFieldFormProps> = ({
  field,
  value,
  onValueChange,
  error
}) => {
  switch (field.fieldType) {
    case 'text':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={field.name}
          required={field.isRequired}
          maxLength={field.validationRules?.maxLength}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          min={field.validationRules?.min}
          max={field.validationRules?.max}
          required={field.isRequired}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          required={field.isRequired}
        />
      );

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          required={field.isRequired}
        >
          <option value="">-- Select --</option>
          {field.options?.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'multiselect':
      return (
        <div>
          {field.options?.map((opt) => (
            <label key={opt.id}>
              <input
                type="checkbox"
                checked={(value || []).includes(opt.id)}
                onChange={(e) => {
                  const newValue = e.target.checked
                    ? [...(value || []), opt.id]
                    : (value || []).filter((v: string) => v !== opt.id);
                  onValueChange(newValue);
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      );

    default:
      return null;
  }
};
```

---

## 8. Query Examples

### Get Field Statistics

```typescript
// Get how many candidates have filled out each field
async getFieldStats(companyId: string, entityType: string) {
  return this.customFieldValueRepository
    .createQueryBuilder('cfv')
    .select('cf.name', 'fieldName')
    .addSelect('COUNT(cfv.id)', 'filledCount')
    .addSelect('COUNT(DISTINCT cfv.entity_id)', 'uniqueEntities')
    .innerJoin('custom_fields', 'cf', 'cf.id = cfv.custom_field_id')
    .where('cfv.company_id = :companyId', { companyId })
    .andWhere('cfv.entity_type = :entityType', { entityType })
    .groupBy('cf.id, cf.name')
    .getRawMany();
}
```

### Find Entities with Matching Custom Field Values

```typescript
// Find all candidates with "years_of_experience" >= 5
async findCandidatesByExperience(
  companyId: string,
  minYears: number
) {
  const values = await this.customFieldValueRepository.find({
    where: {
      company_id: companyId,
      entity_type: 'candidate',
      custom_field_id: 'cf_123', // years_of_experience field ID
      value_number: MoreThanOrEqual(minYears)
    }
  });

  return values.map(v => v.entity_id);
}
```

---

## Summary

| Component | Purpose |
|-----------|---------|
| **custom_fields table** | Stores field definitions (name, type, validation rules) |
| **custom_field_values table** | Stores field values per entity |
| **custom_field_groups table** | Organizes fields into logical sections |
| **ValidationService** | Enforces field type & validation rules |
| **CustomFieldsService** | CRUD operations for fields and values |

The engine supports 13+ field types, flexible validation rules, bulk operations, and search/filtering on custom fields - all without schema changes.
