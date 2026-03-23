import api from '../../../services/api';

// Multi-tenant Job schema (matches backend)
export interface JobListItem {
    id: string; // UUID
    company_id: string; // UUID
    title: string;
    // Legacy/alt title
    job_title?: string | null;
    description?: string | null;
    requirements?: string | null;
    job_code?: string | null;
    salary_min?: number | null;
    salary_max?: number | null;
    salary_currency?: string | null;
    currency?: string | null;
    employment_type?: string | null;
    status: 'open' | 'closed' | 'draft' | 'archived';
    location?: string | null;
    department?: string | null;
    hiring_manager_id?: string | null;
    created_by_id?: string | null;
    pipeline_id?: string | null;
    custom_fields?: Record<string, any> | null;
    required_skills?: string[] | null;
    preferred_skills?: string[] | null;
    tags?: string[] | null;
    openings?: number | null;
    years_required?: number | null;
    is_remote?: boolean | null;
    is_hybrid?: boolean | null;
    priority?: number | null;
    target_hire_date?: string | null;
    published_at?: string | null;
    closed_at?: string | null;
    // Requirement-centric fields from email extraction
    requirement_status?: string | null;
    client_id?: string | null;
    client_req_id?: string | null; // ECMS Req ID
    client_code?: string | null;
    client_project_manager?: string | null;
    delivery_spoc?: string | null;
    pu_unit?: string | null;
    vendor_rate_value?: number | null;
    vendor_rate_currency?: string | null;
    vendor_rate_unit?: string | null;
    vendor_rate_text?: string | null;
    interview_mode?: string | null;
    work_mode?: string | null;
    background_check_timing?: string | null;
    domain_industry?: string | null;
    relevant_experience?: string | null;
    desired_skills?: string[] | null;
    work_locations?: string[] | null;
    submission_email?: string | null;
    email_source_id?: string | null;
    version?: number | null;
    is_latest_version?: boolean | null;
    original_job_id?: string | null;
    // Email import fields
    raw_email_content?: string | null;
    extracted_fields?: Record<string, any> | null;
    candidate_tracker_format?: Record<string, any> | null;
    submission_guidelines?: string | null;
    jd_metadata?: Record<string, any> | null;
    // Dynamic JD fields
    use_dynamic_jd?: boolean | null;
    jd_content?: string | null;
    jd_format?: 'plain' | 'markdown' | 'html' | 'structured' | null;
    jd_file_url?: string | null;
    jd_file_metadata?: Record<string, any> | null;
    jd_sections?: Array<{ heading: string; content: string; order: number; type?: string }> | null;
    created_at: string;
    updated_at: string;
}

export interface JobDetail extends JobListItem {
    hiring_manager?: { id: string; first_name: string; last_name: string; email: string } | null;
    created_by?: { id: string; first_name: string; last_name: string; email: string } | null;
    pipeline?: { id: string; name: string; stages: any[] } | null;
}

export type JobSortField =
    | 'created_at'
    | 'updated_at'
    | 'title'
    | 'status'
    | 'department'
    | 'location'
    | 'employment_type'
    | 'job_code'
    | 'salary_min';

export interface FetchJobsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'open' | 'closed' | 'draft' | 'archived';
    department?: string;
    client_id?: string;
    location?: string;
    orderBy?: JobSortField;
    orderDirection?: 'ASC' | 'DESC';
}

export interface JobListStats {
    totalJobs: number;
    openJobs: number;
    closedJobs: number;
    draftJobs: number;
    archivedJobs: number;
}

export interface JobsListResponse {
    items: JobListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateJobPayload {
    title: string;
    description?: string;
    requirements?: string;
    salary_min?: number;
    salary_max?: number;
    employment_type?: string;
    status?: 'open' | 'closed' | 'draft' | 'archived';
    location?: string;
    department?: string;
    hiring_manager_id?: string;
    pipeline_id?: string;
    client_id?: string;
    poc_id?: string;
    custom_fields?: Record<string, any>;
    required_skills?: string[];
    preferred_skills?: string[];
    tags?: string[];
    // Dynamic JD fields
    use_dynamic_jd?: boolean;
    jd_content?: string;
    jd_format?: 'plain' | 'markdown' | 'html' | 'structured';
    jd_sections?: Array<{ heading: string; content: string; order: number; type?: string }>;
}

export interface UpdateJobPayload {
    title?: string;
    description?: string;
    requirements?: string;
    salary_min?: number;
    salary_max?: number;
    employment_type?: string;
    status?: 'open' | 'closed' | 'draft' | 'archived';
    location?: string;
    department?: string;
    hiring_manager_id?: string;
    pipeline_id?: string;
    client_id?: string;
    poc_id?: string;
    custom_fields?: Record<string, any>;
    required_skills?: string[];
    preferred_skills?: string[];
    tags?: string[];
}

export async function fetchJobs(params: FetchJobsParams = {}): Promise<JobsListResponse> {
    try {
        const queryParams: Record<string, unknown> = {
            page: params.page || 1,
            limit: params.limit || 20,
            search: params.search,
            status: params.status,
            department: params.department,
            orderBy: params.orderBy || 'created_at',
            orderDirection: params.orderDirection || 'DESC',
        };
        if (params.client_id) queryParams.client_id = params.client_id;
        if (params.location?.trim()) queryParams.location = params.location.trim();

        const response = await api.get<any>('/jobs', { params: queryParams });
        return {
            items: response.data.data || [],
            total: response.data.total || 0,
            page: response.data.page || 1,
            limit: response.data.limit || 20,
        };
    } catch (error: any) {
        console.error('❌ Failed to fetch jobs:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch jobs');
    }
}

export async function getJobById(id: string): Promise<JobDetail> {
    try {
        const response = await api.get<any>(`/jobs/${id}`);
        // Handle both wrapped ({ data: Job }) and raw (Job) responses
        return response.data.data || response.data;
    } catch (error: any) {
        console.error('Failed to fetch job:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch job');
    }
}

export async function createJob(payload: CreateJobPayload): Promise<JobDetail> {
    try {
        const response = await api.post<any>('/jobs', payload);
        // Handle both wrapped ({ data: Job }) and raw (Job) responses
        return response.data.data || response.data;
    } catch (error: any) {
        console.error('Failed to create job:', error);
        throw new Error(error.response?.data?.message || 'Failed to create job');
    }
}

export async function updateJob(id: string, payload: UpdateJobPayload): Promise<JobDetail> {
    try {
        const response = await api.patch<any>(`/jobs/${id}`, payload);
        // Handle both wrapped ({ data: Job }) and raw (Job) responses
        return response.data.data || response.data;
    } catch (error: any) {
        console.error('Failed to update job:', error);
        throw new Error(error.response?.data?.message || 'Failed to update job');
    }
}

export async function deleteJob(id: string): Promise<void> {
    try {
        await api.delete(`/jobs/${id}`);
    } catch (error: any) {
        console.error('Failed to delete job:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete job');
    }
}

export async function fetchJobStats(): Promise<JobListStats> {
    try {
        const response = await api.get<any>('/jobs/stats');
        const raw = response.data?.data ?? response.data;
        return {
            totalJobs: Number(raw?.totalJobs) || 0,
            openJobs: Number(raw?.openJobs) || 0,
            closedJobs: Number(raw?.closedJobs) || 0,
            draftJobs: Number(raw?.draftJobs) || 0,
            archivedJobs: Number(raw?.archivedJobs) || 0,
        };
    } catch (error: any) {
        console.error('Failed to fetch job stats:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch job stats');
    }
}

export async function uploadJdFile(jobId: string, file: File): Promise<any> {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/jobs/${jobId}/jd-upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    } catch (error: any) {
        console.error('Failed to upload JD file:', error);
        throw new Error(error.response?.data?.message || 'Failed to upload JD file');
    }
}
