import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { OfferRepository } from '../repositories/offer.repository';
import { OfferStatusHistoryRepository } from '../repositories/offer-status-history.repository';
import { SubmissionRepository } from '../../modules/submissions/repositories/submission.repository';
import { OfferStatusService } from './offer-status.service';
import { Offer, OfferStatusEnum } from '../entities/offer.entity';
import { CreateOfferDto, UpdateOfferDto } from '../dtos/offer.dto';
import { SubmissionStatus } from '../../modules/submissions/entities/submission.entity';

@Injectable()
export class OfferService {
    constructor(
        private readonly offerRepository: OfferRepository,
        private readonly historyRepository: OfferStatusHistoryRepository,
        private readonly submissionRepository: SubmissionRepository,
        private readonly statusService: OfferStatusService,
    ) { }

    /**
     * Create new offer (always in draft state)
     */
    async createOffer(
        data: CreateOfferDto,
        companyId: string,
        createdById: number,
    ): Promise<Offer> {
        // Validate offer data
        this.validateOfferData(data);

        // Verify submission exists and belongs to company
        const submission = await this.submissionRepository.findById(
            data.submission_id,
            companyId,
        );
        if (!submission) {
            throw new NotFoundException('Submission not found');
        }

        // Check submission is eligible (status should be interview or offer)
        if (![SubmissionStatus.INTERVIEW, SubmissionStatus.OFFER].includes(submission.status)) {
            throw new BadRequestException(
                `Cannot create offer for submission in ${submission.status} status`,
            );
        }

        // Check for existing active offers
        const activeOffer = await this.offerRepository.findActiveBySubmission(
            data.submission_id,
            companyId,
        );
        if (activeOffer) {
            throw new ConflictException(
                'An active offer already exists for this submission',
            );
        }

        // Get next version number for this submission
        const version = await this.offerRepository.getNextOfferVersion(
            data.submission_id,
            companyId,
        );

        // Create offer
        const offer = await this.offerRepository.create({
            ...data,
            start_date: data.start_date ? new Date(data.start_date) : undefined,
            expiry_date: data.expiry_date ? new Date(data.expiry_date) : undefined,
            company_id: companyId,
            status: OfferStatusEnum.DRAFT,
            offer_version: version,
            created_by_id: createdById,
            updated_by_id: createdById,
        });

        // Log initial status
        await this.historyRepository.create({
            company_id: companyId,
            offer_id: offer.id,
            old_status: null,
            new_status: OfferStatusEnum.DRAFT,
            changed_by_id: createdById,
            reason: 'Offer created',
            metadata: {},
        });

        return offer;
    }

    /**
     * Get single offer by ID
     */
    async getOffer(id: string, companyId: string): Promise<Offer> {
        const offer = await this.offerRepository.findOne(id, companyId);
        if (!offer) {
            throw new NotFoundException('Offer not found');
        }
        return offer;
    }

    /**
     * Get all offers for a submission
     */
    async getOffersBySubmission(
        submissionId: string,
        companyId: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{ data: Offer[]; total: number; page: number; limit: number }> {
        return this.offerRepository.findBySubmission(submissionId, companyId, page, limit);
    }

    /**
     * Get all offers with pagination
     */
    async getAllOffers(
        companyId: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{ data: Offer[]; total: number; page: number; limit: number }> {
        return this.offerRepository.getPaginated(companyId, page, limit);
    }

    /**
     * Update offer (only draft offers can be updated)
     */
    async updateOffer(
        id: string,
        data: UpdateOfferDto,
        companyId: string,
        userId: number,
    ): Promise<Offer> {
        const offer = await this.getOffer(id, companyId);

        // Only draft offers can be updated
        if (!this.statusService.canUpdate(offer.status)) {
            throw new BadRequestException(
                `Cannot update offer in ${offer.status} status. Only draft offers can be updated.`,
            );
        }

        // Validate updated data
        this.validateOfferData(data);

        // Build updates object manually (safer than spreading DTO)
        const updates: Partial<Offer> = {
            updated_by_id: userId,
        };

        if (data.base_salary !== undefined) {
            updates.base_salary = data.base_salary;
        }
        if (data.bonus !== undefined) {
            updates.bonus = data.bonus;
        }
        if (data.equity !== undefined) {
            updates.equity = data.equity;
        }
        if (data.employment_type !== undefined) {
            updates.employment_type = data.employment_type;
        }
        if (data.start_date !== undefined) {
            updates.start_date = data.start_date ? new Date(data.start_date) : null;
        }
        if (data.expiry_date !== undefined) {
            updates.expiry_date = data.expiry_date ? new Date(data.expiry_date) : null;
        }
        if (data.notes !== undefined) {
            updates.notes = data.notes;
        }
        if (data.currency !== undefined) {
            updates.currency = data.currency;
        }

        return this.offerRepository.update(id, updates);
    }

    /**
     * Issue offer (draft → issued)
     */
    async issueOffer(
        id: string,
        companyId: string,
        userId: number,
        reason?: string,
    ): Promise<Offer> {
        const offer = await this.getOffer(id, companyId);

        // Validate transition
        this.statusService.validateTransition(
            offer.status,
            OfferStatusEnum.ISSUED,
        );

        // Check expiry date not in past
        if (offer.expiry_date && offer.expiry_date < new Date()) {
            throw new BadRequestException('Offer expiry date cannot be in the past');
        }

        // Check no other issued offer exists
        const activeOffer = await this.offerRepository.findActiveBySubmission(
            offer.submission_id,
            companyId,
        );
        if (activeOffer && activeOffer.id !== id) {
            throw new ConflictException(
                'Another active offer already exists for this submission',
            );
        }

        // Update offer status
        const updated = await this.offerRepository.update(id, {
            status: OfferStatusEnum.ISSUED,
            updated_by_id: userId,
        });

        // Log status change
        await this.historyRepository.create({
            company_id: companyId,
            offer_id: id,
            old_status: offer.status,
            new_status: OfferStatusEnum.ISSUED,
            changed_by_id: userId,
            reason: reason || null,
            metadata: {},
        });

        // Update submission status to 'offer'
        await this.submissionRepository.update(offer.submission_id, companyId, {
            status: SubmissionStatus.OFFER,
        });

        return updated;
    }

    /**
     * Accept offer (issued → accepted)
     */
    async acceptOffer(
        id: string,
        companyId: string,
        userId: number,
        metadata?: Record<string, any>,
    ): Promise<Offer> {
        const offer = await this.getOffer(id, companyId);

        // Validate transition
        this.statusService.validateTransition(
            offer.status,
            OfferStatusEnum.ACCEPTED,
        );

        // Check not expired
        if (offer.expiry_date && offer.expiry_date < new Date()) {
            throw new BadRequestException('Cannot accept expired offer');
        }

        // Update offer status
        const updated = await this.offerRepository.update(id, {
            status: OfferStatusEnum.ACCEPTED,
            updated_by_id: userId,
        });

        // Log status change
        await this.historyRepository.create({
            company_id: companyId,
            offer_id: id,
            old_status: offer.status,
            new_status: OfferStatusEnum.ACCEPTED,
            changed_by_id: userId,
            reason: null,
            metadata: metadata || {},
        });

        // Update submission status to 'hired'
        await this.submissionRepository.update(offer.submission_id, companyId, {
            status: SubmissionStatus.HIRED,
        });

        return updated;
    }

    /**
     * Reject offer (issued → rejected)
     */
    async rejectOffer(
        id: string,
        companyId: string,
        userId: number,
        reason?: string,
        metadata?: Record<string, any>,
    ): Promise<Offer> {
        const offer = await this.getOffer(id, companyId);

        // Validate transition
        this.statusService.validateTransition(
            offer.status,
            OfferStatusEnum.REJECTED,
        );

        // Update offer status
        const updated = await this.offerRepository.update(id, {
            status: OfferStatusEnum.REJECTED,
            updated_by_id: userId,
        });

        // Log status change
        await this.historyRepository.create({
            company_id: companyId,
            offer_id: id,
            old_status: offer.status,
            new_status: OfferStatusEnum.REJECTED,
            changed_by_id: userId,
            reason: reason || null,
            metadata: metadata || {},
        });

        // Update submission status back to 'interview'
        await this.submissionRepository.update(offer.submission_id, companyId, {
            status: SubmissionStatus.INTERVIEW,
        });

        return updated;
    }

    /**
     * Withdraw offer (issued → withdrawn)
     */
    async withdrawOffer(
        id: string,
        companyId: string,
        userId: number,
        reason: string,
    ): Promise<Offer> {
        const offer = await this.getOffer(id, companyId);

        // Validate transition
        this.statusService.validateTransition(
            offer.status,
            OfferStatusEnum.WITHDRAWN,
        );

        // Update offer status
        const updated = await this.offerRepository.update(id, {
            status: OfferStatusEnum.WITHDRAWN,
            updated_by_id: userId,
        });

        // Log status change
        await this.historyRepository.create({
            company_id: companyId,
            offer_id: id,
            old_status: offer.status,
            new_status: OfferStatusEnum.WITHDRAWN,
            changed_by_id: userId,
            reason: reason,
            metadata: {},
        });

        // Update submission status back to 'interview'
        await this.submissionRepository.update(offer.submission_id, companyId, {
            status: SubmissionStatus.INTERVIEW,
        });

        return updated;
    }

    /**
     * Delete offer (soft delete - only draft offers)
     */
    async deleteOffer(id: string, companyId: string): Promise<void> {
        const offer = await this.getOffer(id, companyId);

        // Only draft offers can be deleted
        if (!this.statusService.canUpdate(offer.status)) {
            throw new BadRequestException(
                `Cannot delete offer in ${offer.status} status. Only draft offers can be deleted.`,
            );
        }

        await this.offerRepository.delete(id);
    }

    /**
     * Get status history for an offer
     */
    async getStatusHistory(
        offerId: string,
        companyId: string,
    ): Promise<any[]> {
        return this.historyRepository.findByOfferId(offerId, companyId);
    }

    /**
     * Get offer statistics (count by status)
     */
    async getStatistics(companyId: string): Promise<Record<string, number>> {
        return this.offerRepository.countAllStatuses(companyId);
    }

    /**
     * Validate offer data (private helper)
     */
    private validateOfferData(
        data: CreateOfferDto | UpdateOfferDto,
    ): void {
        if (data.base_salary !== undefined && data.base_salary < 0) {
            throw new BadRequestException('Base salary cannot be negative');
        }

        if (data.bonus !== undefined && data.bonus < 0) {
            throw new BadRequestException('Bonus cannot be negative');
        }

        if (data.start_date && data.expiry_date) {
            const start = new Date(data.start_date);
            const expiry = new Date(data.expiry_date);
            if (expiry <= start) {
                throw new BadRequestException('Expiry date must be after start date');
            }
        }
    }
}
