import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { SubmissionStatusHistory } from '../entities/submission-status-history.entity';
import { SubmissionRepository } from '../repositories/submission.repository';
import { SubmissionStatusService } from './submission-status.service';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { UpdateSubmissionDto } from '../dto/update-submission.dto';
import { ChangeSubmissionStatusDto } from '../dto/change-status.dto';
import { Job } from '../../jobs/entities/job.entity';
import { Candidate } from '../../../candidate/entities/candidate.entity';
import { ActivityService } from '../../../activity/services/activity.service';
import { AuditService } from '../../../common/services/audit.service';

@Injectable()
export class SubmissionService {
    private readonly logger = new Logger(SubmissionService.name);

    constructor(
        private readonly submissionRepository: SubmissionRepository,
        private readonly statusService: SubmissionStatusService,
        @InjectRepository(Submission)
        private readonly submissionDb: Repository<Submission>,
        @InjectRepository(SubmissionStatusHistory)
        private readonly historyDb: Repository<SubmissionStatusHistory>,
        @InjectRepository(Job)
        private readonly jobDb: Repository<Job>,
        @InjectRepository(Candidate)
        private readonly candidateDb: Repository<Candidate>,
        private readonly activityService: ActivityService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Create new submission with status = 'applied' (ALWAYS)
     * Service layer validates candidate and job belong to company
     */
    async createSubmission(
        companyId: string,
        createDto: CreateSubmissionDto,
        userId: number,
    ): Promise<Submission> {
        // VALIDATION 1: Verify candidate exists
        const candidate = await this.candidateDb.findOne({
            where: { id: createDto.candidate_id, company_id: companyId } as any,
        });

        if (!candidate) {
            throw new NotFoundException(`Candidate ${createDto.candidate_id} not found`);
        }

        // VALIDATION 2: Verify job requirement exists and belongs to company
        const job = await this.jobDb.findOne({
            where: {
                id: createDto.job_id,
                company_id: companyId,
            },
        });

        if (!job) {
            throw new NotFoundException(`Job requirement ${createDto.job_id} not found for company ${companyId}`);
        }

        // VALIDATION 3: Ensure no duplicate active submission exists for candidate+job+company

        // VALIDATION 3: Check for duplicate active submission
        const existingSubmission = await this.submissionRepository.findByJobAndCandidate(
            createDto.job_id,
            createDto.candidate_id,
            companyId,
        );

        if (existingSubmission) {
            throw new ConflictException(
                `This candidate has already applied to this job (existing submission: ${existingSubmission.id})`
            );
        }

        // All validations passed - create submission
        // Create submission in DB schema
        const submission = new Submission();
        submission.company_id = companyId;
        submission.candidate_id = createDto.candidate_id;
        submission.job_id = createDto.job_id;
        submission.status = SubmissionStatus.APPLIED;
        submission.submitted_at = new Date();
        submission.moved_to_stage_at = new Date();
        submission.internal_notes = createDto.internal_notes || null;
        submission.source = createDto.source || null;
        submission.tags = createDto.tags || null;
        submission.created_by_id = String(userId) as any;
        submission.updated_by_id = String(userId) as any;

        const saved = await this.submissionDb.save(submission);

        // Log initial status in history
        await this.statusService.logStatusHistory(
            saved.id,
            companyId,
            null,
            SubmissionStatus.APPLIED,
            String(userId) as any,
            'Submission created',
        );

        await this.activityService.logActivity(companyId, String(userId), {
            entityType: 'submission',
            entityId: saved.id,
            activityType: 'candidate_submitted_to_job',
            message: `Candidate submitted to job`,
            metadata: {
                candidateId: saved.candidate_id,
                jobId: saved.job_id,
            },
        });

        await this.auditService.log(companyId, String(userId), {
            entityType: 'submission',
            entityId: saved.id,
            action: 'CREATE',
            newValues: saved,
        });

        this.logger.log(`Submission created: ${saved.id} (${createDto.candidate_id} → ${createDto.job_id})`);
        return saved;
    }

    /**
     * Get submission by ID with tenant isolation
     */
    async getSubmissionById(submissionId: string, companyId: string): Promise<Submission> {
        const submission = await this.submissionRepository.findById(submissionId, companyId);

        if (!submission) {
            throw new NotFoundException(
                `Submission ${submissionId} not found or you don't have access`,
            );
        }

        return submission;
    }

    /**
     * Update submission details (not status)
     */
    async updateSubmission(
        submissionId: string,
        companyId: string,
        updateDto: UpdateSubmissionDto,
        userId: number,
    ): Promise<Submission> {
        const submission = await this.getSubmissionById(submissionId, companyId);
        const oldValues = { ...submission };

        const patch: Record<string, unknown> = {
            updated_by_id: String(userId),
            updated_at: new Date(),
        };
        if (updateDto.internal_notes !== undefined) {
            patch.internal_notes = updateDto.internal_notes;
        }
        const updated = await this.submissionRepository.update(submissionId, companyId, patch as any);

        if (!updated) {
            throw new NotFoundException('Submission not found');
        }

        await this.auditService.log(companyId, String(userId), {
            entityType: 'submission',
            entityId: submissionId,
            action: 'UPDATE',
            oldValues,
            newValues: updated,
        });

        this.logger.log(`Submission updated: ${submissionId}`);
        return updated;
    }

    /**
     * Change submission status with validation
     */
    async changeStatus(
        submissionId: string,
        companyId: string,
        changeDto: ChangeSubmissionStatusDto,
        userId: number,
    ): Promise<Submission> {
        const submission = await this.getSubmissionById(submissionId, companyId);
        const newStatus = String(changeDto.new_status || '').trim();

        // Validate transition using state machine
        this.statusService.validateTransition(submission.status as any, newStatus);
        this.statusService.validateReasonRequired(newStatus as any, changeDto.reason);

        // Update status
        const updated = await this.submissionRepository.update(submissionId, companyId, {
            status: newStatus as any,
            updated_by_id: String(userId) as any,
            updated_at: new Date(),
            ...(newStatus === SubmissionStatus.REJECTED && {
                outcome: 'rejected',
                outcome_date: new Date(),
            }),
        });

        if (!updated) {
            throw new NotFoundException('Submission not found');
        }

        // Log status change in history
        await this.statusService.logStatusHistory(
            submissionId,
            companyId,
            submission.status as any,
            newStatus as any,
            String(userId) as any,
            changeDto.reason,
        );
        await this.activityService.logActivity(companyId, String(userId), {
            entityType: 'submission',
            entityId: submissionId,
            activityType: 'submission_status_updated',
            message: `Submission status updated: ${submission.status} → ${newStatus}`,
            metadata: {
                candidateId: updated.candidate_id,
                jobId: updated.job_id,
                oldStatus: submission.status,
                newStatus,
            },
        });

        await this.auditService.log(companyId, String(userId), {
            entityType: 'submission',
            entityId: submissionId,
            action: 'UPDATE',
            oldValues: submission,
            newValues: updated,
        });

        this.logger.log(
            `Submission status changed: ${submissionId} (${submission.status} → ${newStatus})`,
        );

        return updated;
    }

    /**
     * Get submissions for a specific job
     */
    async getSubmissionsByJobId(
        jobId: string,
        companyId: string,
        skip: number = 0,
        take: number = 20,
        status?: string,
        includeCandidate = false,
        includeJob = false,
    ): Promise<{ data: Submission[]; total: number; skip: number; take: number }> {
        // Skipping job existence validation here; repository enforces company scoping

        const result = await this.submissionRepository.findByJobId(
            jobId,
            companyId,
            skip,
            take,
            status,
            includeCandidate,
            includeJob,
        );

        return {
            data: result.data,
            total: result.total,
            skip,
            take,
        };
    }

    /**
     * Get submissions for a specific candidate
     */
    async getSubmissionsByCandidateId(
        candidateId: string,
        companyId: string,
        skip: number = 0,
        take: number = 20,
        status?: string,
        includeJob = false,
        includeCandidate = false,
    ): Promise<{ data: Submission[]; total: number; skip: number; take: number }> {
        // Skipping candidate existence validation here; repository enforces company scoping

        const result = await this.submissionRepository.findByCandidateId(
            candidateId,
            companyId,
            skip,
            take,
            status,
            includeJob,
            includeCandidate,
        );

        return {
            data: result.data,
            total: result.total,
            skip,
            take,
        };
    }

    /**
     * Get all submissions for company with filters
     */
    async getAllSubmissions(
        companyId: string,
        skip: number = 0,
        take: number = 20,
        filters?: {
            status?: SubmissionStatus;
            job_id?: string;
            candidate_id?: string;
            include_candidate?: boolean;
            include_job?: boolean;
        },
    ): Promise<{ data: Submission[]; total: number; skip: number; take: number }> {
        const result = await this.submissionRepository.findAll(companyId, skip, take, filters);

        return {
            data: result.data,
            total: result.total,
            skip,
            take,
        };
    }

    /**
     * Get status breakdown for a job or company
     */
    async getStatusStats(
        companyId: string,
        jobId?: string,
    ): Promise<Record<SubmissionStatus, number>> {
        // Stats can be computed without loading job entity

        return this.submissionRepository.getStatusCounts(companyId, jobId);
    }

    /**
     * Get status history for a submission
     */
    async getStatusHistory(submissionId: string, companyId: string): Promise<SubmissionStatusHistory[]> {
        const submission = await this.getSubmissionById(submissionId, companyId);
        return this.statusService.getSubmissionHistory(submissionId);
    }

    /**
     * Soft delete submission
     */
    async deleteSubmission(
        submissionId: string,
        companyId: string,
        userId: number,
    ): Promise<void> {
        const submission = await this.getSubmissionById(submissionId, companyId);

        const success = await this.submissionRepository.softDelete(submissionId, companyId);

        if (!success) {
            throw new BadRequestException('Failed to delete submission');
        }

        await this.activityService.logActivity(companyId, String(userId), {
            entityType: 'submission',
            entityId: submissionId,
            activityType: 'submission_deleted',
            message: 'Submission deleted',
            metadata: {
                candidateId: submission.candidate_id,
                jobId: submission.job_id,
            },
        });

        await this.auditService.log(companyId, String(userId), {
            entityType: 'submission',
            entityId: submissionId,
            action: 'DELETE',
            oldValues: submission,
            newValues: null,
        });

        this.logger.log(`Submission deleted (soft): ${submissionId}`);
    }
}
