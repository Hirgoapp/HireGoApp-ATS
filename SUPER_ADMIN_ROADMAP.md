# Super Admin Roadmap (Prioritized)

This roadmap is organized so you can execute **what’s needed now** for a Super Admin who manages **customer companies**, and defer “nice-to-have / scale” items into later versions.

---

## Current Version (Implemented)

### Companies (Tenant management)
- ✅ Create company (with initial admin)
- ✅ Edit company profile (**name, slug, email, license tier, active/inactive, description**)
- ✅ Soft delete company
- ✅ Company detail view

### Company Admin Users (Customer admins)
- ✅ Create company admin
- ✅ List company admins
- ✅ Edit company admin (**name, email, role, active/inactive, optional password reset**)
- ✅ Resend welcome email

### Modules (Per-company access control)
- ✅ Show modules dynamically from backend feature flags
- ✅ Enable/disable module per company

### Operational quality
- ✅ Clear UI errors (conflict / validation messages shown in modals)
- ✅ No “stuck overlay” modals

---

## Next Version (Planned)

### Licensing enforcement (tie modules to tier)
- Define allowed modules by license tier (Starter/Premium/Enterprise)
- Prevent enabling modules not included in tier (or show warning + upsell)
- Display “effective modules” in company detail

### RBAC v2 (granular permissions where applicable)
- Expand permission granularity per module (**only where it makes sense**)
- Keep read-only modules read-only (Activity/Audit/Analytics/Dashboard)
- Ensure backend endpoints enforce RBAC for all tenant modules

### Company lifecycle / support tools
- **Restore** a soft-deleted company
- Show deleted companies in a separate view/filter
- “Suspend company” should block company portal logins

### Audit log visibility
- Super Admin UI page to view audit events
- Filter by company / actor / action / date range

---

## Later (Optional / Scale)

### Feature flags system (DB-driven, no-deploy toggles)
Only needed if you want to add feature toggles frequently without code deploys.
- Connect Super Admin “Modules” to `company_feature_flags` tables
- Global flag catalog UI (create/update/archive feature flags)
- Per-company overrides + beta rollout

### Security & compliance
- Revoke sessions / force logout (per company, per user)
- IP allowlisting, SSO controls
- Export actions logs

### Billing / usage limits
- Usage metering (users/jobs/API calls)
- Enforce limits and show warnings

---

## Notes / Decisions

- **Current approach**: “Modules” uses `company.feature_flags` (simple, stable, good for the 12 core modules).
- **Upgrade path**: Connect to DB-driven feature flags later when/if you need no-deploy toggles.

