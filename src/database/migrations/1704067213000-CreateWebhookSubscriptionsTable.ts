import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateWebhookSubscriptionsTable1704067213000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'webhook_subscriptions',
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
                        name: 'event_type',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                    },
                    {
                        name: 'webhook_url',
                        type: 'varchar',
                        length: '500',
                        isNullable: false,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                        isNullable: false,
                    },
                    {
                        name: 'retry_policy',
                        type: 'jsonb',
                        default: `'{"max_retries": 3, "backoff_seconds": 60}'`,
                        isNullable: false,
                    },
                    {
                        name: 'headers',
                        type: 'jsonb',
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'created_by_id',
                        type: 'uuid',
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
            'webhook_subscriptions',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'webhook_subscriptions',
            new TableForeignKey({
                columnNames: ['created_by_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'webhook_subscriptions',
            new TableIndex({
                name: 'IDX_webhook_subscriptions_company_event',
                columnNames: ['company_id', 'event_type'],
            }),
        );

        await queryRunner.createIndex(
            'webhook_subscriptions',
            new TableIndex({
                name: 'IDX_webhook_subscriptions_company_active',
                columnNames: ['company_id', 'is_active'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('webhook_subscriptions', true);
    }
}
