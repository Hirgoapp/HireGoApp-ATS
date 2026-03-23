import { JobRequirement } from '../entities/job-requirement.entity';

/**
 * GetJobRequirementDto
 * Response DTO for job requirement
 * Includes all 35 fields from job_requirements table
 * Uses INTEGER id and client_id (not company_id)
 * Mapped from JobRequirement entity
 */
export class GetJobRequirementDto {
    id: number;
    ecms_req_id: string;
    client_id: number;
    job_title: string;
    job_description: string | null;
    domain: string | null;
    business_unit: string | null;
    total_experience_min: number | null;
    relevant_experience_min: number | null;
    mandatory_skills: string;
    desired_skills: string | null;
    country: string | null;
    work_location: string | null;
    wfo_wfh_hybrid: string | null;
    shift_time: string | null;
    number_of_openings: number | null;
    project_manager_name: string | null;
    project_manager_email: string | null;
    delivery_spoc_1_name: string | null;
    delivery_spoc_1_email: string | null;
    delivery_spoc_2_name: string | null;
    delivery_spoc_2_email: string | null;
    bgv_timing: string | null;
    bgv_vendor: string | null;
    interview_mode: string | null;
    interview_platforms: string | null;
    screenshot_requirement: string | null;
    vendor_rate: number | null;
    currency: string | null;
    client_name: string | null;
    email_subject: string | null;
    email_received_date: Date | null;
    active_flag: boolean;
    priority: string;
    extra_fields: Record<string, any>;
    created_at: Date;
    updated_at: Date;
    created_by: number | null;

    constructor(jobRequirement: JobRequirement) {
        this.id = jobRequirement.id;
        this.ecms_req_id = jobRequirement.ecms_req_id;
        this.client_id = jobRequirement.client_id;
        this.job_title = jobRequirement.job_title;
        this.job_description = jobRequirement.job_description ?? null;
        this.domain = jobRequirement.domain ?? null;
        this.business_unit = jobRequirement.business_unit ?? null;
        this.total_experience_min = jobRequirement.total_experience_min ?? null;
        this.relevant_experience_min = jobRequirement.relevant_experience_min ?? null;
        this.mandatory_skills = jobRequirement.mandatory_skills;
        this.desired_skills = jobRequirement.desired_skills ?? null;
        this.country = jobRequirement.country ?? null;
        this.work_location = jobRequirement.work_location ?? null;
        this.wfo_wfh_hybrid = jobRequirement.wfo_wfh_hybrid ?? null;
        this.shift_time = jobRequirement.shift_time ?? null;
        this.number_of_openings = jobRequirement.number_of_openings ?? null;
        this.project_manager_name = jobRequirement.project_manager_name ?? null;
        this.project_manager_email = jobRequirement.project_manager_email ?? null;
        this.delivery_spoc_1_name = jobRequirement.delivery_spoc_1_name ?? null;
        this.delivery_spoc_1_email = jobRequirement.delivery_spoc_1_email ?? null;
        this.delivery_spoc_2_name = jobRequirement.delivery_spoc_2_name ?? null;
        this.delivery_spoc_2_email = jobRequirement.delivery_spoc_2_email ?? null;
        this.bgv_timing = jobRequirement.bgv_timing ?? null;
        this.bgv_vendor = jobRequirement.bgv_vendor ?? null;
        this.interview_mode = jobRequirement.interview_mode ?? null;
        this.interview_platforms = jobRequirement.interview_platforms ?? null;
        this.screenshot_requirement = jobRequirement.screenshot_requirement ?? null;
        this.vendor_rate = jobRequirement.vendor_rate ?? null;
        this.currency = jobRequirement.currency ?? null;
        this.client_name = jobRequirement.client_name ?? null;
        this.email_subject = jobRequirement.email_subject ?? null;
        this.email_received_date = jobRequirement.email_received_date ?? null;
        this.active_flag = jobRequirement.active_flag;
        this.priority = jobRequirement.priority;
        this.extra_fields = jobRequirement.extra_fields ?? {};
        this.created_at = jobRequirement.created_at;
        this.updated_at = jobRequirement.updated_at;
        this.created_by = jobRequirement.created_by ?? null;
    }
}
