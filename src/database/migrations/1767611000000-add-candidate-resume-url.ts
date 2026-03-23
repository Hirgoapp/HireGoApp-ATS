import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCandidateResumeUrl1767611000000 implements MigrationInterface {
    name = 'AddCandidateResumeUrl1767611000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE candidates
            ADD COLUMN IF NOT EXISTS resume_url VARCHAR(500);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE candidates
            DROP COLUMN IF EXISTS resume_url;
        `);
    }
}
