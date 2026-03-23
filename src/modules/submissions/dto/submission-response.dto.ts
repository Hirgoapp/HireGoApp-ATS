import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmissionResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    company_id: string;

    @ApiProperty()
    candidate_id: string;

    @ApiProperty()
    job_requirement_id: string;

    @ApiPropertyOptional()
    user_id?: string;

    @ApiPropertyOptional()
    client_id?: string;

    @ApiPropertyOptional()
    candidate_name?: string;

    @ApiPropertyOptional()
    phone?: string;

    @ApiPropertyOptional()
    email?: string;

    @ApiPropertyOptional()
    uan_number?: string;

    @ApiPropertyOptional()
    total_experience?: number;

    @ApiPropertyOptional()
    relevant_experience?: number;

    @ApiPropertyOptional()
    submission_date?: Date;

    @ApiProperty()
    status: string;

    @ApiPropertyOptional()
    position_applied?: string;

    @ApiPropertyOptional()
    location_preference?: string;

    @ApiPropertyOptional()
    gender?: string;

    @ApiPropertyOptional()
    dob?: Date;

    @ApiPropertyOptional()
    marital_status?: string;

    @ApiPropertyOptional()
    remarks?: string;

    @ApiPropertyOptional()
    alternative_contact?: string;

    @ApiPropertyOptional()
    current_company?: string;

    @ApiPropertyOptional()
    willing_to_relocate?: boolean;

    @ApiPropertyOptional()
    buyout?: boolean;

    @ApiPropertyOptional()
    buyout_option?: string;

    @ApiPropertyOptional()
    passport_number?: string;

    @ApiPropertyOptional()
    passport?: boolean;

    @ApiPropertyOptional()
    reason_for_job_change?: string;

    @ApiPropertyOptional()
    reason_for_change?: string;

    @ApiPropertyOptional()
    other_comments?: string;

    @ApiPropertyOptional()
    currency_code?: string;

    @ApiPropertyOptional()
    current_ctc?: number;

    @ApiPropertyOptional()
    expected_ctc?: number;

    @ApiPropertyOptional()
    notice_period?: string;

    @ApiPropertyOptional()
    skill_set?: string;

    @ApiPropertyOptional()
    alternate_phone?: string;

    @ApiPropertyOptional()
    video_verification?: string;

    @ApiPropertyOptional()
    manager_screening?: string;

    @ApiPropertyOptional()
    manager_screening_status?: string;

    @ApiPropertyOptional()
    extra_fields?: Record<string, any>;

    @ApiPropertyOptional()
    active_flag?: boolean;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;

    @ApiPropertyOptional()
    created_by?: string;

    @ApiPropertyOptional()
    updated_by?: string;
}
