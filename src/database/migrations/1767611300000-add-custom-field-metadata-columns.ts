import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomFieldMetadataColumns1767611300000 implements MigrationInterface {
    name = 'AddCustomFieldMetadataColumns1767611300000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE custom_fields
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS visibility_settings JSONB DEFAULT '{"show_in_list": true, "show_in_profile": true}';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE custom_fields
            DROP COLUMN IF EXISTS visibility_settings,
            DROP COLUMN IF EXISTS description;
        `);
    }
}
