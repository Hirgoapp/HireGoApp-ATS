# ATS SaaS - Quick Reference & Checklists

## 📚 Documentation Reading Order

For first-time readers, follow this sequence:

1. **START HERE**: [README.md](./README.md) - Overview & high-level intro
2. **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) - System design & principles
3. **Database**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Data model & relationships
4. **Modules**: [CORE_MODULES.md](./CORE_MODULES.md) - Feature modules & services
5. **Code Structure**: [BACKEND_FOLDER_STRUCTURE.md](./BACKEND_FOLDER_STRUCTURE.md) - File organization
6. **API Reference**: [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Complete endpoint documentation
7. **Implementation**: [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Build plan & timeline

---

## 🔑 Key Concepts Quick Reference

### Multi-Tenancy
```
Definition: Multiple companies (tenants) use same codebase
Implementation: company_id in every table + application-level filtering
Isolation: No data crosses company boundaries
```

### Custom Fields (Metadata-Driven)
```
Problem: Each customer wants different fields
Solution: Store field definitions in custom_fields table
Storage: Entity JSONB columns hold dynamic values
Result: No schema changes needed per customer
```

### Soft Deletes
```
deleted_at IS NULL: Record is active
deleted_at IS NOT NULL: Record is deleted
Benefit: Preserve audit trail, enable recovery
Pattern: Queries always filter WHERE deleted_at IS NULL
```

### JSONB Columns
```
Use Case: Semi-structured data that varies by company
Examples: custom_fields, feature_flags, settings, validation_rules
Benefit: Flexibility without schema changes
Performance: Indexed JSONB operators for querying
```

### Feature Flags
```
Company A (Basic): customFields=false, analytics=false
Company B (Premium): customFields=true, analytics=true
Controlled by: license_tier + feature_flags JSONB
Checked: At route guard level
```

---

## 📋 Entity Relationships Quick Reference

### Core Flow: Job → Application → Candidate
```
1. Create Job (with Pipeline)
   ↓
2. Create/Import Candidates
   ↓
3. Create Applications (link Candidate to Job)
   ↓
4. Move Applications through Pipeline Stages
   ↓
5. Rate, Evaluate, Interview Applications
   ↓
6. Hire or Reject
```

### Custom Fields Flow
```
Admin defines fields (CustomFields table)
   ↓
Application stores values (applications.custom_fields JSONB)
   ↓
API renders with validation
   ↓
Audit log tracks changes
```

### Notification Flow
```
User action (e.g., move to stage)
   ↓
Event emitted
   ↓
Notification Service creates record
   ↓
Email Service sends email (async)
   ↓
Webhook Publisher sends to external systems
```

---

## 🏗️ Database Tables Cheat Sheet

| Table | Purpose | Tenant Isolated | Key Relationships |
|-------|---------|---------------|--------------------|
| companies | Tenant data | Root (parent) | 1:N with all others |
| users | Team members | Yes | N:M permissions |
| candidates | Candidate DB | Yes | 1:N applications |
| jobs | Job posts | Yes | 1:N applications |
| applications | Job applications | Yes | N:1 job, N:1 candidate |
| pipelines | Pipelines | Yes | 1:N stages |
| pipeline_stages | Pipeline stages | Via pipeline | 1:N applications |
| custom_fields | Field definitions | Yes | Type-agnostic |
| documents | File storage | Yes | N:1 candidate |
| activity_log | Audit trail | Yes | Generic entities |
| notifications | User notifications | Yes | N:1 user |
| api_keys | API access | Yes | N:1 company |
| webhook_subscriptions | Event subscriptions | Yes | 1:N logs |
| webhook_logs | Delivery tracking | Yes | N:1 subscription |

---

## 🔐 Security Layers Checklist

### Layer 1: Transport
- [ ] HTTPS/TLS only
- [ ] No sensitive data in URLs
- [ ] Secure headers (HSTS, CSP, X-Frame-Options)

### Layer 2: Authentication
- [ ] JWT with expiry
- [ ] Refresh token rotation
- [ ] Logout (token blacklist)
- [ ] Email verification

### Layer 3: Authorization
- [ ] Role-based access (admin, recruiter, viewer)
- [ ] Tenant validation (company_id check)
- [ ] Permission guards on sensitive endpoints
- [ ] License checks for premium features

### Layer 4: Data Access
- [ ] All queries filtered by company_id
- [ ] Soft deletes respected
- [ ] Parameterized queries (no SQL injection)
- [ ] Rate limiting per user/tenant

### Layer 5: Audit & Monitoring
- [ ] Activity logs with user context
- [ ] Error tracking with tenant info
- [ ] Structured logging
- [ ] Alert on suspicious activity

---

## 📊 Module Dependency Chain

```
✓ Health                       (independent)
  ↓
✓ Auth + Multi-Tenancy        (gates everything)
  ├── Companies               (tenant data)
  ├── Users                   (team members)
  │   ├── Candidates          (person database)
  │   ├── Jobs                (job postings)
  │   │   └── Applications    (track applications)
  │   │       └── Pipelines   (workflow stages)
  │   ├── Documents           (file storage)
  │   ├── Notifications       (in-app + email)
  │   ├── Webhooks            (event integrations)
  │   ├── API Keys            (external access)
  │   ├── Audit Logs          (compliance trail)
  │   ├── Custom Fields       (metadata customization)
  │   └── Analytics           (metrics & reports)
  └── Search                  (future full-text search)
```

**Build Order**: Follow dependency chain top-to-bottom

---

## 🛠️ Development Workflow

### Starting New Feature

```bash
# 1. Create module structure
src/modules/feature-name/
├── feature-name.module.ts
├── feature-name.controller.ts
├── feature-name.service.ts
├── entities/
│   └── feature-name.entity.ts
├── dto/
│   ├── create-feature-name.dto.ts
│   └── update-feature-name.dto.ts
├── repositories/
│   └── feature-name.repository.ts
└── tests/
    ├── feature-name.service.spec.ts
    └── feature-name.controller.spec.ts

# 2. Create entity/migration
npm run typeorm migration:generate -n CreateFeatureName

# 3. Run migration
npm run migration:run

# 4. Implement service
# - Include companyId in all queries
# - Add to activity_log on mutations

# 5. Create controller
# - Add @TenantGuard() and @Auth() decorators
# - Use standardized response format

# 6. Write tests
npm test -- feature-name

# 7. Document in API_ENDPOINTS.md
# - Add endpoint section
# - Include request/response examples
```

### Tenant Isolation Checklist for Each Feature

- [ ] Entity has `company_id` field
- [ ] Repository queries filter by `company_id`
- [ ] Controller validates user's `company_id` matches
- [ ] No cross-tenant data in responses
- [ ] Tests verify tenant isolation
- [ ] Activity log includes `company_id`
- [ ] Soft delete respected in queries

---

## 🧪 Testing Strategy

### Unit Tests (Service Layer)
```typescript
// Test business logic without database
// Mock repositories, external services
// Example: Candidate deduplication logic
```

### Integration Tests (Service + Repository)
```typescript
// Test with real database (test instance)
// Verify queries work correctly
// Test JSONB custom fields
// Example: Create candidate with custom fields
```

### E2E Tests (Full API Flow)
```typescript
// Test complete workflows
// Multiple modules together
// Example: Create job → Create application → Move to stage
```

### Tenant Isolation Tests
```typescript
// Verify company_id filtering
// Test access controls
// Verify no cross-tenant data leaks
// Example: User A cannot see User B's candidates
```

---

## 📈 Performance Optimization Checklist

### Database
- [ ] Indexes on company_id + common filters
- [ ] Avoid N+1 queries (use JOIN)
- [ ] Pagination for large result sets
- [ ] Query timeouts configured
- [ ] Connection pooling enabled

### Caching
- [ ] Cache custom field definitions (1 hour TTL)
- [ ] Cache user permissions (session TTL)
- [ ] Cache company settings (1 hour TTL)
- [ ] Cache invalidation on updates

### API
- [ ] Response compression (gzip)
- [ ] API response < 100ms target (p95)
- [ ] Database query < 50ms target (p95)
- [ ] Pagination limits (max 100 per page)
- [ ] Field selection (return only needed fields)

### Background Jobs
- [ ] Email sending (async)
- [ ] Document parsing (async)
- [ ] Webhook delivery (async + retry)
- [ ] Report generation (async)

---

## 🚨 Common Pitfalls to Avoid

### 1. Forgetting company_id
```typescript
❌ const candidates = await candidateRepository.find();
✅ const candidates = await candidateRepository.find({ 
     where: { companyId: tenantContext.companyId } 
   });
```

### 2. Exposing other company's data
```typescript
❌ res.json({ data: allApplications });
✅ res.json({ data: applicationsForThisCompany });
```

### 3. Hard-coded logic for one customer
```typescript
❌ if (company.name === "SpecificCorp") { ... }
✅ if (company.featureFlags.premiumFeature) { ... }
```

### 4. Skipping soft deletes
```typescript
❌ DELETE FROM candidates WHERE id = ...;
✅ UPDATE candidates SET deleted_at = NOW() WHERE id = ...;
✅ SELECT * WHERE deleted_at IS NULL;
```

### 5. Not logging tenant context
```typescript
❌ logger.error('Failed to create application');
✅ logger.error('Failed to create application', { 
     userId, companyId, jobId, candidateId 
   });
```

### 6. Forgetting to validate tenant ownership
```typescript
❌ const user = await userService.findById(userId);
✅ const user = await userService.findById(userId, companyId);
   // Verify user.companyId === requiredCompanyId
```

---

## 🔍 Debugging Checklist

When something breaks:

- [ ] **Check tenant context** - Is company_id correct in JWT?
- [ ] **Verify database filtering** - Is company_id in WHERE clause?
- [ ] **Check soft deletes** - Is deleted_at = NULL in query?
- [ ] **Verify permissions** - Does user have required role?
- [ ] **Check custom fields** - Is JSONB path correct?
- [ ] **Test with curl** - Isolate from frontend
- [ ] **Check logs** - Search for error with context
- [ ] **Database query** - Run SQL directly to verify result
- [ ] **Cache invalidation** - Try clearing Redis
- [ ] **Race condition** - Check concurrent operations

---

## 📱 API Design Patterns

### Standard Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Request successful",
  "timestamp": "ISO-8601"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Validation failed",
  "errors": [ { "field": "...", "message": "..." } ],
  "timestamp": "ISO-8601"
}
```

### Pagination
```json
{
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "pages": 5,
    "currentPage": 1,
    "hasMore": true
  }
}
```

### Listing Endpoints
```
GET /api/v1/resource?limit=20&offset=0&sort=-createdAt&filter=value
```

### Creation Endpoints
```
POST /api/v1/resource
201 Created with Location header
```

### Update Endpoints
```
PUT /api/v1/resource/:id (full update)
200 OK with updated object
```

### Deletion Endpoints
```
DELETE /api/v1/resource/:id (soft delete)
200 OK with success message
```

---

## 🔄 Git Workflow Recommendation

```bash
# Create feature branch from main
git checkout -b feature/module-name

# Make changes with frequent commits
git commit -m "feat(module): description"

# Push to remote
git push origin feature/module-name

# Create PR for code review
# - Include tests
# - Update API documentation
# - Add to implementation checklist

# After approval, merge to main
git merge feature/module-name

# Deploy to staging for testing
# After testing, deploy to production
```

---

## 🚀 Deployment Checklist

### Before Production
- [ ] All tests passing (npm test)
- [ ] Code coverage > 80%
- [ ] No security warnings
- [ ] Database migrations tested
- [ ] Performance benchmarked
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Disaster recovery tested
- [ ] Documentation complete
- [ ] Team trained

### Deployment
- [ ] Tag release version
- [ ] Build Docker image
- [ ] Push to registry
- [ ] Update infrastructure (IaC)
- [ ] Run health checks
- [ ] Monitor logs for errors
- [ ] Check performance metrics

### Post-Deployment
- [ ] Monitor application metrics
- [ ] Check error rates
- [ ] Verify database performance
- [ ] Test critical workflows
- [ ] User acceptance testing
- [ ] Document any issues

---

## 📞 Quick Help

### Where do I find...?

| What | Where |
|------|-------|
| Database table definitions | [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) → Tables section |
| Module responsibilities | [CORE_MODULES.md](./CORE_MODULES.md) → Module sections |
| API endpoint details | [API_ENDPOINTS.md](./API_ENDPOINTS.md) → Endpoint sections |
| Folder structure | [BACKEND_FOLDER_STRUCTURE.md](./BACKEND_FOLDER_STRUCTURE.md) → Directory tree |
| Implementation tasks | [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) → Phase tasks |
| Architecture principles | [ARCHITECTURE.md](./ARCHITECTURE.md) → Principles section |
| Custom field handling | [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) → custom_fields table |
| Tenant isolation | [ARCHITECTURE.md](./ARCHITECTURE.md) → Multi-Tenancy Strategy |
| Security layers | [ARCHITECTURE.md](./ARCHITECTURE.md) → Security Layers section |

---

## 💡 Pro Tips

1. **Start with auth** - Everything depends on it
2. **Test tenant isolation early** - Don't discover it later
3. **Use custom fields from day one** - Don't hard-code customer logic
4. **Cache aggressively** - But invalidate carefully
5. **Log with context** - Always include company_id, user_id
6. **Write migrations** - Never ALTER schema in prod directly
7. **Backup before migration** - Especially on prod
8. **Feature flag risky changes** - Gradual rollout
9. **Monitor at scale** - Start before you need it
10. **Document as you go** - Not at the end

---

## 🎯 Success Indicators

### Week 1-3 (Foundation)
- [ ] Auth working, JWT tokens issued
- [ ] Database schema created & tested
- [ ] Multi-tenant isolation verified
- [ ] First test passing

### Week 4-6 (Core Features)
- [ ] Candidates CRUD working
- [ ] Jobs CRUD working
- [ ] Custom fields functional
- [ ] 60%+ test coverage

### Week 7-9 (Workflow)
- [ ] Applications created & tracked
- [ ] Stage transitions working
- [ ] Evaluations saved
- [ ] 70%+ test coverage

### Week 10-11 (Integration)
- [ ] Notifications sending
- [ ] Webhooks delivering
- [ ] Activity logs complete
- [ ] 75%+ test coverage

### Week 12-14 (Polish)
- [ ] Analytics endpoints working
- [ ] Performance optimized
- [ ] Security audit passed
- [ ] 80%+ test coverage
- [ ] Production ready

---

## 📚 External Resources

- NestJS Documentation: https://docs.nestjs.com
- TypeORM Documentation: https://typeorm.io
- PostgreSQL Documentation: https://www.postgresql.org/docs
- Redis Documentation: https://redis.io/documentation
- JWT Introduction: https://jwt.io/introduction
- REST API Best Practices: https://restfulapi.net

---

This quick reference should help you navigate the foundation efficiently. Refer to specific documentation files for deep dives into each area.

Good luck building! 🚀

