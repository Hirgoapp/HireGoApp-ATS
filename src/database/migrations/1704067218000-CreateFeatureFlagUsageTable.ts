import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateFeatureFlagUsageTable1704067218000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'feature_flag_usage',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'feature_flag_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'enabled_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'last_accessed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'access_count',
                        type: 'int',
                        default: 0,
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'NOW()',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Create foreign keys
        await queryRunner.createForeignKey(
            'feature_flag_usage',
            new TableForeignKey({
                columnNames: ['feature_flag_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'feature_flags',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'feature_flag_usage',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'feature_flag_usage',
            new TableIndex({
                name: 'IDX_feature_flag_usage_company_flag',
                columnNames: ['company_id', 'feature_flag_id'],
            }),
        );

        // Create unique constraint
        await queryRunner.createIndex(
            'feature_flag_usage',
            new TableIndex({
                name: 'UQ_feature_flag_usage_flag_company',
                columnNames: ['feature_flag_id', 'company_id'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('feature_flag_usage', true);
    }
}
