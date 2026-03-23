import api from '../../../services/api';

export interface WebhookSubscription {
    id: string;
    eventType: string;
    targetUrl: string;
    isActive: boolean;
    description?: string;
    createdAt: string;
}

export interface WebhookLog {
    id: string;
    subscriptionId: string;
    eventType: string;
    status: string;
    httpStatus?: number;
    errorMessage?: string;
    createdAt: string;
}

export async function listWebhookSubscriptions(): Promise<WebhookSubscription[]> {
    const res = await api.get('/webhooks/subscriptions');
    return (res.data ?? []) as WebhookSubscription[];
}

export async function createWebhookSubscription(payload: {
    eventType: string;
    targetUrl: string;
    description?: string;
}): Promise<WebhookSubscription> {
    const res = await api.post('/webhooks/subscriptions', payload);
    return (res.data ?? {}) as WebhookSubscription;
}

export async function testWebhookSubscription(id: string) {
    const res = await api.post(`/webhooks/subscriptions/${id}/test`);
    return res.data;
}

export async function rotateWebhookSecret(id: string): Promise<{ secret: string }> {
    const res = await api.post(`/webhooks/subscriptions/${id}/rotate-secret`);
    return (res.data ?? {}) as { secret: string };
}

export async function deleteWebhookSubscription(id: string): Promise<void> {
    await api.delete(`/webhooks/subscriptions/${id}`);
}

export async function listWebhookLogs(subscriptionId?: string): Promise<WebhookLog[]> {
    const res = await api.get('/webhooks/logs', {
        params: subscriptionId ? { subscriptionId } : undefined,
    });
    return (res.data ?? []) as WebhookLog[];
}
