import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterSubmissionDto {
    @ApiPropertyOptional({ description: 'Search by candidate name' })
    @IsString()
    @IsOptional()
    candidate_name?: string;

    @ApiPropertyOptional({ description: 'Filter by candidate ID' })
    @IsString()
    @IsOptional()
    candidate_id?: string;

    @ApiPropertyOptional({ description: 'Filter by job requirement ID' })
    @IsString()
    @IsOptional()
    job_requirement_id?: string;

    @ApiPropertyOptional({ description: 'Filter by status', enum: ['Pending', 'Selected', 'Rejected', 'Hold', 'Accepted', 'Joined'] })
    @IsString()
    @IsOptional()
    status?: string;

    @ApiPropertyOptional({ description: 'Filter by email' })
    @IsString()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ description: 'Filter by phone' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ description: 'Filter by recruiter/user ID' })
    @IsString()
    @IsOptional()
    user_id?: string;

    @ApiPropertyOptional({ description: 'Filter by client ID' })
    @IsString()
    @IsOptional()
    client_id?: string;

    @ApiPropertyOptional({ description: 'Filter by position applied' })
    @IsString()
    @IsOptional()
    position_applied?: string;

    @ApiPropertyOptional({ description: 'Filter by location preference' })
    @IsString()
    @IsOptional()
    location_preference?: string;

    @ApiPropertyOptional({ description: 'Filter by active status' })
    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    active_flag?: boolean;

    @ApiPropertyOptional({ description: 'Filter by manager screening status', enum: ['Pending', 'Approved', 'Rejected'] })
    @IsString()
    @IsOptional()
    manager_screening_status?: string;

    @ApiPropertyOptional({ description: 'Filter by willing to relocate' })
    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    willing_to_relocate?: boolean;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    limit?: number = 20;

    @ApiPropertyOptional({ description: 'Sort by field', default: 'created_at' })
    @IsString()
    @IsOptional()
    sortBy?: string = 'created_at';

    @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
    @IsString()
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
