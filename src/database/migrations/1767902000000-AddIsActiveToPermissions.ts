import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsActiveToPermissions1767902000000 implements MigrationInterface {
    name = 'AddIsActiveToPermissions1767902000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "permissions"
            ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Safe to drop column if it exists
        await queryRunner.query(`
            ALTER TABLE "permissions"
            DROP COLUMN IF EXISTS "is_active"
        `);
    }
}

