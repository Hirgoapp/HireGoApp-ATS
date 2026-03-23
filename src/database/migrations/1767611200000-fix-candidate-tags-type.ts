import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCandidateTagsType1767611200000 implements MigrationInterface {
    name = 'FixCandidateTagsType1767611200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE candidates
            ALTER COLUMN tags DROP DEFAULT,
            ALTER COLUMN tags TYPE jsonb USING to_jsonb(tags),
            ALTER COLUMN tags SET DEFAULT '[]';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE candidates
            ALTER COLUMN tags DROP DEFAULT,
            ALTER COLUMN tags TYPE text[] USING tags::text[],
            ALTER COLUMN tags SET DEFAULT '{}';
        `);
    }
}
