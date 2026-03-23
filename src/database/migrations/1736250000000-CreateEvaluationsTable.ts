import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateEvaluationsTable1736250000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'evaluations',
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
                        name: 'evaluator_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'rating',
                        type: 'integer',
                        isNullable: false,
                        comment: 'Rating 1-5',
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        default: "'pending'",
                    },
                    {
                        name: 'feedback',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'strengths',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'weaknesses',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'recommendation',
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

        // Foreign Keys
        await queryRunner.createForeignKey(
            'evaluations',
            new TableForeignKey({
                columnNames: ['application_id'],
                referencedTableName: 'applications',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'evaluations',
            new TableForeignKey({
                columnNames: ['evaluator_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        );

        // Indexes
        await queryRunner.createIndex(
            'evaluations',
            new TableIndex({
                name: 'IDX_evaluations_application_id',
                columnNames: ['application_id'],
            }),
        );

        await queryRunner.createIndex(
            'evaluations',
            new TableIndex({
                name: 'IDX_evaluations_evaluator_id',
                columnNames: ['evaluator_id'],
            }),
        );

        await queryRunner.createIndex(
            'evaluations',
            new TableIndex({
                name: 'IDX_evaluations_status',
                columnNames: ['status'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('evaluations');
    }
}
