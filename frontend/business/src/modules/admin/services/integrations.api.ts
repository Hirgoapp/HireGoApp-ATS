import api from '../../../services/api';

export interface IntegrationRecord {
    id: string;
    integration_type: string;
    config: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export async function listIntegrations(): Promise<IntegrationRecord[]> {
    const res = await api.get('/integrations');
    return (res.data as any).data as IntegrationRecord[];
}

export async function connectIntegration(integration_type: string, config?: Record<string, unknown>) {
    const res = await api.post('/integrations/connect', { integration_type, config: config ?? {} });
    return (res.data as any).data as IntegrationRecord;
}

export async function disconnectIntegration(integration_type: string) {
    const res = await api.post('/integrations/disconnect', { integration_type });
    return (res.data as any).data as IntegrationRecord;
}

export interface IntegrationAccountRecord {
    id: string;
    provider: 'google' | 'microsoft';
    email: string;
    is_verified: boolean;
    is_active: boolean;
    config: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export async function listGoogleSenderAccounts(): Promise<IntegrationAccountRecord[]> {
    const res = await api.get('/integrations/accounts/google');
    return (res.data as any).data as IntegrationAccountRecord[];
}

export async function addGoogleSenderAccount(email: string): Promise<IntegrationAccountRecord> {
    const res = await api.post('/integrations/accounts/google/add', { email });
    return (res.data as any).data as IntegrationAccountRecord;
}

export async function disableGoogleSenderAccount(email: string): Promise<IntegrationAccountRecord | null> {
    const res = await api.post('/integrations/accounts/google/disable', { email });
    return (res.data as any).data as IntegrationAccountRecord | null;
}

export async function getGoogleAuthorizeUrl(email?: string): Promise<string> {
    const res = await api.get('/integrations/oauth/google/authorize-url', {
        params: email ? { email } : undefined,
    });
    return (res.data as any).data?.url as string;
}

