import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { InterviewFeedback, Recommendation } from '../entities/interview-feedback.entity';

@Injectable()
export class InterviewFeedbackRepository {
    constructor(
        @InjectRepository(InterviewFeedback)
        private readonly repository: Repository<InterviewFeedback>,
    ) { }

    /**
     * Create feedback entry
     */
    async create(data: Partial<InterviewFeedback>): Promise<InterviewFeedback> {
        const feedback = this.repository.create(data);
        return this.repository.save(feedback);
    }

    /**
     * Find feedback by ID
     */
    async findOne(id: string, companyId: string): Promise<InterviewFeedback | null> {
        return this.repository.findOne({
            where: { id, company_id: companyId } as FindOptionsWhere<InterviewFeedback>,
            relations: ['interview', 'reviewer'],
        });
    }

    /**
     * Find all feedback for interview
     */
    async findByInterview(interviewId: string, companyId: string): Promise<InterviewFeedback[]> {
        return this.repository.find({
            where: {
                interview_id: interviewId,
                company_id: companyId,
            } as FindOptionsWhere<InterviewFeedback>,
            relations: ['reviewer'],
            order: { submitted_at: 'DESC' },
        });
    }

    /**
     * Find feedback from specific reviewer on interview
     */
    async findByReviewer(interviewId: string, reviewerId: string, companyId: string): Promise<InterviewFeedback | null> {
        return this.repository.findOne({
            where: {
                interview_id: interviewId,
                reviewer_id: reviewerId,
                company_id: companyId,
            } as FindOptionsWhere<InterviewFeedback>,
        });
    }

    /**
     * Check if reviewer has already submitted feedback
     */
    async hasReviewerFeedback(interviewId: string, reviewerId: string): Promise<boolean> {
        const count = await this.repository.count({
            where: {
                interview_id: interviewId,
                reviewer_id: reviewerId,
            } as FindOptionsWhere<InterviewFeedback>,
        });
        return count > 0;
    }

    /**
     * Get feedback summary for interview
     */
    async getFeedbackSummary(interviewId: string, companyId: string): Promise<{
        totalReviewers: number;
        averageRating: number;
        recommendationCounts: Record<Recommendation, number>;
    }> {
        const feedback = await this.findByInterview(interviewId, companyId);
        const recommendationCounts: Record<Recommendation, number> = {
            [Recommendation.HIRE]: 0,
            [Recommendation.NO_HIRE]: 0,
            [Recommendation.NEUTRAL]: 0,
        };

        let totalRating = 0;
        for (const fb of feedback) {
            totalRating += Number(fb.rating);
            recommendationCounts[fb.recommendation]++;
        }

        return {
            totalReviewers: feedback.length,
            averageRating: feedback.length > 0 ? totalRating / feedback.length : 0,
            recommendationCounts,
        };
    }

    /**
     * Update feedback
     */
    async update(id: string, data: Partial<InterviewFeedback>): Promise<InterviewFeedback> {
        await this.repository.update(id, data);
        return this.repository.findOneOrFail({ where: { id } as FindOptionsWhere<InterviewFeedback> });
    }

    /**
     * Delete feedback (hard delete)
     */
    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
