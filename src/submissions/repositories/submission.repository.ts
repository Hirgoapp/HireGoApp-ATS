import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementSubmission } from '../entities/requirement-submission.entity';

/**
 * RequirementSubmissionRepository
 * Data access layer for requirement_submissions table
 * Uses INTEGER primary keys (id)
 * Links to job_requirement_id (FK, NOT NULL)
 * Single-tenant ATS module (no company_id filtering)
 */
@Injectable()
export class RequirementSubmissionRepository {
    constructor(
        @InjectRepository(RequirementSubmission)
        private readonly repository: Repository<RequirementSubmission>,
    ) { }

    /**
     * Create a requirement submission
     */
    async create(submission: Partial<RequirementSubmission>): Promise<RequirementSubmission> {
        const newSubmission = this.repository.create(submission);
        return await this.repository.save(newSubmission);
    }

    /**
     * Find submission by INTEGER id
     */
    async findById(id: number): Promise<RequirementSubmission | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['jobRequirement', 'createdByUser', 'updatedByUser'],
        });
    }

    /**
     * Find submissions by job requirement
     */
    async findByJobRequirement(jobRequirementId: number): Promise<RequirementSubmission[]> {
        return await this.repository.find({
            where: { job_requirement_id: jobRequirementId },
            relations: ['jobRequirement', 'createdByUser', 'updatedByUser'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Find submissions by status
     */
    async findByStatus(status: string): Promise<RequirementSubmission[]> {
        return await this.repository.find({
            where: { submission_status: status },
            relations: ['jobRequirement', 'createdByUser', 'updatedByUser'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Find submissions by vendor email
     */
    async findByVendorEmail(vendorEmail: string): Promise<RequirementSubmission[]> {
        return await this.repository.find({
            where: { vendor_email_id: vendorEmail },
            relations: ['jobRequirement', 'createdByUser', 'updatedByUser'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Find all submissions with pagination and filtering
     */
    async findAll(options?: {
        skip?: number;
        take?: number;
        job_requirement_id?: number;
        submission_status?: string;
        search?: string; // Search in candidate_name or candidate_email
        orderBy?: 'created_at' | 'updated_at' | 'submitted_at' | 'profile_submission_date';
        orderDirection?: 'ASC' | 'DESC';
    }): Promise<{ data: RequirementSubmission[]; total: number }> {
        let query = this.repository.createQueryBuilder('submission');

        // Filter by job requirement
        if (options?.job_requirement_id) {
            query = query.where('submission.job_requirement_id = :jobReqId', {
                jobReqId: options.job_requirement_id,
            });
        }

        // Filter by status
        if (options?.submission_status) {
            query = query.andWhere('submission.submission_status = :status', {
                status: options.submission_status,
            });
        }

        // Search by candidate name or email
        if (options?.search) {
            query = query.andWhere(
                '(LOWER(submission.candidate_name) LIKE :search OR LOWER(submission.candidate_email) LIKE :search)',
                { search: `%${options.search.toLowerCase()}%` },
            );
        }

        // Get total count
        const total = await query.getCount();

        // Apply sorting
        const orderBy = options?.orderBy || 'created_at';
        const orderDirection = options?.orderDirection || 'DESC';
        query = query.orderBy(`submission.${orderBy}`, orderDirection);

        // Apply pagination
        if (options?.skip !== undefined) {
            query = query.skip(options.skip);
        }
        if (options?.take !== undefined) {
            query = query.take(options.take);
        }

        query = query.leftJoinAndSelect('submission.jobRequirement', 'jobRequirement')
            .leftJoinAndSelect('submission.createdByUser', 'createdByUser')
            .leftJoinAndSelect('submission.updatedByUser', 'updatedByUser');

        const data = await query.getMany();

        return { data, total };
    }

    /**
     * Update submission
     */
    async update(submission: RequirementSubmission): Promise<RequirementSubmission> {
        return await this.repository.save(submission);
    }

    /**
     * Delete submission (hard delete)
     */
    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }

    /**
     * Count all submissions
     */
    async count(): Promise<number> {
        return await this.repository.count();
    }

    /**
     * Count submissions by status
     */
    async countByStatus(status: string): Promise<number> {
        return await this.repository.count({
            where: { submission_status: status },
        });
    }

    /**
     * Count submissions by job requirement
     */
    async countByJobRequirement(jobRequirementId: number): Promise<number> {
        return await this.repository.count({
            where: { job_requirement_id: jobRequirementId },
        });
    }
}
