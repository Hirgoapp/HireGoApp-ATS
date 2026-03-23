import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { useAuthStore } from '../../../stores/authStore';
import api from '../../../services/api';
import { fetchRoles } from '../../../modules/admin/services/rbac.api';
import AccessControl from '../AccessControl';

type Role = {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    is_default: boolean;
    company_id: string | null;
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: 'white',
    fontSize: 14,
};

export default function RolesSettings() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);
    const canManage = has('roles:manage');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', slug: '', description: '' });
    const [saving, setSaving] = useState(false);

    const tenantRoles = useMemo(() => roles.filter((r) => !!r.company_id), [roles]);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const r = await fetchRoles();
            setRoles(r as any);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!canManage) {
        return <StatePanel title="Access Denied" message="Missing required permissions: roles:manage" tone="danger" />;
    }

    if (loading) {
        return (
            <SurfaceCard>
                <div className="state-message">Loading…</div>
            </SurfaceCard>
        );
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Roles"
                subtitle="Create roles and control what each role can do."
                actions={
                    <button className="primary-button" type="button" onClick={() => setShowCreate(true)}>
                        + New Role
                    </button>
                }
            />

            {error ? (
                <SurfaceCard>
                    <div className="state-message" style={{ color: '#b91c1c' }}>
                        {error}
                    </div>
                </SurfaceCard>
            ) : null}

            <SurfaceCard className="no-padding overflow-hidden">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 2fr 1fr',
                        padding: '10px 16px',
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: '#6b7280',
                        background: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                    }}
                >
                    <div>Name</div>
                    <div>Slug</div>
                    <div>Description</div>
                    <div style={{ textAlign: 'right' }}>Actions</div>
                </div>
                {tenantRoles.map((r) => (
                    <div
                        key={r.id}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1.2fr 1fr 2fr 1fr',
                            padding: '12px 16px',
                            borderBottom: '1px solid #f3f4f6',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div style={{ fontWeight: 900 }}>{r.name}</div>
                        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12 }}>{r.slug}</div>
                        <div style={{ color: '#6b7280' }}>{r.description || '—'}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                className="ghost-button"
                                type="button"
                                onClick={() => {
                                    // jump to AccessControl and select role via URL? (kept simple for now)
                                    window.location.href = '/app/admin/settings/permissions';
                                }}
                            >
                                Edit permissions
                            </button>
                            {r.slug !== 'company_admin' ? (
                                <button
                                    className="ghost-button"
                                    type="button"
                                    onClick={async () => {
                                        if (!window.confirm(`Delete role "${r.name}"?`)) return;
                                        try {
                                            setError(null);
                                            await api.delete(`/rbac/roles/${encodeURIComponent(r.id)}`);
                                            await load();
                                        } catch (err: any) {
                                            setError(err?.response?.data?.message || err.message || 'Failed to delete role');
                                        }
                                    }}
                                >
                                    Delete
                                </button>
                            ) : null}
                        </div>
                    </div>
                ))}
            </SurfaceCard>

            {/* Permission matrix is embedded on Permissions tab, but keep a shortcut here */}
            <SurfaceCard>
                <div className="block-title">Permission Matrix</div>
                <div className="state-message">Use the Permissions screen to edit what roles can do.</div>
            </SurfaceCard>

            {showCreate ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
                    onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
                >
                    <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, overflow: 'auto', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: 18, borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: 18, fontWeight: 900 }}>Create role</div>
                            <div className="state-message">Create a new tenant role you can assign to users.</div>
                        </div>
                        <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                            <label>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Name</div>
                                <input style={inputStyle} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                            </label>
                            <label>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Slug (optional)</div>
                                <input style={inputStyle} value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="e.g. sales_manager" />
                            </label>
                            <label>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Description</div>
                                <input style={inputStyle} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                            </label>
                        </div>
                        <div style={{ padding: 18, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button className="ghost-button" type="button" onClick={() => setShowCreate(false)} disabled={saving}>
                                Cancel
                            </button>
                            <button
                                className="primary-button"
                                type="button"
                                disabled={saving}
                                onClick={async () => {
                                    try {
                                        setSaving(true);
                                        setError(null);
                                        await api.post('/rbac/roles', form);
                                        setShowCreate(false);
                                        setForm({ name: '', slug: '', description: '' });
                                        await load();
                                    } catch (err: any) {
                                        setError(err?.response?.data?.message || err.message || 'Failed to create role');
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                            >
                                {saving ? 'Creating…' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

