import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import {
    createInterview,
    CreateInterviewPayload,
    InterviewMode,
    InterviewRound,
    InterviewStatus,
} from '../services/interviews.api';

export default function InterviewCreate() {
    const { id: submissionId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const canCreate = permissions.includes('*') || permissions.includes('interviews:create');

    const [formData, setFormData] = useState({
        submission_id: submissionId || '',
        job_requirement_id: '',
        round: '' as InterviewRound | '',
        mode: '' as InterviewMode | '',
        scheduled_date: '',
        scheduled_time: '',
        interviewer_id: '',
        status: InterviewStatus.SCHEDULED,
        location: '',
        meeting_link: '',
        candidate_notes: '',
        remarks: '',
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.round) {
            setError('Interview round is required');
            return;
        }
        if (!formData.mode) {
            setError('Interview mode is required');
            return;
        }
        if (!formData.job_requirement_id) {
            setError('Job Requirement ID is required');
            return;
        }

        try {
            setSaving(true);
            setError('');

            const payload: CreateInterviewPayload = {
                submission_id: formData.submission_id,
                job_requirement_id: formData.job_requirement_id,
                round: formData.round as InterviewRound,
                mode: formData.mode as InterviewMode,
                status: formData.status,
                scheduled_date: formData.scheduled_date || undefined,
                scheduled_time: formData.scheduled_time || undefined,
                interviewer_id: formData.interviewer_id || undefined,
                location: formData.location || undefined,
                meeting_link: formData.meeting_link || undefined,
                candidate_notes: formData.candidate_notes || undefined,
                remarks: formData.remarks || undefined,
            };

            const result = await createInterview(payload);
            navigate(`/app/submissions/${submissionId}/interviews`);
        } catch (err: any) {
            console.error('Failed to create interview:', err);
            setError(err.response?.data?.message || 'Failed to create interview');
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        navigate(`/app/submissions/${submissionId}/interviews`);
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
                You do not have permission to create interviews
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 900 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
                Schedule Interview
            </h1>

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

                            {/* Job Requirement ID */}
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
                                    Job Requirement ID <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.job_requirement_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, job_requirement_id: e.target.value })
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

                            {/* Interview Round */}
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
                                    Interview Round <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <select
                                    value={formData.round}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            round: e.target.value as InterviewRound,
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
                                    <option value="">Select Round</option>
                                    {Object.values(InterviewRound).map((round) => (
                                        <option key={round} value={round}>
                                            {round}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Interview Mode */}
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
                                    Interview Mode <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <select
                                    value={formData.mode}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            mode: e.target.value as InterviewMode,
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
                                    <option value="">Select Mode</option>
                                    {Object.values(InterviewMode).map((mode) => (
                                        <option key={mode} value={mode}>
                                            {mode}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Details */}
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
                            Schedule Details
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
                                    Scheduled Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.scheduled_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, scheduled_date: e.target.value })
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
                                    Scheduled Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.scheduled_time}
                                    onChange={(e) =>
                                        setFormData({ ...formData, scheduled_time: e.target.value })
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
                                    Interviewer ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.interviewer_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, interviewer_id: e.target.value })
                                    }
                                    placeholder="UUID"
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
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            status: e.target.value as InterviewStatus,
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
                                    {Object.values(InterviewStatus).map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location & Meeting Details */}
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
                            Location & Meeting Details
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
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
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) =>
                                        setFormData({ ...formData, location: e.target.value })
                                    }
                                    placeholder="For offline interviews"
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
                                    Meeting Link
                                </label>
                                <input
                                    type="text"
                                    value={formData.meeting_link}
                                    onChange={(e) =>
                                        setFormData({ ...formData, meeting_link: e.target.value })
                                    }
                                    placeholder="For online interviews"
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
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
                                    Candidate Notes
                                </label>
                                <textarea
                                    value={formData.candidate_notes}
                                    onChange={(e) =>
                                        setFormData({ ...formData, candidate_notes: e.target.value })
                                    }
                                    rows={3}
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
                                    Remarks
                                </label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={(e) =>
                                        setFormData({ ...formData, remarks: e.target.value })
                                    }
                                    rows={3}
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
                        {saving ? 'Scheduling...' : 'Schedule Interview'}
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
