import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSubmissionsTable1701000001000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create submissions table
        await queryRunner.createTable(
            new Table({
                name: 'submissions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'candidate_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'job_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'current_stage',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'submitted_at',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'moved_to_stage_at',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'outcome',
                        type: 'enum',
                        enum: ['rejected', 'offer', 'joined', 'withdrawn'],
                        isNullable: true,
                    },
                    {
                        name: 'outcome_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'internal_notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'source',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'score',
                        type: 'decimal',
                        precision: 3,
                        scale: 1,
                        isNullable: true,
                    },
                    {
                        name: 'tags',
                        type: 'json',
                        isNullable: true,
                    },
                    {
                        name: 'created_by_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'updated_by_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
        );

        // Create indices on submissions table
        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_submissions_company_id',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_submissions_company_candidate',
                columnNames: ['company_id', 'candidate_id'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_submissions_company_job',
                columnNames: ['company_id', 'job_id'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_submissions_company_stage',
                columnNames: ['company_id', 'current_stage'],
            }),
        );

        // Create submission_histories table
        await queryRunner.createTable(
            new Table({
                name: 'submission_histories',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'submission_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'moved_from_stage',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'moved_to_stage',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'reason',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'outcome_recorded',
                        type: 'enum',
                        enum: ['rejected', 'offer', 'joined', 'withdrawn'],
                        isNullable: true,
                    },
                    {
                        name: 'outcome_reason',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_by_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
        );

        // Create indices on submission_histories table
        await queryRunner.createIndex(
            'submission_histories',
            new TableIndex({
                name: 'IDX_submission_histories_company',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'submission_histories',
            new TableIndex({
                name: 'IDX_submission_histories_submission',
                columnNames: ['submission_id'],
            }),
        );

        await queryRunner.createIndex(
            'submission_histories',
            new TableIndex({
                name: 'IDX_submission_histories_company_submission',
                columnNames: ['company_id', 'submission_id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indices
        await queryRunner.dropIndex('submission_histories', 'IDX_submission_histories_company_submission');
        await queryRunner.dropIndex('submission_histories', 'IDX_submission_histories_submission');
        await queryRunner.dropIndex('submission_histories', 'IDX_submission_histories_company');
        await queryRunner.dropIndex('submissions', 'IDX_submissions_company_stage');
        await queryRunner.dropIndex('submissions', 'IDX_submissions_company_job');
        await queryRunner.dropIndex('submissions', 'IDX_submissions_company_candidate');
        await queryRunner.dropIndex('submissions', 'IDX_submissions_company_id');

        // Drop tables
        await queryRunner.dropTable('submission_histories');
        await queryRunner.dropTable('submissions');
    }
}
