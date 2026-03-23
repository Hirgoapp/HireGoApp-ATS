import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class MigrateSubmissionsModule1736163600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create submissions table (from daily_submissions)
        await queryRunner.createTable(
            new Table({
                name: 'submissions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
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
                        name: 'job_requirement_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'client_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'poc_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'source_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'candidate_name',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'phone',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'uan_number',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'total_experience',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'relevant_experience',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'current_company_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'current_location_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'job_location_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'qualification_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'linkedin_url',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'aadhar_number',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'manager_screening',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'manager_screening_status',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        default: "'Pending'",
                    },
                    {
                        name: 'submission_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        default: "'Pending'",
                    },
                    {
                        name: 'position_applied',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'location_preference',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'gender',
                        type: 'varchar',
                        length: '10',
                        isNullable: true,
                    },
                    {
                        name: 'dob',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'marital_status',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'remarks',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'alternative_contact',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'current_company',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'willing_to_relocate',
                        type: 'boolean',
                        isNullable: true,
                        default: false,
                    },
                    {
                        name: 'buyout',
                        type: 'boolean',
                        isNullable: true,
                        default: false,
                    },
                    {
                        name: 'buyout_option',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'passport_number',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'passport',
                        type: 'boolean',
                        isNullable: true,
                        default: false,
                    },
                    {
                        name: 'reason_for_job_change',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'reason_for_change',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'other_comments',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'currency_code',
                        type: 'varchar',
                        length: '3',
                        isNullable: true,
                        default: "'INR'",
                    },
                    {
                        name: 'current_ctc',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'expected_ctc',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'notice_period',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'highest_qualification_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'passout_year',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'skill_set',
                        type: 'varchar',
                        length: '150',
                        isNullable: true,
                    },
                    {
                        name: 'alternate_phone',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'video_verification',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'how_many_companies',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'extra_fields',
                        type: 'jsonb',
                        isNullable: true,
                        default: "'{}'",
                    },
                    {
                        name: 'active_flag',
                        type: 'boolean',
                        isNullable: true,
                        default: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'created_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'updated_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Add indexes for submissions
        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_SUBMISSIONS_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_SUBMISSIONS_CANDIDATE',
                columnNames: ['candidate_id'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_SUBMISSIONS_JOB',
                columnNames: ['job_requirement_id'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_SUBMISSIONS_USER',
                columnNames: ['user_id'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_SUBMISSIONS_CLIENT',
                columnNames: ['client_id'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_SUBMISSIONS_STATUS',
                columnNames: ['status'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_SUBMISSIONS_DATE',
                columnNames: ['submission_date'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_SUBMISSIONS_EMAIL',
                columnNames: ['email'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_SUBMISSIONS_PHONE',
                columnNames: ['phone'],
            }),
        );

        await queryRunner.createIndex(
            'submissions',
            new TableIndex({
                name: 'IDX_SUBMISSIONS_COMPANY_STATUS_DATE',
                columnNames: ['company_id', 'status', 'submission_date'],
            }),
        );

        // 2. Create submission_documents table
        await queryRunner.createTable(
            new Table({
                name: 'submission_documents',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
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
                        name: 'document_type_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'document_name',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'file_name',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'file_path',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'file_size',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'mime_type',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'created_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'submission_documents',
            new TableIndex({
                name: 'IDX_SUBMISSION_DOCUMENTS_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'submission_documents',
            new TableIndex({
                name: 'IDX_SUBMISSION_DOCUMENTS_SUBMISSION',
                columnNames: ['submission_id'],
            }),
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            'submissions',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'submissions',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'candidates',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'submissions',
            new TableForeignKey({
                columnNames: ['job_requirement_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'job_requirements',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'submission_documents',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'submission_documents',
            new TableForeignKey({
                columnNames: ['submission_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'submissions',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('submission_documents');
        await queryRunner.dropTable('submissions');
    }
}
