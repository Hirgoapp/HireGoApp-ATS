import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobRequirement } from '../entities/job-requirement.entity';

/**
 * JobRequirementRepository
 * Data access layer for job_requirements table
 * Uses INTEGER primary keys (id)
 * Single-tenant ATS module (no company_id filtering)
 */
@Injectable()
export class JobRequirementRepository {
    constructor(
        @InjectRepository(JobRequirement)
        private readonly repository: Repository<JobRequirement>,
    ) { }

    async create(jobData: Partial<JobRequirement>): Promise<JobRequirement> {
        const job = this.repository.create(jobData);
        return await this.repository.save(job);
    }

    /**
     * Find job requirement by INTEGER id
     */
    async findById(id: number): Promise<JobRequirement | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['client', 'createdByUser'],
        });
    }

    /**
     * Find by external ecms_req_id (unique)
     */
    async findByEcmsReqId(ecmsReqId: string): Promise<JobRequirement | null> {
        return await this.repository.findOne({
            where: { ecms_req_id: ecmsReqId },
            relations: ['client', 'createdByUser'],
        });
    }

    /**
     * Find all job requirements with pagination and filtering
     */
    async findAll(options?: {
        skip?: number;
        take?: number;
        client_id?: number;
        active_flag?: boolean;
        priority?: string;
        search?: string;
        orderBy?: 'created_at' | 'updated_at' | 'job_title' | 'priority';
        orderDirection?: 'ASC' | 'DESC';
    }): Promise<{ data: JobRequirement[]; total: number }> {
        let query = this.repository.createQueryBuilder('job');

        // Filter by client
        if (options?.client_id) {
            query = query.where('job.client_id = :clientId', { clientId: options.client_id });
        }

        // Filter by active flag
        if (options?.active_flag !== undefined) {
            query = query.andWhere('job.active_flag = :activeFlag', { activeFlag: options.active_flag });
        }

        // Filter by priority
        if (options?.priority) {
            query = query.andWhere('job.priority = :priority', { priority: options.priority });
        }

        // Search by job title or description
        if (options?.search) {
            query = query.andWhere(
                '(LOWER(job.job_title) LIKE :search OR LOWER(job.job_description) LIKE :search)',
                { search: `%${options.search.toLowerCase()}%` },
            );
        }

        // Get total count
        const total = await query.getCount();

        // Apply sorting
        const orderBy = options?.orderBy || 'created_at';
        const orderDirection = options?.orderDirection || 'DESC';
        query = query.orderBy(`job.${orderBy}`, orderDirection);

        // Apply pagination
        if (options?.skip !== undefined) {
            query = query.skip(options.skip);
        }
        if (options?.take !== undefined) {
            query = query.take(options.take);
        }

        query = query.leftJoinAndSelect('job.client', 'client')
            .leftJoinAndSelect('job.createdByUser', 'createdByUser');

        const data = await query.getMany();

        return { data, total };
    }

    /**
     * Find job requirements by client
     */
    async findByClient(clientId: number): Promise<JobRequirement[]> {
        return await this.repository.find({
            where: { client_id: clientId },
            relations: ['client', 'createdByUser'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Find active job requirements
     */
    async findActive(): Promise<JobRequirement[]> {
        return await this.repository.find({
            where: { active_flag: true },
            relations: ['client', 'createdByUser'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Find job requirements by priority
     */
    async findByPriority(priority: string): Promise<JobRequirement[]> {
        return await this.repository.find({
            where: { priority },
            relations: ['client', 'createdByUser'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Update job requirement
     */
    async update(job: JobRequirement): Promise<JobRequirement> {
        return await this.repository.save(job);
    }

    /**
     * Delete job requirement (hard delete)
     */
    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }

    /**
     * Count all job requirements
     */
    async count(): Promise<number> {
        return await this.repository.count();
    }

    /**
     * Count active job requirements
     */
    async countActive(): Promise<number> {
        return await this.repository.count({
            where: { active_flag: true },
        });
    }
}
