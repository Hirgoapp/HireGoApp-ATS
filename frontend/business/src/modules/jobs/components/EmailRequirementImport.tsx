import { useState, useMemo } from 'react';
import { parseEmailPreview, confirmImportRequirement, EmailImportPreviewResponseDto, ConfirmImportRequirementDto } from '../services/requirements.api';
import { useNavigate } from 'react-router-dom';

export default function EmailRequirementImport() {
    const navigate = useNavigate();
    const [rawEmail, setRawEmail] = useState('');
    const [preview, setPreview] = useState<EmailImportPreviewResponseDto | null>(null);
    const [editedFields, setEditedFields] = useState<Record<string, any>>({});
    const [editedInstructions, setEditedInstructions] = useState<NonNullable<ConfirmImportRequirementDto['editedInstructions']>>([]);
    const [editedTracker, setEditedTracker] = useState<ConfirmImportRequirementDto['editedCandidateTracker']>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canConfirm = useMemo(() => !!preview && !isLoading, [preview, isLoading]);

    function extractSubjectFromEmail(text: string): string | undefined {
        // Attempt to extract a subject-like first line if present, else undefined
        const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0);
        return firstLine && /\d{5,}\s*-/.test(firstLine) ? firstLine.trim() : undefined;
    }

    async function handleParsePreview() {
        setError(null);
        setIsLoading(true);
        setPreview(null);
        try {
            const subject = extractSubjectFromEmail(rawEmail);
            const res = await parseEmailPreview({ rawEmailContent: rawEmail, emailSubject: subject });
            setPreview(res);
            // Initialize edits from extracted fields
            setEditedFields(res.extractedFields || {});
            setEditedInstructions(res.instructions?.map((i) => ({
                type: i.type,
                title: i.title,
                content: i.content,
                highlight_level: i.highlight_level,
                is_mandatory: i.is_mandatory,
            })) || []);
            setEditedTracker(res.candidateTracker ? {
                required_fields: res.candidateTracker.required_fields,
                field_order: res.candidateTracker.field_order,
                validation_rules: res.candidateTracker.validation_rules,
                template_content: res.candidateTracker.template_content,
            } : null);
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to parse email');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleConfirm() {
        if (!preview) return;
        setIsLoading(true);
        setError(null);
        try {
            const payload: ConfirmImportRequirementDto = {
                rawEmailContent: rawEmail,
                editedFields,
                editedInstructions,
                editedCandidateTracker: editedTracker,
            };
            const res = await confirmImportRequirement(payload);
            navigate(`/app/requirements/${res.jobId}`);
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to create requirement');
        } finally {
            setIsLoading(false);
        }
    }

    function handleFieldEdit(key: string, value: any) {
        setEditedFields((prev) => ({ ...prev, [key]: value }));
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: 0 }}>Create Requirement from Email</h2>
            <p style={{ color: '#6B7280', marginTop: 0 }}>Paste the complete email below. Preview is mandatory; nothing is saved until you confirm.</p>

            {/* Paste Area */}
            <div>
                <textarea
                    value={rawEmail}
                    onChange={(e) => setRawEmail(e.target.value)}
                    placeholder="Paste full email here..."
                    rows={12}
                    style={{ width: '100%', fontFamily: 'monospace', padding: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
                />
                <div style={{ marginTop: 8 }}>
                    <button onClick={handleParsePreview} disabled={isLoading || !rawEmail.trim()}>Parse & Preview</button>
                </div>
            </div>

            {error && (
                <div style={{ color: '#b91c1c', background: '#fee2e2', padding: 12, borderRadius: 6 }}>{error}</div>
            )}

            {/* Preview Panel */}
            {preview && (
                <div className="preview-container" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* Raw Email - must always be visible */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ marginTop: 0 }}>Raw Email (Source of Truth)</h3>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 500, overflow: 'auto' }}>
                            {preview.rawEmailContent}
                        </div>
                    </div>

                    {/* Extracted and Editable */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ marginTop: 0 }}>Extracted Data (Editable)</h3>

                        <div style={{ marginBottom: 12, padding: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                            <strong>Parsing Confidence:</strong> {(preview.parsingConfidence * 100).toFixed(0)}%
                        </div>

                        <div>
                            {Object.entries(editedFields).map(([key, value]) => (
                                <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                    <label style={{ width: 180, color: '#374151' }}>{key}</label>
                                    <input
                                        style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
                                        defaultValue={String(value ?? '')}
                                        onChange={(e) => handleFieldEdit(key, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Instructions */}
                        <div style={{ marginTop: 16 }}>
                            <h4>Instructions ({preview.instructions.length})</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {editedInstructions?.map((instr, idx) => (
                                    <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, background: instr.highlight_level === 'critical' ? '#fef2f2' : instr.highlight_level === 'high' ? '#fffbeb' : '#ffffff' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <select value={instr.type} onChange={(e) => {
                                                const v = e.target.value as any;
                                                setEditedInstructions((prev) => prev.map((x, i) => i === idx ? { ...x, type: v } : x));
                                            }}>
                                                <option value="submission">submission</option>
                                                <option value="interview">interview</option>
                                                <option value="compliance">compliance</option>
                                                <option value="general">general</option>
                                            </select>
                                            <select value={instr.highlight_level} onChange={(e) => {
                                                const v = e.target.value as any;
                                                setEditedInstructions((prev) => prev.map((x, i) => i === idx ? { ...x, highlight_level: v } : x));
                                            }}>
                                                <option value="critical">critical</option>
                                                <option value="high">high</option>
                                                <option value="normal">normal</option>
                                            </select>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <input type="checkbox" checked={!!instr.is_mandatory} onChange={(e) => setEditedInstructions((prev) => prev.map((x, i) => i === idx ? { ...x, is_mandatory: e.target.checked } : x))} /> mandatory
                                            </label>
                                        </div>
                                        <input
                                            style={{ width: '100%', marginTop: 8, padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
                                            value={instr.title}
                                            onChange={(e) => setEditedInstructions((prev) => prev.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))}
                                        />
                                        <textarea
                                            style={{ width: '100%', marginTop: 8, padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
                                            value={instr.content}
                                            rows={4}
                                            onChange={(e) => setEditedInstructions((prev) => prev.map((x, i) => i === idx ? { ...x, content: e.target.value } : x))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Candidate Tracker */}
                        {editedTracker && (
                            <div style={{ marginTop: 16 }}>
                                <h4>Candidate Submission Format</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Field</th>
                                            <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Type</th>
                                            <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Required</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editedTracker.required_fields.map((f, idx) => (
                                            <tr key={idx}>
                                                <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8 }}>{f.field}</td>
                                                <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8 }}>{f.type}</td>
                                                <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8 }}>{f.required ? '✓' : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Duplicate Warning */}
                        {preview.potentialDuplicateMatch && (
                            <div style={{ marginTop: 16, padding: 12, border: '1px solid #f59e0b', background: '#fffbeb', borderRadius: 6 }}>
                                <strong>Duplicate Detected:</strong>
                                <div style={{ marginTop: 6 }}>
                                    ECMS ID {preview.potentialDuplicateMatch.clientReqId} already exists. Confirming will create version {preview.potentialDuplicateMatch.previousVersion + 1} and mark the previous version as "replaced".
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 16 }}>
                            <button onClick={handleConfirm} disabled={!canConfirm}>
                                ✓ Confirm & Create Requirement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
