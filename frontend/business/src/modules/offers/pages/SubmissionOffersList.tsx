import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { getOffersBySubmission, OfferDetail } from '../services/offers.api';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import SurfaceCard from '../../../components/ui/SurfaceCard';

export default function SubmissionOffersList() {
    const { id: submissionId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const [offers, setOffers] = useState<OfferDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Permission checks
    const canRead = permissions.includes('*') || permissions.includes('offers:read');
    const canCreate = permissions.includes('*') || permissions.includes('offers:create');

    useEffect(() => {
        if (!canRead) {
            setError('You do not have permission to view offers');
            setLoading(false);
            return;
        }

        if (!submissionId) {
            setError('Invalid submission ID');
            setLoading(false);
            return;
        }

        loadOffers();
    }, [submissionId, canRead]);

    async function loadOffers() {
        if (!submissionId) return;
        try {
            setLoading(true);
            setError('');
            const response = await getOffersBySubmission(submissionId);
            setOffers(response.data);
        } catch (err: any) {
            console.error('Failed to load offers:', err);
            setError(err.response?.data?.message || 'Failed to load offers');
        } finally {
            setLoading(false);
        }
    }

    function getStatusColor(status: string) {
        const s = (status || '').toLowerCase();
        if (s === 'accepted') return '#10B981';
        if (s === 'rejected' || s === 'withdrawn') return '#EF4444';
        if (s === 'issued') return '#3B82F6';
        return '#6B7280';
    }

    function formatMoney(offer: OfferDetail, currency: string = 'USD') {
        if (offer.ctc != null && offer.ctc !== '') {
            const n = Number(offer.ctc);
            if (!Number.isNaN(n)) {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: offer.currency || currency,
                    maximumFractionDigits: 0,
                }).format(n);
            }
        }
        const amount = offer.base_salary;
        if (amount === null || amount === undefined || amount === '') return 'N/A';
        const num = typeof amount === 'number' ? amount : Number(amount);
        if (Number.isNaN(num)) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: offer.currency || currency,
        }).format(num);
    }

    function formatDate(dateString: string | null | undefined) {
        if (dateString == null || dateString === '') return 'N/A';
        return new Date(dateString).toLocaleDateString();
    }

    if (!canRead) {
        return (
            <StatePanel title="Access Denied" message={error || 'You do not have permission to view offers'} tone="danger" />
        );
    }

    if (loading) {
        return (
            <StatePanel title="Loading offers" message="Fetching offer pipeline..." />
        );
    }

    if (error) {
        return (
            <StatePanel title="Unable to load offers" message={error} tone="danger" />
        );
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Offers"
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
                                onClick={() => navigate(`/app/submissions/${submissionId}/offers/create`)}
                                className="primary-button"
                                type="button"
                            >
                                Create Offer
                            </button>
                        )}
                    </div>
                }
            />

            {/* Table */}
            {offers.length === 0 ? (
                <StatePanel title="No offers created" message="No offers exist yet for this submission." />
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
                                    Employment Type
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
                                    Base Salary
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
                                    Start Date
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
                                    Version
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
                            {offers.map((offer) => (
                                <tr
                                    key={offer.id}
                                    style={{ borderBottom: '1px solid #374151' }}
                                >
                                    <td style={{ padding: 12 }}>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                padding: '4px 8px',
                                                borderRadius: 4,
                                                fontSize: 12,
                                                fontWeight: 500,
                                                background: getStatusColor(offer.status) + '20',
                                                color: getStatusColor(offer.status),
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {offer.status}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            fontSize: 14,
                                            color: '#E5E7EB',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {(offer.employment_type || '—').toString().replace(/_/g, ' ')}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            fontSize: 14,
                                            color: '#E5E7EB',
                                        }}
                                    >
                                        {formatMoney(offer, offer.currency || 'USD')}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            fontSize: 14,
                                            color: '#E5E7EB',
                                        }}
                                    >
                                        {formatDate(offer.start_date)}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            fontSize: 14,
                                            color: '#E5E7EB',
                                        }}
                                    >
                                        v{offer.offer_version ?? offer.current_version ?? '?'}
                                    </td>
                                    <td
                                        style={{
                                            padding: 12,
                                            textAlign: 'right',
                                        }}
                                    >
                                        <button
                                            onClick={() => navigate(`/app/offers/${offer.id}`)}
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
