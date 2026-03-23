import { IsOptional, IsUUID, IsEnum, IsInt, Min, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../entities/application.entity';
import { Type } from 'class-transformer';

export class FilterApplicationDto {
    @ApiPropertyOptional({ description: 'Filter by candidate ID' })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    candidate_id?: number;

    @ApiPropertyOptional({ description: 'Filter by job ID' })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    job_id?: number;
    @ApiPropertyOptional({ description: 'Filter by pipeline UUID' })
    @IsOptional()
    @IsUUID()
    pipeline_id?: string;

    @ApiPropertyOptional({ description: 'Filter by current stage UUID' })
    @IsOptional()
    @IsUUID()
    current_stage_id?: string;

    @ApiPropertyOptional({ description: 'Filter by source UUID' })
    @IsOptional()
    @IsUUID()
    source_id?: string;

    @ApiPropertyOptional({ enum: ApplicationStatus })
    @IsOptional()
    @IsEnum(ApplicationStatus)
    status?: ApplicationStatus;

    @ApiPropertyOptional({ description: 'Filter by assigned user UUID' })
    @IsOptional()
    @IsUUID()
    assigned_to?: string;

    @ApiPropertyOptional({ description: 'Include archived applications' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_archived?: boolean;

    @ApiPropertyOptional({ description: 'Applied after date' })
    @IsOptional()
    @IsDateString()
    applied_after?: Date;

    @ApiPropertyOptional({ description: 'Applied before date' })
    @IsOptional()
    @IsDateString()
    applied_before?: Date;

    @ApiPropertyOptional({ description: 'Minimum rating' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    min_rating?: number;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number = 20;
}
