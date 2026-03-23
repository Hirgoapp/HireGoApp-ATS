import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolePermissionAudit } from '../entities/role-permission-audit.entity';

@Injectable()
export class RolePermissionAuditRepository {
    constructor(
        @InjectRepository(RolePermissionAudit)
        private readonly repository: Repository<RolePermissionAudit>
    ) { }

    /**
     * Create audit entry
     */
    async log(auditData: Partial<RolePermissionAudit>): Promise<RolePermissionAudit> {
        const audit = this.repository.create(auditData);
        return this.repository.save(audit);
    }

    /**
     * Find all audit entries for company
     */
    async findByCompanyId(companyId: string, limit = 100, offset = 0): Promise<RolePermissionAudit[]> {
        return this.repository.find({
            where: { company_id: companyId },
            order: { created_at: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['role', 'permission'],
        });
    }

    /**
     * Find audit entries by user
     */
    async findByUserId(companyId: string, userId: string, limit = 100, offset = 0): Promise<RolePermissionAudit[]> {
        return this.repository.find({
            where: { company_id: companyId, user_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['role', 'permission'],
        });
    }

    /**
     * Find audit entries by action
     */
    async findByAction(companyId: string, action: string, limit = 100, offset = 0): Promise<RolePermissionAudit[]> {
        return this.repository.find({
            where: { company_id: companyId, action },
            order: { created_at: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['role', 'permission'],
        });
    }

    /**
     * Find audit entries by role
     */
    async findByRoleId(companyId: string, roleId: string, limit = 100, offset = 0): Promise<RolePermissionAudit[]> {
        return this.repository.find({
            where: { company_id: companyId, role_id: roleId },
            order: { created_at: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Get audit count for company
     */
    async countByCompanyId(companyId: string): Promise<number> {
        return this.repository.count({
            where: { company_id: companyId },
        });
    }
}
