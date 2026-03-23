import { Injectable, BadRequestException } from '@nestjs/common';
import { OfferStatusEnum } from '../entities/offer.entity';

@Injectable()
export class OfferStatusService {
    // Immutable state machine
    private readonly VALID_TRANSITIONS: Record<
        OfferStatusEnum,
        OfferStatusEnum[]
    > = {
            [OfferStatusEnum.DRAFT]: [OfferStatusEnum.ISSUED],
            [OfferStatusEnum.ISSUED]: [
                OfferStatusEnum.ACCEPTED,
                OfferStatusEnum.REJECTED,
                OfferStatusEnum.WITHDRAWN,
            ],
            [OfferStatusEnum.ACCEPTED]: [],
            [OfferStatusEnum.REJECTED]: [],
            [OfferStatusEnum.WITHDRAWN]: [],
        };

    private readonly TERMINAL_STATES = new Set<OfferStatusEnum>([
        OfferStatusEnum.ACCEPTED,
        OfferStatusEnum.REJECTED,
        OfferStatusEnum.WITHDRAWN,
    ]);

    /**
     * Validate that a transition is allowed
     */
    validateTransition(
        currentStatus: OfferStatusEnum,
        targetStatus: OfferStatusEnum,
    ): void {
        const allowedTransitions = this.VALID_TRANSITIONS[currentStatus];

        if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
            throw new BadRequestException(
                `Cannot transition from ${currentStatus} to ${targetStatus}`,
            );
        }
    }

    /**
     * Get all allowed transitions from current status
     */
    getAllowedTransitions(status: OfferStatusEnum): OfferStatusEnum[] {
        return this.VALID_TRANSITIONS[status] || [];
    }

    /**
     * Check if a status is terminal
     */
    isTerminal(status: OfferStatusEnum): boolean {
        return this.TERMINAL_STATES.has(status);
    }

    /**
     * Check if an offer can be updated (only drafts)
     */
    canUpdate(status: OfferStatusEnum): boolean {
        return status === OfferStatusEnum.DRAFT;
    }

    /**
     * Get human-readable status description
     */
    getStatusDescription(status: OfferStatusEnum): string {
        const descriptions: Record<OfferStatusEnum, string> = {
            [OfferStatusEnum.DRAFT]: 'Offer is in draft, not yet sent',
            [OfferStatusEnum.ISSUED]: 'Offer has been issued to candidate',
            [OfferStatusEnum.ACCEPTED]: 'Candidate has accepted the offer',
            [OfferStatusEnum.REJECTED]: 'Candidate has rejected the offer',
            [OfferStatusEnum.WITHDRAWN]: 'Offer has been withdrawn by recruiter',
        };

        return descriptions[status];
    }

    /**
     * Check if offer is in a terminal state (hard block)
     */
    assertNotTerminal(status: OfferStatusEnum): void {
        if (this.isTerminal(status)) {
            throw new BadRequestException(
                `Cannot modify offer in terminal state: ${status}`,
            );
        }
    }
}
