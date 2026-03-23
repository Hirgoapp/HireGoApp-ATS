import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsArray, IsEnum, IsInt, Min, Max, IsBoolean, IsString } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';

export class AdvancedApplicationSearchDto {
    @ApiPropertyOptional({ type: [String], description: 'Statuses to include' })
    @IsOptional()
    @IsArray()
    @IsEnum(ApplicationStatus, { each: true })
    statuses?: ApplicationStatus[];

    @ApiPropertyOptional({ description: 'Pipeline ID filter' })
    @IsOptional()
    @IsUUID()
    pipeline_id?: string;

    @ApiPropertyOptional({ description: 'Stage ID filter' })
    @IsOptional()
    @IsUUID()
    stage_id?: string;

    @ApiPropertyOptional({ description: 'Source ID filter' })
    @IsOptional()
    @IsUUID()
    source_id?: string;

    @ApiPropertyOptional({ description: 'Assigned user ID' })
    @IsOptional()
    @IsUUID()
    assigned_to?: string;

    @ApiPropertyOptional({ description: 'Candidate ID (int)' })
    @IsOptional()
    @IsInt()
    candidate_id?: number;

    @ApiPropertyOptional({ description: 'Job ID (int)' })
    @IsOptional()
    @IsInt()
    job_id?: number;

    @ApiPropertyOptional({ description: 'Rating minimum' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating_min?: number;

    @ApiPropertyOptional({ description: 'Rating maximum' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating_max?: number;

    @ApiPropertyOptional({ description: 'Applied from date ISO' })
    @IsOptional()
    from_date?: string;

    @ApiPropertyOptional({ description: 'Applied to date ISO' })
    @IsOptional()
    to_date?: string;

    @ApiPropertyOptional({ description: 'Include archived' })
    @IsOptional()
    @IsBoolean()
    include_archived?: boolean;

    @ApiPropertyOptional({ description: 'Keyword search in notes' })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Page size', default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number = 20;
}
