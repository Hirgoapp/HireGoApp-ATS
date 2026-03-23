import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterviewInterviewersTable1767900002000 implements MigrationInterface {
    name = 'CreateInterviewInterviewersTable1767900002000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Use UUID for interviewer_id to match users.id and make the migration rerunnable.
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS interview_interviewers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID NOT NULL,
                interview_id UUID NOT NULL,
                interviewer_id UUID NOT NULL,
                role interviewer_role_enum NOT NULL DEFAULT 'interviewer',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_interview_interviewers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                CONSTRAINT fk_interview_interviewers_interview FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
                CONSTRAINT fk_interview_interviewers_user FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT unique_interviewer_per_interview UNIQUE (interview_id, interviewer_id)
            );
        `);

        // Idempotent indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interview_interviewers_company ON interview_interviewers(company_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interview_interviewers_interview ON interview_interviewers(interview_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interview_interviewers_user ON interview_interviewers(interviewer_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS interview_interviewers CASCADE;`);
    }
}
