import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingJobFields1767611400000 implements MigrationInterface {
    name = 'AddMissingJobFields1767611400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE jobs
            ADD COLUMN IF NOT EXISTS level VARCHAR(50),
            ADD COLUMN IF NOT EXISTS years_required INT,
            ADD COLUMN IF NOT EXISTS currency VARCHAR(10),
            ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS is_hybrid BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS priority INT DEFAULT 1,
            ADD COLUMN IF NOT EXISTS target_hire_date DATE,
            ADD COLUMN IF NOT EXISTS openings INT DEFAULT 1,
            ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS preferred_skills JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS internal_notes TEXT,
            ADD COLUMN IF NOT EXISTS source VARCHAR(50),
            ADD COLUMN IF NOT EXISTS updated_by_id UUID;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE jobs
            DROP COLUMN IF EXISTS updated_by_id,
            DROP COLUMN IF EXISTS source,
            DROP COLUMN IF EXISTS internal_notes,
            DROP COLUMN IF EXISTS tags,
            DROP COLUMN IF EXISTS preferred_skills,
            DROP COLUMN IF EXISTS required_skills,
            DROP COLUMN IF EXISTS openings,
            DROP COLUMN IF EXISTS target_hire_date,
            DROP COLUMN IF EXISTS priority,
            DROP COLUMN IF EXISTS is_hybrid,
            DROP COLUMN IF EXISTS is_remote,
            DROP COLUMN IF EXISTS currency,
            DROP COLUMN IF EXISTS years_required,
            DROP COLUMN IF EXISTS level;
        `);
    }
}
