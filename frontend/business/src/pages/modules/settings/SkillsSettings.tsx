import React, { useState, useEffect } from 'react';
import { skillsApi, Skill } from '../../../modules/admin/services/skills.api';
import { skillCategoriesApi, SkillCategory } from '../../../modules/admin/services/skillCategories.api';
import { useAuthStore } from '../../../stores/authStore';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';

export default function SkillsSettings() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [categories, setCategories] = useState<SkillCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', category_id: '', description: '', proficiency_scale: '' });

    const permissions = useAuthStore((s: any) => s.user?.permissions || []);
    const canRead = permissions.includes('skills:read');
    const canCreate = permissions.includes('skills:create');
    const canUpdate = permissions.includes('skills:update');
    const canDelete = permissions.includes('skills:delete');

    useEffect(() => {
        if (canRead) loadData();
    }, [canRead]);

    async function loadData() {
        try {
            setLoading(true);
            const [skillsData, catsData] = await Promise.all([skillsApi.list(), skillCategoriesApi.getActive()]);
            setSkills(skillsData);
            setCategories(catsData);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data');
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
                await skillsApi.update(editingId, payload);
                setEditingId(null);
            } else {
                await skillsApi.create(payload);
            }
            setFormData({ name: '', category_id: '', description: '', proficiency_scale: '' });
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    }

    async function handleDelete(id: string) {
        if (window.confirm('Are you sure?')) {
            try {
                await skillsApi.delete(id);
                await loadData();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Delete failed');
            }
        }
    }

    function handleEdit(skill: Skill) {
        setEditingId(skill.id);
        setFormData({
            name: skill.name,
            category_id: skill.category_id || '',
            description: skill.description || '',
            proficiency_scale: skill.proficiency_scale || '',
        });
    }

    if (!canRead) return <StatePanel title="Access Denied" message="You don't have permission to view skills." />;

    return (
        <div>
            <PageHeader title="Skills" subtitle="Manage available skills for your organization" actions={[]} />

            {error && <SurfaceCard><div style={{ color: '#b91c1c' }}>{error}</div></SurfaceCard>}

            {canCreate && (
                <SurfaceCard>
                    <div className="block-title">{editingId ? 'Edit Skill' : 'Create Skill'}</div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                        <input type="text" placeholder="Skill name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db' }} />
                        <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db' }}>
                            <option value="">No category</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db' }} />
                        <input type="text" placeholder="Proficiency scale (e.g., Advanced)" value={formData.proficiency_scale} onChange={(e) => setFormData({ ...formData, proficiency_scale: e.target.value })} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button type="submit" style={{ padding: '10px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>{editingId ? 'Update' : 'Create'}</button>
                            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', category_id: '', description: '', proficiency_scale: '' }); }} style={{ padding: '10px 12px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>}
                        </div>
                    </form>
                </SurfaceCard>
            )}

            <SurfaceCard>
                <div className="block-title">Skills ({skills.length})</div>
                <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                    {skills.map((skill) => (
                        <div key={skill.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>{skill.name}</div>
                                {skill.category_id && <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Category: {categories.find((c) => c.id === skill.category_id)?.name || 'Unknown'}</div>}
                                {skill.description && <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{skill.description}</div>}
                                {skill.proficiency_scale && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Scale: {skill.proficiency_scale}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {canUpdate && <button onClick={() => handleEdit(skill)} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Edit</button>}
                                {canDelete && <button onClick={() => handleDelete(skill.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>}
                            </div>
                        </div>
                    ))}
                    {!loading && skills.length === 0 && <StatePanel title="No skills" message="Create your first skill to get started." />}
                </div>
            </SurfaceCard>
        </div>
    );
}
