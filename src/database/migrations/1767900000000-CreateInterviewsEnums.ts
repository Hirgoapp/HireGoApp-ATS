import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterviewsEnums1767900000000 implements MigrationInterface {
    name = 'CreateInterviewsEnums1767900000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ENUM types for interviews
        await queryRunner.query(`
            CREATE TYPE interview_status_enum AS ENUM ('scheduled', 'completed', 'evaluated', 'cancelled');
        `);

        await queryRunner.query(`
            CREATE TYPE interview_type_enum AS ENUM ('phone', 'video', 'onsite', 'other');
        `);

        await queryRunner.query(`
            CREATE TYPE interviewer_role_enum AS ENUM ('interviewer', 'hiring_manager', 'recruiter');
        `);

        await queryRunner.query(`
            CREATE TYPE recommendation_enum AS ENUM ('hire', 'no_hire', 'neutral');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TYPE IF EXISTS recommendation_enum;`);
        await queryRunner.query(`DROP TYPE IF EXISTS interviewer_role_enum;`);
        await queryRunner.query(`DROP TYPE IF EXISTS interview_type_enum;`);
        await queryRunner.query(`DROP TYPE IF EXISTS interview_status_enum;`);
    }
}
