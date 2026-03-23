# ATS SaaS - Production-Grade Authentication & RBAC

## Overview

This document defines a production-grade authentication and role-based access control (RBAC) system that separates **roles** (job titles) from **permissions** (actions) for maximum flexibility and security.

**Goal**: Granular, tenant-aware authorization with role-permission decoupling  
**Approach**: Role-based hierarchy + Fine-grained permissions + Tenant-scoped enforcement

---

## 1. Core Concepts

### Roles vs Permissions

#### Roles (WHAT YOU ARE)
A role represents a job title or position within a company:
- `Admin` - Full system access
- `Recruiter` - Day-to-day recruiting operations
- `HiringManager` - Make hiring decisions
- `Viewer` - Read-only access

#### Permissions (WHAT YOU CAN DO)
A permission represents a specific action:
- `candidates:read`
- `candidates:create`
- `candidates:update`
- `candidates:delete`
- `jobs:publish`
- `applications:move_stage`
- `reports:view`
- `users:invite`

### Multi-Tenant Scoping
All permissions are tenant-scoped:
```
Permission: candidates:update
Tenant A: User CAN update candidates in Tenant A only
Tenant B: CANNOT update candidates in Tenant B
```

---

## 2. Database Schema

### Table 1: roles

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Role Identity
  name VARCHAR(100) NOT NULL,        -- 'admin', 'recruiter', etc
  slug VARCHAR(50) NOT NULL,         -- lowercase, hyphen-separated
  description TEXT,
  
  -- Role Configuration
  is_system BOOLEAN DEFAULT false,   -- Cannot be modified if true
  is_default BOOLEAN DEFAULT false,  -- Assigned to new users by default
  display_order INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE (company_id, slug),
  INDEX: (company_id, is_default)
);
```

### Table 2: permissions

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  
  -- Permission Identity
  name VARCHAR(100) NOT NULL UNIQUE, -- 'candidates:read', 'jobs:create'
  description TEXT,
  
  -- Categorization
  resource VARCHAR(50) NOT NULL,     -- 'candidates', 'jobs', 'users', 'reports'
  action VARCHAR(50) NOT NULL,       -- 'read', 'create', 'update', 'delete', 'publish'
  
  -- Permission Level
  level INT DEFAULT 0,               -- 0=basic, 1=intermediate, 2=admin
  
  -- Risk Assessment
  is_sensitive BOOLEAN DEFAULT false, -- Requires audit logging
  requires_mfa BOOLEAN DEFAULT false, -- Require MFA for this action
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX: (resource, action)
);

-- Seed initial permissions
INSERT INTO permissions (name, resource, action, level, is_sensitive) VALUES
('candidates:read', 'candidates', 'read', 0, false),
('candidates:create', 'candidates', 'create', 0, false),
('candidates:update', 'candidates', 'update', 0, false),
('candidates:delete', 'candidates', 'delete', 2, true),
('jobs:read', 'jobs', 'read', 0, false),
('jobs:create', 'jobs', 'create', 1, false),
('jobs:publish', 'jobs', 'publish', 1, false),
('jobs:delete', 'jobs', 'delete', 2, true),
('users:read', 'users', 'read', 1, false),
('users:create', 'users', 'create', 1, false),
('users:update', 'users', 'update', 1, false),
('users:delete', 'users', 'delete', 2, true),
('users:invite', 'users', 'invite', 1, false),
('reports:view', 'reports', 'view', 1, false),
('reports:export', 'reports', 'export', 1, false),
('settings:manage', 'settings', 'manage', 2, true),
('roles:manage', 'roles', 'manage', 2, true),
('audit:view', 'audit', 'view', 2, true),
('api:access', 'api', 'access', 1, false),
('webhooks:manage', 'webhooks', 'manage', 1, false);
```

### Table 3: role_permissions (Many-to-Many)

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (role_id, permission_id),
  INDEX: (role_id),
  INDEX: (permission_id)
);
```

### Table 4: user_permissions (Custom Overrides)

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  -- Override Type
  grant_type VARCHAR(50) NOT NULL,   -- 'grant' (give), 'revoke' (remove)
  reason TEXT,                       -- Why this override exists
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,              -- Temporary override
  
  UNIQUE (company_id, user_id, permission_id),
  INDEX: (company_id, user_id),
  INDEX: (expires_at)
);
```

### Table 5: role_permissions_audit

```sql
CREATE TABLE role_permission_audit (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Change Details
  action VARCHAR(50) NOT NULL,       -- 'ROLE_CREATED', 'PERMISSION_GRANTED', etc
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  
  -- Before/After
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX: (company_id, created_at),
  INDEX: (user_id, created_at)
);
```

---

## 3. Default Roles & Permission Assignments

### System Roles (Cannot be deleted)

**ADMIN Role** (Full Access)
```typescript
{
  name: 'Admin',
  slug: 'admin',
  permissions: [
    'candidates:*',           // All candidate actions
    'jobs:*',                 // All job actions
    'applications:*',         // All application actions
    'users:read', 'users:create', 'users:update', 'users:delete', 'users:invite',
    'reports:*',
    'settings:manage',
    'roles:manage',
    'audit:view',
    'webhooks:manage'
  ]
}
```

**RECRUITER Role** (Day-to-day Operations)
```typescript
{
  name: 'Recruiter',
  slug: 'recruiter',
  permissions: [
    'candidates:read',
    'candidates:create',
    'candidates:update',
    'jobs:read',
    'jobs:create',
    'jobs:publish',
    'applications:read',
    'applications:create',
    'applications:update',     // Move to next stage
    'reports:view',
    'api:access'
  ]
}
```

**HIRING_MANAGER Role** (Decision Maker)
```typescript
{
  name: 'Hiring Manager',
  slug: 'hiring_manager',
  permissions: [
    'candidates:read',
    'jobs:read',
    'applications:read',
    'applications:update',      // Approve/reject
    'reports:view',
    'reports:export'
  ]
}
```

**VIEWER Role** (Read-Only)
```typescript
{
  name: 'Viewer',
  slug: 'viewer',
  permissions: [
    'candidates:read',
    'jobs:read',
    'applications:read',
    'reports:view'
  ]
}
```

---

## 4. Authorization Service

### Main Service

```typescript
// services/authorization.service.ts

@Injectable()
export class AuthorizationService {
  constructor(
    private roleRepository: Repository<Role>,
    private rolePermissionRepository: Repository<RolePermission>,
    private userPermissionRepository: Repository<UserPermission>,
    private permissionRepository: Repository<Permission>,
    private usersRepository: Repository<User>,
    private auditService: AuditService,
    private cacheService: CacheService
  ) {}

  /**
   * Get user's effective permissions (role + custom overrides)
   */
  async getUserPermissions(
    companyId: string,
    userId: string
  ): Promise<string[]> {
    // Try cache first
    const cacheKey = `user_permissions:${companyId}:${userId}`;
    let permissions = await this.cacheService.get(cacheKey);

    if (permissions) {
      return permissions;
    }

    // Get user's role
    const user = await this.usersRepository.findOne({
      where: { id: userId, company_id: companyId },
      relations: ['role']
    });

    if (!user || !user.role) {
      return [];
    }

    // Get permissions from role
    const rolePerms = await this.rolePermissionRepository.find({
      where: { role_id: user.role_id },
      relations: ['permission']
    });

    let permissionNames = rolePerms.map(rp => rp.permission.name);

    // Get custom overrides (grants and revokes)
    const customPerms = await this.userPermissionRepository.find({
      where: {
        company_id: companyId,
        user_id: userId,
        expires_at: IsNull() // Non-expired
      },
      relations: ['permission']
    });

    // Apply custom grants
    const grants = customPerms
      .filter(p => p.grant_type === 'grant')
      .map(p => p.permission.name);
    permissionNames = [...new Set([...permissionNames, ...grants])];

    // Apply custom revokes
    const revokes = customPerms
      .filter(p => p.grant_type === 'revoke')
      .map(p => p.permission.name);
    permissionNames = permissionNames.filter(p => !revokes.includes(p));

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, permissionNames, 3600);

    return permissionNames;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    companyId: string,
    userId: string,
    requiredPermission: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(companyId, userId);

    // Exact match
    if (permissions.includes(requiredPermission)) {
      return true;
    }

    // Wildcard match (e.g., 'candidates:*' matches 'candidates:read')
    const wildcard = requiredPermission.split(':')[0] + ':*';
    if (permissions.includes(wildcard)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user has ANY of the permissions
   */
  async hasAnyPermission(
    companyId: string,
    userId: string,
    permissions: string[]
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(companyId, userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has ALL of the permissions
   */
  async hasAllPermissions(
    companyId: string,
    userId: string,
    permissions: string[]
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(companyId, userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Create custom role for company
   */
  async createRole(
    companyId: string,
    userId: string,
    dto: CreateRoleDto
  ): Promise<Role> {
    const role = this.roleRepository.create({
      company_id: companyId,
      name: dto.name,
      slug: this.generateSlug(dto.name),
      description: dto.description,
      is_system: false
    });

    const saved = await this.roleRepository.save(role);

    // Assign permissions to role
    if (dto.permissionIds && dto.permissionIds.length > 0) {
      const rolePerms = dto.permissionIds.map(permId =>
        this.rolePermissionRepository.create({
          role_id: saved.id,
          permission_id: permId
        })
      );
      await this.rolePermissionRepository.save(rolePerms);
    }

    // Audit
    await this.auditService.log(companyId, userId, {
      entityType: 'role',
      entityId: saved.id,
      action: 'CREATE',
      newValues: saved
    });

    return saved;
  }

  /**
   * Grant permission to user (override)
   */
  async grantPermission(
    companyId: string,
    userId: string,
    targetUserId: string,
    permissionId: string,
    reason?: string,
    expiresAt?: Date
  ): Promise<UserPermission> {
    // Check admin permission
    const hasAccess = await this.hasPermission(companyId, userId, 'users:update');
    if (!hasAccess) {
      throw new ForbiddenException('Cannot grant permissions');
    }

    let userPerm = await this.userPermissionRepository.findOne({
      where: {
        company_id: companyId,
        user_id: targetUserId,
        permission_id: permissionId
      }
    });

    if (!userPerm) {
      userPerm = this.userPermissionRepository.create({
        company_id: companyId,
        user_id: targetUserId,
        permission_id: permissionId,
        grant_type: 'grant',
        reason,
        expires_at: expiresAt
      });
    } else {
      userPerm.grant_type = 'grant';
      userPerm.reason = reason;
      userPerm.expires_at = expiresAt;
    }

    const saved = await this.userPermissionRepository.save(userPerm);

    // Invalidate cache
    await this.cacheService.del(`user_permissions:${companyId}:${targetUserId}`);

    // Audit
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId }
    });

    await this.auditService.log(companyId, userId, {
      entityType: 'user_permission',
      entityId: targetUserId,
      action: 'GRANT_PERMISSION',
      newValues: { permission: permission.name, reason, expiresAt }
    });

    return saved;
  }

  /**
   * Revoke permission from user (override)
   */
  async revokePermission(
    companyId: string,
    userId: string,
    targetUserId: string,
    permissionId: string,
    reason?: string
  ): Promise<void> {
    // Check admin permission
    const hasAccess = await this.hasPermission(companyId, userId, 'users:update');
    if (!hasAccess) {
      throw new ForbiddenException('Cannot revoke permissions');
    }

    const userPerm = await this.userPermissionRepository.findOne({
      where: {
        company_id: companyId,
        user_id: targetUserId,
        permission_id: permissionId
      }
    });

    if (userPerm) {
      userPerm.grant_type = 'revoke';
      userPerm.reason = reason;
      await this.userPermissionRepository.save(userPerm);

      // Invalidate cache
      await this.cacheService.del(
        `user_permissions:${companyId}:${targetUserId}`
      );

      // Audit
      const permission = await this.permissionRepository.findOne({
        where: { id: permissionId }
      });

      await this.auditService.log(companyId, userId, {
        entityType: 'user_permission',
        entityId: targetUserId,
        action: 'REVOKE_PERMISSION',
        newValues: { permission: permission.name, reason }
      });
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    companyId: string,
    userId: string,
    targetUserId: string,
    roleId: string
  ): Promise<User> {
    // Check permission
    const hasAccess = await this.hasPermission(companyId, userId, 'users:update');
    if (!hasAccess) {
      throw new ForbiddenException('Cannot assign roles');
    }

    // Verify role belongs to company
    const role = await this.roleRepository.findOne({
      where: { id: roleId, company_id: companyId }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Update user
    const user = await this.usersRepository.findOne({
      where: { id: targetUserId, company_id: companyId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role_id = roleId;
    const updated = await this.usersRepository.save(user);

    // Invalidate cache
    await this.cacheService.del(
      `user_permissions:${companyId}:${targetUserId}`
    );

    // Audit
    await this.auditService.log(companyId, userId, {
      entityType: 'user_role',
      entityId: targetUserId,
      action: 'ASSIGN_ROLE',
      newValues: { roleId, roleName: role.name }
    });

    return updated;
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

## 5. Permission Guards

### Permission Guard

```typescript
// guards/permission.guard.ts

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private authorizationService: AuthorizationService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.get<string[]>(
      'REQUIRED_PERMISSIONS',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true; // No permission check required
    }

    const request = context.switchToHttp().getRequest();
    const { companyId, userId } = request.tenant;

    // Check if user has required permissions
    const hasPermission = await this.authorizationService.hasAllPermissions(
      companyId,
      userId,
      requiredPermissions
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}
```

### Any Permission Guard

```typescript
// guards/any-permission.guard.ts

@Injectable()
export class AnyPermissionGuard implements CanActivate {
  constructor(
    private authorizationService: AuthorizationService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'ANY_PERMISSION',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { companyId, userId } = request.tenant;

    const hasPermission = await this.authorizationService.hasAnyPermission(
      companyId,
      userId,
      requiredPermissions
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

---

## 6. Permission Decorators

### Require All Permissions

```typescript
// decorators/require-permissions.decorator.ts

export function RequirePermissions(...permissions: string[]) {
  return SetMetadata('REQUIRED_PERMISSIONS', permissions);
}

// Usage
@Delete('candidates/:id')
@RequirePermissions('candidates:delete')
async deleteCandidate(@Param('id') candidateId: string) {
  return { success: true };
}
```

### Require Any Permission

```typescript
// decorators/require-any-permission.decorator.ts

export function RequireAnyPermission(...permissions: string[]) {
  return SetMetadata('ANY_PERMISSION', permissions);
}

// Usage
@Get('reports/candidate-funnel')
@RequireAnyPermission('reports:view', 'reports:export')
async getCandidateFunnel() {
  return { report: 'data' };
}
```

---

## 7. Example Permission Flows

### Flow 1: Recruiter Creates Job (Allowed)

```
User: Recruiter in Company A
Role: Recruiter
Permissions: ['candidates:read', 'jobs:create', 'jobs:publish', ...]

Request: POST /api/v1/jobs
@RequirePermissions('jobs:create')

Execution:
  1. Extract companyId, userId from JWT
  2. Call PermissionGuard
  3. PermissionGuard calls authorizationService.hasAllPermissions(
       companyId, userId, ['jobs:create']
     )
  4. Get user's role: Recruiter
  5. Get role's permissions: ['jobs:create', ...]
  6. Check: 'jobs:create' in permissions? YES ✓
  7. Allow request
  8. Create job

Response (201): { job: {...} }
```

### Flow 2: Viewer Attempts to Delete Job (Denied)

```
User: Viewer in Company A
Role: Viewer
Permissions: ['candidates:read', 'jobs:read', 'applications:read', 'reports:view']

Request: DELETE /api/v1/jobs/{jobId}
@RequirePermissions('jobs:delete')

Execution:
  1. Extract companyId, userId from JWT
  2. Call PermissionGuard
  3. PermissionGuard calls authorizationService.hasAllPermissions(
       companyId, userId, ['jobs:delete']
     )
  4. Get user's role: Viewer
  5. Get role's permissions: ['candidates:read', 'jobs:read', ...]
  6. Check: 'jobs:delete' in permissions? NO ✗
  7. Throw ForbiddenException

Response (403):
{
  "success": false,
  "error": "ForbiddenException",
  "message": "Missing required permissions: jobs:delete"
}
```

### Flow 3: Custom Permission Override

```
User: Recruiter in Company A
Base Role: Recruiter
Base Permissions: ['candidates:read', 'candidates:create', ...]

Admin grants custom permission: 'reports:export' (temporary override)
  • User still has: Recruiter permissions
  • Plus: 'reports:export' (custom grant)
  • Until: 2025-02-01

Request: POST /api/v1/reports/candidates/export
@RequirePermissions('reports:export')

Execution:
  1. Get role permissions: ['candidates:read', 'candidates:create', ...]
  2. Get custom user permissions: [{'grant_type': 'grant', 'permission': 'reports:export'}]
  3. Check: 'reports:export' in permissions? NO (role)
  4. Check: 'reports:export' in custom grants? YES ✓
  5. Allow request

Response (200): { export_id: 'exp_123', downloadUrl: '...' }

(After 2025-02-01, override expires, recruiter loses reports:export)
```

---

## 8. Sensitive Action Tracking

### Sensitive Permission Audit

```typescript
// interceptors/sensitive-action.interceptor.ts

@Injectable()
export class SensitiveActionInterceptor implements NestInterceptor {
  constructor(
    private authorizationService: AuthorizationService,
    private auditService: AuditService,
    private permissionRepository: Repository<Permission>
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { companyId, userId } = request.tenant;

    // Get endpoint metadata
    const handler = context.getHandler();
    const requiredPerms = Reflect.getMetadata('REQUIRED_PERMISSIONS', handler);

    // Check if any permission is sensitive
    if (requiredPerms) {
      for (const permName of requiredPerms) {
        const perm = await this.permissionRepository.findOne({
          where: { name: permName }
        });

        if (perm?.is_sensitive) {
          // Log sensitive action with full context
          await this.auditService.log(companyId, userId, {
            entityType: 'sensitive_action',
            entityId: request.path,
            action: 'SENSITIVE_ACTION',
            newValues: {
              action: request.method,
              path: request.path,
              permission: permName,
              ip: request.ip,
              timestamp: new Date()
            }
          });

          // TODO: Send real-time alert to admins
        }
      }
    }

    return next.handle();
  }
}
```

---

## 9. API Examples

### Get User's Permissions

```
GET /api/v1/users/me/permissions
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "userId": "user_123",
    "role": "recruiter",
    "permissions": [
      "candidates:read",
      "candidates:create",
      "candidates:update",
      "jobs:read",
      "jobs:create",
      "jobs:publish",
      "applications:read",
      "applications:update",
      "reports:view"
    ],
    "customOverrides": [
      {
        "permission": "reports:export",
        "type": "grant",
        "expiresAt": "2025-02-01T00:00:00Z"
      }
    ]
  }
}
```

### Assign Role to User

```
POST /api/v1/users/{userId}/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "roleId": "role_456"
}

Response (200):
{
  "success": true,
  "data": {
    "userId": "user_123",
    "role": {
      "id": "role_456",
      "name": "Hiring Manager"
    }
  }
}
```

### Grant Permission Override

```
POST /api/v1/users/{userId}/permissions/grant
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "permissionId": "perm_789",
  "reason": "Temporary access for Q1 analytics",
  "expiresAt": "2025-03-31T23:59:59Z"
}

Response (201):
{
  "success": true,
  "data": {
    "userId": "user_123",
    "permission": "reports:export",
    "type": "grant",
    "reason": "Temporary access for Q1 analytics",
    "expiresAt": "2025-03-31T23:59:59Z"
  }
}
```

### Revoke Permission

```
POST /api/v1/users/{userId}/permissions/revoke
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "permissionId": "perm_789",
  "reason": "Q1 period ended"
}

Response (200):
{
  "success": true,
  "message": "Permission revoked"
}
```

### Create Custom Role

```
POST /api/v1/roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Senior Recruiter",
  "description": "Experienced recruiter with reporting access",
  "permissionIds": [
    "candidates:read",
    "candidates:create",
    "candidates:update",
    "jobs:read",
    "jobs:create",
    "jobs:publish",
    "applications:read",
    "applications:update",
    "reports:view",
    "reports:export",
    "webhooks:manage"
  ]
}

Response (201):
{
  "success": true,
  "data": {
    "id": "role_custom_123",
    "name": "Senior Recruiter",
    "slug": "senior_recruiter",
    "permissions": [...]
  }
}
```

### Check Permission

```
POST /api/v1/auth/check-permission
Authorization: Bearer <token>
Content-Type: application/json

{
  "permission": "reports:export"
}

Response (200):
{
  "success": true,
  "data": {
    "hasPermission": true
  }
}
```

---

## 10. Permission Matrix

### Standard Role-Permission Matrix

```
                         | Admin | Recruiter | Manager | Viewer |
========================|=======|===========|=========|========|
candidates:read         |  ✓    |     ✓     |    ✓    |   ✓    |
candidates:create       |  ✓    |     ✓     |    ✗    |   ✗    |
candidates:update       |  ✓    |     ✓     |    ✗    |   ✗    |
candidates:delete       |  ✓    |     ✗     |    ✗    |   ✗    |
jobs:read               |  ✓    |     ✓     |    ✓    |   ✓    |
jobs:create             |  ✓    |     ✓     |    ✗    |   ✗    |
jobs:publish            |  ✓    |     ✓     |    ✗    |   ✗    |
jobs:delete             |  ✓    |     ✗     |    ✗    |   ✗    |
applications:read       |  ✓    |     ✓     |    ✓    |   ✓    |
applications:update     |  ✓    |     ✓     |    ✓    |   ✗    |
reports:view            |  ✓    |     ✓     |    ✓    |   ✓    |
reports:export          |  ✓    |     ✗     |    ✓    |   ✗    |
users:read              |  ✓    |     ✗     |    ✗    |   ✗    |
users:create            |  ✓    |     ✗     |    ✗    |   ✗    |
users:update            |  ✓    |     ✗     |    ✗    |   ✗    |
users:delete            |  ✓    |     ✗     |    ✗    |   ✗    |
users:invite            |  ✓    |     ✗     |    ✗    |   ✗    |
settings:manage         |  ✓    |     ✗     |    ✗    |   ✗    |
roles:manage            |  ✓    |     ✗     |    ✗    |   ✗    |
webhooks:manage         |  ✓    |     ✓     |    ✗    |   ✗    |
api:access              |  ✓    |     ✓     |    ✗    |   ✗    |
audit:view              |  ✓    |     ✗     |    ✗    |   ✗    |
```

---

## 11. Testing

### Authorization Service Tests

```typescript
describe('AuthorizationService', () => {
  let service: AuthorizationService;

  beforeEach(async () => {
    // Setup test module
  });

  it('should return user permissions from role', async () => {
    const permissions = await service.getUserPermissions(
      'company_1',
      'recruiter_user'
    );

    expect(permissions).toContain('candidates:read');
    expect(permissions).toContain('jobs:create');
    expect(permissions).not.toContain('users:delete');
  });

  it('should grant temporary permission override', async () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await service.grantPermission(
      'company_1',
      'admin_user',
      'recruiter_user',
      'perm_reports_export',
      'Temporary reporting access',
      expiresAt
    );

    const permissions = await service.getUserPermissions(
      'company_1',
      'recruiter_user'
    );

    expect(permissions).toContain('reports:export');
  });

  it('should revoke permission after expiration', async () => {
    // Mock expired permission
    const expiredAt = new Date(Date.now() - 1000);

    // Simulate fetch with expired permission
    const permissions = await service.getUserPermissions(
      'company_1',
      'recruiter_user'
    );

    expect(permissions).not.toContain('reports:export');
  });

  it('should enforce wildcard permissions', async () => {
    // Admin has 'candidates:*'
    const hasPermission = await service.hasPermission(
      'company_1',
      'admin_user',
      'candidates:read'
    );

    expect(hasPermission).toBe(true);
  });

  it('should prevent cross-tenant permission access', async () => {
    const hasPermission = await service.hasPermission(
      'company_2',  // Different company
      'company_1_admin_user',
      'candidates:read'
    );

    expect(hasPermission).toBe(false);
  });
});
```

---

## Summary

| Component | Purpose |
|-----------|---------|
| **roles table** | Defines job titles within company |
| **permissions table** | Defines atomic actions (read, create, etc) |
| **role_permissions** | Maps roles to permissions |
| **user_permissions** | Stores custom overrides (temporary grants/revokes) |
| **AuthorizationService** | Checks permissions, manages roles/overrides |
| **PermissionGuard** | Enforces permission checks on routes |
| **Decorators** | Mark routes with required permissions |

This system provides:
- ✅ Fine-grained permission control
- ✅ Flexible role assignment
- ✅ Temporary permission overrides
- ✅ Tenant-scoped authorization
- ✅ Sensitive action auditing
- ✅ Permission caching for performance
- ✅ Wildcard permission support
