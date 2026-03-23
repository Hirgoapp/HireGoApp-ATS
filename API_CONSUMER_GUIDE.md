# API Consumer Guide

How to integrate with the ATS API.

## Authentication
- JWT: Include `Authorization: Bearer <token>`
- API Keys: Use `x-api-key: <token>` or `?api_key=<token>` where allowed; scopes enforced.

## Rate Limits
- Global throttling enabled; excessive requests return 429.

## Versioning
- Current version: v1; base paths vary by controller. Swagger lists all routes.

## Errors
- JSON body with `message` and optional `errors` field;
- 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 422 (Validation), 429 (Rate limit).

## Pagination & Filtering
- Typical query params: `page`, `limit`, filter fields as documented in Swagger.

## Webhooks
- HMAC signature in `X-Webhook-Signature` (sha256 of JSON payload using subscription secret).
- Headers include `X-Webhook-Event` and `X-Webhook-ID`.
- Implement retry-safe handlers; respond 2xx on success.

## Exports & Reports
- CSV endpoints under `/reports/analytics/*.csv` (requires `reports:export`).

## Health & Observability
- Health: `/health`, Readiness: `/readiness`, Metrics: `/metrics`.

## OpenAPI Spec
- Live JSON: `/api-json`
- Fetch to file:
```
npm run docs:openapi:fetch
```
