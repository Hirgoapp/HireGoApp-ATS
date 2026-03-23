import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewInterviewer, InterviewerRole } from '../entities/interview-interviewer.entity';
import { InterviewFeedback, Recommendation } from '../entities/interview-feedback.entity';
import { Interview, InterviewStatus } from '../entities/interview.entity';
import { InterviewRepository } from '../repositories/interview.repository';
import { InterviewFeedbackRepository } from '../repositories/interview-feedback.repository';

@Injectable()
export class InterviewAssignmentService {
    constructor(
        @InjectRepository(InterviewInterviewer)
        private readonly assignmentRepository: Repository<InterviewInterviewer>,
        @InjectRepository(Interview)
        private readonly interviewRepository: Repository<Interview>,
        private readonly interviewRepo: InterviewRepository,
        private readonly feedbackRepository: InterviewFeedbackRepository,
    ) { }

    /**
     * Assign interviewer to interview (unique constraint per interview + user)
     */
    async assignInterviewer(
        interviewId: string,
        userId: string,
        role: InterviewerRole,
        companyId: string,
    ): Promise<InterviewInterviewer> {
        // Verify interview exists and belongs to company
        const interview = await this.interviewRepo.findOne(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        // Check for duplicate assignment
        const existing = await this.assignmentRepository.findOne({
            where: {
                interview_id: interviewId,
                interviewer_id: userId,
            },
        });

        if (existing) {
            throw new BadRequestException('Interviewer is already assigned to this interview');
        }

        // Create assignment
        const assignment = this.assignmentRepository.create({
            company_id: companyId,
            interview_id: interviewId,
            interviewer_id: userId,
            role,
        });

        return this.assignmentRepository.save(assignment);
    }

    /**
     * Remove interviewer from interview
     */
    async removeInterviewer(interviewId: string, userId: string, companyId: string): Promise<void> {
        // Verify interview
        const interview = await this.interviewRepo.findOne(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        await this.assignmentRepository.delete({
            interview_id: interviewId,
            interviewer_id: userId,
            company_id: companyId,
        });
    }

    /**
     * Get all interviewers assigned to interview
     */
    async getInterviewers(interviewId: string, companyId: string): Promise<InterviewInterviewer[]> {
        // Verify interview
        const interview = await this.interviewRepo.findOne(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        return this.assignmentRepository.find({
            where: {
                interview_id: interviewId,
                company_id: companyId,
            },
            relations: ['user'],
        });
    }

    /**
     * Submit feedback on interview (assigned-only, after completion)
     */
    async submitFeedback(
        interviewId: string,
        reviewerId: string,
        rating: number,
        recommendation: Recommendation,
        comments: string | null,
        companyId: string,
    ): Promise<InterviewFeedback> {
        // Verify interview exists and is completed
        const interview = await this.interviewRepo.findOne(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        if (interview.status !== InterviewStatus.COMPLETED) {
            throw new BadRequestException('Feedback can only be submitted for completed interviews');
        }

        // Verify reviewer is assigned to interview
        const assignment = await this.assignmentRepository.findOne({
            where: {
                interview_id: interviewId,
                interviewer_id: reviewerId,
                company_id: companyId,
            },
        });

        if (!assignment) {
            throw new ForbiddenException('Reviewer is not assigned to this interview');
        }

        // Check for duplicate feedback
        const existingFeedback = await this.feedbackRepository.findByReviewer(interviewId, reviewerId, companyId);
        if (existingFeedback) {
            throw new BadRequestException('Feedback from this reviewer already exists');
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        // Create and save feedback
        return await this.feedbackRepository.create({
            company_id: companyId,
            interview_id: interviewId,
            reviewer_id: reviewerId,
            rating,
            recommendation,
            comments: comments ?? null,
        });
    }

    /**
     * View feedback for interview (assigned interviewers and hiring managers can view)
     */
    async viewFeedback(
        interviewId: string,
        requesterId: string,
        companyId: string,
    ): Promise<InterviewFeedback[]> {
        // Verify interview exists
        const interview = await this.interviewRepo.findOne(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        // Verify requester is assigned or is hiring manager
        const assignment = await this.assignmentRepository.findOne({
            where: {
                interview_id: interviewId,
                interviewer_id: requesterId,
                company_id: companyId,
            },
        });

        // Only assigned interviewers can view feedback
        // (role-based access control handled at controller/guard level)
        if (!assignment) {
            throw new ForbiddenException('You do not have permission to view feedback for this interview');
        }

        return await this.feedbackRepository.findByInterview(interviewId, companyId);
    }

    /**
     * Get feedback summary for interview
     */
    async getFeedbackSummary(interviewId: string, companyId: string) {
        const interview = await this.interviewRepo.findOne(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        return this.feedbackRepository.getFeedbackSummary(interviewId, companyId);
    }
}
