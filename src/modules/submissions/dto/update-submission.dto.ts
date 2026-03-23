import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, MaxLength, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubmissionDto {
    @ApiPropertyOptional({
        description: 'Update cover letter',
        maxLength: 2000,
    })
    @IsString()
    @IsOptional()
    @MaxLength(2000)
    cover_letter?: string;

    @ApiPropertyOptional({
        description: 'Update salary expectation',
    })
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    @Min(0)
    salary_expectation?: number;

    @ApiPropertyOptional({
        description: 'Update internal notes (JSONB)',
    })
    @IsObject()
    @IsOptional()
    notes?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Internal recruiter notes (plain text)' })
    @IsString()
    @IsOptional()
    @MaxLength(10000)
    internal_notes?: string;
}
