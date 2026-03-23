import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import { fetchSubmissions, type SubmissionListItem } from '../services/submissions.api';
import {
    submissionPillClass,
    shortId,
    formatListDate,
    ModuleDataListPagination,
    ModuleDataListEmpty,
} from '../../../components/ui/moduleDataList';

export default function SubmissionsList() {
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const canRead = useMemo(
        () => permissions.includes('*') || permissions.includes('submissions:read') || permissions.includes('submissions:view'),
        [permissions],
    );

    const [items, setItems] = useState<SubmissionListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const [take] = useState(20);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canRead) return;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetchSubmissions({ skip, take });
                setItems(res.data || []);
                setTotal(res.total || 0);
            } catch (e: any) {
                setError(e?.message || 'Failed to load submissions');
                setItems([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        })();
    }, [canRead, skip, take]);

    if (!canRead) {
        return <StatePanel title="Access Denied" message="You do not have permission to view submissions." tone="danger" />;
    }
    if (loading) {
        return <StatePanel title="Loading submissions" message="Fetching submission pipeline…" />;
    }
    if (error) {
        return <StatePanel title="Unable to load submissions" message={error} tone="danger" />;
    }

    const page = Math.floor(skip / take) + 1;

    return (
        <div className="page-stack">
            <PageHeader
                title="Submissions"
                subtitle="Applications and pipeline stages across all jobs"
                actions={
                    <button className="primary-button" type="button" onClick={() => navigate('/app/jobs')}>
                        Browse jobs
                    </button>
                }
            />

            <div className="mdl-intro">
                <div className="mdl-intro__text">
                    <p className="mdl-intro__title">Overview</p>
                    <p className="mdl-intro__desc">
                        Review status, dates, and linked jobs. Open a submission to manage interviews and offers.
                    </p>
                </div>
                <div className="mdl-stat-row">
                    <span className="mdl-stat">
                        <strong>{total}</strong> submissions
                    </span>
                </div>
            </div>

            <div className="mdl-card">
                {items.length === 0 ? (
                    <ModuleDataListEmpty
                        icon="📋"
                        title="No submissions yet"
                        message="When candidates apply to your jobs, they will appear here. Start from a job to create submissions."
                        action={
                            <button type="button" className="primary-button" onClick={() => navigate('/app/jobs')}>
                                Go to jobs
                            </button>
                        }
                    />
                ) : (
                    <div className="mdl-table-wrap">
                        <table className="mdl-table">
                            <thead>
                                <tr>
                                    <th>Stage</th>
                                    <th>Submitted</th>
                                    <th>Job</th>
                                    <th>Candidate</th>
                                    <th className="mdl-th-num">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <span className={submissionPillClass(s.status || '')} title={s.status}>
                                                {s.status || '—'}
                                            </span>
                                        </td>
                                        <td className="mdl-muted">{formatListDate(s.submitted_at)}</td>
                                        <td>
                                            <span className="mdl-mono" title={s.job_id}>
                                                {shortId(s.job_id)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="mdl-mono" title={s.candidate_id}>
                                                {shortId(s.candidate_id)}
                                            </span>
                                        </td>
                                        <td className="mdl-td-actions">
                                            <div className="mdl-actions">
                                                <button
                                                    type="button"
                                                    className="mdl-link-btn"
                                                    onClick={() => navigate(`/app/jobs/${s.job_id}`)}
                                                >
                                                    Job
                                                </button>
                                                <button
                                                    type="button"
                                                    className="ghost-button"
                                                    onClick={() => navigate(`/app/submissions/${s.id}`)}
                                                >
                                                    Open
                                                </button>
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
                    pageSize={take}
                    total={total}
                    onPrev={() => setSkip(Math.max(0, skip - take))}
                    onNext={() => setSkip(skip + take)}
                />
            )}
        </div>
    );
}
