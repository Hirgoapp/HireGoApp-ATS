/**
 * Shared interface for AI job extraction results
 * Used by all AI parser services (Sambanova, Gemini, Hybrid)
 */
export interface AIJobExtractionResult {
    client_req_id?: string;
    title?: string;
    client_code?: string;
    domain_industry?: string;
    pu_unit?: string;
    openings?: number;
    required_skills?: string[];
    desired_skills?: string[];
    total_experience?: string;
    relevant_experience?: string;
    work_locations?: string[];
    work_mode?: string;
    interview_mode?: string;
    background_check_timing?: string;
    vendor_rate_text?: string;
    vendor_rate_value?: number;
    vendor_rate_currency?: string;
    vendor_rate_unit?: string;
    submission_email?: string;
    client_project_manager?: string;
    delivery_spoc?: string;
    confidence: number;
    provider?: string; // Which AI provider was used (Sambanova, Gemini, merged, etc.)
}
