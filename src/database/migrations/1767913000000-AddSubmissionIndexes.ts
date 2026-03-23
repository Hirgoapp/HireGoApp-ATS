import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubmissionIndexes1767913000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_submissions_company_candidate
            ON submissions (company_id, candidate_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_submissions_company_job
            ON submissions (company_id, job_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_submissions_company_job`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_submissions_company_candidate`);
    }
}

