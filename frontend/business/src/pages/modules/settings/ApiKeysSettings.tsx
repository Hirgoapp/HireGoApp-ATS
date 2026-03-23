import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { useAuthStore } from '../../../stores/authStore';
import { createApiKey, listApiKeys, revokeApiKey, rotateApiKey, type ApiKeyItem } from '../../../modules/admin/services/apiKeys.api';

const COMMON_SCOPES = [
    'jobs:read',
    'jobs:create',
    'candidates:read',
    'candidates:create',
    'submissions:read',
    'submissions:update',
    'reports:read',
    'reports:export',
    'webhooks:read',
    'webhooks:create',
];

export default function ApiKeysSettings() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);

    const canRead = has('api-keys:read');
    const canCreate = has('api-keys:create');
    const canUpdate = has('api-keys:update');
    const canDelete = has('api-keys:delete');

    const [rows, setRows] = useState<ApiKeyItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [scopesText, setScopesText] = useState('jobs:read,candidates:read');
    const [createdSecret, setCreatedSecret] = useState<string | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await listApiKeys();
            setRows(data);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to load API keys');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canRead) {
            load();
        }
    }, []);

    const suggested = useMemo(() => COMMON_SCOPES.join(', '), []);

    const handleCreate = async () => {
        try {
            setError(null);
            const scopes = scopesText
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean);
            if (!name.trim() || scopes.length === 0) {
                setError('Name and at least one scope are required.');
                return;
            }
            const result = await createApiKey({ name: name.trim(), scopes });
            setCreatedSecret(result.key);
            setName('');
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to create key');
        }
    };

    const handleRotate = async (id: string) => {
        try {
            setError(null);
            const result = await rotateApiKey(id);
            setCreatedSecret(result.key);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to rotate key');
        }
    };

    const handleRevoke = async (id: string) => {
        try {
            setError(null);
            await revokeApiKey(id);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to revoke key');
        }
    };

    if (!canRead) {
        return <StatePanel title="Access Denied" message="Missing required permissions: api-keys:read" tone="danger" />;
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="API Keys"
                subtitle="Create and manage machine credentials for external system integrations."
                actions={<button className="ghost-button" type="button" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>}
            />

            {error ? <SurfaceCard><div className="state-message" style={{ color: '#b91c1c' }}>{error}</div></SurfaceCard> : null}

            {createdSecret ? (
                <SurfaceCard>
                    <div className="block-title">New Secret</div>
                    <div className="state-message">Copy this key now. It will not be shown again.</div>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 10 }}>{createdSecret}</pre>
                </SurfaceCard>
            ) : null}

            <SurfaceCard>
                <div className="block-title">Create API Key</div>
                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
                    <input value={scopesText} onChange={(e) => setScopesText(e.target.value)} placeholder="Comma-separated scopes" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
                    <div className="state-message">Suggested scopes: {suggested}</div>
                    <div>
                        <button className="primary-button" type="button" onClick={handleCreate} disabled={!canCreate}>Create Key</button>
                    </div>
                </div>
            </SurfaceCard>

            <SurfaceCard>
                <div className="block-title">Existing Keys</div>
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    {rows.map((row) => (
                        <div key={row.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ minWidth: 220 }}>
                                <div style={{ fontWeight: 800 }}>{row.name}</div>
                                <div className="state-message">{row.keyPreview} • {row.isActive ? 'Active' : 'Inactive'}</div>
                                <div className="state-message">Scopes: {row.scopes?.join(', ') || 'none'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="ghost-button" type="button" onClick={() => handleRotate(row.id)} disabled={!canUpdate}>Rotate</button>
                                <button className="ghost-button" type="button" onClick={() => handleRevoke(row.id)} disabled={!canDelete}>Revoke</button>
                            </div>
                        </div>
                    ))}
                </div>

                {!loading && rows.length === 0 ? (
                    <div style={{ marginTop: 12 }}>
                        <StatePanel title="No API keys yet" message="Create your first key to integrate external systems." />
                    </div>
                ) : null}
            </SurfaceCard>
        </div>
    );
}
