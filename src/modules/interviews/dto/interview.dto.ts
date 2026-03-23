import { IsNotEmpty, IsUUID, IsEnum, IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewType } from '../entities/interview.entity';

export class CreateInterviewDto {
    @ApiProperty({ description: 'Submission UUID' })
    @IsNotEmpty()
    @IsUUID()
    submission_id: string;

    @ApiProperty({ enum: InterviewType })
    @IsNotEmpty()
    @IsEnum(InterviewType)
    interview_type: InterviewType;

    @ApiProperty({ description: 'Interview scheduled start (ISO datetime)' })
    @IsNotEmpty()
    @IsDateString()
    scheduled_start: Date;

    @ApiProperty({ description: 'Interview scheduled end (ISO datetime)' })
    @IsNotEmpty()
    @IsDateString()
    scheduled_end: Date;

    @ApiPropertyOptional({ description: 'Location or meeting link' })
    @IsOptional()
    @IsString()
    location_or_link?: string;

    @ApiPropertyOptional({ description: 'Pre-interview notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    metadata?: Record<string, any>;
}

export class CompleteInterviewDto {
    @ApiPropertyOptional({ description: 'Interview duration in minutes' })
    @IsOptional()
    @IsInt()
    @Min(1)
    duration_minutes?: number;

    @ApiPropertyOptional({ description: 'Interview notes/feedback' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    metadata?: Record<string, any>;
}

export class UpdateInterviewDto {
    @ApiPropertyOptional({ enum: InterviewType })
    @IsOptional()
    @IsEnum(InterviewType)
    interview_type?: InterviewType;

    @ApiPropertyOptional({ description: 'Reschedule start (ISO datetime)' })
    @IsOptional()
    @IsDateString()
    scheduled_start?: Date;

    @ApiPropertyOptional({ description: 'Reschedule end (ISO datetime)' })
    @IsOptional()
    @IsDateString()
    scheduled_end?: Date;

    @ApiPropertyOptional({ description: 'Location or meeting link' })
    @IsOptional()
    @IsString()
    location_or_link?: string;

    @ApiPropertyOptional({ description: 'Interview notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    metadata?: Record<string, any>;
}
