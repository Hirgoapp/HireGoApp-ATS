import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview, InterviewRound, InterviewStatus } from '../entities/interview.entity';

export interface FindInterviewsOptions {
    skip?: number;
    take?: number;
    submission_id?: string;
    interviewer_id?: string;
    round?: InterviewRound;
    status?: InterviewStatus;
    from_date?: string;
    to_date?: string;
    orderBy?: 'created_at' | 'updated_at' | 'scheduled_date';
    orderDirection?: 'ASC' | 'DESC';
}

@Injectable()
export class InterviewRepository {
    constructor(
        @InjectRepository(Interview)
        private readonly repository: Repository<Interview>,
    ) { }

    async create(data: Partial<Interview>): Promise<Interview> {
        const interview = this.repository.create(data);
        return await this.repository.save(interview);
    }

    async findById(id: string, companyId: string): Promise<Interview | null> {
        return await this.repository.findOne({
            where: { id, company_id: companyId, deleted_at: null },
        });
    }

    async findAll(
        companyId: string,
        options?: FindInterviewsOptions,
    ): Promise<{ data: Interview[]; total: number }> {
        const query = this.repository.createQueryBuilder('interview');

        query.where('interview.company_id = :companyId', { companyId });
        query.andWhere('interview.deleted_at IS NULL');

        if (options?.submission_id !== undefined) {
            query.andWhere('interview.submission_id = :submission_id', {
                submission_id: options.submission_id,
            });
        }

        if (options?.interviewer_id !== undefined) {
            query.andWhere('interview.interviewer_id = :interviewer_id', {
                interviewer_id: options.interviewer_id,
            });
        }

        if (options?.round) {
            query.andWhere('interview.round = :round', { round: options.round });
        }

        if (options?.status) {
            query.andWhere('interview.status = :status', { status: options.status });
        }

        if (options?.from_date) {
            query.andWhere('interview.scheduled_date >= :from_date', {
                from_date: options.from_date,
            });
        }

        if (options?.to_date) {
            query.andWhere('interview.scheduled_date <= :to_date', {
                to_date: options.to_date,
            });
        }

        const orderBy = options?.orderBy ?? 'created_at';
        const orderDirection = options?.orderDirection ?? 'DESC';
        query.orderBy(`interview.${orderBy}`, orderDirection);

        const skip = options?.skip ?? 0;
        const take = options?.take ?? 20;
        query.skip(skip).take(take);

        const [data, total] = await query.getManyAndCount();
        return { data, total };
    }

    async findBySubmission(submissionId: string, companyId: string): Promise<Interview[]> {
        return await this.repository.find({
            where: {
                submission_id: submissionId,
                company_id: companyId,
                deleted_at: null,
            },
            order: { scheduled_date: 'DESC' },
        });
    }

    async update(interview: Interview): Promise<Interview> {
        return await this.repository.save(interview);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deleted_at: new Date() });
    }

    async count(companyId: string): Promise<number> {
        return await this.repository.count({
            where: {
                company_id: companyId,
                deleted_at: null,
            },
        });
    }

    async countByRound(companyId: string, round: InterviewRound): Promise<number> {
        return await this.repository.count({
            where: {
                company_id: companyId,
                round,
                deleted_at: null,
            },
        });
    }

    async countByStatus(companyId: string, status: InterviewStatus): Promise<number> {
        return await this.repository.count({
            where: {
                company_id: companyId,
                status,
                deleted_at: null,
            },
        });
    }

    async countBySubmission(submissionId: string, companyId: string): Promise<number> {
        return await this.repository.count({
            where: {
                company_id: companyId,
                submission_id: submissionId,
                deleted_at: null,
            },
        });
    }

    /**
     * Find interviews with feedback
     */
    async findWithFeedback(companyId: string): Promise<Interview[]> {
        return await this.repository
            .createQueryBuilder('interview')
            .where('interview.company_id = :companyId', { companyId })
            .andWhere('interview.deleted_at IS NULL')
            .andWhere('interview.feedback IS NOT NULL')
            .orderBy('interview.updated_at', 'DESC')
            .getMany();
    }
}
