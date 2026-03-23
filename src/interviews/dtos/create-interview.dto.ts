import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsDecimal, IsUUID } from 'class-validator';
import { InterviewMode, InterviewRound, InterviewStatus } from '../entities/interview.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * CreateInterviewDto
 * Request DTO for creating an interview
 * Includes all fields from interviews table
 * Uses UUID submission_id and job_requirement_id FKs
 */
export class CreateInterviewDto {
    @ApiProperty({ description: 'Submission ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
    @IsUUID()
    submission_id: string; // FK to submissions

    @ApiProperty({ description: 'Job Requirement ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440001' })
    @IsUUID()
    job_requirement_id: string; // FK to job_requirements

    @ApiProperty({ description: 'Candidate ID (UUID)', required: false })
    @IsOptional()
    @IsUUID()
    candidate_id?: string;

    @ApiProperty({ enum: InterviewRound, description: 'Interview round' })
    @IsEnum(InterviewRound)
    round: InterviewRound;

    @ApiProperty({ description: 'Scheduled date (YYYY-MM-DD)', required: false })
    @IsOptional()
    @IsDateString()
    scheduled_date?: string;

    @ApiProperty({ description: 'Scheduled time (HH:MM:SS)', required: false })
    @IsOptional()
    @IsString()
    scheduled_time?: string;

    @ApiProperty({ description: 'Interviewer ID (UUID)', required: false })
    @IsOptional()
    @IsUUID()
    interviewer_id?: string; // FK to users

    @ApiProperty({ enum: InterviewMode, description: 'Interview mode' })
    @IsEnum(InterviewMode)
    mode: InterviewMode;

    @ApiProperty({ enum: InterviewStatus, description: 'Interview status', required: false })
    @IsEnum(InterviewStatus)
    status?: InterviewStatus;

    @ApiProperty({ description: 'Interview rating (0-10)', required: false })
    @IsOptional()
    @IsDecimal({ decimal_digits: '3,1' })
    rating?: number; // precision 3, scale 1 (e.g., 4.5)

    @ApiProperty({ description: 'Interviewer feedback', required: false })
    @IsOptional()
    @IsString()
    feedback?: string;

    @ApiProperty({ description: 'Interview outcome', required: false })
    @IsOptional()
    @IsString()
    outcome?: string;

    @ApiProperty({ description: 'Candidate notes', required: false })
    @IsOptional()
    @IsString()
    candidate_notes?: string;

    @ApiProperty({ description: 'Additional remarks', required: false })
    @IsOptional()
    @IsString()
    remarks?: string;

    @ApiProperty({ description: 'Interview location (for offline)', required: false })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({ description: 'Meeting link (for online)', required: false })
    @IsOptional()
    @IsString()
    meeting_link?: string;

    @IsOptional()
    @IsString()
    reschedule_reason?: string;

    // Final brace closes DTO class
}
