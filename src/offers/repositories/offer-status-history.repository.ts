import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferStatusHistory } from '../entities/offer-status-history.entity';
import { OfferStatusEnum } from '../entities/offer.entity';

@Injectable()
export class OfferStatusHistoryRepository {
    constructor(
        @InjectRepository(OfferStatusHistory)
        private readonly repository: Repository<OfferStatusHistory>,
    ) { }

    async create(data: Partial<OfferStatusHistory>): Promise<OfferStatusHistory> {
        const history = this.repository.create(data);
        return this.repository.save(history);
    }

    async findByOfferId(
        offerId: string,
        companyId: string,
    ): Promise<OfferStatusHistory[]> {
        return this.repository.find({
            where: { offer_id: offerId, company_id: companyId },
            relations: ['offer', 'company', 'changed_by'],
            order: { changed_at: 'ASC' },
        });
    }

    async findByOfferIdPaginated(
        offerId: string,
        companyId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ data: OfferStatusHistory[]; total: number }> {
        const [data, total] = await this.repository.findAndCount({
            where: { offer_id: offerId, company_id: companyId },
            relations: ['offer', 'company', 'changed_by'],
            order: { changed_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }

    async getLatestStatusChange(
        offerId: string,
        companyId: string,
    ): Promise<OfferStatusHistory | null> {
        return this.repository.findOne({
            where: { offer_id: offerId, company_id: companyId },
            relations: ['offer', 'company', 'changed_by'],
            order: { changed_at: 'DESC' },
        });
    }

    async countReachedStatus(
        companyId: string,
        status: OfferStatusEnum,
    ): Promise<number> {
        return this.repository.count({
            where: {
                company_id: companyId,
                new_status: status,
            },
        });
    }

    async getTransitionTimeline(
        offerId: string,
        companyId: string,
    ): Promise<OfferStatusHistory[]> {
        return this.repository.find({
            where: { offer_id: offerId, company_id: companyId },
            relations: ['offer', 'changed_by'],
            order: { changed_at: 'ASC' },
        });
    }
}
