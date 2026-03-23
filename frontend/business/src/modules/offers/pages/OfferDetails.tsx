import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import {
    getOfferById,
    getOfferStatusHistory,
    issueOffer,
    acceptOffer,
    rejectOffer,
    withdrawOffer,
    updateOffer,
    OfferDetail,
    StatusHistoryEntry,
    UpdateOfferPayload,
    IssueOfferPayload,
    AcceptOfferPayload,
    RejectOfferPayload,
    WithdrawOfferPayload,
    EmploymentTypeEnum,
} from '../services/offers.api';

export default function OfferDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const [offer, setOffer] = useState<OfferDetail | null>(null);
    const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    const canRead = permissions.includes('*') || permissions.includes('offers:read');
    const canUpdate = permissions.includes('*') || permissions.includes('offers:update');
    const canIssue = permissions.includes('*') || permissions.includes('offers:issue');
    const canAccept = permissions.includes('*') || permissions.includes('offers:accept');
    const canReject = permissions.includes('*') || permissions.includes('offers:reject');
    const canWithdraw = permissions.includes('*') || permissions.includes('offers:withdraw');
    const canViewHistory = permissions.includes('*') || permissions.includes('offers:view_history');

    useEffect(() => {
        if (!canRead) {
            setError('You do not have permission to view offers');
            setLoading(false);
            return;
        }
        loadOffer();
    }, [id, canRead]);

    async function loadOffer() {
        if (!id) return;
        try {
            setLoading(true);
            const data = await getOfferById(id);
            setOffer(data);
        } catch (err: any) {
            console.error('Failed to load offer:', err);
            setError(err.response?.data?.message || 'Failed to load offer');
        } finally {
            setLoading(false);
        }
    }

    async function loadHistory() {
        if (!id || !canViewHistory) return;
        try {
            const data = await getOfferStatusHistory(id);
            setHistory(data.history);
            setShowHistory(true);
        } catch (err: any) {
            console.error('Failed to load history:', err);
        }
    }

    function getStatusColor(status: string) {
        const s = (status || '').toLowerCase();
        if (s === 'accepted') return '#10B981';
        if (s === 'rejected' || s === 'withdrawn') return '#EF4444';
        if (s === 'issued') return '#3B82F6';
        if (s === 'draft') return '#6B7280';
        return '#6B7280';
    }

    function formatCurrency(amount: number | string | null | undefined, currency: string = 'USD') {
        if (amount === null || amount === undefined || amount === '') return 'N/A';
        const n = typeof amount === 'number' ? amount : Number(amount);
        if (Number.isNaN(n)) return String(amount);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(n);
    }

    function formatDate(dateString: string | null | undefined) {
        if (dateString == null || dateString === '') return 'N/A';
        return new Date(dateString).toLocaleDateString();
    }

    const displayValue = (val: any) => (val !== null && val !== undefined ? val : 'N/A');

    if (!canRead) {
        return (
            <div style={{ textAlign: 'center', padding: 40, color: '#EF4444', fontSize: 14 }}>
                {error || 'You do not have permission to view offers'}
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                Loading offer...
            </div>
        );
    }

    if (error || !offer) {
        return (
            <div style={{ textAlign: 'center', padding: 40, color: '#EF4444', fontSize: 14 }}>
                {error || 'Offer not found'}
            </div>
        );
    }

    const st = String(offer.status || '').toLowerCase();
    const isDraft = st === 'draft';
    const isIssued = st === 'issued';
    const isTerminal = st === 'accepted' || st === 'rejected' || st === 'withdrawn';

    return (
        <div style={{ maxWidth: 900 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button
                    onClick={() => navigate(`/app/submissions/${offer.submission_id}/offers`)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#60A5FA',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 0,
                    }}
                >
                    ← Back to Offers
                </button>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Offer Details</h1>
            </div>

            {/* Status Badge & Version */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
                <span
                    style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        background: getStatusColor(offer.status) + '20',
                        color: getStatusColor(offer.status),
                        textTransform: 'capitalize',
                    }}
                >
                    {offer.status}
                </span>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                    Version: {offer.offer_version ?? offer.current_version ?? '—'}
                </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {isDraft && canUpdate && (
                    <button
                        onClick={() => setShowEditModal(true)}
                        style={{
                            background: '#6B7280',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        Edit
                    </button>
                )}
                {isDraft && canIssue && (
                    <button
                        onClick={() => setShowIssueModal(true)}
                        style={{
                            background: '#3B82F6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        Issue Offer
                    </button>
                )}
                {isIssued && canAccept && (
                    <button
                        onClick={() => setShowAcceptModal(true)}
                        style={{
                            background: '#10B981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        Accept Offer
                    </button>
                )}
                {isIssued && canReject && (
                    <button
                        onClick={() => setShowRejectModal(true)}
                        style={{
                            background: '#EF4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        Reject Offer
                    </button>
                )}
                {isIssued && canWithdraw && (
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        style={{
                            background: '#F59E0B',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        Withdraw Offer
                    </button>
                )}
                {canViewHistory && (
                    <button
                        onClick={loadHistory}
                        style={{
                            background: 'transparent',
                            color: '#9CA3AF',
                            border: '1px solid #374151',
                            borderRadius: 6,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: 14,
                        }}
                    >
                        View History
                    </button>
                )}
            </div>

            {/* Offer Details */}
            <div
                style={{
                    background: '#1F2937',
                    borderRadius: 8,
                    border: '1px solid #374151',
                    padding: 24,
                    marginBottom: 20,
                }}
            >
                <h3
                    style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#9CA3AF',
                        marginBottom: 16,
                        textTransform: 'uppercase',
                    }}
                >
                    Offer Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                            Employment Type
                        </div>
                        <div style={{ fontSize: 14, color: '#E5E7EB', textTransform: 'capitalize' }}>
                            {displayValue(offer.employment_type?.replace('_', ' '))}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                            Currency
                        </div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {displayValue(offer.currency)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                            Base Salary
                        </div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {formatCurrency(offer.base_salary, offer.currency)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Bonus</div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {formatCurrency(offer.bonus, offer.currency)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Equity</div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {displayValue(offer.equity)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                            Start Date
                        </div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {formatDate(offer.start_date)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                            Expiry Date
                        </div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {formatDate(offer.expiry_date)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {offer.notes && (
                <div
                    style={{
                        background: '#1F2937',
                        borderRadius: 8,
                        border: '1px solid #374151',
                        padding: 24,
                        marginBottom: 20,
                    }}
                >
                    <h3
                        style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#9CA3AF',
                            marginBottom: 16,
                            textTransform: 'uppercase',
                        }}
                    >
                        Notes
                    </h3>
                    <div style={{ fontSize: 14, color: '#E5E7EB' }}>{offer.notes}</div>
                </div>
            )}

            {/* Status History */}
            {showHistory && (
                <div
                    style={{
                        background: '#1F2937',
                        borderRadius: 8,
                        border: '1px solid #374151',
                        padding: 24,
                    }}
                >
                    <h3
                        style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#9CA3AF',
                            marginBottom: 16,
                            textTransform: 'uppercase',
                        }}
                    >
                        Status History
                    </h3>
                    {history.length === 0 ? (
                        <div style={{ color: '#9CA3AF', fontSize: 14 }}>No history available</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {history.map((entry) => (
                                <div
                                    key={entry.id}
                                    style={{
                                        padding: 12,
                                        background: '#111827',
                                        borderRadius: 6,
                                        border: '1px solid #374151',
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                                        {entry.from_status && (
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: '#9CA3AF',
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {entry.from_status}
                                            </span>
                                        )}
                                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>→</span>
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: getStatusColor(entry.to_status),
                                                fontWeight: 500,
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {entry.to_status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                                        {formatDate(entry.changed_at)}
                                    </div>
                                    {entry.reason && (
                                        <div style={{ fontSize: 13, color: '#E5E7EB', marginTop: 6 }}>
                                            {entry.reason}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showEditModal && (
                <EditModal offer={offer} onClose={() => setShowEditModal(false)} onSuccess={loadOffer} />
            )}
            {showIssueModal && (
                <IssueModal offerId={offer.id} onClose={() => setShowIssueModal(false)} onSuccess={loadOffer} />
            )}
            {showAcceptModal && (
                <AcceptModal offerId={offer.id} onClose={() => setShowAcceptModal(false)} onSuccess={loadOffer} />
            )}
            {showRejectModal && (
                <RejectModal offerId={offer.id} onClose={() => setShowRejectModal(false)} onSuccess={loadOffer} />
            )}
            {showWithdrawModal && (
                <WithdrawModal offerId={offer.id} onClose={() => setShowWithdrawModal(false)} onSuccess={loadOffer} />
            )}
        </div>
    );
}

// Edit Modal (for draft offers)
function EditModal({ offer, onClose, onSuccess }: { offer: OfferDetail; onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        employment_type: offer.employment_type,
        currency: offer.currency,
        base_salary: offer.base_salary?.toString() || '',
        bonus: offer.bonus?.toString() || '',
        equity: offer.equity || '',
        start_date: offer.start_date || '',
        expiry_date: offer.expiry_date || '',
        notes: offer.notes || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit() {
        try {
            setSaving(true);
            const payload: UpdateOfferPayload = {
                employment_type: (formData.employment_type || 'full_time') as EmploymentTypeEnum,
                currency: formData.currency || undefined,
                base_salary: formData.base_salary ? parseFloat(formData.base_salary) : undefined,
                bonus: formData.bonus ? parseFloat(formData.bonus) : undefined,
                equity: formData.equity || undefined,
                start_date: formData.start_date || undefined,
                expiry_date: formData.expiry_date || undefined,
                notes: formData.notes || undefined,
            };
            await updateOffer(offer.id, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update offer');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                overflow: 'auto',
                padding: 20,
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#1F2937',
                    borderRadius: 8,
                    border: '1px solid #374151',
                    padding: 24,
                    maxWidth: 600,
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                }}
            >
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Edit Offer</h3>
                <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#E5E7EB' }}>
                            Employment Type
                        </label>
                        <select
                            value={formData.employment_type}
                            onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as EmploymentTypeEnum })}
                            style={{
                                width: '100%',
                                padding: 8,
                                borderRadius: 6,
                                border: '1px solid #374151',
                                background: '#111827',
                                color: '#E5E7EB',
                                fontSize: 14,
                            }}
                        >
                            {Object.values(EmploymentTypeEnum).map((type) => (
                                <option key={type} value={type}>
                                    {type.replace('_', ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#E5E7EB' }}>
                            Base Salary
                        </label>
                        <input
                            type="number"
                            value={formData.base_salary}
                            onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                            style={{
                                width: '100%',
                                padding: 8,
                                borderRadius: 6,
                                border: '1px solid #374151',
                                background: '#111827',
                                color: '#E5E7EB',
                                fontSize: 14,
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#E5E7EB' }}>
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            style={{
                                width: '100%',
                                padding: 8,
                                borderRadius: 6,
                                border: '1px solid #374151',
                                background: '#111827',
                                color: '#E5E7EB',
                                fontSize: 14,
                            }}
                        />
                    </div>
                </div>
                {error && (
                    <div style={{ marginTop: 16, padding: 12, background: '#7F1D1D', color: '#FEE2E2', borderRadius: 6, fontSize: 14 }}>
                        {error}
                    </div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        style={{
                            background: '#3B82F6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 16px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                            opacity: saving ? 0.6 : 1,
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        style={{
                            background: 'transparent',
                            color: '#9CA3AF',
                            border: '1px solid #374151',
                            borderRadius: 6,
                            padding: '8px 16px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontSize: 14,
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Issue Modal
function IssueModal({ offerId, onClose, onSuccess }: { offerId: string; onClose: () => void; onSuccess: () => void }) {
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleIssue() {
        try {
            setSaving(true);
            const payload = notes ? { notes } : undefined;
            await issueOffer(offerId, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to issue offer');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#1F2937', borderRadius: 8, border: '1px solid #374151', padding: 24, maxWidth: 400, width: '100%' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Issue Offer</h3>
                <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>Are you sure you want to issue this offer? This action will change the status from draft to issued.</p>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes"
                    rows={3}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #374151', background: '#111827', color: '#E5E7EB', fontSize: 14, marginBottom: 16, resize: 'vertical' }}
                />
                {error && <div style={{ marginBottom: 16, padding: 12, background: '#7F1D1D', color: '#FEE2E2', borderRadius: 6, fontSize: 14 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleIssue} disabled={saving} style={{ background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Processing...' : 'Issue Offer'}
                    </button>
                    <button onClick={onClose} disabled={saving} style={{ background: 'transparent', color: '#9CA3AF', border: '1px solid #374151', borderRadius: 6, padding: '8px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Accept Modal
function AcceptModal({ offerId, onClose, onSuccess }: { offerId: string; onClose: () => void; onSuccess: () => void }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleAccept() {
        try {
            setSaving(true);
            await acceptOffer(offerId);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to accept offer');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#1F2937', borderRadius: 8, border: '1px solid #374151', padding: 24, maxWidth: 400, width: '100%' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Accept Offer</h3>
                <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>Are you sure you want to accept this offer?</p>
                {error && <div style={{ marginBottom: 16, padding: 12, background: '#7F1D1D', color: '#FEE2E2', borderRadius: 6, fontSize: 14 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleAccept} disabled={saving} style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Processing...' : 'Accept'}
                    </button>
                    <button onClick={onClose} disabled={saving} style={{ background: 'transparent', color: '#9CA3AF', border: '1px solid #374151', borderRadius: 6, padding: '8px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Reject Modal
function RejectModal({ offerId, onClose, onSuccess }: { offerId: string; onClose: () => void; onSuccess: () => void }) {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleReject() {
        try {
            setSaving(true);
            const payload = reason ? { reason } : undefined;
            await rejectOffer(offerId, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reject offer');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#1F2937', borderRadius: 8, border: '1px solid #374151', padding: 24, maxWidth: 400, width: '100%' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Reject Offer</h3>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rejection (optional)"
                    rows={4}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #374151', background: '#111827', color: '#E5E7EB', fontSize: 14, marginBottom: 16, resize: 'vertical' }}
                />
                {error && <div style={{ marginBottom: 16, padding: 12, background: '#7F1D1D', color: '#FEE2E2', borderRadius: 6, fontSize: 14 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleReject} disabled={saving} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Processing...' : 'Reject Offer'}
                    </button>
                    <button onClick={onClose} disabled={saving} style={{ background: 'transparent', color: '#9CA3AF', border: '1px solid #374151', borderRadius: 6, padding: '8px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Withdraw Modal
function WithdrawModal({ offerId, onClose, onSuccess }: { offerId: string; onClose: () => void; onSuccess: () => void }) {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleWithdraw() {
        if (!reason.trim()) {
            setError('Reason is required for withdrawal');
            return;
        }

        try {
            setSaving(true);
            const payload: WithdrawOfferPayload = { reason };
            await withdrawOffer(offerId, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to withdraw offer');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#1F2937', borderRadius: 8, border: '1px solid #374151', padding: 24, maxWidth: 400, width: '100%' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Withdraw Offer</h3>
                <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 12 }}>Reason is required:</p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for withdrawal"
                    rows={4}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #374151', background: '#111827', color: '#E5E7EB', fontSize: 14, marginBottom: 16, resize: 'vertical' }}
                />
                {error && <div style={{ marginBottom: 16, padding: 12, background: '#7F1D1D', color: '#FEE2E2', borderRadius: 6, fontSize: 14 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleWithdraw} disabled={saving} style={{ background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Processing...' : 'Withdraw Offer'}
                    </button>
                    <button onClick={onClose} disabled={saving} style={{ background: 'transparent', color: '#9CA3AF', border: '1px solid #374151', borderRadius: 6, padding: '8px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
