import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePipelineStagesTable1704067203000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'pipeline_stages',
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
                        name: 'pipeline_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'order_index',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'color_hex',
                        type: 'varchar',
                        length: '7',
                        isNullable: true,
                    },
                    {
                        name: 'is_terminal',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'require_action',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'action_template',
                        type: 'jsonb',
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
                ],
            }),
            true,
        );

        // Create foreign keys
        await queryRunner.createForeignKey(
            'pipeline_stages',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'pipeline_stages',
            new TableForeignKey({
                columnNames: ['pipeline_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'pipelines',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'pipeline_stages',
            new TableIndex({
                name: 'IDX_pipeline_stages_pipeline_order',
                columnNames: ['pipeline_id', 'order_index'],
            }),
        );

        // Create unique constraints
        await queryRunner.createIndex(
            'pipeline_stages',
            new TableIndex({
                name: 'UQ_pipeline_stages_pipeline_name',
                columnNames: ['pipeline_id', 'name'],
                isUnique: true,
            }),
        );

        await queryRunner.createIndex(
            'pipeline_stages',
            new TableIndex({
                name: 'UQ_pipeline_stages_pipeline_order',
                columnNames: ['pipeline_id', 'order_index'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('pipeline_stages', true);
    }
}
