import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInterviewsTable1736251000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('interviews');

        if (!table) {
            await queryRunner.createTable(
                new Table({
                    name: 'interviews',
                    columns: [
                        {
                            name: 'id',
                            type: 'uuid',
                            isPrimary: true,
                            default: 'uuid_generate_v4()',
                        },
                        {
                            name: 'application_id',
                            type: 'uuid',
                            isNullable: false,
                        },
                        {
                            name: 'interviewer_id',
                            type: 'uuid',
                            isNullable: false,
                        },
                        {
                            name: 'interview_type',
                            type: 'varchar',
                            length: '50',
                            isNullable: false,
                        },
                        {
                            name: 'status',
                            type: 'varchar',
                            length: '50',
                            default: "'scheduled'",
                        },
                        {
                            name: 'scheduled_at',
                            type: 'timestamp',
                            isNullable: false,
                        },
                        {
                            name: 'completed_at',
                            type: 'timestamp',
                            isNullable: true,
                        },
                        {
                            name: 'duration_minutes',
                            type: 'integer',
                            isNullable: true,
                        },
                        {
                            name: 'location',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'meeting_link',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'notes',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'metadata',
                            type: 'jsonb',
                            isNullable: true,
                            default: "'{}'",
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
                    ],
                }),
                true,
            );
        } else {
            const hasApplicationId = table.findColumnByName('application_id');
            if (!hasApplicationId) {
                await queryRunner.addColumn(
                    'interviews',
                    new TableColumn({
                        name: 'application_id',
                        type: 'uuid',
                        isNullable: true,
                    }),
                );
            }

            const hasInterviewerId = table.findColumnByName('interviewer_id');
            if (!hasInterviewerId) {
                await queryRunner.addColumn(
                    'interviews',
                    new TableColumn({
                        name: 'interviewer_id',
                        type: 'uuid',
                        isNullable: true,
                    }),
                );
            }

            const ensureColumn = async (name: string, column: TableColumn) => {
                if (!table.findColumnByName(name)) {
                    await queryRunner.addColumn('interviews', column);
                }
            };

            await ensureColumn(
                'interview_type',
                new TableColumn({ name: 'interview_type', type: 'varchar', length: '50', isNullable: true }),
            );

            await ensureColumn(
                'status',
                new TableColumn({ name: 'status', type: 'varchar', length: '50', isNullable: true, default: "'scheduled'" }),
            );

            await ensureColumn(
                'scheduled_at',
                new TableColumn({ name: 'scheduled_at', type: 'timestamp', isNullable: true }),
            );

            await ensureColumn(
                'completed_at',
                new TableColumn({ name: 'completed_at', type: 'timestamp', isNullable: true }),
            );

            await ensureColumn(
                'duration_minutes',
                new TableColumn({ name: 'duration_minutes', type: 'integer', isNullable: true }),
            );

            await ensureColumn(
                'location',
                new TableColumn({ name: 'location', type: 'text', isNullable: true }),
            );

            await ensureColumn(
                'meeting_link',
                new TableColumn({ name: 'meeting_link', type: 'text', isNullable: true }),
            );

            await ensureColumn('notes', new TableColumn({ name: 'notes', type: 'text', isNullable: true }));

            await ensureColumn(
                'metadata',
                new TableColumn({ name: 'metadata', type: 'jsonb', isNullable: true, default: "'{}'" }),
            );

            await ensureColumn(
                'created_at',
                new TableColumn({ name: 'created_at', type: 'timestamp', isNullable: true, default: 'CURRENT_TIMESTAMP' }),
            );

            await ensureColumn(
                'updated_at',
                new TableColumn({ name: 'updated_at', type: 'timestamp', isNullable: true, default: 'CURRENT_TIMESTAMP' }),
            );
        }

        const currentTable = await queryRunner.getTable('interviews');
        if (!currentTable) {
            return;
        }

        const hasApplicationFk = currentTable.foreignKeys.some((fk) => fk.columnNames.includes('application_id'));
        if (!hasApplicationFk) {
            await queryRunner.createForeignKey(
                'interviews',
                new TableForeignKey({
                    columnNames: ['application_id'],
                    referencedTableName: 'applications',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            );
        }

        const hasInterviewerFk = currentTable.foreignKeys.some((fk) => fk.columnNames.includes('interviewer_id'));
        if (!hasInterviewerFk) {
            await queryRunner.createForeignKey(
                'interviews',
                new TableForeignKey({
                    columnNames: ['interviewer_id'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'RESTRICT',
                }),
            );
        }

        if (!currentTable.indices.some((idx) => idx.name === 'IDX_interviews_application_id')) {
            await queryRunner.createIndex(
                'interviews',
                new TableIndex({
                    name: 'IDX_interviews_application_id',
                    columnNames: ['application_id'],
                }),
            );
        }

        if (!currentTable.indices.some((idx) => idx.name === 'IDX_interviews_interviewer_id')) {
            await queryRunner.createIndex(
                'interviews',
                new TableIndex({
                    name: 'IDX_interviews_interviewer_id',
                    columnNames: ['interviewer_id'],
                }),
            );
        }

        if (!currentTable.indices.some((idx) => idx.name === 'IDX_interviews_scheduled_at')) {
            await queryRunner.createIndex(
                'interviews',
                new TableIndex({
                    name: 'IDX_interviews_scheduled_at',
                    columnNames: ['scheduled_at'],
                }),
            );
        }

        if (!currentTable.indices.some((idx) => idx.name === 'IDX_interviews_status')) {
            await queryRunner.createIndex(
                'interviews',
                new TableIndex({
                    name: 'IDX_interviews_status',
                    columnNames: ['status'],
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('interviews');
    }
}
