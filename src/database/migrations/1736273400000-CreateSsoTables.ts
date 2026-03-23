import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateSsoTables1736273400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create sso_configurations table
        await queryRunner.createTable(
            new Table({
                name: 'sso_configurations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'provider',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'configuration',
                        type: 'jsonb',
                        isNullable: false,
                    },
                    {
                        name: 'attribute_mapping',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'role_mapping',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'enable_jit_provisioning',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'domain',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'metadata_xml',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'created_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'updated_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Create indexes
        await queryRunner.createIndex(
            'sso_configurations',
            new TableIndex({
                name: 'IDX_sso_configurations_company_id',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'sso_configurations',
            new TableIndex({
                name: 'IDX_sso_configurations_company_provider',
                columnNames: ['company_id', 'provider'],
            }),
        );

        // Create foreign key
        await queryRunner.createForeignKey(
            'sso_configurations',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Create sso_sessions table
        await queryRunner.createTable(
            new Table({
                name: 'sso_sessions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'sso_configuration_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'session_token',
                        type: 'varchar',
                        length: '500',
                        isUnique: true,
                    },
                    {
                        name: 'sso_user_info',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'ip_address',
                        type: 'varchar',
                        length: '45',
                        isNullable: true,
                    },
                    {
                        name: 'user_agent',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create indexes
        await queryRunner.createIndex(
            'sso_sessions',
            new TableIndex({
                name: 'IDX_sso_sessions_user_id',
                columnNames: ['user_id'],
            }),
        );

        await queryRunner.createIndex(
            'sso_sessions',
            new TableIndex({
                name: 'IDX_sso_sessions_user_active',
                columnNames: ['user_id', 'is_active'],
            }),
        );

        await queryRunner.createIndex(
            'sso_sessions',
            new TableIndex({
                name: 'IDX_sso_sessions_token',
                columnNames: ['session_token'],
            }),
        );

        // Create foreign keys
        await queryRunner.createForeignKey(
            'sso_sessions',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'sso_sessions',
            new TableForeignKey({
                columnNames: ['sso_configuration_id'],
                referencedTableName: 'sso_configurations',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Create mfa_secrets table
        await queryRunner.createTable(
            new Table({
                name: 'mfa_secrets',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'secret',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'is_enabled',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'is_verified',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'backup_codes',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'used_backup_codes_count',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'last_used_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'verified_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Create index
        await queryRunner.createIndex(
            'mfa_secrets',
            new TableIndex({
                name: 'IDX_mfa_secrets_user_id',
                columnNames: ['user_id'],
            }),
        );

        // Create foreign key
        await queryRunner.createForeignKey(
            'mfa_secrets',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('mfa_secrets');
        await queryRunner.dropTable('sso_sessions');
        await queryRunner.dropTable('sso_configurations');
    }
}
