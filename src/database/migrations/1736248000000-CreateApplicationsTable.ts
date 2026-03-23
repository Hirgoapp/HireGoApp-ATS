import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateApplicationsTable1736248000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('applications');
        if (hasTable) {
            return;
        }

        await queryRunner.createTable(
            new Table({
                name: 'applications',
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
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'job_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'pipeline_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'current_stage_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'source_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'applied_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        default: "'active'",
                    },
                    {
                        name: 'rating',
                        type: 'integer',
                        isNullable: true,
                        comment: 'Overall rating 1-5',
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'resume_file_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'cover_letter_file_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                        default: "'{}'",
                    },
                    {
                        name: 'assigned_to',
                        type: 'uuid',
                        isNullable: true,
                        comment: 'Recruiter/user assigned to this application',
                    },
                    {
                        name: 'is_archived',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'archived_at',
                        type: 'timestamp',
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
            true,
        );

        // Foreign Keys
        await queryRunner.createForeignKey(
            'applications',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'applications',
            new TableForeignKey({
                columnNames: ['candidate_id'],
                referencedTableName: 'candidates',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'applications',
            new TableForeignKey({
                columnNames: ['job_id'],
                referencedTableName: 'job_requirements',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'applications',
            new TableForeignKey({
                columnNames: ['pipeline_id'],
                referencedTableName: 'pipelines',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        );

        await queryRunner.createForeignKey(
            'applications',
            new TableForeignKey({
                columnNames: ['current_stage_id'],
                referencedTableName: 'pipeline_stages',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        );

        await queryRunner.createForeignKey(
            'applications',
            new TableForeignKey({
                columnNames: ['source_id'],
                referencedTableName: 'sources',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'applications',
            new TableForeignKey({
                columnNames: ['assigned_to'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Indexes
        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_company_id',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_candidate_id',
                columnNames: ['candidate_id'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_job_id',
                columnNames: ['job_id'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_pipeline_stage',
                columnNames: ['pipeline_id', 'current_stage_id'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_status',
                columnNames: ['status'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_assigned_to',
                columnNames: ['assigned_to'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_applied_at',
                columnNames: ['applied_at'],
            }),
        );

        // GIN index for JSONB metadata - handle manually if needed
        // await queryRunner.query(
        //   `CREATE INDEX "IDX_applications_metadata" ON "applications" USING GIN ("metadata")`
        // );

        // Unique constraint: one application per candidate per job
        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'IDX_applications_candidate_job_unique',
                columnNames: ['candidate_id', 'job_id'],
                isUnique: true,
                where: 'deleted_at IS NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('applications');
    }
}
