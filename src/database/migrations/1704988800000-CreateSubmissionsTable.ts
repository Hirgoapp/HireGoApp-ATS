import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubmissionsTable1704988800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ENUM type for submission status if it doesn't already exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status_enum') THEN
                    CREATE TYPE submission_status_enum AS ENUM (
                        'applied',
                        'screening',
                        'interview',
                        'offer',
                        'hired',
                        'rejected',
                        'withdrawn'
                    );
                END IF;
            END
            $$;
        `);

        const hasSubmissionsTable = await queryRunner.hasTable('submissions');
        if (hasSubmissionsTable) {
            // Table already exists in this environment; skip to avoid conflicting schemas.
            return;
        }

        // Create submissions table
        await queryRunner.query(`
            CREATE TABLE submissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID NOT NULL,
                candidate_id UUID NOT NULL,
                job_id UUID NOT NULL,
                status submission_status_enum NOT NULL DEFAULT 'applied',
                created_by_id UUID,
                updated_by_id UUID,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMP,
                cover_letter TEXT,
                salary_expectation DECIMAL(10, 2),
                rejection_reason TEXT,
                withdrawn_reason TEXT,
                notes JSONB,
                
                CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                CONSTRAINT fk_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
                CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                CONSTRAINT fk_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
                CONSTRAINT fk_updated_by FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Enforce uniqueness for active submissions only (allow soft-deleted duplicates)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_submission
            ON submissions(company_id, candidate_id, job_id)
            WHERE deleted_at IS NULL
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_submissions_company_deleted ON submissions(company_id, deleted_at)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_submissions_job_status ON submissions(job_id, status, deleted_at)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_submissions_candidate_status ON submissions(candidate_id, status, deleted_at)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(company_id, created_at DESC)
        `);

        const hasSubmissionHistoryTable = await queryRunner.hasTable('submission_status_history');
        if (!hasSubmissionHistoryTable) {
            // Create submission_status_history table
            await queryRunner.query(`
                CREATE TABLE submission_status_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    submission_id UUID NOT NULL,
                    company_id UUID NOT NULL,
                    old_status submission_status_enum,
                    new_status submission_status_enum NOT NULL,
                    changed_by_id UUID,
                    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    reason TEXT,
                    metadata JSONB,
                    
                    CONSTRAINT fk_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
                    CONSTRAINT fk_company_history FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                    CONSTRAINT fk_changed_by FOREIGN KEY (changed_by_id) REFERENCES users(id) ON DELETE SET NULL
                )
            `);
        }

        // Create indexes for history table
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_history_submission ON submission_status_history(submission_id, changed_at DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_history_company ON submission_status_history(company_id, changed_at DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_history_changed_by ON submission_status_history(changed_by_id, changed_at DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_history_changed_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_history_company`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_history_submission`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_submissions_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_submissions_candidate_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_submissions_job_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_submissions_company_deleted`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_unique_active_submission`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS submission_status_history`);
        await queryRunner.query(`DROP TABLE IF EXISTS submissions`);

        // Drop ENUM type
        await queryRunner.query(`DROP TYPE IF EXISTS submission_status_enum`);
    }
}
