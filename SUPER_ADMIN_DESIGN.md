# Super Admin (Product Owner) Implementation Guide

**Status**: Design & Implementation  
**Date**: January 2, 2026  
**Version**: 1.0  

---

## Overview

The Super Admin (Product Owner) capability enables ATS administrators to manage the entire SaaS platform including:
- Creating companies
- Assigning licenses to companies
- Creating company admin users
- Enabling/disabling features per company

### Key Design Principles

1. **Complete Separation**: Super Admin is NOT tied to any company
2. **Distinct Authentication**: Separate auth flow from company user authentication
3. **Non-Breaking**: Existing company login flows remain unchanged
4. **API-First**: No UI required initially (API-only)
5. **Secure**: Super Admin token is completely separate from company tokens

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Super Admin Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Super Admin User                                          │
│    (No company_id)                                         │
│         │                                                   │
│         ├──► POST /api/super-admin/auth/login             │
│         │     └─ Returns: Super Admin JWT Token           │
│         │                                                   │
│         ├──► POST /api/super-admin/companies               │
│         │     ├─ Create new Company                       │
│         │     └─ Create Company Admin User                │
│         │                                                   │
│         ├──► POST /api/super-admin/licenses               │
│         │     └─ Assign license tier to Company           │
│         │                                                   │
│         └──► POST /api/super-admin/modules                │
│               └─ Enable/disable features per Company      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Company User Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Company Admin User                                        │
│    (Tied to Company via company_id)                        │
│         │                                                   │
│         ├──► POST /api/auth/login                         │
│         │     └─ Returns: Company JWT Token               │
│         │        (includes company_id & company_permissions)
│         │                                                   │
│         ├──► GET /api/jobs                                │
│         │     └─ Query scoped to company_id               │
│         │                                                   │
│         └──► Other company-scoped operations              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model Changes

### New Table: `super_admin_users`

```sql
CREATE TABLE super_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  
  -- Auth
  password_hash VARCHAR(255) NOT NULL,
  
  -- Access Control
  role VARCHAR(50) NOT NULL DEFAULT 'super_admin',  -- super_admin, support, operations
  permissions JSONB DEFAULT '{}',  -- Custom permissions if needed
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  
  -- Settings
  preferences JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_super_admin_users_email ON super_admin_users(email);
CREATE INDEX idx_super_admin_users_is_active ON super_admin_users(is_active);
```

**Key Differences from regular `users` table:**
- ❌ NO `company_id` column - Super Admin is NOT tied to any company
- ✅ Separate table for clarity and security
- ✅ Own role/permission system
- ✅ Can support multiple super admin roles (support, operations, etc.)

### Modified Table: `companies`

Add column for Super Admin tracking:

```sql
ALTER TABLE companies ADD COLUMN created_by_super_admin_id UUID 
  REFERENCES super_admin_users(id) ON DELETE SET NULL;
```

This tracks which Super Admin created each company.

### Modified Table: `licenses`

Already has `company_id`, good for tracking license assignments.

### Modified Table: `feature_flags` (if exists)

Or use `companies.feature_flags` JSONB for module enablement per company.

---

## Authentication & Authorization

### 1. Super Admin Login

**Request:**
```http
POST /api/super-admin/auth/login
Content-Type: application/json

{
  "email": "admin@ats.com",
  "password": "secure_password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@ats.com",
      "firstName": "System",
      "role": "super_admin"
    }
  }
}
```

### 2. Token Structure

**Super Admin Token Payload:**
```typescript
{
  "userId": "super-admin-uuid",
  "email": "admin@ats.com",
  "type": "super_admin",          // KEY: Identifies as Super Admin
  "role": "super_admin",
  "permissions": ["*"],            // Full system access
  "iat": 1704211200,
  "exp": 1704297600
}
```

**Company User Token Payload (existing):**
```typescript
{
  "userId": "user-uuid",
  "companyId": "company-uuid",    // KEY: Tied to company
  "email": "recruiter@company.com",
  "type": "company_user",          // KEY: Identifies as Company User
  "role": "admin",
  "permissions": ["jobs:*", "candidates:*"],
  "iat": 1704211200,
  "exp": 1704297600
}
```

### 3. Guards to Prevent Auth Mixing

```typescript
// Super Admin Guard - only allows super_admin type tokens
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const payload = request.user;  // From JWT middleware
    
    if (payload?.type !== 'super_admin') {
      throw new ForbiddenException('Super Admin access required');
    }
    return true;
  }
}

// Company User Guard - only allows company_user type tokens
@Injectable()
export class CompanyUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const payload = request.user;
    
    if (payload?.type !== 'company_user') {
      throw new ForbiddenException('Company user access required');
    }
    return true;
  }
}
```

---

## API Endpoints

### Authentication Endpoints

#### POST `/api/super-admin/auth/login`
Login a super admin user.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@ats.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "jwt_token",
    "user": {
      "id": "uuid",
      "email": "admin@ats.com",
      "firstName": "System",
      "lastName": "Admin",
      "role": "super_admin"
    }
  }
}
```

---

#### POST `/api/super-admin/auth/refresh`
Refresh Super Admin token.

**Headers:**
```
Authorization: Bearer {refreshToken}
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_jwt_token"
  }
}
```

---

#### POST `/api/super-admin/auth/logout`
Logout Super Admin (invalidates tokens on client).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Company Management Endpoints

#### POST `/api/super-admin/companies`
Create a new company with initial admin user.

**Headers:**
```
Authorization: Bearer {superAdminToken}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "email": "admin@acme.com",
  "initialAdmin": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@acme.com",
    "password": "temporary_password_123"
  },
  "licenseTier": "premium",
  "settings": {
    "timezone": "America/New_York",
    "dateFormat": "MM/DD/YYYY"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "id": "company-uuid",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "email": "admin@acme.com",
      "licenseTier": "premium",
      "isActive": true,
      "createdBy": "super-admin-uuid",
      "createdAt": "2026-01-02T10:00:00Z"
    },
    "admin": {
      "id": "user-uuid",
      "email": "john@acme.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "companyId": "company-uuid"
    }
  }
}
```

---

#### GET `/api/super-admin/companies`
List all companies.

**Headers:**
```
Authorization: Bearer {superAdminToken}
```

**Query Parameters:**
```
?page=1&limit=20&isActive=true&search=acme
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "company-uuid",
        "name": "Acme Corporation",
        "slug": "acme-corp",
        "email": "admin@acme.com",
        "licenseTier": "premium",
        "isActive": true,
        "userCount": 15,
        "createdAt": "2026-01-02T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42
    }
  }
}
```

---

#### GET `/api/super-admin/companies/:companyId`
Get company details.

**Headers:**
```
Authorization: Bearer {superAdminToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company-uuid",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "email": "admin@acme.com",
    "licenseTier": "premium",
    "isActive": true,
    "settings": {
      "timezone": "America/New_York"
    },
    "featureFlags": {
      "jobs": true,
      "candidates": true,
      "interviews": true,
      "offers": true,
      "submissions": true,
      "reports": true,
      "api": false,
      "webhooks": false,
      "sso": false
    },
    "userCount": 15,
    "createdBy": "super-admin-uuid",
    "createdAt": "2026-01-02T10:00:00Z",
    "updatedAt": "2026-01-02T10:00:00Z"
  }
}
```

---

#### PATCH `/api/super-admin/companies/:companyId`
Update company details.

**Headers:**
```
Authorization: Bearer {superAdminToken}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Acme Corporation Updated",
  "email": "admin@acme.com",
  "isActive": true,
  "settings": {
    "timezone": "America/Los_Angeles"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company-uuid",
    "name": "Acme Corporation Updated",
    "email": "admin@acme.com",
    "isActive": true,
    "updatedAt": "2026-01-02T11:00:00Z"
  }
}
```

---

### License Management Endpoints

#### POST `/api/super-admin/licenses`
Assign or update license for a company.

**Headers:**
```
Authorization: Bearer {superAdminToken}
Content-Type: application/json
```

**Body:**
```json
{
  "companyId": "company-uuid",
  "tier": "enterprise",
  "billingCycle": "annual",
  "startsAt": "2026-01-02T00:00:00Z",
  "expiresAt": "2027-01-02T00:00:00Z",
  "autoRenew": true,
  "customLimits": {
    "maxUsers": 500,
    "maxCandidates": 50000,
    "apiCallsPerDay": 1000000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "license-uuid",
    "companyId": "company-uuid",
    "tier": "enterprise",
    "status": "active",
    "billingCycle": "annual",
    "startsAt": "2026-01-02T00:00:00Z",
    "expiresAt": "2027-01-02T00:00:00Z",
    "autoRenew": true,
    "customLimits": {
      "maxUsers": 500,
      "maxCandidates": 50000,
      "apiCallsPerDay": 1000000
    }
  }
}
```

---

#### GET `/api/super-admin/licenses/:companyId`
Get company's current license.

**Headers:**
```
Authorization: Bearer {superAdminToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "license-uuid",
    "companyId": "company-uuid",
    "tier": "enterprise",
    "status": "active",
    "startsAt": "2026-01-02T00:00:00Z",
    "expiresAt": "2027-01-02T00:00:00Z",
    "daysRemaining": 365,
    "autoRenew": true
  }
}
```

---

### Module Management Endpoints

#### POST `/api/super-admin/modules/:companyId/enable`
Enable a feature module for a company.

**Headers:**
```
Authorization: Bearer {superAdminToken}
Content-Type: application/json
```

**Body:**
```json
{
  "module": "api",
  "enabledAt": "2026-01-02T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-uuid",
    "module": "api",
    "isEnabled": true,
    "enabledAt": "2026-01-02T10:00:00Z",
    "enabledBy": "super-admin-uuid"
  }
}
```

---

#### POST `/api/super-admin/modules/:companyId/disable`
Disable a feature module for a company.

**Headers:**
```
Authorization: Bearer {superAdminToken}
Content-Type: application/json
```

**Body:**
```json
{
  "module": "webhooks",
  "disabledAt": "2026-01-02T10:00:00Z",
  "reason": "Customer downgrade to premium"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-uuid",
    "module": "webhooks",
    "isEnabled": false,
    "disabledAt": "2026-01-02T10:00:00Z",
    "disabledBy": "super-admin-uuid",
    "reason": "Customer downgrade to premium"
  }
}
```

---

#### GET `/api/super-admin/modules/:companyId`
Get all feature flags for a company.

**Headers:**
```
Authorization: Bearer {superAdminToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-uuid",
    "modules": {
      "jobs": { "enabled": true, "enabledAt": "2026-01-02T10:00:00Z" },
      "candidates": { "enabled": true, "enabledAt": "2026-01-02T10:00:00Z" },
      "interviews": { "enabled": true, "enabledAt": "2026-01-02T10:00:00Z" },
      "offers": { "enabled": true, "enabledAt": "2026-01-02T10:00:00Z" },
      "submissions": { "enabled": true, "enabledAt": "2026-01-02T10:00:00Z" },
      "reports": { "enabled": true, "enabledAt": "2026-01-02T10:00:00Z" },
      "api": { "enabled": false, "enabledAt": null },
      "webhooks": { "enabled": false, "enabledAt": null },
      "sso": { "enabled": false, "enabledAt": null },
      "analytics": { "enabled": true, "enabledAt": "2026-01-02T10:00:00Z" }
    }
  }
}
```

---

### Company Admin User Management Endpoints

#### POST `/api/super-admin/companies/:companyId/admins`
Create a company admin user.

**Headers:**
```
Authorization: Bearer {superAdminToken}
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@acme.com",
  "password": "temporary_password_456",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "companyId": "company-uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@acme.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2026-01-02T10:00:00Z"
  }
}
```

---

#### GET `/api/super-admin/companies/:companyId/admins`
List all admin users for a company.

**Headers:**
```
Authorization: Bearer {superAdminToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admins": [
      {
        "id": "user-uuid",
        "email": "john@acme.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "admin",
        "isActive": true,
        "lastLoginAt": "2026-01-01T15:30:00Z"
      }
    ]
  }
}
```

---

## How to Use

### 1. Super Admin Login

```bash
curl -X POST http://localhost:3000/api/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ats.com",
    "password": "super_admin_password"
  }'
```

Save the `accessToken` for subsequent requests.

### 2. Create a Company

```bash
curl -X POST http://localhost:3000/api/super-admin/companies \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Company",
    "slug": "demo-company",
    "email": "admin@demo.com",
    "licenseTier": "premium",
    "initialAdmin": {
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@demo.com",
      "password": "demo_password_123"
    }
  }'
```

### 3. Assign License

```bash
curl -X POST http://localhost:3000/api/super-admin/licenses \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "{companyId}",
    "tier": "premium",
    "billingCycle": "monthly",
    "startsAt": "2026-01-02T00:00:00Z",
    "expiresAt": "2026-02-02T00:00:00Z",
    "autoRenew": true
  }'
```

### 4. Enable Module

```bash
curl -X POST http://localhost:3000/api/super-admin/modules/{companyId}/enable \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "api"
  }'
```

### 5. Company User Login (Normal Flow)

The company admin can now login normally:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "demo_password_123"
  }'
```

---

## Demo Setup

A seed script will be created to:

1. Create `super_admin_users` table
2. Insert default Super Admin user:
   - Email: `admin@ats.com`
   - Password: `ChangeMe@123` (must be changed in production)
3. Create a demo company:
   - Name: "Demo Company"
   - Slug: "demo-company"
4. Create admin user for demo company:
   - Email: `admin@demo-company.com`
   - Role: `admin`
5. Assign Premium license for 30 days
6. Enable all feature modules

Run with: `npm run seed:super-admin`

---

## Security Considerations

### 1. Token Isolation
- Super Admin tokens use `type: 'super_admin'`
- Company tokens use `type: 'company_user'`
- Guards ensure tokens cannot be mixed

### 2. Separate Auth Flows
- Super Admin uses `/api/super-admin/auth/*`
- Company users use `/api/auth/*`
- Different JWT secrets for each

### 3. Company_id Isolation
- Super Admin operations don't require `company_id` (they work across all companies)
- Company operations always require `company_id` from token
- Middleware enforces tenant scoping

### 4. Audit Logging
- All Super Admin operations logged
- Who created/modified companies
- License assignments tracked
- Feature flag changes recorded

### 5. Production Setup
- Super Admin password must be changed on first login
- Enable MFA for Super Admin accounts
- Rotate JWT secrets regularly
- Use separate DB user for Super Admin operations
- Rate limit all Super Admin endpoints

---

## Implementation Checklist

- [ ] Create `super_admin_users` table migration
- [ ] Create `SuperAdminAuthService` with login/token logic
- [ ] Create `SuperAdminAuthController` with login endpoints
- [ ] Create `SuperAdminService` with business logic
- [ ] Create `SuperAdminController` with all API endpoints
- [ ] Create `SuperAdminGuard` for route protection
- [ ] Create `CompanyUserGuard` to prevent token mixing
- [ ] Update `AppModule` to import `SuperAdminModule`
- [ ] Create seed script for demo setup
- [ ] Test all endpoints
- [ ] Document in IMPLEMENTATION_GUIDE.md
- [ ] Create curl examples
- [ ] Update swagger/OpenAPI specs

---

## Next Steps

1. Create database migration
2. Implement entity classes
3. Implement services
4. Implement controllers
5. Create guards
6. Test endpoints
7. Create seed script
