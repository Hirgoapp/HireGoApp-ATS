import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolePermission } from '../entities/role-permission.entity';

@Injectable()
export class RolePermissionRepository {
    constructor(
        @InjectRepository(RolePermission)
        private readonly repository: Repository<RolePermission>
    ) { }

    /**
     * Find all permissions for a role
     */
    async findByRoleId(roleId: string): Promise<RolePermission[]> {
        return this.repository.find({
            where: { role_id: roleId },
            relations: ['permission'],
        });
    }

    /**
     * Check if role has permission
     */
    async hasPermission(roleId: string, permissionId: string): Promise<boolean> {
        const count = await this.repository.count({
            where: { role_id: roleId, permission_id: permissionId },
        });
        return count > 0;
    }

    /**
     * Add permission to role
     */
    async addPermission(roleId: string, permissionId: string): Promise<RolePermission> {
        const existing = await this.repository.findOne({
            where: { role_id: roleId, permission_id: permissionId },
        });

        if (existing) {
            return existing;
        }

        const rolePermission = this.repository.create({
            role_id: roleId,
            permission_id: permissionId,
        });
        return this.repository.save(rolePermission);
    }

    /**
     * Add multiple permissions to role
     */
    async addPermissions(roleId: string, permissionIds: string[]): Promise<RolePermission[]> {
        const rolePermissions = permissionIds.map((permissionId) =>
            this.repository.create({
                role_id: roleId,
                permission_id: permissionId,
            })
        );
        return this.repository.save(rolePermissions, { chunk: 100 });
    }

    /**
     * Remove permission from role
     */
    async removePermission(roleId: string, permissionId: string): Promise<void> {
        await this.repository.delete({
            role_id: roleId,
            permission_id: permissionId,
        });
    }

    /**
     * Remove all permissions from role
     */
    async removeAllPermissions(roleId: string): Promise<void> {
        await this.repository.delete({ role_id: roleId });
    }

    /**
     * Get permission names for role
     */
    async getPermissionNames(roleId: string): Promise<string[]> {
        const rolePermissions = await this.repository.find({
            where: { role_id: roleId },
            relations: ['permission'],
        });

        return rolePermissions.map((rp) => rp.permission.key);
    }
}
