# Documents: Presigned Downloads

This system supports offloading file downloads to S3 using presigned URLs. When enabled, the `GET /api/v1/documents/:id/download` endpoint will 302-redirect to a temporary S3 URL; otherwise, it streams from the API.

## Environment Variables

- `STORAGE_PROVIDER` (local|s3): Must be `s3` to use presigned URLs.
- `AWS_S3_BUCKET`: Target bucket (required when using S3).
- `AWS_S3_REGION` or `AWS_REGION`: S3 region used for URL construction.
- `AWS_S3_ENDPOINT` (optional): For S3-compatible storage (MinIO, etc.).
- `AWS_S3_FORCE_PATH_STYLE` (optional, default false): Force path-style access.
- `AWS_S3_PREFIX` (optional): Key prefix for object paths.
- `S3_PRESIGNED_EXPIRES` (seconds, default 300): Expiry for presigned URLs.
- `DOCUMENTS_PRESIGNED_REDIRECT` (true|false, default true): If true, `/download` redirects to S3 when available.

## Endpoints

- `GET /api/v1/documents/:id/presigned-url`
  - Returns `{ url, expires_in }` when S3 is configured; `{ url: null, expires_in: 0 }` otherwise.
  - Requires `documents:read` permission and enforces tenant isolation.

- `GET /api/v1/documents/:id/download`
  - If `DOCUMENTS_PRESIGNED_REDIRECT` is enabled and S3 is configured, responds with HTTP 302 to the presigned URL.
  - Otherwise, streams the file from the API with appropriate `Content-Type` and `Content-Disposition` headers.

## Notes

- Public vs private: Uploads may set `is_public`; presigned URLs are still recommended for controlled access and auditability.
- Caching/CDN: You may place CloudFront or another CDN in front of S3 objects; presigned URLs continue to work, but consider header normalization.
- Security: Ensure URL expirations are short and only reveal URLs to authorized users.
