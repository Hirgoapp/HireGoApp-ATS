import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateUserRolesTable1767903000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'user_roles',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'role_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'assigned_at',
                        type: 'timestamptz',
                        default: 'NOW()',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Foreign keys
        await queryRunner.createForeignKey(
            'user_roles',
            new TableForeignKey({
                name: 'fk_user_roles_user',
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'user_roles',
            new TableForeignKey({
                name: 'fk_user_roles_role',
                columnNames: ['role_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'roles',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'user_roles',
            new TableForeignKey({
                name: 'fk_user_roles_company',
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        // Index
        await queryRunner.createIndex(
            'user_roles',
            new TableIndex({
                name: 'idx_user_roles_user_company',
                columnNames: ['user_id', 'company_id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('user_roles', true);
    }
}

