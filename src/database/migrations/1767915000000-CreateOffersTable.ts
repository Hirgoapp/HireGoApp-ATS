import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOffersTable1767915000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Idempotency: if table already exists in this DB, don't try to recreate it.
        const existing = await queryRunner.getTable('offers');
        if (existing) {
            return;
        }

        await queryRunner.createTable(
            new Table({
                name: 'offers',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isNullable: false,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
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
                        name: 'candidate_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'job_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'offer_number',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'offered_ctc',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'currency_code',
                        type: 'varchar',
                        length: '10',
                        isNullable: true,
                    },
                    {
                        name: 'joining_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'offer_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                        default: `'OfferReleased'`,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_by',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'updated_by',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        isNullable: false,
                        default: 'NOW()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamptz',
                        isNullable: false,
                        default: 'NOW()',
                    },
                    {
                        name: 'deleted_at',
                        type: 'timestamptz',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'idx_offers_company_submission',
                columnNames: ['company_id', 'submission_id'],
            }),
        );

        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'idx_offers_company_candidate',
                columnNames: ['company_id', 'candidate_id'],
            }),
        );

        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'idx_offers_company_job',
                columnNames: ['company_id', 'job_id'],
            }),
        );

        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'idx_offers_company_status',
                columnNames: ['company_id', 'status'],
            }),
        );

        await queryRunner.createIndex(
            'offers',
            new TableIndex({
                name: 'idx_offers_company_offer_date',
                columnNames: ['company_id', 'offer_date'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('offers', true);
    }
}

