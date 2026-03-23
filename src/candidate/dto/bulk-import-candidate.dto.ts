import { IsString, IsEmail, IsOptional, IsArray, ValidateNested, IsBoolean, IsObject, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkImportCandidateItemDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name of the candidate' })
    @IsString()
    candidate_name: string;

    @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'Tech Corp Inc', description: 'Current company' })
    @IsOptional()
    @IsString()
    current_company?: string;

    @ApiPropertyOptional({
        example: 'JavaScript, React, Node.js',
        description: 'Comma-separated skills'
    })
    @IsOptional()
    @IsString()
    skill_set?: string;

    @ApiPropertyOptional({
        example: 5,
        description: 'Total years of experience'
    })
    @IsOptional()
    @IsNumber()
    total_experience?: number;

    @ApiPropertyOptional({
        example: 'Active',
        description: 'Initial status for the candidate'
    })
    @IsOptional()
    @IsString()
    candidate_status?: string;

    @ApiPropertyOptional({
        example: 'https://linkedin.com/in/johndoe',
        description: 'LinkedIn profile URL'
    })
    @IsOptional()
    @IsString()
    linkedin_url?: string;

    @ApiPropertyOptional({
        example: 'Experienced full-stack developer',
        description: 'Additional notes'
    })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({
        example: { certification: 'AWS Certified', availability: 'immediate' },
        description: 'Extra fields as key-value pairs'
    })
    @IsOptional()
    @IsObject()
    extra_fields?: Record<string, any>;

    @ApiPropertyOptional({
        example: 'uuid-of-recruiter',
        description: 'Assign to recruiter ID'
    })
    @IsOptional()
    @IsString()
    recruiter_id?: string;
}

export class BulkImportCandidateDto {
    @ApiProperty({
        type: [BulkImportCandidateItemDto],
        description: 'Array of candidates to import'
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkImportCandidateItemDto)
    candidates: BulkImportCandidateItemDto[];

    @ApiPropertyOptional({
        example: false,
        description: 'If true, skip candidates with duplicate emails instead of failing'
    })
    @IsOptional()
    @IsBoolean()
    skip_duplicates?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'If true, send welcome email to new candidates'
    })
    @IsOptional()
    @IsBoolean()
    send_welcome_email?: boolean;

    @ApiPropertyOptional({
        example: 'uuid-of-recruiter',
        description: 'Assign all imported candidates to this recruiter'
    })
    @IsOptional()
    @IsString()
    assign_to_recruiter_id?: string;
}

export class BulkImportResultDto {
    @ApiProperty({ example: 45, description: 'Total candidates processed' })
    total: number;

    @ApiProperty({ example: 42, description: 'Successfully imported candidates' })
    success: number;

    @ApiProperty({ example: 3, description: 'Failed imports' })
    failed: number;

    @ApiProperty({ example: 2, description: 'Skipped due to duplicates' })
    skipped: number;

    @ApiProperty({
        example: [
            { row: 5, email: 'duplicate@example.com', error: 'Email already exists' },
            { row: 12, email: 'invalid@', error: 'Invalid email format' }
        ],
        description: 'Details of failed imports'
    })
    errors: Array<{
        row: number;
        email?: string;
        name?: string;
        error: string;
    }>;

    @ApiProperty({
        example: ['uuid-1', 'uuid-2', 'uuid-3'],
        description: 'IDs of successfully imported candidates',
        type: [String]
    })
    imported_ids: string[];
}
