import api from '../../../services/api';
import type { Candidate } from '../../candidates/services/candidates.api';
import type { JobListItem } from '../../jobs/services/jobs.api';

export interface SubmissionListItem {
    id: string; // UUID
    company_id: string; // UUID
    candidate_id: string; // UUID
    job_id: string; // UUID
    status: string; // current_stage in DB
    submitted_at: string;
    moved_to_stage_at: string;
    outcome: string | null;
    outcome_date: string | null;
    internal_notes: string | null;
    source: string | null;
    score: number | null;
    created_at: string;
    updated_at: string;
    candidate?: Candidate;
    job?: JobListItem;
}

export interface SubmissionDetail extends SubmissionListItem {
    tags?: any[] | null;
}

export interface FetchSubmissionsParams {
    skip?: number;
    take?: number;
    job_id?: string;
    candidate_id?: string;
    status?: string;
    /** e.g. `candidate`, `job`, or `candidate,job` (comma-separated). */
    include?: string;
    orderBy?: 'created_at' | 'updated_at';
    orderDirection?: 'ASC' | 'DESC';
}

export interface SubmissionsListResponse {
    data: SubmissionListItem[];
    total: number;
    skip: number;
    take: number;
}

export interface CreateSubmissionPayload {
    job_requirement_id: number;
    profile_submission_date: string;
    candidate_name: string;
    daily_submission_id?: number;
    vendor_email_id?: string;
    candidate_title?: string;
    candidate_phone?: string;
    candidate_email?: string;
    candidate_notice_period?: string;
    candidate_current_location?: string;
    candidate_location_applying_for?: string;
    candidate_total_experience?: number;
    candidate_relevant_experience?: number;
    candidate_skills?: string;
    vendor_quoted_rate?: number;
    interview_screenshot_url?: string;
    interview_platform?: string;
    screenshot_duration_minutes?: number;
    candidate_visa_type?: string;
    candidate_engagement_type?: string;
    candidate_ex_infosys_employee_id?: string;
    submitted_by_user_id?: number;
    submitted_at?: string;
    submission_status?: string;
    status_updated_at?: string;
    client_feedback?: string;
    client_feedback_date?: string;
    extra_fields?: Record<string, any>;
}

export interface UpdateSubmissionPayload {
    internal_notes?: string;
    cover_letter?: string;
    salary_expectation?: number;
    notes?: Record<string, unknown>;
}

export async function fetchSubmissions(params: FetchSubmissionsParams = {}): Promise<SubmissionsListResponse> {
    try {
        const response = await api.get<{
            data: SubmissionListItem[];
            total: number;
            skip: number;
            take: number;
        }>('/submissions', {
            params: {
                skip: params.skip ?? 0,
                take: params.take ?? 20,
                job_id: params.job_id,
                candidate_id: params.candidate_id,
                status: params.status,
                include: params.include,
            },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch submissions');
    }
}

export async function getSubmissionById(id: string): Promise<SubmissionDetail> {
    try {
        const response = await api.get<SubmissionDetail>(`/submissions/${id}`);
        return (response.data as any).data ?? response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch submission');
    }
}

export async function createSubmission(payload: CreateSubmissionPayload): Promise<SubmissionDetail> {
    try {
        const response = await api.post<SubmissionDetail>('/submissions', payload as any);
        return (response.data as any).data ?? response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create submission');
    }
}

export async function updateSubmission(id: string, payload: UpdateSubmissionPayload): Promise<SubmissionDetail> {
    try {
        const response = await api.patch<SubmissionDetail>(`/submissions/${id}`, payload as any);
        return (response.data as any).data ?? response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update submission');
    }
}

export async function deleteSubmission(id: string): Promise<void> {
    try {
        await api.delete(`/submissions/${id}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete submission');
    }
}
