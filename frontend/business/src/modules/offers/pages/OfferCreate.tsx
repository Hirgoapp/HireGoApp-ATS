import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import {
    createOffer,
    CreateOfferPayload,
    EmploymentTypeEnum,
} from '../services/offers.api';

export default function OfferCreate() {
    const { id: submissionId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const canCreate = permissions.includes('*') || permissions.includes('offers:create');

    const [formData, setFormData] = useState({
        submission_id: submissionId || '',
        employment_type: '' as EmploymentTypeEnum | '',
        start_date: '',
        expiry_date: '',
        currency: 'USD',
        base_salary: '',
        bonus: '',
        equity: '',
        notes: '',
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.employment_type) {
            setError('Employment type is required');
            return;
        }

        try {
            setSaving(true);
            setError('');

            const payload: CreateOfferPayload = {
                submission_id: formData.submission_id,
                employment_type: formData.employment_type as EmploymentTypeEnum,
                currency: formData.currency || undefined,
                start_date: formData.start_date || undefined,
                expiry_date: formData.expiry_date || undefined,
                base_salary: formData.base_salary ? parseFloat(formData.base_salary) : undefined,
                bonus: formData.bonus ? parseFloat(formData.bonus) : undefined,
                equity: formData.equity || undefined,
                notes: formData.notes || undefined,
            };

            const result = await createOffer(payload);
            navigate(`/app/offers/${result.id}`);
        } catch (err: any) {
            console.error('Failed to create offer:', err);
            setError(err.response?.data?.message || 'Failed to create offer');
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        navigate(`/app/submissions/${submissionId}/offers`);
    }

    if (!canCreate) {
        return (
            <div
                style={{
                    textAlign: 'center',
                    padding: 40,
                    color: '#EF4444',
                    fontSize: 14,
                }}
            >
                You do not have permission to create offers
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 900 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Create Offer (Draft)</h1>

            {error && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 12,
                        background: '#7F1D1D',
                        color: '#FEE2E2',
                        borderRadius: 6,
                        fontSize: 14,
                    }}
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div
                    style={{
                        background: '#1F2937',
                        borderRadius: 8,
                        border: '1px solid #374151',
                        padding: 24,
                    }}
                >
                    {/* Required Fields */}
                    <div style={{ marginBottom: 24 }}>
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#9CA3AF',
                                marginBottom: 16,
                                textTransform: 'uppercase',
                            }}
                        >
                            Required Information
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* Submission ID (locked) */}
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        marginBottom: 6,
                                        color: '#E5E7EB',
                                    }}
                                >
                                    Submission ID <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.submission_id}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: 8,
                                        borderRadius: 6,
                                        border: '1px solid #374151',
                                        background: '#111827',
                                        color: '#6B7280',
                                        fontSize: 14,
                                        cursor: 'not-allowed',
                                    }}
                                />
                            </div>

                            {/* Employment Type */}
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        marginBottom: 6,
                                        color: '#E5E7EB',
                                    }}
                                >
                                    Employment Type <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <select
                                    value={formData.employment_type}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            employment_type: e.target.value as EmploymentTypeEnum,
                                        })
                                    }
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
                                    <option value="">Select Employment Type</option>
                                    {Object.values(EmploymentTypeEnum).map((type) => (
                                        <option key={type} value={type}>
                                            {type.replace('_', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Compensation Details */}
                    <div style={{ marginBottom: 24 }}>
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#9CA3AF',
                                marginBottom: 16,
                                textTransform: 'uppercase',
                            }}
                        >
                            Compensation Details
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        marginBottom: 6,
                                        color: '#E5E7EB',
                                    }}
                                >
                                    Currency
                                </label>
                                <input
                                    type="text"
                                    value={formData.currency}
                                    onChange={(e) =>
                                        setFormData({ ...formData, currency: e.target.value })
                                    }
                                    placeholder="USD"
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
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        marginBottom: 6,
                                        color: '#E5E7EB',
                                    }}
                                >
                                    Base Salary
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.base_salary}
                                    onChange={(e) =>
                                        setFormData({ ...formData, base_salary: e.target.value })
                                    }
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
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        marginBottom: 6,
                                        color: '#E5E7EB',
                                    }}
                                >
                                    Bonus
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.bonus}
                                    onChange={(e) =>
                                        setFormData({ ...formData, bonus: e.target.value })
                                    }
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
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        marginBottom: 6,
                                        color: '#E5E7EB',
                                    }}
                                >
                                    Equity
                                </label>
                                <input
                                    type="text"
                                    value={formData.equity}
                                    onChange={(e) =>
                                        setFormData({ ...formData, equity: e.target.value })
                                    }
                                    placeholder="e.g., 1000 RSUs"
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
                    </div>

                    {/* Dates */}
                    <div style={{ marginBottom: 24 }}>
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#9CA3AF',
                                marginBottom: 16,
                                textTransform: 'uppercase',
                            }}
                        >
                            Dates
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        marginBottom: 6,
                                        color: '#E5E7EB',
                                    }}
                                >
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, start_date: e.target.value })
                                    }
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
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        marginBottom: 6,
                                        color: '#E5E7EB',
                                    }}
                                >
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.expiry_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, expiry_date: e.target.value })
                                    }
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
                    </div>

                    {/* Additional Notes */}
                    <div>
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#9CA3AF',
                                marginBottom: 16,
                                textTransform: 'uppercase',
                            }}
                        >
                            Additional Notes
                        </h3>

                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    marginBottom: 6,
                                    color: '#E5E7EB',
                                }}
                            >
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: 8,
                                    borderRadius: 6,
                                    border: '1px solid #374151',
                                    background: '#111827',
                                    color: '#E5E7EB',
                                    fontSize: 14,
                                    resize: 'vertical',
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            background: '#3B82F6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '10px 20px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                            opacity: saving ? 0.6 : 1,
                        }}
                    >
                        {saving ? 'Creating...' : 'Create Offer (Draft)'}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        style={{
                            background: 'transparent',
                            color: '#9CA3AF',
                            border: '1px solid #374151',
                            borderRadius: 6,
                            padding: '10px 20px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
