import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableColumn } from 'typeorm';

export class CreateNotificationsTable1736253000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const existingTable = await queryRunner.getTable('notifications');

        if (!existingTable) {
            await queryRunner.createTable(
                new Table({
                    name: 'notifications',
                    columns: [
                        {
                            name: 'id',
                            type: 'uuid',
                            isPrimary: true,
                            generationStrategy: 'uuid',
                            default: 'uuid_generate_v4()',
                        },
                        {
                            name: 'company_id',
                            type: 'uuid',
                            isNullable: false,
                        },
                        {
                            name: 'user_id',
                            type: 'uuid',
                            isNullable: false,
                        },
                        {
                            name: 'type',
                            type: 'varchar',
                            length: '100',
                            isNullable: false,
                        },
                        {
                            name: 'title',
                            type: 'varchar',
                            length: '255',
                            isNullable: false,
                        },
                        {
                            name: 'message',
                            type: 'text',
                            isNullable: false,
                        },
                        {
                            name: 'link',
                            type: 'varchar',
                            length: '500',
                            isNullable: true,
                        },
                        {
                            name: 'entity_type',
                            type: 'varchar',
                            length: '100',
                            isNullable: true,
                        },
                        {
                            name: 'entity_id',
                            type: 'uuid',
                            isNullable: true,
                        },
                        {
                            name: 'is_read',
                            type: 'boolean',
                            default: false,
                        },
                        {
                            name: 'read_at',
                            type: 'timestamptz',
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
                            type: 'timestamptz',
                            default: 'CURRENT_TIMESTAMP',
                        },
                        {
                            name: 'updated_at',
                            type: 'timestamptz',
                            default: 'CURRENT_TIMESTAMP',
                        },
                    ],
                }),
                true,
            );
        } else {
            const ensureColumn = async (name: string, column: TableColumn) => {
                if (!existingTable.findColumnByName(name)) {
                    await queryRunner.addColumn('notifications', column);
                }
            };

            await ensureColumn('company_id', new TableColumn({ name: 'company_id', type: 'uuid', isNullable: true }));
            await ensureColumn('user_id', new TableColumn({ name: 'user_id', type: 'uuid', isNullable: true }));
            await ensureColumn('type', new TableColumn({ name: 'type', type: 'varchar', length: '100', isNullable: true }));
            await ensureColumn('title', new TableColumn({ name: 'title', type: 'varchar', length: '255', isNullable: true }));
            await ensureColumn('message', new TableColumn({ name: 'message', type: 'text', isNullable: true }));
            await ensureColumn('link', new TableColumn({ name: 'link', type: 'varchar', length: '500', isNullable: true }));
            await ensureColumn('entity_type', new TableColumn({ name: 'entity_type', type: 'varchar', length: '100', isNullable: true }));
            await ensureColumn('entity_id', new TableColumn({ name: 'entity_id', type: 'uuid', isNullable: true }));
            await ensureColumn('is_read', new TableColumn({ name: 'is_read', type: 'boolean', isNullable: true, default: false }));
            await ensureColumn('read_at', new TableColumn({ name: 'read_at', type: 'timestamptz', isNullable: true }));
            await ensureColumn('metadata', new TableColumn({ name: 'metadata', type: 'jsonb', isNullable: true, default: "'{}'" }));
            await ensureColumn('created_at', new TableColumn({ name: 'created_at', type: 'timestamptz', isNullable: true, default: 'CURRENT_TIMESTAMP' }));
            await ensureColumn('updated_at', new TableColumn({ name: 'updated_at', type: 'timestamptz', isNullable: true, default: 'CURRENT_TIMESTAMP' }));
        }

        const currentTable = await queryRunner.getTable('notifications');
        if (!currentTable) {
            return;
        }

        // Indexes for fast queries
        if (!currentTable.indices.some((idx) => idx.name === 'IDX_notifications_company_user_created')) {
            await queryRunner.createIndex(
                'notifications',
                new TableIndex({
                    name: 'IDX_notifications_company_user_created',
                    columnNames: ['company_id', 'user_id', 'created_at'],
                }),
            );
        }

        if (!currentTable.indices.some((idx) => idx.name === 'IDX_notifications_user_is_read')) {
            await queryRunner.createIndex(
                'notifications',
                new TableIndex({
                    name: 'IDX_notifications_user_is_read',
                    columnNames: ['user_id', 'is_read'],
                }),
            );
        }

        if (!currentTable.indices.some((idx) => idx.name === 'IDX_notifications_entity')) {
            await queryRunner.createIndex(
                'notifications',
                new TableIndex({
                    name: 'IDX_notifications_entity',
                    columnNames: ['entity_type', 'entity_id'],
                }),
            );
        }

        if (!currentTable.indices.some((idx) => idx.name === 'IDX_notifications_type')) {
            await queryRunner.createIndex(
                'notifications',
                new TableIndex({
                    name: 'IDX_notifications_type',
                    columnNames: ['type'],
                }),
            );
        }

        // Foreign keys
        const hasCompanyFk = currentTable.foreignKeys.some((fk) => fk.columnNames.includes('company_id'));
        if (!hasCompanyFk) {
            await queryRunner.createForeignKey(
                'notifications',
                new TableForeignKey({
                    columnNames: ['company_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'companies',
                    onDelete: 'CASCADE',
                }),
            );
        }

        const hasUserFk = currentTable.foreignKeys.some((fk) => fk.columnNames.includes('user_id'));
        if (!hasUserFk) {
            await queryRunner.createForeignKey(
                'notifications',
                new TableForeignKey({
                    columnNames: ['user_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'users',
                    onDelete: 'CASCADE',
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('notifications', true);
    }
}
