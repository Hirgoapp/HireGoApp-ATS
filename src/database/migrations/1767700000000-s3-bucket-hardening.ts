import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: S3 Bucket Hardening
 * 
 * This migration is not a traditional database migration.
 * Instead, it's a marker for infrastructure setup tasks:
 * - Enable S3 bucket versioning (if AWS_S3_VERSIONING=true)
 * - Configure lifecycle policies (if AWS_S3_LIFECYCLE=true)
 * 
 * These are applied by StorageService.setupBucketPolicies() during app bootstrap.
 * See S3_STORAGE_HARDENING.md for configuration details.
 */
export class S3BucketHardening1767700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // No database changes; S3 setup is handled by StorageService
        console.log('[Migration] S3 Bucket Hardening: Setup delegated to StorageService.setupBucketPolicies()');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback is manual via AWS CLI:
        // aws s3api put-bucket-versioning --bucket BUCKET --versioning-configuration Status=Suspended
        // aws s3api delete-bucket-lifecycle-configuration --bucket BUCKET
        console.log('[Migration] S3 Bucket Hardening: Rollback requires manual AWS CLI steps');
    }
}
