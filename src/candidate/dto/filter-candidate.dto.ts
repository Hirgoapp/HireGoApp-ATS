import { IsOptional, IsString, IsUUID, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterCandidateDto {
    @ApiPropertyOptional({ example: 1, description: 'Page number' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 200, description: 'Items per page' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(200)
    limit?: number = 10;

    @ApiPropertyOptional({ example: 'Active', description: 'Candidate status filter' })
    @IsOptional()
    @IsString()
    candidate_status?: string;

    @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Source ID filter' })
    @IsOptional()
    @IsUUID()
    source_id?: string;

    @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Recruiter ID filter' })
    @IsOptional()
    @IsUUID()
    recruiter_id?: string;

    @ApiPropertyOptional({ example: 'john', description: 'Search by name or email' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ example: '2024-01-01', description: 'Filter by date from' })
    @IsOptional()
    @IsDateString()
    date_from?: string;

    @ApiPropertyOptional({ example: '2024-12-31', description: 'Filter by date to' })
    @IsOptional()
    @IsDateString()
    date_to?: string;

    @ApiPropertyOptional({ example: 'created_at', description: 'Sort by field' })
    @IsOptional()
    @IsString()
    sort_by?: string = 'created_at';

    @ApiPropertyOptional({ example: 'DESC', description: 'Sort order' })
    @IsOptional()
    @IsString()
    sort_order?: 'ASC' | 'DESC' = 'DESC';
}
