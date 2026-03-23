import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import SurfaceCard from '../../components/ui/SurfaceCard';
import StatePanel from '../../components/ui/StatePanel';
import { useAuthStore } from '../../stores/authStore';
import {
    fetchPermissions,
    fetchRolePermissionKeys,
    fetchRoles,
    setRolePermissionKeys,
    type PermissionDef,
    type RoleDef,
} from '../../modules/admin/services/rbac.api';

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: 'white',
    fontSize: 14,
};

const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    border: '1px solid #e5e7eb',
    background: '#fff',
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 700,
};

const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
};

// SaaS-friendly columns: keep it small and understandable.
// - "Read" controls both read/view if both exist.
// - "All" is a row-level toggle, not a separate action column.
const COLUMN_ACTIONS = ['read', 'create', 'update', 'delete', 'manage'] as const;
type ColumnAction = (typeof COLUMN_ACTIONS)[number];

function prettyResource(resource: string) {
    return resource.replace(/_/g, ' ');
}

const COLUMN_ACTION_ALIASES: Record<ColumnAction, string[]> = {
    // Read-like
    read: ['read', 'view', 'access'],
    // Create-like (side effects)
    create: ['create', 'send', 'enqueue', 'invite'],
    // Update-like
    update: ['update', 'write', 'publish'],
    // Delete-like
    delete: ['delete', 'revoke'],
    // Manage-like
    manage: ['manage'],
};

export default function AccessControl() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const hasPermission = (permission: string) => permissions.includes('*') || permissions.includes(permission);
    const canManage = hasPermission('roles:manage');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [roles, setRoles] = useState<RoleDef[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');
    const [allPerms, setAllPerms] = useState<PermissionDef[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [search, setSearch] = useState('');
    const [resourceFilter, setResourceFilter] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const filteredPerms = useMemo(() => {
        const list = allPerms
            .filter((p) => p.is_active)
            .filter((p) => (resourceFilter ? p.resource === resourceFilter : true))
            .filter((p) => {
                if (!search.trim()) return true;
                const s = search.trim().toLowerCase();
                return (
                    p.key.toLowerCase().includes(s) ||
                    p.resource.toLowerCase().includes(s) ||
                    (p.description || '').toLowerCase().includes(s)
                );
            });
        return list;
    }, [allPerms, resourceFilter, search]);

    // Build a SaaS-friendly matrix: resource rows × columns
    const matrix = useMemo(() => {
        const byResource = new Map<string, PermissionDef[]>();
        filteredPerms.forEach((p) => {
            const arr = byResource.get(p.resource) || [];
            arr.push(p);
            byResource.set(p.resource, arr);
        });

        const rows = Array.from(byResource.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([resource, perms]) => {
                const byAction = new Map<string, PermissionDef[]>();
                perms.forEach((p) => {
                    const arr = byAction.get(p.action) || [];
                    arr.push(p);
                    byAction.set(p.action, arr);
                });

                const core: Partial<Record<ColumnAction, PermissionDef[]>> = {};
                (COLUMN_ACTIONS as unknown as ColumnAction[]).forEach((col) => {
                    const aliases = COLUMN_ACTION_ALIASES[col] || [col];
                    const merged: PermissionDef[] = [];
                    aliases.forEach((a) => {
                        const v = byAction.get(a);
                        if (v && v.length) merged.push(...v);
                    });
                    if (merged.length) core[col] = merged;
                });

                // Everything else is “advanced”
                const advanced = perms.filter(
                    (p) => {
                        const known = new Set<string>([
                            ...COLUMN_ACTION_ALIASES.read,
                            ...COLUMN_ACTION_ALIASES.create,
                            ...COLUMN_ACTION_ALIASES.update,
                            ...COLUMN_ACTION_ALIASES.delete,
                            ...COLUMN_ACTION_ALIASES.manage,
                        ]);
                        return !known.has(p.action);
                    },
                );

                return {
                    resource,
                    core,
                    advanced,
                    total: perms.length,
                };
            });

        return rows;
    }, [filteredPerms]);

    const resources = useMemo(() => {
        const set = new Set(allPerms.filter((p) => p.is_active).map((p) => p.resource));
        return Array.from(set.values()).sort();
    }, [allPerms]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const [r, p] = await Promise.all([fetchRoles(), fetchPermissions()]);
                const tenantRoles = r.filter((role) => !!role.company_id);
                tenantRoles.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name));
                setRoles(tenantRoles);
                setAllPerms(p);
                if (tenantRoles.length > 0) {
                    setSelectedRoleId(tenantRoles[0].id);
                }
            } catch (err: any) {
                setError(err?.response?.data?.message || err.message || 'Failed to load access control data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const loadRoleKeys = async () => {
            if (!selectedRoleId) return;
            try {
                setError(null);
                const keys = await fetchRolePermissionKeys(selectedRoleId);
                setSelectedKeys(new Set(keys));
                setDirty(false);
            } catch (err: any) {
                setError(err?.response?.data?.message || err.message || 'Failed to load role permissions');
            }
        };
        loadRoleKeys();
    }, [selectedRoleId]);

    const toggleKey = (key: string) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
        setDirty(true);
    };

    const setResourceAll = (resource: string, enabled: boolean) => {
        const keys = allPerms.filter((p) => p.is_active && p.resource === resource).map((p) => p.key);
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            keys.forEach((k) => {
                if (enabled) next.add(k);
                else next.delete(k);
            });
            return next;
        });
        setDirty(true);
    };

    const setResourceActionAll = (resource: string, action: string, enabled: boolean) => {
        const keys = allPerms
            .filter((p) => p.is_active && p.resource === resource && p.action === action)
            .map((p) => p.key);
        if (keys.length === 0) return;
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            keys.forEach((k) => {
                if (enabled) next.add(k);
                else next.delete(k);
            });
            return next;
        });
        setDirty(true);
    };

    const setKeys = (keys: string[], enabled: boolean) => {
        if (keys.length === 0) return;
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            keys.forEach((k) => {
                if (enabled) next.add(k);
                else next.delete(k);
            });
            return next;
        });
        setDirty(true);
    };

    const save = async () => {
        if (!selectedRoleId) return;
        try {
            setSaving(true);
            setError(null);
            await setRolePermissionKeys(selectedRoleId, Array.from(selectedKeys.values()));
            setDirty(false);
            setSuccess('Saved');
            setTimeout(() => setSuccess(null), 2000);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to save role permissions');
        } finally {
            setSaving(false);
        }
    };

    if (!canManage) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to manage roles and permissions."
                tone="danger"
            />
        );
    }

    if (loading) {
        return (
            <div className="page-stack">
                <PageHeader title="Access Control" subtitle="Manage roles and permissions for your company." />
                <SurfaceCard>
                    <div className="state-message">Loading…</div>
                </SurfaceCard>
            </div>
        );
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Access Control"
                subtitle="Pick a role, then enable what that role can do. Save applies immediately."
                actions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {success ? (
                            <span className="nav-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                                {success}
                            </span>
                        ) : null}
                        {dirty ? <span className="nav-badge">Unsaved changes</span> : <span className="nav-badge">Saved</span>}
                        <button
                            type="button"
                            className="primary-button"
                            disabled={!dirty || saving}
                            onClick={save}
                            title={!dirty ? 'No changes to save' : 'Save changes'}
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
                    <div>
                        <div style={labelStyle}>Role</div>
                        <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} style={inputStyle}>
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name} ({r.slug})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <div style={labelStyle}>Resource</div>
                        <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)} style={inputStyle}>
                            <option value="">All resources</option>
                            {resources.map((r) => (
                                <option key={r} value={r}>
                                    {prettyResource(r)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <div style={labelStyle}>Search</div>
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={inputStyle} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
                    <span style={chipStyle}>Enabled: {selectedKeys.size}</span>
                    <span style={chipStyle}>Available: {allPerms.filter((p) => p.is_active).length}</span>
                    <button type="button" className="ghost-button" onClick={() => setShowAdvanced((v) => !v)}>
                        {showAdvanced ? 'Hide advanced' : 'Show advanced'}
                    </button>
                    <div className="state-message" style={{ margin: 0 }}>
                        Tip: enable **Read** to view a module, then Create/Update/Delete as needed.
                    </div>
                </div>
            </SurfaceCard>

            <SurfaceCard className="no-padding overflow-hidden">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.7fr repeat(5, minmax(96px, 0.7fr))',
                        gap: 0,
                        padding: '10px 14px',
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                        color: '#6b7280',
                        background: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        alignItems: 'center',
                    }}
                >
                    <div>Module</div>
                    <div style={{ textAlign: 'center' }}>Read</div>
                    <div style={{ textAlign: 'center' }}>Create</div>
                    <div style={{ textAlign: 'center' }}>Update</div>
                    <div style={{ textAlign: 'center' }}>Delete</div>
                    <div style={{ textAlign: 'center' }}>Manage</div>
                </div>

                {matrix.length === 0 ? (
                    <div style={{ padding: 14 }} className="state-message">
                        No permissions match your filters.
                    </div>
                ) : (
                    matrix.map((row) => {
                        const totalKeys = allPerms.filter((p) => p.is_active && p.resource === row.resource).map((p) => p.key);
                        const enabledCount = totalKeys.filter((k) => selectedKeys.has(k)).length;
                        const allOn = totalKeys.length > 0 && enabledCount === totalKeys.length;

                        return (
                            <div
                                key={row.resource}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.7fr repeat(5, minmax(96px, 0.7fr))',
                                    padding: '10px 14px',
                                    borderBottom: '1px solid #f3f4f6',
                                    alignItems: 'center',
                                    gap: 0,
                                }}
                            >
                                <div style={{ display: 'grid', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                        <div style={{ fontWeight: 900, textTransform: 'capitalize' }}>{prettyResource(row.resource)}</div>
                                        <button
                                            type="button"
                                            className="ghost-button"
                                            onClick={() => setKeys(totalKeys, !allOn)}
                                            style={{ padding: '8px 10px' }}
                                            title={allOn ? 'Disable all for this module' : 'Enable all for this module'}
                                        >
                                            {allOn ? 'All on' : 'All off'}
                                        </button>
                                    </div>
                                    <div className="state-message" style={{ margin: 0 }}>
                                        {enabledCount}/{totalKeys.length} enabled
                                    </div>
                                </div>

                                {COLUMN_ACTIONS.map((action) => {
                                    const perms = row.core[action];
                                    const keys = (perms || []).map((p) => p.key);
                                    const hasAny = keys.length > 0;
                                    const allOn = hasAny && keys.every((k) => selectedKeys.has(k));
                                    const someOn = hasAny && !allOn && keys.some((k) => selectedKeys.has(k));

                                    const bg = !hasAny
                                        ? '#ffffff'
                                        : allOn
                                            ? 'color-mix(in srgb, var(--accent-color) 12%, white)'
                                            : someOn
                                                ? '#fff7ed'
                                                : '#ffffff';

                                    return (
                                        <div key={action} style={{ display: 'flex', justifyContent: 'center' }}>
                                            <button
                                                type="button"
                                                className="ghost-button"
                                                disabled={!hasAny}
                                                onClick={() => setKeys(keys, !allOn)}
                                                title={!hasAny ? 'Not applicable' : allOn ? 'Click to disable' : 'Click to enable'}
                                                style={{
                                                    width: 44,
                                                    height: 36,
                                                    padding: 0,
                                                    borderRadius: 12,
                                                    background: bg,
                                                    border: '1px solid #e5e7eb',
                                                    fontWeight: 900,
                                                }}
                                            >
                                                {!hasAny ? '—' : allOn ? 'On' : 'Off'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
            </SurfaceCard>

            {showAdvanced ? (
                <SurfaceCard>
                    <h2 className="block-title">Advanced permissions</h2>
                    <div className="state-message">
                        These are uncommon actions not in the standard Read/Create/Update/Delete/Manage model. Only change if you know you need them.
                    </div>

                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                        {matrix
                            .filter((r) => r.advanced.length > 0)
                            .map((r) =>
                                r.advanced.map((p) => {
                                    const checked = selectedKeys.has(p.key);
                                    return (
                                        <label
                                            key={p.key}
                                            style={{
                                                border: '1px solid #e5e7eb',
                                                borderRadius: 12,
                                                padding: 12,
                                                background: checked ? 'color-mix(in srgb, var(--accent-color) 7%, white)' : '#fff',
                                                display: 'grid',
                                                gridTemplateColumns: '20px 1fr',
                                                gap: 10,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <input type="checkbox" checked={checked} onChange={() => toggleKey(p.key)} style={{ marginTop: 2 }} />
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: 13 }}>{p.key}</div>
                                                {p.description ? <div style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>{p.description}</div> : null}
                                            </div>
                                        </label>
                                    );
                                }),
                            )}
                    </div>
                </SurfaceCard>
            ) : null}
        </div>
    );
}

