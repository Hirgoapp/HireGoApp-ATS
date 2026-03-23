import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSuperAdminUsersTable1704211200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'super_admin_users',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'first_name',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'last_name',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                    },
                    {
                        name: 'phone',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'password_hash',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'role',
                        type: 'varchar',
                        length: '50',
                        default: "'super_admin'",
                    },
                    {
                        name: 'permissions',
                        type: 'jsonb',
                        default: "'{}'",
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'email_verified',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'last_login_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'preferences',
                        type: 'jsonb',
                        default: "'{}'",
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'NOW()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'NOW()',
                    },
                    {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true
        );

        // Create indexes
        await queryRunner.createIndex(
            'super_admin_users',
            new TableIndex({
                name: 'idx_super_admin_users_email',
                columnNames: ['email'],
            })
        );

        await queryRunner.createIndex(
            'super_admin_users',
            new TableIndex({
                name: 'idx_super_admin_users_is_active',
                columnNames: ['is_active'],
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('super_admin_users');
    }
}
