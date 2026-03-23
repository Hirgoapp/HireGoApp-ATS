import api from '../../../services/api';

export interface ApiKeyItem {
    id: string;
    keyPreview: string;
    name: string;
    scopes: string[];
    isActive: boolean;
    lastUsedAt?: string | null;
    expiresAt?: string | null;
    createdAt: string;
}

export interface CreatedApiKey {
    id: string;
    key: string;
    keyPreview: string;
}

export async function listApiKeys(): Promise<ApiKeyItem[]> {
    const res = await api.get('/api-keys');
    return (res.data ?? []) as ApiKeyItem[];
}

export async function createApiKey(payload: { name: string; scopes: string[]; expiresAt?: string }): Promise<CreatedApiKey> {
    const res = await api.post('/api-keys', payload);
    return (res.data ?? {}) as CreatedApiKey;
}

export async function rotateApiKey(id: string): Promise<CreatedApiKey> {
    const res = await api.post(`/api-keys/${id}/rotate`);
    return (res.data ?? {}) as CreatedApiKey;
}

export async function revokeApiKey(id: string): Promise<void> {
    await api.delete(`/api-keys/${id}`);
}
