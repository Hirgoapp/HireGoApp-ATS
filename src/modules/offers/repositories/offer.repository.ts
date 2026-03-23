import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatus } from '../entities/offer.entity';

interface ListFilters {
    submission_id?: string;
    status?: OfferStatus;
    from?: Date;
    to?: Date;
}

@Injectable()
export class OfferRepository {
    constructor(
        @InjectRepository(Offer)
        private readonly repo: Repository<Offer>,
    ) {}

    async createOffer(data: Partial<Offer>): Promise<Offer> {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }

    async findById(id: string, companyId: string): Promise<Offer | null> {
        return this.repo.findOne({
            where: { id, company_id: companyId, deleted_at: null },
        });
    }

    async list(
        companyId: string,
        skip = 0,
        take = 20,
        filters: ListFilters = {},
    ): Promise<{ data: Offer[]; total: number }> {
        const qb = this.repo
            .createQueryBuilder('o')
            .where('o.company_id = :companyId', { companyId })
            .andWhere('o.deleted_at IS NULL');

        if (filters.submission_id) {
            qb.andWhere('o.submission_id = :submissionId', { submissionId: filters.submission_id });
        }

        if (filters.status) {
            qb.andWhere('o.status = :status', { status: filters.status });
        }

        if (filters.from) {
            qb.andWhere('o.created_at >= :from', { from: filters.from });
        }

        if (filters.to) {
            qb.andWhere('o.created_at <= :to', { to: filters.to });
        }

        const [data, total] = await qb
            .skip(skip)
            .take(take)
            .orderBy('o.created_at', 'DESC')
            .getManyAndCount();

        return { data, total };
    }

    async update(
        id: string,
        companyId: string,
        data: Partial<Offer>,
    ): Promise<Offer | null> {
        await this.repo.update(
            { id, company_id: companyId, deleted_at: null },
            data,
        );
        return this.findById(id, companyId);
    }

    async softDelete(id: string, companyId: string): Promise<boolean> {
        const result = await this.repo.update(
            { id, company_id: companyId, deleted_at: null },
            { deleted_at: new Date() },
        );
        return result.affected !== undefined && result.affected > 0;
    }
}

