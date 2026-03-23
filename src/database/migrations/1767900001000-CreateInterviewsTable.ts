import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterviewsTable1767900001000 implements MigrationInterface {
    name = 'CreateInterviewsTable1767900001000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the table only if it does not already exist (idempotent reruns).
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS interviews (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID NOT NULL,
                submission_id UUID NOT NULL,
                status interview_status_enum NOT NULL DEFAULT 'scheduled',
                interview_type interview_type_enum NOT NULL,
                scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
                scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
                location_or_link VARCHAR(500),
                created_by_id INTEGER,
                updated_by_id INTEGER,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP WITH TIME ZONE,
                CONSTRAINT fk_interviews_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                CONSTRAINT fk_interviews_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
                CONSTRAINT fk_interviews_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
                CONSTRAINT fk_interviews_updated_by FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `);

        // If the table already existed, ensure the new schedule columns are present so the index below does not fail.
        const hasInterviewsTable = await queryRunner.hasTable('interviews');
        if (hasInterviewsTable) {
            const hasScheduledStart = await queryRunner.hasColumn('interviews', 'scheduled_start');
            if (!hasScheduledStart) {
                await queryRunner.query(`ALTER TABLE interviews ADD COLUMN scheduled_start TIMESTAMPTZ;`);
            }

            const hasScheduledEnd = await queryRunner.hasColumn('interviews', 'scheduled_end');
            if (!hasScheduledEnd) {
                await queryRunner.query(`ALTER TABLE interviews ADD COLUMN scheduled_end TIMESTAMPTZ;`);
            }

            // If a legacy scheduled_at column exists, use it to backfill any null schedule columns.
            const hasScheduledAt = await queryRunner.hasColumn('interviews', 'scheduled_at');
            if (hasScheduledAt) {
                await queryRunner.query(`
                    UPDATE interviews
                    SET
                        scheduled_start = COALESCE(scheduled_start, scheduled_at),
                        scheduled_end = COALESCE(scheduled_end, scheduled_at)
                    WHERE scheduled_start IS NULL OR scheduled_end IS NULL;
                `);
            }
        }

        // Idempotent indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interviews_company_status ON interviews(company_id, status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interviews_company_submission ON interviews(company_id, submission_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interviews_schedule ON interviews(company_id, scheduled_start, scheduled_end);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_interviews_deleted ON interviews(company_id, deleted_at);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_interviews_deleted`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_interviews_schedule`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_interviews_company_submission`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_interviews_company_status`);
        await queryRunner.query(`DROP TABLE IF EXISTS interviews CASCADE;`);
    }
}
