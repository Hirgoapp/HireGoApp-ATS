import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CandidateResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    company_id: string;

    @ApiProperty()
    candidate_name: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    phone: string;

    @ApiPropertyOptional()
    alternate_phone?: string;

    @ApiPropertyOptional()
    gender?: string;

    @ApiPropertyOptional()
    dob?: Date;

    @ApiPropertyOptional()
    marital_status?: string;

    @ApiPropertyOptional()
    current_company?: string;

    @ApiPropertyOptional()
    total_experience?: number;

    @ApiPropertyOptional()
    relevant_experience?: number;

    @ApiPropertyOptional()
    current_ctc?: number;

    @ApiPropertyOptional()
    expected_ctc?: number;

    @ApiPropertyOptional()
    currency_code?: string;

    @ApiPropertyOptional()
    notice_period?: string;

    @ApiPropertyOptional()
    willing_to_relocate?: boolean;

    @ApiPropertyOptional()
    buyout?: boolean;

    @ApiPropertyOptional()
    reason_for_job_change?: string;

    @ApiPropertyOptional()
    skill_set?: string;

    @ApiPropertyOptional()
    current_location_id?: string;

    @ApiPropertyOptional()
    location_preference?: string;

    @ApiPropertyOptional()
    candidate_status?: string;

    @ApiPropertyOptional()
    source_id?: string;

    @ApiPropertyOptional()
    last_contacted_date?: Date;

    @ApiPropertyOptional()
    last_submission_date?: Date;

    @ApiPropertyOptional()
    notes?: string;

    @ApiPropertyOptional()
    extra_fields?: Record<string, any>;

    @ApiPropertyOptional()
    aadhar_number?: string;

    @ApiPropertyOptional()
    uan_number?: string;

    @ApiPropertyOptional()
    linkedin_url?: string;

    @ApiPropertyOptional()
    manager_screening_status?: string;

    @ApiPropertyOptional()
    client_name?: string;

    @ApiPropertyOptional()
    highest_qualification?: string;

    @ApiPropertyOptional()
    submission_date?: Date;

    @ApiPropertyOptional()
    job_location?: string;

    @ApiPropertyOptional()
    source?: string;

    @ApiPropertyOptional()
    client?: string;

    @ApiPropertyOptional()
    recruiter_id?: string;

    @ApiPropertyOptional()
    date_of_entry?: Date;

    @ApiPropertyOptional()
    manager_screening?: string;

    @ApiPropertyOptional()
    resume_parser_used?: string;

    @ApiPropertyOptional()
    extraction_confidence?: number;

    @ApiPropertyOptional()
    extraction_date?: Date;

    @ApiPropertyOptional()
    resume_source_type?: string;

    @ApiPropertyOptional()
    is_suspicious?: boolean;

    @ApiPropertyOptional()
    cv_portal_id?: string;

    @ApiPropertyOptional()
    import_batch_id?: string;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;

    @ApiPropertyOptional()
    created_by?: string;

    @ApiPropertyOptional()
    updated_by?: string;
}

export class CandidateListResponseDto {
    @ApiProperty({ type: [CandidateResponseDto] })
    data: CandidateResponseDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;
}
