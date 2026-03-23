import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingCandidateSourceId1769200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCandidates = await queryRunner.hasTable('candidates');
        if (!hasCandidates) {
            return;
        }

        const hasSourceId = await queryRunner.hasColumn('candidates', 'source_id');
        if (!hasSourceId) {
            await queryRunner.query('ALTER TABLE "candidates" ADD COLUMN "source_id" uuid NULL');
        }

        await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_candidates_source_id" ON "candidates" ("source_id")');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCandidates = await queryRunner.hasTable('candidates');
        if (!hasCandidates) {
            return;
        }

        const hasSourceId = await queryRunner.hasColumn('candidates', 'source_id');
        if (!hasSourceId) {
            return;
        }

        await queryRunner.query('DROP INDEX IF EXISTS "IDX_candidates_source_id"');
        await queryRunner.query('ALTER TABLE "candidates" DROP COLUMN "source_id"');
    }
}
