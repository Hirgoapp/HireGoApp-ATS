import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Interview, InterviewStatus, InterviewRound } from '../entities/interview.entity';
import { InterviewRepository } from '../repositories/interview.repository';
import { CreateInterviewDto } from '../dtos/create-interview.dto';
import { UpdateInterviewDto } from '../dtos/update-interview.dto';
import { GetInterviewDto } from '../dtos/get-interview.dto';

@Injectable()
export class InterviewService {
    constructor(private readonly interviewRepository: InterviewRepository) { }

    async schedule(companyId: string, userId: string, dto: CreateInterviewDto): Promise<GetInterviewDto> {
        const existing = await this.interviewRepository.findBySubmission(dto.submission_id, companyId);
        const duplicateRound = existing.find(
            (interview) => interview.round === dto.round && interview.status !== InterviewStatus.CANCELLED,
        );
        if (duplicateRound) {
            throw new BadRequestException(`Interview round ${dto.round} already exists for this submission`);
        }

        const interview = await this.interviewRepository.create({
            ...dto,
            company_id: companyId,
            created_by: userId,
        });

        return new GetInterviewDto(interview);
    }

    async getInterview(id: string, companyId: string): Promise<GetInterviewDto> {
        const interview = await this.interviewRepository.findById(id, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }
        return new GetInterviewDto(interview);
    }

    async getInterviews(
        companyId: string,
        options?: {
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
        },
    ): Promise<{ data: GetInterviewDto[]; total: number }> {
        const { data, total } = await this.interviewRepository.findAll(companyId, options);
        return {
            data: data.map((interview) => new GetInterviewDto(interview)),
            total,
        };
    }

    async recordFeedback(
        interviewId: string,
        companyId: string,
        userId: string,
        feedback: string,
        rating: number,
        remarks?: string,
    ): Promise<GetInterviewDto> {
        const interview = await this.interviewRepository.findById(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        if (rating < 0 || rating > 10) {
            throw new BadRequestException('Rating must be between 0 and 10');
        }

        interview.feedback = feedback;
        interview.rating = rating;
        interview.remarks = remarks;
        interview.updated_by = userId;

        const updatedInterview = await this.interviewRepository.update(interview);
        return new GetInterviewDto(updatedInterview);
    }

    async markCompleted(interviewId: string, companyId: string, userId: string): Promise<GetInterviewDto> {
        const interview = await this.interviewRepository.findById(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        interview.status = InterviewStatus.COMPLETED;
        interview.updated_by = userId;

        const updatedInterview = await this.interviewRepository.update(interview);
        return new GetInterviewDto(updatedInterview);
    }

    async cancel(interviewId: string, companyId: string, userId: string, reason?: string): Promise<GetInterviewDto> {
        const interview = await this.interviewRepository.findById(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        interview.status = InterviewStatus.CANCELLED;
        interview.updated_by = userId;
        if (reason) {
            interview.remarks = reason;
        }

        const updatedInterview = await this.interviewRepository.update(interview);
        return new GetInterviewDto(updatedInterview);
    }

    async reschedule(
        interviewId: string,
        companyId: string,
        userId: string,
        newDate: string,
        newTime: string,
        reason?: string,
    ): Promise<GetInterviewDto> {
        const interview = await this.interviewRepository.findById(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        interview.scheduled_date = newDate;
        interview.scheduled_time = newTime;
        interview.status = InterviewStatus.RESCHEDULED;
        interview.reschedule_reason = reason ?? interview.reschedule_reason;
        interview.updated_by = userId;

        const updatedInterview = await this.interviewRepository.update(interview);
        return new GetInterviewDto(updatedInterview);
    }

    async update(
        interviewId: string,
        companyId: string,
        userId: string,
        dto: UpdateInterviewDto,
    ): Promise<GetInterviewDto> {
        const interview = await this.interviewRepository.findById(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        Object.assign(interview, dto);
        interview.updated_by = userId;

        const updatedInterview = await this.interviewRepository.update(interview);
        return new GetInterviewDto(updatedInterview);
    }

    async delete(interviewId: string, companyId: string): Promise<void> {
        const interview = await this.interviewRepository.findById(interviewId, companyId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        await this.interviewRepository.softDelete(interviewId);
    }

    async getCount(companyId: string): Promise<number> {
        return await this.interviewRepository.count(companyId);
    }

    async getCountByRound(companyId: string, round: InterviewRound): Promise<number> {
        return await this.interviewRepository.countByRound(companyId, round);
    }

    async getCountByStatus(companyId: string, status: InterviewStatus): Promise<number> {
        return await this.interviewRepository.countByStatus(companyId, status);
    }

    async getInterviewsBySubmission(submissionId: string, companyId: string): Promise<GetInterviewDto[]> {
        const interviews = await this.interviewRepository.findBySubmission(submissionId, companyId);
        return interviews.map((i) => new GetInterviewDto(i));
    }
}

