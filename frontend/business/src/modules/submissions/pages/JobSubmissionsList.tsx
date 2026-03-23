import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSubmissions, SubmissionListItem } from '../services/submissions.api';
import { useAuthStore } from '../../../stores/authStore';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import SurfaceCard from '../../../components/ui/SurfaceCard';

function isValidJobId(id: string | undefined): boolean {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export default function JobSubmissionsList() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [skip, setSkip] = useState(0);
    const [take] = useState(20);

    const hasPermission = (permission: string) => {
        return permissions.includes('*') || permissions.includes(permission);
    };

    const canRead = hasPermission('submissions:read');
    const canCreate = hasPermission('submissions:create');

    useEffect(() => {
        if (!canRead || !isValidJobId(id)) {
            return;
        }

        const loadSubmissions = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetchSubmissions({
                    skip,
                    take,
                    job_id: id!,
                });
                setSubmissions(response.data || []);
                setTotal(response.total || 0);
            } catch (err: any) {
                setError(err.message || 'Failed to load submissions');
                setSubmissions([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        };

        loadSubmissions();
    }, [skip, take, id, canRead]);

    const handlePageChange = (newSkip: number) => {
        setSkip(newSkip);
    };

    if (!canRead) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to view submissions."
                tone="danger"
                action={
                    <button onClick={() => navigate(`/app/jobs/${id}`)} className="ghost-button" type="button">
                        Back to Job Details
                    </button>
                }
            />
        );
    }

    if (!isValidJobId(id)) {
        return (
            <StatePanel
                title="Invalid Job ID"
                message="Submissions must be opened from a job (UUID)."
                tone="danger"
                action={
                    <button onClick={() => navigate('/app/jobs')} className="ghost-button" type="button">
                        Back to Jobs
                    </button>
                }
            />
        );
    }

    if (loading) {
        return <StatePanel title="Loading submissions" message="Fetching submission pipeline..." />;
    }

    if (error) {
        return (
            <StatePanel
                title="Unable to load submissions"
                message={error}
                tone="danger"
                action={
                    <button onClick={() => navigate(`/app/jobs/${id}`)} className="ghost-button" type="button">
                        Back to Job Details
                    </button>
                }
            />
        );
    }

    const currentPage = Math.floor(skip / take) + 1;
    const totalPages = Math.max(1, Math.ceil(total / take));

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status: string | null) => {
        if (!status) return '#6b7280';
        const lower = status.toLowerCase();
        if (lower.includes('approved') || lower.includes('selected') || lower.includes('offer')) return '#065f46';
        if (lower.includes('rejected')) return '#7f1d1d';
        if (lower.includes('pending') || lower.includes('screen')) return '#854d0e';
        return '#1e3a8a';
    };

    const shortUuid = (u: string) => (u ? `${u.slice(0, 8)}…` : '—');

    return (
        <div className="page-stack">
            <PageHeader
                title="Job submissions"
                subtitle={`Job ${shortUuid(id!)} · ${total} submission(s)`}
                actions={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => navigate(`/app/jobs/${id}`)} className="ghost-button" type="button">
                            Back to Job Details
                        </button>
                        {canCreate && (
                            <button
                                onClick={() => navigate(`/app/jobs/${id}/submissions/create`)}
                                className="primary-button"
                                type="button"
                            >
                                + Create Submission
                            </button>
                        )}
                    </div>
                }
            />

            {submissions.length === 0 ? (
                <StatePanel title="No submissions found" message="No submissions are associated with this job yet." />
            ) : (
                <>
                    <SurfaceCard className="no-padding overflow-hidden">
                        <div style={{ overflowX: 'auto' }}>
                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    background: '#0f172a',
                                    border: '1px solid #1f2937',
                                    borderRadius: 8,
                                }}
                            >
                                <thead>
                                    <tr style={{ background: '#1f2937', borderBottom: '1px solid #374151' }}>
                                        {['Candidate', 'Status', 'Submitted', 'Actions'].map((label) => (
                                            <th
                                                key={label}
                                                style={{
                                                    padding: 12,
                                                    textAlign: label === 'Actions' ? 'right' : 'left',
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: '#9CA3AF',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((submission) => (
                                        <tr key={submission.id} style={{ borderBottom: '1px solid #1f2937' }}>
                                            <td style={{ padding: 12, color: '#9CA3AF', fontSize: 13, fontFamily: 'monospace' }}>
                                                {shortUuid(submission.candidate_id)}
                                            </td>
                                            <td style={{ padding: 12 }}>
                                                <span
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: 6,
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        background: getStatusColor(submission.status),
                                                        color: '#e5e7eb',
                                                    }}
                                                >
                                                    {submission.status || '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: 12, color: '#9CA3AF', fontSize: 13 }}>
                                                {formatDate(submission.submitted_at)}
                                            </td>
                                            <td style={{ padding: 12, textAlign: 'right' }}>
                                                <button
                                                    onClick={() => navigate(`/app/submissions/${submission.id}`)}
                                                    style={{
                                                        padding: '4px 10px',
                                                        fontSize: 12,
                                                        background: '#1f2937',
                                                        color: '#e5e7eb',
                                                        border: '1px solid #374151',
                                                        borderRadius: 6,
                                                        cursor: 'pointer',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SurfaceCard>

                    {totalPages > 1 && (
                        <div
                            style={{
                                marginTop: 16,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <button
                                onClick={() => handlePageChange(Math.max(0, skip - take))}
                                disabled={skip === 0}
                                style={{
                                    padding: '6px 12px',
                                    background: skip === 0 ? '#0f172a' : '#1f2937',
                                    color: skip === 0 ? '#6b7280' : '#e5e7eb',
                                    border: '1px solid #374151',
                                    borderRadius: 8,
                                    cursor: skip === 0 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                Previous
                            </button>
                            <span style={{ color: '#9CA3AF', fontSize: 14 }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(skip + take)}
                                disabled={skip + take >= total}
                                style={{
                                    padding: '6px 12px',
                                    background: skip + take >= total ? '#0f172a' : '#1f2937',
                                    color: skip + take >= total ? '#6b7280' : '#e5e7eb',
                                    border: '1px solid #374151',
                                    borderRadius: 8,
                                    cursor: skip + take >= total ? 'not-allowed' : 'pointer',
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
