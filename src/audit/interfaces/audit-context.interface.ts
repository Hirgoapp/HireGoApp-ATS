export interface AuditContext {
    entityType: string;
    entityId: string;
    action: string;
    ip?: string;
    userAgent?: string;
    path?: string;
    details?: Record<string, any>;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
}
