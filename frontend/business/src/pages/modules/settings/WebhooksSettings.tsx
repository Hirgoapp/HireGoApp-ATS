import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { useAuthStore } from '../../../stores/authStore';
import {
    createWebhookSubscription,
    deleteWebhookSubscription,
    listWebhookLogs,
    listWebhookSubscriptions,
    rotateWebhookSecret,
    testWebhookSubscription,
    type WebhookLog,
    type WebhookSubscription,
} from '../../../modules/admin/services/webhooks.api';

const EVENT_TYPES = [
    'application.created',
    'application.stage_changed',
    'application.rejected',
    'application.hired',
    'candidate.created',
    'candidate.updated',
    'job.published',
    'job.closed',
    'interview.scheduled',
    'interview.completed',
    'evaluation.submitted',
    'offer.sent',
];

export default function WebhooksSettings() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);

    const canRead = has('webhooks:read');
    const canCreate = has('webhooks:create');
    const canUpdate = has('webhooks:update');
    const canDelete = has('webhooks:delete');
    const canTest = has('webhooks:test');

    const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('');
    const [eventType, setEventType] = useState(EVENT_TYPES[0]);
    const [targetUrl, setTargetUrl] = useState('');
    const [description, setDescription] = useState('');
    const [lastSecret, setLastSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const subs = await listWebhookSubscriptions();
            setSubscriptions(subs);
            const logsData = await listWebhookLogs(selectedSubscriptionId || undefined);
            setLogs(logsData);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to load webhooks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canRead) {
            loadAll();
        }
    }, [selectedSubscriptionId]);

    const create = async () => {
        try {
            setError(null);
            if (!targetUrl.trim()) {
                setError('Target URL is required.');
                return;
            }
            await createWebhookSubscription({ eventType, targetUrl: targetUrl.trim(), description: description.trim() || undefined });
            setTargetUrl('');
            setDescription('');
            await loadAll();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to create webhook');
        }
    };

    const rotate = async (id: string) => {
        try {
            const result = await rotateWebhookSecret(id);
            setLastSecret(result.secret);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to rotate secret');
        }
    };

    const runTest = async (id: string) => {
        try {
            await testWebhookSubscription(id);
            await loadAll();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to send test webhook');
        }
    };

    const remove = async (id: string) => {
        try {
            await deleteWebhookSubscription(id);
            await loadAll();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to delete webhook');
        }
    };

    const filteredLogs = useMemo(() => {
        if (!selectedSubscriptionId) return logs;
        return logs.filter((log) => log.subscriptionId === selectedSubscriptionId);
    }, [logs, selectedSubscriptionId]);

    if (!canRead) {
        return <StatePanel title="Access Denied" message="Missing required permissions: webhooks:read" tone="danger" />;
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Webhooks"
                subtitle="Publish lifecycle events to external systems with secure callbacks."
                actions={<button className="ghost-button" type="button" onClick={loadAll} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>}
            />

            {error ? <SurfaceCard><div className="state-message" style={{ color: '#b91c1c' }}>{error}</div></SurfaceCard> : null}

            {lastSecret ? (
                <SurfaceCard>
                    <div className="block-title">Rotated Secret</div>
                    <div className="state-message">Store this secret securely. It may not be shown again.</div>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 10 }}>{lastSecret}</pre>
                </SurfaceCard>
            ) : null}

            <SurfaceCard>
                <div className="block-title">Create Subscription</div>
                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                    <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}>
                        {EVENT_TYPES.map((evt) => <option key={evt} value={evt}>{evt}</option>)}
                    </select>
                    <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://example.com/webhook" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
                    <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
                    <div><button className="primary-button" type="button" onClick={create} disabled={!canCreate}>Create Subscription</button></div>
                </div>
            </SurfaceCard>

            <SurfaceCard>
                <div className="block-title">Subscriptions</div>
                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                    {subscriptions.map((sub) => (
                        <div key={sub.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ minWidth: 220 }}>
                                <div style={{ fontWeight: 800 }}>{sub.eventType}</div>
                                <div className="state-message">{sub.targetUrl}</div>
                                <div className="state-message">{sub.isActive ? 'Active' : 'Inactive'} • {sub.description || 'No description'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button className="ghost-button" type="button" onClick={() => setSelectedSubscriptionId(sub.id)}>View Logs</button>
                                <button className="ghost-button" type="button" onClick={() => rotate(sub.id)} disabled={!canUpdate}>Rotate Secret</button>
                                <button className="ghost-button" type="button" onClick={() => runTest(sub.id)} disabled={!canTest}>Test</button>
                                <button className="ghost-button" type="button" onClick={() => remove(sub.id)} disabled={!canDelete}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
                {!loading && subscriptions.length === 0 ? <div style={{ marginTop: 12 }}><StatePanel title="No subscriptions" message="Create your first webhook subscription." /></div> : null}
            </SurfaceCard>

            <SurfaceCard>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div className="block-title">Delivery Logs</div>
                    <select value={selectedSubscriptionId} onChange={(e) => setSelectedSubscriptionId(e.target.value)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #d1d5db' }}>
                        <option value="">All subscriptions</option>
                        {subscriptions.map((sub) => <option key={sub.id} value={sub.id}>{sub.eventType}</option>)}
                    </select>
                </div>
                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                    {filteredLogs.map((log) => (
                        <div key={log.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 }}>
                            <div style={{ fontWeight: 800 }}>{log.eventType}</div>
                            <div className="state-message">Status: {log.status}{typeof log.httpStatus === 'number' ? ` (${log.httpStatus})` : ''}</div>
                            <div className="state-message">{new Date(log.createdAt).toLocaleString()}</div>
                            {log.errorMessage ? <div className="state-message" style={{ color: '#b91c1c' }}>{log.errorMessage}</div> : null}
                        </div>
                    ))}
                </div>
                {!loading && filteredLogs.length === 0 ? <div style={{ marginTop: 12 }}><StatePanel title="No logs yet" message="Run a test delivery to generate logs." /></div> : null}
            </SurfaceCard>
        </div>
    );
}
