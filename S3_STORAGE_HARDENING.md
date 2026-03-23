# S3 Storage Hardening & Security

This guide documents encryption, versioning, lifecycle policies, and other security measures for S3 storage in the ATS system.

## Encryption

### Server-Side Encryption (SSE)

All uploads are encrypted at rest by default. Choose one:

#### SSE-S3 (AWS Managed Keys)
- **Simplest**: No KMS key management required.
- **Cost**: Minimal (included in S3 pricing).
- **Use Case**: Default for most workloads.

```bash
export AWS_S3_SSE=AES256  # or omit (defaults to AES256)
```

#### SSE-KMS (Customer Managed Keys)
- **Control**: Use your own KMS key for encryption.
- **Audit**: CloudTrail logs all key usage.
- **Cost**: KMS calls incur per-request charges.
- **Compliance**: Often required in regulated industries.

```bash
export AWS_S3_SSE=aws:kms
export AWS_S3_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012
```

## Versioning

Enable object versioning to maintain a complete history of all document changes.

```bash
export AWS_S3_VERSIONING=true
```

**Benefits**:
- Accidental overwrites or deletions are recoverable.
- Audit trail of all document changes.
- Point-in-time recovery.

**Cost Impact**:
- Storage charges apply to all versions (old versions consume space).
- Consider combining with lifecycle policies to move old versions to cheaper storage.

## Lifecycle Policies

Automatically transition or delete old object versions to reduce storage costs.

### Configuration

```bash
export AWS_S3_LIFECYCLE=true
export AWS_S3_LIFECYCLE_EXPIRY_DAYS=365
export AWS_S3_ARCHIVE_AFTER_DAYS=90
```

### Policy Behavior

With the above config:

1. **Noncurrent versions** (old versions of objects):
   - After 90 days: Move to Glacier (cold storage).
   - After 365 days: Delete permanently.

2. **Current versions**:
   - After 730 days (2 years): Delete permanently.
   - Gives clients time to reference documents before automatic cleanup.

### Storage Classes

| Class | Use Case | Cost | Retrieval |
|-------|----------|------|-----------|
| **STANDARD** | Active documents | $0.023/GB | Immediate |
| **GLACIER** | Archived/compliance | $0.004/GB | Hours |
| **DEEP_ARCHIVE** | Long-term retention | $0.00099/GB | 12+ hours |

## Setup

The `StorageService` automatically calls `setupBucketPolicies()` on initialization when running in production. To manually trigger setup:

```typescript
// In your AppModule or main boot sequence
await storageService.setupBucketPolicies();
```

Console logs will confirm:
```
✓ Versioning enabled for bucket my-bucket
✓ Lifecycle policy configured for bucket my-bucket
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_PROVIDER` | `local` | `local` or `s3` |
| `AWS_S3_BUCKET` | — | **Required** for S3 |
| `AWS_S3_REGION` | `us-east-1` | AWS region |
| `AWS_S3_SSE` | `AES256` | `AES256` or `aws:kms` |
| `AWS_S3_KMS_KEY_ID` | — | KMS key ARN (required if using KMS) |
| `AWS_S3_VERSIONING` | `false` | Enable object versioning |
| `AWS_S3_LIFECYCLE` | `false` | Enable lifecycle policies |
| `AWS_S3_LIFECYCLE_EXPIRY_DAYS` | `365` | Delete noncurrent versions after N days |
| `AWS_S3_ARCHIVE_AFTER_DAYS` | `90` | Archive noncurrent versions after N days |
| `AWS_S3_PREFIX` | — | Key prefix (e.g., `documents/`) |
| `AWS_S3_PUBLIC_URL_BASE` | — | CDN base URL (if using CloudFront) |
| `AWS_S3_ENDPOINT` | — | For S3-compatible storage (MinIO, LocalStack) |
| `AWS_S3_FORCE_PATH_STYLE` | `false` | Use path-style URLs |

## Example: Production Configuration

```bash
# Core
export STORAGE_PROVIDER=s3
export AWS_S3_BUCKET=ats-saas-prod-documents
export AWS_S3_REGION=us-east-1

# Encryption
export AWS_S3_SSE=aws:kms
export AWS_S3_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/abcd-1234

# Versioning & Lifecycle
export AWS_S3_VERSIONING=true
export AWS_S3_LIFECYCLE=true
export AWS_S3_LIFECYCLE_EXPIRY_DAYS=365
export AWS_S3_ARCHIVE_AFTER_DAYS=90

# Optional: CDN
export AWS_S3_PUBLIC_URL_BASE=https://cdn.yourdomain.com/documents
```

## Best Practices

1. **Always use encryption**: Use either SSE-S3 or SSE-KMS.
2. **Enable versioning in production**: Provides recovery capability at minimal cost.
3. **Combine with lifecycle policies**: Manage storage costs by archiving old versions.
4. **Monitor S3 metrics**: Set up CloudWatch alarms for unusual deletion/access patterns.
5. **Bucket policies**: Implement bucket policies to deny unencrypted uploads:
   ```json
   {
       "Effect": "Deny",
       "Principal": "*",
       "Action": "s3:PutObject",
       "Resource": "arn:aws:s3:::my-bucket/*",
       "Condition": {
           "StringNotEquals": {
               "s3:x-amz-server-side-encryption": "aws:kms"
           }
       }
   }
   ```

## Troubleshooting

**Q: Versioning/lifecycle commands fail with "access denied"**
- Ensure the IAM user/role has `s3:PutBucketVersioning` and `s3:PutLifecycleConfiguration` permissions.

**Q: KMS key not found**
- Verify the key ARN in `AWS_S3_KMS_KEY_ID` exists and the IAM role has `kms:Decrypt`, `kms:GenerateDataKey` permissions.

**Q: Old versions not being archived**
- Lifecycle policies are eventually consistent; allow 24–48 hours after enabling.
- Verify the policy was applied: `aws s3api get-bucket-lifecycle-configuration --bucket my-bucket`

