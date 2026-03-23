import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingCandidateFields1767607200000 implements MigrationInterface {
    name = 'AddMissingCandidateFields1767607200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing location and audit fields to candidates table
        await queryRunner.query(`
            ALTER TABLE candidates 
            ADD COLUMN IF NOT EXISTS city VARCHAR(255),
            ADD COLUMN IF NOT EXISTS country VARCHAR(255),
            ADD COLUMN IF NOT EXISTS timezone VARCHAR(100),
            ADD COLUMN IF NOT EXISTS availability_date DATE,
            ADD COLUMN IF NOT EXISTS notice_period VARCHAR(100),
            ADD COLUMN IF NOT EXISTS created_by_id UUID,
            ADD COLUMN IF NOT EXISTS updated_by_id UUID;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the added columns
        await queryRunner.query(`
            ALTER TABLE candidates 
            DROP COLUMN IF EXISTS city,
            DROP COLUMN IF EXISTS country,
            DROP COLUMN IF EXISTS timezone,
            DROP COLUMN IF EXISTS availability_date,
            DROP COLUMN IF EXISTS notice_period,
            DROP COLUMN IF EXISTS created_by_id,
            DROP COLUMN IF EXISTS updated_by_id;
        `);
    }
}
