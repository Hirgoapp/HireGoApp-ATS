import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateFeatureFlagsTable1704067217000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'feature_flags',
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
                        length: '100',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'flag_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        default: "'draft'",
                        isNullable: false,
                    },
                    {
                        name: 'is_enabled_globally',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'enabled_percentage',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'target_tiers',
                        type: 'text',
                        isArray: true,
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'excluded_companies',
                        type: 'uuid',
                        isArray: true,
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'included_companies',
                        type: 'uuid',
                        isArray: true,
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'config',
                        type: 'jsonb',
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'scheduled_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'scheduled_end_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'created_by_id',
                        type: 'uuid',
                        isNullable: true,
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
            'feature_flags',
            new TableForeignKey({
                columnNames: ['created_by_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'feature_flags',
            new TableIndex({
                name: 'IDX_feature_flags_status_enabled',
                columnNames: ['status', 'is_enabled_globally'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('feature_flags', true);
    }
}
