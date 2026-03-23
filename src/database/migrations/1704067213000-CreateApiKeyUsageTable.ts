import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateApiKeyUsageTable1704067213000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'api_key_usage',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'gen_random_uuid()' },
                    { name: 'company_id', type: 'uuid', isNullable: false },
                    { name: 'api_key_id', type: 'uuid', isNullable: false },
                    { name: 'path', type: 'varchar', length: '500', isNullable: true },
                    { name: 'method', type: 'varchar', length: '10', isNullable: true },
                    { name: 'ip_address', type: 'inet', isNullable: true },
                    { name: 'user_agent', type: 'text', isNullable: true },
                    { name: 'status_code', type: 'integer', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'NOW()' },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'api_key_usage',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'api_key_usage',
            new TableForeignKey({
                columnNames: ['api_key_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'api_keys',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'api_key_usage',
            new TableIndex({ name: 'IDX_api_key_usage_company_created', columnNames: ['company_id', 'created_at'] }),
        );
        await queryRunner.createIndex(
            'api_key_usage',
            new TableIndex({ name: 'IDX_api_key_usage_key_created', columnNames: ['api_key_id', 'created_at'] }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('api_key_usage', true);
    }
}
