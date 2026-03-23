import React, { useState, useEffect } from 'react';
import { educationLevelsApi, EducationLevel } from '../../../modules/admin/services/educationLevels.api';
import { useAuthStore } from '../../../stores/authStore';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';

export default function EducationLevelsSettings() {
    const [levels, setLevels] = useState<EducationLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const permissions = useAuthStore((s: any) => s.user?.permissions || []);
    const canRead = permissions.includes('education-levels:read');
    const canCreate = permissions.includes('education-levels:create');
    const canUpdate = permissions.includes('education-levels:update');
    const canDelete = permissions.includes('education-levels:delete');

    useEffect(() => {
        if (canRead) loadData();
    }, [canRead]);

    async function loadData() {
        try {
            setLoading(true);
            const data = await educationLevelsApi.list();
            setLevels(data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load education levels');
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
                await educationLevelsApi.update(editingId, payload);
                setEditingId(null);
            } else {
                await educationLevelsApi.create(payload);
            }
            setFormData({ name: '', description: '' });
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    }

    async function handleDelete(id: string) {
        if (window.confirm('Are you sure?')) {
            try {
                await educationLevelsApi.delete(id);
                await loadData();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Delete failed');
            }
        }
    }

    function handleEdit(level: EducationLevel) {
        setEditingId(level.id);
        setFormData({ name: level.name, description: level.description || '' });
    }

    if (!canRead) return <StatePanel title="Access Denied" message="You don't have permission to view education levels." />;

    return (
        <div>
            <PageHeader title="Education Levels" subtitle="Define education qualification tiers (e.g., High School, Bachelor, Master)" actions={[]} />

            {error && <SurfaceCard><div style={{ color: '#b91c1c' }}>{error}</div></SurfaceCard>}

            {canCreate && (
                <SurfaceCard>
                    <div className="block-title">{editingId ? 'Edit Education Level' : 'Create Education Level'}</div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                        <input type="text" placeholder="Level name (e.g., Bachelor of Science)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db' }} />
                        <input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button type="submit" style={{ padding: '10px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>{editingId ? 'Update' : 'Create'}</button>
                            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', description: '' }); }} style={{ padding: '10px 12px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>}
                        </div>
                    </form>
                </SurfaceCard>
            )}

            <SurfaceCard>
                <div className="block-title">Education Levels ({levels.length})</div>
                <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                    {levels.map((level) => (
                        <div key={level.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>{level.name}</div>
                                {level.description && <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{level.description}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {canUpdate && <button onClick={() => handleEdit(level)} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Edit</button>}
                                {canDelete && <button onClick={() => handleDelete(level.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>}
                            </div>
                        </div>
                    ))}
                    {!loading && levels.length === 0 && <StatePanel title="No education levels" message="Create your first education level (e.g., High School, Bachelor, Master)." />}
                </div>
            </SurfaceCard>
        </div>
    );
}
