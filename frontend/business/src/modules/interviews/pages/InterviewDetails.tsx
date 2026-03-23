import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import {
    getInterviewById,
    completeInterview,
    cancelInterview,
    rescheduleInterview,
    submitFeedback,
    InterviewDetail,
    InterviewStatus,
    ReschedulePayload,
    FeedbackPayload,
    CancelPayload,
} from '../services/interviews.api';

export default function InterviewDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const [interview, setInterview] = useState<InterviewDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    const canRead = permissions.includes('*') || permissions.includes('interviews:read');
    const canUpdate = permissions.includes('*') || permissions.includes('interviews:update');

    useEffect(() => {
        if (!canRead) {
            setError('You do not have permission to view interviews');
            setLoading(false);
            return;
        }
        loadInterview();
    }, [id, canRead]);

    async function loadInterview() {
        if (!id) return;
        try {
            setLoading(true);
            const data = await getInterviewById(id);
            setInterview(data);
        } catch (err: any) {
            console.error('Failed to load interview:', err);
            setError(err.response?.data?.message || 'Failed to load interview');
        } finally {
            setLoading(false);
        }
    }

    function getStatusColor(status: InterviewStatus) {
        switch (status) {
            case InterviewStatus.COMPLETED:
                return '#10B981';
            case InterviewStatus.CANCELLED:
            case InterviewStatus.NO_SHOW:
                return '#EF4444';
            case InterviewStatus.SCHEDULED:
            case InterviewStatus.IN_PROGRESS:
                return '#3B82F6';
            case InterviewStatus.RESCHEDULED:
                return '#F59E0B';
            default:
                return '#6B7280';
        }
    }

    function formatDateTime(date: string | null, time: string | null) {
        if (!date) return 'N/A';
        const dateStr = new Date(date).toLocaleDateString();
        return time ? `${dateStr} ${time}` : dateStr;
    }

    const displayValue = (val: any) => (val !== null && val !== undefined ? val : 'N/A');

    if (!canRead) {
        return (
            <div style={{ textAlign: 'center', padding: 40, color: '#EF4444', fontSize: 14 }}>
                {error || 'You do not have permission to view interviews'}
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                Loading interview...
            </div>
        );
    }

    if (error || !interview) {
        return (
            <div style={{ textAlign: 'center', padding: 40, color: '#EF4444', fontSize: 14 }}>
                {error || 'Interview not found'}
            </div>
        );
    }

    const canShowComplete =
        canUpdate &&
        (interview.status === InterviewStatus.SCHEDULED ||
            interview.status === InterviewStatus.IN_PROGRESS);
    const canShowCancel =
        canUpdate &&
        interview.status !== InterviewStatus.COMPLETED &&
        interview.status !== InterviewStatus.CANCELLED;
    const canShowReschedule =
        canUpdate &&
        interview.status !== InterviewStatus.COMPLETED &&
        interview.status !== InterviewStatus.CANCELLED;
    const canShowFeedback = canUpdate && interview.status === InterviewStatus.COMPLETED;

    return (
        <div style={{ maxWidth: 900 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button
                    onClick={() =>
                        navigate(`/app/submissions/${interview.submission_id}/interviews`)
                    }
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#60A5FA',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 0,
                    }}
                >
                    ← Back to Interviews
                </button>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Interview Details</h1>
            </div>

            {/* Status Badge */}
            <div style={{ marginBottom: 20 }}>
                <span
                    style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        background: getStatusColor(interview.status) + '20',
                        color: getStatusColor(interview.status),
                    }}
                >
                    {interview.status}
                </span>
            </div>

            {/* Action Buttons */}
            {canUpdate && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    {canShowComplete && (
                        <button
                            onClick={() => setShowCompleteModal(true)}
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
                            Mark Complete
                        </button>
                    )}
                    {canShowReschedule && (
                        <button
                            onClick={() => setShowRescheduleModal(true)}
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
                            Reschedule
                        </button>
                    )}
                    {canShowFeedback && (
                        <button
                            onClick={() => setShowFeedbackModal(true)}
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
                            Add Feedback
                        </button>
                    )}
                    {canShowCancel && (
                        <button
                            onClick={() => setShowCancelModal(true)}
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
                            Cancel Interview
                        </button>
                    )}
                </div>
            )}

            {/* Interview Details */}
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
                    Interview Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                            Round
                        </div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {displayValue(interview.round)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Mode</div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {displayValue(interview.mode)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                            Scheduled Date/Time
                        </div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {formatDateTime(interview.scheduled_date, interview.scheduled_time)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                            Interviewer ID
                        </div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {displayValue(interview.interviewer_id)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                            Location
                        </div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {displayValue(interview.location)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                            Meeting Link
                        </div>
                        <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                            {interview.meeting_link ? (
                                <a
                                    href={interview.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#60A5FA' }}
                                >
                                    {interview.meeting_link}
                                </a>
                            ) : (
                                'N/A'
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback */}
            {(interview.rating !== null || interview.feedback) && (
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
                        Feedback
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        {interview.rating !== null && (
                            <div>
                                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                                    Rating
                                </div>
                                <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                                    {interview.rating}/10
                                </div>
                            </div>
                        )}
                        {interview.feedback && (
                            <div>
                                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                                    Feedback
                                </div>
                                <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                                    {interview.feedback}
                                </div>
                            </div>
                        )}
                        {interview.outcome && (
                            <div>
                                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                                    Outcome
                                </div>
                                <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                                    {interview.outcome}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Notes */}
            {(interview.candidate_notes || interview.remarks || interview.reschedule_reason) && (
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
                        Additional Notes
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        {interview.candidate_notes && (
                            <div>
                                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                                    Candidate Notes
                                </div>
                                <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                                    {interview.candidate_notes}
                                </div>
                            </div>
                        )}
                        {interview.remarks && (
                            <div>
                                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                                    Remarks
                                </div>
                                <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                                    {interview.remarks}
                                </div>
                            </div>
                        )}
                        {interview.reschedule_reason && (
                            <div>
                                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                                    Reschedule Reason
                                </div>
                                <div style={{ fontSize: 14, color: '#E5E7EB' }}>
                                    {interview.reschedule_reason}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {showCompleteModal && (
                <CompleteModal
                    interviewId={interview.id}
                    onClose={() => setShowCompleteModal(false)}
                    onSuccess={loadInterview}
                />
            )}
            {showCancelModal && (
                <CancelModal
                    interviewId={interview.id}
                    onClose={() => setShowCancelModal(false)}
                    onSuccess={loadInterview}
                />
            )}
            {showRescheduleModal && (
                <RescheduleModal
                    interviewId={interview.id}
                    onClose={() => setShowRescheduleModal(false)}
                    onSuccess={loadInterview}
                />
            )}
            {showFeedbackModal && (
                <FeedbackModal
                    interviewId={interview.id}
                    onClose={() => setShowFeedbackModal(false)}
                    onSuccess={loadInterview}
                />
            )}
        </div>
    );
}

// Complete Modal
function CompleteModal({
    interviewId,
    onClose,
    onSuccess,
}: {
    interviewId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleComplete() {
        try {
            setSaving(true);
            await completeInterview(interviewId);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to mark interview as complete');
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
                    maxWidth: 400,
                    width: '100%',
                }}
            >
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                    Mark Interview Complete
                </h3>
                <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>
                    Are you sure you want to mark this interview as completed?
                </p>
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
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={handleComplete}
                        disabled={saving}
                        style={{
                            background: '#10B981',
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
                        {saving ? 'Processing...' : 'Confirm'}
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

// Cancel Modal
function CancelModal({
    interviewId,
    onClose,
    onSuccess,
}: {
    interviewId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleCancel() {
        try {
            setSaving(true);
            const payload = reason ? { reason } : undefined;
            await cancelInterview(interviewId, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel interview');
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
                    maxWidth: 400,
                    width: '100%',
                }}
            >
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                    Cancel Interview
                </h3>
                <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>
                    Provide a reason for cancellation (optional):
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    style={{
                        width: '100%',
                        padding: 8,
                        borderRadius: 6,
                        border: '1px solid #374151',
                        background: '#111827',
                        color: '#E5E7EB',
                        fontSize: 14,
                        marginBottom: 16,
                        resize: 'vertical',
                    }}
                />
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
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={handleCancel}
                        disabled={saving}
                        style={{
                            background: '#EF4444',
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
                        {saving ? 'Processing...' : 'Cancel Interview'}
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
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// Reschedule Modal
function RescheduleModal({
    interviewId,
    onClose,
    onSuccess,
}: {
    interviewId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        scheduled_date: '',
        scheduled_time: '',
        reason: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleReschedule() {
        if (!formData.scheduled_date || !formData.scheduled_time) {
            setError('Date and time are required');
            return;
        }

        try {
            setSaving(true);
            const payload: ReschedulePayload = {
                scheduled_date: formData.scheduled_date,
                scheduled_time: formData.scheduled_time,
                reason: formData.reason || undefined,
            };
            await rescheduleInterview(interviewId, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reschedule interview');
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
                    maxWidth: 400,
                    width: '100%',
                }}
            >
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                    Reschedule Interview
                </h3>
                <div style={{ marginBottom: 16 }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 500,
                            marginBottom: 6,
                            color: '#E5E7EB',
                        }}
                    >
                        New Date <span style={{ color: '#EF4444' }}>*</span>
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
                <div style={{ marginBottom: 16 }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 500,
                            marginBottom: 6,
                            color: '#E5E7EB',
                        }}
                    >
                        New Time <span style={{ color: '#EF4444' }}>*</span>
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
                <div style={{ marginBottom: 16 }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 500,
                            marginBottom: 6,
                            color: '#E5E7EB',
                        }}
                    >
                        Reason (optional)
                    </label>
                    <textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={handleReschedule}
                        disabled={saving}
                        style={{
                            background: '#F59E0B',
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
                        {saving ? 'Processing...' : 'Reschedule'}
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

// Feedback Modal
function FeedbackModal({
    interviewId,
    onClose,
    onSuccess,
}: {
    interviewId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        feedback: '',
        rating: '',
        remarks: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit() {
        if (!formData.feedback || !formData.rating) {
            setError('Feedback and rating are required');
            return;
        }

        const ratingNum = parseFloat(formData.rating);
        if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
            setError('Rating must be between 0 and 10');
            return;
        }

        try {
            setSaving(true);
            const payload: FeedbackPayload = {
                feedback: formData.feedback,
                rating: ratingNum,
                remarks: formData.remarks || undefined,
            };
            await submitFeedback(interviewId, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit feedback');
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
                    maxWidth: 400,
                    width: '100%',
                }}
            >
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                    Add Interview Feedback
                </h3>
                <div style={{ marginBottom: 16 }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 500,
                            marginBottom: 6,
                            color: '#E5E7EB',
                        }}
                    >
                        Rating (0-10) <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
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
                <div style={{ marginBottom: 16 }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 500,
                            marginBottom: 6,
                            color: '#E5E7EB',
                        }}
                    >
                        Feedback <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <textarea
                        value={formData.feedback}
                        onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
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
                <div style={{ marginBottom: 16 }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 500,
                            marginBottom: 6,
                            color: '#E5E7EB',
                        }}
                    >
                        Additional Remarks (optional)
                    </label>
                    <textarea
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
                <div style={{ display: 'flex', gap: 12 }}>
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
                        {saving ? 'Submitting...' : 'Submit Feedback'}
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
