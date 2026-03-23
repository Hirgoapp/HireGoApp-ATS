import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { SubmissionStatusHistory } from '../entities/submission-status-history.entity';

export class TerminalStateTransitionError extends ConflictException {
    constructor(currentStatus: string, attemptedStatus: string) {
        super(
            `Cannot transition from ${currentStatus} (terminal state) to ${attemptedStatus}. This submission is in a final state and cannot be changed.`,
            'TerminalStateTransitionError',
        );
    }
}

export class InvalidStatusTransitionError extends BadRequestException {
    constructor(currentStatus: string, newStatus: string, allowed: string[]) {
        super(
            `Invalid transition: ${currentStatus} → ${newStatus}. Allowed transitions: ${allowed.join(', ')}`,
            'InvalidStatusTransitionError',
        );
    }
}

@Injectable()
export class SubmissionStatusService {
    private readonly logger = new Logger(SubmissionStatusService.name);

    private readonly VALID_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
        [SubmissionStatus.APPLIED]: [SubmissionStatus.SCREENING, SubmissionStatus.REJECTED],
        [SubmissionStatus.SCREENING]: [SubmissionStatus.INTERVIEW, SubmissionStatus.REJECTED],
        [SubmissionStatus.INTERVIEW]: [SubmissionStatus.OFFER, SubmissionStatus.REJECTED],
        [SubmissionStatus.OFFER]: [SubmissionStatus.HIRED, SubmissionStatus.REJECTED, SubmissionStatus.WITHDRAWN],
        [SubmissionStatus.HIRED]: [],
        [SubmissionStatus.REJECTED]: [],
        [SubmissionStatus.WITHDRAWN]: [],
    };

    private readonly TERMINAL_STATES: SubmissionStatus[] = [SubmissionStatus.HIRED, SubmissionStatus.REJECTED, SubmissionStatus.WITHDRAWN];

    constructor(
        @InjectRepository(SubmissionStatusHistory)
        private readonly historyRepository: Repository<SubmissionStatusHistory>,
    ) { }

    /**
     * Validate and transition submission to new status
     * Throws if transition is invalid
     */
    validateTransition(currentStage: SubmissionStatus, newStage: string): void {
        if (!Object.values(SubmissionStatus).includes(newStage as SubmissionStatus)) {
            throw new BadRequestException(`Invalid status: ${newStage}`);
        }
        const next = newStage as SubmissionStatus;

        // HARD BLOCK: Terminal states cannot transition
        if (this.TERMINAL_STATES.includes(currentStage)) {
            throw new TerminalStateTransitionError(currentStage, next);
        }

        // Check if transition is allowed
        const allowedTransitions = this.VALID_TRANSITIONS[currentStage];
        if (!allowedTransitions.includes(next)) {
            throw new InvalidStatusTransitionError(
                currentStage,
                next,
                allowedTransitions,
            );
        }
    }

    /**
     * Validate that reason is provided for certain transitions
     */
    validateReasonRequired(newStatus: SubmissionStatus, reason?: string): void {
        const requiresReason = [SubmissionStatus.REJECTED, SubmissionStatus.WITHDRAWN];
        if (requiresReason.includes(newStatus) && !reason) {
            throw new BadRequestException(`Reason is required when transitioning to ${newStatus}`);
        }
    }

    /**
     * Log status transition to history
     */
    async logStatusHistory(
        submissionId: string,
        companyId: string,
        fromStage: SubmissionStatus | null,
        toStage: SubmissionStatus,
        changedByUserId: string,
        reason?: string,
    ): Promise<SubmissionStatusHistory> {
        const history = this.historyRepository.create({
            submission_id: submissionId,
            company_id: companyId,
            moved_from_stage: fromStage,
            moved_to_stage: toStage,
            created_by_id: changedByUserId,
            reason,
            created_at: new Date(),
        });

        return this.historyRepository.save(history);
    }

    /**
     * Get all status transitions for a submission
     */
    async getSubmissionHistory(submissionId: string): Promise<SubmissionStatusHistory[]> {
        return this.historyRepository.find({
            where: { submission_id: submissionId },
            order: { created_at: 'ASC' },
        });
    }
}
