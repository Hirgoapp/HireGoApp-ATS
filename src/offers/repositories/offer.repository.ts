import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatusEnum } from '../entities/offer.entity';

@Injectable()
export class OfferRepository {
    constructor(
        @InjectRepository(Offer)
        private readonly repository: Repository<Offer>,
    ) { }

    async create(data: Partial<Offer>): Promise<Offer> {
        const offer = this.repository.create(data);
        return this.repository.save(offer);
    }

    async findOne(id: string, companyId: string): Promise<Offer | null> {
        return this.repository.findOne({
            where: { id, company_id: companyId, deleted_at: null },
            relations: ['company', 'submission', 'created_by', 'updated_by'],
        });
    }

    async findBySubmission(
        submissionId: string,
        companyId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ data: Offer[]; total: number; page: number; limit: number }> {
        const [data, total] = await this.repository.findAndCount({
            where: {
                submission_id: submissionId,
                company_id: companyId,
                deleted_at: null,
            },
            relations: ['company', 'submission', 'created_by', 'updated_by'],
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total, page, limit };
    }

    async findActiveBySubmission(
        submissionId: string,
        companyId: string,
    ): Promise<Offer | null> {
        return this.repository.findOne({
            where: {
                submission_id: submissionId,
                company_id: companyId,
                status: OfferStatusEnum.ISSUED,
                deleted_at: null,
            },
            relations: ['company', 'submission', 'created_by', 'updated_by'],
        });
    }

    async findLatestBySubmission(
        submissionId: string,
        companyId: string,
    ): Promise<Offer | null> {
        return this.repository.findOne({
            where: {
                submission_id: submissionId,
                company_id: companyId,
                deleted_at: null,
            },
            relations: ['company', 'submission', 'created_by', 'updated_by'],
            order: { offer_version: 'DESC' },
        });
    }

    async countByStatus(
        companyId: string,
        status: OfferStatusEnum,
    ): Promise<number> {
        return this.repository.count({
            where: {
                company_id: companyId,
                status,
                deleted_at: null,
            },
        });
    }

    async countAllStatuses(companyId: string): Promise<Record<string, number>> {
        const statuses = Object.values(OfferStatusEnum);
        const counts: Record<string, number> = {};

        for (const status of statuses) {
            counts[status] = await this.countByStatus(companyId, status);
        }

        return counts;
    }

    async getPaginated(
        companyId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ data: Offer[]; total: number; page: number; limit: number }> {
        const [data, total] = await this.repository.findAndCount({
            where: {
                company_id: companyId,
                deleted_at: null,
            },
            relations: ['company', 'submission', 'created_by', 'updated_by'],
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total, page, limit };
    }

    async update(id: string, data: Partial<Offer>): Promise<Offer> {
        await this.repository.update(id, data);
        return this.repository.findOneBy({ id });
    }

    async delete(id: string): Promise<void> {
        await this.repository.update(id, { deleted_at: new Date() });
    }

    async getNextOfferVersion(
        submissionId: string,
        companyId: string,
    ): Promise<number> {
        const latest = await this.findLatestBySubmission(submissionId, companyId);
        return latest ? latest.offer_version + 1 : 1;
    }
}
