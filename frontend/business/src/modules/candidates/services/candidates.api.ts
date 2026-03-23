import api from '../../../services/api';

export interface Candidate {
    id: string;
    company_id: string;
    candidate_name: string;
    email: string;
    phone: string;
    gender?: string;
    dob?: string;
    marital_status?: string;
    current_company?: string;
    total_experience?: number;
    relevant_experience?: number;
    current_ctc?: number;
    expected_ctc?: number;
    currency_code?: string;
    notice_period?: string;
    willing_to_relocate?: boolean;
    buyout?: boolean;
    reason_for_job_change?: string;
    skill_set?: string;
    current_location_id?: string;
    location_preference?: string;
    candidate_status?: string;
    source_id?: string;
    last_contacted_date?: string;
    last_submission_date?: string;
    notes?: string;
    extra_fields?: Record<string, any>;
    aadhar_number?: string;
    uan_number?: string;
    linkedin_url?: string;
    manager_screening_status?: string;
    client_name?: string;
    highest_qualification?: string;
    submission_date?: string;
    job_location?: string;
    source?: string;
    client?: string;
    recruiter_id?: string;
    date_of_entry?: string;
    manager_screening?: string;
    resume_parser_used?: string;
    extraction_confidence?: number;
    extraction_date?: string;
    resume_source_type?: string;
    is_suspicious?: boolean;
    cv_portal_id?: string;
    import_batch_id?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

export interface CandidateListResponse {
    data: Candidate[];
    total: number;
    page: number;
    limit: number;
}

export interface CandidateFilters {
    page?: number;
    limit?: number;
    search?: string;
    candidate_status?: string;
    source_id?: string;
    recruiter_id?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: 'created_at' | 'updated_at' | 'candidate_name' | 'email';
    sort_order?: 'ASC' | 'DESC';
}

export interface CandidateListSummary {
    total: number;
    active: number;
    inactive: number;
    submitted: number;
}

export interface CreateCandidatePayload {
    candidate_name: string;
    email: string;
    phone: string;
    gender?: string;
    dob?: string;
    marital_status?: string;
    current_company?: string;
    total_experience?: number;
    relevant_experience?: number;
    current_ctc?: number;
    expected_ctc?: number;
    currency_code?: string;
    notice_period?: string;
    willing_to_relocate?: boolean;
    buyout?: boolean;
    reason_for_job_change?: string;
    skill_set?: string;
    current_location_id?: string;
    location_preference?: string;
    candidate_status?: string;
    source_id?: string;
    last_contacted_date?: string;
    last_submission_date?: string;
    notes?: string;
    extra_fields?: Record<string, any>;
    aadhar_number?: string;
    uan_number?: string;
    linkedin_url?: string;
    manager_screening_status?: string;
    client_name?: string;
    highest_qualification?: string;
    submission_date?: string;
    job_location?: string;
    source?: string;
    client?: string;
    recruiter_id?: string;
    date_of_entry?: string;
    manager_screening?: string;
    resume_parser_used?: string;
    extraction_confidence?: number;
    extraction_date?: string;
    resume_source_type?: string;
    is_suspicious?: boolean;
    cv_portal_id?: string;
    import_batch_id?: string;
}

export type UpdateCandidatePayload = Partial<CreateCandidatePayload>;

export async function fetchCandidates(filters: CandidateFilters = {}): Promise<CandidateListResponse> {
    const params: Record<string, any> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
    };

    if (filters.search) params.search = filters.search;
    if (filters.candidate_status) params.candidate_status = filters.candidate_status;
    if (filters.source_id) params.source_id = filters.source_id;
    if (filters.recruiter_id) params.recruiter_id = filters.recruiter_id;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_order) params.sort_order = filters.sort_order;

    const response = await api.get<CandidateListResponse>('/candidates', { params });
    return response.data;
}

export async function fetchCandidateListSummary(): Promise<CandidateListSummary> {
    const response = await api.get<CandidateListSummary>('/candidates/stats');
    return response.data;
}

export async function getCandidate(id: string): Promise<Candidate> {
    const response = await api.get<{ data: Candidate }>(`/candidates/${id}`);
    // Controller wraps response as { data: Candidate }
    return (response.data as any).data ?? (response.data as any);
}

export async function createCandidate(payload: CreateCandidatePayload): Promise<Candidate> {
    const response = await api.post<{ data: Candidate }>('/candidates', payload);
    return (response.data as any).data ?? (response.data as any);
}

export async function updateCandidate(id: string, payload: UpdateCandidatePayload): Promise<Candidate> {
    const response = await api.patch<{ data: Candidate }>(`/candidates/${id}`, payload);
    return (response.data as any).data ?? (response.data as any);
}

export async function deleteCandidate(id: string): Promise<void> {
    await api.delete(`/candidates/${id}`);
}

