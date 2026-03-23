import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddClientPocToJobs1767909000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('jobs');
        if (!table) {
            return;
        }

        if (!table.findColumnByName('client_id')) {
            await queryRunner.addColumn(
                'jobs',
                new TableColumn({
                    name: 'client_id',
                    type: 'uuid',
                    isNullable: true,
                }),
            );
        }

        if (!table.findColumnByName('poc_id')) {
            await queryRunner.addColumn(
                'jobs',
                new TableColumn({
                    name: 'poc_id',
                    type: 'uuid',
                    isNullable: true,
                }),
            );
        }

        const existingClientIdx = table.indices.find((idx) =>
            idx.columnNames.length === 2 &&
            idx.columnNames.includes('company_id') &&
            idx.columnNames.includes('client_id'),
        );
        if (!existingClientIdx) {
            await queryRunner.createIndex(
                'jobs',
                new TableIndex({
                    name: 'idx_jobs_company_client',
                    columnNames: ['company_id', 'client_id'],
                }),
            );
        }

        const existingPocIdx = table.indices.find((idx) =>
            idx.columnNames.length === 2 &&
            idx.columnNames.includes('company_id') &&
            idx.columnNames.includes('poc_id'),
        );
        if (!existingPocIdx) {
            await queryRunner.createIndex(
                'jobs',
                new TableIndex({
                    name: 'idx_jobs_company_poc',
                    columnNames: ['company_id', 'poc_id'],
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('jobs');
        if (!table) {
            return;
        }

        const clientIdx = table.indices.find((idx) => idx.name === 'idx_jobs_company_client');
        if (clientIdx) {
            await queryRunner.dropIndex('jobs', clientIdx);
        }

        const pocIdx = table.indices.find((idx) => idx.name === 'idx_jobs_company_poc');
        if (pocIdx) {
            await queryRunner.dropIndex('jobs', pocIdx);
        }

        if (table.findColumnByName('client_id')) {
            await queryRunner.dropColumn('jobs', 'client_id');
        }

        if (table.findColumnByName('poc_id')) {
            await queryRunner.dropColumn('jobs', 'poc_id');
        }
    }
}

