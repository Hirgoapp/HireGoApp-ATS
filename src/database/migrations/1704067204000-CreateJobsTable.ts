import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateJobsTable1704067204000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'jobs',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'requirements',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'job_code',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'department',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'location',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'salary_min',
                        type: 'numeric',
                        precision: 12,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'salary_max',
                        type: 'numeric',
                        precision: 12,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'salary_currency',
                        type: 'varchar',
                        length: '3',
                        default: "'USD'",
                        isNullable: false,
                    },
                    {
                        name: 'employment_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        default: "'open'",
                        isNullable: false,
                    },
                    {
                        name: 'pipeline_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'created_by_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'hiring_manager_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'custom_fields',
                        type: 'jsonb',
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'published_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'closed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'NOW()',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'NOW()',
                        isNullable: false,
                        onUpdate: 'NOW()',
                    },
                    {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Create foreign keys
        await queryRunner.createForeignKey(
            'jobs',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'jobs',
            new TableForeignKey({
                columnNames: ['pipeline_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'pipelines',
                onDelete: 'RESTRICT',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'jobs',
            new TableForeignKey({
                columnNames: ['created_by_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'jobs',
            new TableForeignKey({
                columnNames: ['hiring_manager_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'jobs',
            new TableIndex({
                name: 'IDX_jobs_company_status',
                columnNames: ['company_id', 'status'],
            }),
        );

        await queryRunner.createIndex(
            'jobs',
            new TableIndex({
                name: 'IDX_jobs_company_pipeline',
                columnNames: ['company_id', 'pipeline_id'],
            }),
        );

        await queryRunner.createIndex(
            'jobs',
            new TableIndex({
                name: 'IDX_jobs_pipeline_id',
                columnNames: ['pipeline_id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('jobs', true);
    }
}
