import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateLicenseFeaturesTable1704067216000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'license_features',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'license_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'feature_name',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                    },
                    {
                        name: 'is_enabled',
                        type: 'boolean',
                        default: true,
                        isNullable: false,
                    },
                    {
                        name: 'usage_limit',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'current_usage',
                        type: 'int',
                        default: 0,
                        isNullable: false,
                    },
                    {
                        name: 'reset_date',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'custom_config',
                        type: 'jsonb',
                        default: "'{}'",
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
                ],
            }),
            true,
        );

        // Create foreign key
        await queryRunner.createForeignKey(
            'license_features',
            new TableForeignKey({
                columnNames: ['license_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'licenses',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'license_features',
            new TableIndex({
                name: 'IDX_license_features_license_id',
                columnNames: ['license_id'],
            }),
        );

        // Create unique constraint
        await queryRunner.createIndex(
            'license_features',
            new TableIndex({
                name: 'UQ_license_features_license_feature',
                columnNames: ['license_id', 'feature_name'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('license_features', true);
    }
}
