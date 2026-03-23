import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/user-role.entity';

@Injectable()
export class UserRoleRepository {
    constructor(
        @InjectRepository(UserRole)
        private readonly repository: Repository<UserRole>,
    ) {}

    /**
     * Assign a role to a user within a company.
     * Idempotent: if the combination already exists, it is returned as-is.
     */
    async assignRole(userId: string, roleId: string, companyId: string): Promise<UserRole> {
        const existing = await this.repository.findOne({
            where: { user_id: userId, role_id: roleId, company_id: companyId },
        });

        if (existing) {
            return existing;
        }

        const entity = this.repository.create({
            user_id: userId,
            role_id: roleId,
            company_id: companyId,
        });
        return this.repository.save(entity);
    }

    /**
     * Get all roles for a user within a company.
     */
    async getUserRoles(userId: string, companyId: string): Promise<UserRole[]> {
        return this.repository.find({
            where: { user_id: userId, company_id: companyId },
            relations: ['role'],
        });
    }

    /**
     * Remove a specific role from a user within a company.
     */
    async removeRole(userId: string, roleId: string, companyId: string): Promise<void> {
        await this.repository.delete({ user_id: userId, role_id: roleId, company_id: companyId });
    }

    /**
     * Clear all roles for a user within a company.
     */
    async clearUserRoles(userId: string, companyId: string): Promise<void> {
        await this.repository.delete({ user_id: userId, company_id: companyId });
    }
}

