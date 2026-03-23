import { useState, FormEvent } from 'react';
import { CreateSubmissionPayload, UpdateSubmissionPayload } from '../services/submissions.api';

interface SubmissionFormProps {
    mode: 'create' | 'edit';
    jobId?: number;
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
}

export default function SubmissionForm({ mode, jobId, initialData = {}, onSubmit, onCancel }: SubmissionFormProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        job_requirement_id: jobId?.toString() || initialData.job_requirement_id?.toString() || '',
        profile_submission_date: initialData.profile_submission_date
            ? initialData.profile_submission_date.split('T')[0]
            : new Date().toISOString().split('T')[0],
        candidate_name: initialData.candidate_name || '',
        candidate_email: initialData.candidate_email ?? '',
        candidate_phone: initialData.candidate_phone ?? '',
        candidate_title: initialData.candidate_title ?? '',
        candidate_notice_period: initialData.candidate_notice_period ?? '',
        candidate_current_location: initialData.candidate_current_location ?? '',
        candidate_location_applying_for: initialData.candidate_location_applying_for ?? '',
        candidate_total_experience: initialData.candidate_total_experience?.toString() ?? '',
        candidate_relevant_experience: initialData.candidate_relevant_experience?.toString() ?? '',
        candidate_skills: initialData.candidate_skills ?? '',
        vendor_email_id: initialData.vendor_email_id ?? '',
        vendor_quoted_rate: initialData.vendor_quoted_rate?.toString() ?? '',
        interview_screenshot_url: initialData.interview_screenshot_url ?? '',
        interview_platform: initialData.interview_platform ?? '',
        screenshot_duration_minutes: initialData.screenshot_duration_minutes?.toString() ?? '',
        candidate_visa_type: initialData.candidate_visa_type ?? '',
        candidate_engagement_type: initialData.candidate_engagement_type ?? '',
        candidate_ex_infosys_employee_id: initialData.candidate_ex_infosys_employee_id ?? '',
        submission_status: initialData.submission_status || 'Pending',
        client_feedback: initialData.client_feedback ?? '',
        daily_submission_id: initialData.daily_submission_id?.toString() ?? '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.job_requirement_id && mode === 'create') {
            setError('Job Requirement ID is required');
            return;
        }
        if (!formData.profile_submission_date) {
            setError('Profile Submission Date is required');
            return;
        }
        if (!formData.candidate_name.trim()) {
            setError('Candidate Name is required');
            return;
        }

        const parseNumber = (value: string): number | undefined => {
            const num = parseFloat(value);
            return isNaN(num) || value.trim() === '' ? undefined : num;
        };

        try {
            setSaving(true);

            const payload: any = {
                ...(mode === 'create' && { job_requirement_id: parseInt(formData.job_requirement_id) }),
                profile_submission_date: formData.profile_submission_date,
                candidate_name: formData.candidate_name,
                candidate_email: formData.candidate_email || undefined,
                candidate_phone: formData.candidate_phone || undefined,
                candidate_title: formData.candidate_title || undefined,
                candidate_notice_period: formData.candidate_notice_period || undefined,
                candidate_current_location: formData.candidate_current_location || undefined,
                candidate_location_applying_for: formData.candidate_location_applying_for || undefined,
                candidate_total_experience: parseNumber(formData.candidate_total_experience),
                candidate_relevant_experience: parseNumber(formData.candidate_relevant_experience),
                candidate_skills: formData.candidate_skills || undefined,
                vendor_email_id: formData.vendor_email_id || undefined,
                vendor_quoted_rate: parseNumber(formData.vendor_quoted_rate),
                interview_screenshot_url: formData.interview_screenshot_url || undefined,
                interview_platform: formData.interview_platform || undefined,
                screenshot_duration_minutes: parseNumber(formData.screenshot_duration_minutes),
                candidate_visa_type: formData.candidate_visa_type || undefined,
                candidate_engagement_type: formData.candidate_engagement_type || undefined,
                candidate_ex_infosys_employee_id: formData.candidate_ex_infosys_employee_id || undefined,
                submission_status: formData.submission_status,
                client_feedback: formData.client_feedback || undefined,
                daily_submission_id: parseNumber(formData.daily_submission_id),
            };

            await onSubmit(payload);
        } catch (err: any) {
            setError(err.message || 'Failed to save submission');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        background: '#1f2937',
        color: '#e5e7eb',
        border: '1px solid #374151',
        borderRadius: 6,
        fontSize: 14,
    };

    const labelStyle = {
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: '#9CA3AF',
        marginBottom: 4,
        textTransform: 'uppercase' as const,
    };

    const sectionStyle = {
        background: '#0f172a',
        border: '1px solid #1f2937',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
    };

    const sectionTitleStyle = {
        fontSize: 16,
        fontWeight: 600,
        color: '#e5e7eb',
        marginBottom: 16,
        borderBottom: '1px solid #1f2937',
        paddingBottom: 8,
    };

    const rowStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 16,
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div
                    style={{
                        background: '#7f1d1d',
                        color: '#fecaca',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 16,
                        fontSize: 14,
                    }}
                >
                    {error}
                </div>
            )}

            {/* Required Fields */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Required Information</h3>
                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>
                            Job Requirement ID <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="number"
                            name="job_requirement_id"
                            value={formData.job_requirement_id}
                            onChange={handleChange}
                            disabled={mode === 'edit' || !!jobId}
                            required
                            style={{
                                ...inputStyle,
                                ...((mode === 'edit' || !!jobId) && { background: '#0f172a', cursor: 'not-allowed' }),
                            }}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>
                            Profile Submission Date <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="date"
                            name="profile_submission_date"
                            value={formData.profile_submission_date}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: 0 }}>
                    <label style={labelStyle}>
                        Candidate Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        name="candidate_name"
                        value={formData.candidate_name}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                    />
                </div>
            </div>

            {/* Candidate Contact */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Candidate Contact</h3>
                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            name="candidate_email"
                            value={formData.candidate_email}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Phone</label>
                        <input
                            type="text"
                            name="candidate_phone"
                            value={formData.candidate_phone}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>Title</label>
                        <input
                            type="text"
                            name="candidate_title"
                            value={formData.candidate_title}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Notice Period</label>
                        <input
                            type="text"
                            name="candidate_notice_period"
                            value={formData.candidate_notice_period}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                </div>
            </div>

            {/* Location & Experience */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Location & Experience</h3>
                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>Current Location</label>
                        <input
                            type="text"
                            name="candidate_current_location"
                            value={formData.candidate_current_location}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Location Applying For</label>
                        <input
                            type="text"
                            name="candidate_location_applying_for"
                            value={formData.candidate_location_applying_for}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>Total Experience (Years)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="candidate_total_experience"
                            value={formData.candidate_total_experience}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Relevant Experience (Years)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="candidate_relevant_experience"
                            value={formData.candidate_relevant_experience}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: 0 }}>
                    <label style={labelStyle}>Skills (Comma-separated)</label>
                    <textarea
                        name="candidate_skills"
                        value={formData.candidate_skills}
                        onChange={handleChange}
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical' as const }}
                    />
                </div>
            </div>

            {/* Candidate Background */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Candidate Background</h3>
                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>Visa Type</label>
                        <input
                            type="text"
                            name="candidate_visa_type"
                            value={formData.candidate_visa_type}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Engagement Type</label>
                        <input
                            type="text"
                            name="candidate_engagement_type"
                            value={formData.candidate_engagement_type}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: 0 }}>
                    <label style={labelStyle}>Ex-Infosys Employee ID</label>
                    <input
                        type="text"
                        name="candidate_ex_infosys_employee_id"
                        value={formData.candidate_ex_infosys_employee_id}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                </div>
            </div>

            {/* Vendor & Interview */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Vendor & Interview Details</h3>
                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>Vendor Email</label>
                        <input
                            type="email"
                            name="vendor_email_id"
                            value={formData.vendor_email_id}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Vendor Quoted Rate</label>
                        <input
                            type="number"
                            step="0.01"
                            name="vendor_quoted_rate"
                            value={formData.vendor_quoted_rate}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>Interview Platform</label>
                        <input
                            type="text"
                            name="interview_platform"
                            value={formData.interview_platform}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Screenshot Duration (Minutes)</label>
                        <input
                            type="number"
                            name="screenshot_duration_minutes"
                            value={formData.screenshot_duration_minutes}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: 0 }}>
                    <label style={labelStyle}>Interview Screenshot URL</label>
                    <input
                        type="url"
                        name="interview_screenshot_url"
                        value={formData.interview_screenshot_url}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                </div>
            </div>

            {/* Submission Status & Feedback */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Submission Status & Feedback</h3>
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Submission Status</label>
                    <select name="submission_status" value={formData.submission_status} onChange={handleChange} style={inputStyle}>
                        <option value="Pending">Pending</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Screening">Screening</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Client Feedback</label>
                    <textarea
                        name="client_feedback"
                        value={formData.client_feedback}
                        onChange={handleChange}
                        rows={4}
                        style={{ ...inputStyle, resize: 'vertical' as const }}
                    />
                </div>
                <div style={{ marginBottom: 0 }}>
                    <label style={labelStyle}>Daily Submission ID</label>
                    <input
                        type="number"
                        name="daily_submission_id"
                        value={formData.daily_submission_id}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    style={{
                        padding: '10px 20px',
                        background: '#1f2937',
                        color: '#e5e7eb',
                        border: '1px solid #374151',
                        borderRadius: 8,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        fontWeight: 500,
                    }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        padding: '10px 20px',
                        background: saving ? '#374151' : '#1e3a8a',
                        color: '#e5e7eb',
                        border: 'none',
                        borderRadius: 8,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    {saving ? 'Saving...' : mode === 'create' ? 'Create Submission' : 'Update Submission'}
                </button>
            </div>
        </form>
    );
}
