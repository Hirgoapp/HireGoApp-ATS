import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    company_id: string;

    @ApiProperty()
    ecms_req_id: string;

    @ApiProperty()
    client_id: string;

    @ApiProperty()
    job_title: string;

    @ApiPropertyOptional()
    job_description?: string;

    @ApiPropertyOptional()
    domain?: string;

    @ApiPropertyOptional()
    business_unit?: string;

    @ApiPropertyOptional()
    total_experience_min?: number;

    @ApiPropertyOptional()
    relevant_experience_min?: number;

    @ApiProperty()
    mandatory_skills: string;

    @ApiPropertyOptional()
    desired_skills?: string;

    @ApiPropertyOptional()
    country?: string;

    @ApiPropertyOptional()
    work_location?: string;

    @ApiPropertyOptional()
    wfo_wfh_hybrid?: string;

    @ApiPropertyOptional()
    shift_time?: string;

    @ApiPropertyOptional()
    number_of_openings?: number;

    @ApiPropertyOptional()
    project_manager_name?: string;

    @ApiPropertyOptional()
    project_manager_email?: string;

    @ApiPropertyOptional()
    delivery_spoc_1_name?: string;

    @ApiPropertyOptional()
    delivery_spoc_1_email?: string;

    @ApiPropertyOptional()
    delivery_spoc_2_name?: string;

    @ApiPropertyOptional()
    delivery_spoc_2_email?: string;

    @ApiPropertyOptional()
    bgv_timing?: string;

    @ApiPropertyOptional()
    bgv_vendor?: string;

    @ApiPropertyOptional()
    interview_mode?: string;

    @ApiPropertyOptional()
    interview_platforms?: string;

    @ApiPropertyOptional()
    screenshot_requirement?: string;

    @ApiPropertyOptional()
    vendor_rate?: number;

    @ApiPropertyOptional()
    currency?: string;

    @ApiPropertyOptional()
    client_name?: string;

    @ApiPropertyOptional()
    email_subject?: string;

    @ApiPropertyOptional()
    email_received_date?: Date;

    @ApiProperty()
    priority: string;

    @ApiPropertyOptional()
    active_flag?: boolean;

    @ApiPropertyOptional()
    extra_fields?: Record<string, any>;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;

    @ApiPropertyOptional()
    created_by?: string;

    @ApiPropertyOptional()
    updated_by?: string;
}
