import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

/**
 * Migration: AddPerformanceIndexes
 *
 * Adds missing database indexes that were identified as causing slow queries:
 *
 * applications:
 *  - (company_id, status)   – speeds up tenant-scoped status filters
 *  - (pipeline_id)          – speeds up pipeline-scoped listing
 *  - (assigned_to)          – speeds up assignee filters
 *
 * requirement_skills:
 *  - (job_requirement_id)              – speeds up per-requirement skill lookups
 *  - (company_id, job_requirement_id)  – speeds up tenant-scoped requirement skill queries
 *
 * requirement_assignments:
 *  - (job_requirement_id)              – speeds up per-requirement assignment lookups
 *  - (company_id, job_requirement_id)  – speeds up tenant-scoped requirement assignment queries
 *  - (assigned_to_user_id)             – speeds up user-assignment queries
 */
export class AddPerformanceIndexes1769300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- applications ---
        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'idx_applications_company_status',
                columnNames: ['company_id', 'status'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'idx_applications_pipeline_id',
                columnNames: ['pipeline_id'],
            }),
        );

        await queryRunner.createIndex(
            'applications',
            new TableIndex({
                name: 'idx_applications_assigned_to',
                columnNames: ['assigned_to'],
            }),
        );

        // --- requirement_skills ---
        await queryRunner.createIndex(
            'requirement_skills',
            new TableIndex({
                name: 'idx_requirement_skills_job_req_id',
                columnNames: ['job_requirement_id'],
            }),
        );

        await queryRunner.createIndex(
            'requirement_skills',
            new TableIndex({
                name: 'idx_requirement_skills_company_job_req',
                columnNames: ['company_id', 'job_requirement_id'],
            }),
        );

        // --- requirement_assignments ---
        await queryRunner.createIndex(
            'requirement_assignments',
            new TableIndex({
                name: 'idx_requirement_assignments_job_req_id',
                columnNames: ['job_requirement_id'],
            }),
        );

        await queryRunner.createIndex(
            'requirement_assignments',
            new TableIndex({
                name: 'idx_requirement_assignments_company_job_req',
                columnNames: ['company_id', 'job_requirement_id'],
            }),
        );

        await queryRunner.createIndex(
            'requirement_assignments',
            new TableIndex({
                name: 'idx_requirement_assignments_assigned_to',
                columnNames: ['assigned_to_user_id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('applications', 'idx_applications_company_status');
        await queryRunner.dropIndex('applications', 'idx_applications_pipeline_id');
        await queryRunner.dropIndex('applications', 'idx_applications_assigned_to');

        await queryRunner.dropIndex('requirement_skills', 'idx_requirement_skills_job_req_id');
        await queryRunner.dropIndex('requirement_skills', 'idx_requirement_skills_company_job_req');

        await queryRunner.dropIndex('requirement_assignments', 'idx_requirement_assignments_job_req_id');
        await queryRunner.dropIndex('requirement_assignments', 'idx_requirement_assignments_company_job_req');
        await queryRunner.dropIndex('requirement_assignments', 'idx_requirement_assignments_assigned_to');
    }
}
