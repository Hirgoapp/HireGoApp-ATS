import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePipelinesTable1736247000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasPipelines = await queryRunner.hasTable('pipelines');
        const hasPipelineStages = await queryRunner.hasTable('pipeline_stages');

        if (!hasPipelines) {
            await queryRunner.createTable(
                new Table({
                    name: 'pipelines',
                    columns: [
                        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
                        { name: 'company_id', type: 'uuid', isNullable: false },
                        { name: 'name', type: 'varchar', length: '255', isNullable: false },
                        { name: 'description', type: 'text', isNullable: true },
                        { name: 'is_default', type: 'boolean', default: false },
                        { name: 'is_active', type: 'boolean', default: true },
                        { name: 'created_by', type: 'uuid', isNullable: true },
                        { name: 'updated_by', type: 'uuid', isNullable: true },
                        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                        { name: 'deleted_at', type: 'timestamp', isNullable: true },
                    ],
                }),
                true,
            );

            await queryRunner.createForeignKey(
                'pipelines',
                new TableForeignKey({
                    columnNames: ['company_id'],
                    referencedTableName: 'companies',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            );

            await queryRunner.createForeignKey(
                'pipelines',
                new TableForeignKey({
                    columnNames: ['created_by'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                }),
            );

            await queryRunner.createForeignKey(
                'pipelines',
                new TableForeignKey({
                    columnNames: ['updated_by'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                }),
            );

            await queryRunner.createIndex(
                'pipelines',
                new TableIndex({
                    name: 'IDX_pipelines_company_id',
                    columnNames: ['company_id'],
                }),
            );

            await queryRunner.createIndex(
                'pipelines',
                new TableIndex({
                    name: 'IDX_pipelines_is_default',
                    columnNames: ['is_default'],
                }),
            );
        }

        if (!hasPipelineStages) {
            await queryRunner.createTable(
                new Table({
                    name: 'pipeline_stages',
                    columns: [
                        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
                        { name: 'pipeline_id', type: 'uuid', isNullable: false },
                        { name: 'name', type: 'varchar', length: '255', isNullable: false },
                        { name: 'description', type: 'text', isNullable: true },
                        { name: 'stage_order', type: 'int', isNullable: false },
                        { name: 'stage_type', type: 'varchar', length: '50', isNullable: false },
                        { name: 'color', type: 'varchar', length: '20', isNullable: true },
                        { name: 'is_active', type: 'boolean', default: true },
                        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                        { name: 'deleted_at', type: 'timestamp', isNullable: true },
                    ],
                }),
                true,
            );

            await queryRunner.createForeignKey(
                'pipeline_stages',
                new TableForeignKey({
                    columnNames: ['pipeline_id'],
                    referencedTableName: 'pipelines',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            );

            await queryRunner.createIndex(
                'pipeline_stages',
                new TableIndex({
                    name: 'IDX_pipeline_stages_pipeline_id',
                    columnNames: ['pipeline_id'],
                }),
            );

            await queryRunner.createIndex(
                'pipeline_stages',
                new TableIndex({
                    name: 'IDX_pipeline_stages_stage_order',
                    columnNames: ['pipeline_id', 'stage_order'],
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('pipeline_stages');
        await queryRunner.dropTable('pipelines');
    }
}
