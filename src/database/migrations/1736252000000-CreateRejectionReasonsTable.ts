import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRejectionReasonsTable1736252000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'rejection_reasons',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'application_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'reason_type',
                        type: 'enum',
                        enum: [
                            'skills_mismatch',
                            'experience_insufficient',
                            'culture_fit',
                            'overqualified',
                            'other',
                            'no_show',
                            'candidate_declined',
                        ],
                        default: "'other'",
                    },
                    {
                        name: 'reason_details',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'rejected_by',
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
                        onUpdate: 'CURRENT_TIMESTAMP',
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

        await queryRunner.createForeignKey(
            'rejection_reasons',
            new TableForeignKey({
                columnNames: ['application_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'applications',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'rejection_reasons',
            new TableIndex({
                columnNames: ['application_id'],
            }),
        );

        await queryRunner.createIndex(
            'rejection_reasons',
            new TableIndex({
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'rejection_reasons',
            new TableIndex({
                columnNames: ['created_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('rejection_reasons');
    }
}
