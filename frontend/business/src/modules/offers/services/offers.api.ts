import api from '../../../services/api';

// Enums
export enum EmploymentTypeEnum {
    FULL_TIME = 'full_time',
    CONTRACT = 'contract',
    INTERN = 'intern',
    PART_TIME = 'part_time',
}

export enum OfferStatusEnum {
    DRAFT = 'draft',
    ISSUED = 'issued',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn',
}

// Types
export interface OfferDetail {
    id: string; // UUID
    company_id: string; // UUID
    submission_id: string; // UUID
    status: OfferStatusEnum | string;
    offer_version?: number;
    current_version?: number;
    currency?: string;
    ctc?: string;
    designation?: string;
    joining_date?: string | null;
    base_salary?: number | string | null;
    bonus?: number | string | null;
    equity?: string | null;
    employment_type?: EmploymentTypeEnum | string;
    start_date?: string | null;
    expiry_date?: string | null;
    notes?: string | null;
    created_by_id?: number | string;
    updated_by_id?: number | string | null;
    created_at: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface FetchOffersParams {
    skip?: number;
    take?: number;
}

export interface CreateOfferPayload {
    submission_id: string; // Required
    employment_type: EmploymentTypeEnum; // Required
    start_date?: string;
    expiry_date?: string;
    currency?: string;
    base_salary?: number;
    bonus?: number;
    equity?: string;
    notes?: string;
}

export interface UpdateOfferPayload {
    start_date?: string;
    expiry_date?: string;
    currency?: string;
    base_salary?: number;
    bonus?: number;
    equity?: string;
    employment_type?: EmploymentTypeEnum;
    notes?: string;
}

export interface IssueOfferPayload {
    notes?: string;
}

export interface AcceptOfferPayload {
    accepted_at?: string;
    metadata?: Record<string, any>;
}

export interface RejectOfferPayload {
    reason?: string;
    metadata?: Record<string, any>;
}

export interface WithdrawOfferPayload {
    reason: string; // Required
}

export interface StatusHistoryEntry {
    id: string;
    offer_id: string;
    from_status: OfferStatusEnum | null;
    to_status: OfferStatusEnum;
    changed_by_id: number;
    changed_at: string;
    reason: string | null;
}

export interface OfferStatsResponse {
    draft: number;
    issued: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
    total: number;
}

// API Functions
export async function fetchOffers(params?: FetchOffersParams) {
    const response = await api.get<{
        data: OfferDetail[];
        total: number;
        skip: number;
        take: number;
    }>('/offers', {
        params,
    });
    return response.data;
}

export async function getOfferById(id: string) {
    const response = await api.get<OfferDetail>(`/offers/${id}`);
    return response.data;
}

export async function getOffersBySubmission(submissionId: string, params?: FetchOffersParams) {
    // Backend currently supports filtering by submission_id via list endpoint
    const response = await api.get<{ data: OfferDetail[]; total: number; skip: number; take: number }>(
        `/offers`,
        { params: { ...(params || {}), submission_id: submissionId } as any },
    );
    return response.data;
}

export async function createOffer(payload: CreateOfferPayload) {
    const response = await api.post<OfferDetail>('/offers', payload);
    return response.data;
}

export async function updateOffer(id: string, payload: UpdateOfferPayload) {
    const response = await api.patch<OfferDetail>(`/offers/${id}`, payload);
    return response.data;
}

export async function issueOffer(id: string, payload?: IssueOfferPayload) {
    const response = await api.post<OfferDetail>(`/offers/${id}/issue`, payload);
    return response.data;
}

export async function acceptOffer(id: string, payload?: AcceptOfferPayload) {
    const response = await api.post<OfferDetail>(`/offers/${id}/accept`, payload);
    return response.data;
}

export async function rejectOffer(id: string, payload?: RejectOfferPayload) {
    const response = await api.post<OfferDetail>(`/offers/${id}/reject`, payload);
    return response.data;
}

export async function withdrawOffer(id: string, payload: WithdrawOfferPayload) {
    const response = await api.post<OfferDetail>(`/offers/${id}/withdraw`, payload);
    return response.data;
}

export async function getOfferStatusHistory(id: string) {
    const response = await api.get<{ history: StatusHistoryEntry[] }>(
        `/offers/${id}/status-history`
    );
    return response.data;
}

export async function getOfferStats() {
    const response = await api.get<OfferStatsResponse>('/offers/stats/by-status');
    return response.data;
}

export async function deleteOffer(id: string) {
    await api.delete(`/offers/${id}`);
}
