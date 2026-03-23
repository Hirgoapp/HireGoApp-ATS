import { Repository, IsNull, LessThanOrEqual } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserPermission } from '../entities/user-permission.entity';

@Injectable()
export class UserPermissionRepository {
    constructor(
        @InjectRepository(UserPermission)
        private readonly repository: Repository<UserPermission>
    ) { }

    /**
     * Find all non-expired permission overrides for user in company
     */
    async findByUserInCompany(userId: string, companyId: string): Promise<UserPermission[]> {
        return this.repository.find({
            where: {
                user_id: userId,
                company_id: companyId,
                // Include non-expired and those without expiration
                expires_at: IsNull(), // This will be handled in the query below
            },
            relations: ['permission'],
        });
    }

    /**
     * Find all non-expired overrides for user (more flexible query)
     */
    async findNonExpiredByUser(userId: string, companyId: string): Promise<UserPermission[]> {
        const now = new Date();
        return this.repository
            .createQueryBuilder('up')
            .where('up.user_id = :userId', { userId })
            .andWhere('up.company_id = :companyId', { companyId })
            .andWhere('(up.expires_at IS NULL OR up.expires_at > :now)', { now })
            .leftJoinAndSelect('up.permission', 'permission')
            .getMany();
    }

    /**
     * Find specific permission override for user
     */
    async findByUserAndPermission(
        userId: string,
        companyId: string,
        permissionId: string
    ): Promise<UserPermission | null> {
        return this.repository.findOne({
            where: { user_id: userId, company_id: companyId, permission_id: permissionId },
            relations: ['permission'],
        });
    }

    /**
     * Create or update permission override
     */
    async createOrUpdate(overrideData: Partial<UserPermission>): Promise<UserPermission> {
        const existing = await this.findByUserAndPermission(
            overrideData.user_id,
            overrideData.company_id,
            overrideData.permission_id
        );

        if (existing) {
            Object.assign(existing, overrideData);
            return this.repository.save(existing);
        }

        const userPermission = this.repository.create(overrideData);
        return this.repository.save(userPermission);
    }

    /**
     * Grant permission to user
     */
    async grant(
        userId: string,
        companyId: string,
        permissionId: string,
        createdById: string,
        reason?: string,
        expiresAt?: Date
    ): Promise<UserPermission> {
        return this.createOrUpdate({
            user_id: userId,
            company_id: companyId,
            permission_id: permissionId,
            grant_type: 'grant',
            created_by_id: createdById ?? null,
            reason,
            expires_at: expiresAt,
        });
    }

    /**
     * Revoke permission from user
     */
    async revoke(
        userId: string,
        companyId: string,
        permissionId: string,
        createdById: string,
        reason?: string
    ): Promise<UserPermission> {
        return this.createOrUpdate({
            user_id: userId,
            company_id: companyId,
            permission_id: permissionId,
            grant_type: 'revoke',
            created_by_id: createdById ?? null,
            reason,
            expires_at: null,
        });
    }

    /**
     * Remove override
     */
    async remove(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    /**
     * Clean up expired overrides
     */
    async cleanupExpired(): Promise<number> {
        const now = new Date();
        const result = await this.repository.delete({
            expires_at: LessThanOrEqual(now),
        });
        return result.affected || 0;
    }
}
