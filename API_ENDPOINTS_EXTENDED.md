# ATS SaaS - Extended API Endpoints

This document supplements API_ENDPOINTS.md with comprehensive endpoint definitions for new advanced features: Custom Fields, Licensing, Feature Flags, and RBAC.

---

## Custom Fields API

### Create Custom Field
```
POST /api/v1/custom-fields

Request:
{
  "name": "Years of Experience",
  "slug": "years_experience",
  "entity_type": "candidate",           // candidate|job|application|user
  "field_type": "number",               // text|number|date|select|multiselect|etc
  "is_required": false,
  "is_unique": false,
  "is_searchable": true,
  "validation_rules": {
    "min": 0,
    "max": 60,
    "customErrorMessage": "Must be between 0 and 60"
  },
  "options": []
}

Response: 201 Created
{
  "id": "uuid",
  "company_id": "uuid",
  "name": "Years of Experience",
  "slug": "years_experience",
  "entity_type": "candidate",
  "field_type": "number",
  "created_at": "2024-01-15T10:30:00Z"
}

Errors:
- 400: Invalid field_type or validation_rules
- 409: Slug already exists for this entity_type in company
```

### Get Custom Fields
```
GET /api/v1/custom-fields?entity_type=candidate&is_active=true

Query Params:
- entity_type: candidate|job|application|user (optional)
- is_active: true|false (optional, default true)
- page: 1 (optional, default)
- per_page: 20 (optional, default)

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "name": "Years of Experience",
      "slug": "years_experience",
      "entity_type": "candidate",
      "field_type": "number",
      "is_required": false,
      "validation_rules": {...},
      "options": [],
      "created_by": {
        "id": "uuid",
        "email": "admin@company.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 42
  }
}
```

### Update Custom Field
```
PUT /api/v1/custom-fields/{fieldId}

Request:
{
  "name": "Years of Professional Experience",
  "validation_rules": {
    "min": 0,
    "max": 60
  },
  "is_active": true
}

Response: 200 OK
{
  "id": "uuid",
  "name": "Years of Professional Experience",
  "updated_at": "2024-01-15T11:00:00Z"
}

Errors:
- 404: Field not found
- 400: Cannot modify slug or entity_type
```

### Delete Custom Field
```
DELETE /api/v1/custom-fields/{fieldId}

Response: 204 No Content

Errors:
- 404: Field not found
- 400: Cannot delete field with existing values (archive instead)
```

---

## Custom Field Values API

### Set Field Value (Single Entity)
```
POST /api/v1/candidates/{candidateId}/custom-fields/{fieldId}/values

Request:
{
  "value": 5
}

Response: 201 Created
{
  "entity_type": "candidate",
  "entity_id": "candidateId",
  "custom_field_id": "fieldId",
  "field_name": "Years of Experience",
  "field_type": "number",
  "value": 5,
  "created_at": "2024-01-15T10:30:00Z"
}

Errors:
- 400: Invalid value for field_type (e.g., string when number expected)
- 400: Value violates validation_rules
- 409: Unique constraint violation
- 404: Field or entity not found
```

### Get Entity with Custom Fields
```
GET /api/v1/candidates/{candidateId}?include=custom_fields

Response: 200 OK
{
  "id": "candidateId",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "custom_fields": [
    {
      "field_id": "uuid",
      "field_name": "Years of Experience",
      "field_type": "number",
      "value": 5
    },
    {
      "field_id": "uuid",
      "field_name": "Preferred Location",
      "field_type": "select",
      "value": "remote"
    }
  ]
}
```

### Bulk Set Field Values
```
POST /api/v1/candidates/bulk/custom-fields/{fieldId}/values

Request:
{
  "updates": [
    { "entity_id": "candidateId1", "value": 5 },
    { "entity_id": "candidateId2", "value": 3 },
    { "entity_id": "candidateId3", "value": 7 }
  ]
}

Response: 200 OK
{
  "successful": 3,
  "failed": 0,
  "results": [
    { "entity_id": "candidateId1", "status": "success" },
    { "entity_id": "candidateId2", "status": "success" },
    { "entity_id": "candidateId3", "status": "success" }
  ]
}

Errors:
- 400: Invalid bulk payload structure
- 400: One or more updates failed validation
```

### Search by Custom Field
```
GET /api/v1/candidates?customField[years_experience_slug]=5&page=1

Query Params:
- customField[fieldSlug]: Value to filter by
- Multiple custom fields allowed: ?customField[field1]=value1&customField[field2]=value2
- Standard pagination: page, per_page

Response: 200 OK
{
  "data": [
    {
      "id": "candidateId",
      "first_name": "John",
      "last_name": "Doe",
      "custom_fields": [
        {
          "field_name": "Years of Experience",
          "field_type": "number",
          "value": 5
        }
      ]
    }
  ],
  "pagination": {...}
}
```

---

## License & Billing API

### Get Current License
```
GET /api/v1/license

Response: 200 OK
{
  "id": "licenseId",
  "company_id": "companyId",
  "tier": "premium",                    // basic|premium|enterprise
  "status": "active",                   // active|suspended|expired|cancelled
  "starts_at": "2024-01-01T00:00:00Z",
  "expires_at": "2024-12-31T23:59:59Z",
  "billing_cycle": "annual",
  "auto_renew": true,
  "days_remaining": 351,
  "custom_limits": {
    "bulk_imports_per_month": 500
  }
}

Errors:
- 404: License not found (should never happen for authenticated user)
```

### Get License Features & Usage
```
GET /api/v1/license/features

Response: 200 OK
{
  "tier": "premium",
  "features": [
    {
      "name": "bulk_import",
      "enabled": true,
      "usage_limit": 1000,
      "current_usage": 342,
      "remaining": 658,
      "reset_date": "2024-02-01T00:00:00Z"
    },
    {
      "name": "api_access",
      "enabled": true,
      "usage_limit": null,              // null = unlimited
      "current_usage": 15000,
      "remaining": null
    },
    {
      "name": "webhooks",
      "enabled": false,
      "usage_limit": null,
      "reason": "Not available in tier"
    }
  ]
}
```

### Check Feature Availability
```
POST /api/v1/license/features/{featureName}/check

Request:
{
  "amount": 100                         // Optional: amount to check quota for
}

Response: 200 OK
{
  "feature_name": "bulk_import",
  "allowed": true,
  "reason": "Feature enabled and quota available",
  "remaining_quota": 658,
  "usage_limit": 1000
}

// If not allowed:
Response: 403 Forbidden
{
  "feature_name": "webhooks",
  "allowed": false,
  "reason": "Feature not available in basic tier",
  "required_tier": "premium"
}

// If quota exceeded:
Response: 429 Too Many Requests
{
  "feature_name": "bulk_import",
  "allowed": false,
  "reason": "Usage quota exceeded",
  "current_usage": 1000,
  "usage_limit": 1000,
  "reset_date": "2024-02-01T00:00:00Z"
}
```

### Upgrade License
```
POST /api/v1/license/upgrade

Request:
{
  "target_tier": "premium",             // basic|premium|enterprise
  "billing_cycle": "annual",            // monthly|annual
  "auto_renew": true,
  "effective_date": "2024-01-15"        // Optional: when upgrade takes effect
}

Response: 200 OK
{
  "id": "licenseId",
  "tier": "premium",
  "status": "active",
  "expires_at": "2025-01-15T00:00:00Z",
  "new_features_available": [
    "webhooks",
    "api_access",
    "bulk_import"
  ]
}

Errors:
- 400: Cannot downgrade to lower tier (use downgrade endpoint)
- 400: Invalid target_tier
```

### Downgrade License
```
POST /api/v1/license/downgrade

Request:
{
  "target_tier": "basic",
  "effective_date": "2024-02-01"        // When downgrade takes effect
}

Response: 200 OK
{
  "id": "licenseId",
  "tier": "basic",
  "status": "active",
  "expires_at": "2025-01-15T00:00:00Z",
  "features_removed": [
    "webhooks",
    "bulk_import"
  ],
  "warning": "Bulk import will be disabled on effective_date"
}

Errors:
- 400: Cannot upgrade using downgrade endpoint
```

### Set Custom Limits (ENTERPRISE only)
```
POST /api/v1/license/custom-limits

Request:
{
  "bulk_imports_per_month": 1000,
  "custom_fields_per_entity": 100,
  "api_rate_limit_per_hour": 10000
}

Response: 200 OK
{
  "custom_limits": {
    "bulk_imports_per_month": 1000,
    "custom_fields_per_entity": 100,
    "api_rate_limit_per_hour": 10000
  }
}

Errors:
- 403: Only ENTERPRISE tier can set custom limits
- 400: Invalid limit values
```

---

## Feature Flags API

### List Feature Flags (Admin)
```
GET /api/v1/admin/feature-flags

Query Params:
- status: draft|active|deprecated (optional)
- page: 1 (optional)
- per_page: 20 (optional)

Response: 200 OK
{
  "data": [
    {
      "id": "flagId",
      "name": "bulk_export",
      "description": "Enable bulk export for premium tier",
      "flag_type": "release",            // release|experiment|operational
      "status": "active",
      "is_enabled_globally": false,
      "enabled_percentage": 10,
      "target_tiers": ["premium", "enterprise"],
      "included_companies": [],
      "excluded_companies": [],
      "created_at": "2024-01-10T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {...}
}

Errors:
- 403: Requires admin role
```

### Create Feature Flag (Admin)
```
POST /api/v1/admin/feature-flags

Request:
{
  "name": "bulk_export",
  "description": "Enable bulk export for premium tier",
  "flag_type": "release",
  "target_tiers": ["premium", "enterprise"],
  "enabled_percentage": 0,
  "included_companies": [],
  "excluded_companies": [],
  "config": {}
}

Response: 201 Created
{
  "id": "flagId",
  "name": "bulk_export",
  "status": "draft",
  "is_enabled_globally": false,
  "enabled_percentage": 0
}

Errors:
- 400: name already exists
- 403: Requires admin role
```

### Update Feature Flag (Admin)
```
PUT /api/v1/admin/feature-flags/{flagId}

Request:
{
  "description": "Updated description",
  "target_tiers": ["premium"],
  "enabled_percentage": 10
}

Response: 200 OK
{
  "id": "flagId",
  "name": "bulk_export",
  "description": "Updated description",
  "enabled_percentage": 10
}

Errors:
- 404: Flag not found
- 403: Requires admin role
```

### Enable Feature Flag (Admin)
```
POST /api/v1/admin/feature-flags/{flagId}/enable

Request:
{
  "enabled_percentage": 50,             // Rollout percentage: 0-100
  "scheduled_at": "2024-01-20T00:00:00Z" // Optional: schedule for future
}

Response: 200 OK
{
  "id": "flagId",
  "name": "bulk_export",
  "status": "active",
  "is_enabled_globally": false,
  "enabled_percentage": 50
}

Errors:
- 404: Flag not found
- 403: Requires admin role
```

### Disable Feature Flag (Admin)
```
POST /api/v1/admin/feature-flags/{flagId}/disable

Response: 200 OK
{
  "id": "flagId",
  "name": "bulk_export",
  "status": "active",
  "is_enabled_globally": false,
  "enabled_percentage": 0
}
```

### Include Company in Feature Flag (Admin)
```
POST /api/v1/admin/feature-flags/{flagId}/include-company

Request:
{
  "company_id": "companyId"
}

Response: 200 OK
{
  "id": "flagId",
  "included_companies": ["companyId"]
}

Errors:
- 404: Flag or company not found
- 409: Company already included
```

### Exclude Company from Feature Flag (Admin)
```
POST /api/v1/admin/feature-flags/{flagId}/exclude-company

Request:
{
  "company_id": "companyId"
}

Response: 200 OK
{
  "id": "flagId",
  "excluded_companies": ["companyId"]
}
```

### Check Feature Flag Availability (User)
```
GET /api/v1/features/available

Response: 200 OK
{
  "company_id": "companyId",
  "tier": "premium",
  "features": {
    "bulk_export": true,
    "webhooks": true,
    "bulk_import": true,
    "api_access": true,
    "custom_fields": true
  }
}
```

### Get Feature Flag Usage Analytics (Admin)
```
GET /api/v1/admin/feature-flags/{flagId}/usage

Query Params:
- start_date: 2024-01-01 (optional, default 30 days ago)
- end_date: 2024-01-31 (optional, default today)

Response: 200 OK
{
  "flag_id": "flagId",
  "name": "bulk_export",
  "total_companies": 10,
  "enabled_companies": 1,
  "adoption_rate": 0.10,
  "daily_usage": [
    { "date": "2024-01-15", "access_count": 42, "companies_accessed": 1 },
    { "date": "2024-01-16", "access_count": 38, "companies_accessed": 1 }
  ]
}
```

---

## RBAC (Roles & Permissions) API

### List Roles (Company-scoped)
```
GET /api/v1/roles

Query Params:
- include_system: true|false (optional, default false)
- page: 1 (optional)

Response: 200 OK
{
  "data": [
    {
      "id": "roleId",
      "company_id": "companyId",
      "name": "Admin",
      "slug": "admin",
      "is_system": true,
      "is_default": false,
      "is_active": true,
      "permissions": [
        { "id": "permId", "name": "candidates:read" },
        { "id": "permId", "name": "candidates:create" },
        { "id": "permId", "name": "candidates:update" }
      ],
      "user_count": 2
    }
  ]
}
```

### Create Custom Role
```
POST /api/v1/roles

Request:
{
  "name": "Senior Recruiter",
  "slug": "senior_recruiter",
  "description": "Experienced recruiter with reporting access",
  "permission_ids": ["permId1", "permId2", "permId3"]
}

Response: 201 Created
{
  "id": "roleId",
  "company_id": "companyId",
  "name": "Senior Recruiter",
  "slug": "senior_recruiter",
  "is_system": false,
  "permissions": [...]
}

Errors:
- 400: Slug already exists in company
- 400: Invalid permission_ids
```

### Update Role
```
PUT /api/v1/roles/{roleId}

Request:
{
  "name": "Senior Recruiter",
  "permission_ids": ["permId1", "permId2", "permId3", "permId4"]
}

Response: 200 OK
{
  "id": "roleId",
  "name": "Senior Recruiter",
  "permissions": [...]
}

Errors:
- 404: Role not found
- 400: Cannot modify system roles
```

### Delete Role
```
DELETE /api/v1/roles/{roleId}

Response: 204 No Content

Errors:
- 404: Role not found
- 400: Cannot delete system roles
- 400: Role has assigned users (reassign first)
```

### Assign Role to User
```
POST /api/v1/users/{userId}/role

Request:
{
  "role_id": "roleId"
}

Response: 200 OK
{
  "user_id": "userId",
  "role_id": "roleId",
  "role_name": "Senior Recruiter",
  "previous_role": "Recruiter"
}

Errors:
- 404: User or role not found
```

### Get User Permissions
```
GET /api/v1/users/me/permissions

Response: 200 OK
{
  "user_id": "userId",
  "company_id": "companyId",
  "role_id": "roleId",
  "role_name": "Recruiter",
  "permissions": [
    "candidates:read",
    "candidates:create",
    "candidates:update",
    "jobs:read",
    "applications:read",
    "applications:update",
    "reports:view"
  ],
  "temporary_grants": [
    {
      "permission": "reports:export",
      "granted_at": "2024-01-10T00:00:00Z",
      "expires_at": "2024-01-31T23:59:59Z",
      "granted_by": "admin@company.com",
      "reason": "Q1 reporting"
    }
  ],
  "permanent_revokes": []
}
```

### Grant Permission to User (Override)
```
POST /api/v1/users/{userId}/permissions/grant

Request:
{
  "permission_id": "permId",
  "expires_at": "2024-02-15T23:59:59Z",    // Optional: temporary grant
  "reason": "Q1 reporting"
}

Response: 200 OK
{
  "user_id": "userId",
  "permission_id": "permId",
  "permission_name": "reports:export",
  "grant_type": "grant",
  "granted_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-02-15T23:59:59Z",
  "reason": "Q1 reporting"
}

Errors:
- 404: User or permission not found
- 400: Invalid permission
```

### Revoke Permission from User (Override)
```
POST /api/v1/users/{userId}/permissions/revoke

Request:
{
  "permission_id": "permId",
  "reason": "Project ended"
}

Response: 200 OK
{
  "user_id": "userId",
  "permission_id": "permId",
  "permission_name": "candidates:delete",
  "grant_type": "revoke",
  "revoked_at": "2024-01-15T10:30:00Z",
  "reason": "Project ended"
}
```

### Check Permission (User)
```
POST /api/v1/permissions/check

Request:
{
  "permission": "candidates:delete"
}

Response: 200 OK
{
  "has_permission": true,
  "permission": "candidates:delete",
  "granted_by": "role",
  "role": "Admin"
}

// If denied:
Response: 403 Forbidden
{
  "has_permission": false,
  "permission": "candidates:delete",
  "required_tier": "premium"
}
```

### List All Permissions (Admin)
```
GET /api/v1/admin/permissions

Query Params:
- resource: candidates|jobs|users|etc (optional)
- page: 1 (optional)

Response: 200 OK
{
  "data": [
    {
      "id": "permId",
      "name": "candidates:read",
      "resource": "candidates",
      "action": "read",
      "level": 0,
      "is_sensitive": false,
      "requires_mfa": false
    },
    {
      "id": "permId",
      "name": "candidates:delete",
      "resource": "candidates",
      "action": "delete",
      "level": 2,
      "is_sensitive": true,
      "requires_mfa": true
    }
  ],
  "pagination": {...}
}
```

---

## RBAC Audit API

### Get RBAC Change History (Admin)
```
GET /api/v1/admin/rbac-audit

Query Params:
- user_id: userId (optional)
- action: role_assigned|permission_granted|permission_revoked (optional)
- start_date: 2024-01-01 (optional)
- end_date: 2024-01-31 (optional)
- page: 1 (optional)

Response: 200 OK
{
  "data": [
    {
      "id": "auditId",
      "timestamp": "2024-01-15T10:30:00Z",
      "action": "role_assigned",
      "target_user": {
        "id": "userId",
        "email": "john@company.com"
      },
      "actor": {
        "id": "adminUserId",
        "email": "admin@company.com"
      },
      "changes": {
        "previous_role": "Recruiter",
        "new_role": "Senior Recruiter"
      },
      "reason": "Promotion"
    },
    {
      "id": "auditId",
      "timestamp": "2024-01-14T15:00:00Z",
      "action": "permission_granted",
      "target_user": {
        "id": "userId",
        "email": "jane@company.com"
      },
      "actor": {
        "id": "adminUserId",
        "email": "admin@company.com"
      },
      "changes": {
        "permission": "reports:export",
        "expires_at": "2024-02-15T23:59:59Z"
      },
      "reason": "Q1 reporting"
    }
  ],
  "pagination": {...}
}
```

---

## Permission Matrix Reference

| Permission | Admin | Recruiter | Manager | Viewer |
|-----------|-------|-----------|---------|--------|
| candidates:read | ✓ | ✓ | ✓ | ✓ |
| candidates:create | ✓ | ✓ | ✗ | ✗ |
| candidates:update | ✓ | ✓ | ✗ | ✗ |
| candidates:delete | ✓ | ✗ | ✗ | ✗ |
| jobs:read | ✓ | ✓ | ✓ | ✓ |
| jobs:create | ✓ | ✓ | ✗ | ✗ |
| jobs:publish | ✓ | ✗ | ✗ | ✗ |
| jobs:delete | ✓ | ✗ | ✗ | ✗ |
| applications:read | ✓ | ✓ | ✓ | ✓ |
| applications:update | ✓ | ✓ | ✓ | ✗ |
| applications:move | ✓ | ✓ | ✓ | ✗ |
| users:read | ✓ | ✗ | ✗ | ✗ |
| users:create | ✓ | ✗ | ✗ | ✗ |
| users:update | ✓ | ✗ | ✗ | ✗ |
| users:delete | ✓ | ✗ | ✗ | ✗ |
| users:invite | ✓ | ✓ | ✗ | ✗ |
| reports:view | ✓ | ✓ | ✓ | ✗ |
| reports:export | ✓ | ✗ | ✗ | ✗ |
| settings:manage | ✓ | ✗ | ✗ | ✗ |
| roles:manage | ✓ | ✗ | ✗ | ✗ |
| audit:view | ✓ | ✗ | ✗ | ✗ |
| api:access | ✓ | ✓ | ✗ | ✗ |
| webhooks:manage | ✓ | ✗ | ✗ | ✗ |

---

## Error Response Format

All API endpoints follow standard error format:

```
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Field 'email' is required",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/users"
}

Common Status Codes:
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid JWT)
- 403: Forbidden (lacks permission or license)
- 404: Not Found
- 409: Conflict (duplicate resource)
- 429: Too Many Requests (rate limit or quota exceeded)
- 500: Internal Server Error
```

---

## Authentication & Headers

All endpoints require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Company-ID: <companyId>  // Optional: extracted from JWT if present
```

Sensitive endpoints may require:
```
X-MFA-Token: <mfa_verification_token>  // For requires_mfa: true permissions
```
