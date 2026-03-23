import { Interview, InterviewMode, InterviewRound, InterviewStatus } from '../entities/interview.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * GetInterviewDto
 * Response DTO for interview
 * Includes all fields from interviews table
 * Uses UUID id, submission_id, job_requirement_id, company_id
 * Mapped from Interview entity
 */
export class GetInterviewDto {
    @ApiProperty({ description: 'Interview ID (UUID)' })
    id: string;

    @ApiProperty({ description: 'Company ID (UUID)' })
    company_id: string;

    @ApiProperty({ description: 'Submission ID (UUID)' })
    submission_id: string;

    @ApiProperty({ description: 'Job Requirement ID (UUID)' })
    job_requirement_id: string;

    @ApiProperty({ description: 'Candidate ID (UUID)', nullable: true })
    candidate_id: string | null;

    @ApiProperty({ enum: InterviewRound })
    round: InterviewRound;

    @ApiProperty({ description: 'Scheduled date', nullable: true })
    scheduled_date: string | null;

    @ApiProperty({ description: 'Scheduled time', nullable: true })
    scheduled_time: string | null;

    @ApiProperty({ description: 'Interviewer ID (UUID)', nullable: true })
    interviewer_id: string | null;

    @ApiProperty({ enum: InterviewMode })
    mode: InterviewMode;

    @ApiProperty({ enum: InterviewStatus })
    status: InterviewStatus;

    @ApiProperty({ description: 'Interview rating', nullable: true })
    rating: number | null;

    @ApiProperty({ description: 'Interviewer feedback', nullable: true })
    feedback: string | null;

    @ApiProperty({ description: 'Interview outcome', nullable: true })
    outcome: string | null;

    @ApiProperty({ description: 'Candidate notes', nullable: true })
    candidate_notes: string | null;

    @ApiProperty({ description: 'Remarks', nullable: true })
    remarks: string | null;

    @ApiProperty({ description: 'Interview location', nullable: true })
    location: string | null;

    @ApiProperty({ description: 'Meeting link', nullable: true })
    meeting_link: string | null;

    @ApiProperty({ description: 'Reschedule reason', nullable: true })
    reschedule_reason: string | null;

    @ApiProperty({ description: 'Created by (User ID, UUID)', nullable: true })
    created_by: string | null;

    @ApiProperty({ description: 'Updated by (User ID, UUID)', nullable: true })
    updated_by: string | null;

    @ApiProperty({ description: 'Created at timestamp' })
    created_at: Date;

    @ApiProperty({ description: 'Updated at timestamp' })
    updated_at: Date;

    @ApiProperty({ description: 'Deleted at timestamp', nullable: true })
    deleted_at: Date | null;

    constructor(interview: Interview) {
        this.id = interview.id;
        this.company_id = interview.company_id;
        this.submission_id = interview.submission_id;
        this.job_requirement_id = interview.job_requirement_id;
        this.candidate_id = interview.candidate_id ?? null;
        this.round = interview.round;
        this.scheduled_date = interview.scheduled_date ?? null;
        this.scheduled_time = interview.scheduled_time ?? null;
        this.interviewer_id = interview.interviewer_id ?? null;
        this.mode = interview.mode;
        this.status = interview.status;
        this.rating = interview.rating ?? null;
        this.feedback = interview.feedback ?? null;
        this.outcome = interview.outcome ?? null;
        this.candidate_notes = interview.candidate_notes ?? null;
        this.remarks = interview.remarks ?? null;
        this.location = interview.location ?? null;
        this.meeting_link = interview.meeting_link ?? null;
        this.reschedule_reason = interview.reschedule_reason ?? null;
        this.created_by = interview.created_by ?? null;
        this.updated_by = interview.updated_by ?? null;
        this.created_at = interview.created_at;
        this.updated_at = interview.updated_at;
        this.deleted_at = interview.deleted_at ?? null;
    }
}
