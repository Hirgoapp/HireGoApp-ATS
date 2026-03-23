import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOffersEnums1767901000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create offer_status_enum
        await queryRunner.query(`
      CREATE TYPE offer_status_enum AS ENUM (
        'draft',
        'issued',
        'accepted',
        'rejected',
        'withdrawn'
      );
    `);

        // Create employment_type_enum
        await queryRunner.query(`
      CREATE TYPE employment_type_enum AS ENUM (
        'full_time',
        'contract',
        'intern',
        'part_time'
      );
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop enums in reverse order
        await queryRunner.query(`DROP TYPE employment_type_enum;`);
        await queryRunner.query(`DROP TYPE offer_status_enum;`);
    }
}
