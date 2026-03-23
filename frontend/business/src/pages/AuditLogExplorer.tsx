import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import SurfaceCard from '../components/ui/SurfaceCard';
import StatePanel from '../components/ui/StatePanel';
import { useAuthStore } from '../stores/authStore';
import { listAuditLogs } from '../services/api/auditLogs.api';
import { AuditLog } from '../services/api/auditLogs.api';

const ENTITY_TYPES = [
    'User',
    'Role',
    'Permission',
    'Company',
    'Job',
    'Candidate',
    'Submission',
    'Interview',
    'Offer',
    'Client',
];

const ACTION_TYPES = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'PERMISSION_CHANGE',
    'ROLE_CHANGE',
];

const ACTION_COLOR_MAP: Record<string, string> = {
    CREATE: 'bg-green-50',
    UPDATE: 'bg-blue-50',
    DELETE: 'bg-red-50',
    LOGIN: 'bg-purple-50',
    LOGOUT: 'bg-gray-50',
    PERMISSION_CHANGE: 'bg-orange-50',
    ROLE_CHANGE: 'bg-yellow-50',
};

interface PaginationState {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface FilterState {
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
}

export default function AuditLogExplorer() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);

    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 50,
        total: 0,
        pages: 1,
    });
    const [filters, setFilters] = useState<FilterState>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasPermission = has('audit:view');

    const loadAuditLogs = async (page: number = 1, filterState: FilterState = filters) => {
        if (!hasPermission) return;

        try {
            setLoading(true);
            setError(null);

            const result = await listAuditLogs(
                page,
                pagination.limit,
                filterState.entityType,
                filterState.action,
                filterState.startDate,
                filterState.endDate,
            );

            setAuditLogs(result.data);
            setPagination({
                page: result.pagination.page,
                limit: result.pagination.limit,
                total: result.pagination.total,
                pages: result.pagination.pages,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters);
        loadAuditLogs(1, newFilters);
    };

    const handleExport = async () => {
        if (auditLogs.length === 0) {
            setError('No audit logs to export');
            return;
        }

        try {
            const csv = convertToCSV(auditLogs);
            downloadCSV(csv, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export logs');
        }
    };

    const convertToCSV = (logs: AuditLog[]): string => {
        const headers = [
            'ID',
            'Entity Type',
            'Entity ID',
            'Action',
            'User ID',
            'Timestamp',
            'IP Address',
            'Request Path',
        ];

        const rows = logs.map((log) => [
            log.id,
            log.entityType,
            log.entityId,
            log.action,
            log.userId || '-',
            log.createdAt,
            log.ipAddress || '-',
            log.requestPath || '-',
        ]);

        const csv = [
            headers.join(','),
            ...rows.map((row) =>
                row.map((cell) => (typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell)).join(',')
            ),
        ].join('\n');

        return csv;
    };

    const downloadCSV = (csv: string, filename: string) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    useEffect(() => {
        loadAuditLogs(1, filters);
    }, [hasPermission]);

    if (!hasPermission) {
        return (
            <div className="page-stack">
                <PageHeader title="Audit Log Viewer" />
                <StatePanel
                    title="Permission Denied"
                    message="You don't have permission to view audit logs"
                    tone="neutral"
                />
            </div>
        );
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Audit Log Viewer"
                subtitle="Review all system audit logs for compliance and security"
            />

            {/* Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                        Entity Type
                    </label>
                    <select
                        value={filters.entityType || ''}
                        onChange={(e) =>
                            handleFilterChange({
                                ...filters,
                                entityType: e.target.value || undefined,
                            })
                        }
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

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                        Action
                    </label>
                    <select
                        value={filters.action || ''}
                        onChange={(e) =>
                            handleFilterChange({
                                ...filters,
                                action: e.target.value || undefined,
                            })
                        }
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: '0.875rem',
                        }}
                    >
                        <option value="">All Actions</option>
                        {ACTION_TYPES.map((action) => (
                            <option key={action} value={action}>
                                {action}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                        onChange={(e) =>
                            handleFilterChange({
                                ...filters,
                                startDate: e.target.value ? new Date(e.target.value) : undefined,
                            })
                        }
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: '0.875rem',
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                        End Date
                    </label>
                    <input
                        type="date"
                        value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                        onChange={(e) =>
                            handleFilterChange({
                                ...filters,
                                endDate: e.target.value ? new Date(e.target.value) : undefined,
                            })
                        }
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: '0.875rem',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                        onClick={handleExport}
                        disabled={loading || auditLogs.length === 0}
                        style={{
                            width: '100%',
                            padding: '8px 16px',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: auditLogs.length === 0 ? 'default' : 'pointer',
                            opacity: loading || auditLogs.length === 0 ? 0.5 : 1,
                        }}
                    >
                        📥 Export
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: 12, backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b' }}>
                    {error}
                </div>
            )}

            {/* Audit Logs */}
            {auditLogs.length === 0 && !loading ? (
                <StatePanel
                    title="No Audit Logs"
                    message="There are no audit logs to display"
                    tone="neutral"
                />
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {auditLogs.map((log) => {
                        const actionColor = ACTION_COLOR_MAP[log.action] || 'bg-gray-50';

                        return (
                            <SurfaceCard
                                key={log.id}
                                className="border-l-4 border-blue-500"
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                                            {log.action}
                                        </h3>
                                        <span style={{ padding: '4px 8px', backgroundColor: '#f3f4f6', borderRadius: 4, fontSize: '0.75rem' }}>
                                            {log.entityType}
                                        </span>
                                    </div>

                                    <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, fontSize: '0.75rem' }}>
                                        <div>
                                            <span style={{ fontWeight: 600, color: '#4b5563' }}>Entity ID:</span>
                                            <span style={{ color: '#374151', marginLeft: 4 }}>{log.entityId}</span>
                                        </div>

                                        {log.userId && (
                                            <div>
                                                <span style={{ fontWeight: 600, color: '#4b5563' }}>User:</span>
                                                <span style={{ color: '#374151', marginLeft: 4 }}>{log.userId}</span>
                                            </div>
                                        )}

                                        <div>
                                            <span style={{ fontWeight: 600, color: '#4b5563' }}>Timestamp:</span>
                                            <span style={{ color: '#374151', marginLeft: 4 }}>
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>

                                        {log.ipAddress && (
                                            <div>
                                                <span style={{ fontWeight: 600, color: '#4b5563' }}>IP:</span>
                                                <span style={{ color: '#374151', marginLeft: 4 }}>{log.ipAddress}</span>
                                            </div>
                                        )}

                                        {log.requestPath && (
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <span style={{ fontWeight: 600, color: '#4b5563' }}>Path:</span>
                                                <span style={{ color: '#374151', marginLeft: 4, wordBreak: 'break-all' }}>
                                                    {log.requestPath}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {(log.oldValues || log.newValues) && (
                                        <details style={{ marginTop: 8, fontSize: '0.75rem' }}>
                                            <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#2563eb' }}>
                                                View Changes
                                            </summary>
                                            <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                                                {log.oldValues && (
                                                    <div>
                                                        <span style={{ fontWeight: 600, color: '#4b5563' }}>Before:</span>
                                                        <pre style={{ marginTop: 4, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'auto', fontSize: '0.7rem' }}>
                                                            {JSON.stringify(log.oldValues, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {log.newValues && (
                                                    <div>
                                                        <span style={{ fontWeight: 600, color: '#4b5563' }}>After:</span>
                                                        <pre style={{ marginTop: 4, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'auto', fontSize: '0.7rem' }}>
                                                            {JSON.stringify(log.newValues, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </details>
                                    )}
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
                        {pagination.total} audit logs
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => loadAuditLogs(pagination.page - 1)}
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
                                    onClick={() => loadAuditLogs(p)}
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
                            onClick={() => loadAuditLogs(pagination.page + 1)}
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
