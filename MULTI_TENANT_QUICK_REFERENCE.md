# Multi-Tenant Enforcement Quick Reference

**TL;DR**: Every request must include company_id from JWT, and every query must filter by it.

## The Rule

```
NO REQUEST → DATABASE WITHOUT COMPANY_ID FILTER
```

## Minimal Endpoint Implementation

```typescript
@Controller('api/v1/candidates')
@UseGuards(JwtAuthGuard)  // ← Always required
export class CandidateController {
  
  @Get()
  list(@Tenant() tenant: TenantContext) {  // ← Inject tenant context
    // ✓ Service filters by tenant.companyId
    return this.service.getCandidates(tenant.companyId);
  }

  @Get(':id')
  @UseGuards(TenantGuard)  // ← For routes with parameters
  get(@Param('id') id: string, @Tenant() tenant: TenantContext) {
    // ✓ Service verifies belongs to company
    return this.service.getCandidate(id, tenant.companyId);
  }

  @Post()
  create(@Body() dto: any, @Tenant() tenant: TenantContext) {
    sanitizeCompanyIdFromBody(dto);  // ← Prevent users from setting company_id
    // ✓ Service creates with tenant.companyId (never from body)
    return this.service.create(dto, tenant.companyId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any, @Tenant() tenant: TenantContext) {
    sanitizeCompanyIdFromBody(dto);
    // ✓ Service updates with company_id filter
    return this.service.update(id, tenant.companyId, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Tenant() tenant: TenantContext) {
    // ✓ Service soft-deletes with company_id filter
    return this.service.delete(id, tenant.companyId);
  }
}
```

## Minimal Service Implementation

```typescript
@Injectable()
export class CandidateService {
  
  async getCandidates(companyId: string) {
    // ✓ Always include company_id filter
    return this.repo.find({
      where: { company_id: companyId, deleted_at: null }
    });
  }

  async getCandidate(id: string, companyId: string) {
    // ✓ Always include company_id filter
    const candidate = await this.repo.findOne({
      where: { id, company_id: companyId }
    });
    
    if (!candidate) throw new NotFoundException();
    return candidate;
  }

  async create(dto: any, companyId: string, tenant: TenantContext) {
    // ✓ Force company_id from parameter
    const candidate = await this.repo.save({
      ...dto,
      company_id: companyId
    });

    // ✓ Log all modifications
    await this.audit.logCreate(companyId, tenant.userId, 'candidate', candidate.id, dto, {
      ip: tenant.ip,
      userAgent: tenant.userAgent,
      path: '/candidates'
    });

    return candidate;
  }

  async update(id: string, companyId: string, dto: any, tenant: TenantContext) {
    // ✓ Verify exists in company
    const old = await this.getCandidate(id, companyId);

    // ✓ Update with company_id filter
    await this.repo.update(
      { id, company_id: companyId },
      dto
    );

    // ✓ Log changes
    await this.audit.logUpdate(companyId, tenant.userId, 'candidate', id, old, dto, {
      ip: tenant.ip,
      userAgent: tenant.userAgent,
      path: `/candidates/${id}`
    });

    return { ...old, ...dto };
  }

  async delete(id: string, companyId: string, tenant: TenantContext) {
    // ✓ Verify exists in company
    const old = await this.getCandidate(id, companyId);

    // ✓ Soft delete with company_id filter
    await this.repo.update(
      { id, company_id: companyId },
      { deleted_at: new Date() }
    );

    // ✓ Log deletion
    await this.audit.logDelete(companyId, tenant.userId, 'candidate', id, old, {
      ip: tenant.ip,
      userAgent: tenant.userAgent,
      path: `/candidates/${id}`
    });
  }
}
```

## Common Patterns

### Pattern 1: Read by ID
```typescript
@Get(':id')
@UseGuards(TenantGuard)
async get(@Param('id') id: string, @Tenant() tenant: TenantContext) {
  const item = await this.service.getById(id, tenant.companyId);
  if (!item) throw new NotFoundException();
  return item;
}
```

### Pattern 2: Create
```typescript
@Post()
async create(@Body() dto: any, @Tenant() tenant: TenantContext) {
  sanitizeCompanyIdFromBody(dto);
  return this.service.create({ ...dto, company_id: tenant.companyId }, tenant);
}
```

### Pattern 3: Update
```typescript
@Put(':id')
async update(@Param('id') id: string, @Body() dto: any, @Tenant() tenant: TenantContext) {
  sanitizeCompanyIdFromBody(dto);
  return this.service.update(id, tenant.companyId, dto, tenant);
}
```

### Pattern 4: Delete
```typescript
@Delete(':id')
async delete(@Param('id') id: string, @Tenant() tenant: TenantContext) {
  return this.service.delete(id, tenant.companyId, tenant);
}
```

### Pattern 5: List with Pagination
```typescript
@Get()
async list(
  @Query('limit') limit = 20,
  @Query('offset') offset = 0,
  @Tenant() tenant: TenantContext
) {
  const [data, total] = await this.service.paginate(
    tenant.companyId,
    limit,
    offset
  );
  return { data, total, limit, offset };
}
```

### Pattern 6: Bulk Update
```typescript
@Put('bulk')
async bulkUpdate(@Body() dto: any, @Tenant() tenant: TenantContext) {
  const { ids, data } = dto;
  
  // Verify all belong to company
  const count = await this.repo.count({
    where: { id: In(ids), company_id: tenant.companyId }
  });
  
  if (count !== ids.length) {
    throw new BadRequestException('Some items not found in your company');
  }
  
  return this.repo.update(
    { id: In(ids), company_id: tenant.companyId },
    data
  );
}
```

### Pattern 7: Cross-Tenant Relationship Check
```typescript
async createApplication(
  jobId: string,
  candidateId: string,
  companyId: string
) {
  // Verify job belongs to company
  const job = await this.jobRepo.findOne({
    where: { id: jobId, company_id: companyId }
  });
  if (!job) throw new NotFoundException('Job not found');

  // Verify candidate belongs to company
  const candidate = await this.candidateRepo.findOne({
    where: { id: candidateId, company_id: companyId }
  });
  if (!candidate) throw new NotFoundException('Candidate not found');

  // Create application with company_id
  return this.repo.save({
    job_id: jobId,
    candidate_id: candidateId,
    company_id: companyId
  });
}
```

## Decorators Reference

```typescript
// Inject entire tenant context
@Tenant() tenant: TenantContext

// Inject specific fields
@CompanyId() companyId: string
@UserId() userId: string
@UserRole() role: string
@UserPermissions() permissions: string[]
```

## Guards Reference

```typescript
// For all authenticated routes
@UseGuards(JwtAuthGuard)

// For routes with path parameters that need ownership verification
@UseGuards(JwtAuthGuard, TenantGuard)

// For specific role requirement
@UseGuards(JwtAuthGuard, RoleGuard('admin', 'recruiter'))

// For specific permission requirement
@UseGuards(JwtAuthGuard, PermissionGuard('candidates:create'))
```

## Utils Reference

```typescript
// Verify entity belongs to company
verifyTenantOwnership(entity, companyId);

// Verify all entities belong to company
verifyTenantOwnershipBulk(entities, companyId);

// Prevent company_id in body
sanitizeCompanyIdFromBody(body);

// Prevent multiple sensitive fields
sanitizeBody(body, ['company_id', 'created_at', 'deleted_at']);

// Check user has permission
checkPermission(permissions, 'candidates:create');

// Check user has any permission
checkPermissionAny(permissions, ['candidates:create', 'candidates:edit']);

// Check user has all permissions
checkPermissionAll(permissions, ['candidates:create', 'candidates:edit']);

// Verify two entities can be linked
verifyRelationshipWithinTenant(entity1, entity2, companyId);
```

## Query Patterns

### ✅ Correct Patterns

```typescript
// Filter by company_id
SELECT * FROM candidates WHERE company_id = $1

// Multiple conditions
SELECT * FROM candidates WHERE company_id = $1 AND status = $2

// Join with company_id check on both tables
SELECT j.*, ps.* FROM jobs j
INNER JOIN pipeline_stages ps ON j.pipeline_id = ps.pipeline_id
WHERE j.company_id = $1 AND ps.company_id = $1

// Pagination with company_id
SELECT * FROM candidates WHERE company_id = $1 LIMIT 20 OFFSET 0

// Bulk operations with company_id
UPDATE candidates SET status = $1 WHERE id IN ($2) AND company_id = $3
```

### ❌ Wrong Patterns

```typescript
// ✗ No company_id filter - SECURITY BREACH
SELECT * FROM candidates

// ✗ Company_id not in WHERE - LEAKS DATA
SELECT * FROM jobs WHERE status = 'open'

// ✗ Join missing company_id on joined table
SELECT j.*, ps.* FROM jobs j
INNER JOIN pipeline_stages ps ON j.pipeline_id = ps.pipeline_id
WHERE j.company_id = $1

// ✗ Bulk update missing company_id
UPDATE candidates SET status = $1 WHERE id IN ($2)

// ✗ Aggregation missing company_id filter
SELECT COUNT(*) FROM candidates GROUP BY status
```

## Checklist for Every Endpoint

- [ ] **Guard**: `@UseGuards(JwtAuthGuard)` present
- [ ] **Tenant Injection**: Using `@Tenant()` or specific decorators
- [ ] **Body Sanitization**: `sanitizeCompanyIdFromBody()` for POST/PUT
- [ ] **Query Filter**: All DB queries include `company_id` filter
- [ ] **Ownership Check**: Verify resource belongs to company before returning
- [ ] **Cross-Tenant Validation**: If linking entities, verify both in same company
- [ ] **Audit Logging**: Call `auditService.log()` for CREATE/UPDATE/DELETE
- [ ] **Error Response**: Return 404 (not 403) for "not found due to access denial"
- [ ] **Pagination**: Validate limit/offset before querying
- [ ] **Tests**: Include multi-tenant isolation test cases

## Most Common Mistakes

1. **Forgetting company_id in query**
   ```typescript
   // ✗ Wrong
   return this.repo.find({ where: { status: 'active' } });
   
   // ✓ Correct
   return this.repo.find({ where: { company_id, status: 'active' } });
   ```

2. **Allowing company_id from request body**
   ```typescript
   // ✗ Wrong
   return this.repo.save({ ...dto });  // User can set company_id
   
   // ✓ Correct
   return this.repo.save({ ...dto, company_id });  // Force from JWT
   ```

3. **Forgetting company_id in joined tables**
   ```typescript
   // ✗ Wrong
   SELECT j.*, ps.* FROM jobs j
   JOIN pipeline_stages ps ON j.pipeline_id = ps.pipeline_id
   WHERE j.company_id = $1
   
   // ✓ Correct
   SELECT j.*, ps.* FROM jobs j
   JOIN pipeline_stages ps ON j.pipeline_id = ps.pipeline_id
   WHERE j.company_id = $1 AND ps.company_id = $1
   ```

4. **Skipping audit logging**
   ```typescript
   // ✗ Wrong
   await this.repo.update({ id }, dto);
   
   // ✓ Correct
   await this.repo.update({ id, company_id }, dto);
   await this.audit.logUpdate(company_id, user_id, 'entity', id, old, dto, context);
   ```

5. **Not verifying cross-tenant relationships**
   ```typescript
   // ✗ Wrong
   return this.repo.save({ job_id, candidate_id, company_id });
   
   // ✓ Correct
   const job = await this.jobRepo.findOne({ where: { id: job_id, company_id } });
   const candidate = await this.candidateRepo.findOne({ where: { id: candidate_id, company_id } });
   if (!job || !candidate) throw new NotFoundException();
   return this.repo.save({ job_id, candidate_id, company_id });
   ```

## Testing

Always include:

```typescript
it('should not allow cross-tenant access', async () => {
  const itemB = await createItem(companyB.id, {});
  const response = await request(app.getHttpServer())
    .get(`/api/v1/items/${itemB.id}`)
    .set('Authorization', `Bearer ${tokenA}`);
  
  expect(response.status).toBe(404);  // Not 403
});
```

---

**Remember**: If in doubt, add the company_id filter!
