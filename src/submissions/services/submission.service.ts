import { Injectable, NotFoundException } from '@nestjs/common';
import { RequirementSubmissionRepository } from '../repositories/submission.repository';
import { RequirementSubmission } from '../entities/requirement-submission.entity';
import { CreateRequirementSubmissionDto } from '../dtos/create-submission.dto';
import { UpdateRequirementSubmissionDto } from '../dtos/update-submission.dto';
import { GetRequirementSubmissionDto } from '../dtos/get-submission.dto';

/**
 * RequirementSubmissionService
 * Business logic for requirement submissions
 * Uses INTEGER primary keys (not UUID)
 * Single-tenant ATS module (no company_id parameter)
 */
@Injectable()
export class RequirementSubmissionService {
    constructor(private readonly submissionRepository: RequirementSubmissionRepository) { }

    /**
     * Create a new requirement submission
     */
    async create(
        userId: number,
        dto: CreateRequirementSubmissionDto,
    ): Promise<GetRequirementSubmissionDto> {
        const submissionData: Partial<RequirementSubmission> = {
            created_by: userId,
            submitted_at: new Date(),
            job_requirement_id: dto.job_requirement_id,
            daily_submission_id: dto.daily_submission_id,
            profile_submission_date: dto.profile_submission_date ? new Date(dto.profile_submission_date) : new Date(),
            vendor_email_id: dto.vendor_email_id,
            candidate_title: dto.candidate_title,
            candidate_name: dto.candidate_name,
            candidate_phone: dto.candidate_phone,
            candidate_email: dto.candidate_email,
            candidate_notice_period: dto.candidate_notice_period,
            candidate_current_location: dto.candidate_current_location,
            candidate_location_applying_for: dto.candidate_location_applying_for,
            candidate_total_experience: dto.candidate_total_experience,
            candidate_relevant_experience: dto.candidate_relevant_experience,
            candidate_skills: dto.candidate_skills,
            vendor_quoted_rate: dto.vendor_quoted_rate,
            interview_screenshot_url: dto.interview_screenshot_url,
            interview_platform: dto.interview_platform,
            screenshot_duration_minutes: dto.screenshot_duration_minutes,
            candidate_visa_type: dto.candidate_visa_type,
            candidate_engagement_type: dto.candidate_engagement_type,
            candidate_ex_infosys_employee_id: dto.candidate_ex_infosys_employee_id,
            submission_status: dto.submission_status,
            client_feedback: dto.client_feedback,
            extra_fields: dto.extra_fields,
        };

        const submission = await this.submissionRepository.create(submissionData);
        return new GetRequirementSubmissionDto(submission);
    }

    /**
     * Get submission by INTEGER id
     */
    async getById(id: number): Promise<GetRequirementSubmissionDto> {
        const submission = await this.submissionRepository.findById(id);
        if (!submission) {
            throw new NotFoundException(`Requirement submission with ID ${id} not found`);
        }
        return new GetRequirementSubmissionDto(submission);
    }

    /**
     * Get all requirement submissions with pagination and filtering
     */
    async getAll(options?: {
        skip?: number;
        take?: number;
        job_requirement_id?: number;
        submission_status?: string;
        search?: string;
        orderBy?: 'created_at' | 'updated_at' | 'submitted_at' | 'profile_submission_date';
        orderDirection?: 'ASC' | 'DESC';
    }): Promise<{ data: GetRequirementSubmissionDto[]; total: number }> {
        const { data, total } = await this.submissionRepository.findAll({
            skip: options?.skip ?? 0,
            take: options?.take ?? 20,
            job_requirement_id: options?.job_requirement_id,
            submission_status: options?.submission_status,
            search: options?.search,
            orderBy: options?.orderBy,
            orderDirection: options?.orderDirection,
        });

        return {
            data: data.map((submission) => new GetRequirementSubmissionDto(submission)),
            total,
        };
    }

    /**
     * Update requirement submission
     */
    async update(
        id: number,
        userId: number,
        dto: UpdateRequirementSubmissionDto,
    ): Promise<GetRequirementSubmissionDto> {
        const submission = await this.submissionRepository.findById(id);
        if (!submission) {
            throw new NotFoundException(`Requirement submission with ID ${id} not found`);
        }

        // Apply updates
        Object.assign(submission, dto);
        submission.updated_by = userId;

        const updatedSubmission = await this.submissionRepository.update(submission);
        return new GetRequirementSubmissionDto(updatedSubmission);
    }

    /**
     * Delete requirement submission (hard delete)
     */
    async delete(id: number): Promise<void> {
        const submission = await this.submissionRepository.findById(id);
        if (!submission) {
            throw new NotFoundException(`Requirement submission with ID ${id} not found`);
        }
        await this.submissionRepository.delete(id);
    }

    /**
     * Get total count of submissions
     */
    async count(): Promise<number> {
        return await this.submissionRepository.count();
    }

    /**
     * Find submissions by job requirement
     */
    async findByJobRequirement(jobRequirementId: number): Promise<GetRequirementSubmissionDto[]> {
        const submissions = await this.submissionRepository.findByJobRequirement(jobRequirementId);
        return submissions.map((submission) => new GetRequirementSubmissionDto(submission));
    }

    /**
     * Find submissions by status
     */
    async findByStatus(status: string): Promise<GetRequirementSubmissionDto[]> {
        const submissions = await this.submissionRepository.findByStatus(status);
        return submissions.map((submission) => new GetRequirementSubmissionDto(submission));
    }

    /**
     * Find submissions by vendor email
     */
    async findByVendorEmail(vendorEmail: string): Promise<GetRequirementSubmissionDto[]> {
        const submissions = await this.submissionRepository.findByVendorEmail(vendorEmail);
        return submissions.map((submission) => new GetRequirementSubmissionDto(submission));
    }

    /**
     * Count submissions by status
     */
    async countByStatus(status: string): Promise<number> {
        return await this.submissionRepository.countByStatus(status);
    }

    /**
     * Count submissions by job requirement
     */
    async countByJobRequirement(jobRequirementId: number): Promise<number> {
        return await this.submissionRepository.countByJobRequirement(jobRequirementId);
    }
}
