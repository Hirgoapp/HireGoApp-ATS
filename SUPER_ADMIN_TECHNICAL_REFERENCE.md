# Super Admin - Technical Reference

**Version**: 1.0  
**Date**: January 2, 2026  
**Audience**: Developers, DevOps, Technical Leads

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ATS SaaS Application                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │  Super Admin Portal  │      │  Company User Portal │        │
│  └──────────────────────┘      └──────────────────────┘        │
│           │                              │                     │
│  ┌────────┴──────────────┐      ┌────────┴───────────────┐    │
│  │ POST /api/super-admin │      │  POST /api/auth/login │    │
│  │        /auth/login    │      │                       │    │
│  └────────┬──────────────┘      └────────┬───────────────┘    │
│           │                              │                    │
│           ├─────────────────────────────>│                    │
│           │  ╔═══════════════════════════════════════╗        │
│           │  ║ JWT Middleware (Global)              ║        │
│           │  ║ Extracts & Validates Token           ║        │
│           │  ║ req.user = payload                   ║        │
│           │  ╚═════════════════════════════════════╝        │
│           │                                                  │
│  ┌────────┴──────────────┐      ┌────────┬───────────────┐  │
│  │ SuperAdminGuard       │      │ CompanyUserGuard      │  │
│  │ ✓ type === 'super...' │      │ ✓ type === 'company..'│  │
│  │ ✓ userId present      │      │ ✓ companyId present   │  │
│  │ ✗ Rejects company toks│      │ ✗ Rejects super admin │  │
│  └────────┬──────────────┘      └────────┬───────────────┘  │
│           │                              │                  │
│  ┌────────┴──────────────┐      ┌────────┴───────────────┐  │
│  │ SuperAdminController  │      │ Company Controllers   │  │
│  │ - Companies           │      │ (Jobs, Candidates,    │  │
│  │ - Licenses            │      │  Users, etc.)         │  │
│  │ - Modules             │      │                       │  │
│  │ - Admins              │      │                       │  │
│  └────────┬──────────────┘      └────────┬───────────────┘  │
│           │                              │                  │
│  ┌────────┴──────────────┐      ┌────────┴───────────────┐  │
│  │ SuperAdminService     │      │ Domain Services       │  │
│  │ (Business Logic)      │      │ (Candidates, Jobs,    │  │
│  │                       │      │  Interviews, etc.)    │  │
│  └────────┬──────────────┘      └────────┬───────────────┘  │
│           │                              │                  │
│  ┌────────┴──────────────┐      ┌────────┴───────────────┐  │
│  │ Database Layer        │      │ Database Layer        │  │
│  │ super_admin_users     │      │ users (company_id)    │  │
│  │ companies             │      │ jobs (company_id)     │  │
│  │ licenses              │      │ candidates (comp...)  │  │
│  └───────────────────────┘      └───────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── super-admin/
│   ├── controllers/
│   │   ├── super-admin-auth.controller.ts    # Auth endpoints
│   │   └── super-admin.controller.ts         # Management endpoints
│   ├── services/
│   │   ├── super-admin-auth.service.ts       # Auth business logic
│   │   └── super-admin.service.ts            # Management business logic
│   ├── entities/
│   │   └── super-admin-user.entity.ts        # TypeORM entity
│   ├── guards/
│   │   └── super-admin.guard.ts              # Route guards
│   └── super-admin.module.ts                 # Module definition
├── database/
│   └── migrations/
│       └── 1704211200000-CreateSuperAdminUsersTable.ts
├── scripts/
│   └── seed-super-admin.ts                   # Demo seeding
├── auth/
│   ├── entities/user.entity.ts               # Company users
│   └── guards/                               # Company user guards
└── companies/
    └── entities/company.entity.ts            # Company entity
```

---

## Entity Models

### SuperAdminUser Entity

```typescript
@Entity('super_admin_users')
export class SuperAdminUser {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar', { length: 100 })
    first_name: string;

    @Column('varchar', { length: 100 })
    last_name: string;

    @Column('varchar', { length: 255, unique: true })
    email: string;

    @Column('varchar', { length: 20, nullable: true })
    phone: string;

    @Column('varchar', { length: 255 })
    password_hash: string;

    @Column('varchar', { length: 50, default: 'super_admin' })
    role: string;  // super_admin, support, operations

    @Column('jsonb', { default: '{}' })
    permissions: Record<string, any>;

    @Column('boolean', { default: true })
    is_active: boolean;

    @Column('boolean', { default: false })
    email_verified: boolean;

    @Column('timestamp', { nullable: true })
    last_login_at: Date;

    @Column('jsonb', { default: '{}' })
    preferences: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn({ nullable: true })
    deleted_at: Date;
}
```

**Key Characteristics:**
- NO `company_id` field (not tied to any company)
- Separate `email` uniqueness (global across system)
- Own `role` and `permissions` system
- Tracks `last_login_at` for audit

---

## Service Layer

### SuperAdminAuthService

Handles authentication and user management for super admins.

**Key Methods:**

```typescript
// Login with email/password
async login(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id; email; firstName; lastName; role };
}>

// Refresh access token
async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
}>

// Create new super admin user
async createSuperAdminUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
}): Promise<SuperAdminUser>

// Change password
async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
): Promise<void>

// Get user details
async getSuperAdminUser(id: string): Promise<SuperAdminUser>

// Update user
async updateSuperAdminUser(
    id: string,
    data: Partial<User>
): Promise<SuperAdminUser>
```

**Token Generation:**

```typescript
// Access Token Payload
interface SuperAdminTokenPayload {
    userId: string;
    email: string;
    type: 'super_admin';        // ← Key differentiator
    role: string;
    permissions?: string[];[];
    iat?: number;
    exp?: number;
}

// Refresh Token Payload
interface SuperAdminRefreshTokenPayload {
    userId: string;
    type: 'super_admin_refresh';
}
```

### SuperAdminService

Handles business logic for company and license management.

**Key Methods:**

```typescript
// Company Management
async createCompany(data: CreateCompanyDto, superAdminId: string): Promise<{
    company: Company;
    admin: User;
}>

async getAllCompanies(
    page: number,
    limit: number,
    search?: string,
    isActive?: boolean
): Promise<{ companies; pagination }>

async getCompanyById(companyId: string): Promise<Company>

async updateCompany(
    companyId: string,
    data: Partial<CompanyUpdate>,
    superAdminId: string
): Promise<Company>

// License Management
async assignLicense(
    data: AssignLicenseDto,
    superAdminId: string
): Promise<{ success; message }>

// Module Management
async enableModule(
    companyId: string,
    data: EnableModuleDto,
    superAdminId: string
): Promise<{ module; isEnabled; enabledAt }>

async disableModule(
    companyId: string,
    data: DisableModuleDto,
    superAdminId: string
): Promise<{ module; isEnabled; disabledAt }>

async getCompanyModules(companyId: string): Promise<Record<string, any>>

// Admin User Management
async createCompanyAdmin(
    companyId: string,
    data: CreateCompanyAdminDto,
    superAdminId: string
): Promise<User>

async getCompanyAdmins(companyId: string): Promise<User[]>
```

---

## Guards & Protection

### SuperAdminGuard

Protects Super Admin routes. Used on all `/api/super-admin/*` controllers.

```typescript
@Injectable()
export class SuperAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;  // From JWT middleware

        // Check token type
        if (user?.type !== 'super_admin') {
            throw new ForbiddenException('Super Admin access required');
        }

        if (!user?.userId) {
            throw new UnauthorizedException('Invalid token');
        }

        return true;
    }
}
```

**Usage:**
```typescript
@Controller('api/super-admin')
@UseGuards(SuperAdminGuard)
export class SuperAdminController {
    // All methods require super admin token
}
```

### CompanyUserGuard

Protects Company routes from super admin token usage.

```typescript
@Injectable()
export class CompanyUserGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Reject super admin tokens
        if (user?.type === 'super_admin') {
            throw new ForbiddenException('Super Admin tokens cannot access company endpoints');
        }

        // Require company_user type
        if (user?.type !== 'company_user') {
            throw new ForbiddenException('Company user access required');
        }

        if (!user?.companyId || !user?.userId) {
            throw new UnauthorizedException('Invalid token');
        }

        return true;
    }
}
```

---

## Database Migration

### Migration File

```typescript
export class CreateSuperAdminUsersTable1704211200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Creates super_admin_users table
        // Creates indexes on email and is_active
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drops table on rollback
    }
}
```

**Run Migration:**
```bash
npm run typeorm migration:run
```

**Rollback:**
```bash
npm run typeorm migration:revert
```

---

## Authentication Flow

### Login Flow

```
1. Client POSTs to /api/super-admin/auth/login
   ├─ email: "admin@ats.com"
   └─ password: "password"

2. SuperAdminAuthController.login()
   └─ Calls SuperAdminAuthService.login()

3. SuperAdminAuthService
   ├─ Query super_admin_users by email
   ├─ Verify password with bcrypt
   ├─ Generate JWT tokens
   ├─ Update last_login_at
   └─ Log audit event

4. Return tokens to client
   ├─ accessToken (24h expiry)
   ├─ refreshToken (7d expiry)
   └─ User details

5. Client stores tokens locally
   └─ Sends accessToken in Authorization header for subsequent requests

6. JWT Middleware validates token on each request
   ├─ Verify signature
   ├─ Check expiration
   └─ Extract payload → req.user

7. SuperAdminGuard validates
   ├─ Check token.type === 'super_admin'
   └─ Grant access to controller
```

### Token Validation Flow

```
Request arrives with:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

↓

JWT Middleware
├─ Extract token from header
├─ Verify signature (using SUPER_ADMIN_JWT_SECRET)
├─ Check expiration
└─ req.user = decoded payload

↓

Payload:
{
  userId: "550e8400-e29b-41d4-a716-446655440000",
  email: "admin@ats.com",
  type: "super_admin",
  role: "super_admin",
  permissions: ["*"],
  iat: 1704211200,
  exp: 1704297600
}

↓

SuperAdminGuard
├─ Check req.user.type === "super_admin"
├─ Check req.user.userId exists
└─ Grant access

↓

Controller method executes
```

---

## Audit Logging

All Super Admin operations are logged with complete context.

### Audit Events

```typescript
// Company Creation
{
  action: 'SUPER_ADMIN_COMPANY_CREATED',
  entityId: 'company-uuid',
  entityType: 'Company',
  changes: {
    name: 'Acme Corp',
    slug: 'acme-corp',
    licenseTier: 'premium'
  },
  performedBy: 'super-admin-uuid',
  companyId: null,  // Super admin operations have no company scope
  timestamp: '2026-01-02T10:00:00Z'
}

// License Assignment
{
  action: 'SUPER_ADMIN_LICENSE_ASSIGNED',
  entityId: 'company-uuid',
  entityType: 'License',
  changes: {
    tier: 'enterprise',
    billingCycle: 'annual'
  },
  performedBy: 'super-admin-uuid',
  companyId: null,
  timestamp: '2026-01-02T11:00:00Z'
}

// Module Enabled
{
  action: 'SUPER_ADMIN_MODULE_ENABLED',
  entityId: 'company-uuid',
  entityType: 'FeatureFlag',
  changes: {
    module: 'api',
    enabled: true
  },
  performedBy: 'super-admin-uuid',
  companyId: null,
  timestamp: '2026-01-02T12:00:00Z'
}
```

---

## Error Handling

### Common Error Responses

```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Invalid email or password"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Super Admin access required"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Company not found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "Company slug already exists"
}

// 400 Bad Request
{
  "statusCode": 400,
  "message": "Email and password are required"
}
```

---

## Performance Considerations

### Caching Strategy

```typescript
// Cache Keys
- 'companies:list' - List of all companies (invalidated on create/update)
- 'company:{id}' - Individual company details
- 'company:{id}:features' - Feature flags for company
- 'company:{id}:users' - Admin users for company

// Cache Invalidation
- Company creation: invalidate 'companies:list'
- Company update: invalidate 'company:{id}', 'companies:list'
- Module change: invalidate 'company:{id}', 'company:{id}:features'
- Admin user change: invalidate 'company:{id}:users'

// TTL: 1 hour (default)
```

### Database Indexes

```sql
-- super_admin_users
CREATE INDEX idx_super_admin_users_email ON super_admin_users(email);
CREATE INDEX idx_super_admin_users_is_active ON super_admin_users(is_active);

-- companies (existing)
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- users (existing) with company scope
CREATE INDEX idx_users_company_id_is_active ON users(company_id, is_active);
```

---

## Security Best Practices

### 1. Password Hashing
- Use bcrypt with 10 rounds
- Hash both super admin and company admin passwords
- Never store plaintext passwords

### 2. JWT Secrets
- Use different secrets for super admin vs company users
- Rotate secrets regularly in production
- Store in secure vault (not in .env)

### 3. Rate Limiting
```typescript
// Recommended rate limits
- /api/super-admin/auth/login: 5 requests per 15 minutes per IP
- /api/super-admin/companies: 100 requests per hour per super admin
- /api/super-admin/modules: 100 requests per hour per super admin
```

### 4. Token Expiry
- Access token: 24 hours (for super admin flexibility)
- Refresh token: 7 days (standard refresh cycle)
- Implement token rotation on refresh

### 5. Audit Trail
- Log all super admin actions
- Include who, what, when, where
- Retain audit logs for compliance
- Monitor for suspicious patterns

---

## Testing

### Unit Tests Example

```typescript
describe('SuperAdminAuthService', () => {
    let service: SuperAdminAuthService;
    let repository: Repository<SuperAdminUser>;

    beforeEach(async () => {
        // Setup
    });

    it('should login with valid credentials', async () => {
        // Arrange
        const loginDto = {
            email: 'admin@ats.com',
            password: 'password123'
        };

        // Act
        const result = await service.login(loginDto.email, loginDto.password);

        // Assert
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
        // Expect UnauthorizedException
    });
});
```

### Integration Tests Example

```typescript
describe('SuperAdminController', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => {
        // Setup app
    });

    it('should create company', async () => {
        // POST /api/super-admin/companies with valid token
        // Expect 201 with company data
    });

    it('should reject without token', async () => {
        // POST /api/super-admin/companies without authorization
        // Expect 401
    });
});
```

---

## Deployment Checklist

- [ ] Run migrations: `npm run typeorm migration:run`
- [ ] Run seed: `npm run seed:super-admin`
- [ ] Verify super admin user created
- [ ] Change default super admin password
- [ ] Set production JWT secrets in vault
- [ ] Enable database backups
- [ ] Set up audit logging
- [ ] Configure rate limiting
- [ ] Test login flows
- [ ] Test company creation
- [ ] Monitor logs for errors
- [ ] Verify email notifications (if configured)
- [ ] Document access credentials securely

---

## Troubleshooting Guide

### Token Validation Fails

**Symptoms:** 401 Unauthorized on every super admin request

**Causes & Fixes:**
1. Check JWT secret matches between encoding and validation
2. Verify token hasn't expired
3. Check Authorization header format: `Bearer {token}`
4. Verify JWT_SECRET env var is set correctly

### "Super Admin access required"

**Symptoms:** 403 Forbidden on super admin endpoints

**Causes & Fixes:**
1. Token type is not 'super_admin' - check token origin
2. Using company user token - use super admin token instead
3. Token has been modified - generate new token

### Company Creation Fails

**Symptoms:** 409 Conflict or validation error

**Causes & Fixes:**
1. Slug already exists - use unique slug
2. Email in use - check existing users/companies
3. Validation failed - check required fields
4. Password too short - minimum 8 characters

---

## Related Documentation

- [SUPER_ADMIN_DESIGN.md](./SUPER_ADMIN_DESIGN.md) - Architecture & design
- [SUPER_ADMIN_IMPLEMENTATION_GUIDE.md](./SUPER_ADMIN_IMPLEMENTATION_GUIDE.md) - Usage guide
- [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md) - Company auth system
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Full database design
