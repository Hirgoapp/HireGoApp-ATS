import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateIntegrationAccountsTable1769000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'integration_accounts',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    { name: 'company_id', type: 'uuid', isNullable: false },
                    { name: 'provider', type: 'varchar', length: '30', isNullable: false },
                    { name: 'email', type: 'varchar', length: '320', isNullable: false },
                    { name: 'is_verified', type: 'boolean', default: false, isNullable: false },
                    { name: 'is_active', type: 'boolean', default: true, isNullable: false },
                    { name: 'config', type: 'jsonb', default: "'{}'", isNullable: false },
                    { name: 'created_at', type: 'timestamptz', default: 'NOW()', isNullable: false },
                    { name: 'updated_at', type: 'timestamptz', default: 'NOW()', isNullable: false },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'integration_accounts',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'integration_accounts',
            new TableIndex({
                name: 'idx_integration_accounts_company_provider_email',
                columnNames: ['company_id', 'provider', 'email'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('integration_accounts', true);
    }
}

