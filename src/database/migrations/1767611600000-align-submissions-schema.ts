import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignSubmissionsSchema1767611600000 implements MigrationInterface {
    name = 'AlignSubmissionsSchema1767611600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE submissions
            ALTER COLUMN current_stage TYPE varchar(100),
            ALTER COLUMN submitted_at TYPE date USING submitted_at::date,
            ALTER COLUMN moved_to_stage_at TYPE date USING moved_to_stage_at::date,
            ALTER COLUMN outcome TYPE varchar(50) USING outcome::text,
            ALTER COLUMN outcome_date TYPE date USING outcome_date::date,
            ALTER COLUMN score TYPE decimal(3,1) USING score::decimal(3,1),
            ALTER COLUMN tags TYPE jsonb USING COALESCE(tags::jsonb, '[]'::jsonb),
            ALTER COLUMN source TYPE varchar(50),
            ALTER COLUMN internal_notes TYPE text,
            ALTER COLUMN updated_by_id DROP NOT NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE submission_histories
            ALTER COLUMN moved_from_stage TYPE varchar(100),
            ALTER COLUMN moved_to_stage TYPE varchar(100),
            ALTER COLUMN outcome_recorded TYPE varchar(50) USING outcome_recorded::text,
            ALTER COLUMN reason TYPE text,
            ALTER COLUMN outcome_reason TYPE text;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE submission_histories
            ALTER COLUMN outcome_reason TYPE text,
            ALTER COLUMN reason TYPE text,
            ALTER COLUMN outcome_recorded TYPE varchar(50),
            ALTER COLUMN moved_to_stage TYPE varchar(255),
            ALTER COLUMN moved_from_stage TYPE varchar(255);
        `);

        await queryRunner.query(`
            ALTER TABLE submissions
            ALTER COLUMN updated_by_id SET NOT NULL,
            ALTER COLUMN internal_notes TYPE text,
            ALTER COLUMN source TYPE varchar(255),
            ALTER COLUMN tags TYPE json USING tags::json,
            ALTER COLUMN score TYPE decimal(3,1) USING score::decimal(3,1),
            ALTER COLUMN outcome_date TYPE date USING outcome_date::date,
            ALTER COLUMN outcome TYPE varchar(50) USING outcome::text,
            ALTER COLUMN moved_to_stage_at TYPE date USING moved_to_stage_at::date,
            ALTER COLUMN submitted_at TYPE date USING submitted_at::date,
            ALTER COLUMN current_stage TYPE varchar(255);
        `);
    }
}
