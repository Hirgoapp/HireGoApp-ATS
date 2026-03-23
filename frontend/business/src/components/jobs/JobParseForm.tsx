import React, { useState } from 'react';

interface ExtractedData {
    [key: string]: any;
}

interface ParseResult {
    success: boolean;
    data: ExtractedData;
    confidence: number;
    provider: string;
    message?: string;
}

interface JobParseFormProps {
    onJobCreated?: (jobData: any) => void;
    onClose?: () => void;
}

const JobParseForm: React.FC<JobParseFormProps> = ({ onJobCreated, onClose }) => {
    const [step, setStep] = useState<'paste' | 'review' | 'edit'>('paste');
    const [pastedContent, setPastedContent] = useState('');
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editedData, setEditedData] = useState<ExtractedData>({});
    const [savingJob, setSavingJob] = useState(false);
    const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

    const handlePaste = async () => {
        if (!pastedContent.trim()) {
            setError('Please paste content');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('accessToken');
            console.log('🔍 Token from localStorage:', token ? `✅ Present (${token.substring(0, 20)}...)` : '❌ NULL/MISSING');
            console.log('📦 All localStorage keys:', Object.keys(localStorage));

            if (!token) {
                setError('❌ No auth token found. Please login first.');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/v1/jobs/parse-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: pastedContent }),
            });

            console.log('📡 API Response Status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Failed to parse content';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const result: ParseResult = await response.json();
            setParseResult(result);
            setEditedData(result.data);
            setStep('review');
        } catch (err: any) {
            setError(err.message || 'Failed to parse content. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const toggleFieldExpand = (field: string) => {
        const newSet = new Set(expandedFields);
        if (newSet.has(field)) {
            newSet.delete(field);
        } else {
            newSet.add(field);
        }
        setExpandedFields(newSet);
    };

    const handleEditField = (key: string, value: any) => {
        setEditedData({
            ...editedData,
            [key]: value,
        });
    };

    const handleSaveJob = async () => {
        setSavingJob(true);
        setError('');

        try {
            const jobPayload = {
                title: editedData.title || editedData.ecmsReqId || 'Job Posting',
                description: editedData.parsed_content_raw || pastedContent,
                client_req_id: editedData.ecmsReqId || editedData.client_req_id,
                client_code: editedData.clientCode || editedData.client_code,
                requirements: editedData.mandatorySkills || '',
                location: editedData.location || editedData.work_locations?.[0],
                vendor_rate_value: editedData.vendorRateValue || editedData.vendor_rate_value,
                vendor_rate_currency: editedData.vendorRateCurrency || editedData.vendor_rate_currency || 'INR',
                vendor_rate_unit: editedData.vendorRateUnit || editedData.vendor_rate_unit || 'day',
                vendor_rate_text: editedData.vendorRate || editedData.vendor_rate_text,
                pu_unit: editedData.jdMetadata?.pu || editedData.pu_unit,
                jd_content: pastedContent,
                jd_format: 'plain',
                use_dynamic_jd: true,
                parsed_content_raw: pastedContent,
                extraction_confidence: parseResult?.confidence || 0,
                extraction_provider: parseResult?.provider || 'manual',
                extraction_timestamp: new Date().toISOString(),
            };

            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/v1/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(jobPayload),
            });

            if (!response.ok) {
                throw new Error('Failed to create job');
            }

            const createdJob = await response.json();
            onJobCreated?.(createdJob);
            alert('✅ Job created successfully!');
            setStep('paste');
            setPastedContent('');
            setParseResult(null);
            setEditedData({});
        } catch (err: any) {
            setError(err.message || 'Failed to create job');
        } finally {
            setSavingJob(false);
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return { bg: '#d1fae5', border: '#10b981', color: '#047857' };
        if (confidence >= 0.5) return { bg: '#fef3c7', border: '#f59e0b', color: '#d97706' };
        return { bg: '#fee2e2', border: '#ef4444', color: '#dc2626' };
    };

    const getConfidenceLabel = (confidence: number) => {
        if (confidence >= 0.8) return 'High Confidence';
        if (confidence >= 0.5) return 'Medium Confidence';
        return 'Low Confidence';
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #f9f5ff 100%)',
            padding: '24px',
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '8px' }}>
                                🤖 Smart Job Parser
                            </h1>
                            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
                                Paste → Extract → Review → Save
                            </p>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af' }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Step Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px' }}>
                        {(['paste', 'review', 'edit'] as const).map((s, idx) => (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        fontSize: '16px',
                                        background:
                                            step === s
                                                ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                                                : step > s || (s === 'edit' && step === 'review')
                                                    ? '#10b981'
                                                    : '#e5e7eb',
                                        color: step === s || step > s ? 'white' : '#6b7280',
                                        transform: step === s ? 'scale(1.1)' : 'scale(1)',
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {step > s || (s === 'edit' && step === 'review') ? '✓' : idx + 1}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151', textTransform: 'capitalize' }}>
                                    {s}
                                </span>
                                {idx < 2 && (
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '2px',
                                            backgroundColor: '#e5e7eb',
                                            margin: '0 12px',
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{ padding: '16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '24px', color: '#991b1b' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Step 1: Paste Content */}
                {step === 'paste' && (
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '16px', margin: 0 }}>
                            Step 1: Paste Job Content
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px', margin: 0 }}>
                            Copy-paste your job requirement email, document, or any content. Our AI will intelligently extract and structure it.
                        </p>

                        <textarea
                            value={pastedContent}
                            onChange={(e) => setPastedContent(e.target.value)}
                            placeholder="Paste your job requirement, email, or document here..."
                            style={{
                                width: '100%',
                                height: '300px',
                                padding: '16px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontFamily: 'monospace',
                                resize: 'none',
                                boxSizing: 'border-box',
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6', e.currentTarget.style.outline = 'none')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                        />

                        <button
                            onClick={handlePaste}
                            disabled={loading || !pastedContent.trim()}
                            style={{
                                marginTop: '24px',
                                width: '100%',
                                padding: '16px',
                                background: loading || !pastedContent.trim() ? '#d1d5db' : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: loading || !pastedContent.trim() ? 'not-allowed' : 'pointer',
                                opacity: loading || !pastedContent.trim() ? 0.6 : 1,
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {loading ? '⏳ Parsing with AI...' : '🚀 Extract & Analyze'}
                        </button>
                    </div>
                )}

                {/* Step 2: Review Results */}
                {step === 'review' && parseResult && (
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
                                Step 2: Review Extracted Data
                            </h2>
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '24px',
                                border: `2px solid ${getConfidenceColor(parseResult.confidence).border}`,
                                backgroundColor: getConfidenceColor(parseResult.confidence).bg,
                                color: getConfidenceColor(parseResult.confidence).color,
                                fontSize: '13px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                            }}>
                                ✓ {getConfidenceLabel(parseResult.confidence)} ({(parseResult.confidence * 100).toFixed(0)}%) via {parseResult.provider}
                            </div>
                        </div>

                        <div style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '24px' }}>
                            {Object.entries(parseResult?.data || {})
                                .filter(([, value]) => value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0))
                                .map(([key, value]) => (
                                    <div key={key} style={{ padding: '16px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', margin: 0 }}>
                                                    {key.replace(/_/g, ' ')}
                                                </p>
                                                <p style={{ color: '#111827', marginTop: '8px', marginBottom: 0, fontSize: '14px' }}>
                                                    {Array.isArray(value) ? value.join(', ') : String(value).substring(0, 200)}
                                                </p>
                                            </div>
                                            <span style={{ marginLeft: '16px', color: '#10b981', fontSize: '18px' }}>✓</span>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setStep('edit')}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)')}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
                            >
                                ✏️ Edit & Continue
                            </button>
                            <button
                                onClick={() => setStep('paste')}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    background: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Edit Fields */}
                {step === 'edit' && parseResult && (
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '24px', margin: 0 }}>
                            Step 3: Edit & Finalize
                        </h2>

                        <div style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '24px' }}>
                            {Object.entries(editedData).map(([key, value]) => {
                                if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
                                    return null;
                                }

                                const isExpanded = expandedFields.has(key);
                                return (
                                    <div key={key} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                                        <button
                                            onClick={() => toggleFieldExpand(key)}
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                backgroundColor: '#f9fafb',
                                                border: 'none',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                            }}
                                        >
                                            <div style={{ textAlign: 'left' }}>
                                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', margin: 0 }}>
                                                    {key.replace(/_/g, ' ')}
                                                </p>
                                                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', margin: 0 }}>
                                                    {Array.isArray(value) ? value.join(', ').substring(0, 60) : String(value).substring(0, 60)}
                                                </p>
                                            </div>
                                            <span style={{ fontSize: '18px', marginLeft: '16px' }}>{isExpanded ? '▲' : '▼'}</span>
                                        </button>

                                        {isExpanded && (
                                            <div style={{ padding: '16px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
                                                {Array.isArray(value) ? (
                                                    <input
                                                        type="text"
                                                        value={value.join(', ')}
                                                        onChange={(e) =>
                                                            handleEditField(key, e.target.value.split(',').map((v) => v.trim()))
                                                        }
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px',
                                                            border: '1px solid #d1d5db',
                                                            borderRadius: '6px',
                                                            fontSize: '14px',
                                                            boxSizing: 'border-box',
                                                        }}
                                                    />
                                                ) : (
                                                    <textarea
                                                        value={String(value)}
                                                        onChange={(e) => handleEditField(key, e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px',
                                                            border: '1px solid #d1d5db',
                                                            borderRadius: '6px',
                                                            fontSize: '14px',
                                                            minHeight: '100px',
                                                            resize: 'vertical',
                                                            boxSizing: 'border-box',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleSaveJob}
                                disabled={savingJob}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    background: savingJob ? '#d1d5db' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    cursor: savingJob ? 'not-allowed' : 'pointer',
                                    opacity: savingJob ? 0.6 : 1,
                                }}
                            >
                                {savingJob ? '⏳ Creating Job...' : '✅ Create Job'}
                            </button>
                            <button
                                onClick={() => setStep('review')}
                                disabled={savingJob}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    background: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    opacity: savingJob ? 0.5 : 1,
                                }}
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobParseForm;
