import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsArray } from 'class-validator';

export class CreateJobDto {
    @ApiProperty({ description: 'Job title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: 'Job description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Job requirements' })
    @IsString()
    @IsOptional()
    requirements?: string;

    @ApiPropertyOptional({ description: 'Department' })
    @IsString()
    @IsOptional()
    department?: string;

    @ApiPropertyOptional({ description: 'Location' })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional({ description: 'Minimum salary' })
    @IsNumber()
    @IsOptional()
    salary_min?: number;

    @ApiPropertyOptional({ description: 'Maximum salary' })
    @IsNumber()
    @IsOptional()
    salary_max?: number;

    @ApiPropertyOptional({ description: 'Employment type' })
    @IsString()
    @IsOptional()
    employment_type?: string;

    @ApiPropertyOptional({ description: 'Job status', enum: ['open', 'closed', 'draft', 'archived'] })
    @IsString()
    @IsOptional()
    status?: string;

    @ApiPropertyOptional({ description: 'Hiring manager UUID' })
    @IsUUID()
    @IsOptional()
    hiring_manager_id?: string;

    @ApiPropertyOptional({ description: 'Pipeline UUID' })
    @IsUUID()
    @IsOptional()
    pipeline_id?: string;

    @ApiPropertyOptional({ description: 'Client UUID' })
    @IsUUID()
    @IsOptional()
    client_id?: string;

    @ApiPropertyOptional({ description: 'Client POC (Point of Contact) UUID' })
    @IsUUID()
    @IsOptional()
    poc_id?: string;

    @ApiPropertyOptional({ description: 'Required skills', type: [String] })
    @IsArray()
    @IsOptional()
    required_skills?: string[];

    @ApiPropertyOptional({ description: 'Preferred skills', type: [String] })
    @IsArray()
    @IsOptional()
    preferred_skills?: string[];

    // ============================================
    // DYNAMIC JD FIELDS
    // ============================================

    @ApiPropertyOptional({
        description: 'Dynamic JD content (supports plain text, markdown, or HTML)',
        example: '# Senior Software Engineer\n\n## About the Role\nWe are seeking...'
    })
    @IsString()
    @IsOptional()
    jd_content?: string;

    @ApiPropertyOptional({
        description: 'Format of JD content',
        enum: ['plain', 'markdown', 'html', 'structured'],
        default: 'plain'
    })
    @IsString()
    @IsOptional()
    jd_format?: string;

    @ApiPropertyOptional({
        description: 'Use dynamic JD system instead of legacy description/requirements fields',
        default: false
    })
    @IsOptional()
    use_dynamic_jd?: boolean;

    @ApiPropertyOptional({
        description: 'Structured sections parsed from JD',
        type: 'array',
        example: [
            { heading: 'Responsibilities', content: 'Lead development...', order: 1 },
            { heading: 'Requirements', content: '5+ years...', order: 2 }
        ]
    })
    @IsOptional()
    jd_sections?: Array<{
        heading: string;
        content: string;
        order: number;
        type?: string;
    }>;
}
