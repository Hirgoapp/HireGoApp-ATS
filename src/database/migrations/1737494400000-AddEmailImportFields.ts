import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailImportFields1737494400000 implements MigrationInterface {
    name = 'AddEmailImportFields1737494400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add email import fields to jobs table
        await queryRunner.query(`
      ALTER TABLE "jobs" 
      ADD COLUMN IF NOT EXISTS "raw_email_content" TEXT,
      ADD COLUMN IF NOT EXISTS "submission_email" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "candidate_tracker_format" JSONB,
      ADD COLUMN IF NOT EXISTS "submission_guidelines" TEXT,
      ADD COLUMN IF NOT EXISTS "client_code" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "extracted_fields" JSONB,
      ADD COLUMN IF NOT EXISTS "jd_metadata" JSONB
    `);

        // Add index for client_code for faster filtering
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_jobs_client_code" ON "jobs" ("client_code")
    `);

        // Add index for submission_email
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_jobs_submission_email" ON "jobs" ("submission_email")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_submission_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_client_code"`);

        // Drop columns
        await queryRunner.query(`
      ALTER TABLE "jobs" 
      DROP COLUMN IF EXISTS "jd_metadata",
      DROP COLUMN IF EXISTS "extracted_fields",
      DROP COLUMN IF EXISTS "client_code",
      DROP COLUMN IF EXISTS "submission_guidelines",
      DROP COLUMN IF EXISTS "candidate_tracker_format",
      DROP COLUMN IF EXISTS "submission_email",
      DROP COLUMN IF EXISTS "raw_email_content"
    `);
    }
}
