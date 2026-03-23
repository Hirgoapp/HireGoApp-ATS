# Phase 4.4: Audit Logging - Complete

## Overview
Persistent audit logging is implemented to record create/update/delete and sensitive actions, scoped per company. Logs are stored in `audit_logs` with filters and query endpoints.

## Features Implemented
- Persistent audit storage using TypeORM
- Backward-compatible `AuditService.log()` signature support
- Safe handling of non-tenant contexts (skip DB, dev console only)
- Query endpoints with filtering by entity, user, action, and date range
- Global registration via `CommonModule`

## Database Schema
- Table: `audit_logs` (created by migration `1704067223000-CreateAuditLogsTable.ts`)
- Indexed by `(company_id, entity_type, created_at)` and `(company_id, user_id, created_at)`

## Code
- Entity: `src/common/entities/audit-log.entity.ts`
- Service: `src/common/services/audit.service.ts`
- Controller: `src/common/controllers/audit.controller.ts`
- Module: `src/common/common.module.ts` (global)

## Endpoints
- GET `/api/v1/audit/logs` — Filtered audit logs
- GET `/api/v1/audit/logs/entity/:entityType/:entityId` — Entity history
- GET `/api/v1/audit/logs/user/:userId` — User activity

Permissions: `audit:view` via `Require` decorator and `RoleGuard`.

## Usage Patterns
- Standard logging:
```ts
await auditService.log(companyId, userId, {
  entityType: 'candidate',
  entityId: candidateId,
  action: 'CREATE',
  newValues: dto,
  ip: req.ip,
  userAgent: req.get('user-agent'),
  path: req.path,
});
```

- Helpers:
```ts
await auditService.logCreate(companyId, userId, 'candidate', candidateId, dto, { ip, userAgent, path });
await auditService.logUpdate(companyId, userId, 'candidate', candidateId, before, after, { ip, userAgent, path });
await auditService.logDelete(companyId, userId, 'candidate', candidateId, before, { ip, userAgent, path });
```

## Notes
- When `companyId` is missing (system/super-admin), logs are skipped in DB to avoid FK violations; dev console logging only.
- Existing callers (`SensitiveActionInterceptor`, auth flows, licensing, etc.) continue to work.

## Try It
- Query latest logs for a company:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/audit/logs?limit=50"
```

- Inspect entity history:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/audit/logs/entity/candidate/<uuid>"
```

## Status: ✅ COMPLETE
Ready to proceed with Phase 4.5 (API keys).
