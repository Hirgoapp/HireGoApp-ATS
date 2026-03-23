import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class MigrateJobRequirementsModule1736162400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create job_requirements table
        await queryRunner.createTable(
            new Table({
                name: 'job_requirements',
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
                        name: 'ecms_req_id',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'client_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'job_title',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'job_description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'domain',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'business_unit',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'total_experience_min',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'relevant_experience_min',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'mandatory_skills',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'desired_skills',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'country',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'work_location',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'wfo_wfh_hybrid',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'shift_time',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'number_of_openings',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'project_manager_name',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'project_manager_email',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'delivery_spoc_1_name',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'delivery_spoc_1_email',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'delivery_spoc_2_name',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'delivery_spoc_2_email',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'bgv_timing',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'bgv_vendor',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'interview_mode',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'interview_platforms',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'screenshot_requirement',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'vendor_rate',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'currency',
                        type: 'varchar',
                        length: '3',
                        isNullable: true,
                    },
                    {
                        name: 'client_name',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'email_subject',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'email_received_date',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'priority',
                        type: 'varchar',
                        length: '20',
                        isNullable: false,
                        default: "'Medium'",
                    },
                    {
                        name: 'active_flag',
                        type: 'boolean',
                        isNullable: true,
                        default: true,
                    },
                    {
                        name: 'extra_fields',
                        type: 'jsonb',
                        isNullable: true,
                        default: "'{}'",
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

        // Add indexes for job_requirements
        await queryRunner.createIndex(
            'job_requirements',
            new TableIndex({
                name: 'IDX_JOB_REQUIREMENTS_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'job_requirements',
            new TableIndex({
                name: 'IDX_JOB_REQUIREMENTS_CLIENT',
                columnNames: ['client_id'],
            }),
        );

        await queryRunner.createIndex(
            'job_requirements',
            new TableIndex({
                name: 'IDX_JOB_REQUIREMENTS_ECMS_ID',
                columnNames: ['ecms_req_id'],
            }),
        );

        await queryRunner.createIndex(
            'job_requirements',
            new TableIndex({
                name: 'IDX_JOB_REQUIREMENTS_PRIORITY',
                columnNames: ['priority'],
            }),
        );

        await queryRunner.createIndex(
            'job_requirements',
            new TableIndex({
                name: 'IDX_JOB_REQUIREMENTS_ACTIVE',
                columnNames: ['active_flag'],
            }),
        );

        await queryRunner.createIndex(
            'job_requirements',
            new TableIndex({
                name: 'IDX_JOB_REQUIREMENTS_COMPANY_ACTIVE',
                columnNames: ['company_id', 'active_flag'],
            }),
        );

        // 2. Create requirement_skills table
        await queryRunner.createTable(
            new Table({
                name: 'requirement_skills',
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
                        name: 'job_requirement_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'skill_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'is_mandatory',
                        type: 'boolean',
                        isNullable: true,
                    },
                    {
                        name: 'proficiency_required',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'years_required',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'requirement_skills',
            new TableIndex({
                name: 'IDX_REQUIREMENT_SKILLS_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'requirement_skills',
            new TableIndex({
                name: 'IDX_REQUIREMENT_SKILLS_JOB',
                columnNames: ['job_requirement_id'],
            }),
        );

        await queryRunner.createIndex(
            'requirement_skills',
            new TableIndex({
                name: 'IDX_REQUIREMENT_SKILLS_SKILL',
                columnNames: ['skill_id'],
            }),
        );

        // 3. Create requirement_assignments table
        await queryRunner.createTable(
            new Table({
                name: 'requirement_assignments',
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
                        name: 'job_requirement_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'assigned_to_user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'assigned_by_user_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'assigned_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'assignment_notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'target_count',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'target_submission_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'completion_notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'completed_at',
                        type: 'timestamp',
                        isNullable: true,
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
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'requirement_assignments',
            new TableIndex({
                name: 'IDX_REQUIREMENT_ASSIGNMENTS_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'requirement_assignments',
            new TableIndex({
                name: 'IDX_REQUIREMENT_ASSIGNMENTS_JOB',
                columnNames: ['job_requirement_id'],
            }),
        );

        await queryRunner.createIndex(
            'requirement_assignments',
            new TableIndex({
                name: 'IDX_REQUIREMENT_ASSIGNMENTS_USER',
                columnNames: ['assigned_to_user_id'],
            }),
        );

        // 4. Create requirement_import_logs table
        await queryRunner.createTable(
            new Table({
                name: 'requirement_import_logs',
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
                        name: 'job_requirement_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'import_source',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'import_method',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'email_from',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'email_subject',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'email_received_date',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'raw_email_content',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'ecms_req_id_extracted',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'parse_status',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'parse_errors',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'extracted_fields_count',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'processed_by_user_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'processed_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'processing_notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'is_duplicate',
                        type: 'boolean',
                        isNullable: true,
                    },
                    {
                        name: 'extra_metadata',
                        type: 'jsonb',
                        isNullable: true,
                        default: "'{}'",
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'requirement_import_logs',
            new TableIndex({
                name: 'IDX_REQUIREMENT_IMPORT_LOGS_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'requirement_import_logs',
            new TableIndex({
                name: 'IDX_REQUIREMENT_IMPORT_LOGS_JOB',
                columnNames: ['job_requirement_id'],
            }),
        );

        await queryRunner.createIndex(
            'requirement_import_logs',
            new TableIndex({
                name: 'IDX_REQUIREMENT_IMPORT_LOGS_STATUS',
                columnNames: ['status'],
            }),
        );

        // 5. Create requirement_tracker_templates table
        await queryRunner.createTable(
            new Table({
                name: 'requirement_tracker_templates',
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
                        name: 'job_requirement_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'tracker_source',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'tracker_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'columns',
                        type: 'jsonb',
                        isNullable: true,
                        default: "'[]'",
                    },
                    {
                        name: 'total_columns',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'column_mapping',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'is_active',
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
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'requirement_tracker_templates',
            new TableIndex({
                name: 'IDX_REQUIREMENT_TRACKER_TEMPLATES_COMPANY',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'requirement_tracker_templates',
            new TableIndex({
                name: 'IDX_REQUIREMENT_TRACKER_TEMPLATES_JOB',
                columnNames: ['job_requirement_id'],
            }),
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            'job_requirements',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'requirement_skills',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'requirement_skills',
            new TableForeignKey({
                columnNames: ['job_requirement_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'job_requirements',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'requirement_assignments',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'requirement_assignments',
            new TableForeignKey({
                columnNames: ['job_requirement_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'job_requirements',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'requirement_import_logs',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'requirement_import_logs',
            new TableForeignKey({
                columnNames: ['job_requirement_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'job_requirements',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'requirement_tracker_templates',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'requirement_tracker_templates',
            new TableForeignKey({
                columnNames: ['job_requirement_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'job_requirements',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('requirement_tracker_templates');
        await queryRunner.dropTable('requirement_import_logs');
        await queryRunner.dropTable('requirement_assignments');
        await queryRunner.dropTable('requirement_skills');
        await queryRunner.dropTable('job_requirements');
    }
}
