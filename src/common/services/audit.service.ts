import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditContext, AuditFilters } from '../types/tenant-context';

// Uses entity defined in ../entities/audit-log.entity

/**
 * Audit Service
 * 
 * Responsible for logging all data access and modifications.
 * Ensures complete audit trail for compliance and forensics.
 * 
 * Key Features:
 * - Logs CREATE, UPDATE, DELETE, and sensitive READ actions
 * - Stores old and new values for change tracking
 * - Includes IP address and user agent for forensics
 * - Always scoped to company (company_id filter)
 * - Immutable audit logs (not soft-deleted)
 * - Supports multiple call signatures for backward compatibility
 */
@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditRepository: Repository<AuditLog>,
    ) { }

    /**
     * Log an action to audit trail
     * 
     * Supports multiple signatures for backward compatibility:
     * 1. log(companyId, userId, context) - Preferred unified signature
     * 2. log(context) - Legacy single-object signature (auto-extracts companyId, userId)
     * 3. log(null, userId, context) - For super-admin context (no company)
     * 
     * Called whenever data is modified or sensitive data is accessed.
     */
    async log(
        companyIdOrContext?: string | any,
        userIdOrUndefined?: string,
        contextOrUndefined?: AuditContext
    ): Promise<void> {
        try {
            let companyId: string | null;
            let userId: string;
            let context: AuditContext;

            // Determine which signature was used
            if (typeof companyIdOrContext === 'object' && companyIdOrContext !== null) {
                // Legacy signature: log({ company_id, user_id, entity_type, ... })
                const obj = companyIdOrContext;
                companyId = obj.company_id || null;
                userId = obj.user_id || 'system';
                context = {
                    entityType: obj.entity_type,
                    entityId: obj.entity_id,
                    action: obj.action,
                    oldValues: obj.changes?.before || obj.oldValues || null,
                    newValues: obj.changes?.after || obj.newValues || null,
                    changes: obj.changes || null,
                };
            } else {
                // Preferred signature: log(companyId, userId, context)
                companyId = companyIdOrContext || null;
                userId = userIdOrUndefined || 'system';
                context = contextOrUndefined || {
                    entityType: 'Unknown',
                    entityId: 'unknown',
                    action: 'UNKNOWN',
                };
            }

            // Create audit log entry
            // Ensure companyId is present; skip persistence if missing (e.g., super-admin/system)
            if (!companyId) {
                // Soft-log to console only to avoid FK violations
                if (process.env.NODE_ENV === 'development') {
                    console.log('[AUDIT_SKIP_NO_COMPANY]', {
                        userId,
                        ...context,
                        timestamp: new Date().toISOString(),
                    });
                }
                return;
            }

            const auditLog = this.auditRepository.create({
                companyId: companyId || undefined as any,
                userId: userId || null,
                entityType: context.entityType,
                entityId: context.entityId,
                action: context.action,
                oldValues: context.oldValues || null,
                newValues: context.newValues || null,
                ipAddress: (context as any).ip || null,
                userAgent: (context as any).userAgent || null,
                requestPath: (context as any).path || null,
            });

            await this.auditRepository.save(auditLog);
        } catch (error) {
            // Never throw from audit service - log failure but don't break request
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[AUDIT_ERROR]', errorMessage);
        }
    }

    /**
     * Retrieve audit logs for a company
     * 
     * Always filters by company_id to ensure tenant isolation.
     * 
     * @param companyId - Tenant identifier
     * @param filters - Query filters (entity type, date range, user, action, etc)
     * @returns Array of audit logs matching criteria
     */
    async getAuditTrail(
        companyId: string,
        filters: AuditFilters = {}
    ): Promise<AuditLog[]> {
        const qb = this.auditRepository.createQueryBuilder('log')
            .where('log.company_id = :companyId', { companyId });

        if (filters.entityType) qb.andWhere('log.entity_type = :entityType', { entityType: filters.entityType });
        if (filters.entityId) qb.andWhere('log.entity_id = :entityId', { entityId: filters.entityId });
        if (filters.action) qb.andWhere('log.action = :action', { action: filters.action });
        if (filters.userId) qb.andWhere('log.user_id = :userId', { userId: filters.userId });
        if (filters.startDate) qb.andWhere('log.created_at >= :startDate', { startDate: filters.startDate });
        if (filters.endDate) qb.andWhere('log.created_at <= :endDate', { endDate: filters.endDate });

        const limit = filters.limit ?? 100;
        const offset = filters.offset ?? 0;

        return qb.orderBy('log.created_at', 'DESC').skip(offset).take(limit).getMany();
    }

    /**
     * Get audit logs for a specific entity
     * 
     * Useful for understanding change history of specific records.
     * 
     * @param companyId - Tenant identifier
     * @param entityType - Type of entity (candidate, job, user, etc)
     * @param entityId - ID of specific entity
     * @returns Audit logs for that entity, ordered by date DESC
     */
    async getEntityHistory(
        companyId: string,
        entityType: string,
        entityId: string
    ): Promise<AuditLog[]> {
        return this.getAuditTrail(companyId, {
            entityType,
            entityId,
            limit: 1000
        });
    }

    /**
     * Get audit logs for a user's actions
     * 
     * Useful for security investigation or understanding user behavior.
     * 
     * @param companyId - Tenant identifier
     * @param userId - User whose actions to retrieve
     * @returns Audit logs of user's actions, ordered by date DESC
     */
    async getUserActivity(
        companyId: string,
        userId: string,
        limit: number = 100
    ): Promise<AuditLog[]> {
        return this.getAuditTrail(companyId, {
            userId,
            limit
        });
    }

    /**
     * Helper method to log entity creation
     */
    async logCreate(
        companyId: string,
        userId: string,
        entityType: string,
        entityId: string,
        newValues: Record<string, any>,
        context: Partial<AuditContext>
    ): Promise<void> {
        await this.log(companyId, userId, {
            entityType,
            entityId,
            action: 'CREATE',
            newValues,
            ip: context.ip || undefined,
            userAgent: context.userAgent || undefined,
            path: context.path || undefined
        });
    }

    /**
     * Helper method to log entity update
     */
    async logUpdate(
        companyId: string,
        userId: string,
        entityType: string,
        entityId: string,
        oldValues: Record<string, any>,
        newValues: Record<string, any>,
        context: Partial<AuditContext>
    ): Promise<void> {
        await this.log(companyId, userId, {
            entityType,
            entityId,
            action: 'UPDATE',
            oldValues,
            newValues,
            ip: context.ip || undefined,
            userAgent: context.userAgent || undefined,
            path: context.path || undefined
        });
    }

    /**
     * Helper method to log entity deletion
     */
    async logDelete(
        companyId: string,
        userId: string,
        entityType: string,
        entityId: string,
        oldValues: Record<string, any>,
        context: Partial<AuditContext>
    ): Promise<void> {
        await this.log(companyId, userId, {
            entityType,
            entityId,
            action: 'DELETE',
            oldValues,
            ip: context.ip || undefined,
            userAgent: context.userAgent || undefined,
            path: context.path || undefined
        });
    }

    /**
     * Helper method to log sensitive data access
     */
    async logSensitiveAccess(
        companyId: string,
        userId: string,
        entityType: string,
        entityId: string,
        dataType: string,
        context: Partial<AuditContext>
    ): Promise<void> {
        await this.log(companyId, userId, {
            entityType,
            entityId,
            action: `READ_${dataType.toUpperCase()}`,
            newValues: { dataType },
            ip: context.ip || undefined,
            userAgent: context.userAgent || undefined,
            path: context.path || undefined
        });
    }

    /**
     * Generate a unique ID for audit log entry
     * In production, use UUID v4
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
}
