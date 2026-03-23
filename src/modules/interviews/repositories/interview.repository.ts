import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Interview, InterviewStatus } from '../entities/interview.entity';
import { Submission } from '../../submissions/entities/submission.entity';

@Injectable()
export class InterviewRepository {
    constructor(
        @InjectRepository(Interview)
        private readonly repository: Repository<Interview>,
    ) { }

    /**
     * Create new interview
     */
    async create(data: Partial<Interview>): Promise<Interview> {
        const interview = this.repository.create(data);
        return this.repository.save(interview);
    }

    /**
     * Find interview by ID within tenant
     */
    async findOne(id: string, companyId: string): Promise<Interview | null> {
        return this.repository.findOne({
            where: { id, company_id: companyId } as FindOptionsWhere<Interview>,
            relations: ['submission', 'creator', 'updater', 'interviewers', 'feedback', 'status_history'],
        });
    }

    /**
     * Find all active interviews for submission
     */
    async findBySubmission(submissionId: string, companyId: string): Promise<Interview[]> {
        return this.repository.find({
            where: {
                company_id: companyId,
                submission_id: submissionId,
                deleted_at: null,
            } as FindOptionsWhere<Interview>,
            relations: ['interviewers', 'feedback'],
            order: { scheduled_start: 'ASC' },
        });
    }

    /**
     * Find upcoming interviews (tenant-scoped, non-deleted, scheduled only)
     */
    async findUpcoming(companyId: string, limit: number = 20): Promise<Interview[]> {
        const now = new Date();
        return this.repository
            .createQueryBuilder('iv')
            .where('iv.company_id = :companyId', { companyId })
            .andWhere('iv.status = :status', { status: InterviewStatus.SCHEDULED })
            .andWhere('iv.deleted_at IS NULL')
            .andWhere('iv.scheduled_start > :now', { now })
            .orderBy('iv.scheduled_start', 'ASC')
            .take(limit)
            .getMany();
    }

    /**
     * Find interviews with schedule conflict (active, non-cancelled, overlapping time window)
     */
    async findScheduleConflict(
        companyId: string,
        submissionId: string,
        scheduledStart: Date,
        scheduledEnd: Date,
        excludeId?: string,
    ): Promise<Interview | null> {
        let query = this.repository
            .createQueryBuilder('iv')
            .where('iv.company_id = :companyId', { companyId })
            .andWhere('iv.submission_id = :submissionId', { submissionId })
            .andWhere('iv.deleted_at IS NULL')
            .andWhere('iv.status != :cancelled', { cancelled: InterviewStatus.CANCELLED })
            .andWhere('iv.scheduled_start < :scheduledEnd AND iv.scheduled_end > :scheduledStart', {
                scheduledStart,
                scheduledEnd,
            });

        if (excludeId) {
            query = query.andWhere('iv.id != :excludeId', { excludeId });
        }

        return query.getOne();
    }

    /**
     * Update interview
     */
    async update(id: string, data: Partial<Interview>): Promise<Interview> {
        await this.repository.update(id, data);
        return this.repository.findOneOrFail({ where: { id } as FindOptionsWhere<Interview> });
    }

    /**
     * Soft delete interview
     */
    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deleted_at: new Date() });
    }

    /**
     * Count interviews by status within tenant
     */
    async countByStatus(companyId: string): Promise<Record<InterviewStatus, number>> {
        const results = await this.repository
            .createQueryBuilder('iv')
            .select('iv.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('iv.company_id = :companyId', { companyId })
            .andWhere('iv.deleted_at IS NULL')
            .groupBy('iv.status')
            .getRawMany();

        const counts: Record<InterviewStatus, number> = {
            [InterviewStatus.SCHEDULED]: 0,
            [InterviewStatus.COMPLETED]: 0,
            [InterviewStatus.CANCELLED]: 0,
            [InterviewStatus.RESCHEDULED]: 0,
            [InterviewStatus.NO_SHOW]: 0,
        };

        for (const result of results) {
            counts[result.status] = parseInt(result.count, 10);
        }

        return counts;
    }

    /**
     * Pagination query for interviews
     */
    async findPaginated(
        companyId: string,
        page: number = 1,
        limit: number = 20,
        filters?: { submissionId?: string; status?: InterviewStatus },
    ): Promise<{ data: Interview[]; total: number; page: number; limit: number }> {
        let query = this.repository
            .createQueryBuilder('iv')
            .where('iv.company_id = :companyId', { companyId })
            .andWhere('iv.deleted_at IS NULL');

        if (filters?.submissionId) {
            query = query.andWhere('iv.submission_id = :submissionId', { submissionId: filters.submissionId });
        }

        if (filters?.status) {
            query = query.andWhere('iv.status = :status', { status: filters.status });
        }

        const total = await query.getCount();
        const data = await query
            .leftJoinAndSelect('iv.interviewers', 'interviewers')
            .leftJoinAndSelect('iv.feedback', 'feedback')
            .orderBy('iv.scheduled_start', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total, page, limit };
    }
}
