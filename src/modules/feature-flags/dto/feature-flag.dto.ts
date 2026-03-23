import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FlagTargeting, FlagStatus } from '../entities/feature-flag.entity';

export class CreateFeatureFlagDto {
    @ApiProperty({ example: 'advanced-analytics-v2' })
    @IsString()
    key: string;

    @ApiProperty({ example: 'Advanced Analytics Dashboard V2' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'New analytics dashboard with real-time updates' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: FlagTargeting, default: FlagTargeting.GLOBAL })
    @IsEnum(FlagTargeting)
    targeting: FlagTargeting;

    @ApiPropertyOptional({
        example: {
            company_ids: ['uuid-1', 'uuid-2'],
            percentage: 25,
            environments: ['staging', 'production']
        }
    })
    @IsOptional()
    @IsObject()
    targeting_rules?: {
        company_ids?: string[];
        user_ids?: string[];
        percentage?: number;
        environments?: string[];
    };

    @ApiPropertyOptional({ example: { tags: ['analytics', 'dashboard'], owner: 'team-frontend' } })
    @IsOptional()
    @IsObject()
    metadata?: {
        tags?: string[];
        owner?: string;
        jira_ticket?: string;
        launch_date?: string;
    };

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    is_beta_feature?: boolean;
}

export class UpdateFeatureFlagDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: FlagStatus })
    @IsOptional()
    @IsEnum(FlagStatus)
    status?: FlagStatus;

    @ApiPropertyOptional({ enum: FlagTargeting })
    @IsOptional()
    @IsEnum(FlagTargeting)
    targeting?: FlagTargeting;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    targeting_rules?: {
        company_ids?: string[];
        user_ids?: string[];
        percentage?: number;
        environments?: string[];
    };

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    metadata?: any;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    is_beta_feature?: boolean;
}

export class CheckFeatureFlagDto {
    @ApiProperty({ example: 'advanced-analytics-v2' })
    @IsString()
    flag_key: string;

    @ApiPropertyOptional({ example: 'uuid-of-company' })
    @IsOptional()
    @IsString()
    company_id?: string;

    @ApiPropertyOptional({ example: 'uuid-of-user' })
    @IsOptional()
    @IsString()
    user_id?: string;

    @ApiPropertyOptional({ example: 'production' })
    @IsOptional()
    @IsString()
    environment?: string;
}

export class FeatureFlagResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    key: string;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional()
    description?: string;

    @ApiProperty({ enum: FlagStatus })
    status: FlagStatus;

    @ApiProperty({ enum: FlagTargeting })
    targeting: FlagTargeting;

    @ApiPropertyOptional()
    targeting_rules?: any;

    @ApiPropertyOptional()
    metadata?: any;

    @ApiProperty()
    is_beta_feature: boolean;

    @ApiProperty()
    usage_count: number;

    @ApiProperty()
    enabled_count: number;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}

export class BulkFeatureFlagCheckDto {
    @ApiProperty({ example: ['feature-1', 'feature-2', 'feature-3'] })
    @IsArray()
    @IsString({ each: true })
    flag_keys: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    company_id?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    user_id?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    environment?: string;
}
