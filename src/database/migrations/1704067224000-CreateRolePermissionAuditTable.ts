import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRolePermissionAuditTable1704067224000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'role_permission_audit',
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
                        isNullable: true,
                    },
                    {
                        name: 'action',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'role_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'permission_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'old_values',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'new_values',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'reason',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['company_id'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'companies',
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['role_id'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'roles',
                        onDelete: 'SET NULL',
                    },
                    {
                        columnNames: ['permission_id'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'permissions',
                        onDelete: 'SET NULL',
                    },
                ],
                indices: [
                    new TableIndex({
                        columnNames: ['company_id', 'created_at'],
                    }),
                    new TableIndex({
                        columnNames: ['user_id', 'created_at'],
                    }),
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('role_permission_audit');
    }
}
