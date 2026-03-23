import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class MigrateClientsSourcesLocations1736243400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create clients table
        await queryRunner.createTable(
            new Table({
                name: 'clients',
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
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'code',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'contact_person',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'phone',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'address',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'city',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'state',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'country',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'postal_code',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'website',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'industry',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        default: "'Active'",
                        comment: 'Active, Inactive, Suspended',
                    },
                    {
                        name: 'payment_terms',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'tax_id',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
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
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Add FK for clients.company_id
        await queryRunner.createForeignKey(
            'clients',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Add FK for clients.created_by
        await queryRunner.createForeignKey(
            'clients',
            new TableForeignKey({
                columnNames: ['created_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Add FK for clients.updated_by
        await queryRunner.createForeignKey(
            'clients',
            new TableForeignKey({
                columnNames: ['updated_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Add indexes for clients
        await queryRunner.createIndex(
            'clients',
            new TableIndex({
                name: 'IDX_clients_company_id',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'clients',
            new TableIndex({
                name: 'IDX_clients_company_id_status',
                columnNames: ['company_id', 'status'],
            }),
        );

        await queryRunner.createIndex(
            'clients',
            new TableIndex({
                name: 'IDX_clients_company_id_name',
                columnNames: ['company_id', 'name'],
            }),
        );

        await queryRunner.createIndex(
            'clients',
            new TableIndex({
                name: 'IDX_clients_company_id_deleted_at',
                columnNames: ['company_id', 'deleted_at'],
            }),
        );

        // 2. Create sources table (candidate sources)
        await queryRunner.createTable(
            new Table({
                name: 'sources',
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
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                        comment: 'Indeed, LinkedIn, Referral, Job Board, etc.',
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        comment: 'job_board, referral, social_media, career_site, agency',
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'cost_per_hire',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'effectiveness_rating',
                        type: 'integer',
                        isNullable: true,
                        comment: '1-5 rating',
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
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
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Add FK for sources.company_id
        await queryRunner.createForeignKey(
            'sources',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Add FK for sources.created_by
        await queryRunner.createForeignKey(
            'sources',
            new TableForeignKey({
                columnNames: ['created_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Add FK for sources.updated_by
        await queryRunner.createForeignKey(
            'sources',
            new TableForeignKey({
                columnNames: ['updated_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Add indexes for sources
        await queryRunner.createIndex(
            'sources',
            new TableIndex({
                name: 'IDX_sources_company_id',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'sources',
            new TableIndex({
                name: 'IDX_sources_company_id_is_active',
                columnNames: ['company_id', 'is_active'],
            }),
        );

        await queryRunner.createIndex(
            'sources',
            new TableIndex({
                name: 'IDX_sources_company_id_type',
                columnNames: ['company_id', 'type'],
            }),
        );

        // 3. Create locations table
        await queryRunner.createTable(
            new Table({
                name: 'locations',
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
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'code',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'address',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'city',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'state',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'country',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'postal_code',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'timezone',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'latitude',
                        type: 'decimal',
                        precision: 10,
                        scale: 8,
                        isNullable: true,
                    },
                    {
                        name: 'longitude',
                        type: 'decimal',
                        precision: 11,
                        scale: 8,
                        isNullable: true,
                    },
                    {
                        name: 'is_headquarters',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
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
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Add FK for locations.company_id
        await queryRunner.createForeignKey(
            'locations',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Add FK for locations.created_by
        await queryRunner.createForeignKey(
            'locations',
            new TableForeignKey({
                columnNames: ['created_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Add FK for locations.updated_by
        await queryRunner.createForeignKey(
            'locations',
            new TableForeignKey({
                columnNames: ['updated_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Add indexes for locations
        await queryRunner.createIndex(
            'locations',
            new TableIndex({
                name: 'IDX_locations_company_id',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'locations',
            new TableIndex({
                name: 'IDX_locations_company_id_is_active',
                columnNames: ['company_id', 'is_active'],
            }),
        );

        await queryRunner.createIndex(
            'locations',
            new TableIndex({
                name: 'IDX_locations_company_id_city',
                columnNames: ['company_id', 'city'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.dropTable('locations', true);
        await queryRunner.dropTable('sources', true);
        await queryRunner.dropTable('clients', true);
    }
}
