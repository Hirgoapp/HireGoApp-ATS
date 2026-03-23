# ATS SaaS - Multi-Tenant Enforcement Strategy

## Overview

This document defines the production-grade multi-tenant enforcement strategy for the ATS SaaS platform. It ensures strict data isolation, prevents cross-tenant data access, and provides comprehensive audit trails for compliance.

**Status**: Strict enforcement at every layer (API, service, database)  
**Approach**: Shared database with application-layer isolation + metadata-driven configuration

---

## 1. Multi-Tenancy Model

### Tenant Isolation Model: Shared Database (Single-Schema)
```
┌─────────────────────────────────────────────────────────┐
│         Single PostgreSQL Database                      │
│                                                         │
│  Company A Data     │    Company B Data    │ Company C  │
│  (company_id: A)    │    (company_id: B)   │ (company_c)│
│  • Users            │    • Users           │ • Users    │
│  • Jobs             │    • Jobs            │ • Jobs     │
│  • Candidates       │    • Candidates      │ • Candidates
│  • Applications     │    • Applications    │ • Applications
│                     │                      │            │
│  Isolation enforced via company_id foreign key + application checks
└─────────────────────────────────────────────────────────┘
```

### Why Shared Database?
✅ Easier operations (one DB to manage)  
✅ Simpler data migration per tenant  
✅ Cost-effective for SaaS scaling  
✅ Metadata-driven customization (no schema changes)  
✅ Future: PostgreSQL Row-Level Security (RLS) for additional layer

### Tenant Identifier
- **Primary Identifier**: `company_id` (UUID) on every data table
- **Secondary Identifier**: `user_id` + `company_id` (user belongs to ONE company)
- **Request Context**: Extracted from JWT token, validated on every request
- **Immutable**: Cannot be changed after entity creation

---

## 2. Tenant Context Middleware

### Middleware: Extract & Validate Tenant Context

**Purpose**: Extract tenant context from JWT token and attach to request object  
**Location**: Applied globally to all API endpoints  
**Execution**: Before controllers

#### Implementation Pattern

```typescript
// middleware/tenant-context.middleware.ts

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private auditService: AuditService
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Extract JWT token from Authorization header
      const token = this.extractToken(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'MissingAuthToken',
          message: 'Authorization token required'
        });
      }

      // 2. Validate & decode JWT
      const payload = this.jwtService.verify(token);

      // 3. Verify token structure
      if (!payload.sub || !payload.companyId) {
        return res.status(401).json({
          success: false,
          error: 'InvalidTokenPayload',
          message: 'Token missing required fields'
        });
      }

      // 4. Attach tenant context to request
      req.tenant = {
        companyId: payload.companyId,      // Tenant identifier
        userId: payload.sub,                // User identifier
        role: payload.role,                 // User role
        permissions: payload.permissions,   // User permissions
        ip: req.ip,                        // For audit trail
        userAgent: req.get('user-agent'),  // For audit trail
        timestamp: new Date()              // Request timestamp
      };

      // 5. Log middleware execution (for debugging)
      this.auditService.logTenantContext({
        companyId: req.tenant.companyId,
        userId: req.tenant.userId,
        action: 'MIDDLEWARE_TENANT_EXTRACTION',
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'AuthenticationFailed',
        message: 'Token validation failed'
      });
    }
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer') return null;

    return token;
  }
}
```

### Tenant Context Type Definition

```typescript
// types/tenant-context.ts

export interface TenantContext {
  companyId: string;        // Tenant's UUID
  userId: string;           // User's UUID
  role: string;             // admin | recruiter | hiring_manager | viewer
  permissions: string[];    // List of permission identifiers
  ip: string;              // IP address for audit
  userAgent: string;       // Browser/client info
  timestamp: Date;         // Request time
  
  // Metadata (optionally added in guards/decorators)
  licenseLevel?: string;   // basic | premium | enterprise
  featureFlags?: Record<string, boolean>;
}
```

---

## 3. Company_ID Enforcement Rules

### Rule 1: JWT Extraction & Validation
**Trigger**: Every API request  
**Action**: Extract company_id from JWT token  
**Enforcement**:
```typescript
// guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Tenant context MUST be present from middleware
    if (!request.tenant || !request.tenant.companyId) {
      throw new UnauthorizedException('Tenant context missing');
    }

    return true;
  }
}
```

### Rule 2: Parameter Validation Against JWT
**Trigger**: Any endpoint with path parameter (e.g., `/users/{userId}`)  
**Action**: Verify the resource belongs to the requesting company  
**Enforcement**:
```typescript
// Example: Get user by ID
// GET /api/v1/users/{userId}

@Get(':userId')
@UseGuards(JwtAuthGuard, TenantGuard)
async getUser(
  @Param('userId') userId: string,
  @Request() req: any // Has req.tenant.companyId
) {
  // Service layer validates ownership
  const user = await this.userService.getUserById(userId, req.tenant.companyId);
  
  if (!user) {
    throw new NotFoundException('User not found');
  }
  
  return user;
}

// In UserService
async getUserById(userId: string, companyId: string) {
  // CRITICAL: Query includes company_id filter
  return this.userRepository.findOne({
    where: {
      id: userId,
      company_id: companyId,  // <-- Tenant isolation
      deleted_at: IsNull()
    }
  });
}
```

### Rule 3: Query-Level Isolation
**Trigger**: All database queries  
**Action**: Always filter by company_id  
**Enforcement**:
```typescript
// database/repositories/base.repository.ts

export class BaseRepository<T> {
  async findByCompany(
    companyId: string,
    criteria: FindOptionsWhere<T>
  ): Promise<T[]> {
    // Automatically adds company_id filter to all queries
    return this.repository.find({
      where: {
        ...criteria,
        company_id: companyId
      }
    });
  }

  async findOneByCompany(
    companyId: string,
    criteria: FindOptionsWhere<T>
  ): Promise<T | null> {
    return this.repository.findOne({
      where: {
        ...criteria,
        company_id: companyId
      }
    });
  }
}
```

### Rule 4: Request Body Sanitization
**Trigger**: POST/PUT/PATCH requests with body  
**Action**: Reject if body contains company_id field  
**Enforcement**:
```typescript
// Prevent users from modifying company_id
@Post('candidates')
@UseGuards(JwtAuthGuard)
async createCandidate(
  @Body() dto: CreateCandidateDto,
  @Request() req: any
) {
  // CRITICAL: Force company_id from JWT, never from request body
  const candidate = await this.candidateService.create({
    ...dto,
    company_id: req.tenant.companyId  // <-- From JWT only
  });

  return candidate;
}
```

### Rule 5: Cross-Tenant Relationship Prevention
**Trigger**: Creating relationships between entities  
**Action**: Verify both entities belong to same company  
**Enforcement**:
```typescript
// Example: Application creation (links job + candidate)
async createApplication(
  companyId: string,
  jobId: string,
  candidateId: string
) {
  // 1. Verify job belongs to company
  const job = await this.jobRepository.findOne({
    where: { id: jobId, company_id: companyId }
  });
  if (!job) throw new NotFoundException('Job not found');

  // 2. Verify candidate belongs to company
  const candidate = await this.candidateRepository.findOne({
    where: { id: candidateId, company_id: companyId }
  });
  if (!candidate) throw new NotFoundException('Candidate not found');

  // 3. Create application with company_id
  return this.applicationRepository.save({
    job_id: jobId,
    candidate_id: candidateId,
    company_id: companyId,  // <-- Enforced
    current_stage_id: job.default_stage_id
  });
}
```

---

## 4. Data Isolation Guarantees

### Guarantee 1: Query-Level Isolation
Every database query includes `company_id` filter:

```typescript
// Example queries that MUST be rejected
❌ SELECT * FROM users;                    // No filter
❌ SELECT * FROM jobs WHERE status='open'; // Missing company_id

// Example queries that ARE ALLOWED
✅ SELECT * FROM users WHERE company_id = $1 AND deleted_at IS NULL;
✅ SELECT * FROM jobs WHERE company_id = $1 AND status = 'open';
```

**Enforcement Mechanism**:
```typescript
// Use repository pattern to enforce filtering
class UserRepository extends BaseRepository<User> {
  async findAllByCompany(companyId: string) {
    return this.find({
      where: {
        company_id: companyId,
        deleted_at: IsNull()
      }
    });
  }

  // Never expose raw query builder to controllers
  // This method prevents misuse
}
```

### Guarantee 2: Join Operations
When joining tables, verify company_id consistency:

```sql
-- CORRECT: Joins with company_id verification
SELECT j.*, ps.* FROM jobs j
  INNER JOIN pipeline_stages ps ON j.pipeline_id = ps.pipeline_id
  WHERE j.company_id = $1 AND ps.company_id = $1;

-- WRONG: Assumes company_id consistency
SELECT j.*, ps.* FROM jobs j
  INNER JOIN pipeline_stages ps ON j.pipeline_id = ps.pipeline_id
  WHERE j.company_id = $1;  -- Missing check on ps
```

### Guarantee 3: Aggregation & Analytics
Ensure aggregations are scoped to company:

```typescript
// Get candidate count per pipeline stage for ONE company
async getCandidateCountByStage(companyId: string) {
  return this.applicationRepository
    .createQueryBuilder('app')
    .select('ps.name', 'stageName')
    .addSelect('COUNT(app.id)', 'count')
    .innerJoin('pipeline_stages', 'ps', 'ps.id = app.current_stage_id')
    .where('app.company_id = :companyId', { companyId })
    .andWhere('ps.company_id = :companyId', { companyId })  // <-- Critical
    .groupBy('ps.id, ps.name')
    .getRawMany();
}
```

### Guarantee 4: Bulk Operations
Verify each entity in bulk operations:

```typescript
// Bulk update candidates
async updateCandidates(
  companyId: string,
  candidateIds: string[],
  updateData: Partial<Candidate>
) {
  // 1. Verify ALL candidates belong to company
  const candidates = await this.candidateRepository.find({
    where: {
      id: In(candidateIds),
      company_id: companyId
    }
  });

  // 2. Verify count matches (no silent failures)
  if (candidates.length !== candidateIds.length) {
    throw new BadRequestException(
      `Some candidates not found in your company`
    );
  }

  // 3. Update with company_id constraint
  return this.candidateRepository.update(
    { id: In(candidateIds), company_id: companyId },
    updateData
  );
}
```

### Guarantee 5: Pagination
Ensure pagination respects tenant boundaries:

```typescript
// Paginated query must include company_id
async getCandidates(
  companyId: string,
  limit: number = 20,
  offset: number = 0,
  filters?: CandidateFilters
) {
  const query = this.candidateRepository
    .createQueryBuilder('candidate')
    .where('candidate.company_id = :companyId', { companyId })
    .andWhere('candidate.deleted_at IS NULL');

  // Apply additional filters
  if (filters?.status) {
    query.andWhere('candidate.status = :status', { status: filters.status });
  }

  // Get total count and paginated data (both scoped to company)
  const [data, total] = await query
    .skip(offset)
    .take(limit)
    .getManyAndCount();

  return { data, total, limit, offset };
}
```

---

## 5. Audit Trail & Compliance

### Audit Log Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action Details
  entity_type VARCHAR(100) NOT NULL, -- 'candidate', 'job', 'user', etc
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'READ_SENSITIVE'
  
  -- Data Changes
  old_values JSONB, -- Previous state (for updates/deletes)
  new_values JSONB, -- New state (for creates/updates)
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  request_path VARCHAR(500),
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX: (company_id, entity_type, created_at),
  INDEX: (company_id, user_id, created_at),
  INDEX: (company_id, entity_id)
);
```

### Audit Service

```typescript
// services/audit.service.ts

@Injectable()
export class AuditService {
  constructor(private auditRepository: Repository<AuditLog>) {}

  async log(
    companyId: string,
    userId: string,
    context: AuditContext
  ): Promise<void> {
    const auditLog = this.auditRepository.create({
      company_id: companyId,
      user_id: userId,
      entity_type: context.entityType,
      entity_id: context.entityId,
      action: context.action,
      old_values: context.oldValues,
      new_values: context.newValues,
      ip_address: context.ip,
      user_agent: context.userAgent,
      request_path: context.path
    });

    await this.auditRepository.save(auditLog);
  }

  async getAuditTrail(
    companyId: string,
    filters: AuditFilters
  ): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: {
        company_id: companyId,
        entity_type: filters.entityType,
        created_at: MoreThan(filters.startDate)
      },
      order: { created_at: 'DESC' },
      take: filters.limit
    });
  }
}
```

### Usage Example

```typescript
// When updating a candidate
async updateCandidate(
  companyId: string,
  candidateId: string,
  updateDto: UpdateCandidateDto,
  userId: string,
  context: TenantContext
) {
  // Get old values
  const oldCandidate = await this.candidateRepository.findOne({
    where: { id: candidateId, company_id: companyId }
  });

  // Perform update
  const updated = await this.candidateRepository.update(
    { id: candidateId, company_id: companyId },
    updateDto
  );

  // Log audit trail
  await this.auditService.log(companyId, userId, {
    entityType: 'candidate',
    entityId: candidateId,
    action: 'UPDATE',
    oldValues: oldCandidate,
    newValues: updateDto,
    ip: context.ip,
    userAgent: context.userAgent,
    path: context.path
  });

  return updated;
}
```

---

## 6. Integration Points

### Request Flow with Tenant Enforcement

```
User Request (Company A)
       ↓
Authorization Header: "Bearer eyJc...[JWT with companyId=A]"
       ↓
TenantContextMiddleware
  • Extract JWT
  • Validate signature
  • Attach req.tenant = { companyId: 'A', userId: '123', ... }
       ↓
JwtAuthGuard
  • Verify req.tenant exists
  • Allow request to proceed
       ↓
Controller (e.g., CandidateController.getCandidate)
  • Receive candidateId from URL param
  • Use req.tenant.companyId as enforcement
       ↓
Service Layer (CandidateService)
  • Query: WHERE id = candidateId AND company_id = req.tenant.companyId
  • If not found → NotFoundException (not just "not found", implies no access)
       ↓
Repository Layer
  • Execute filtered query
  • Result guaranteed to belong to Company A
       ↓
Response to User
  • Data only from Company A
  • Audit logged with Company A context
```

### Endpoint Security Checklist

```
For every endpoint, verify:

✅ 1. JWT Token Required? (use @UseGuards(JwtAuthGuard))
✅ 2. Company_id extracted from JWT? (via TenantContextMiddleware)
✅ 3. URL parameter belongs to company? (service layer verification)
✅ 4. Query filtered by company_id? (repository layer)
✅ 5. Audit logged? (with company_id + user_id + action)
✅ 6. Cross-tenant relationships checked? (if creating links)
✅ 7. Sensitive data access logged? (for compliance)
```

---

## 7. Common Pitfalls & Prevention

### Pitfall 1: Missing company_id in WHERE clause
```typescript
// ❌ WRONG
async getAllJobs() {
  return this.jobRepository.find();  // Exposes all companies' jobs!
}

// ✅ CORRECT
async getAllJobs(companyId: string) {
  return this.jobRepository.find({
    where: { company_id: companyId }
  });
}
```

### Pitfall 2: Extracting company_id from request body
```typescript
// ❌ WRONG
async createJob(@Body() dto: CreateJobDto) {
  const job = await this.jobRepository.save({
    ...dto,
    company_id: dto.company_id  // User can specify any company!
  });
}

// ✅ CORRECT
async createJob(@Body() dto: CreateJobDto, @Request() req) {
  const job = await this.jobRepository.save({
    ...dto,
    company_id: req.tenant.companyId  // From JWT only
  });
}
```

### Pitfall 3: Forgetting joins need company_id too
```typescript
// ❌ WRONG
async getApplicationsWithCandidate(companyId: string) {
  return this.applicationRepository.find({
    where: { company_id: companyId },
    relations: ['candidate']  // Candidate may belong to different company!
  });
}

// ✅ CORRECT
async getApplicationsWithCandidate(companyId: string) {
  return this.applicationRepository
    .createQueryBuilder('app')
    .where('app.company_id = :companyId', { companyId })
    .innerJoinAndSelect(
      'app.candidate',
      'candidate',
      'candidate.company_id = :companyId',  // <-- Check join too
      { companyId }
    )
    .getMany();
}
```

### Pitfall 4: Not validating cross-tenant relationships
```typescript
// ❌ WRONG
async createApplication(jobId: string, candidateId: string) {
  return this.applicationRepository.save({
    job_id: jobId,
    candidate_id: candidateId
  });
  // No check that both belong to same company!
}

// ✅ CORRECT
async createApplication(
  companyId: string,
  jobId: string,
  candidateId: string
) {
  const job = await this.jobRepository.findOne({
    where: { id: jobId, company_id: companyId }
  });
  if (!job) throw new NotFoundException('Job not found');

  const candidate = await this.candidateRepository.findOne({
    where: { id: candidateId, company_id: companyId }
  });
  if (!candidate) throw new NotFoundException('Candidate not found');

  return this.applicationRepository.save({
    job_id: jobId,
    candidate_id: candidateId,
    company_id: companyId
  });
}
```

---

## 8. Testing Multi-Tenant Enforcement

### Test Case: Isolation Verification

```typescript
describe('Multi-Tenant Isolation', () => {
  let companyA: Company;
  let companyB: Company;
  let userA: User;
  let userB: User;

  beforeAll(async () => {
    // Create two companies
    companyA = await createCompany('Company A');
    companyB = await createCompany('Company B');

    // Create users in each company
    userA = await createUser(companyA.id, 'user@companya.com');
    userB = await createUser(companyB.id, 'user@companyb.com');
  });

  it('should not allow Company A user to see Company B candidates', async () => {
    // Create candidate in Company B
    const candidateB = await createCandidate(companyB.id, {
      email: 'candidate@example.com'
    });

    // Try to access as Company A user
    const tokenA = generateJWT(userA.id, companyA.id);
    
    const response = await request(app.getHttpServer())
      .get(`/api/v1/candidates/${candidateB.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(404); // Not found (not 403 - we don't leak info)
  });

  it('should enforce company_id in query results', async () => {
    const candidateA = await createCandidate(companyA.id, {
      email: 'candidate@companya.com'
    });

    const tokenA = generateJWT(userA.id, companyA.id);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/candidates/${candidateA.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.data.company_id).toBe(companyA.id);
  });

  it('should prevent bulk operations across tenants', async () => {
    const candidateA = await createCandidate(companyA.id, {});
    const candidateB = await createCandidate(companyB.id, {});

    const tokenA = generateJWT(userA.id, companyA.id);

    // Try to bulk update including another company's candidate
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/candidates/bulk`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        candidateIds: [candidateA.id, candidateB.id],
        status: 'rejected'
      });

    expect(response.status).toBe(400); // Only 1 candidate found, not 2
  });
});
```

---

## Summary

| Layer | Enforcement Mechanism | Responsibility |
|-------|----------------------|-----------------|
| **Middleware** | Extract & validate company_id from JWT | Ensure every request has tenant context |
| **Guards** | Verify JWT and tenant presence | Block unauthenticated requests |
| **Controllers** | Pass company_id to services | Never extract from request body |
| **Services** | Verify cross-tenant relationships | Prevent data linking across companies |
| **Repositories** | Add company_id to all queries | Guarantee query-level isolation |
| **Database** | Foreign key constraints | Enforce referential integrity |
| **Audit Layer** | Log all data access | Enable compliance & forensics |

**Result**: No request reaches the database without company_id filtering. No data can leak across tenants.
