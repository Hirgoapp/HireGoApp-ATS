/**
 * Tenant Context Type Definition
 * 
 * Represents the tenant and user context extracted from JWT token.
 * Attached to every request by TenantContextMiddleware.
 */

export interface TenantContext {
    /** Tenant's unique identifier (company_id) */
    companyId: string;

    /** User's unique identifier */
    userId: string;

    /** User's role in the tenant (admin | recruiter | hiring_manager | viewer) */
    role: string;

    /** List of permission identifiers for the user */
    permissions: string[];

    /** IP address for audit trail */
    ip: string;

    /** Browser/client user agent for audit trail */
    userAgent: string;

    /** Request timestamp */
    timestamp: Date;

    /** License level of the tenant (basic | premium | enterprise) */
    licenseLevel?: string;

    /** Feature flags enabled for the tenant */
    featureFlags?: Record<string, boolean>;
}

/**
 * Request with Tenant Context
 * 
 * Extends Express Request to include tenant context.
 * This is what request handlers receive.
 */
export interface TenantRequest {
    tenant: TenantContext;
    [key: string]: any;
}

/**
 * Audit Context
 * 
 * Information about the action being audited.
 */
export interface AuditContext {
    entityType: string;      // 'candidate', 'job', 'user', etc
    entityId: string;        // ID of the entity being modified
    action: string;          // 'CREATE', 'UPDATE', 'DELETE', 'READ_SENSITIVE'
    oldValues?: Record<string, any>;  // Previous state
    newValues?: Record<string, any>;  // New state
    changes?: Record<string, any>;    // Legacy field: can contain { before, after } or { created: true } etc
    details?: Record<string, any>;    // Additional context
    ip?: string;              // IP address
    userAgent?: string;       // Browser info
    path?: string;            // Request path
}

/**
 * Audit Log DTO
 * 
 * Database record for audit logging.
 */
export interface AuditLogDto {
    id: string;
    companyId: string;
    userId: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    requestPath: string;
    createdAt: Date;
}

/**
 * Audit Filters
 * 
 * Query filters for retrieving audit logs.
 */
export interface AuditFilters {
    entityType?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
