import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOffersTable1701000003000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'offers',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isNullable: false,
                    },
                    {
                        name: 'company_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'submission_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'current_version',
                        type: 'integer',
                        default: 1,
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['draft', 'sent', 'accepted', 'rejected', 'withdrawn', 'expired'],
                        default: "'draft'",
                        isNullable: false,
                    },
                    {
                        name: 'ctc',
                        type: 'decimal',
                        precision: 12,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'breakup',
                        type: 'jsonb',
                        isNullable: false,
                    },
                    {
                        name: 'designation',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'joining_date',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'department',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'reporting_manager',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'location',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'terms_and_conditions',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'rejection_reason',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'internal_notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'sent_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'accepted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'closed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'created_by_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'updated_by_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                        isNullable: false,
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

        // Create indices
        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'IDX_offers_company_id',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'IDX_offers_company_submission',
                columnNames: ['company_id', 'submission_id'],
            }),
        );

        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'IDX_offers_company_status',
                columnNames: ['company_id', 'status'],
            }),
        );

        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'IDX_offers_company_version',
                columnNames: ['company_id', 'current_version'],
            }),
        );

        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'IDX_offers_company_created',
                columnNames: ['company_id', 'created_at'],
            }),
        );

        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'IDX_offers_deleted_at',
                columnNames: ['deleted_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('offers', 'IDX_offers_deleted_at');
        await queryRunner.dropIndex('offers', 'IDX_offers_company_created');
        await queryRunner.dropIndex('offers', 'IDX_offers_company_version');
        await queryRunner.dropIndex('offers', 'IDX_offers_company_status');
        await queryRunner.dropIndex('offers', 'IDX_offers_company_submission');
        await queryRunner.dropIndex('offers', 'IDX_offers_company_id');
        await queryRunner.dropTable('offers');
    }
}
