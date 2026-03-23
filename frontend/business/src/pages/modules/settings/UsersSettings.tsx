import { useEffect, useMemo, useState } from 'react';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import PageHeader from '../../../components/ui/PageHeader';
import { useAuthStore } from '../../../stores/authStore';
import { fetchRoles } from '../../../modules/admin/services/rbac.api';
import api from '../../../services/api';

type UserRow = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: string;
};

type Role = { id: string; name: string; slug: string };

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: 'white',
    fontSize: 14,
};

export default function UsersSettings() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);
    const canRead = has('roles:manage');
    const canCreate = has('users:create');
    const canUpdate = has('users:update');
    const canDelete = has('users:delete');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [success, setSuccess] = useState<string | null>(null);

    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ email: '', firstName: '', lastName: '', password: '', roleIds: [] as string[] });
    const [saving, setSaving] = useState(false);

    const [showEdit, setShowEdit] = useState(false);
    const [editId, setEditId] = useState<string>('');
    const [editForm, setEditForm] = useState({ email: '', firstName: '', lastName: '', isActive: true, password: '', roleIds: [] as string[] });
    const [editSaving, setEditSaving] = useState(false);

    const roleOptions = useMemo(() => roles.map((r) => ({ value: r.id, label: `${r.name} (${r.slug})` })), [roles]);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const [uRes, r] = await Promise.all([
                api.get('/rbac/users'),
                fetchRoles(),
            ]);
            setUsers((uRes.data as any).data.users as UserRow[]);
            setRoles(r.filter((x: any) => !!x.company_id) as any);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!canRead) {
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
                title="Users"
                subtitle="Create and manage users in your company."
                actions={
                    canCreate ? (
                        <button className="primary-button" type="button" onClick={() => setShowCreate(true)}>
                            + New User
                        </button>
                    ) : null
                }
            />

            {error ? (
                <SurfaceCard>
                    <div className="state-message" style={{ color: '#b91c1c' }}>
                        {error}
                    </div>
                </SurfaceCard>
            ) : null}
            {success ? (
                <SurfaceCard>
                    <div className="state-message" style={{ color: '#065f46' }}>
                        {success}
                    </div>
                </SurfaceCard>
            ) : null}

            <SurfaceCard className="no-padding overflow-hidden">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
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
                    <div>Email</div>
                    <div>First name</div>
                    <div>Last name</div>
                    <div>Status</div>
                    <div style={{ textAlign: 'right' }}>Actions</div>
                </div>
                {users.map((u) => (
                    <div
                        key={u.id}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                            padding: '12px 16px',
                            borderBottom: '1px solid #f3f4f6',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div style={{ fontWeight: 800 }}>{u.email}</div>
                        <div>{u.firstName}</div>
                        <div>{u.lastName}</div>
                        <div>
                            <span className="nav-badge" style={{ background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#166534' : '#991b1b' }}>
                                {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            {canUpdate ? (
                                <button
                                    type="button"
                                    className="ghost-button"
                                    onClick={async () => {
                                        try {
                                            setError(null);
                                            setSuccess(null);
                                            const [uRes, rolesRes] = await Promise.all([
                                                api.get(`/rbac/users/${encodeURIComponent(u.id)}`),
                                                api.get(`/rbac/users/${encodeURIComponent(u.id)}/roles`),
                                            ]);
                                            const full = (uRes.data as any).data.user;
                                            const roleIds = ((rolesRes.data as any).data.roles || []).map((r: any) => r.id);
                                            setEditId(u.id);
                                            setEditForm({
                                                email: full.email || u.email,
                                                firstName: full.firstName ?? u.firstName,
                                                lastName: full.lastName ?? u.lastName,
                                                isActive: !!full.isActive,
                                                password: '',
                                                roleIds,
                                            });
                                            setShowEdit(true);
                                        } catch (err: any) {
                                            setError(err?.response?.data?.message || err.message || 'Failed to load user details');
                                        }
                                    }}
                                >
                                    Edit
                                </button>
                            ) : null}
                            {canUpdate ? (
                                <button
                                    type="button"
                                    className="ghost-button"
                                    onClick={async () => {
                                        try {
                                            setError(null);
                                            setSuccess(null);
                                            await api.put(`/rbac/users/${encodeURIComponent(u.id)}`, { isActive: !u.isActive });
                                            setSuccess(`User ${u.isActive ? 'deactivated' : 'activated'}.`);
                                            await load();
                                        } catch (err: any) {
                                            setError(err?.response?.data?.message || err.message || 'Failed to update user');
                                        }
                                    }}
                                >
                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            ) : null}
                            {canDelete ? (
                                <button
                                    type="button"
                                    className="ghost-button"
                                    onClick={async () => {
                                        if (!window.confirm(`Deactivate user "${u.email}"?`)) return;
                                        try {
                                            setError(null);
                                            setSuccess(null);
                                            await api.delete(`/rbac/users/${encodeURIComponent(u.id)}`);
                                            setSuccess('User deactivated.');
                                            await load();
                                        } catch (err: any) {
                                            setError(err?.response?.data?.message || err.message || 'Failed to deactivate user');
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

            {showCreate ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
                    onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
                >
                    <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, overflow: 'auto', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: 18, borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: 18, fontWeight: 900 }}>Create user</div>
                            <div className="state-message">User will be created under this company.</div>
                        </div>
                        <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                            <label>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Email</div>
                                <input style={inputStyle} value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <label>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>First name</div>
                                    <input style={inputStyle} value={createForm.firstName} onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))} />
                                </label>
                                <label>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Last name</div>
                                    <input style={inputStyle} value={createForm.lastName} onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))} />
                                </label>
                            </div>
                            <label>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Password</div>
                                <input type="password" style={inputStyle} value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
                            </label>
                            <label>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Roles</div>
                                <select
                                    multiple
                                    style={{ ...inputStyle, height: 120 }}
                                    value={createForm.roleIds}
                                    onChange={(e) => {
                                        const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                                        setCreateForm((p) => ({ ...p, roleIds: values }));
                                    }}
                                >
                                    {roleOptions.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="state-message">Hold Ctrl/Command to select multiple roles.</div>
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
                                        setSuccess(null);
                                        await api.post('/rbac/users', createForm);
                                        setShowCreate(false);
                                        setCreateForm({ email: '', firstName: '', lastName: '', password: '', roleIds: [] });
                                        setSuccess('User created.');
                                        await load();
                                    } catch (err: any) {
                                        setError(err?.response?.data?.message || err.message || 'Failed to create user');
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

            {showEdit ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
                    onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}
                >
                    <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, overflow: 'auto', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: 18, borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: 18, fontWeight: 900 }}>Edit user</div>
                            <div className="state-message">Update profile, roles, and optionally reset password.</div>
                        </div>
                        <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                            <label>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Email</div>
                                <input style={inputStyle} value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <label>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>First name</div>
                                    <input style={inputStyle} value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} />
                                </label>
                                <label>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Last name</div>
                                    <input style={inputStyle} value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} />
                                </label>
                            </div>
                            <label>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Reset password (optional)</div>
                                <input type="password" style={inputStyle} value={editForm.password} onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))} placeholder="Leave blank to keep current password" />
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))} />
                                <span style={{ fontWeight: 800 }}>Active</span>
                            </label>
                            <label>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Roles</div>
                                <select
                                    multiple
                                    style={{ ...inputStyle, height: 140 }}
                                    value={editForm.roleIds}
                                    onChange={(e) => {
                                        const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                                        setEditForm((p) => ({ ...p, roleIds: values }));
                                    }}
                                >
                                    {roleOptions.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="state-message">Hold Ctrl/Command to select multiple roles.</div>
                            </label>
                        </div>
                        <div style={{ padding: 18, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {canDelete ? (
                                    <button
                                        className="ghost-button"
                                        type="button"
                                        disabled={editSaving}
                                        onClick={async () => {
                                            if (!window.confirm('Deactivate this user?')) return;
                                            try {
                                                setEditSaving(true);
                                                setError(null);
                                                setSuccess(null);
                                                await api.delete(`/rbac/users/${encodeURIComponent(editId)}`);
                                                setShowEdit(false);
                                                setSuccess('User deactivated.');
                                                await load();
                                            } catch (err: any) {
                                                setError(err?.response?.data?.message || err.message || 'Failed to deactivate user');
                                            } finally {
                                                setEditSaving(false);
                                            }
                                        }}
                                    >
                                        Deactivate user
                                    </button>
                                ) : null}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button className="ghost-button" type="button" onClick={() => setShowEdit(false)} disabled={editSaving}>
                                    Cancel
                                </button>
                                <button
                                    className="primary-button"
                                    type="button"
                                    disabled={editSaving}
                                    onClick={async () => {
                                        try {
                                            setEditSaving(true);
                                            setError(null);
                                            setSuccess(null);

                                            const updatePayload: any = {
                                                email: editForm.email,
                                                firstName: editForm.firstName,
                                                lastName: editForm.lastName,
                                                isActive: editForm.isActive,
                                            };
                                            if (editForm.password.trim().length > 0) {
                                                updatePayload.password = editForm.password;
                                            }

                                            await api.put(`/rbac/users/${encodeURIComponent(editId)}`, updatePayload);
                                            await api.put(`/rbac/users/${encodeURIComponent(editId)}/roles`, { roleIds: editForm.roleIds });
                                            setShowEdit(false);
                                            setSuccess('User updated.');
                                            await load();
                                        } catch (err: any) {
                                            setError(err?.response?.data?.message || err.message || 'Failed to update user');
                                        } finally {
                                            setEditSaving(false);
                                        }
                                    }}
                                >
                                    {editSaving ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

