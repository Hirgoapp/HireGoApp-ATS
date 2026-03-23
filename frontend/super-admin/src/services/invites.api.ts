import { apiClient } from './apiClient';

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface SuperAdminInviteRow {
    id: string;
    email: string;
    companyId: string | null;
    companyName: string | null;
    role: string;
    status: InviteStatus;
    expiresAt: string;
    invitedById: string | null;
    invitedByEmail: string | null;
    lastSentAt: string | null;
    resentCount: number;
    acceptedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export async function getPendingInvitesCount(): Promise<number> {
    const res = await apiClient.get<{ data: { count: number } }>('/super-admin/invites/pending-count');
    return res.data?.data?.count ?? 0;
}

export async function listInvites(params: {
    page?: number;
    limit?: number;
    status?: InviteStatus;
    companyId?: string;
    search?: string;
}): Promise<{ invites: SuperAdminInviteRow[]; pagination: { page: number; limit: number; total: number } }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    if (params.companyId) q.set('companyId', params.companyId);
    if (params.search) q.set('search', params.search);
    const res = await apiClient.get(`/super-admin/invites?${q.toString()}`);
    return res.data.data;
}

export async function createInvite(body: {
    email: string;
    companyId?: string;
    role: string;
    expiresInDays?: number;
    personalMessage?: string;
}): Promise<{ invite: SuperAdminInviteRow; acceptUrl: string }> {
    const res = await apiClient.post('/super-admin/invites', body);
    return res.data.data;
}

export async function resendInvite(inviteId: string): Promise<{ invite: SuperAdminInviteRow; acceptUrl: string }> {
    const res = await apiClient.post(`/super-admin/invites/${inviteId}/resend`);
    return res.data.data;
}

export async function revokeInvite(inviteId: string): Promise<{ invite: SuperAdminInviteRow }> {
    const res = await apiClient.post(`/super-admin/invites/${inviteId}/revoke`);
    return res.data.data;
}
