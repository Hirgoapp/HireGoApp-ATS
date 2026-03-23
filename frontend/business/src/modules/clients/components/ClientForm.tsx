import { useState } from 'react';
import type { CreateClientPayload } from '../services/clients.api';

interface ClientFormProps {
    initial?: Partial<CreateClientPayload>;
    onSubmit: (data: CreateClientPayload) => Promise<void>;
    loading?: boolean;
}

export default function ClientForm({ initial, onSubmit, loading }: ClientFormProps) {
    const [form, setForm] = useState<CreateClientPayload>({
        name: initial?.name ?? '',
        code: initial?.code ?? '',
        contact_person: initial?.contact_person ?? '',
        email: initial?.email ?? '',
        phone: initial?.phone ?? '',
        address: initial?.address ?? '',
        city: initial?.city ?? '',
        state: initial?.state ?? '',
        country: initial?.country ?? '',
        postal_code: initial?.postal_code ?? '',
        website: initial?.website ?? '',
        industry: initial?.industry ?? '',
        status: initial?.status ?? 'Active',
        payment_terms: initial?.payment_terms ?? '',
        tax_id: initial?.tax_id ?? '',
        notes: initial?.notes ?? '',
        is_active: initial?.is_active ?? true,
    });

    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: keyof CreateClientPayload, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            let payload = { ...form };
            if (!payload.code) {
                // simple auto-code placeholder, backend can enforce stronger logic later
                payload = { ...payload, code: undefined };
            }
            await onSubmit(payload);
        } catch (err: any) {
            const message = err?.response?.data?.message || err.message || 'Failed to save client';
            setError(message);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            {error && (
                <div
                    style={{
                        background: '#ffe0e0',
                        color: '#c92a2a',
                        border: '1px solid #ff8787',
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 14,
                    }}
                >
                    {error}
                </div>
            )}

            {/* Section 1 – Basic */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr',
                    gap: 16,
                }}
            >
                <Field
                    label="Client Name"
                    required
                    value={form.name}
                    onChange={(v) => handleChange('name', v)}
                />
                <Field
                    label="Client Code"
                    value={form.code ?? ''}
                    onChange={(v) => handleChange('code', v)}
                />
                <Field
                    label="Status"
                    value={form.status ?? 'Active'}
                    onChange={(v) => handleChange('status', v)}
                />
            </div>

            {/* Section 2 – Contact */}
            <SectionTitle>Contact Details</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                <Field
                    label="Contact Person"
                    value={form.contact_person ?? ''}
                    onChange={(v) => handleChange('contact_person', v)}
                />
                <Field
                    label="Email"
                    value={form.email ?? ''}
                    onChange={(v) => handleChange('email', v)}
                    type="email"
                />
                <Field
                    label="Phone"
                    value={form.phone ?? ''}
                    onChange={(v) => handleChange('phone', v)}
                />
                <Field
                    label="Website"
                    value={form.website ?? ''}
                    onChange={(v) => handleChange('website', v)}
                />
            </div>

            {/* Section 3 – Address */}
            <SectionTitle>Address</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 16 }}>
                <Field
                    label="Address"
                    value={form.address ?? ''}
                    onChange={(v) => handleChange('address', v)}
                />
                <Field
                    label="City"
                    value={form.city ?? ''}
                    onChange={(v) => handleChange('city', v)}
                />
                <Field
                    label="State"
                    value={form.state ?? ''}
                    onChange={(v) => handleChange('state', v)}
                />
                <Field
                    label="Country"
                    value={form.country ?? ''}
                    onChange={(v) => handleChange('country', v)}
                />
                <Field
                    label="Postal Code"
                    value={form.postal_code ?? ''}
                    onChange={(v) => handleChange('postal_code', v)}
                />
            </div>

            {/* Section 4 – Business */}
            <SectionTitle>Business Details</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <Field
                    label="Industry"
                    value={form.industry ?? ''}
                    onChange={(v) => handleChange('industry', v)}
                />
                <Field
                    label="Payment Terms"
                    value={form.payment_terms ?? ''}
                    onChange={(v) => handleChange('payment_terms', v)}
                />
                <Field
                    label="Tax ID"
                    value={form.tax_id ?? ''}
                    onChange={(v) => handleChange('tax_id', v)}
                />
            </div>

            {/* Section 5 – Additional */}
            <SectionTitle>Additional Info</SectionTitle>
            <div>
                <label
                    style={{
                        display: 'block',
                        marginBottom: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#495057',
                    }}
                >
                    Notes
                </label>
                <textarea
                    value={form.notes ?? ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #ced4da',
                        fontSize: 14,
                        resize: 'vertical',
                    }}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: loading
                            ? '#adb5bd'
                            : 'linear-gradient(135deg, #0c5ccc 0%, #0a4fa8 100%)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: loading ? 'none' : '0 4px 12px rgba(12,92,204,0.35)',
                        minWidth: 140,
                    }}
                >
                    {loading ? 'Saving…' : 'Save Client'}
                </button>
            </div>
        </form>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3
            style={{
                marginTop: 8,
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                color: '#6b7280',
            }}
        >
            {children}
        </h3>
    );
}

function Field({
    label,
    value,
    onChange,
    type,
    required,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label
                style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#495057',
                }}
            >
                {label}
                {required && <span style={{ color: '#fa5252', marginLeft: 2 }}>*</span>}
            </label>
            <input
                type={type ?? 'text'}
                value={value}
                required={required}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #ced4da',
                    fontSize: 14,
                }}
            />
        </div>
    );
}

