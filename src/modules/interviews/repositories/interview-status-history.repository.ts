import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { InterviewStatusHistory } from '../entities/interview-status-history.entity';
import { InterviewStatus } from '../entities/interview.entity';

@Injectable()
export class InterviewStatusHistoryRepository {
    constructor(
        @InjectRepository(InterviewStatusHistory)
        private readonly repository: Repository<InterviewStatusHistory>,
    ) { }

    /**
     * Record status change
     */
    async recordStatusChange(data: Partial<InterviewStatusHistory>): Promise<InterviewStatusHistory> {
        const history = this.repository.create(data);
        return this.repository.save(history);
    }

    /**
     * Find all status history for interview
     */
    async findByInterview(interviewId: string, companyId: string): Promise<InterviewStatusHistory[]> {
        return this.repository.find({
            where: {
                interview_id: interviewId,
                company_id: companyId,
            } as FindOptionsWhere<InterviewStatusHistory>,
            relations: ['changed_by_user'],
            order: { changed_at: 'ASC' },
        });
    }

    /**
     * Get latest status change for interview
     */
    async getLatestStatusChange(interviewId: string, companyId: string): Promise<InterviewStatusHistory | null> {
        return this.repository.findOne({
            where: {
                interview_id: interviewId,
                company_id: companyId,
            } as FindOptionsWhere<InterviewStatusHistory>,
            relations: ['changed_by_user'],
            order: { changed_at: 'DESC' },
        });
    }

    /**
     * Get count of interviews reaching a specific status
     */
    async countReachedStatus(companyId: string, status: InterviewStatus): Promise<number> {
        return this.repository.count({
            where: {
                company_id: companyId,
                status,
            } as FindOptionsWhere<InterviewStatusHistory>,
        });
    }

    /**
     * Get average time from scheduled to completed (in minutes)
     */
    async getAverageTimeToComplete(companyId: string): Promise<number> {
        const result = await this.repository
            .createQueryBuilder('h1')
            .select(
                'AVG(EXTRACT(EPOCH FROM (h2.changed_at - h1.changed_at)) / 60)',
                'avg_minutes',
            )
            .innerJoin(
                InterviewStatusHistory,
                'h2',
                'h2.interview_id = h1.interview_id AND h2.status = :completedStatus AND h2.changed_at > h1.changed_at',
                { completedStatus: InterviewStatus.COMPLETED },
            )
            .where('h1.company_id = :companyId', { companyId })
            .andWhere('h1.status = :scheduledStatus', { scheduledStatus: InterviewStatus.SCHEDULED })
            .getRawOne();

        return result?.avg_minutes ? parseFloat(result.avg_minutes) : 0;
    }

    /**
     * Delete all history for interview (on cascade)
     */
    async deleteByInterview(interviewId: string): Promise<void> {
        await this.repository.delete({ interview_id: interviewId });
    }
}
