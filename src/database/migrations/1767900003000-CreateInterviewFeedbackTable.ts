import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterviewFeedbackTable1767900003000 implements MigrationInterface {
    name = 'CreateInterviewFeedbackTable1767900003000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Use UUID for reviewer_id to align with users.id and allow reruns.
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS interview_feedback (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID NOT NULL,
                interview_id UUID NOT NULL,
                reviewer_id UUID NOT NULL,
                rating NUMERIC(3, 1) NOT NULL,
                recommendation recommendation_enum NOT NULL,
                comments TEXT,
                submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_interview_feedback_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                CONSTRAINT fk_interview_feedback_interview FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
                CONSTRAINT fk_interview_feedback_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT unique_feedback_per_reviewer UNIQUE (interview_id, reviewer_id)
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interview_feedback_company ON interview_feedback(company_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview ON interview_feedback(interview_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interview_feedback_reviewer ON interview_feedback(reviewer_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS interview_feedback CASCADE;`);
    }
}
