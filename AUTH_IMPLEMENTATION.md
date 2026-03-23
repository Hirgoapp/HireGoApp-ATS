# ATS Authentication & RBAC Implementation Guide

## Overview

This document describes the production-grade authentication and role-based access control (RBAC) system implemented for the ATS SaaS platform.

**Key Features:**
- Email/password authentication with JWT tokens
- Role-based access control with fine-grained permissions
- Tenant-aware authorization (all checks scoped to company_id)
- Permission caching with 1-hour TTL for performance
- Custom permission overrides (temporary grants/revokes)
- Comprehensive audit logging for all RBAC changes
- Sensitive action interceptor for high-risk operations

---

## Architecture

### Core Concepts

#### Roles (What You Are)
A role represents a job title or position within a company. Examples:
- `Admin` - Full system access
- `Recruiter` - Day-to-day recruiting operations
- `HiringManager` - Make hiring decisions
- `Viewer` - Read-only access

#### Permissions (What You Can Do)
A permission represents a specific, atomic action. Examples:
- `candidates:read` - View candidate information
- `candidates:create` - Create new candidates
- `candidates:delete` - Delete candidates
- `jobs:publish` - Publish job postings
- `reports:export` - Export reports

**Note:** Permissions support wildcard matching. For example, `candidates:*` grants all candidate-related permissions.

#### Multi-Tenant Scoping
All permissions are tenant-scoped to company_id:
```
Permission: candidates:update
Company A: User CAN update candidates in Company A only
Company B: CANNOT update candidates in Company B
```

---

## Database Schema

### 5 RBAC Tables

#### 1. **permissions** (Global, shared across all tenants)
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,        -- 'candidates:read', 'jobs:create'
  description TEXT,
  resource VARCHAR(50),             -- 'candidates', 'jobs', 'users', 'reports'
  action VARCHAR(50),               -- 'read', 'create', 'update', 'delete'
  level INT DEFAULT 0,              -- 0=basic, 1=intermediate, 2=admin
  is_sensitive BOOLEAN DEFAULT false,-- Requires audit logging
  requires_mfa BOOLEAN DEFAULT false,-- Requires MFA for this action
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**20 Default Permissions:**
- `candidates:read, create, update, delete, *`
- `jobs:read, create, publish, update, delete, *`
- `applications:read, create, update, *`
- `users:read, create, update, invite, delete`
- `reports:view, export, *`
- `settings:manage`
- `roles:manage`
- `audit:view`
- `api:access`
- `webhooks:manage`

#### 2. **roles** (Company-scoped)
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100),
  slug VARCHAR(50),
  description TEXT,
  is_system BOOLEAN DEFAULT false,  -- Cannot be modified if true
  is_default BOOLEAN DEFAULT false,  -- Auto-assigned to new users
  display_order INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);
```

**4 System Roles (per company):**
1. **Admin** - Full access (all permissions including wildcards)
2. **Recruiter** - Day-to-day operations (default role for new users)
3. **Hiring Manager** - Decision making (candidates:read, jobs:read, applications:read/update, reports:view/export)
4. **Viewer** - Read-only (candidates:read, jobs:read, applications:read, reports:view)

#### 3. **role_permissions** (M:N Mapping)
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP,
  UNIQUE (role_id, permission_id)
);
```

#### 4. **user_permissions** (Custom Overrides)
```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  grant_type VARCHAR(50),           -- 'grant' or 'revoke'
  reason TEXT,
  created_at TIMESTAMP,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,              -- Temporary override
  UNIQUE (company_id, user_id, permission_id)
);
```

Allows:
- **Temporary grants**: Give a permission for a limited time (e.g., "reports:export" for 1 week)
- **Revokes**: Remove a permission from user (e.g., revoke "candidates:delete")

#### 5. **role_permission_audit** (Change Trail)
```sql
CREATE TABLE role_permission_audit (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50),               -- 'ROLE_CREATED', 'PERMISSION_GRANTED', etc
  role_id UUID,
  permission_id UUID,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  created_at TIMESTAMP
);
```

---

## File Structure

```
src/auth/
├── entities/
│   ├── role.entity.ts              # Role TypeORM entity
│   ├── permission.entity.ts         # Permission TypeORM entity
│   ├── role-permission.entity.ts    # M:N mapping entity
│   ├── user-permission.entity.ts    # Custom overrides entity
│   ├── role-permission-audit.entity.ts  # Audit trail entity
│   └── user.entity.ts               # User entity (referenced by permissions)
├── repositories/
│   ├── role.repository.ts           # Role repository
│   ├── permission.repository.ts     # Permission repository
│   ├── role-permission.repository.ts# M:N mapping repository
│   ├── user-permission.repository.ts# Override repository
│   └── role-permission-audit.repository.ts  # Audit repository
├── services/
│   ├── authorization.service.ts     # Core RBAC logic
│   └── auth.service.ts              # Login/logout/refresh
├── guards/
│   ├── permission.guard.ts          # @RequirePermissions guard
│   └── any-permission.guard.ts      # @RequireAnyPermission guard
├── decorators/
│   ├── require-permissions.decorator.ts
│   └── require-any-permission.decorator.ts
├── interceptors/
│   └── sensitive-action.interceptor.ts  # Audit sensitive actions
├── controllers/
│   ├── auth.controller.ts           # Login/logout/refresh endpoints
│   └── rbac.controller.ts           # Role/permission management endpoints
├── dtos/
│   ├── login.dto.ts
│   ├── refresh-token.dto.ts
│   ├── create-role.dto.ts
│   ├── grant-permission.dto.ts
│   ├── revoke-permission.dto.ts
│   ├── assign-role.dto.ts
│   └── check-permission.dto.ts
└── auth.module.ts                   # Module setup

src/database/
└── seeds/
    └── default-roles-permissions.seed.ts  # Seed data
```

---

## Key Services

### AuthorizationService

**Core Permission Checking:**

```typescript
// Check single permission (with wildcard support)
async hasPermission(
  companyId: string,
  userId: string,
  permission: string
): Promise<boolean>

// Check if user has ANY of multiple permissions
async hasAnyPermission(
  companyId: string,
  userId: string,
  permissions: string[]
): Promise<boolean>

// Check if user has ALL of multiple permissions
async hasAllPermissions(
  companyId: string,
  userId: string,
  permissions: string[]
): Promise<boolean>
```

**Permission Caching:**
- Cache key: `user_permissions:{companyId}:{userId}`
- TTL: 1 hour (3600 seconds)
- Invalidated on: role assignment, permission grant/revoke

**Effective Permissions Calculation:**
1. Get user's role permissions (from `role_permissions` table)
2. Apply custom grants (from `user_permissions` where `grant_type='grant'`)
3. Apply custom revokes (from `user_permissions` where `grant_type='revoke'`)

**Role Management:**

```typescript
// Create custom role
async createRole(
  companyId: string,
  userId: string,
  dto: CreateRoleDto
): Promise<Role>

// Assign role to user
async assignRoleToUser(
  companyId: string,
  userId: string,
  targetUserId: string,
  roleId: string
): Promise<User>
```

**Permission Overrides:**

```typescript
// Grant temporary permission
async grantPermission(
  companyId: string,
  userId: string,
  targetUserId: string,
  permissionId: string,
  reason?: string,
  expiresAt?: Date
): Promise<UserPermission>

// Revoke permission
async revokePermission(
  companyId: string,
  userId: string,
  targetUserId: string,
  permissionId: string,
  reason?: string
): Promise<void>
```

### AuthService

**Login/Logout/Refresh:**

```typescript
// Login with email/password
// Returns JWT access token + refresh token
async login(email: string, password: string): Promise<{
  token: string;
  refreshToken: string;
  user: {...}
}>

// Logout (blacklist refresh tokens)
async logout(userId: string, companyId: string): Promise<void>

// Refresh access token
async refreshToken(refreshToken: string): Promise<{
  token: string;
  refreshToken: string
}>
```

**JWT Token Structure:**

```json
{
  "userId": "uuid",
  "companyId": "uuid",
  "email": "user@example.com",
  "role": "admin",
  "permissions": ["candidates:*", "jobs:*", ...],
  "iat": 1704067200,
  "exp": 1704070800
}
```

---

## Using the Guards & Decorators

### Protect Endpoints with Permissions

```typescript
// Require ALL permissions
@Delete('candidates/:id')
@UseGuards(TenantGuard, PermissionGuard)
@RequirePermissions('candidates:delete')
async deleteCandidate(@Param('id') id: string) {
  return { success: true };
}

// Require ANY permission
@Get('reports')
@UseGuards(TenantGuard, AnyPermissionGuard)
@RequireAnyPermission('reports:view', 'reports:export')
async getReports() {
  return { reports: [] };
}

// Multiple permissions (requires ALL)
@Post('jobs')
@UseGuards(TenantGuard, PermissionGuard)
@RequirePermissions('jobs:create', 'api:access')
async createJob(@Body() dto: CreateJobDto) {
  return { job: {...} };
}
```

### Wildcard Matching

Permissions support wildcard matching:
- User has `candidates:*` permission
- Check for `candidates:read` → **ALLOWED**
- Check for `candidates:create` → **ALLOWED**
- Check for `jobs:read` → **DENIED**

---

## API Endpoints

### Authentication Endpoints

#### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@company.com",
  "password": "password"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "firstName": "John",
      "role": "admin",
      "company": {
        "id": "uuid",
        "name": "Company Name"
      }
    }
  }
}
```

#### POST /auth/logout
Logout user (invalidate refresh tokens).

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### GET /auth/me/permissions
Get current user's effective permissions.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "permissions": ["candidates:*", "jobs:*", ...]
  }
}
```

#### POST /auth/check-permission
Check if user has specific permission.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "permission": "candidates:delete"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "hasPermission": true,
    "permission": "candidates:delete"
  }
}
```

### Role Management Endpoints

#### GET /api/v1/rbac/roles
Get all roles for company.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "uuid",
        "name": "Admin",
        "slug": "admin",
        "description": "Full access",
        "is_system": true,
        "is_default": false,
        "role_permissions": [...]
      },
      ...
    ]
  }
}
```

#### POST /api/v1/rbac/roles
Create new role.

**Headers:** `Authorization: Bearer {token}`
**Required Permission:** `roles:manage`

**Request:**
```json
{
  "name": "Senior Recruiter",
  "slug": "senior_recruiter",
  "description": "Experienced recruiter",
  "permissionIds": ["uuid1", "uuid2", ...],
  "reason": "New role for Q1 expansion"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "role": {
      "id": "uuid",
      "name": "Senior Recruiter",
      ...
    }
  }
}
```

#### POST /api/v1/rbac/users/:userId/role
Assign role to user.

**Headers:** `Authorization: Bearer {token}`
**Required Permission:** `users:update`

**Request:**
```json
{
  "roleId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "role_id": "uuid",
      ...
    }
  }
}
```

#### POST /api/v1/rbac/users/:userId/permissions/grant
Grant permission to user.

**Headers:** `Authorization: Bearer {token}`
**Required Permission:** `users:update`

**Request:**
```json
{
  "targetUserId": "uuid",
  "permissionId": "uuid",
  "reason": "Temporary access for reporting",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userPermission": {
      "id": "uuid",
      "grant_type": "grant",
      "reason": "Temporary access for reporting",
      "expires_at": "2024-12-31T23:59:59Z"
    }
  }
}
```

#### POST /api/v1/rbac/users/:userId/permissions/revoke
Revoke permission from user.

**Headers:** `Authorization: Bearer {token}`
**Required Permission:** `users:update`

**Request:**
```json
{
  "targetUserId": "uuid",
  "permissionId": "uuid",
  "reason": "Temporary access expired"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Permission revoked successfully"
}
```

#### GET /api/v1/rbac/audit
Get RBAC audit trail.

**Headers:** `Authorization: Bearer {token}`
**Required Permission:** `audit:view`

**Query Parameters:**
- `limit` (default: 100)
- `offset` (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "auditEntries": [
      {
        "id": "uuid",
        "action": "ROLE_CREATED",
        "user_id": "uuid",
        "role_id": "uuid",
        "new_values": {...},
        "reason": "...",
        "created_at": "2024-01-01T00:00:00Z"
      },
      ...
    ],
    "total": 150,
    "limit": 100,
    "offset": 0
  }
}
```

---

## Authorization Flows

### Flow 1: Recruiter Creates Job (Allowed)

```
User: john@company.com with Recruiter role
Role Permissions: [candidates:read, jobs:create, jobs:publish, ...]

Request: POST /api/v1/jobs
Decorator: @RequirePermissions('jobs:create')

Execution:
  1. TenantGuard extracts companyId, userId from JWT
  2. PermissionGuard reads @RequirePermissions metadata
  3. AuthorizationService.hasAllPermissions(companyId, userId, ['jobs:create'])
  4. Get user's role: Recruiter
  5. Get role permissions: ['candidates:read', 'jobs:create', ...]
  6. Check: 'jobs:create' in permissions? YES ✓
  7. Allow request → Create job

Response (201): { job: {...} }
```

### Flow 2: Viewer Attempts to Delete Job (Denied)

```
User: jane@company.com with Viewer role
Role Permissions: [candidates:read, jobs:read, applications:read, reports:view]

Request: DELETE /api/v1/jobs/xyz
Decorator: @RequirePermissions('jobs:delete')

Execution:
  1. TenantGuard extracts companyId, userId from JWT
  2. PermissionGuard reads @RequirePermissions metadata
  3. AuthorizationService.hasAllPermissions(companyId, userId, ['jobs:delete'])
  4. Get user's role: Viewer
  5. Get role permissions: [candidates:read, jobs:read, ...]
  6. Check: 'jobs:delete' in permissions? NO ✗
  7. Deny request

Response (403): {
  "success": false,
  "error": "ForbiddenException",
  "message": "Missing required permissions: jobs:delete"
}
```

### Flow 3: Custom Permission Override

```
User: bob@company.com with Recruiter role
Admin grants temporary 'reports:export' permission (expires in 7 days)

Request: POST /api/v1/reports/export
Decorator: @RequirePermissions('reports:export')

Execution:
  1. Check role permissions: Recruiter has ['candidates:read', 'jobs:*', ...]
  2. Check user_permissions for 'reports:export' grant
  3. Found: UserPermission(grant_type='grant', expires_at=future)
  4. 'reports:export' added to effective permissions
  5. Check: 'reports:export' in permissions? YES ✓
  6. Allow request → Export reports

Response (200): { report: {...} }
```

---

## Sensitive Action Logging

The `SensitiveActionInterceptor` automatically logs high-risk operations marked as `is_sensitive=true`:

**Sensitive Permissions:**
- `candidates:delete`
- `jobs:delete`
- `users:delete`
- `settings:manage`
- `roles:manage`
- `audit:view`

**Logged Details:**
- User ID and Company ID
- Permissions triggered
- HTTP method and path
- Client IP address
- User agent
- Timestamp

**Audit Entry Example:**
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "user_id": "uuid",
  "action": "SENSITIVE_ACTION_COMPLETED",
  "details": {
    "permissions": ["candidates:delete"],
    "method": "DELETE",
    "path": "/api/v1/candidates/xyz",
    "ipAddress": "192.168.1.1",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

---

## Seeding Default Data

Run this during company onboarding:

```typescript
import { seedDefaultPermissions, seedDefaultRoles } from './src/database/seeds/default-roles-permissions.seed';

// Seed global permissions (one-time)
await seedDefaultPermissions(permissionRepository);

// Seed company roles (per onboarded company)
await seedDefaultRoles(
  companyId,
  roleRepository,
  rolePermissionRepository,
  permissionRepository
);
```

This creates:
- **20 global permissions** (candidates, jobs, users, reports, settings, roles, audit, webhooks)
- **4 system roles per company** (Admin, Recruiter, Hiring Manager, Viewer)

---

## Configuration

Set these environment variables:

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRY=1h                    # Access token expiry
JWT_REFRESH_EXPIRY=7d            # Refresh token expiry

# Cache Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=3600                   # 1 hour for permission cache

# Bcrypt Configuration
BCRYPT_ROUNDS=10                 # Cost factor for password hashing
```

---

## Testing Examples

### Test Effective Permissions Calculation

```typescript
// User: john (Recruiter role) + custom grant for 'reports:export'
// Expected: [candidates:read, jobs:*, applications:*, ..., reports:export]

const permissions = await authorizationService.getUserPermissions(
  companyId,
  userId
);

expect(permissions).toContain('candidates:read');
expect(permissions).toContain('jobs:create');
expect(permissions).toContain('reports:export');
expect(permissions).not.toContain('candidates:delete');
```

### Test Wildcard Matching

```typescript
// User has 'candidates:*' permission
const hasRead = await authorizationService.hasPermission(
  companyId,
  userId,
  'candidates:read'
);
const hasDelete = await authorizationService.hasPermission(
  companyId,
  userId,
  'candidates:delete'
);

expect(hasRead).toBe(true);
expect(hasDelete).toBe(true);
```

### Test Permission Caching

```typescript
// First call: queries database
const perms1 = await authorizationService.getUserPermissions(companyId, userId);

// Second call: returns from cache (within 1 hour)
const perms2 = await authorizationService.getUserPermissions(companyId, userId);

expect(perms1).toEqual(perms2);
// Cache should contain: `user_permissions:${companyId}:${userId}`
```

### Test Sensitive Action Logging

```typescript
// Intercept DELETE candidates/:id request
// Expect audit entry with:
// - action: 'SENSITIVE_ACTION_COMPLETED'
// - permissions: ['candidates:delete']
// - method: 'DELETE'
// - path: '/api/v1/candidates/xyz'
```

---

## Security Best Practices

1. **Always extract companyId from JWT token**, never from request body/params
2. **Use TenantGuard on all protected endpoints** to validate tenant context
3. **Require explicit permissions** for sensitive operations (delete, export, manage)
4. **Cache permissions locally** to reduce database load
5. **Invalidate cache** immediately after permission changes
6. **Log all RBAC changes** for compliance and debugging
7. **Use HTTPS** for all authentication endpoints
8. **Rotate JWT secrets** periodically
9. **Implement MFA** for sensitive actions (especially if `requires_mfa=true`)
10. **Monitor audit logs** for suspicious permission grants/revokes

---

## Troubleshooting

### User unable to perform action despite having role

**Possible causes:**
1. Permission not assigned to role
2. User has custom revoke for that permission
3. Cache not invalidated after permission change
4. Wrong permission name format (use `candidates:read`, not `candidates_read`)

**Solution:**
1. Check `role_permissions` table for the role
2. Check `user_permissions` table for revokes
3. Manually invalidate cache: `await authorizationService.invalidateUserPermissionsCache(companyId, userId)`
4. Verify permission name matches exactly

### "Missing required permissions" error on allowed endpoint

**Possible causes:**
1. PermissionGuard not registered in module
2. @RequirePermissions decorator missing
3. Tenant context not extracted (TenantGuard not applied)

**Solution:**
1. Verify PermissionGuard in module providers
2. Add @RequirePermissions decorator to endpoint
3. Add TenantGuard before PermissionGuard

### Slow permission checks

**Solution:**
1. Enable Redis caching
2. Increase cache TTL
3. Preload permissions in background job
4. Add database indexes on (company_id, user_id)

---

## Related Documentation

- [MULTI_TENANT_ENFORCEMENT.md](../MULTI_TENANT_ENFORCEMENT.md) - Tenant isolation
- [PRODUCTION_AUTH_RBAC.md](../PRODUCTION_AUTH_RBAC.md) - Complete RBAC spec
- [API_ENDPOINTS.md](../API_ENDPOINTS.md) - Full API documentation

