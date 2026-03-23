import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInterviewsTable1701000002000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create interviews table
        await queryRunner.createTable(
            new Table({
                name: 'interviews',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
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
                        name: 'round',
                        type: 'enum',
                        enum: ['screening', 'first', 'second', 'third', 'final', 'hr', 'technical'],
                        default: "'first'",
                    },
                    {
                        name: 'scheduled_date',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'scheduled_time',
                        type: 'time',
                        isNullable: false,
                    },
                    {
                        name: 'interviewer_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'mode',
                        type: 'enum',
                        enum: ['online', 'offline', 'phone'],
                        default: "'online'",
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
                        default: "'scheduled'",
                    },
                    {
                        name: 'feedback',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'score',
                        type: 'decimal',
                        precision: 3,
                        scale: 1,
                        isNullable: true,
                    },
                    {
                        name: 'remarks',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'location',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'meeting_link',
                        type: 'text',
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
        );

        // Create indices on interviews table
        await queryRunner.createIndex(
            'interviews',
            new TableIndex({
                name: 'IDX_interviews_company_id',
                columnNames: ['company_id'],
            }),
        );

        await queryRunner.createIndex(
            'interviews',
            new TableIndex({
                name: 'IDX_interviews_company_submission',
                columnNames: ['company_id', 'submission_id'],
            }),
        );

        await queryRunner.createIndex(
            'interviews',
            new TableIndex({
                name: 'IDX_interviews_company_interviewer',
                columnNames: ['company_id', 'interviewer_id'],
            }),
        );

        await queryRunner.createIndex(
            'interviews',
            new TableIndex({
                name: 'IDX_interviews_company_scheduled_date',
                columnNames: ['company_id', 'scheduled_date'],
            }),
        );

        await queryRunner.createIndex(
            'interviews',
            new TableIndex({
                name: 'IDX_interviews_company_status',
                columnNames: ['company_id', 'status'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indices
        await queryRunner.dropIndex('interviews', 'IDX_interviews_company_status');
        await queryRunner.dropIndex('interviews', 'IDX_interviews_company_scheduled_date');
        await queryRunner.dropIndex('interviews', 'IDX_interviews_company_interviewer');
        await queryRunner.dropIndex('interviews', 'IDX_interviews_company_submission');
        await queryRunner.dropIndex('interviews', 'IDX_interviews_company_id');

        // Drop table
        await queryRunner.dropTable('interviews');
    }
}
