import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableColumn } from 'typeorm';

export class CreateWebhookSubscriptionsTable1736255000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const existingTable = await queryRunner.getTable('webhook_subscriptions');

        if (!existingTable) {
            await queryRunner.createTable(
                new Table({
                    name: 'webhook_subscriptions',
                    columns: [
                        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                        { name: 'company_id', type: 'uuid', isNullable: false },
                        { name: 'event_type', type: 'varchar', length: '100', isNullable: false },
                        { name: 'target_url', type: 'varchar', length: '500', isNullable: false },
                        { name: 'secret', type: 'varchar', length: '255', isNullable: false },
                        { name: 'is_active', type: 'boolean', default: true },
                        { name: 'description', type: 'text', isNullable: true },
                        { name: 'retry_config', type: 'jsonb', isNullable: true, default: "'{\"max_retries\": 3, \"retry_delay\": 60}'" },
                        { name: 'headers', type: 'jsonb', isNullable: true, default: "'{}'" },
                        { name: 'created_at', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
                        { name: 'updated_at', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
                        { name: 'deleted_at', type: 'timestamptz', isNullable: true },
                    ],
                }),
                true,
            );
        } else {
            const ensureColumn = async (name: string, column: TableColumn) => {
                if (!existingTable.findColumnByName(name)) {
                    await queryRunner.addColumn('webhook_subscriptions', column);
                }
            };

            await ensureColumn('company_id', new TableColumn({ name: 'company_id', type: 'uuid', isNullable: true }));
            await ensureColumn('event_type', new TableColumn({ name: 'event_type', type: 'varchar', length: '100', isNullable: true }));
            await ensureColumn('target_url', new TableColumn({ name: 'target_url', type: 'varchar', length: '500', isNullable: true }));
            await ensureColumn('secret', new TableColumn({ name: 'secret', type: 'varchar', length: '255', isNullable: true }));
            await ensureColumn('is_active', new TableColumn({ name: 'is_active', type: 'boolean', isNullable: true, default: true }));
            await ensureColumn('description', new TableColumn({ name: 'description', type: 'text', isNullable: true }));
            await ensureColumn('retry_config', new TableColumn({ name: 'retry_config', type: 'jsonb', isNullable: true, default: "'{\"max_retries\": 3, \"retry_delay\": 60}'" }));
            await ensureColumn('headers', new TableColumn({ name: 'headers', type: 'jsonb', isNullable: true, default: "'{}'" }));
            await ensureColumn('created_at', new TableColumn({ name: 'created_at', type: 'timestamptz', isNullable: true, default: 'CURRENT_TIMESTAMP' }));
            await ensureColumn('updated_at', new TableColumn({ name: 'updated_at', type: 'timestamptz', isNullable: true, default: 'CURRENT_TIMESTAMP' }));
            await ensureColumn('deleted_at', new TableColumn({ name: 'deleted_at', type: 'timestamptz', isNullable: true }));
        }

        const currentTable = await queryRunner.getTable('webhook_subscriptions');
        if (!currentTable) {
            return;
        }

        if (!currentTable.indices.some((idx) => idx.name === 'IDX_webhook_subscriptions_company_event')) {
            await queryRunner.createIndex(
                'webhook_subscriptions',
                new TableIndex({ name: 'IDX_webhook_subscriptions_company_event', columnNames: ['company_id', 'event_type'] }),
            );
        }

        if (!currentTable.indices.some((idx) => idx.name === 'IDX_webhook_subscriptions_company_active')) {
            await queryRunner.createIndex(
                'webhook_subscriptions',
                new TableIndex({ name: 'IDX_webhook_subscriptions_company_active', columnNames: ['company_id', 'is_active'] }),
            );
        }

        const hasCompanyFk = currentTable.foreignKeys.some((fk) => fk.columnNames.includes('company_id'));
        if (!hasCompanyFk) {
            await queryRunner.createForeignKey(
                'webhook_subscriptions',
                new TableForeignKey({
                    columnNames: ['company_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'companies',
                    onDelete: 'CASCADE',
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('webhook_subscriptions', true);
    }
}
