# Deployment Guide

This guide describes how to build, configure, and run the ATS backend in production.

## Prerequisites
- Node.js 20+
- PostgreSQL 13+
- Optional: Redis (if you later switch CacheService to Redis)
- Reverse proxy (NGINX/Traefik) for TLS and gzip

## Environment
Set via `.env` or platform secrets:
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
- JWT_SECRET
- EMAIL_PROVIDER (smtp|sendgrid), EMAIL_FROM, EMAIL_FROM_NAME
- SENDGRID_API_KEY or SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 - STORAGE_PROVIDER (local|s3)
 - AWS_S3_BUCKET, AWS_S3_REGION (or AWS_REGION)
 - Optional: AWS_S3_PREFIX, AWS_S3_PUBLIC_URL_BASE, AWS_S3_ENDPOINT, AWS_S3_FORCE_PATH_STYLE

## Build & Migrate
```
npm ci
npm run build
npm run migration:run
```

## Start
```
# Development-like (not recommended for prod)
npm start

# Production
set NODE_ENV=production
npm run build
npm run migration:run
npm run start:prod
```

## Health & Observability
- Health: GET /health
- Readiness: GET /readiness
- Version: GET /version
- Metrics: GET /metrics (Prometheus)
- Swagger: GET /api, OpenAPI: GET /api-json

## Reverse Proxy Snippet (NGINX)
```
server {
  listen 443 ssl;
  server_name api.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Common Commands
- Run a specific migration: `npm run migration:run`
- Revert last migration: `npm run migration:revert`
- Show migrations: `npm run migration:show`

## Security Notes
- JWT secret must be strong and kept secret.
- Enable TLS at the proxy and HSTS.
- Keep rate limiting enabled (already configured).
- Consider secrets manager (Vault/SM/KeyVault).

## Backups
- Schedule DB dumps and verify restore procedures regularly.
