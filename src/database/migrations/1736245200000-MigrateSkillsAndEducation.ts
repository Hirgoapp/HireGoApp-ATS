import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class MigrateSkillsAndEducation1736245200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // skill_categories
        await queryRunner.createTable(
            new Table({
                name: 'skill_categories',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
                    { name: 'company_id', type: 'uuid', isNullable: false },
                    { name: 'name', type: 'varchar', length: '255', isNullable: false },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'is_active', type: 'boolean', default: true },
                    { name: 'created_by', type: 'uuid', isNullable: true },
                    { name: 'updated_by', type: 'uuid', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'skill_categories',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'skill_categories',
            new TableForeignKey({
                columnNames: ['created_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'skill_categories',
            new TableForeignKey({
                columnNames: ['updated_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createIndex(
            'skill_categories',
            new TableIndex({ name: 'IDX_skill_categories_company_id', columnNames: ['company_id'] }),
        );

        await queryRunner.createIndex(
            'skill_categories',
            new TableIndex({ name: 'UQ_skill_categories_company_id_name', columnNames: ['company_id', 'name'], isUnique: true }),
        );

        await queryRunner.createIndex(
            'skill_categories',
            new TableIndex({ name: 'IDX_skill_categories_company_id_active', columnNames: ['company_id', 'is_active'] }),
        );

        await queryRunner.createIndex(
            'skill_categories',
            new TableIndex({ name: 'IDX_skill_categories_company_id_deleted_at', columnNames: ['company_id', 'deleted_at'] }),
        );

        // skills
        await queryRunner.createTable(
            new Table({
                name: 'skills',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
                    { name: 'company_id', type: 'uuid', isNullable: false },
                    { name: 'category_id', type: 'uuid', isNullable: true },
                    { name: 'name', type: 'varchar', length: '255', isNullable: false },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'proficiency_scale', type: 'varchar', length: '50', isNullable: true, comment: 'Optional scale like beginner/intermediate/advanced' },
                    { name: 'is_active', type: 'boolean', default: true },
                    { name: 'created_by', type: 'uuid', isNullable: true },
                    { name: 'updated_by', type: 'uuid', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'skills',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'skills',
            new TableForeignKey({
                columnNames: ['category_id'],
                referencedTableName: 'skill_categories',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'skills',
            new TableForeignKey({
                columnNames: ['created_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'skills',
            new TableForeignKey({
                columnNames: ['updated_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createIndex('skills', new TableIndex({ name: 'IDX_skills_company_id', columnNames: ['company_id'] }));
        await queryRunner.createIndex(
            'skills',
            new TableIndex({ name: 'UQ_skills_company_id_name', columnNames: ['company_id', 'name'], isUnique: true }),
        );
        await queryRunner.createIndex(
            'skills',
            new TableIndex({ name: 'IDX_skills_company_id_category_id', columnNames: ['company_id', 'category_id'] }),
        );
        await queryRunner.createIndex(
            'skills',
            new TableIndex({ name: 'IDX_skills_company_id_active', columnNames: ['company_id', 'is_active'] }),
        );
        await queryRunner.createIndex(
            'skills',
            new TableIndex({ name: 'IDX_skills_company_id_deleted_at', columnNames: ['company_id', 'deleted_at'] }),
        );

        // education_levels
        await queryRunner.createTable(
            new Table({
                name: 'education_levels',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
                    { name: 'company_id', type: 'uuid', isNullable: false },
                    { name: 'name', type: 'varchar', length: '255', isNullable: false },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'is_active', type: 'boolean', default: true },
                    { name: 'created_by', type: 'uuid', isNullable: true },
                    { name: 'updated_by', type: 'uuid', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'education_levels',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'education_levels',
            new TableForeignKey({
                columnNames: ['created_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'education_levels',
            new TableForeignKey({
                columnNames: ['updated_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createIndex('education_levels', new TableIndex({ name: 'IDX_education_levels_company_id', columnNames: ['company_id'] }));
        await queryRunner.createIndex(
            'education_levels',
            new TableIndex({ name: 'UQ_education_levels_company_id_name', columnNames: ['company_id', 'name'], isUnique: true }),
        );
        await queryRunner.createIndex(
            'education_levels',
            new TableIndex({ name: 'IDX_education_levels_company_id_active', columnNames: ['company_id', 'is_active'] }),
        );
        await queryRunner.createIndex(
            'education_levels',
            new TableIndex({ name: 'IDX_education_levels_company_id_deleted_at', columnNames: ['company_id', 'deleted_at'] }),
        );

        // experience_types
        await queryRunner.createTable(
            new Table({
                name: 'experience_types',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
                    { name: 'company_id', type: 'uuid', isNullable: false },
                    { name: 'name', type: 'varchar', length: '255', isNullable: false },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'min_years', type: 'integer', default: 0 },
                    { name: 'is_active', type: 'boolean', default: true },
                    { name: 'created_by', type: 'uuid', isNullable: true },
                    { name: 'updated_by', type: 'uuid', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'experience_types',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'experience_types',
            new TableForeignKey({
                columnNames: ['created_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'experience_types',
            new TableForeignKey({
                columnNames: ['updated_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createIndex('experience_types', new TableIndex({ name: 'IDX_experience_types_company_id', columnNames: ['company_id'] }));
        await queryRunner.createIndex(
            'experience_types',
            new TableIndex({ name: 'UQ_experience_types_company_id_name', columnNames: ['company_id', 'name'], isUnique: true }),
        );
        await queryRunner.createIndex(
            'experience_types',
            new TableIndex({ name: 'IDX_experience_types_company_id_active', columnNames: ['company_id', 'is_active'] }),
        );
        await queryRunner.createIndex(
            'experience_types',
            new TableIndex({ name: 'IDX_experience_types_company_id_deleted_at', columnNames: ['company_id', 'deleted_at'] }),
        );

        // qualifications
        await queryRunner.createTable(
            new Table({
                name: 'qualifications',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
                    { name: 'company_id', type: 'uuid', isNullable: false },
                    { name: 'name', type: 'varchar', length: '255', isNullable: false },
                    { name: 'level', type: 'varchar', length: '100', isNullable: true, comment: 'e.g., Bachelor, Master, Diploma' },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'is_active', type: 'boolean', default: true },
                    { name: 'created_by', type: 'uuid', isNullable: true },
                    { name: 'updated_by', type: 'uuid', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'qualifications',
            new TableForeignKey({
                columnNames: ['company_id'],
                referencedTableName: 'companies',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'qualifications',
            new TableForeignKey({
                columnNames: ['created_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'qualifications',
            new TableForeignKey({
                columnNames: ['updated_by'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createIndex('qualifications', new TableIndex({ name: 'IDX_qualifications_company_id', columnNames: ['company_id'] }));
        await queryRunner.createIndex(
            'qualifications',
            new TableIndex({ name: 'UQ_qualifications_company_id_name', columnNames: ['company_id', 'name'], isUnique: true }),
        );
        await queryRunner.createIndex(
            'qualifications',
            new TableIndex({ name: 'IDX_qualifications_company_id_active', columnNames: ['company_id', 'is_active'] }),
        );
        await queryRunner.createIndex(
            'qualifications',
            new TableIndex({ name: 'IDX_qualifications_company_id_deleted_at', columnNames: ['company_id', 'deleted_at'] }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('qualifications', true);
        await queryRunner.dropTable('experience_types', true);
        await queryRunner.dropTable('education_levels', true);
        await queryRunner.dropTable('skills', true);
        await queryRunner.dropTable('skill_categories', true);
    }
}
