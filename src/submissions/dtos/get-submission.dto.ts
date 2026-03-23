import { RequirementSubmission } from '../entities/requirement-submission.entity';

/**
 * GetRequirementSubmissionDto
 * Response DTO for requirement submission
 * Includes all 32 fields from requirement_submissions table
 * Uses INTEGER id and job_requirement_id (not company_id or candidate_id)
 * Mapped from RequirementSubmission entity
 */
export class GetRequirementSubmissionDto {
    id: number;
    job_requirement_id: number;
    daily_submission_id: number | null;
    profile_submission_date: Date;
    vendor_email_id: string | null;
    candidate_title: string | null;
    candidate_name: string;
    candidate_phone: string | null;
    candidate_email: string | null;
    candidate_notice_period: string | null;
    candidate_current_location: string | null;
    candidate_location_applying_for: string | null;
    candidate_total_experience: number | null;
    candidate_relevant_experience: number | null;
    candidate_skills: string | null;
    vendor_quoted_rate: number | null;
    interview_screenshot_url: string | null;
    interview_platform: string | null;
    screenshot_duration_minutes: number | null;
    candidate_visa_type: string | null;
    candidate_engagement_type: string | null;
    candidate_ex_infosys_employee_id: string | null;
    submitted_by_user_id: number | null;
    submitted_at: Date;
    submission_status: string | null;
    status_updated_at: Date | null;
    client_feedback: string | null;
    client_feedback_date: Date | null;
    extra_fields: Record<string, any>;
    created_at: Date;
    updated_at: Date;
    created_by: number | null;
    updated_by: number | null;

    constructor(submission: RequirementSubmission) {
        this.id = submission.id;
        this.job_requirement_id = submission.job_requirement_id;
        this.daily_submission_id = submission.daily_submission_id ?? null;
        this.profile_submission_date = submission.profile_submission_date;
        this.vendor_email_id = submission.vendor_email_id ?? null;
        this.candidate_title = submission.candidate_title ?? null;
        this.candidate_name = submission.candidate_name;
        this.candidate_phone = submission.candidate_phone ?? null;
        this.candidate_email = submission.candidate_email ?? null;
        this.candidate_notice_period = submission.candidate_notice_period ?? null;
        this.candidate_current_location = submission.candidate_current_location ?? null;
        this.candidate_location_applying_for = submission.candidate_location_applying_for ?? null;
        this.candidate_total_experience = submission.candidate_total_experience ?? null;
        this.candidate_relevant_experience = submission.candidate_relevant_experience ?? null;
        this.candidate_skills = submission.candidate_skills ?? null;
        this.vendor_quoted_rate = submission.vendor_quoted_rate ?? null;
        this.interview_screenshot_url = submission.interview_screenshot_url ?? null;
        this.interview_platform = submission.interview_platform ?? null;
        this.screenshot_duration_minutes = submission.screenshot_duration_minutes ?? null;
        this.candidate_visa_type = submission.candidate_visa_type ?? null;
        this.candidate_engagement_type = submission.candidate_engagement_type ?? null;
        this.candidate_ex_infosys_employee_id = submission.candidate_ex_infosys_employee_id ?? null;
        this.submitted_by_user_id = submission.submitted_by_user_id ?? null;
        this.submitted_at = submission.submitted_at;
        this.submission_status = submission.submission_status ?? null;
        this.status_updated_at = submission.status_updated_at ?? null;
        this.client_feedback = submission.client_feedback ?? null;
        this.client_feedback_date = submission.client_feedback_date ?? null;
        this.extra_fields = submission.extra_fields ?? {};
        this.created_at = submission.created_at;
        this.updated_at = submission.updated_at;
        this.created_by = submission.created_by ?? null;
        this.updated_by = submission.updated_by ?? null;
    }
}
