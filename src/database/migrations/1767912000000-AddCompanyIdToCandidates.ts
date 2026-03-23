import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyIdToCandidates1767912000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add company_id column if missing
        await queryRunner.query(`
            ALTER TABLE candidates
            ADD COLUMN IF NOT EXISTS company_id uuid;
        `);

        // Ensure recruiter_id exists so composite index can be created safely
        await queryRunner.query(`
            ALTER TABLE candidates
            ADD COLUMN IF NOT EXISTS recruiter_id integer;
        `);

        // Backfill existing rows with a default company_id if needed.
        // NOTE: This uses NULL by default; real deployments should run a separate
        // data migration to set correct tenant/company IDs per environment.

        // Add indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_candidates_company_email
                ON candidates (company_id, email);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_candidates_company_status
                ON candidates (company_id, candidate_status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_candidates_company_recruiter
                ON candidates (company_id, recruiter_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_candidates_company_email;
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_candidates_company_status;
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_candidates_company_recruiter;
        `);
        await queryRunner.query(`
            ALTER TABLE candidates
            DROP COLUMN IF EXISTS company_id;
        `);
    }
}

