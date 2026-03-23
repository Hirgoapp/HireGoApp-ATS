import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCompaniesTable1704067200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'companies',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'slug',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'logo_url',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'brand_color',
                        type: 'varchar',
                        length: '7',
                        isNullable: true,
                    },
                    {
                        name: 'license_tier',
                        type: 'varchar',
                        length: '50',
                        default: "'basic'",
                        isNullable: false,
                    },
                    {
                        name: 'feature_flags',
                        type: 'jsonb',
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'settings',
                        type: 'jsonb',
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'NOW()',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'NOW()',
                        isNullable: false,
                        onUpdate: 'NOW()',
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

        // Create indexes
        await queryRunner.createIndex(
            'companies',
            new TableIndex({
                name: 'IDX_companies_slug',
                columnNames: ['slug'],
            }),
        );

        await queryRunner.createIndex(
            'companies',
            new TableIndex({
                name: 'IDX_companies_is_active',
                columnNames: ['is_active'],
            }),
        );

        await queryRunner.createIndex(
            'companies',
            new TableIndex({
                name: 'IDX_companies_license_tier',
                columnNames: ['license_tier'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('companies', true);
    }
}
