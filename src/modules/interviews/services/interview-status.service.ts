import { Injectable, BadRequestException } from '@nestjs/common';
import { InterviewStatus } from '../entities/interview.entity';

/**
 * Immutable state machine for interview status transitions
 * Terminal states: CANCELLED (hard-blocking, no further transitions)
 * Update restriction: Only SCHEDULED interviews can be updated
 */
@Injectable()
export class InterviewStatusService {
    private readonly VALID_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> = {
        [InterviewStatus.SCHEDULED]: [
            InterviewStatus.COMPLETED,
            InterviewStatus.CANCELLED,
            InterviewStatus.RESCHEDULED,
            InterviewStatus.NO_SHOW,
        ],
        [InterviewStatus.COMPLETED]: [],
        [InterviewStatus.CANCELLED]: [],
        [InterviewStatus.RESCHEDULED]: [InterviewStatus.SCHEDULED, InterviewStatus.CANCELLED],
        [InterviewStatus.NO_SHOW]: [],
    };

    /**
     * Validate if transition is allowed
     */
    validateTransition(currentStatus: InterviewStatus, targetStatus: InterviewStatus): void {
        // Terminal states: block any transitions
        if (currentStatus === InterviewStatus.CANCELLED) {
            throw new BadRequestException(
                `Cannot transition from terminal status '${currentStatus}'. Current status is final.`,
            );
        }

        // Check valid transitions
        const allowedTargets = this.VALID_TRANSITIONS[currentStatus];
        if (!allowedTargets.includes(targetStatus)) {
            throw new BadRequestException(
                `Invalid transition from '${currentStatus}' to '${targetStatus}'. Allowed: ${allowedTargets.join(', ')}`,
            );
        }
    }

    /**
     * Get allowed next statuses for current status
     */
    getAllowedTransitions(currentStatus: InterviewStatus): InterviewStatus[] {
        return this.VALID_TRANSITIONS[currentStatus] || [];
    }

    /**
     * Check if status is terminal
     */
    isTerminal(status: InterviewStatus): boolean {
        return status === InterviewStatus.CANCELLED;
    }

    /**
     * Check if interview can be updated (only when scheduled)
     */
    canUpdate(currentStatus: InterviewStatus): boolean {
        return currentStatus === InterviewStatus.SCHEDULED;
    }

    /**
     * Get status description for UI/logging
     */
    getStatusDescription(status: InterviewStatus): string {
        const descriptions: Record<InterviewStatus, string> = {
            [InterviewStatus.SCHEDULED]: 'Interview scheduled and waiting',
            [InterviewStatus.COMPLETED]: 'Interview completed',
            [InterviewStatus.CANCELLED]: 'Interview cancelled (terminal)',
            [InterviewStatus.RESCHEDULED]: 'Interview rescheduled',
            [InterviewStatus.NO_SHOW]: 'Candidate no-show',
        };
        return descriptions[status];
    }
}
