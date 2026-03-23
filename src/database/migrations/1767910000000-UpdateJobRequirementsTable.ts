import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class UpdateJobRequirementsTable1767910000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('job_requirements');
        if (!table) {
            return;
        }

        // poc_id
        if (!table.findColumnByName('poc_id')) {
            await queryRunner.addColumn(
                'job_requirements',
                new TableColumn({
                    name: 'poc_id',
                    type: 'uuid',
                    isNullable: true,
                }),
            );
        }

        // status
        if (!table.findColumnByName('status')) {
            await queryRunner.addColumn(
                'job_requirements',
                new TableColumn({
                    name: 'status',
                    type: 'varchar',
                    length: '50',
                    isNullable: false,
                    default: `'open'`,
                }),
            );
        }

        // deleted_at
        if (!table.findColumnByName('deleted_at')) {
            await queryRunner.addColumn(
                'job_requirements',
                new TableColumn({
                    name: 'deleted_at',
                    type: 'timestamptz',
                    isNullable: true,
                }),
            );
        }

        // Indexes
        const hasCompanyStatusIdx = table.indices.some(
            (idx) =>
                idx.columnNames.length === 2 &&
                idx.columnNames.includes('company_id') &&
                idx.columnNames.includes('status'),
        );
        if (!hasCompanyStatusIdx) {
            await queryRunner.createIndex(
                'job_requirements',
                new TableIndex({
                    name: 'idx_job_requirements_company_status',
                    columnNames: ['company_id', 'status'],
                }),
            );
        }

        const hasCompanyPocIdx = table.indices.some(
            (idx) =>
                idx.columnNames.length === 2 &&
                idx.columnNames.includes('company_id') &&
                idx.columnNames.includes('poc_id'),
        );
        if (!hasCompanyPocIdx) {
            await queryRunner.createIndex(
                'job_requirements',
                new TableIndex({
                    name: 'idx_job_requirements_company_poc',
                    columnNames: ['company_id', 'poc_id'],
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('job_requirements');
        if (!table) {
            return;
        }

        const companyStatusIdx = table.indices.find(
            (idx) => idx.name === 'idx_job_requirements_company_status',
        );
        if (companyStatusIdx) {
            await queryRunner.dropIndex('job_requirements', companyStatusIdx);
        }

        const companyPocIdx = table.indices.find(
            (idx) => idx.name === 'idx_job_requirements_company_poc',
        );
        if (companyPocIdx) {
            await queryRunner.dropIndex('job_requirements', companyPocIdx);
        }

        if (table.findColumnByName('poc_id')) {
            await queryRunner.dropColumn('job_requirements', 'poc_id');
        }
        if (table.findColumnByName('status')) {
            await queryRunner.dropColumn('job_requirements', 'status');
        }
        if (table.findColumnByName('deleted_at')) {
            await queryRunner.dropColumn('job_requirements', 'deleted_at');
        }
    }
}

