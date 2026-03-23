import api from '../api';

export interface AuditLog {
    id: string;
    companyId: string;
    userId?: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    requestPath?: string;
    createdAt: string;
}

export interface PaginatedAuditLogs {
    success: boolean;
    data: AuditLog[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

// List audit logs with filters
export const listAuditLogs = async (
    page: number = 1,
    limit: number = 50,
    entityType?: string,
    action?: string,
    startDate?: Date,
    endDate?: Date,
): Promise<PaginatedAuditLogs> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(entityType && { entityType }),
        ...(action && { action }),
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
    });

    const response = await api.get(`/audit-logs?${params}`);
    return response.data;
};

// Get audit logs for a specific entity
export const getEntityAuditLogs = async (
    entityType: string,
    entityId: string,
): Promise<{ success: boolean; data: AuditLog[] }> => {
    const response = await api.get(`/audit-logs/${entityType}/${entityId}`);
    return response.data;
};

export default {
    listAuditLogs,
    getEntityAuditLogs,
};
