import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import {
    Client,
    ClientPoc,
    getClient,
    deleteClient,
    fetchPocs,
    createPoc,
    updatePoc,
    deletePoc,
    CreatePocPayload,
} from '../services/clients.api';
import { fetchJobs, JobListItem } from '../../jobs/services/jobs.api';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import PocFormModal from '../components/PocFormModal';
import './ClientDetails.css';

function displayDomain(url?: string | null): string {
    if (!url?.trim()) return '';
    const s = url.trim();
    try {
        const u = new URL(s.includes('://') ? s : `https://${s}`);
        return u.hostname.replace(/^www\./i, '') || s;
    } catch {
        return s;
    }
}

export default function ClientDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [jobsTotal, setJobsTotal] = useState(0);
    const [jobsActiveTotal, setJobsActiveTotal] = useState(0);
    const [recentJobs, setRecentJobs] = useState<JobListItem[]>([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    const [pocs, setPocs] = useState<ClientPoc[]>([]);
    const [loadingPocs, setLoadingPocs] = useState(false);
    const [pocModalOpen, setPocModalOpen] = useState(false);
    const [pocEdit, setPocEdit] = useState<ClientPoc | null>(null);
    const [savingPoc, setSavingPoc] = useState(false);
    const [pocMenu, setPocMenu] = useState<{ poc: ClientPoc; top: number; left: number } | null>(null);

    const [toast, setToast] = useState<string | null>(null);

    const hasPermission = (permission: string) =>
        permissions.includes('*') || permissions.includes(permission);

    const canRead = hasPermission('clients:view') || hasPermission('clients:read');
    const canUpdate = hasPermission('clients:update');
    const canDelete = hasPermission('clients:delete');

    useEffect(() => {
        if (!canRead || !id) return;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getClient(id);
                setClient(data);
            } catch (err: unknown) {
                const message =
                    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    (err as Error)?.message ||
                    'Failed to load client';
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [id, canRead]);

    const loadPocs = async () => {
        if (!id) return;
        try {
            setLoadingPocs(true);
            const list = await fetchPocs(id);
            setPocs(list);
        } catch {
            setPocs([]);
        } finally {
            setLoadingPocs(false);
        }
    };

    useEffect(() => {
        if (id && client) void loadPocs();
    }, [id, client?.id]);

    useEffect(() => {
        if (!client?.id || !canRead) return;
        let cancelled = false;
        (async () => {
            setJobsLoading(true);
            try {
                const [all, open, recent] = await Promise.all([
                    fetchJobs({ client_id: client.id, limit: 1, page: 1 }),
                    fetchJobs({ client_id: client.id, status: 'open', limit: 1, page: 1 }),
                    fetchJobs({
                        client_id: client.id,
                        limit: 8,
                        page: 1,
                        orderBy: 'updated_at',
                        orderDirection: 'DESC',
                    }),
                ]);
                if (cancelled) return;
                setJobsTotal(all.total);
                setJobsActiveTotal(open.total);
                setRecentJobs(recent.items);
            } catch {
                if (!cancelled) {
                    setJobsTotal(0);
                    setJobsActiveTotal(0);
                    setRecentJobs([]);
                }
            } finally {
                if (!cancelled) setJobsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [client?.id, canRead]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(t);
    }, [toast]);

    const copyProfileLink = useCallback(() => {
        if (!client) return;
        const url = `${window.location.origin}/app/clients/${client.id}`;
        void navigator.clipboard.writeText(url).then(
            () => setToast('Profile link copied to clipboard'),
            () => setToast('Could not copy link'),
        );
    }, [client]);

    const pipelineHint = (
        <p className="client-details__metric-hint" style={{ gridColumn: '1 / -1', marginTop: 4 }}>
            Pipeline totals (submissions, interviews, offers, placements) will appear here when connected to reporting.
        </p>
    );

    const confirmDeleteClient = async () => {
        if (!id) return;
        try {
            setDeleting(true);
            await deleteClient(id);
            navigate('/app/clients');
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err as Error)?.message ||
                'Failed to delete client';
            setError(message);
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const openPocMenu = (e: React.MouseEvent, poc: ClientPoc) => {
        e.stopPropagation();
        const el = e.currentTarget as HTMLElement;
        const r = el.getBoundingClientRect();
        const w = 172;
        const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
        let top = r.bottom + 6;
        const h = 120;
        if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
        setPocMenu((cur) => (cur?.poc.id === poc.id ? null : { poc, top, left }));
    };

    if (!canRead) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to view clients."
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

    if (error || !client) {
        return (
            <StatePanel
                title="Client not found"
                message={error || 'Client not found'}
                tone="danger"
                action={
                    <button onClick={() => navigate('/app/clients')} className="ghost-button" type="button">
                        Back to Clients
                    </button>
                }
            />
        );
    }

    const formatDate = (v?: string | Date | null) => {
        if (!v) return '—';
        const d = typeof v === 'string' ? new Date(v) : v;
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const websiteHref = client.website?.trim()
        ? client.website.includes('://')
            ? client.website
            : `https://${client.website}`
        : '';

    const pocInitial = (name: string) => (name.trim()[0] || '?').toUpperCase();

    return (
        <>
            <div className="page-stack client-details">
                {toast ? (
                    <div role="status" className="client-details__toast-fixed">
                        {toast}
                    </div>
                ) : null}

                <header className="client-details__hero client-details__animate">
                    <button type="button" className="client-details__back" onClick={() => navigate('/app/clients')}>
                        ← Back to clients
                    </button>
                    <div className="client-details__hero-grid">
                        <div>
                            <h1 className="client-details__title">{client.name}</h1>
                            <div className="client-details__chips">
                                <StatusBadge status={client.status || 'Active'} />
                                {client.industry ? (
                                    <span className="client-details__chip">{client.industry}</span>
                                ) : null}
                                {client.code ? <span className="client-details__chip">Code: {client.code}</span> : null}
                            </div>
                            <div className="client-details__meta">
                                {client.contact_person ? (
                                    <span className="client-details__meta-item">
                                        <span className="client-details__meta-icon" aria-hidden>
                                            👤
                                        </span>
                                        {client.contact_person}
                                    </span>
                                ) : null}
                                {client.email ? (
                                    <span className="client-details__meta-item">
                                        <span className="client-details__meta-icon" aria-hidden>
                                            ✉️
                                        </span>
                                        {client.email}
                                    </span>
                                ) : null}
                                {client.phone ? (
                                    <span className="client-details__meta-item">
                                        <span className="client-details__meta-icon" aria-hidden>
                                            📞
                                        </span>
                                        {client.phone}
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
                                onClick={() => navigate(`/app/jobs?clientId=${client.id}`)}
                            >
                                View jobs
                            </button>
                            {canUpdate ? (
                                <button
                                    type="button"
                                    className="client-details__btn client-details__btn--ghost"
                                    onClick={() => navigate(`/app/clients/${client.id}/edit`)}
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
                                onClick={() => navigate(`/app/jobs/create?clientId=${client.id}`)}
                            >
                                + Create job
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
                                        🏢
                                    </span>
                                    Profile & contact
                                </h2>
                            </div>
                            <div className="client-details__section-body">
                                <div className="client-details__field-grid client-details__field-grid--2">
                                    <DetailField icon="📋" label="Client name" value={client.name} />
                                    <DetailField icon="🔖" label="Client code" value={client.code || '—'} />
                                    <DetailField icon="🏭" label="Industry" value={client.industry || '—'} />
                                    <DetailField
                                        icon="🌐"
                                        label="Website"
                                        value={
                                            websiteHref ? (
                                                <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                                                    {displayDomain(client.website) || client.website}
                                                </a>
                                            ) : (
                                                '—'
                                            )
                                        }
                                    />
                                    <DetailField
                                        icon="📌"
                                        label="Status"
                                        value={<StatusBadge status={client.status || 'Active'} />}
                                    />
                                    <DetailField icon="👤" label="Contact person" value={client.contact_person || '—'} />
                                    <DetailField icon="✉️" label="Email" value={client.email || '—'} />
                                    <DetailField icon="📞" label="Phone" value={client.phone || '—'} />
                                </div>
                            </div>
                        </SurfaceCard>

                        <SurfaceCard className="client-details__section client-details__animate client-details__animate--3">
                            <div className="client-details__section-head">
                                <h2 className="client-details__section-title">
                                    <span className="client-details__section-icon" aria-hidden>
                                        📍
                                    </span>
                                    Address
                                </h2>
                            </div>
                            <div className="client-details__section-body">
                                <div className="client-details__field-grid">
                                    <DetailField label="Street" value={client.address || '—'} />
                                    <DetailField label="City" value={client.city || '—'} />
                                    <DetailField label="State / region" value={client.state || '—'} />
                                    <DetailField label="Country" value={client.country || '—'} />
                                    <DetailField label="Postal code" value={client.postal_code || '—'} />
                                </div>
                            </div>
                        </SurfaceCard>

                        <SurfaceCard className="client-details__section client-details__animate client-details__animate--3">
                            <div className="client-details__section-head">
                                <h2 className="client-details__section-title">
                                    <span className="client-details__section-icon" aria-hidden>
                                        💼
                                    </span>
                                    Business & notes
                                </h2>
                            </div>
                            <div className="client-details__section-body">
                                <div className="client-details__field-grid client-details__field-grid--2">
                                    <DetailField icon="📄" label="Payment terms" value={client.payment_terms || '—'} />
                                    <DetailField icon="🧾" label="Tax ID" value={client.tax_id || '—'} />
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <div className="client-details__field-label">Notes</div>
                                    <div className="client-details__notes">{client.notes?.trim() || 'No notes added.'}</div>
                                </div>
                                {client.tags && client.tags.length > 0 ? (
                                    <div className="client-details__tags">
                                        {client.tags.map((tag) => (
                                            <span key={tag} className="client-details__tag">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}
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
                                    <div className="client-details__metric client-details__metric--jobs">
                                        <div className="client-details__metric-icon" aria-hidden>
                                            💼
                                        </div>
                                        <div className="client-details__metric-label">Total jobs</div>
                                        <div className="client-details__metric-value">
                                            {jobsLoading ? '…' : jobsTotal}
                                        </div>
                                    </div>
                                    <div className="client-details__metric client-details__metric--active">
                                        <div className="client-details__metric-icon" aria-hidden>
                                            ✅
                                        </div>
                                        <div className="client-details__metric-label">Open jobs</div>
                                        <div className="client-details__metric-value">
                                            {jobsLoading ? '…' : jobsActiveTotal}
                                        </div>
                                    </div>
                                    <div className="client-details__metric client-details__metric--muted">
                                        <div className="client-details__metric-icon" aria-hidden>
                                            📤
                                        </div>
                                        <div className="client-details__metric-label">Submissions</div>
                                        <div className="client-details__metric-value">0</div>
                                    </div>
                                    <div className="client-details__metric client-details__metric--muted">
                                        <div className="client-details__metric-icon" aria-hidden>
                                            🎤
                                        </div>
                                        <div className="client-details__metric-label">Interviews</div>
                                        <div className="client-details__metric-value">0</div>
                                    </div>
                                    <div className="client-details__metric client-details__metric--muted">
                                        <div className="client-details__metric-icon" aria-hidden>
                                            ✉️
                                        </div>
                                        <div className="client-details__metric-label">Offers</div>
                                        <div className="client-details__metric-value">0</div>
                                    </div>
                                    <div className="client-details__metric client-details__metric--muted">
                                        <div className="client-details__metric-icon" aria-hidden>
                                            🎯
                                        </div>
                                        <div className="client-details__metric-label">Placements</div>
                                        <div className="client-details__metric-value">0</div>
                                    </div>
                                </div>
                                {pipelineHint}
                                <div className="client-details__timestamps">
                                    <DetailField label="Created" value={formatDate(client.created_at)} />
                                    <DetailField label="Last updated" value={formatDate(client.updated_at)} />
                                </div>
                            </div>
                        </SurfaceCard>

                        <SurfaceCard className="client-details__section client-details__animate client-details__animate--3">
                            <div className="client-details__section-head">
                                <h2 className="client-details__section-title">
                                    <span className="client-details__section-icon" aria-hidden>
                                        📋
                                    </span>
                                    Recent jobs
                                </h2>
                                <Link
                                    to={`/app/jobs?clientId=${client.id}`}
                                    className="client-details__btn client-details__btn--ghost"
                                    style={{ textDecoration: 'none', display: 'inline-flex' }}
                                >
                                    See all
                                </Link>
                            </div>
                            <div className="client-details__section-body">
                                {jobsLoading ? (
                                    <div className="client-details__empty">Loading jobs…</div>
                                ) : recentJobs.length === 0 ? (
                                    <div className="client-details__empty">
                                        No jobs linked yet. Use <strong>Create job</strong> to add a requirement for this client.
                                    </div>
                                ) : (
                                    <ul className="client-details__job-list">
                                        {recentJobs.map((job) => (
                                            <li key={job.id} className="client-details__job-row">
                                                <div>
                                                    <Link className="client-details__job-title" to={`/app/jobs/${job.id}`}>
                                                        {job.title || job.job_title || 'Untitled role'}
                                                    </Link>
                                                    <div className="client-details__job-meta">
                                                        {job.job_code || job.id.slice(0, 8)}
                                                        {job.location ? ` · ${job.location}` : ''}
                                                    </div>
                                                </div>
                                                <span
                                                    className={`client-details__job-pill${job.status === 'open' ? ' client-details__job-pill--open' : ''}`}
                                                >
                                                    {job.status}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </SurfaceCard>
                    </aside>
                </div>

                <SurfaceCard className={`client-details__section client-details__animate client-details__animate--4`}>
                    <div className="client-details__section-head">
                        <h2 className="client-details__section-title">
                            <span className="client-details__section-icon" aria-hidden>
                                🤝
                            </span>
                            Points of contact
                        </h2>
                        {canUpdate ? (
                            <button
                                type="button"
                                className="client-details__btn client-details__btn--primary"
                                onClick={() => {
                                    setPocEdit(null);
                                    setPocModalOpen(true);
                                }}
                            >
                                + Add POC
                            </button>
                        ) : null}
                    </div>
                    <p className="client-details__poc-intro">
                        People at this client for reqs and submissions. Assign a POC when creating jobs or requirements.
                    </p>
                    <div className="client-details__section-body" style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
                        {loadingPocs ? (
                            <div className="client-details__empty">Loading contacts…</div>
                        ) : pocs.length === 0 ? (
                            <div className="client-details__empty">
                                No points of contact yet.{canUpdate ? ' Click “Add POC” to add one.' : ''}
                            </div>
                        ) : (
                            <div className="client-details__poc-list">
                                {pocs.map((poc) => (
                                    <div key={poc.id} className="client-details__poc-card">
                                        <div className="client-details__poc-main">
                                            <div className="client-details__poc-avatar" aria-hidden>
                                                {pocInitial(poc.name)}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div className="client-details__poc-name">{poc.name}</div>
                                                <div className="client-details__poc-sub">
                                                    {[poc.designation, poc.email].filter(Boolean).join(' · ') || '—'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="client-details__poc-contact">
                                            {poc.phone ? <div>{poc.phone}</div> : null}
                                            {poc.linkedin ? (
                                                <div>
                                                    <a href={poc.linkedin} target="_blank" rel="noopener noreferrer">
                                                        LinkedIn profile ↗
                                                    </a>
                                                </div>
                                            ) : null}
                                            {!poc.phone && !poc.linkedin ? <span style={{ color: '#94a3b8' }}>—</span> : null}
                                        </div>
                                        <div className="client-details__poc-status">
                                            <StatusBadge status={poc.status} />
                                        </div>
                                        {canUpdate ? (
                                            <button
                                                type="button"
                                                className="client-details__poc-kebab"
                                                aria-label={`Actions for ${poc.name}`}
                                                aria-expanded={pocMenu?.poc.id === poc.id}
                                                onClick={(e) => openPocMenu(e, poc)}
                                            >
                                                ⋮
                                            </button>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SurfaceCard>
            </div>

            <PocFormModal
                open={pocModalOpen}
                onClose={() => {
                    setPocModalOpen(false);
                    setPocEdit(null);
                }}
                initial={pocEdit}
                loading={savingPoc}
                onSubmit={async (payload: CreatePocPayload) => {
                    if (!client?.id) return;
                    setSavingPoc(true);
                    try {
                        if (pocEdit?.id) {
                            await updatePoc(client.id, pocEdit.id, payload);
                        } else {
                            await createPoc(client.id, payload);
                        }
                        await loadPocs();
                    } finally {
                        setSavingPoc(false);
                    }
                }}
            />

            {deleteDialogOpen ? (
                <div
                    className="client-details__modal-backdrop"
                    role="presentation"
                    onClick={() => !deleting && setDeleteDialogOpen(false)}
                >
                    <div className="client-details__modal" onClick={(e) => e.stopPropagation()}>
                        <SurfaceCard>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800 }}>Delete client?</h3>
                            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
                                <strong>{client.name}</strong> will be archived (soft delete). This cannot be undone from the
                                client list.
                            </p>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="ghost-button"
                                    onClick={() => setDeleteDialogOpen(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="success-button"
                                    style={{ background: '#b91c1c', borderColor: '#b91c1c' }}
                                    disabled={deleting}
                                    onClick={() => void confirmDeleteClient()}
                                >
                                    {deleting ? 'Deleting…' : 'Delete client'}
                                </button>
                            </div>
                        </SurfaceCard>
                    </div>
                </div>
            ) : null}

            {pocMenu && canUpdate ? (
                <>
                    <button type="button" className="client-details__overlay" aria-label="Close menu" onClick={() => setPocMenu(null)} />
                    <div
                        className="client-details__flyout"
                        role="menu"
                        style={{ top: pocMenu.top, left: pocMenu.left }}
                    >
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setPocEdit(pocMenu.poc);
                                setPocModalOpen(true);
                                setPocMenu(null);
                            }}
                        >
                            Edit POC
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            className="client-details__flyout-danger"
                            onClick={async () => {
                                const p = pocMenu.poc;
                                setPocMenu(null);
                                if (!window.confirm(`Remove ${p.name} as a point of contact?`)) return;
                                try {
                                    await deletePoc(client.id, p.id);
                                    await loadPocs();
                                } catch (err: unknown) {
                                    alert(
                                        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                                            'Failed to delete',
                                    );
                                }
                            }}
                        >
                            Delete POC…
                        </button>
                    </div>
                </>
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
    else if (status === 'Suspended') cls = 'cd-badge cd-badge--suspended';

    return <span className={cls}>{status}</span>;
}
