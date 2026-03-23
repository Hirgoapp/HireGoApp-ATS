import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { AuditLog } from '../../common/entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
    constructor(
        @InjectRepository(AuditLog)
        private readonly repository: Repository<AuditLog>,
    ) { }

    async findWithPagination(
        filters: {
            companyId: string;
            entityType?: string;
            action?: string;
        },
        page: number = 1,
        limit: number = 50,
        startDate?: Date,
        endDate?: Date,
    ): Promise<{ data: AuditLog[]; total: number }> {
        const where: any = {
            companyId: filters.companyId,
        };

        if (filters.entityType) {
            where.entityType = filters.entityType;
        }

        if (filters.action) {
            where.action = filters.action;
        }

        if (startDate || endDate) {
            const dateConditions: any = {};
            if (startDate) {
                dateConditions[MoreThan.name] = startDate;
            }
            if (endDate) {
                dateConditions[LessThan.name] = endDate;
            }
            where.createdAt = dateConditions;
        }

        const [data, total] = await this.repository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }

    async findByEntityType(
        companyId: string,
        entityType: string,
        entityId: string,
    ): Promise<AuditLog[]> {
        return this.repository.find({
            where: {
                companyId,
                entityType,
                entityId,
            },
            order: { createdAt: 'DESC' },
        });
    }

    async logAuditEvent(
        companyId: string,
        userId: string | null,
        entityType: string,
        entityId: string,
        action: string,
        oldValues?: Record<string, any>,
        newValues?: Record<string, any>,
        metadata?: { ipAddress?: string; userAgent?: string; requestPath?: string },
    ): Promise<AuditLog> {
        const auditLog = this.repository.create({
            companyId,
            userId,
            entityType,
            entityId,
            action,
            oldValues: oldValues || null,
            newValues: newValues || null,
            ipAddress: metadata?.ipAddress || null,
            userAgent: metadata?.userAgent || null,
            requestPath: metadata?.requestPath || null,
        });

        return this.repository.save(auditLog);
    }
}
