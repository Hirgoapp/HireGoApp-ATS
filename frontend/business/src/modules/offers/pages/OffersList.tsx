import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import { fetchOffers, OfferDetail } from '../services/offers.api';
import {
    offerPillClass,
    shortId,
    formatListDate,
    ModuleDataListPagination,
    ModuleDataListEmpty,
} from '../../../components/ui/moduleDataList';

function formatCtc(o: OfferDetail): string {
    if (o.ctc != null && o.ctc !== '') {
        const n = Number(o.ctc);
        if (!Number.isNaN(n)) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: o.currency || 'USD',
                maximumFractionDigits: 0,
            }).format(n);
        }
        return String(o.ctc);
    }
    const bs = o.base_salary;
    if (bs != null && bs !== '') {
        const n = typeof bs === 'number' ? bs : Number(bs);
        if (!Number.isNaN(n)) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: o.currency || 'USD',
            }).format(n);
        }
    }
    return '—';
}

function joiningLabel(o: OfferDetail): string {
    if (o.joining_date) return formatListDate(String(o.joining_date));
    if (o.start_date) return formatListDate(String(o.start_date));
    return '—';
}

export default function OffersList() {
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const canRead = useMemo(() => permissions.includes('*') || permissions.includes('offers:read'), [permissions]);

    const [skip, setSkip] = useState(0);
    const [take] = useState(20);
    const [items, setItems] = useState<OfferDetail[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canRead) return;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetchOffers({ skip, take });
                setItems(res.data || []);
                setTotal(res.total || 0);
            } catch (e: any) {
                setError(e?.message || 'Failed to load offers');
                setItems([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        })();
    }, [canRead, skip, take]);

    if (!canRead) {
        return <StatePanel title="Access Denied" message="You do not have permission to view offers." tone="danger" />;
    }
    if (loading) {
        return <StatePanel title="Loading offers" message="Fetching offer letters…" />;
    }
    if (error) {
        return <StatePanel title="Unable to load offers" message={error} tone="danger" />;
    }

    const page = Math.floor(skip / take) + 1;

    return (
        <div className="page-stack">
            <PageHeader
                title="Offers"
                subtitle="Draft, issued, and closed compensation packages"
                actions={
                    <button className="ghost-button" type="button" onClick={() => navigate('/app/submissions')}>
                        Submissions
                    </button>
                }
            />

            <div className="mdl-intro">
                <div className="mdl-intro__text">
                    <p className="mdl-intro__title">Compensation</p>
                    <p className="mdl-intro__desc">
                        Track designation, CTC, and key dates. Open an offer to issue, accept, or withdraw.
                    </p>
                </div>
                <div className="mdl-stat-row">
                    <span className="mdl-stat">
                        <strong>{total}</strong> offers
                    </span>
                </div>
            </div>

            <div className="mdl-card">
                {items.length === 0 ? (
                    <ModuleDataListEmpty
                        icon="✉️"
                        title="No offers yet"
                        message="Generate offers from a submission when a candidate reaches the offer stage."
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
                                    <th>Role</th>
                                    <th>Package</th>
                                    <th>Start / join</th>
                                    <th>Submission</th>
                                    <th className="mdl-th-num">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((o) => (
                                    <tr key={o.id}>
                                        <td>
                                            <span className={offerPillClass(String(o.status))} title={String(o.status)}>
                                                {String(o.status || '—')}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600 }}>{o.designation || '—'}</span>
                                        </td>
                                        <td className="mdl-muted" style={{ fontWeight: 600, color: 'var(--text)' }}>
                                            {formatCtc(o)}
                                        </td>
                                        <td className="mdl-muted">{joiningLabel(o)}</td>
                                        <td>
                                            {o.submission_id ? (
                                                <span className="mdl-mono" title={o.submission_id}>
                                                    {shortId(o.submission_id)}
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
                                                    onClick={() => navigate(`/app/offers/${o.id}`)}
                                                >
                                                    Details
                                                </button>
                                                {o.submission_id ? (
                                                    <button
                                                        type="button"
                                                        className="ghost-button"
                                                        onClick={() => navigate(`/app/submissions/${o.submission_id}/offers`)}
                                                    >
                                                        In context
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
                    pageSize={take}
                    total={total}
                    onPrev={() => setSkip(Math.max(0, skip - take))}
                    onNext={() => setSkip(skip + take)}
                />
            )}
        </div>
    );
}
