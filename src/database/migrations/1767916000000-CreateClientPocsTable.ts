import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateClientPocsTable1767916000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Idempotency: if table already exists in this DB, don't try to recreate it.
        const existing = await queryRunner.getTable('client_pocs');
        if (existing) {
            return;
        }

        await queryRunner.createTable(
            new Table({
                name: 'client_pocs',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    { name: 'company_id', type: 'uuid', isNullable: false },
                    { name: 'client_id', type: 'uuid', isNullable: false },
                    { name: 'name', type: 'varchar', length: '255', isNullable: false },
                    { name: 'designation', type: 'varchar', length: '255', isNullable: true },
                    { name: 'email', type: 'varchar', length: '255', isNullable: true },
                    { name: 'phone', type: 'varchar', length: '50', isNullable: true },
                    { name: 'linkedin', type: 'varchar', length: '500', isNullable: true },
                    { name: 'notes', type: 'text', isNullable: true },
                    { name: 'status', type: 'varchar', length: '50', default: "'Active'" },
                    { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'client_pocs',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'client_pocs',
            new TableForeignKey({
                columnNames: ['client_id'],
                referencedTableName: 'clients',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'client_pocs',
            new TableIndex({ name: 'idx_client_pocs_company_id', columnNames: ['company_id'] }),
        );
        await queryRunner.createIndex(
            'client_pocs',
            new TableIndex({ name: 'idx_client_pocs_client_id', columnNames: ['client_id'] }),
        );
        await queryRunner.createIndex(
            'client_pocs',
            new TableIndex({ name: 'idx_client_pocs_company_client', columnNames: ['company_id', 'client_id'] }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('client_pocs');
        if (!table) {
            return;
        }
        if (table?.foreignKeys) {
            for (const fk of table.foreignKeys) {
                await queryRunner.dropForeignKey('client_pocs', fk);
            }
        }
        await queryRunner.dropTable('client_pocs', true);
    }
}
