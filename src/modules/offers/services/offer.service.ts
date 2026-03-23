import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { OfferRepository } from '../repositories/offer.repository';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { UpdateOfferStatusDto } from '../dto/update-status.dto';
import { Submission } from '../../submissions/entities/submission.entity';
import { SubmissionRepository } from '../../submissions/repositories/submission.repository';
import { ActivityService } from '../../../activity/services/activity.service';
import { AuditService } from '../../../common/services/audit.service';

@Injectable()
export class OfferService {
    constructor(
        private readonly offerRepository: OfferRepository,
        private readonly submissionRepository: SubmissionRepository,
        @InjectRepository(Submission)
        private readonly submissionDb: Repository<Submission>,
        private readonly activityService: ActivityService,
        private readonly auditService: AuditService,
    ) {}

    async createOffer(
        companyId: string,
        userId: string,
        dto: CreateOfferDto,
    ): Promise<Offer> {
        const submission = await this.submissionRepository.findById(
            dto.submission_id,
            companyId,
        );

        if (!submission) {
            throw new NotFoundException('Submission not found for this company');
        }

        const offer = await this.offerRepository.createOffer({
            company_id: companyId,
            submission_id: submission.id,
            current_version: 1,
            offer_version: 1,
            status: OfferStatus.DRAFT,
            ctc: dto.offered_ctc != null ? String(dto.offered_ctc) : '0',
            breakup: {},
            designation: (dto as any).designation ?? 'Software Engineer',
            joining_date: dto.joining_date ? new Date(dto.joining_date) : new Date(),
            department: (dto as any).department ?? null,
            reporting_manager: null,
            location: null,
            terms_and_conditions: null,
            rejection_reason: null,
            internal_notes: dto.notes ?? null,
            sent_at: null,
            expires_at: null,
            accepted_at: null,
            closed_at: null,
            created_by_id: userId,
            updated_by_id: userId,
            currency: dto.currency_code ?? 'USD',
            base_salary: null,
            bonus: null,
            equity: null,
            employment_type: 'full_time',
            start_date: dto.joining_date ? new Date(dto.joining_date) : null,
            expiry_date: null,
            notes: dto.notes ?? null,
        });

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'offer',
            entityId: offer.id,
            activityType: 'offer_created',
            message: 'Offer created',
            metadata: {
                submissionId: submission.id,
                candidateId: submission.candidate_id,
                jobId: submission.job_id,
                joiningDate: offer.joining_date,
            },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'offer',
            entityId: offer.id,
            action: 'CREATE',
            newValues: offer,
        });

        return offer;
    }

    async listOffers(
        companyId: string,
        skip = 0,
        take = 20,
        filters: {
            submission_id?: string;
            status?: OfferStatus;
            from?: Date;
            to?: Date;
        },
    ): Promise<{ data: Offer[]; total: number; skip: number; take: number }> {
        const { data, total } = await this.offerRepository.list(
            companyId,
            skip,
            take,
            filters,
        );
        return { data, total, skip, take };
    }

    async getOfferById(companyId: string, id: string): Promise<Offer> {
        const offer = await this.offerRepository.findById(id, companyId);
        if (!offer) {
            throw new NotFoundException('Offer not found');
        }
        return offer;
    }

    async updateOffer(
        companyId: string,
        userId: string,
        id: string,
        dto: UpdateOfferDto,
    ): Promise<Offer> {
        const offer = await this.getOfferById(companyId, id);
        const oldValues = { ...offer };

        const updated = await this.offerRepository.update(id, companyId, {
            ctc: dto.offered_ctc != null ? String(dto.offered_ctc) : offer.ctc,
            currency: dto.currency_code ?? offer.currency,
            joining_date: dto.joining_date ? new Date(dto.joining_date) : offer.joining_date,
            internal_notes: dto.notes ?? offer.internal_notes,
            notes: dto.notes ?? offer.notes,
            updated_by_id: userId,
            updated_at: new Date(),
        });

        if (!updated) {
            throw new BadRequestException('Failed to update offer');
        }

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'offer',
            entityId: id,
            activityType: 'offer_updated',
            message: 'Offer details updated',
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'offer',
            entityId: id,
            action: 'UPDATE',
            oldValues,
            newValues: updated,
        });

        return updated;
    }

    async updateOfferStatus(
        companyId: string,
        userId: string,
        id: string,
        dto: UpdateOfferStatusDto,
    ): Promise<Offer> {
        const offer = await this.getOfferById(companyId, id);
        const oldValues = { ...offer };

        const status = dto.status as OfferStatus;

        const updated = await this.offerRepository.update(id, companyId, {
            status,
            notes: dto.notes ?? offer.notes,
            updated_by_id: userId,
            updated_at: new Date(),
        });

        if (!updated) {
            throw new BadRequestException('Failed to update offer status');
        }

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'offer',
            entityId: id,
            activityType: 'offer_status_updated',
            message: `Offer status updated: ${offer.status} → ${status}`,
            metadata: {
                oldStatus: offer.status,
                newStatus: status,
            },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'offer',
            entityId: id,
            action: 'UPDATE',
            oldValues,
            newValues: updated,
        });

        return updated;
    }

    async deleteOffer(
        companyId: string,
        userId: string,
        id: string,
    ): Promise<void> {
        const offer = await this.getOfferById(companyId, id);

        const success = await this.offerRepository.softDelete(id, companyId);
        if (!success) {
            throw new BadRequestException('Failed to delete offer');
        }

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'offer',
            entityId: id,
            activityType: 'offer_deleted',
            message: 'Offer deleted',
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'offer',
            entityId: id,
            action: 'DELETE',
            oldValues: offer,
            newValues: null,
        });
    }
}

