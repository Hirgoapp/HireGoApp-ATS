import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateApplicationsTable1704067206000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'applications',
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
                        name: 'job_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'candidate_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'current_stage_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'applied_at',
                        type: 'timestamp',
                        default: 'NOW()',
                        isNullable: false,
                    },
                    {
                        name: 'source',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'rating',
                        type: 'numeric',
                        precision: 3,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'next_interview_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'interview_notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'evaluations',
                        type: 'jsonb',
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'custom_fields',
                        type: 'jsonb',
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                        isNullable: false,
                    },
                    {
                        name: 'rejection_reason',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'rejected_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'hired_at',
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
            'applications',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'applications',
            new TableForeignKey({
                columnNames: ['job_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'jobs',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'applications',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'candidates',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'applications',
            new TableForeignKey({
                columnNames: ['current_stage_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'pipeline_stages',
                onDelete: 'RESTRICT',
                onUpdate: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_company_job',
                columnNames: ['company_id', 'job_id'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_company_candidate',
                columnNames: ['company_id', 'candidate_id'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_current_stage',
                columnNames: ['current_stage_id'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_company_applied_at',
                columnNames: ['company_id', 'applied_at'],
            }),
        );

        // Create unique constraint
        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'UQ_applications_job_candidate',
                columnNames: ['job_id', 'candidate_id'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('applications', true);
    }
}
