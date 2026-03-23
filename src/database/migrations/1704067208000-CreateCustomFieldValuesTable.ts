import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCustomFieldValuesTable1704067208000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'custom_field_values',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'custom_field_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'entity_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'entity_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'value_text',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'value_number',
                        type: 'numeric',
                        precision: 18,
                        scale: 4,
                        isNullable: true,
                    },
                    {
                        name: 'value_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'value_datetime',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'value_boolean',
                        type: 'boolean',
                        isNullable: true,
                    },
                    {
                        name: 'value_json',
                        type: 'jsonb',
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

        // Create foreign keys
        await queryRunner.createForeignKey(
            'custom_field_values',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'custom_field_values',
            new TableForeignKey({
                columnNames: ['custom_field_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'custom_fields',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        // Create indexes
        await queryRunner.createIndex(
            'custom_field_values',
            new TableIndex({
                name: 'IDX_custom_field_values_company_entity',
                columnNames: ['company_id', 'entity_type', 'entity_id'],
            }),
        );

        // Create unique constraint
        await queryRunner.createIndex(
            'custom_field_values',
            new TableIndex({
                name: 'UQ_custom_field_values_company_field_entity',
                columnNames: ['company_id', 'custom_field_id', 'entity_type', 'entity_id'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('custom_field_values', true);
    }
}
