import React, { useState, useEffect } from 'react';
import { qualificationsApi, Qualification } from '../../../modules/admin/services/qualifications.api';
import { useAuthStore } from '../../../stores/authStore';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';

export default function QualificationsSettings() {
    const [qualifications, setQualifications] = useState<Qualification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', level: '', description: '' });

    const permissions = useAuthStore((s: any) => s.user?.permissions || []);
    const canRead = permissions.includes('qualifications:read');
    const canCreate = permissions.includes('qualifications:create');
    const canUpdate = permissions.includes('qualifications:update');
    const canDelete = permissions.includes('qualifications:delete');

    useEffect(() => {
        if (canRead) loadData();
    }, [canRead]);

    async function loadData() {
        try {
            setLoading(true);
            const data = await qualificationsApi.list();
            setQualifications(data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load qualifications');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.name) return;
        try {
            setError(null);
            const payload = { ...formData, is_active: true };
            if (editingId) {
                await qualificationsApi.update(editingId, payload);
                setEditingId(null);
            } else {
                await qualificationsApi.create(payload);
            }
            setFormData({ name: '', level: '', description: '' });
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    }

    async function handleDelete(id: string) {
        if (window.confirm('Are you sure?')) {
            try {
                await qualificationsApi.delete(id);
                await loadData();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Delete failed');
            }
        }
    }

    function handleEdit(qualification: Qualification) {
        setEditingId(qualification.id);
        setFormData({ name: qualification.name, level: qualification.level || '', description: qualification.description || '' });
    }

    if (!canRead) return <StatePanel title="Access Denied" message="You don't have permission to view qualifications." />;

    return (
        <div>
            <PageHeader title="Qualifications" subtitle="Manage certifications and professional qualifications" actions={[]} />

            {error && <SurfaceCard><div style={{ color: '#b91c1c' }}>{error}</div></SurfaceCard>}

            {canCreate && (
                <SurfaceCard>
                    <div className="block-title">{editingId ? 'Edit Qualification' : 'Create Qualification'}</div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                        <input type="text" placeholder="Qualification name (e.g., AWS Solutions Architect)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db' }} />
                        <input type="text" placeholder="Level (e.g., Professional, Associate)" value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db' }} />
                        <input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button type="submit" style={{ padding: '10px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>{editingId ? 'Update' : 'Create'}</button>
                            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', level: '', description: '' }); }} style={{ padding: '10px 12px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>}
                        </div>
                    </form>
                </SurfaceCard>
            )}

            <SurfaceCard>
                <div className="block-title">Qualifications ({qualifications.length})</div>
                <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                    {qualifications.map((q) => (
                        <div key={q.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>{q.name}</div>
                                {q.level && <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Level: {q.level}</div>}
                                {q.description && <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{q.description}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {canUpdate && <button onClick={() => handleEdit(q)} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Edit</button>}
                                {canDelete && <button onClick={() => handleDelete(q.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>}
                            </div>
                        </div>
                    ))}
                    {!loading && qualifications.length === 0 && <StatePanel title="No qualifications" message="Create your first qualification." />}
                </div>
            </SurfaceCard>
        </div>
    );
}
