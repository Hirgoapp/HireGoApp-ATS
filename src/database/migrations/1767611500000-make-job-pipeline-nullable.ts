import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeJobPipelineNullable1767611500000 implements MigrationInterface {
    name = 'MakeJobPipelineNullable1767611500000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE jobs
            ALTER COLUMN pipeline_id DROP NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE jobs
            ALTER COLUMN pipeline_id SET NOT NULL;
        `);
    }
}
