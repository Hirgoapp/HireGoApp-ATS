import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById, SubmissionDetail } from '../services/submissions.api';
import { useAuthStore } from '../../../stores/authStore';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import SurfaceCard from '../../../components/ui/SurfaceCard';

function isUuid(id: string | undefined): boolean {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export default function SubmissionDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hasPermission = (p: string) => permissions.includes('*') || permissions.includes(p);
    const canRead = hasPermission('submissions:read') || hasPermission('submissions:view');
    const canUpdate = hasPermission('submissions:update');
    const canReadInterviews = hasPermission('interviews:read');
    const canReadOffers = hasPermission('offers:read');

    useEffect(() => {
        if (!canRead) return;

        const load = async () => {
            if (!isUuid(id)) {
                setError('Invalid submission ID');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const data = await getSubmissionById(id!);
                setSubmission(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load submission');
                setSubmission(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, canRead]);

    if (!canRead) {
        return (
            <StatePanel title="Access Denied" message="You do not have permission to view this submission." tone="danger" />
        );
    }
    if (loading) {
        return <StatePanel title="Loading submission" message="Fetching submission…" />;
    }
    if (error || !submission) {
        return <StatePanel title="Submission not found" message={error || 'Not found'} tone="danger" />;
    }

    const formatDate = (d?: string | null) => {
        if (!d) return '—';
        try {
            return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return String(d);
        }
    };

    const status = submission.status ?? (submission as any).current_stage ?? '—';
    const getStatusColor = (s: string) => {
        const lower = s.toLowerCase();
        if (lower.includes('hired') || lower.includes('offer')) return '#065f46';
        if (lower.includes('reject') || lower.includes('withdraw')) return '#7f1d1d';
        if (lower.includes('screen') || lower.includes('applied')) return '#854d0e';
        return '#1e3a8a';
    };

    return (
        <div className="page-stack">
            <PageHeader
                title="Submission"
                subtitle={`ID ${submission.id.slice(0, 8)}… · Stage: ${status}`}
                actions={
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => navigate(`/app/jobs/${submission.job_id}/submissions`)} className="ghost-button" type="button">
                            Job submissions
                        </button>
                        <button onClick={() => navigate(`/app/candidates/${submission.candidate_id}`)} className="ghost-button" type="button">
                            Candidate
                        </button>
                        <button onClick={() => navigate(`/app/jobs/${submission.job_id}`)} className="ghost-button" type="button">
                            Job
                        </button>
                    </div>
                }
            />

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <span
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        background: getStatusColor(String(status)),
                        color: '#e5e7eb',
                    }}
                >
                    {status}
                </span>
                {canReadInterviews && (
                    <button
                        type="button"
                        className="primary-button"
                        onClick={() => navigate(`/app/submissions/${id}/interviews`)}
                        style={{ background: '#3B82F6' }}
                    >
                        Interviews
                    </button>
                )}
                {canReadOffers && (
                    <button
                        type="button"
                        className="primary-button"
                        onClick={() => navigate(`/app/submissions/${id}/offers`)}
                        style={{ background: '#10B981' }}
                    >
                        Offers
                    </button>
                )}
                {canUpdate && (
                    <button type="button" className="ghost-button" onClick={() => navigate(`/app/submissions/${id}/edit`)}>
                        Edit notes
                    </button>
                )}
            </div>

            <SurfaceCard>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 16,
                        color: '#e5e7eb',
                    }}
                >
                    <Field label="Submitted" value={formatDate(submission.submitted_at)} />
                    <Field label="Moved to stage" value={formatDate(submission.moved_to_stage_at)} />
                    <Field label="Outcome" value={submission.outcome ?? '—'} />
                    <Field label="Outcome date" value={formatDate(submission.outcome_date)} />
                    <Field label="Source" value={submission.source ?? '—'} />
                    <Field label="Score" value={submission.score != null ? String(submission.score) : '—'} />
                    <Field label="Job ID" value={submission.job_id} mono />
                    <Field label="Candidate ID" value={submission.candidate_id} mono />
                </div>
                {(submission.internal_notes || (submission as any).internal_notes) && (
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #374151' }}>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>Internal notes</div>
                        <div style={{ fontSize: 14, color: '#d1d5db', whiteSpace: 'pre-wrap' }}>
                            {submission.internal_notes ?? (submission as any).internal_notes}
                        </div>
                    </div>
                )}
            </SurfaceCard>
        </div>
    );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-all' }}>{value}</div>
        </div>
    );
}
