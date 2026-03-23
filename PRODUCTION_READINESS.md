# Production Readiness & Ops

This document summarizes health checks, readiness probes, and basic operational endpoints/config used by the ATS backend.

## Endpoints
- Health: GET /health — overall status + DB check
- Readiness: GET /readiness — reports readiness based on DB connectivity
- Version: GET /version — returns service version from package.json
- Swagger UI: GET /api — interactive API docs
- OpenAPI JSON: GET /api-json — machine-readable spec

All three health endpoints are excluded from tenant middleware and can be used without auth.

## Security & Limits
- Helmet: Enabled with conservative CSP defaults in main bootstrap
- Rate limiting: Global throttling via @nestjs/throttler (120 req/min per client)
 - Sentry: Optional error tracking via `SENTRY_DSN`

## Export OpenAPI spec
You can export the OpenAPI JSON from a running instance:

1) Start the server
```
npm start
```

2) Fetch spec to openapi.json (Windows PowerShell):
```
powershell -Command "Invoke-WebRequest http://localhost:3000/api-json -OutFile openapi.json"
```

Alternatively, use any HTTP client to GET /api-json and save the response.

## Probes (example)
- Liveness: /health
- Readiness: /readiness
- Version info for release verification: /version

## Notes
- Ensure JWT secret, DB credentials, and CORS origins are set via environment.
- Health endpoints do a direct DB ping (SELECT 1). If your deployment uses a read replica or separate roles, adapt as needed.
 - To enable Sentry, set `SENTRY_DSN` and (optionally) `NODE_ENV`.
