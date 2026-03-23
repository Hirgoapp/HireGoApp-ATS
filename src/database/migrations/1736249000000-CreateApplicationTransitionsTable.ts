import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateApplicationTransitionsTable1736249000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'application_transitions',
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
                        name: 'from_stage_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'to_stage_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'moved_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'reason',
                        type: 'varchar',
                        length: '50',
                        default: "'manual_move'",
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'transitioned_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                        default: "'{}'",
                    },
                ],
            }),
            true,
        );

        // Foreign Keys
        await queryRunner.createForeignKey(
            'application_transitions',
            new TableForeignKey({
                columnNames: ['application_id'],
                referencedTableName: 'applications',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'application_transitions',
            new TableForeignKey({
                columnNames: ['from_stage_id'],
                referencedTableName: 'pipeline_stages',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        );

        await queryRunner.createForeignKey(
            'application_transitions',
            new TableForeignKey({
                columnNames: ['to_stage_id'],
                referencedTableName: 'pipeline_stages',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        );

        await queryRunner.createForeignKey(
            'application_transitions',
            new TableForeignKey({
                columnNames: ['moved_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Indexes
        await queryRunner.createIndex(
            'application_transitions',
            new TableIndex({
                name: 'IDX_application_transitions_application_id',
                columnNames: ['application_id'],
            }),
        );

        await queryRunner.createIndex(
            'application_transitions',
            new TableIndex({
                name: 'IDX_application_transitions_from_stage',
                columnNames: ['from_stage_id'],
            }),
        );

        await queryRunner.createIndex(
            'application_transitions',
            new TableIndex({
                name: 'IDX_application_transitions_to_stage',
                columnNames: ['to_stage_id'],
            }),
        );

        await queryRunner.createIndex(
            'application_transitions',
            new TableIndex({
                name: 'IDX_application_transitions_transitioned_at',
                columnNames: ['transitioned_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('application_transitions');
    }
}
