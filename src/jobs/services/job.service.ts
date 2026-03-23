import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRequirementRepository } from '../repositories/job.repository';
import { JobRequirement } from '../entities/job-requirement.entity';
import { CreateJobRequirementDto } from '../dtos/create-job.dto';
import { UpdateJobRequirementDto } from '../dtos/update-job.dto';
import { GetJobRequirementDto } from '../dtos/get-job.dto';

/**
 * JobRequirementService
 * Business logic for job requirements
 * Uses INTEGER primary keys (not UUID)
 * Single-tenant ATS module (no company_id parameter)
 */
@Injectable()
export class JobRequirementService {
    constructor(private readonly jobRequirementRepository: JobRequirementRepository) { }

    /**
     * Create a new job requirement
     */
    async create(userId: number, dto: CreateJobRequirementDto): Promise<GetJobRequirementDto> {
        const ecmsReqId = dto.ecms_req_id?.trim() || `AUTO-${Date.now()}`;
        const mandatorySkills = dto.mandatory_skills?.trim() || 'N/A';
        const clientId = dto.client_id ?? 1; // fallback client

        const jobData: Partial<JobRequirement> = {
            created_by: userId,
            ecms_req_id: ecmsReqId,
            client_id: clientId,
            job_title: dto.job_title,
            job_description: dto.job_description,
            mandatory_skills: mandatorySkills,
            email_received_date: dto.email_received_date ? new Date(dto.email_received_date) : undefined,
            active_flag: dto.active_flag ?? true,
            priority: dto.priority || 'Medium',
            extra_fields: dto.extra_fields ?? {},
        };

        const job = await this.jobRequirementRepository.create(jobData);
        return new GetJobRequirementDto(job);
    }

    /**
     * Get job requirement by INTEGER id
     */
    async getById(id: number): Promise<GetJobRequirementDto> {
        const job = await this.jobRequirementRepository.findById(id);
        if (!job) {
            throw new NotFoundException(`Job requirement with ID ${id} not found`);
        }
        return new GetJobRequirementDto(job);
    }

    /**
     * Get job requirement by external ecms_req_id
     */
    async getByEcmsReqId(ecmsReqId: string): Promise<GetJobRequirementDto> {
        const job = await this.jobRequirementRepository.findByEcmsReqId(ecmsReqId);
        if (!job) {
            throw new NotFoundException(`Job requirement with ecms_req_id ${ecmsReqId} not found`);
        }
        return new GetJobRequirementDto(job);
    }

    /**
     * Get all job requirements with pagination and filtering
     */
    async getAll(options?: {
        skip?: number;
        take?: number;
        client_id?: number;
        active_flag?: boolean;
        priority?: string;
        search?: string;
        orderBy?: 'created_at' | 'updated_at' | 'job_title' | 'priority';
        orderDirection?: 'ASC' | 'DESC';
    }): Promise<{ data: GetJobRequirementDto[]; total: number }> {
        const { data, total } = await this.jobRequirementRepository.findAll({
            skip: options?.skip ?? 0,
            take: options?.take ?? 20,
            client_id: options?.client_id,
            active_flag: options?.active_flag,
            priority: options?.priority,
            search: options?.search,
            orderBy: options?.orderBy,
            orderDirection: options?.orderDirection,
        });

        return {
            data: data.map((job) => new GetJobRequirementDto(job)),
            total,
        };
    }

    /**
     * Update job requirement
     */
    async update(id: number, userId: number, dto: UpdateJobRequirementDto): Promise<GetJobRequirementDto> {
        const job = await this.jobRequirementRepository.findById(id);
        if (!job) {
            throw new NotFoundException(`Job requirement with ID ${id} not found`);
        }

        // Apply updates
        Object.assign(job, dto);
        const updatedJob = await this.jobRequirementRepository.update(job);

        return new GetJobRequirementDto(updatedJob);
    }

    /**
     * Delete job requirement (hard delete)
     */
    async delete(id: number): Promise<void> {
        const job = await this.jobRequirementRepository.findById(id);
        if (!job) {
            throw new NotFoundException(`Job requirement with ID ${id} not found`);
        }
        await this.jobRequirementRepository.delete(id);
    }

    /**
     * Get total count of job requirements
     */
    async count(): Promise<number> {
        return await this.jobRequirementRepository.count();
    }

    /**
     * Get count of active job requirements
     */
    async countActive(): Promise<number> {
        return await this.jobRequirementRepository.countActive();
    }

    /**
     * Find job requirements by client
     */
    async findByClient(clientId: number): Promise<GetJobRequirementDto[]> {
        const jobs = await this.jobRequirementRepository.findByClient(clientId);
        return jobs.map((job) => new GetJobRequirementDto(job));
    }

    /**
     * Find active job requirements
     */
    async findActive(): Promise<GetJobRequirementDto[]> {
        const jobs = await this.jobRequirementRepository.findActive();
        return jobs.map((job) => new GetJobRequirementDto(job));
    }

    /**
     * Find job requirements by priority
     */
    async findByPriority(priority: string): Promise<GetJobRequirementDto[]> {
        const jobs = await this.jobRequirementRepository.findByPriority(priority);
        return jobs.map((job) => new GetJobRequirementDto(job));
    }
}
