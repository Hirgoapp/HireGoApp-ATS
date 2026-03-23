import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import SurfaceCard from '../components/ui/SurfaceCard';
import StatePanel from '../components/ui/StatePanel';
import { useAuthStore } from '../stores/authStore';
import { listActivities } from '../services/api/activity.api';
import { Activity } from '../services/api/activity.api';

const ENTITY_TYPES = [
    'Job',
    'Candidate',
    'Submission',
    'Interview',
    'Offer',
    'Client',
];

const ACTIVITY_TYPE_MAP: Record<string, { label: string; color: string; icon: string }> = {
    job_created: { label: 'Job Created', color: 'bg-blue-50 border-blue-200', icon: '📝' },
    job_published: { label: 'Job Published', color: 'bg-green-50 border-green-200', icon: '📢' },
    candidate_created: { label: 'Candidate Added', color: 'bg-purple-50 border-purple-200', icon: '👤' },
    candidate_updated: { label: 'Candidate Updated', color: 'bg-yellow-50 border-yellow-200', icon: '✏️' },
    candidate_submitted_to_job: { label: 'Candidate Submitted', color: 'bg-cyan-50 border-cyan-200', icon: '📤' },
    submission_status_updated: { label: 'Submission Status', color: 'bg-orange-50 border-orange-200', icon: '🔄' },
    interview_scheduled: { label: 'Interview Scheduled', color: 'bg-indigo-50 border-indigo-200', icon: '📅' },
    interview_completed: { label: 'Interview Completed', color: 'bg-pink-50 border-pink-200', icon: '✅' },
    offer_created: { label: 'Offer Created', color: 'bg-green-50 border-green-200', icon: '🎁' },
    offer_sent: { label: 'Offer Sent', color: 'bg-emerald-50 border-emerald-200', icon: '📧' },
};

interface PaginationState {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export default function ActivityExplorer() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);

    const [activities, setActivities] = useState<Activity[]>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 50,
        total: 0,
        pages: 1,
    });
    const [selectedEntityType, setSelectedEntityType] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasPermission = has('activity:view');

    const loadActivities = async (page: number = 1, entityType?: string) => {
        if (!hasPermission) return;

        try {
            setLoading(true);
            setError(null);

            const result = await listActivities(page, pagination.limit, entityType);

            setActivities(result.data);
            setPagination({
                page: result.pagination.page,
                limit: result.pagination.limit,
                total: result.pagination.total,
                pages: result.pagination.pages,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load activities');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadActivities(1, selectedEntityType);
    }, [selectedEntityType, hasPermission]);

    if (!hasPermission) {
        return (
            <div className="page-stack">
                <PageHeader title="Activity Timeline" />
                <StatePanel
                    title="Permission Denied"
                    message="You don't have permission to view activities"
                    tone="neutral"
                />
            </div>
        );
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Activity Timeline"
                subtitle="View all activity events across the system"
            />

            {/* Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                        Entity Type
                    </label>
                    <select
                        value={selectedEntityType || ''}
                        onChange={(e) => setSelectedEntityType(e.target.value || undefined)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: '0.875rem',
                        }}
                    >
                        <option value="">All Types</option>
                        {ENTITY_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                        onClick={() => loadActivities(1, selectedEntityType)}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '8px 16px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: 12, backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b' }}>
                    {error}
                </div>
            )}

            {/* Activity Timeline */}
            {activities.length === 0 && !loading ? (
                <StatePanel
                    title="No Activities"
                    message="There are no activities to display yet"
                    tone="neutral"
                />
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {activities.map((activity) => {
                        const activityConfig = ACTIVITY_TYPE_MAP[activity.activity_type] || {
                            label: activity.activity_type,
                            color: 'bg-gray-50 border-gray-200',
                            icon: '📌',
                        };

                        return (
                            <SurfaceCard
                                key={activity.id}
                                className="border-l-4 border-blue-500"
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
                                        <div style={{ fontSize: '1.5rem' }}>{activityConfig.icon}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                                                {activityConfig.label}
                                            </h3>
                                            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: 4, margin: 0 }}>
                                                {activity.message}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '0.75rem', color: '#6b7280' }}>
                                                <span style={{ padding: '4px 8px', backgroundColor: '#f3f4f6', borderRadius: 4 }}>
                                                    {activity.entity_type}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {new Date(activity.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            {activity.metadata && (
                                                <details style={{ marginTop: 8 }}>
                                                    <summary style={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>
                                                        Details
                                                    </summary>
                                                    <pre style={{ marginTop: 8, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 4, fontSize: '0.75rem', overflow: 'auto' }}>
                                                        {JSON.stringify(activity.metadata, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SurfaceCard>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} activities
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => loadActivities(pagination.page - 1, selectedEntityType)}
                            disabled={pagination.page === 1 || loading}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                cursor: pagination.page === 1 ? 'default' : 'pointer',
                                opacity: pagination.page === 1 ? 0.5 : 1,
                            }}
                        >
                            Previous
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                                const start = Math.max(1, pagination.page - 2);
                                return start + i;
                            }).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => loadActivities(p, selectedEntityType)}
                                    style={{
                                        padding: '8px 8px',
                                        borderRadius: 8,
                                        backgroundColor: p === pagination.page ? '#2563eb' : 'transparent',
                                        color: p === pagination.page ? 'white' : '#111827',
                                        border: p === pagination.page ? 'none' : '1px solid #d1d5db',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => loadActivities(pagination.page + 1, selectedEntityType)}
                            disabled={pagination.page === pagination.pages || loading}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                cursor: pagination.page === pagination.pages ? 'default' : 'pointer',
                                opacity: pagination.page === pagination.pages ? 0.5 : 1,
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
