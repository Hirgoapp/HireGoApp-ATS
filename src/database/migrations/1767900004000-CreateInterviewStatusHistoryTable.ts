import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterviewStatusHistoryTable1767900004000 implements MigrationInterface {
    name = 'CreateInterviewStatusHistoryTable1767900004000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS interview_status_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID NOT NULL,
                interview_id UUID NOT NULL,
                status interview_status_enum NOT NULL,
                reason TEXT,
                changed_by_user_id UUID,
                changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_interview_status_history_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                CONSTRAINT fk_interview_status_history_interview FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
                CONSTRAINT fk_interview_status_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interview_status_history_lookup ON interview_status_history(interview_id, company_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interview_status_history_company ON interview_status_history(company_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS interview_status_history CASCADE;`);
    }
}
