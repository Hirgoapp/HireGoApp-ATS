import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

export class CreateWebhookLogsTable1736256000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableName = 'webhook_logs';

        const columns: TableColumn[] = [
            new TableColumn({
                name: 'id',
                type: 'uuid',
                isPrimary: true,
                generationStrategy: 'uuid',
                default: 'uuid_generate_v4()',
            }),
            new TableColumn({
                name: 'company_id',
                type: 'uuid',
                isNullable: false,
            }),
            new TableColumn({
                name: 'subscription_id',
                type: 'uuid',
                isNullable: false,
            }),
            new TableColumn({
                name: 'event_type',
                type: 'varchar',
                length: '100',
                isNullable: false,
            }),
            new TableColumn({
                name: 'payload',
                type: 'jsonb',
                isNullable: false,
            }),
            new TableColumn({
                name: 'status',
                type: 'varchar',
                length: '50',
                isNullable: false,
            }),
            new TableColumn({
                name: 'http_status',
                type: 'integer',
                isNullable: true,
            }),
            new TableColumn({
                name: 'response_body',
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: 'error_message',
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: 'retry_count',
                type: 'integer',
                default: 0,
            }),
            new TableColumn({
                name: 'next_retry_at',
                type: 'timestamptz',
                isNullable: true,
            }),
            new TableColumn({
                name: 'created_at',
                type: 'timestamptz',
                default: 'CURRENT_TIMESTAMP',
            }),
        ];

        const indices: TableIndex[] = [
            new TableIndex({
                name: 'IDX_webhook_logs_company_subscription_created',
                columnNames: ['company_id', 'subscription_id', 'created_at'],
            }),
            new TableIndex({
                name: 'IDX_webhook_logs_status',
                columnNames: ['status'],
            }),
            new TableIndex({
                name: 'IDX_webhook_logs_next_retry',
                columnNames: ['next_retry_at'],
            }),
        ];

        const foreignKeys: TableForeignKey[] = [
            new TableForeignKey({
                name: 'FK_webhook_logs_company',
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
            new TableForeignKey({
                name: 'FK_webhook_logs_subscription',
                columnNames: ['subscription_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'webhook_subscriptions',
                onDelete: 'CASCADE',
            }),
        ];

        let table = await queryRunner.getTable(tableName);

        if (!table) {
            await queryRunner.createTable(
                new Table({
                    name: tableName,
                    columns,
                }),
                true,
            );

            table = await queryRunner.getTable(tableName);
        }

        for (const column of columns) {
            if (!table?.findColumnByName(column.name)) {
                await queryRunner.addColumn(tableName, column);
            }
        }

        table = await queryRunner.getTable(tableName);

        for (const index of indices) {
            const hasIndex = table?.indices.some((existing) => existing.name === index.name);
            if (!hasIndex) {
                await queryRunner.createIndex(tableName, index);
            }
        }

        for (const fk of foreignKeys) {
            const hasFk = table?.foreignKeys.some(
                (existing) => existing.name === fk.name || existing.columnNames.join(',') === fk.columnNames.join(','),
            );

            if (!hasFk) {
                await queryRunner.createForeignKey(tableName, fk);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('webhook_logs', true);
    }
}
