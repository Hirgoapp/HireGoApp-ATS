import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateWebhookLogsTable1704067214000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'webhook_logs',
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
                        name: 'subscription_id',
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
                        name: 'payload',
                        type: 'jsonb',
                        isNullable: false,
                    },
                    {
                        name: 'status_code',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'is_successful',
                        type: 'boolean',
                        isNullable: true,
                    },
                    {
                        name: 'error_message',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'attempt_number',
                        type: 'int',
                        default: 1,
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'NOW()',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Create foreign keys
        await queryRunner.createForeignKey(
            'webhook_logs',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'webhook_logs',
            new TableForeignKey({
                columnNames: ['subscription_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'webhook_subscriptions',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'webhook_logs',
            new TableIndex({
                name: 'IDX_webhook_logs_company_subscription_created_desc',
                columnNames: ['company_id', 'subscription_id', 'created_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('webhook_logs', true);
    }
}
