import { IsNotEmpty, IsUUID, IsOptional, IsEnum, IsInt, Min, Max, IsString, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../entities/application.entity';

export class CreateApplicationDto {
    @ApiProperty({ description: 'Candidate ID (integer)' })
    @IsNotEmpty()
    @IsInt()
    candidate_id: number;

    @ApiProperty({ description: 'Job ID (integer)' })
    @IsNotEmpty()
    @IsInt()
    job_id: number;
    @ApiPropertyOptional({ description: 'Pipeline UUID (defaults to job pipeline or company default)' })
    @IsOptional()
    @IsUUID()
    pipeline_id?: string;

    @ApiPropertyOptional({ description: 'Initial stage UUID (defaults to first stage)' })
    @IsOptional()
    @IsUUID()
    current_stage_id?: string;

    @ApiPropertyOptional({ description: 'Source UUID' })
    @IsOptional()
    @IsUUID()
    source_id?: string;

    @ApiPropertyOptional({ description: 'Application date', default: 'now' })
    @IsOptional()
    @IsDateString()
    applied_at?: Date;

    @ApiPropertyOptional({ enum: ApplicationStatus, default: ApplicationStatus.ACTIVE })
    @IsOptional()
    @IsEnum(ApplicationStatus)
    status?: ApplicationStatus;

    @ApiPropertyOptional({ description: 'Overall rating 1-5', minimum: 1, maximum: 5 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiPropertyOptional({ description: 'Application notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Resume document UUID' })
    @IsOptional()
    @IsUUID()
    resume_file_id?: string;

    @ApiPropertyOptional({ description: 'Cover letter document UUID' })
    @IsOptional()
    @IsUUID()
    cover_letter_file_id?: string;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Assigned recruiter/user UUID' })
    @IsOptional()
    @IsUUID()
    assigned_to?: string;
}
