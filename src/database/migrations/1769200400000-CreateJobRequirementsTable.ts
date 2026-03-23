import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobRequirementsTable1769200400000 implements MigrationInterface {
    name = 'CreateJobRequirementsTable1769200400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS job_requirements (
                id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id uuid NOT NULL,
                ecms_req_id varchar(50) NOT NULL,
                client_id uuid NOT NULL,
                poc_id uuid NULL,
                job_title varchar(255) NOT NULL,
                job_description text NULL,
                domain varchar(100) NULL,
                business_unit varchar(100) NULL,
                total_experience_min integer NULL,
                relevant_experience_min integer NULL,
                mandatory_skills text NOT NULL,
                desired_skills text NULL,
                country varchar(50) NULL,
                work_location varchar(255) NULL,
                wfo_wfh_hybrid varchar(50) NULL,
                shift_time varchar(100) NULL,
                number_of_openings integer NULL,
                project_manager_name varchar(100) NULL,
                project_manager_email varchar(100) NULL,
                delivery_spoc_1_name varchar(100) NULL,
                delivery_spoc_1_email varchar(100) NULL,
                delivery_spoc_2_name varchar(100) NULL,
                delivery_spoc_2_email varchar(100) NULL,
                bgv_timing varchar(100) NULL,
                bgv_vendor varchar(100) NULL,
                interview_mode varchar(100) NULL,
                interview_platforms text NULL,
                screenshot_requirement varchar(255) NULL,
                vendor_rate numeric NULL,
                currency varchar(3) NULL,
                client_name varchar(100) NULL,
                email_subject varchar(255) NULL,
                email_received_date timestamp NULL,
                priority varchar(20) NOT NULL DEFAULT 'Medium',
                active_flag boolean NULL DEFAULT true,
                extra_fields jsonb NULL DEFAULT '{}',
                status varchar(50) NOT NULL DEFAULT 'open',
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                deleted_at timestamp NULL,
                created_by uuid NULL,
                updated_by uuid NULL
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_job_requirements_company_status
            ON job_requirements (company_id, status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_job_requirements_company_poc
            ON job_requirements (company_id, poc_id);
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'fk_job_requirements_company'
                ) THEN
                    ALTER TABLE job_requirements
                    ADD CONSTRAINT fk_job_requirements_company
                    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'fk_job_requirements_created_by'
                ) THEN
                    ALTER TABLE job_requirements
                    ADD CONSTRAINT fk_job_requirements_created_by
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'fk_job_requirements_updated_by'
                ) THEN
                    ALTER TABLE job_requirements
                    ADD CONSTRAINT fk_job_requirements_updated_by
                    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'requirement_skills'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_requirement_skills_job_requirement'
                ) THEN
                    ALTER TABLE requirement_skills
                    ADD CONSTRAINT fk_requirement_skills_job_requirement
                    FOREIGN KEY (job_requirement_id) REFERENCES job_requirements(id) ON DELETE CASCADE;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'requirement_assignments'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_requirement_assignments_job_requirement'
                ) THEN
                    ALTER TABLE requirement_assignments
                    ADD CONSTRAINT fk_requirement_assignments_job_requirement
                    FOREIGN KEY (job_requirement_id) REFERENCES job_requirements(id) ON DELETE CASCADE;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'requirement_import_logs'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_requirement_import_logs_job_requirement'
                ) THEN
                    ALTER TABLE requirement_import_logs
                    ADD CONSTRAINT fk_requirement_import_logs_job_requirement
                    FOREIGN KEY (job_requirement_id) REFERENCES job_requirements(id) ON DELETE CASCADE;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'requirement_tracker_templates'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_requirement_tracker_templates_job_requirement'
                ) THEN
                    ALTER TABLE requirement_tracker_templates
                    ADD CONSTRAINT fk_requirement_tracker_templates_job_requirement
                    FOREIGN KEY (job_requirement_id) REFERENCES job_requirements(id) ON DELETE CASCADE;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE requirement_tracker_templates DROP CONSTRAINT IF EXISTS fk_requirement_tracker_templates_job_requirement;`);
        await queryRunner.query(`ALTER TABLE requirement_import_logs DROP CONSTRAINT IF EXISTS fk_requirement_import_logs_job_requirement;`);
        await queryRunner.query(`ALTER TABLE requirement_assignments DROP CONSTRAINT IF EXISTS fk_requirement_assignments_job_requirement;`);
        await queryRunner.query(`ALTER TABLE requirement_skills DROP CONSTRAINT IF EXISTS fk_requirement_skills_job_requirement;`);

        await queryRunner.query(`ALTER TABLE job_requirements DROP CONSTRAINT IF EXISTS fk_job_requirements_updated_by;`);
        await queryRunner.query(`ALTER TABLE job_requirements DROP CONSTRAINT IF EXISTS fk_job_requirements_created_by;`);
        await queryRunner.query(`ALTER TABLE job_requirements DROP CONSTRAINT IF EXISTS fk_job_requirements_company;`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_job_requirements_company_poc;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_job_requirements_company_status;`);
        await queryRunner.query(`DROP TABLE IF EXISTS job_requirements;`);
    }
}
