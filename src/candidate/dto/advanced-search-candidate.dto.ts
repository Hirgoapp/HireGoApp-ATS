import { IsOptional, IsString, IsArray, IsEnum, IsBoolean, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SearchOperator {
    EQUALS = 'eq',
    NOT_EQUALS = 'ne',
    CONTAINS = 'contains',
    NOT_CONTAINS = 'not_contains',
    STARTS_WITH = 'starts_with',
    ENDS_WITH = 'ends_with',
    GREATER_THAN = 'gt',
    LESS_THAN = 'lt',
    GREATER_OR_EQUAL = 'gte',
    LESS_OR_EQUAL = 'lte',
    IN = 'in',
    NOT_IN = 'not_in',
    EXISTS = 'exists',
}

export class SearchFilter {
    @ApiPropertyOptional({ description: 'Field name (supports dot notation for relations)' })
    @IsString()
    field: string;

    @ApiPropertyOptional({ enum: SearchOperator, description: 'Filter operator' })
    @IsEnum(SearchOperator)
    operator: SearchOperator;

    @ApiPropertyOptional({ description: 'Filter value (supports array for IN operators)' })
    value?: any;
}

export class AdvancedCandidateSearchDto {
    // Pagination
    @ApiPropertyOptional({ example: 1, description: 'Page number' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 20, description: 'Items per page' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    // Full-text search
    @ApiPropertyOptional({ example: 'senior engineer', description: 'Full-text search across name, email, skills' })
    @IsOptional()
    @IsString()
    q?: string;

    // Simple filters (common use cases)
    @ApiPropertyOptional({ example: 'Active', description: 'Candidate status' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Recruiter ID' })
    @IsOptional()
    @IsString()
    recruiter_id?: string;

    @ApiPropertyOptional({ example: 'true', description: 'Filter archived candidates' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    archived?: boolean;

    // Advanced filters
    @ApiPropertyOptional({
        type: [Object],
        example: [
            { field: 'experience_years', operator: 'gte', value: 5 },
            { field: 'skills', operator: 'contains', value: 'TypeScript' },
        ],
        description: 'Advanced filters using operators',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SearchFilter)
    filters?: SearchFilter[];

    // Sorting
    @ApiPropertyOptional({ example: 'created_at', description: 'Sort field' })
    @IsOptional()
    @IsString()
    sort_by?: string = 'created_at';

    @ApiPropertyOptional({ example: 'DESC', description: 'Sort order (ASC/DESC)' })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sort_order?: 'ASC' | 'DESC' = 'DESC';

    // Custom field search (key-value pairs)
    @ApiPropertyOptional({
        type: Object,
        example: { 'certification_level': 'Senior', 'clearance': 'Top Secret' },
        description: 'Custom field filters',
    })
    @IsOptional()
    @Type(() => Object)
    custom_fields?: Record<string, any>;
}

export class AdvancedCandidateSearchResponseDto {
    data: any[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}
