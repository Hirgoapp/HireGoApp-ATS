import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddDashboardPerformanceIndexes1767612000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const appHasStatus = await queryRunner.hasColumn('applications', 'status');
        if (!appHasStatus) {
            await queryRunner.query(`ALTER TABLE applications ADD COLUMN status varchar(50) DEFAULT 'active'`);
        }

        const appActivityIdx = await queryRunner.query(`
            SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'applications' AND indexname = 'IDX_applications_company_id_applied_at'
        `);
        if (!appActivityIdx || appActivityIdx.length === 0) {
            await queryRunner.createIndex(
                'applications',
                new TableIndex({
                    name: 'IDX_applications_company_id_applied_at',
                    columnNames: ['company_id', 'applied_at'],
                }),
            );
        }

        const appStatusIdx = await queryRunner.query(`
            SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'applications' AND indexname = 'IDX_applications_company_status_updated_at'
        `);
        if (!appStatusIdx || appStatusIdx.length === 0) {
            await queryRunner.createIndex(
                'applications',
                new TableIndex({
                    name: 'IDX_applications_company_status_updated_at',
                    columnNames: ['company_id', 'status', 'updated_at'],
                }),
            );
        }

        const interviewStatusHasCols =
            (await queryRunner.hasColumn('interviews', 'status')) && (await queryRunner.hasColumn('interviews', 'scheduled_at'));
        if (interviewStatusHasCols) {
            const interviewIdx = await queryRunner.query(`
                SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'interviews' AND indexname = 'IDX_interviews_status_scheduled_at'
            `);
            if (!interviewIdx || interviewIdx.length === 0) {
                await queryRunner.createIndex(
                    'interviews',
                    new TableIndex({
                        name: 'IDX_interviews_status_scheduled_at',
                        columnNames: ['status', 'scheduled_at'],
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const dropIndexIfExists = async (table: string, index: string) => {
            const exists = await queryRunner.query(`
                SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = '${table}' AND indexname = '${index}'
            `);
            if (exists && exists.length > 0) {
                await queryRunner.dropIndex(table, index);
            }
        };

        await dropIndexIfExists('interviews', 'IDX_interviews_status_scheduled_at');
        await dropIndexIfExists('applications', 'IDX_applications_company_status_updated_at');
        await dropIndexIfExists('applications', 'IDX_applications_company_id_applied_at');
    }
}
