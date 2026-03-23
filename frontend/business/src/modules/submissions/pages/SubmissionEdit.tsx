import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById, updateSubmission } from '../services/submissions.api';
import { useAuthStore } from '../../../stores/authStore';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import SurfaceCard from '../../../components/ui/SurfaceCard';

function isUuid(id: string | undefined): boolean {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export default function SubmissionEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const canUpdate = permissions.includes('*') || permissions.includes('submissions:update');

    const [internalNotes, setInternalNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canUpdate || !isUuid(id)) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                setLoading(true);
                const s = await getSubmissionById(id!);
                setInternalNotes(s.internal_notes ?? '');
            } catch (e: any) {
                setError(e?.message || 'Failed to load');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, canUpdate]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!id) return;
        try {
            setSaving(true);
            setError(null);
            await updateSubmission(id, { internal_notes: internalNotes });
            navigate(`/app/submissions/${id}`);
        } catch (e: any) {
            setError(e?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    }

    if (!canUpdate) {
        return (
            <StatePanel
                title="Access Denied"
                message="You cannot edit submissions."
                tone="danger"
                action={
                    <button type="button" className="ghost-button" onClick={() => navigate(`/app/submissions/${id}`)}>
                        Back
                    </button>
                }
            />
        );
    }
    if (!isUuid(id)) {
        return <StatePanel title="Invalid ID" message="Use a valid submission UUID." tone="danger" />;
    }
    if (loading) {
        return <StatePanel title="Loading" message="…" />;
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Edit submission notes"
                subtitle={`Submission ${id!.slice(0, 8)}…`}
                actions={
                    <button type="button" className="ghost-button" onClick={() => navigate(`/app/submissions/${id}`)}>
                        Cancel
                    </button>
                }
            />
            <SurfaceCard>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ color: '#f87171', marginBottom: 12, fontSize: 14 }}>{error}</div>
                    )}
                    <label style={{ display: 'block', marginBottom: 8, color: '#9CA3AF', fontSize: 13 }}>Internal notes</label>
                    <textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        rows={12}
                        style={{
                            width: '100%',
                            maxWidth: 720,
                            padding: 12,
                            borderRadius: 8,
                            border: '1px solid #374151',
                            background: '#111827',
                            color: '#e5e7eb',
                            fontSize: 14,
                        }}
                    />
                    <div style={{ marginTop: 16 }}>
                        <button type="submit" className="primary-button" disabled={saving}>
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
            </SurfaceCard>
        </div>
    );
}
