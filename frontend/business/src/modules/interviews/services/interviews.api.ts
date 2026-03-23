import api from '../../../services/api';

// Enums
export enum InterviewMode {
    ONLINE = 'Online',
    OFFLINE = 'Offline',
    PHONE = 'Phone',
}

export enum InterviewRound {
    SCREENING = 'Screening',
    FIRST_ROUND = 'First Round',
    SECOND_ROUND = 'Second Round',
    THIRD_ROUND = 'Third Round',
    HR = 'HR',
    TECHNICAL = 'Technical',
}

export enum InterviewStatus {
    SCHEDULED = 'Scheduled',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
    RESCHEDULED = 'Rescheduled',
    NO_SHOW = 'No Show',
    IN_PROGRESS = 'In Progress',
}

// Types
export interface InterviewListItem {
    id: string; // UUID
    submission_id: string; // UUID
    job_requirement_id: string; // UUID
    round: InterviewRound;
    scheduled_date: string | null;
    scheduled_time: string | null;
    mode: InterviewMode;
    status: InterviewStatus;
    interviewer_id: string | null;
    created_at: string;
}

export interface InterviewDetail {
    id: string;
    company_id: string;
    submission_id: string;
    job_requirement_id: string;
    candidate_id: string | null;
    round: InterviewRound;
    scheduled_date: string | null;
    scheduled_time: string | null;
    interviewer_id: string | null;
    mode: InterviewMode;
    status: InterviewStatus;
    rating: number | null;
    feedback: string | null;
    outcome: string | null;
    candidate_notes: string | null;
    remarks: string | null;
    location: string | null;
    meeting_link: string | null;
    reschedule_reason: string | null;
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

/** Backend list uses page + limit (1-based page). */
export interface FetchInterviewsParams {
    page?: number;
    limit?: number;
    submissionId?: string;
    status?: string;
}

export interface CreateInterviewPayload {
    submission_id: string; // Required
    job_requirement_id: string; // Required
    round: InterviewRound; // Required
    mode: InterviewMode; // Required
    candidate_id?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    interviewer_id?: string;
    status?: InterviewStatus;
    rating?: number;
    feedback?: string;
    outcome?: string;
    candidate_notes?: string;
    remarks?: string;
    location?: string;
    meeting_link?: string;
    reschedule_reason?: string;
}

export interface UpdateInterviewPayload {
    submission_id?: string;
    job_requirement_id?: string;
    candidate_id?: string;
    round?: InterviewRound;
    scheduled_date?: string;
    scheduled_time?: string;
    interviewer_id?: string;
    mode?: InterviewMode;
    status?: InterviewStatus;
    rating?: number;
    feedback?: string;
    outcome?: string;
    candidate_notes?: string;
    remarks?: string;
    location?: string;
    meeting_link?: string;
    reschedule_reason?: string;
}

export interface FeedbackPayload {
    feedback: string; // Required
    rating: number; // Required, 0-10
    remarks?: string;
}

export interface ReschedulePayload {
    scheduled_date: string; // Required
    scheduled_time: string; // Required
    reason?: string;
}

export interface CancelPayload {
    reason?: string;
}

// API Functions
export async function fetchInterviews(params?: FetchInterviewsParams) {
    const response = await api.get<{
        data: InterviewListItem[];
        total: number;
        page: number;
        limit: number;
    }>('/interviews', {
        params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 20,
            ...(params?.submissionId ? { submissionId: params.submissionId } : {}),
            ...(params?.status ? { status: params.status } : {}),
        },
    });
    return response.data;
}

export async function getInterviewById(id: string) {
    const response = await api.get<InterviewDetail>(`/interviews/${id}`);
    return response.data;
}

export async function getInterviewsBySubmission(submissionId: string) {
    // Backend supports filtering by submissionId on list endpoint
    const response = await api.get<{ data: InterviewDetail[]; total: number; page: number; limit: number }>(
        `/interviews`,
        { params: { submissionId } },
    );
    return response.data.data;
}

export async function createInterview(payload: CreateInterviewPayload) {
    const response = await api.post<InterviewDetail>('/interviews', payload);
    return response.data;
}

export async function updateInterview(id: string, payload: UpdateInterviewPayload) {
    const response = await api.put<InterviewDetail>(`/interviews/${id}`, payload);
    return response.data;
}

export async function completeInterview(id: string) {
    const response = await api.put<InterviewDetail>(`/interviews/${id}/complete`);
    return response.data;
}

export async function cancelInterview(id: string, payload?: CancelPayload) {
    const response = await api.put<InterviewDetail>(`/interviews/${id}/cancel`, payload);
    return response.data;
}

export async function rescheduleInterview(id: string, payload: ReschedulePayload) {
    const response = await api.put<InterviewDetail>(`/interviews/${id}/reschedule`, payload);
    return response.data;
}

export async function submitFeedback(id: string, payload: FeedbackPayload) {
    const response = await api.put<InterviewDetail>(`/interviews/${id}/feedback`, payload);
    return response.data;
}

export async function deleteInterview(id: string) {
    await api.delete(`/interviews/${id}`);
}
