import { IsOptional, IsDateString, IsUUID, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AnalyticsPeriod {
    LAST_7_DAYS = 'last_7_days',
    LAST_30_DAYS = 'last_30_days',
    LAST_90_DAYS = 'last_90_days',
    LAST_6_MONTHS = 'last_6_months',
    LAST_YEAR = 'last_year',
    CUSTOM = 'custom',
}

export enum AnalyticsGroupBy {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    QUARTER = 'quarter',
}

export class AnalyticsQueryDto {
    @ApiPropertyOptional({
        enum: AnalyticsPeriod,
        example: AnalyticsPeriod.LAST_30_DAYS,
        description: 'Predefined time period for analytics'
    })
    @IsOptional()
    @IsEnum(AnalyticsPeriod)
    period?: AnalyticsPeriod;

    @ApiPropertyOptional({
        example: '2026-01-01',
        description: 'Start date for custom period (required if period=custom)'
    })
    @IsOptional()
    @IsDateString()
    start_date?: string;

    @ApiPropertyOptional({
        example: '2026-01-31',
        description: 'End date for custom period (required if period=custom)'
    })
    @IsOptional()
    @IsDateString()
    end_date?: string;

    @ApiPropertyOptional({
        example: 'uuid-of-job',
        description: 'Filter by specific job'
    })
    @IsOptional()
    @IsUUID('4')
    job_id?: string;

    @ApiPropertyOptional({
        example: 'uuid-of-recruiter',
        description: 'Filter by specific recruiter'
    })
    @IsOptional()
    @IsUUID('4')
    recruiter_id?: string;

    @ApiPropertyOptional({
        example: 'uuid-of-pipeline',
        description: 'Filter by specific pipeline'
    })
    @IsOptional()
    @IsUUID('4')
    pipeline_id?: string;

    @ApiPropertyOptional({
        enum: AnalyticsGroupBy,
        example: AnalyticsGroupBy.WEEK,
        description: 'Group time-series data by period'
    })
    @IsOptional()
    @IsEnum(AnalyticsGroupBy)
    group_by?: AnalyticsGroupBy;
}

export class RecruiterPerformanceQueryDto {
    @ApiPropertyOptional({
        example: 10,
        description: 'Limit number of recruiters returned',
        default: 10
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({
        enum: AnalyticsPeriod,
        example: AnalyticsPeriod.LAST_30_DAYS
    })
    @IsOptional()
    @IsEnum(AnalyticsPeriod)
    period?: AnalyticsPeriod;

    @ApiPropertyOptional({ example: '2026-01-01' })
    @IsOptional()
    @IsDateString()
    start_date?: string;

    @ApiPropertyOptional({ example: '2026-01-31' })
    @IsOptional()
    @IsDateString()
    end_date?: string;
}
