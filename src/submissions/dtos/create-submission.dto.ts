import {
    IsString,
    IsOptional,
    IsNumber,
    IsDateString,
    IsObject,
} from 'class-validator';

/**
 * CreateRequirementSubmissionDto
 * Request DTO for creating a requirement submission
 * Includes all 32 fields from requirement_submissions table
 * Uses INTEGER job_requirement_id (FK to job_requirements, NOT NULL)
 * NOTE: No candidate_id FK - candidate data is denormalized directly in this table
 */
export class CreateRequirementSubmissionDto {
    @IsNumber()
    job_requirement_id: number; // FK to job_requirements (NOT NULL)

    @IsOptional()
    @IsNumber()
    daily_submission_id?: number;

    @IsDateString()
    profile_submission_date: string;

    @IsOptional()
    @IsString()
    vendor_email_id?: string;

    // Denormalized Candidate Data
    @IsOptional()
    @IsString()
    candidate_title?: string;

    @IsString()
    candidate_name: string;

    @IsOptional()
    @IsString()
    candidate_phone?: string;

    @IsOptional()
    @IsString()
    candidate_email?: string;

    @IsOptional()
    @IsString()
    candidate_notice_period?: string;

    @IsOptional()
    @IsString()
    candidate_current_location?: string;

    @IsOptional()
    @IsString()
    candidate_location_applying_for?: string;

    @IsOptional()
    @IsNumber()
    candidate_total_experience?: number;

    @IsOptional()
    @IsNumber()
    candidate_relevant_experience?: number;

    @IsOptional()
    @IsString()
    candidate_skills?: string; // Comma-separated

    @IsOptional()
    @IsNumber()
    vendor_quoted_rate?: number;

    // Interview Details
    @IsOptional()
    @IsString()
    interview_screenshot_url?: string;

    @IsOptional()
    @IsString()
    interview_platform?: string;

    @IsOptional()
    @IsNumber()
    screenshot_duration_minutes?: number;

    // Candidate Background
    @IsOptional()
    @IsString()
    candidate_visa_type?: string;

    @IsOptional()
    @IsString()
    candidate_engagement_type?: string;

    @IsOptional()
    @IsString()
    candidate_ex_infosys_employee_id?: string;

    // Submission Tracking
    @IsOptional()
    @IsNumber()
    submitted_by_user_id?: number;

    @IsOptional()
    @IsDateString()
    submitted_at?: string;

    @IsOptional()
    @IsString()
    submission_status?: string; // Pending, Approved, Rejected, etc.

    @IsOptional()
    @IsDateString()
    status_updated_at?: string;

    // Feedback
    @IsOptional()
    @IsString()
    client_feedback?: string;

    @IsOptional()
    @IsDateString()
    client_feedback_date?: string;

    @IsOptional()
    @IsObject()
    extra_fields?: Record<string, any>;
}
