import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInterviewsTable1767914000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Idempotency: if table already exists in this DB, don't try to recreate it.
        // Some environments already created `interviews` via earlier migrations.
        const existing = await queryRunner.getTable('interviews');
        if (existing) {
            return;
        }

        await queryRunner.createTable(
            new Table({
                name: 'interviews',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isNullable: false,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
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
                        name: 'candidate_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'job_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'interview_round',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                    },
                    {
                        name: 'interview_type',
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
                        name: 'scheduled_at',
                        type: 'timestamptz',
                        isNullable: false,
                    },
                    {
                        name: 'interviewer_name',
                        type: 'varchar',
                        length: '200',
                        isNullable: true,
                    },
                    {
                        name: 'interviewer_email',
                        type: 'varchar',
                        length: '200',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                        default: `'Scheduled'`,
                    },
                    {
                        name: 'feedback',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_by',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'updated_by',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        isNullable: false,
                        default: 'NOW()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamptz',
                        isNullable: false,
                        default: 'NOW()',
                    },
                    {
                        name: 'deleted_at',
                        type: 'timestamptz',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        const table = await queryRunner.getTable('interviews');
        const hasIndex = (name: string) => (table?.indices || []).some((i) => i.name === name);

        if (!hasIndex('idx_interviews_company_submission')) {
            await queryRunner.createIndex(
                'interviews',
                new TableIndex({
                    name: 'idx_interviews_company_submission',
                    columnNames: ['company_id', 'submission_id'],
                }),
            );
        }

        if (!hasIndex('idx_interviews_company_candidate')) {
            await queryRunner.createIndex(
                'interviews',
                new TableIndex({
                    name: 'idx_interviews_company_candidate',
                    columnNames: ['company_id', 'candidate_id'],
                }),
            );
        }

        if (!hasIndex('idx_interviews_company_job')) {
            await queryRunner.createIndex(
                'interviews',
                new TableIndex({
                    name: 'idx_interviews_company_job',
                    columnNames: ['company_id', 'job_id'],
                }),
            );
        }

        if (!hasIndex('idx_interviews_company_status')) {
            await queryRunner.createIndex(
                'interviews',
                new TableIndex({
                    name: 'idx_interviews_company_status',
                    columnNames: ['company_id', 'status'],
                }),
            );
        }

        if (!hasIndex('idx_interviews_company_scheduled_at')) {
            await queryRunner.createIndex(
                'interviews',
                new TableIndex({
                    name: 'idx_interviews_company_scheduled_at',
                    columnNames: ['company_id', 'scheduled_at'],
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('interviews', true);
    }
}

