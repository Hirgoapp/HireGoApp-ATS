import {
    IsString,
    IsOptional,
    IsNumber,
    IsBoolean,
    IsDateString,
    IsObject,
    Min,
    Max,
} from 'class-validator';

/**
 * CreateJobRequirementDto
 * Request DTO for creating a new job requirement
 * Includes all 35 fields from job_requirements table
 * Uses INTEGER client_id (not company_id)
 * Ecms_req_id is unique external identifier
 */
export class CreateJobRequirementDto {
    @IsOptional()
    @IsString()
    ecms_req_id?: string; // External requirement ID (unique)

    @IsOptional()
    @IsNumber()
    client_id?: number; // FK to clients table

    @IsString()
    job_title: string;

    @IsOptional()
    @IsString()
    job_description?: string;

    @IsOptional()
    @IsString()
    domain?: string;

    @IsOptional()
    @IsString()
    business_unit?: string;

    @IsOptional()
    @IsNumber()
    total_experience_min?: number;

    @IsOptional()
    @IsNumber()
    relevant_experience_min?: number;

    @IsOptional()
    @IsString()
    mandatory_skills?: string; // Comma-separated

    @IsOptional()
    @IsString()
    desired_skills?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    work_location?: string;

    @IsOptional()
    @IsString()
    wfo_wfh_hybrid?: string; // WFO, WFH, Hybrid

    @IsOptional()
    @IsString()
    shift_time?: string;

    @IsOptional()
    @IsNumber()
    number_of_openings?: number;

    @IsOptional()
    @IsString()
    project_manager_name?: string;

    @IsOptional()
    @IsString()
    project_manager_email?: string;

    @IsOptional()
    @IsString()
    delivery_spoc_1_name?: string;

    @IsOptional()
    @IsString()
    delivery_spoc_1_email?: string;

    @IsOptional()
    @IsString()
    delivery_spoc_2_name?: string;

    @IsOptional()
    @IsString()
    delivery_spoc_2_email?: string;

    @IsOptional()
    @IsString()
    bgv_timing?: string;

    @IsOptional()
    @IsString()
    bgv_vendor?: string;

    @IsOptional()
    @IsString()
    interview_mode?: string;

    @IsOptional()
    @IsString()
    interview_platforms?: string; // Comma-separated

    @IsOptional()
    @IsString()
    screenshot_requirement?: string;

    @IsOptional()
    @IsNumber()
    vendor_rate?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    client_name?: string;

    @IsOptional()
    @IsString()
    email_subject?: string;

    @IsOptional()
    @IsDateString()
    email_received_date?: string;

    @IsOptional()
    @IsBoolean()
    active_flag?: boolean; // default: true

    @IsOptional()
    @IsString()
    priority?: string; // Low, Medium, High (default: Medium)

    @IsOptional()
    @IsObject()
    extra_fields?: Record<string, any>;

    @IsOptional()
    @IsNumber()
    @Min(1)
    openings?: number;

    @IsOptional()
    // @IsArray()
    @IsString({ each: true })
    required_skills?: string[];

    @IsOptional()
    // @IsArray()
    @IsString({ each: true })
    preferred_skills?: string[];

    @IsOptional()
    // @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    internal_notes?: string;

    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    customFields?: Record<string, any>;
}
