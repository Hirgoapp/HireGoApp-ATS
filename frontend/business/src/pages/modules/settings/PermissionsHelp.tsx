import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { useAuthStore } from '../../../stores/authStore';
import { fetchPermissions, type PermissionDef } from '../../../modules/admin/services/rbac.api';

function titleCase(value: string) {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase());
}

function actionLabel(action: string) {
    if (action === 'read' || action === 'view') return 'Read (view/list)';
    if (action === 'create') return 'Create';
    if (action === 'update') return 'Update';
    if (action === 'delete') return 'Delete';
    if (action === 'manage') return 'Manage (admin)';
    return titleCase(action);
}

function defaultMeaning(resource: string, action: string) {
    const r = titleCase(resource);
    const a = actionLabel(action);
    return `${a} access for ${r}.`;
}

export default function PermissionsHelp() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);
    const canManage = has('roles:manage');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allPerms, setAllPerms] = useState<PermissionDef[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const perms = await fetchPermissions();
                setAllPerms(perms.filter((p) => p.is_active));
            } catch (err: any) {
                setError(err?.response?.data?.message || err.message || 'Failed to load permissions');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const rows = useMemo(() => {
        const s = search.trim().toLowerCase();
        const list = allPerms.filter((p) => {
            if (!s) return true;
            return (
                p.key.toLowerCase().includes(s) ||
                p.resource.toLowerCase().includes(s) ||
                p.action.toLowerCase().includes(s) ||
                (p.description || '').toLowerCase().includes(s)
            );
        });
        list.sort((a, b) => (a.resource.localeCompare(b.resource) || a.action.localeCompare(b.action) || a.key.localeCompare(b.key)));
        return list;
    }, [allPerms, search]);

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
                title="Permissions Help"
                subtitle="What each permission does, and how to enable/disable it."
                actions={
                    <NavLink to="/app/admin/settings/permissions" className="ghost-button">
                        Open Permission Matrix
                    </NavLink>
                }
            />

            {error ? (
                <SurfaceCard>
                    <div className="state-message" style={{ color: '#b91c1c' }}>
                        {error}
                    </div>
                </SurfaceCard>
            ) : null}

            <SurfaceCard>
                <div className="block-title">How to enable / disable permissions</div>
                <div className="state-message" style={{ display: 'grid', gap: 8 }}>
                    <div>
                        - Go to <b>Settings → Permissions</b>
                    </div>
                    <div>
                        - Select a <b>Role</b>
                    </div>
                    <div>
                        - Turn permissions <b>On/Off</b> (per module row or per column)
                    </div>
                    <div>
                        - Click <b>Save</b>
                    </div>
                    <div>
                        - Users may need to <b>logout → login</b> to refresh their token permissions
                    </div>
                </div>
            </SurfaceCard>

            <SurfaceCard>
                <div className="block-title">Search permissions</div>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by key, module, action, or description…"
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid #d1d5db',
                        background: 'white',
                        fontSize: 14,
                    }}
                />
                <div className="state-message" style={{ marginTop: 8 }}>
                    Showing <b>{rows.length}</b> active permission(s).
                </div>
            </SurfaceCard>

            <SurfaceCard className="no-padding overflow-hidden">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1fr 2fr',
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
                    <div>Module (resource)</div>
                    <div>Action</div>
                    <div>Permission key</div>
                    <div>Meaning / What it enables</div>
                </div>

                {rows.map((p) => (
                    <div
                        key={p.id}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1.2fr 1fr 1fr 2fr',
                            padding: '12px 16px',
                            borderBottom: '1px solid #f3f4f6',
                            gap: 10,
                            alignItems: 'start',
                        }}
                    >
                        <div style={{ fontWeight: 900 }}>{titleCase(p.resource)}</div>
                        <div>{actionLabel(p.action)}</div>
                        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12 }}>
                            {p.key}
                        </div>
                        <div style={{ color: '#374151' }}>
                            {p.description?.trim()?.length ? p.description : defaultMeaning(p.resource, p.action)}
                        </div>
                    </div>
                ))}
            </SurfaceCard>
        </div>
    );
}

