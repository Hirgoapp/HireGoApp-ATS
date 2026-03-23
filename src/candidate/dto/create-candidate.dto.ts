import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsDate, IsUUID, IsObject, IsDateString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCandidateDto {
    @ApiProperty({ example: 'John Doe', description: 'Candidate full name' })
    @IsString()
    @MaxLength(100)
    candidate_name: string;

    @ApiProperty({ example: 'john.doe@example.com', description: 'Candidate email' })
    @IsEmail()
    @MaxLength(100)
    email: string;

    @ApiProperty({ example: '+1234567890', description: 'Candidate phone number' })
    @IsString()
    @MaxLength(20)
    phone: string;

    @ApiPropertyOptional({ example: '+0987654321', description: 'Alternate phone number' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    alternate_phone?: string;

    @ApiPropertyOptional({ example: 'Male', description: 'Gender' })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    gender?: string;

    @ApiPropertyOptional({ example: '1990-01-15', description: 'Date of birth' })
    @IsOptional()
    @IsDateString()
    dob?: string;

    @ApiPropertyOptional({ example: 'Married', description: 'Marital status' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    marital_status?: string;

    @ApiPropertyOptional({ example: 'Tech Corp Inc.', description: 'Current company' })
    @IsOptional()
    @IsString()
    current_company?: string;

    @ApiPropertyOptional({ example: 5.5, description: 'Total years of experience' })
    @IsOptional()
    @IsNumber()
    total_experience?: number;

    @ApiPropertyOptional({ example: 3, description: 'Relevant years of experience' })
    @IsOptional()
    @IsNumber()
    relevant_experience?: number;

    @ApiPropertyOptional({ example: 80000, description: 'Current CTC' })
    @IsOptional()
    @IsNumber()
    current_ctc?: number;

    @ApiPropertyOptional({ example: 100000, description: 'Expected CTC' })
    @IsOptional()
    @IsNumber()
    expected_ctc?: number;

    @ApiPropertyOptional({ example: 'USD', description: 'Currency code' })
    @IsOptional()
    @IsString()
    @MaxLength(3)
    currency_code?: string;

    @ApiPropertyOptional({ example: '30 days', description: 'Notice period' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    notice_period?: string;

    @ApiPropertyOptional({ example: true, description: 'Willing to relocate' })
    @IsOptional()
    @IsBoolean()
    willing_to_relocate?: boolean;

    @ApiPropertyOptional({ example: false, description: 'Buyout option' })
    @IsOptional()
    @IsBoolean()
    buyout?: boolean;

    @ApiPropertyOptional({ example: 'Career growth', description: 'Reason for job change' })
    @IsOptional()
    @IsString()
    reason_for_job_change?: string;

    @ApiPropertyOptional({ example: 'JavaScript, React, Node.js', description: 'Skill set' })
    @IsOptional()
    @IsString()
    skill_set?: string;

    @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Current location ID' })
    @IsOptional()
    @IsUUID()
    current_location_id?: string;

    @ApiPropertyOptional({ example: 'New York, San Francisco', description: 'Location preference' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    location_preference?: string;

    @ApiPropertyOptional({ example: 'Active', description: 'Candidate status' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    candidate_status?: string;

    @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Source ID' })
    @IsOptional()
    @IsUUID()
    source_id?: string;

    @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z', description: 'Last contacted date' })
    @IsOptional()
    @IsDateString()
    last_contacted_date?: string;

    @ApiPropertyOptional({ example: '2024-01-01', description: 'Last submission date' })
    @IsOptional()
    @IsDateString()
    last_submission_date?: string;

    @ApiPropertyOptional({ example: 'Highly skilled candidate', description: 'Notes about candidate' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ example: { customField1: 'value1' }, description: 'Extra custom fields' })
    @IsOptional()
    @IsObject()
    extra_fields?: Record<string, any>;

    @ApiPropertyOptional({ example: '123456789012', description: 'Aadhar number' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    aadhar_number?: string;

    @ApiPropertyOptional({ example: 'UAN123456', description: 'UAN number' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    uan_number?: string;

    @ApiPropertyOptional({ example: 'https://linkedin.com/in/johndoe', description: 'LinkedIn URL' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    linkedin_url?: string;

    @ApiPropertyOptional({ example: 'Approved', description: 'Manager screening status' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    manager_screening_status?: string;

    @ApiPropertyOptional({ example: 'Acme Corp', description: 'Client name' })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    client_name?: string;

    @ApiPropertyOptional({ example: 'Bachelor of Science', description: 'Highest qualification' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    highest_qualification?: string;

    @ApiPropertyOptional({ example: '2024-01-01', description: 'Submission date' })
    @IsOptional()
    @IsDateString()
    submission_date?: string;

    @ApiPropertyOptional({ example: 'New York', description: 'Job location' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    job_location?: string;

    @ApiPropertyOptional({ example: 'LinkedIn', description: 'Source' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    source?: string;

    @ApiPropertyOptional({ example: 'Client A', description: 'Client' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    client?: string;

    @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Recruiter user ID' })
    @IsOptional()
    @IsUUID()
    recruiter_id?: string;

    @ApiPropertyOptional({ example: '2024-01-01', description: 'Date of entry' })
    @IsOptional()
    @IsDateString()
    date_of_entry?: string;

    @ApiPropertyOptional({ example: 'Passed', description: 'Manager screening' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    manager_screening?: string;

    @ApiPropertyOptional({ example: 'Parser v2.0', description: 'Resume parser used' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    resume_parser_used?: string;

    @ApiPropertyOptional({ example: 0.95, description: 'Extraction confidence score' })
    @IsOptional()
    @IsNumber()
    extraction_confidence?: number;

    @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z', description: 'Extraction date' })
    @IsOptional()
    @IsDateString()
    extraction_date?: string;

    @ApiPropertyOptional({ example: 'email', description: 'Resume source type' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    resume_source_type?: string;

    @ApiPropertyOptional({ example: false, description: 'Is suspicious' })
    @IsOptional()
    @IsBoolean()
    is_suspicious?: boolean;

    @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'CV portal ID' })
    @IsOptional()
    @IsUUID()
    cv_portal_id?: string;

    @ApiPropertyOptional({ example: 'BATCH-001', description: 'Import batch ID' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    import_batch_id?: string;
}
