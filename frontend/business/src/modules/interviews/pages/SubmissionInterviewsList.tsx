import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import {
    getInterviewsBySubmission,
    InterviewDetail,
    InterviewStatus,
} from '../services/interviews.api';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import SurfaceCard from '../../../components/ui/SurfaceCard';

export default function SubmissionInterviewsList() {
    const { id: submissionId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const [interviews, setInterviews] = useState<InterviewDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Permission checks
    const canRead = permissions.includes('*') || permissions.includes('interviews:read');
    const canCreate = permissions.includes('*') || permissions.includes('interviews:create');

    useEffect(() => {
        if (!canRead) {
            setError('You do not have permission to view interviews');
            setLoading(false);
            return;
        }

        if (!submissionId) {
            setError('Invalid submission ID');
            setLoading(false);
            return;
        }

        loadInterviews();
    }, [submissionId, canRead]);

    async function loadInterviews() {
        if (!submissionId) return;
        try {
            setLoading(true);
            setError('');
            const data = await getInterviewsBySubmission(submissionId);
            setInterviews(data);
        } catch (err: any) {
            console.error('Failed to load interviews:', err);
            setError(err.response?.data?.message || 'Failed to load interviews');
        } finally {
            setLoading(false);
        }
    }

    function getStatusColor(status: InterviewStatus) {
        switch (status) {
            case InterviewStatus.COMPLETED:
                return '#10B981'; // green
            case InterviewStatus.CANCELLED:
            case InterviewStatus.NO_SHOW:
                return '#EF4444'; // red
            case InterviewStatus.SCHEDULED:
            case InterviewStatus.IN_PROGRESS:
                return '#3B82F6'; // blue
            case InterviewStatus.RESCHEDULED:
                return '#F59E0B'; // amber
            default:
                return '#6B7280'; // gray
        }
    }

    function formatDateTime(date: string | null, time: string | null) {
        if (!date) return 'N/A';
        const dateStr = new Date(date).toLocaleDateString();
        return time ? `${dateStr} ${time}` : dateStr;
    }

    if (!canRead) {
        return (
            <StatePanel title="Access Denied" message={error || 'You do not have permission to view interviews'} tone="danger" />
        );
    }

    if (loading) {
        return (
            <StatePanel title="Loading interviews" message="Fetching interview pipeline..." />
        );
    }

    if (error) {
        return (
            <StatePanel title="Unable to load interviews" message={error} tone="danger" />
        );
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Interviews"
                subtitle={`Submission #${submissionId}`}
                actions={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => navigate(`/app/submissions/${submissionId}`)}
                            className="ghost-button"
                            type="button"
                        >
                            Back to Submission
                        </button>
                        {canCreate && (
                            <button
                                onClick={() => navigate(`/app/submissions/${submissionId}/interviews/create`)}
                                className="primary-button"
                                type="button"
                            >
                                Schedule Interview
                            </button>
                        )}
                    </div>
                }
            />

            {/* Table */}
            {interviews.length === 0 ? (
                <StatePanel title="No interviews scheduled" message="No interview rounds are scheduled yet for this submission." />
            ) : (
                <SurfaceCard className="no-padding overflow-hidden">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#111827', borderBottom: '1px solid #374151' }}>
                                <th
                                    style={{
                                        textAlign: 'left',
                                        padding: 12,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#9CA3AF',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Round
                                </th>
                                <th
                                    style={{
                                        textAlign: 'left',
                                        padding: 12,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#9CA3AF',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Mode
                                </th>
                                <th
                                    style={{
                                        textAlign: 'left',
                                        padding: 12,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#9CA3AF',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Scheduled
                                </th>
                                <th
                                    style={{
                                        textAlign: 'left',
                                        padding: 12,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#9CA3AF',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Status
                                </th>
                                <th
                                    style={{
                                        textAlign: 'left',
                                        padding: 12,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#9CA3AF',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Rating
                                </th>
                                <th
                                    style={{
                                        textAlign: 'right',
                                        padding: 12,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#9CA3AF',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {interviews.map((interview) => (
                                <tr
                                    key={interview.id}
                                    style={{ borderBottom: '1px solid #374151' }}
                                >
                                    <td
                                        style={{
                                            padding: 12,
                                            fontSize: 14,
                                            color: '#E5E7EB',
                                        }}
                                    >
                                        {interview.round}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            fontSize: 14,
                                            color: '#E5E7EB',
                                        }}
                                    >
                                        {interview.mode}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            fontSize: 14,
                                            color: '#E5E7EB',
                                        }}
                                    >
                                        {formatDateTime(
                                            interview.scheduled_date,
                                            interview.scheduled_time
                                        )}
                                    </td>
                                    <td style={{ padding: 12 }}>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                padding: '4px 8px',
                                                borderRadius: 4,
                                                fontSize: 12,
                                                fontWeight: 500,
                                                background: getStatusColor(interview.status) + '20',
                                                color: getStatusColor(interview.status),
                                            }}
                                        >
                                            {interview.status}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            fontSize: 14,
                                            color: '#E5E7EB',
                                        }}
                                    >
                                        {interview.rating !== null ? `${interview.rating}/10` : 'N/A'}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            textAlign: 'right',
                                        }}
                                    >
                                        <button
                                            onClick={() =>
                                                navigate(`/app/interviews/${interview.id}`)
                                            }
                                            style={{
                                                background: 'transparent',
                                                color: '#60A5FA',
                                                border: '1px solid #374151',
                                                borderRadius: 4,
                                                padding: '4px 12px',
                                                cursor: 'pointer',
                                                fontSize: 13,
                                            }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </SurfaceCard>
            )}
        </div>
    );
}
