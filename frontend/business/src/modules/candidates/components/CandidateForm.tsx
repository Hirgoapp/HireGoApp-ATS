import { useState, type CSSProperties } from 'react';
import type { CreateCandidatePayload } from '../services/candidates.api';

interface CandidateFormProps {
    initial?: Partial<CreateCandidatePayload>;
    onSubmit: (data: CreateCandidatePayload) => Promise<void>;
    loading?: boolean;
}

export default function CandidateForm({ initial, onSubmit, loading }: CandidateFormProps) {
    const [form, setForm] = useState<CreateCandidatePayload>({
        candidate_name: initial?.candidate_name ?? '',
        email: initial?.email ?? '',
        phone: initial?.phone ?? '',
        gender: initial?.gender ?? '',
        dob: initial?.dob ?? '',
        marital_status: initial?.marital_status ?? '',
        current_company: initial?.current_company ?? '',
        total_experience: initial?.total_experience,
        relevant_experience: initial?.relevant_experience,
        current_ctc: initial?.current_ctc,
        expected_ctc: initial?.expected_ctc,
        currency_code: initial?.currency_code ?? '',
        notice_period: initial?.notice_period ?? '',
        willing_to_relocate: initial?.willing_to_relocate ?? false,
        buyout: initial?.buyout ?? false,
        reason_for_job_change: initial?.reason_for_job_change ?? '',
        skill_set: initial?.skill_set ?? '',
        current_location_id: initial?.current_location_id ?? '',
        location_preference: initial?.location_preference ?? '',
        candidate_status: initial?.candidate_status ?? 'Active',
        source_id: initial?.source_id ?? '',
        last_contacted_date: initial?.last_contacted_date ?? '',
        last_submission_date: initial?.last_submission_date ?? '',
        notes: initial?.notes ?? '',
        extra_fields: initial?.extra_fields ?? {},
        aadhar_number: initial?.aadhar_number ?? '',
        uan_number: initial?.uan_number ?? '',
        linkedin_url: initial?.linkedin_url ?? '',
        manager_screening_status: initial?.manager_screening_status ?? '',
        client_name: initial?.client_name ?? '',
        highest_qualification: initial?.highest_qualification ?? '',
        submission_date: initial?.submission_date ?? '',
        job_location: initial?.job_location ?? '',
        source: initial?.source ?? '',
        client: initial?.client ?? '',
        recruiter_id: initial?.recruiter_id ?? '',
        date_of_entry: initial?.date_of_entry ?? '',
        manager_screening: initial?.manager_screening ?? '',
        resume_parser_used: initial?.resume_parser_used ?? '',
        extraction_confidence: initial?.extraction_confidence,
        extraction_date: initial?.extraction_date ?? '',
        resume_source_type: initial?.resume_source_type ?? '',
        is_suspicious: initial?.is_suspicious ?? false,
        cv_portal_id: initial?.cv_portal_id ?? '',
        import_batch_id: initial?.import_batch_id ?? '',
    });

    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: keyof CreateCandidatePayload, value: string | boolean | Record<string, any> | undefined) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleNumberChange = (field: keyof CreateCandidatePayload, value: string) => {
        if (value === '') {
            setForm((prev) => ({ ...prev, [field]: undefined }));
            return;
        }
        const num = Number(value);
        if (!Number.isNaN(num)) setForm((prev) => ({ ...prev, [field]: num }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await onSubmit(form);
        } catch (err: any) {
            const message = err?.response?.data?.message || err.message || 'Failed to save candidate';
            setError(message);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            {error ? (
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
            ) : null}

            <SectionTitle>Primary Information</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16 }}>
                <Field label="Full Name" required value={form.candidate_name} onChange={(v) => handleChange('candidate_name', v)} />
                <Field label="Status" value={form.candidate_status ?? 'Active'} onChange={(v) => handleChange('candidate_status', v)} options={['Active', 'On Hold', 'Inactive']} />
                <Field label="Current Company" value={form.current_company ?? ''} onChange={(v) => handleChange('current_company', v)} />
            </div>

            <SectionTitle>Contact</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                <Field label="Email" required type="email" value={form.email} onChange={(v) => handleChange('email', v)} />
                <Field label="Phone" required value={form.phone} onChange={(v) => handleChange('phone', v)} />
                <Field label="LinkedIn URL" value={form.linkedin_url ?? ''} onChange={(v) => handleChange('linkedin_url', v)} />
                <Field label="Job Location" value={form.job_location ?? ''} onChange={(v) => handleChange('job_location', v)} />
            </div>

            <SectionTitle>Professional Profile</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                <Field label="Total Experience (years)" value={form.total_experience?.toString() ?? ''} onChange={(v) => handleNumberChange('total_experience', v)} />
                <Field label="Relevant Experience (years)" value={form.relevant_experience?.toString() ?? ''} onChange={(v) => handleNumberChange('relevant_experience', v)} />
                <Field label="Current CTC" value={form.current_ctc?.toString() ?? ''} onChange={(v) => handleNumberChange('current_ctc', v)} />
                <Field label="Expected CTC" value={form.expected_ctc?.toString() ?? ''} onChange={(v) => handleNumberChange('expected_ctc', v)} />
                <Field label="Currency Code" value={form.currency_code ?? ''} onChange={(v) => handleChange('currency_code', v)} />
                <Field label="Notice Period" value={form.notice_period ?? ''} onChange={(v) => handleChange('notice_period', v)} />
                <Field label="Willing to Relocate" value={form.willing_to_relocate ? 'Yes' : 'No'} onChange={(v) => handleChange('willing_to_relocate', v === 'Yes')} options={['Yes', 'No']} />
                <Field label="Buyout" value={form.buyout ? 'Yes' : 'No'} onChange={(v) => handleChange('buyout', v === 'Yes')} options={['Yes', 'No']} />
                <Field label="Highest Qualification" value={form.highest_qualification ?? ''} onChange={(v) => handleChange('highest_qualification', v)} />
                <Field label="Location Preference" value={form.location_preference ?? ''} onChange={(v) => handleChange('location_preference', v)} />
                <Field label="Client Name" value={form.client_name ?? ''} onChange={(v) => handleChange('client_name', v)} />
                <Field label="Reason for Job Change" value={form.reason_for_job_change ?? ''} onChange={(v) => handleChange('reason_for_job_change', v)} />
            </div>

            <SectionTitle>Tracking & Compliance</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                <Field label="Source" value={form.source ?? ''} onChange={(v) => handleChange('source', v)} />
                <Field label="Source ID" value={form.source_id ?? ''} onChange={(v) => handleChange('source_id', v)} />
                <Field label="Recruiter ID" value={form.recruiter_id ?? ''} onChange={(v) => handleChange('recruiter_id', v)} />
                <Field label="Client" value={form.client ?? ''} onChange={(v) => handleChange('client', v)} />
                <Field label="Last Contacted Date" type="date" value={form.last_contacted_date ?? ''} onChange={(v) => handleChange('last_contacted_date', v)} />
                <Field label="Last Submission Date" type="date" value={form.last_submission_date ?? ''} onChange={(v) => handleChange('last_submission_date', v)} />
                <Field label="Submission Date" type="date" value={form.submission_date ?? ''} onChange={(v) => handleChange('submission_date', v)} />
                <Field label="Date of Entry" type="date" value={form.date_of_entry ?? ''} onChange={(v) => handleChange('date_of_entry', v)} />
                <Field label="Aadhar Number" value={form.aadhar_number ?? ''} onChange={(v) => handleChange('aadhar_number', v)} />
                <Field label="UAN Number" value={form.uan_number ?? ''} onChange={(v) => handleChange('uan_number', v)} />
                <Field label="Current Location ID" value={form.current_location_id ?? ''} onChange={(v) => handleChange('current_location_id', v)} />
                <Field label="Marital Status" value={form.marital_status ?? ''} onChange={(v) => handleChange('marital_status', v)} />
                <Field label="Gender" value={form.gender ?? ''} onChange={(v) => handleChange('gender', v)} />
                <Field label="Date of Birth" type="date" value={form.dob ?? ''} onChange={(v) => handleChange('dob', v)} />
            </div>

            <SectionTitle>Parser & Import Metadata</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                <Field label="Manager Screening" value={form.manager_screening ?? ''} onChange={(v) => handleChange('manager_screening', v)} />
                <Field label="Manager Screening Status" value={form.manager_screening_status ?? ''} onChange={(v) => handleChange('manager_screening_status', v)} />
                <Field label="Resume Parser Used" value={form.resume_parser_used ?? ''} onChange={(v) => handleChange('resume_parser_used', v)} />
                <Field label="Extraction Confidence" value={form.extraction_confidence?.toString() ?? ''} onChange={(v) => handleNumberChange('extraction_confidence', v)} />
                <Field label="Extraction Date" type="date" value={form.extraction_date ?? ''} onChange={(v) => handleChange('extraction_date', v)} />
                <Field label="Resume Source Type" value={form.resume_source_type ?? ''} onChange={(v) => handleChange('resume_source_type', v)} />
                <Field label="Is Suspicious" value={form.is_suspicious ? 'Yes' : 'No'} onChange={(v) => handleChange('is_suspicious', v === 'Yes')} options={['Yes', 'No']} />
                <Field label="CV Portal ID" value={form.cv_portal_id ?? ''} onChange={(v) => handleChange('cv_portal_id', v)} />
                <Field label="Import Batch ID" value={form.import_batch_id ?? ''} onChange={(v) => handleChange('import_batch_id', v)} />
            </div>

            <SectionTitle>Skills & Notes</SectionTitle>
            <div>
                <label style={labelStyle}>Skills</label>
                <textarea
                    value={form.skill_set ?? ''}
                    onChange={(e) => handleChange('skill_set', e.target.value)}
                    placeholder="Java, Spring Boot, SQL, Microservices"
                    rows={3}
                    style={textareaStyle}
                />
            </div>

            <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                    value={form.notes ?? ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Internal notes, sourcing context, interview insights..."
                    rows={3}
                    style={textareaStyle}
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
                        background: loading ? '#adb5bd' : 'linear-gradient(135deg, #0c5ccc 0%, #0a4fa8 100%)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: loading ? 'none' : '0 4px 12px rgba(12,92,204,0.35)',
                        minWidth: 140,
                    }}
                >
                    {loading ? 'Saving…' : 'Save Candidate'}
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
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    options?: string[];
}) {
    return (
        <div>
            <label style={labelStyle}>
                {label}
                {required ? <span style={{ color: '#fa5252', marginLeft: 2 }}>*</span> : null}
            </label>
            {options ? (
                <select value={value} required={required} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type ?? 'text'}
                    value={value}
                    required={required}
                    onChange={(e) => onChange(e.target.value)}
                    style={inputStyle}
                />
            )}
        </div>
    );
}

const labelStyle: CSSProperties = {
    display: 'block',
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#495057',
};

const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #ced4da',
    fontSize: 14,
};

const textareaStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #ced4da',
    fontSize: 14,
    resize: 'vertical',
};
