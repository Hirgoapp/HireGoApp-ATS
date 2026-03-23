import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCandidateSearchIndexes1767800000000 implements MigrationInterface {
    // Checks whether the given column exists on the candidates table.
    private async columnExists(queryRunner: QueryRunner, columnName: string): Promise<boolean> {
        const result = await queryRunner.query(
            `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = $1`,
            [columnName],
        );
        return result.length > 0;
    }

    // Checks whether an index with the given name already exists.
    private async indexExists(queryRunner: QueryRunner, indexName: string): Promise<boolean> {
        const result = await queryRunner.query(
            `SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'candidates' AND indexname = $1`,
            [indexName],
        );
        return result.length > 0;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure the columns required for the indexes exist; add them if missing for compatibility with legacy schemas.
        await queryRunner.query(`
            ALTER TABLE candidates
            ADD COLUMN IF NOT EXISTS candidate_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS candidate_status VARCHAR(50) DEFAULT 'prospect',
            ADD COLUMN IF NOT EXISTS skill_set TEXT
        `);

        // Backfill candidate_name from first_name/last_name if available and candidate_name is still null.
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'first_name'
                ) AND EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'last_name'
                ) THEN
                    UPDATE candidates
                    SET candidate_name = CONCAT_WS(' ', first_name, last_name)
                    WHERE candidate_name IS NULL;
                END IF;
            END;
            $$;
        `);

        // Backfill candidate_status from legacy status column if it exists.
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'status'
                ) THEN
                    UPDATE candidates
                    SET candidate_status = status
                    WHERE candidate_status IS NULL;
                END IF;
            END;
            $$;
        `);

        // Helper to conditionally create a standard index only when both the column and index are present/absent respectively.
        const createIndexIfMissing = async (name: string, columns: string[]) => {
            const columnsExist = await Promise.all(columns.map((column) => this.columnExists(queryRunner, column)));
            if (columnsExist.every(Boolean) && !(await this.indexExists(queryRunner, name))) {
                await queryRunner.query(
                    `CREATE INDEX "${name}" ON candidates (${columns.map((col) => `"${col}"`).join(', ')})`,
                );
            }
        };

        await createIndexIfMissing('IDX_candidates_name', ['candidate_name']);
        await createIndexIfMissing('IDX_candidates_email', ['email']);
        await createIndexIfMissing('IDX_candidates_skill_set', ['skill_set']);
        await createIndexIfMissing('IDX_candidates_status', ['candidate_status']);
        await createIndexIfMissing('IDX_candidates_company_status', ['company_id', 'candidate_status']);
        await createIndexIfMissing('IDX_candidates_recruiter', ['recruiter_id']);
        await createIndexIfMissing('IDX_candidates_created_at', ['created_at']);

        // Full-text index on candidate_name and email for advanced search (guarded for idempotency and column presence).
        const hasCandidateName = await this.columnExists(queryRunner, 'candidate_name');
        const hasEmail = await this.columnExists(queryRunner, 'email');
        const fullTextIndexExists = await this.indexExists(queryRunner, 'IDX_candidates_fulltext_name_email');
        if (hasCandidateName && hasEmail && !fullTextIndexExists) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_candidates_fulltext_name_email"
                ON candidates USING GIN (
                    to_tsvector('english', COALESCE(candidate_name, '') || ' ' || COALESCE(email, ''))
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_fulltext_name_email"');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_created_at"');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_recruiter"');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_company_status"');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_status"');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_skill_set"');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_email"');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_name"');
    }
}
