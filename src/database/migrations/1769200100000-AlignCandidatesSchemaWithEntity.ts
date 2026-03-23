import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignCandidatesSchemaWithEntity1769200100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCandidates = await queryRunner.hasTable('candidates');
        if (!hasCandidates) {
            return;
        }

        const addColumnIfMissing = async (columnName: string, definition: string) => {
            const hasColumn = await queryRunner.hasColumn('candidates', columnName);
            if (!hasColumn) {
                await queryRunner.query(`ALTER TABLE "candidates" ADD COLUMN "${columnName}" ${definition}`);
            }
        };

        await addColumnIfMissing('gender', 'varchar(10) NULL');
        await addColumnIfMissing('dob', 'date NULL');
        await addColumnIfMissing('marital_status', 'varchar(20) NULL');
        await addColumnIfMissing('current_company', 'text NULL');
        await addColumnIfMissing('total_experience', 'numeric NULL');
        await addColumnIfMissing('relevant_experience', 'numeric NULL');
        await addColumnIfMissing('current_ctc', 'numeric NULL');
        await addColumnIfMissing('expected_ctc', 'numeric NULL');
        await addColumnIfMissing('currency_code', "varchar(3) NULL DEFAULT 'INR'");
        await addColumnIfMissing('notice_period', 'varchar(100) NULL');
        await addColumnIfMissing('willing_to_relocate', 'boolean NULL DEFAULT false');
        await addColumnIfMissing('buyout', 'boolean NULL DEFAULT false');
        await addColumnIfMissing('reason_for_job_change', 'text NULL');
        await addColumnIfMissing('skill_set', 'text NULL');
        await addColumnIfMissing('current_location_id', 'uuid NULL');
        await addColumnIfMissing('location_preference', 'varchar(100) NULL');
        await addColumnIfMissing('candidate_status', "varchar(50) NULL DEFAULT 'Active'");
        await addColumnIfMissing('source_id', 'uuid NULL');
        await addColumnIfMissing('last_contacted_date', 'timestamp NULL');
        await addColumnIfMissing('last_submission_date', 'date NULL');
        await addColumnIfMissing('notes', 'text NULL');
        await addColumnIfMissing('extra_fields', "jsonb NULL DEFAULT '{}'::jsonb");
        await addColumnIfMissing('aadhar_number', 'varchar(50) NULL');
        await addColumnIfMissing('uan_number', 'varchar(50) NULL');
        await addColumnIfMissing('linkedin_url', 'varchar(255) NULL');
        await addColumnIfMissing('manager_screening_status', "varchar(50) NULL DEFAULT 'Pending'");
        await addColumnIfMissing('client_name', 'varchar(150) NULL');
        await addColumnIfMissing('highest_qualification', 'varchar(100) NULL');
        await addColumnIfMissing('submission_date', 'date NULL');
        await addColumnIfMissing('job_location', 'varchar(255) NULL');
        await addColumnIfMissing('source', 'varchar(100) NULL');
        await addColumnIfMissing('client', 'varchar(100) NULL');
        await addColumnIfMissing('recruiter_id', 'uuid NULL');
        await addColumnIfMissing('date_of_entry', 'date NULL');
        await addColumnIfMissing('manager_screening', 'varchar(50) NULL');
        await addColumnIfMissing('resume_parser_used', 'varchar(100) NULL');
        await addColumnIfMissing('extraction_confidence', 'numeric NULL');
        await addColumnIfMissing('extraction_date', 'timestamp NULL');
        await addColumnIfMissing('resume_source_type', 'varchar(100) NULL');
        await addColumnIfMissing('is_suspicious', 'boolean NULL DEFAULT false');
        await addColumnIfMissing('cv_portal_id', 'uuid NULL');
        await addColumnIfMissing('import_batch_id', 'varchar(50) NULL');
        await addColumnIfMissing('created_by', 'uuid NULL');
        await addColumnIfMissing('updated_by', 'uuid NULL');

        await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_candidates_candidate_status" ON "candidates" ("candidate_status")');
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_candidates_source_id" ON "candidates" ("source_id")');
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_candidates_recruiter_id" ON "candidates" ("recruiter_id")');
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_candidates_date_of_entry" ON "candidates" ("date_of_entry")');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCandidates = await queryRunner.hasTable('candidates');
        if (!hasCandidates) {
            return;
        }

        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_date_of_entry"');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_recruiter_id"');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_source_id"');
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_candidate_status"');

        const dropColumnIfExists = async (columnName: string) => {
            const hasColumn = await queryRunner.hasColumn('candidates', columnName);
            if (hasColumn) {
                await queryRunner.query(`ALTER TABLE "candidates" DROP COLUMN "${columnName}"`);
            }
        };

        await dropColumnIfExists('updated_by');
        await dropColumnIfExists('created_by');
        await dropColumnIfExists('import_batch_id');
        await dropColumnIfExists('cv_portal_id');
        await dropColumnIfExists('is_suspicious');
        await dropColumnIfExists('resume_source_type');
        await dropColumnIfExists('extraction_date');
        await dropColumnIfExists('extraction_confidence');
        await dropColumnIfExists('resume_parser_used');
        await dropColumnIfExists('manager_screening');
        await dropColumnIfExists('date_of_entry');
        await dropColumnIfExists('recruiter_id');
        await dropColumnIfExists('client');
        await dropColumnIfExists('source');
        await dropColumnIfExists('job_location');
        await dropColumnIfExists('submission_date');
        await dropColumnIfExists('highest_qualification');
        await dropColumnIfExists('client_name');
        await dropColumnIfExists('manager_screening_status');
        await dropColumnIfExists('linkedin_url');
        await dropColumnIfExists('uan_number');
        await dropColumnIfExists('aadhar_number');
        await dropColumnIfExists('extra_fields');
        await dropColumnIfExists('notes');
        await dropColumnIfExists('last_submission_date');
        await dropColumnIfExists('last_contacted_date');
        await dropColumnIfExists('source_id');
        await dropColumnIfExists('candidate_status');
        await dropColumnIfExists('location_preference');
        await dropColumnIfExists('current_location_id');
        await dropColumnIfExists('skill_set');
        await dropColumnIfExists('reason_for_job_change');
        await dropColumnIfExists('buyout');
        await dropColumnIfExists('willing_to_relocate');
        await dropColumnIfExists('notice_period');
        await dropColumnIfExists('currency_code');
        await dropColumnIfExists('expected_ctc');
        await dropColumnIfExists('current_ctc');
        await dropColumnIfExists('relevant_experience');
        await dropColumnIfExists('total_experience');
        await dropColumnIfExists('current_company');
        await dropColumnIfExists('marital_status');
        await dropColumnIfExists('dob');
        await dropColumnIfExists('gender');
    }
}
