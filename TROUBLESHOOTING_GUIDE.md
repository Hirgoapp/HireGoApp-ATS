# Troubleshooting Guide

Quick fixes for common issues.

## Health shows degraded
- Check DB connectivity and credentials.
- Verify DB user permissions and allowed hosts.
- Restart app after DB becomes available or add retries.

## CORS errors in browser
- Ensure frontend origin is allowed in `app.enableCors` in `src/main.ts`.
- Confirm requests include proper `Authorization: Bearer <JWT>` header.

## 401 Unauthorized on protected endpoints
- Missing/expired JWT: request a new token via login.
- TenantContext middleware requires `companyId` in JWT.
- Verify roles/permissions assigned via RBAC.

## Webhook deliveries failing
- Check webhook logs via endpoints.
- Verify target endpoint is reachable and trusts HMAC signature.
- Adjust retry config on subscription; inspect `/metrics` for failures.

## Emails not sending
- Check provider config in environment (`EMAIL_PROVIDER`).
- For SendGrid: validate API key; for SMTP: host/port/user/pass.
- Check logs and `email_sends_total` in `/metrics`.

## Migrations fail
- Ensure DB user has privileges to create extensions/tables.
- Inspect migration order; run `migration:show` to confirm sequence.

## Swagger not loading
- Confirm server started and `/api` reachable.
- Check CSP settings in Helmet; loosen CSP for scripts/styles if needed.

## Performance issues
- Ensure indexes are applied (see migrations for dashboard indexes).
- Validate caching via CacheService usage and TTLs.
- Review slow queries and add composite indexes where needed.
