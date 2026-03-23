import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSuperAdminInvitesTable1769100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'super_admin_invites',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    { name: 'email', type: 'varchar', length: '320', isNullable: false },
                    { name: 'company_id', type: 'uuid', isNullable: true },
                    { name: 'company_name', type: 'varchar', length: '255', isNullable: true },
                    { name: 'role', type: 'varchar', length: '64', isNullable: false },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '24',
                        default: "'pending'",
                        isNullable: false,
                    },
                    { name: 'token_hash', type: 'varchar', length: '64', isNullable: false, isUnique: true },
                    { name: 'expires_at', type: 'timestamptz', isNullable: false },
                    { name: 'invited_by_id', type: 'uuid', isNullable: true },
                    { name: 'accepted_at', type: 'timestamptz', isNullable: true },
                    { name: 'revoked_at', type: 'timestamptz', isNullable: true },
                    { name: 'last_sent_at', type: 'timestamptz', isNullable: true },
                    { name: 'resent_count', type: 'int', default: 0, isNullable: false },
                    { name: 'personal_message', type: 'text', isNullable: true },
                    { name: 'metadata', type: 'jsonb', default: "'{}'", isNullable: false },
                    { name: 'created_at', type: 'timestamptz', default: 'NOW()', isNullable: false },
                    { name: 'updated_at', type: 'timestamptz', default: 'NOW()', isNullable: false },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'super_admin_invites',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'super_admin_invites',
            new TableForeignKey({
                columnNames: ['invited_by_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'super_admin_users',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createIndex(
            'super_admin_invites',
            new TableIndex({
                name: 'idx_super_admin_invites_status_expires',
                columnNames: ['status', 'expires_at'],
            }),
        );

        await queryRunner.createIndex(
            'super_admin_invites',
            new TableIndex({
                name: 'idx_super_admin_invites_email',
                columnNames: ['email'],
            }),
        );

        await queryRunner.createIndex(
            'super_admin_invites',
            new TableIndex({
                name: 'idx_super_admin_invites_company_id',
                columnNames: ['company_id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('super_admin_invites', true);
    }
}
