import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import { fetchInterviews } from '../services/interviews.api';
import {
    interviewPillClass,
    shortId,
    formatListDateTime,
    ModuleDataListPagination,
    ModuleDataListEmpty,
} from '../../../components/ui/moduleDataList';

type InterviewRow = {
    id: string;
    submission_id?: string;
    status?: string;
    round?: string;
    mode?: string;
    scheduled_date?: string | null;
    scheduled_time?: string | null;
    scheduled_start?: string | null;
};

function formatWhen(row: InterviewRow): string {
    if (row.scheduled_start) {
        return formatListDateTime(row.scheduled_start);
    }
    if (row.scheduled_date) {
        const t = row.scheduled_time ? ` · ${row.scheduled_time}` : '';
        return `${formatListDate(row.scheduled_date)}${t}`;
    }
    return '—';
}

function formatListDate(d: string) {
    try {
        return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return d;
    }
}

function label(s?: string | null) {
    if (!s) return '—';
    return s.replace(/_/g, ' ');
}

export default function InterviewsList() {
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const canRead = useMemo(() => permissions.includes('*') || permissions.includes('interviews:read'), [permissions]);

    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [items, setItems] = useState<InterviewRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canRead) return;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetchInterviews({ page, limit });
                setItems((res.data || []) as InterviewRow[]);
                setTotal(res.total || 0);
            } catch (e: any) {
                setError(e?.message || 'Failed to load interviews');
                setItems([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        })();
    }, [canRead, page, limit]);

    if (!canRead) {
        return <StatePanel title="Access Denied" message="You do not have permission to view interviews." tone="danger" />;
    }
    if (loading) {
        return <StatePanel title="Loading interviews" message="Fetching scheduled and past interviews…" />;
    }
    if (error) {
        return <StatePanel title="Unable to load interviews" message={error} tone="danger" />;
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Interviews"
                subtitle="Scheduled conversations and panel rounds"
                actions={
                    <button className="ghost-button" type="button" onClick={() => navigate('/app/submissions')}>
                        Submissions
                    </button>
                }
            />

            <div className="mdl-intro">
                <div className="mdl-intro__text">
                    <p className="mdl-intro__title">Schedule</p>
                    <p className="mdl-intro__desc">
                        Status, round, and time at a glance. Jump to the interview record or parent submission.
                    </p>
                </div>
                <div className="mdl-stat-row">
                    <span className="mdl-stat">
                        <strong>{total}</strong> interviews
                    </span>
                </div>
            </div>

            <div className="mdl-card">
                {items.length === 0 ? (
                    <ModuleDataListEmpty
                        icon="📅"
                        title="No interviews scheduled"
                        message="Create interviews from a submission when you move candidates forward in the pipeline."
                        action={
                            <button type="button" className="primary-button" onClick={() => navigate('/app/submissions')}>
                                View submissions
                            </button>
                        }
                    />
                ) : (
                    <div className="mdl-table-wrap">
                        <table className="mdl-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Round</th>
                                    <th>Mode</th>
                                    <th>When</th>
                                    <th>Submission</th>
                                    <th className="mdl-th-num">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <span className={interviewPillClass(row.status || '')} title={row.status}>
                                                {label(row.status)}
                                            </span>
                                        </td>
                                        <td className="mdl-muted" style={{ textTransform: 'capitalize' }}>
                                            {label(row.round)}
                                        </td>
                                        <td className="mdl-muted" style={{ textTransform: 'capitalize' }}>
                                            {label(row.mode)}
                                        </td>
                                        <td>
                                            <span className="mdl-muted" style={{ fontWeight: 500, color: 'var(--text)' }}>
                                                {formatWhen(row)}
                                            </span>
                                        </td>
                                        <td>
                                            {row.submission_id ? (
                                                <span className="mdl-mono" title={row.submission_id}>
                                                    {shortId(row.submission_id)}
                                                </span>
                                            ) : (
                                                <span className="mdl-muted">—</span>
                                            )}
                                        </td>
                                        <td className="mdl-td-actions">
                                            <div className="mdl-actions">
                                                <button
                                                    type="button"
                                                    className="mdl-link-btn"
                                                    onClick={() => navigate(`/app/interviews/${row.id}`)}
                                                >
                                                    Details
                                                </button>
                                                {row.submission_id ? (
                                                    <button
                                                        type="button"
                                                        className="ghost-button"
                                                        onClick={() => navigate(`/app/submissions/${row.submission_id}`)}
                                                    >
                                                        Submission
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {items.length > 0 && (
                <ModuleDataListPagination
                    page={page}
                    pageSize={limit}
                    total={total}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => p + 1)}
                />
            )}
        </div>
    );
}
