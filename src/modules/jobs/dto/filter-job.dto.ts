import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterJobDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ enum: ['open', 'closed', 'draft', 'archived'] })
    @IsString()
    @IsOptional()
    status?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    department?: string;

    @ApiPropertyOptional({ description: 'Filter by linked client (UUID)' })
    @IsString()
    @IsOptional()
    client_id?: string;

    @ApiPropertyOptional({ description: 'Substring match on job location' })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional({ minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ minimum: 1, maximum: 100 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    orderBy?: string;

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
    @IsString()
    @IsOptional()
    orderDirection?: 'ASC' | 'DESC';
}
