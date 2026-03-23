import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { Candidate, deleteCandidate, getCandidate } from '../services/candidates.api';
import '../../clients/pages/ClientDetails.css';

export default function CandidateDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const hasPermission = (permission: string) => permissions.includes('*') || permissions.includes(permission);

    const canRead = hasPermission('candidates:view') || hasPermission('candidates:read');
    const canUpdate = hasPermission('candidates:update');
    const canDelete = hasPermission('candidates:delete');

    useEffect(() => {
        if (!canRead || !id) return;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getCandidate(id);
                setCandidate(data);
            } catch (err: unknown) {
                const message =
                    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    (err as Error)?.message ||
                    'Failed to load candidate';
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [id, canRead]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(t);
    }, [toast]);

    const copyProfileLink = useCallback(() => {
        if (!candidate) return;
        const url = `${window.location.origin}/app/candidates/${candidate.id}`;
        void navigator.clipboard.writeText(url).then(
            () => setToast('Profile link copied to clipboard'),
            () => setToast('Could not copy link'),
        );
    }, [candidate]);

    const confirmDeleteCandidate = async () => {
        if (!candidate?.id) return;
        try {
            setDeleting(true);
            await deleteCandidate(candidate.id);
            navigate('/app/candidates');
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err as Error)?.message ||
                'Failed to delete candidate';
            setError(message);
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const formatDate = (v?: string | Date | null) => {
        if (!v) return '—';
        const d = typeof v === 'string' ? new Date(v) : v;
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const skills = useMemo(() => {
        if (!candidate?.skill_set?.trim()) return [];
        return candidate.skill_set
            .split(/[\n,|]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 30);
    }, [candidate?.skill_set]);

    if (!canRead) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to view candidates."
                tone="danger"
            />
        );
    }

    if (loading) {
        return (
            <div className="page-stack client-details">
                <div className="client-details__hero client-details__animate">
                    <div className="client-details__skel-line" style={{ width: '40%', marginBottom: 16 }} />
                    <div className="client-details__skel-line" style={{ width: '70%', height: 28, marginBottom: 12 }} />
                    <div className="client-details__skel-line" style={{ width: '55%' }} />
                </div>
                <div className="client-details__layout">
                    <SurfaceCard className="client-details__animate client-details__animate--2">
                        <div style={{ display: 'grid', gap: 12 }}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="client-details__skel-line" style={{ width: i % 2 ? '80%' : '100%' }} />
                            ))}
                        </div>
                    </SurfaceCard>
                </div>
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <StatePanel
                title="Candidate not found"
                message={error || 'Candidate not found'}
                tone="danger"
                action={
                    <button onClick={() => navigate('/app/candidates')} className="ghost-button" type="button">
                        Back to Candidates
                    </button>
                }
            />
        );
    }

    return (
        <>
            <div className="page-stack client-details">
                {toast ? (
                    <div role="status" className="client-details__toast-fixed">
                        {toast}
                    </div>
                ) : null}

                <header className="client-details__hero client-details__animate">
                    <button type="button" className="client-details__back" onClick={() => navigate('/app/candidates')}>
                        ← Back to candidates
                    </button>
                    <div className="client-details__hero-grid">
                        <div>
                            <h1 className="client-details__title">{candidate.candidate_name}</h1>
                            <div className="client-details__chips">
                                <StatusBadge status={candidate.candidate_status || 'Active'} />
                                {candidate.current_company ? (
                                    <span className="client-details__chip">{candidate.current_company}</span>
                                ) : null}
                                {candidate.total_experience != null ? (
                                    <span className="client-details__chip">{candidate.total_experience} yrs exp.</span>
                                ) : null}
                            </div>
                            <div className="client-details__meta">
                                {candidate.email ? (
                                    <span className="client-details__meta-item">
                                        <span className="client-details__meta-icon" aria-hidden>
                                            ✉️
                                        </span>
                                        {candidate.email}
                                    </span>
                                ) : null}
                                {candidate.phone ? (
                                    <span className="client-details__meta-item">
                                        <span className="client-details__meta-icon" aria-hidden>
                                            📞
                                        </span>
                                        {candidate.phone}
                                    </span>
                                ) : null}
                                {candidate.job_location ? (
                                    <span className="client-details__meta-item">
                                        <span className="client-details__meta-icon" aria-hidden>
                                            📍
                                        </span>
                                        {candidate.job_location}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <div className="client-details__actions">
                            <button type="button" className="client-details__btn client-details__btn--ghost" onClick={copyProfileLink}>
                                Copy link
                            </button>
                            <button
                                type="button"
                                className="client-details__btn client-details__btn--ghost"
                                onClick={() => navigate(`/app/submissions?candidateId=${candidate.id}`)}
                            >
                                View submissions
                            </button>
                            {canUpdate ? (
                                <button
                                    type="button"
                                    className="client-details__btn client-details__btn--ghost"
                                    onClick={() => navigate(`/app/candidates/${candidate.id}/edit`)}
                                >
                                    Edit
                                </button>
                            ) : null}
                            {canDelete ? (
                                <button
                                    type="button"
                                    className="client-details__btn client-details__btn--ghost client-details__btn--danger"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    Delete
                                </button>
                            ) : null}
                            <button
                                type="button"
                                className="client-details__btn client-details__btn--primary client-details__btn--cta"
                                onClick={() => navigate(`/app/jobs`)}
                            >
                                Find jobs
                            </button>
                        </div>
                    </div>
                </header>

                <div className="client-details__layout">
                    <div className="client-details__main-stack">
                        <SurfaceCard className="client-details__section client-details__animate client-details__animate--2">
                            <div className="client-details__section-head">
                                <h2 className="client-details__section-title">
                                    <span className="client-details__section-icon" aria-hidden>
                                        👤
                                    </span>
                                    Contact & profile
                                </h2>
                            </div>
                            <div className="client-details__section-body">
                                <div className="client-details__field-grid client-details__field-grid--2">
                                    <DetailField icon="✉️" label="Email" value={candidate.email || '—'} />
                                    <DetailField icon="📞" label="Phone" value={candidate.phone || '—'} />
                                    <DetailField icon="🏢" label="Current company" value={candidate.current_company || '—'} />
                                    <DetailField icon="🎓" label="Highest qualification" value={candidate.highest_qualification || '—'} />
                                    <DetailField icon="🌍" label="Current location" value={candidate.job_location || '—'} />
                                    <DetailField icon="🧭" label="Location preference" value={candidate.location_preference || '—'} />
                                    <DetailField icon="🧾" label="Notice period" value={candidate.notice_period || '—'} />
                                    <DetailField icon="📌" label="Status" value={<StatusBadge status={candidate.candidate_status || 'Active'} />} />
                                </div>
                            </div>
                        </SurfaceCard>

                        <SurfaceCard className="client-details__section client-details__animate client-details__animate--3">
                            <div className="client-details__section-head">
                                <h2 className="client-details__section-title">
                                    <span className="client-details__section-icon" aria-hidden>
                                        💼
                                    </span>
                                    Experience & compensation
                                </h2>
                            </div>
                            <div className="client-details__section-body">
                                <div className="client-details__field-grid client-details__field-grid--2">
                                    <DetailField
                                        icon="🕒"
                                        label="Total experience"
                                        value={candidate.total_experience != null ? `${candidate.total_experience} years` : '—'}
                                    />
                                    <DetailField
                                        icon="🎯"
                                        label="Relevant experience"
                                        value={candidate.relevant_experience != null ? `${candidate.relevant_experience} years` : '—'}
                                    />
                                    <DetailField
                                        icon="💰"
                                        label="Current CTC"
                                        value={candidate.current_ctc != null ? `${candidate.current_ctc} ${candidate.currency_code || ''}`.trim() : '—'}
                                    />
                                    <DetailField
                                        icon="📈"
                                        label="Expected CTC"
                                        value={candidate.expected_ctc != null ? `${candidate.expected_ctc} ${candidate.currency_code || ''}`.trim() : '—'}
                                    />
                                    <DetailField icon="🔁" label="Willing to relocate" value={candidate.willing_to_relocate ? 'Yes' : 'No'} />
                                    <DetailField icon="🧷" label="Buyout" value={candidate.buyout ? 'Yes' : 'No'} />
                                </div>
                            </div>
                        </SurfaceCard>

                        <SurfaceCard className="client-details__section client-details__animate client-details__animate--3">
                            <div className="client-details__section-head">
                                <h2 className="client-details__section-title">
                                    <span className="client-details__section-icon" aria-hidden>
                                        🧠
                                    </span>
                                    Skills & notes
                                </h2>
                            </div>
                            <div className="client-details__section-body">
                                {skills.length > 0 ? (
                                    <div className="client-details__tags" style={{ marginTop: 0 }}>
                                        {skills.map((s) => (
                                            <span key={s} className="client-details__tag">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="client-details__empty">No skills captured yet.</div>
                                )}
                                <div style={{ marginTop: '1rem' }}>
                                    <div className="client-details__field-label">Notes</div>
                                    <div className="client-details__notes">{candidate.notes?.trim() || 'No notes added.'}</div>
                                </div>
                            </div>
                        </SurfaceCard>
                    </div>

                    <aside className="client-details__side-stack">
                        <SurfaceCard className="client-details__section client-details__animate client-details__animate--2">
                            <div className="client-details__section-head">
                                <h2 className="client-details__section-title">
                                    <span className="client-details__section-icon" aria-hidden>
                                        📊
                                    </span>
                                    Activity
                                </h2>
                            </div>
                            <div className="client-details__section-body">
                                <div className="client-details__metrics">
                                    <div className="client-details__metric client-details__metric--active">
                                        <div className="client-details__metric-icon" aria-hidden>
                                            ✅
                                        </div>
                                        <div className="client-details__metric-label">Status</div>
                                        <div className="client-details__metric-value" style={{ fontSize: '1rem' }}>
                                            {candidate.candidate_status || 'Active'}
                                        </div>
                                    </div>
                                    <div className="client-details__metric client-details__metric--jobs">
                                        <div className="client-details__metric-icon" aria-hidden>
                                            📤
                                        </div>
                                        <div className="client-details__metric-label">Last submitted</div>
                                        <div className="client-details__metric-value" style={{ fontSize: '1rem' }}>
                                            {candidate.last_submission_date ? formatDate(candidate.last_submission_date) : '—'}
                                        </div>
                                    </div>
                                </div>
                                <div className="client-details__timestamps">
                                    <DetailField label="Created" value={formatDate(candidate.created_at)} />
                                    <DetailField label="Last updated" value={formatDate(candidate.updated_at)} />
                                    <DetailField label="Last contacted" value={formatDate(candidate.last_contacted_date)} />
                                </div>
                            </div>
                        </SurfaceCard>
                    </aside>
                </div>
            </div>

            {deleteDialogOpen ? (
                <div className="client-details__modal-backdrop" role="presentation" onClick={() => !deleting && setDeleteDialogOpen(false)}>
                    <div className="client-details__modal" onClick={(e) => e.stopPropagation()}>
                        <SurfaceCard>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800 }}>Delete candidate?</h3>
                            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
                                <strong>{candidate.candidate_name}</strong> will be marked inactive (soft delete).
                            </p>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button type="button" className="ghost-button" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="success-button"
                                    style={{ background: '#b91c1c', borderColor: '#b91c1c' }}
                                    disabled={deleting}
                                    onClick={() => void confirmDeleteCandidate()}
                                >
                                    {deleting ? 'Deleting...' : 'Delete candidate'}
                                </button>
                            </div>
                        </SurfaceCard>
                    </div>
                </div>
            ) : null}
        </>
    );
}

function DetailField({
    icon,
    label,
    value,
}: {
    icon?: string;
    label: string;
    value: ReactNode;
}) {
    return (
        <div>
            <div className="client-details__field-label">
                {icon ? (
                    <span aria-hidden style={{ fontSize: '0.75rem' }}>
                        {icon}
                    </span>
                ) : null}
                {label}
            </div>
            <div className="client-details__field-value">{value}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    let cls = 'cd-badge cd-badge--default';
    if (status === 'Active') cls = 'cd-badge cd-badge--active';
    else if (status === 'On Hold') cls = 'cd-badge cd-badge--hold';
    else if (status === 'Inactive') cls = 'cd-badge cd-badge--inactive';
    return <span className={cls}>{status}</span>;
}
