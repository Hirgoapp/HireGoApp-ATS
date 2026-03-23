import { useState, useEffect } from 'react';
import type { ClientPoc, CreatePocPayload } from '../services/clients.api';

interface PocFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: CreatePocPayload) => Promise<void>;
    initial?: ClientPoc | null;
    loading?: boolean;
}

const emptyPayload: CreatePocPayload = {
    name: '',
    designation: '',
    email: '',
    phone: '',
    linkedin: '',
    notes: '',
    status: 'Active',
};

export default function PocFormModal({
    open,
    onClose,
    onSubmit,
    initial,
    loading = false,
}: PocFormModalProps) {
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Active');
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isEdit = !!initial?.id;

    useEffect(() => {
        if (open) {
            setSubmitError(null);
            if (initial) {
                setName(initial.name);
                setDesignation(initial.designation ?? '');
                setEmail(initial.email ?? '');
                setPhone(initial.phone ?? '');
                setLinkedin(initial.linkedin ?? '');
                setNotes(initial.notes ?? '');
                setStatus(initial.status ?? 'Active');
            } else {
                setName(emptyPayload.name);
                setDesignation(emptyPayload.designation ?? '');
                setEmail(emptyPayload.email ?? '');
                setPhone(emptyPayload.phone ?? '');
                setLinkedin(emptyPayload.linkedin ?? '');
                setNotes(emptyPayload.notes ?? '');
                setStatus(emptyPayload.status ?? 'Active');
            }
        }
    }, [open, initial]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        const payload: CreatePocPayload = {
            name: name.trim(),
            designation: designation.trim() || undefined,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            linkedin: linkedin.trim() || undefined,
            notes: notes.trim() || undefined,
            status: status || 'Active',
        };
        if (!payload.name) {
            setSubmitError('Name is required.');
            return;
        }
        try {
            await onSubmit(payload);
            onClose();
        } catch (err: any) {
            setSubmitError(err?.response?.data?.message || err.message || 'Failed to save POC');
        }
    };

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="poc-modal-title"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.4)',
                padding: 16,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: 12,
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    maxWidth: 440,
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ padding: 20, borderBottom: '1px solid #e5e7eb' }}>
                    <h2 id="poc-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                        {isEdit ? 'Edit Point of Contact' : 'Add Point of Contact'}
                    </h2>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: 20 }}>
                    {submitError && (
                        <div
                            style={{
                                marginBottom: 12,
                                padding: 10,
                                borderRadius: 8,
                                background: '#fef2f2',
                                color: '#b91c1c',
                                fontSize: 13,
                            }}
                        >
                            {submitError}
                        </div>
                    )}
                    <div style={{ display: 'grid', gap: 12 }}>
                        <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                                Name <span style={{ color: '#dc2626' }}>*</span>
                            </span>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full name"
                                maxLength={255}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    boxSizing: 'border-box',
                                }}
                            />
                        </label>
                        <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Designation</span>
                            <input
                                type="text"
                                value={designation}
                                onChange={(e) => setDesignation(e.target.value)}
                                placeholder="Job title"
                                maxLength={255}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    boxSizing: 'border-box',
                                }}
                            />
                        </label>
                        <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    boxSizing: 'border-box',
                                }}
                            />
                        </label>
                        <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Phone</span>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1-555-0123"
                                maxLength={50}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    boxSizing: 'border-box',
                                }}
                            />
                        </label>
                        <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>LinkedIn</span>
                            <input
                                type="url"
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                                placeholder="https://linkedin.com/in/..."
                                maxLength={500}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    boxSizing: 'border-box',
                                }}
                            />
                        </label>
                        <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Status</span>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    boxSizing: 'border-box',
                                    background: 'white',
                                }}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </label>
                        <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notes</span>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Optional notes"
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    boxSizing: 'border-box',
                                    resize: 'vertical',
                                }}
                            />
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                        <button type="button" onClick={onClose} className="ghost-button">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="primary-button">
                            {loading ? 'Saving...' : isEdit ? 'Update' : 'Add POC'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
