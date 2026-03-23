import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { Interview, InterviewStatus } from '../entities/interview.entity';
import { InterviewFeedback } from '../entities/interview-feedback.entity';
import { InterviewInterviewer } from '../entities/interview-interviewer.entity';
import { Submission, SubmissionStatus } from '../../submissions/entities/submission.entity';
import { InterviewRepository } from '../repositories/interview.repository';
import { InterviewFeedbackRepository } from '../repositories/interview-feedback.repository';
import { InterviewStatusHistoryRepository } from '../repositories/interview-status-history.repository';
import { InterviewStatusService } from './interview-status.service';
import { CreateInterviewDto, UpdateInterviewDto, CompleteInterviewDto } from '../dto/interview.dto';

@Injectable()
export class InterviewService {
    constructor(
        private readonly interviewRepository: InterviewRepository,
        private readonly feedbackRepository: InterviewFeedbackRepository,
        private readonly statusHistoryRepository: InterviewStatusHistoryRepository,
        private readonly statusMachine: InterviewStatusService,
    ) { }

    /**
     * Create and schedule interview for submission
     */
    async create(createDto: CreateInterviewDto, companyId: string, userId?: string): Promise<Interview> {
        // Validate submission exists and is not in terminal state
        // NOTE: Submission lookup deferred to controller validation layer via SubmissionService
        // This service assumes submission has been pre-validated by controller
        const startDate = new Date(createDto.scheduled_start);
        const endDate = new Date(createDto.scheduled_end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new BadRequestException('Invalid scheduled_start or scheduled_end format');
        }

        if (startDate >= endDate) {
            throw new BadRequestException('scheduled_start must be before scheduled_end');
        }

        // Check for schedule conflicts (only non-deleted, non-cancelled interviews)
        const conflict = await this.interviewRepository.findScheduleConflict(
            companyId,
            createDto.submission_id,
            startDate,
            endDate,
        );

        if (conflict) {
            throw new ConflictException('Schedule conflict with existing interview for this submission');
        }

        // Create interview
        const interview = await this.interviewRepository.create({
            company_id: companyId,
            submission_id: createDto.submission_id,
            interview_type: createDto.interview_type,
            scheduled_start: startDate,
            scheduled_end: endDate,
            location_or_link: createDto.location_or_link ?? null,
            status: InterviewStatus.SCHEDULED,
            created_by_id: (userId as any) ?? null,
            updated_by_id: (userId as any) ?? null,
        });

        // Log status history
        await this.statusHistoryRepository.recordStatusChange({
            company_id: companyId,
            interview_id: interview.id,
            status: InterviewStatus.SCHEDULED,
            reason: 'Interview scheduled',
            changed_by_user_id: (userId as any) ?? null,
        });

        return interview;
    }

    /**
     * Get interview by ID (tenant-scoped)
     */
    async findOne(id: string, companyId: string): Promise<Interview> {
        const interview = await this.interviewRepository.findOne(id, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }
        return interview;
    }

    /**
     * Get interviews for submission
     */
    async findBySubmission(submissionId: string, companyId: string): Promise<Interview[]> {
        return this.interviewRepository.findBySubmission(submissionId, companyId);
    }

    /**
     * Get upcoming interviews (tenant-scoped)
     */
    async getUpcoming(companyId: string, limit: number = 20): Promise<Interview[]> {
        return this.interviewRepository.findUpcoming(companyId, limit);
    }

    /**
     * Update interview details (only when scheduled)
     */
    async update(id: string, updateDto: UpdateInterviewDto, companyId: string, userId?: string): Promise<Interview> {
        const interview = await this.findOne(id, companyId);

        // Enforce: only scheduled interviews can be updated
        if (!this.statusMachine.canUpdate(interview.status)) {
            throw new ForbiddenException('Only scheduled interviews can be updated');
        }

        // Validate and apply schedule changes if provided
        if (updateDto.scheduled_start || updateDto.scheduled_end) {
            const startDate = updateDto.scheduled_start ? new Date(updateDto.scheduled_start) : new Date(interview.scheduled_start);
            const endDate = updateDto.scheduled_end ? new Date(updateDto.scheduled_end) : new Date(interview.scheduled_end);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new BadRequestException('Invalid scheduled_start or scheduled_end format');
            }

            if (startDate >= endDate) {
                throw new BadRequestException('scheduled_start must be before scheduled_end');
            }

            // Check for conflicts excluding this interview
            const conflict = await this.interviewRepository.findScheduleConflict(
                companyId,
                interview.submission_id,
                startDate,
                endDate,
                id,
            );

            if (conflict) {
                throw new ConflictException('Schedule conflict with existing interview');
            }

            interview.scheduled_start = startDate;
            interview.scheduled_end = endDate;
        }

        // Apply other updates
        if (updateDto.interview_type) {
            interview.interview_type = updateDto.interview_type;
        }
        if (updateDto.location_or_link !== undefined) {
            interview.location_or_link = updateDto.location_or_link ?? null;
        }

        interview.updated_by_id = (userId as any) ?? interview.updated_by_id;
        return this.interviewRepository.update(id, interview);
    }

    /**
     * Complete interview (scheduled → completed)
     */
    async complete(id: string, _completeDto: CompleteInterviewDto, companyId: string, userId?: string): Promise<Interview> {
        const interview = await this.findOne(id, companyId);

        // Validate transition
        this.statusMachine.validateTransition(interview.status, InterviewStatus.COMPLETED);

        // Update status
        interview.status = InterviewStatus.COMPLETED;
        interview.updated_by_id = (userId as any) ?? interview.updated_by_id;

        const updated = await this.interviewRepository.update(id, interview);

        // Log status change
        await this.statusHistoryRepository.recordStatusChange({
            company_id: companyId,
            interview_id: updated.id,
            status: InterviewStatus.COMPLETED,
            reason: 'Interview completed',
            changed_by_user_id: (userId as any) ?? null,
        });

        return updated;
    }

    /**
     * Cancel interview (any non-terminal → cancelled)
     */
    async cancel(id: string, companyId: string, userId?: string, reason?: string): Promise<Interview> {
        const interview = await this.findOne(id, companyId);

        // Validate transition (cancellation allowed from any non-terminal state)
        this.statusMachine.validateTransition(interview.status, InterviewStatus.CANCELLED);

        interview.status = InterviewStatus.CANCELLED;
        interview.updated_by_id = (userId as any) ?? interview.updated_by_id;

        const updated = await this.interviewRepository.update(id, interview);

        // Log status change
        await this.statusHistoryRepository.recordStatusChange({
            company_id: companyId,
            interview_id: updated.id,
            status: InterviewStatus.CANCELLED,
            reason: reason ?? 'Interview cancelled',
            changed_by_user_id: (userId as any) ?? null,
        });

        return updated;
    }

    /**
     * Evaluate interview (completed → evaluated, terminal)
     */
    async evaluate(id: string, companyId: string, userId?: string): Promise<Interview> {
        const interview = await this.findOne(id, companyId);

        // No separate "evaluated" status in DB; keep as completed.
        interview.updated_by_id = (userId as any) ?? interview.updated_by_id;

        const updated = await this.interviewRepository.update(id, interview);

        // Log status change
        await this.statusHistoryRepository.recordStatusChange({
            company_id: companyId,
            interview_id: updated.id,
            status: InterviewStatus.COMPLETED,
            reason: 'Interview evaluated',
            changed_by_user_id: (userId as any) ?? null,
        });

        return updated;
    }

    /**
     * Soft delete interview
     */
    async delete(id: string, companyId: string): Promise<void> {
        const interview = await this.findOne(id, companyId);
        await this.interviewRepository.softDelete(id);
    }

    /**
     * Get paginated interviews
     */
    async getPaginated(
        companyId: string,
        page: number = 1,
        limit: number = 20,
        filters?: { submissionId?: string; status?: InterviewStatus },
    ) {
        return this.interviewRepository.findPaginated(companyId, page, limit, filters);
    }

    /**
     * Get interview status counts
     */
    async getStatusCounts(companyId: string) {
        return this.interviewRepository.countByStatus(companyId);
    }

    /**
     * Get status history for interview
     */
    async getStatusHistory(id: string, companyId: string) {
        const interview = await this.findOne(id, companyId);
        return this.statusHistoryRepository.findByInterview(id, companyId);
    }
}
