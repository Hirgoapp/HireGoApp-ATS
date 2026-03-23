import { useState, FormEvent, useEffect } from 'react';
import { CreateJobPayload, UpdateJobPayload } from '../services/jobs.api';
import { fetchPocs, type ClientPoc } from '../../clients/services/clients.api';
import DynamicJdEditor from './DynamicJdEditor';

interface JobFormProps {
    mode: 'create' | 'edit';
    initialData?: any;
    clientId?: string;
    clientName?: string;
    onSubmit: (data: any, file?: File) => Promise<void>;
    onCancel: () => void;
}

export default function JobForm({
    mode,
    initialData = {},
    clientId,
    clientName,
    onSubmit,
    onCancel,
}: JobFormProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useDynamicJd, setUseDynamicJd] = useState(initialData.use_dynamic_jd || false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const deriveTitleFromText = (text?: string) => {
        if (!text) return '';
        const firstLine = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .find((line) => line.length > 0);
        if (!firstLine) return '';
        return firstLine.length > 80 ? firstLine.slice(0, 80) : firstLine;
    };

    const [pocs, setPocs] = useState<ClientPoc[]>([]);
    const [loadingPocs, setLoadingPocs] = useState(false);

    useEffect(() => {
        if (!clientId) {
            setPocs([]);
            return;
        }
        setLoadingPocs(true);
        fetchPocs(clientId)
            .then(setPocs)
            .catch(() => setPocs([]))
            .finally(() => setLoadingPocs(false));
    }, [clientId]);

    const [formData, setFormData] = useState({
        title: initialData.title || '',
        description: initialData.description || '',
        requirements: initialData.requirements || '',
        department: initialData.department || '',
        location: initialData.location || '',
        salary_min: initialData.salary_min?.toString() || '',
        salary_max: initialData.salary_max?.toString() || '',
        salary_currency: initialData.salary_currency || 'USD',
        employment_type: initialData.employment_type || 'Full-time',
        status: initialData.status || 'open',
        poc_id: initialData.poc_id || '',
        // Dynamic JD fields
        jd_content: initialData.jd_content || '',
        jd_format: initialData.jd_format || 'plain',
        use_dynamic_jd: initialData.use_dynamic_jd || false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        console.log('🟢 Form submit triggered!');
        console.log('📝 Form data:', formData);
        e.preventDefault();
        setError(null);

        const derivedTitle = formData.title.trim()
            || deriveTitleFromText(formData.jd_content)
            || deriveTitleFromText(formData.description)
            || deriveTitleFromText(formData.requirements)
            || 'Untitled Job';

        if (!formData.title.trim() && derivedTitle) {
            setFormData((prev) => ({ ...prev, title: derivedTitle }));
        }

        console.log('✅ All validations passed');

        const parseNumber = (value: string): number | undefined => {
            const num = parseFloat(value);
            return isNaN(num) || value.trim() === '' ? undefined : num;
        };

        try {
            setSaving(true);
            console.log('💾 Starting save process...');

            const payload: any = {
                title: derivedTitle,
                description: formData.description || undefined,
                requirements: formData.requirements || undefined,
                department: formData.department || undefined,
                location: formData.location || undefined,
                employment_type: formData.employment_type || undefined,
                status: formData.status || 'open',
                ...(clientId && { client_id: clientId }),
                ...(formData.poc_id && { poc_id: formData.poc_id }),
                // Include dynamic JD fields if enabled
                ...(formData.use_dynamic_jd && {
                    jd_content: formData.jd_content,
                    jd_format: formData.jd_format || 'plain',
                    use_dynamic_jd: true,
                }),
            };

            // Only add salary fields if they have valid values
            const salaryMin = parseNumber(formData.salary_min);
            const salaryMax = parseNumber(formData.salary_max);
            if (salaryMin !== undefined) payload.salary_min = salaryMin;
            if (salaryMax !== undefined) payload.salary_max = salaryMax;

            console.log('📦 Payload to send:', payload);
            await onSubmit(payload, uploadedFile || undefined);
            console.log('✅ Job saved successfully!');
        } catch (err: any) {
            console.error('❌ Save failed:', err);
            console.error('Error details:', err.response?.data || err.message);
            setError(err.message || 'Failed to save job');
        } finally {
            setSaving(false);
            console.log('🔄 Save process completed');
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        background: '#f8f9fa',
        color: '#212529',
        border: '1.5px solid #e9ecef',
        borderRadius: 6,
        fontSize: 13,
        transition: 'all 0.3s ease',
        outline: 'none',
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = '#0c5ccc';
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(12, 92, 204, 0.1)';
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = '#e9ecef';
        e.currentTarget.style.background = '#f8f9fa';
        e.currentTarget.style.boxShadow = 'none';
    };

    const labelStyle = {
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: '#6c757d',
        marginBottom: 6,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    };

    const sectionStyle = {
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    };

    const sectionTitleStyle = {
        fontSize: 15,
        fontWeight: 700,
        color: '#212529',
        marginBottom: 16,
        borderBottom: '2px solid #e9ecef',
        paddingBottom: 12,
    };

    const rowStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
        marginBottom: 20,
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div
                    style={{
                        background: '#ffe0e0',
                        color: '#c92a2a',
                        padding: 14,
                        borderRadius: 8,
                        marginBottom: 20,
                        fontSize: 13,
                        border: '1.5px solid #ff8787',
                        fontWeight: 500,
                    }}
                >
                    ⚠️ {error}
                </div>
            )}

            {clientId && (
                <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>Client & Point of Contact</h3>
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Client</label>
                        <div
                            style={{
                                ...inputStyle,
                                background: '#f1f3f5',
                                color: '#495057',
                            }}
                        >
                            {clientName ?? 'Loading...'}
                        </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Point of Contact (optional)</label>
                        <select
                            name="poc_id"
                            value={formData.poc_id}
                            onChange={handleChange}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                        >
                            <option value="">— None —</option>
                            {loadingPocs
                                ? (
                                    <option value="" disabled>Loading contacts...</option>
                                )
                                : pocs.map((poc) => (
                                    <option key={poc.id} value={poc.id}>
                                        {poc.name}
                                        {poc.designation ? ` — ${poc.designation}` : ''}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Required Fields */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Job Information</h3>
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>
                        Job Title <span style={{ color: '#c92a2a' }}>*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Senior Software Engineer"
                        style={inputStyle}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                    />
                </div>

                {/* Dynamic JD Toggle */}
                <div style={{ marginBottom: 20, padding: '12px', background: '#e7f5ff', borderRadius: 8, border: '2px solid #339af0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 14, color: '#212529' }}>
                        <input
                            type="checkbox"
                            checked={useDynamicJd}
                            onChange={(e) => {
                                setUseDynamicJd(e.target.checked);
                                setFormData(prev => ({ ...prev, use_dynamic_jd: e.target.checked }));
                            }}
                            style={{ marginRight: 8, width: 18, height: 18, cursor: 'pointer' }}
                        />
                        <strong>Use Dynamic JD System</strong>
                        <span style={{ marginLeft: 8, color: '#495057', fontWeight: 'normal' }}>
                            (Paste complete JD or upload file - supports any format)
                        </span>
                    </label>
                </div>

                {useDynamicJd ? (
                    <DynamicJdEditor
                        value={formData.jd_content}
                        format={formData.jd_format as 'plain' | 'markdown' | 'html'}
                        onContentChange={(content, format) => {
                            setFormData(prev => {
                                const autoTitle = !prev.title.trim() ? deriveTitleFromText(content) : '';
                                return {
                                    ...prev,
                                    jd_content: content,
                                    jd_format: format,
                                    use_dynamic_jd: true,
                                    ...(autoTitle ? { title: autoTitle } : {}),
                                };
                            });
                        }}
                        onFileUpload={async (file) => {
                            console.log('📁 File selected:', file.name, file.size, file.type);

                            // Validate file size (5MB)
                            if (file.size > 5 * 1024 * 1024) {
                                alert('File size exceeds 5MB limit');
                                return;
                            }

                            // Validate file type
                            const allowedTypes = [
                                'application/pdf',
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                'application/msword',
                                'text/plain',
                                'message/rfc822', // .eml
                                'application/vnd.ms-outlook', // .msg
                            ];

                            if (!allowedTypes.includes(file.type) && !['pdf', 'docx', 'doc', 'txt', 'eml', 'msg'].some(ext => file.name.toLowerCase().endsWith(ext))) {
                                alert('Invalid file format. Supported: PDF, DOCX, DOC, TXT, EML, MSG');
                                return;
                            }

                            setUploadedFile(file);
                            alert(`✅ File "${file.name}" will be uploaded with the job creation.`);
                        }}
                    />
                ) : (
                    <>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Full job description..."
                                style={{ ...inputStyle, resize: 'vertical' as const }}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                            />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Requirements</label>
                            <textarea
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Key requirements and qualifications..."
                                style={{ ...inputStyle, resize: 'vertical' as const }}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                            />
                        </div>
                    </>
                )}

                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>Department</label>
                        <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            placeholder="e.g. Engineering"
                            style={inputStyle}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. San Francisco, CA"
                            style={inputStyle}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                        />
                    </div>
                </div>
            </div>

            {/* Compensation */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Compensation</h3>
                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>Minimum Salary</label>
                        <input
                            type="number"
                            name="salary_min"
                            value={formData.salary_min}
                            onChange={handleChange}
                            placeholder="80000"
                            style={inputStyle}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Maximum Salary</label>
                        <input
                            type="number"
                            name="salary_max"
                            value={formData.salary_max}
                            onChange={handleChange}
                            placeholder="120000"
                            style={inputStyle}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                        />
                    </div>
                </div>
                <div style={rowStyle}>
                    <div>
                        <label style={labelStyle}>Currency</label>
                        <select
                            name="salary_currency"
                            value={formData.salary_currency}
                            onChange={handleChange}
                            style={inputStyle}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="INR">INR</option>
                            <option value="CAD">CAD</option>
                            <option value="AUD">AUD</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Employment Type</label>
                        <select
                            name="employment_type"
                            value={formData.employment_type}
                            onChange={handleChange}
                            style={inputStyle}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                        >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Temporary">Temporary</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Status */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Job Status</h3>
                <div style={{ marginBottom: 0 }}>
                    <label style={labelStyle}>Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        style={inputStyle}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                    >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    style={{
                        padding: '10px 20px',
                        background: '#f8f9fa',
                        color: '#6c757d',
                        border: '1.5px solid #e9ecef',
                        borderRadius: 6,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        opacity: saving ? 0.6 : 1,
                    }}
                    onMouseOver={(e) => !saving && (e.currentTarget.style.borderColor = '#dee2e6', e.currentTarget.style.background = '#ffffff')}
                    onMouseOut={(e) => !saving && (e.currentTarget.style.borderColor = '#e9ecef', e.currentTarget.style.background = '#f8f9fa')}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        padding: '10px 24px',
                        background: saving ? '#adb5bd' : '#0c5ccc',
                        color: 'white',
                        border: '1.5px solid ' + (saving ? '#adb5bd' : '#0c5ccc'),
                        borderRadius: 6,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                    }}
                    onMouseOver={(e) => !saving && (e.currentTarget.style.background = '#0a4fa8')}
                    onMouseOut={(e) => !saving && (e.currentTarget.style.background = '#0c5ccc')}
                >
                    {saving ? 'Saving...' : mode === 'create' ? 'Create Job' : 'Update Job'}
                </button>
            </div>
        </form>
    );
}
