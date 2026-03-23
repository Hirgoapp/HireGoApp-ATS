import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class CreateMissingRequirementTables1769200300000 implements MigrationInterface {
    name = 'CreateMissingRequirementTables1769200300000';

    private async ensureIndex(
        queryRunner: QueryRunner,
        tableName: string,
        indexName: string,
        columnNames: string[],
    ): Promise<void> {
        const table = await queryRunner.getTable(tableName);
        if (!table) {
            return;
        }

        const existing = table.indices.find((idx) => idx.name === indexName);
        if (!existing) {
            await queryRunner.createIndex(
                tableName,
                new TableIndex({
                    name: indexName,
                    columnNames,
                }),
            );
        }
    }

    private async ensureForeignKey(
        queryRunner: QueryRunner,
        tableName: string,
        foreignKey: TableForeignKey,
    ): Promise<void> {
        const table = await queryRunner.getTable(tableName);
        if (!table) {
            return;
        }

        const exists = table.foreignKeys.some(
            (fk) =>
                fk.columnNames.join(',') === foreignKey.columnNames.join(',') &&
                fk.referencedTableName === foreignKey.referencedTableName,
        );

        if (!exists) {
            await queryRunner.createForeignKey(tableName, foreignKey);
        }
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasJobRequirements = await queryRunner.hasTable('job_requirements');

        if (!(await queryRunner.hasTable('requirement_skills'))) {
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
        }

        await this.ensureIndex(
            queryRunner,
            'requirement_skills',
            'IDX_REQUIREMENT_SKILLS_COMPANY',
            ['company_id'],
        );
        await this.ensureIndex(
            queryRunner,
            'requirement_skills',
            'IDX_REQUIREMENT_SKILLS_JOB_REQUIREMENT',
            ['job_requirement_id'],
        );
        await this.ensureIndex(
            queryRunner,
            'requirement_skills',
            'IDX_REQUIREMENT_SKILLS_SKILL',
            ['skill_id'],
        );

        if (!(await queryRunner.hasTable('requirement_assignments'))) {
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
        }

        await this.ensureIndex(
            queryRunner,
            'requirement_assignments',
            'IDX_REQUIREMENT_ASSIGNMENTS_COMPANY',
            ['company_id'],
        );
        await this.ensureIndex(
            queryRunner,
            'requirement_assignments',
            'IDX_REQUIREMENT_ASSIGNMENTS_JOB_REQUIREMENT',
            ['job_requirement_id'],
        );
        await this.ensureIndex(
            queryRunner,
            'requirement_assignments',
            'IDX_REQUIREMENT_ASSIGNMENTS_ASSIGNED_TO',
            ['assigned_to_user_id'],
        );

        if (!(await queryRunner.hasTable('requirement_import_logs'))) {
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
        }

        await this.ensureIndex(
            queryRunner,
            'requirement_import_logs',
            'IDX_REQUIREMENT_IMPORT_LOGS_COMPANY',
            ['company_id'],
        );
        await this.ensureIndex(
            queryRunner,
            'requirement_import_logs',
            'IDX_REQUIREMENT_IMPORT_LOGS_JOB_REQUIREMENT',
            ['job_requirement_id'],
        );
        await this.ensureIndex(
            queryRunner,
            'requirement_import_logs',
            'IDX_REQUIREMENT_IMPORT_LOGS_STATUS',
            ['status'],
        );

        if (!(await queryRunner.hasTable('requirement_tracker_templates'))) {
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
        }

        await this.ensureIndex(
            queryRunner,
            'requirement_tracker_templates',
            'IDX_REQUIREMENT_TRACKER_TEMPLATES_COMPANY',
            ['company_id'],
        );
        await this.ensureIndex(
            queryRunner,
            'requirement_tracker_templates',
            'IDX_REQUIREMENT_TRACKER_TEMPLATES_JOB_REQUIREMENT',
            ['job_requirement_id'],
        );

        await this.ensureForeignKey(
            queryRunner,
            'requirement_skills',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await this.ensureForeignKey(
            queryRunner,
            'requirement_assignments',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await this.ensureForeignKey(
            queryRunner,
            'requirement_assignments',
            new TableForeignKey({
                columnNames: ['assigned_to_user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'NO ACTION',
            }),
        );

        await this.ensureForeignKey(
            queryRunner,
            'requirement_assignments',
            new TableForeignKey({
                columnNames: ['assigned_by_user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
            }),
        );

        await this.ensureForeignKey(
            queryRunner,
            'requirement_import_logs',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await this.ensureForeignKey(
            queryRunner,
            'requirement_import_logs',
            new TableForeignKey({
                columnNames: ['processed_by_user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'NO ACTION',
            }),
        );

        await this.ensureForeignKey(
            queryRunner,
            'requirement_tracker_templates',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        if (hasJobRequirements) {
            await this.ensureForeignKey(
                queryRunner,
                'requirement_skills',
                new TableForeignKey({
                    columnNames: ['job_requirement_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'job_requirements',
                    onDelete: 'CASCADE',
                }),
            );

            await this.ensureForeignKey(
                queryRunner,
                'requirement_assignments',
                new TableForeignKey({
                    columnNames: ['job_requirement_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'job_requirements',
                    onDelete: 'CASCADE',
                }),
            );

            await this.ensureForeignKey(
                queryRunner,
                'requirement_import_logs',
                new TableForeignKey({
                    columnNames: ['job_requirement_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'job_requirements',
                    onDelete: 'CASCADE',
                }),
            );

            await this.ensureForeignKey(
                queryRunner,
                'requirement_tracker_templates',
                new TableForeignKey({
                    columnNames: ['job_requirement_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'job_requirements',
                    onDelete: 'CASCADE',
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('requirement_tracker_templates', true);
        await queryRunner.dropTable('requirement_import_logs', true);
        await queryRunner.dropTable('requirement_assignments', true);
        await queryRunner.dropTable('requirement_skills', true);
    }
}
