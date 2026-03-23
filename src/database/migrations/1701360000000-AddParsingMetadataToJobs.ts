import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParsingMetadataToJobs1701360000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make migration idempotent so it can run safely against existing DBs
        await queryRunner.query(`
            ALTER TABLE "jobs"
            ADD COLUMN IF NOT EXISTS "parsed_content_raw" text
        `);

        await queryRunner.query(`
            ALTER TABLE "jobs"
            ADD COLUMN IF NOT EXISTS "extraction_confidence" numeric(3,2)
        `);

        await queryRunner.query(`
            ALTER TABLE "jobs"
            ADD COLUMN IF NOT EXISTS "extraction_provider" varchar(50)
        `);

        await queryRunner.query(`
            ALTER TABLE "jobs"
            ADD COLUMN IF NOT EXISTS "extraction_timestamp" timestamp
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "jobs"
            DROP COLUMN IF EXISTS "parsed_content_raw"
        `);
        await queryRunner.query(`
            ALTER TABLE "jobs"
            DROP COLUMN IF EXISTS "extraction_confidence"
        `);
        await queryRunner.query(`
            ALTER TABLE "jobs"
            DROP COLUMN IF EXISTS "extraction_provider"
        `);
        await queryRunner.query(`
            ALTER TABLE "jobs"
            DROP COLUMN IF EXISTS "extraction_timestamp"
        `);
    }
}
