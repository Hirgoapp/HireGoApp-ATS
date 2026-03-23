import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService } from '../../common/services/cache.service';
import { AuditService } from '../../common/services/audit.service';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { UserPermission } from '../entities/user-permission.entity';
import { RolePermissionAudit } from '../entities/role-permission-audit.entity';
import { RoleRepository } from '../repositories/role.repository';
import { RolePermissionRepository } from '../repositories/role-permission.repository';
import { UserPermissionRepository } from '../repositories/user-permission.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RolePermissionAuditRepository } from '../repositories/role-permission-audit.repository';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UserRoleRepository } from '../repositories/user-role.repository';

@Injectable()
export class AuthorizationService {
    private readonly logger = new Logger(AuthorizationService.name);

    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly roleRepository: RoleRepository,
        private readonly rolePermissionRepository: RolePermissionRepository,
        private readonly userPermissionRepository: UserPermissionRepository,
        private readonly permissionRepository: PermissionRepository,
        private readonly auditRepository: RolePermissionAuditRepository,
        private readonly userRoleRepository: UserRoleRepository,
        private readonly cacheService: CacheService,
        private readonly auditService: AuditService
    ) { }

    /**
     * LEGACY: Get user's effective permissions based on simple role name.
     * NOTE: This is kept for backward compatibility. New code should prefer
     * userHasPermission(userId, companyId, permissionKey).
     */
    async getUserPermissions(userId: string): Promise<string[]> {
        // Try cache first
        const cacheKey = `user_permissions:${userId}`;
        const cached = await this.cacheService.get<string[]>(cacheKey);

        if (cached) {
            return cached;
        }

        // Get user's role
        const user = await this.usersRepository.findOne({
            where: { id: userId } as any,
        });

        if (!user || !user.role) {
            return [];
        }

        // Get role name
        const roleName = typeof user.role === 'object' ? (user.role as any).name : String(user.role);

        // Return all permissions for admin role
        if (roleName === 'admin' || roleName === 'Admin') {
            const allPermissions = ['*'];
            await this.cacheService.set(cacheKey, allPermissions, 300);
            return allPermissions;
        }

        // For other roles, return basic permissions
        const basicPermissions = ['candidates:read', 'jobs:view', 'submissions:read', 'submissions:create', 'submissions:update'];
        await this.cacheService.set(cacheKey, basicPermissions, 300);
        return basicPermissions;
    }

    /**
     * Check if user has specific permission
     * Supports wildcard matching (e.g., 'candidates:*' matches 'candidates:read')
     */
    async hasPermission(
        userId: string,
        requiredPermission: string
    ): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);

        // Exact match
        if (permissions.includes(requiredPermission)) {
            return true;
        }

        // Wildcard match (e.g., 'candidates:*' matches 'candidates:read')
        const [resource] = requiredPermission.split(':');
        const wildcardPermission = `${resource}:*`;
        if (permissions.includes(wildcardPermission)) {
            return true;
        }

        return false;
    }

    // ---------------------------------------------------------------------
    // New tenant-aware permission resolution
    // ---------------------------------------------------------------------

    /**
     * Get all roles for a user within a company (tenant).
     */
    async getUserRoles(userId: string, companyId: string) {
        return this.userRoleRepository.getUserRoles(userId, companyId);
    }

    /**
     * Get all active permission keys for a role.
     */
    private async getRolePermissions(roleId: string): Promise<string[]> {
        const rolePermissions = await this.rolePermissionRepository.findByRoleId(roleId);

        // Only include active permissions
        return rolePermissions
            .filter((rp) => rp.permission?.is_active)
            .map((rp) => rp.permission.key);
    }

    /**
     * Get effective permission keys for a user in a company:
     * - start with role-based permissions
     * - apply user-level overrides (grant/revoke)
     */
    async getUserPermissionsForCompany(userId: string, companyId: string): Promise<string[]> {
        const cacheKey = `user_permissions:${companyId}:${userId}`;
        const cached = await this.cacheService.get<string[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const effective = new Set<string>();

        // 1) Role-based permissions
        const userRoles = await this.getUserRoles(userId, companyId);
        for (const userRole of userRoles) {
            const perms = await this.getRolePermissions(userRole.role_id);
            perms.forEach((p) => effective.add(p));
        }

        // 2) User-level overrides
        const overrides = await this.userPermissionRepository.findNonExpiredByUser(userId, companyId);
        for (const override of overrides) {
            const key = override.permission?.key;
            if (!key) continue;

            if (override.grant_type === 'grant') {
                effective.add(key);
            } else if (override.grant_type === 'revoke') {
                effective.delete(key);
            }
        }

        const result = Array.from(effective.values());
        await this.cacheService.set(cacheKey, result, 300); // 5 minutes
        return result;
    }

    /**
     * Seed default roles and permissions for a new company and assign Company Admin role
     * to the initial admin user.
     *
     * - Company Admin: all active permissions
     * - Recruiter: basic create/view on core entities
     * - Viewer: read-only on core entities
     */
    async seedDefaultRolesForCompany(companyId: string, adminUserId: string): Promise<void> {
        // Idempotent: if roles already exist for this company, do nothing
        const existingRoles = await this.roleRepository.findAll();
        const companyRoles = existingRoles.filter((r) => r.company_id === companyId);
        if (companyRoles.length > 0) {
            this.logger.log(`Default roles already exist for company ${companyId}, skipping seed.`);
            return;
        }

        this.logger.log(`Seeding default roles for company ${companyId}...`);

        // 1) Create roles
        const [companyAdminRole, recruiterRole, viewerRole] = await this.roleRepository.createMany([
            {
                company_id: companyId,
                name: 'Company Admin',
                slug: 'company_admin',
                description: 'Full access within the tenant',
                is_system: false,
                is_default: true,
                display_order: 1,
            },
            {
                company_id: companyId,
                name: 'Recruiter',
                slug: 'recruiter',
                description: 'Can manage day-to-day recruitment workflows',
                is_system: false,
                is_default: false,
                display_order: 2,
            },
            {
                company_id: companyId,
                name: 'Viewer',
                slug: 'viewer',
                description: 'Read-only access to key data',
                is_system: false,
                is_default: false,
                display_order: 3,
            },
        ]);

        // 2) Assign permissions
        const activePermissions = await this.permissionRepository.listActivePermissions();

        // Helper to get permission IDs by key
        const byKey = (keys: string[]): string[] =>
            activePermissions.filter((p) => keys.includes(p.key)).map((p) => p.id);

        // Company Admin: all active permissions
        await this.rolePermissionRepository.addPermissions(
            companyAdminRole.id,
            activePermissions.map((p) => p.id),
        );

        // Recruiter: basic working permissions
        const recruiterKeys = [
            'clients:read',
            'clients:create',
            'jobs:view',
            'jobs:create',
            'candidates:read',
            'candidates:create',
            'submissions:read',
            'submissions:create',
            'interviews:read',
            'interviews:create',
            'interviews:update',
            'offers:read',
            'offers:create',
            'offers:update',
            // Can view custom fields but not modify
            'custom_fields:view',
            // Can view activity timeline
            'activity:view',
            // Can upload and view files
            'files:view',
            'files:upload',
            // View in-app notifications
            'notifications:view',
            // View feature flags (only Company Admin can update)
            'features:view',
            // View integrations (only Company Admin can connect/disconnect)
            'integrations:view',
            // Global search
            'search:view',
        ];
        await this.rolePermissionRepository.addPermissions(
            recruiterRole.id,
            byKey(recruiterKeys),
        );

        // Viewer: read-only permissions
        const viewerKeys = [
            'clients:read',
            'jobs:view',
            'candidates:read',
            'submissions:read',
            'interviews:read',
            'offers:read',
            // View activity timeline
            'activity:view',
            // View files
            'files:view',
            // View notifications
            'notifications:view',
            // Global search
            'search:view',
        ];
        await this.rolePermissionRepository.addPermissions(viewerRole.id, byKey(viewerKeys));

        // 3) Assign Company Admin role to initial user
        await this.userRoleRepository.assignRole(adminUserId, companyAdminRole.id, companyId);

        this.logger.log(
            `Default roles seeded for company ${companyId}. Roles: Company Admin (${companyAdminRole.id}), Recruiter (${recruiterRole.id}), Viewer (${viewerRole.id})`,
        );
    }

    /**
     * Tenant-aware permission check.
     * Resolution order:
     * 1. user_permissions overrides (grant/revoke)
     * 2. user_roles -> roles -> role_permissions -> permissions
     * 3. default deny
     */
    async userHasPermission(userId: string, companyId: string, permissionKey: string): Promise<boolean> {
        // 1) Check explicit overrides first
        const override = await this.userPermissionRepository.findNonExpiredByUser(userId, companyId);
        const matchingOverride = override.find((ov) => ov.permission?.key === permissionKey);

        if (matchingOverride) {
            if (matchingOverride.grant_type === 'grant') {
                return true;
            }
            if (matchingOverride.grant_type === 'revoke') {
                return false;
            }
        }

        // 2) Role-based permissions
        const permissions = await this.getUserPermissionsForCompany(userId, companyId);
        const has = permissions.includes(permissionKey);

        if (!has) {
            this.logger.warn(
                `Permission denied: user=${userId}, company=${companyId}, permission=${permissionKey}`,
            );
        }

        return has;
    }

    /**
     * Check if user has ANY of the permissions
     */
    async hasAnyPermission(
        userId: string,
        requiredPermissions: string[]
    ): Promise<boolean> {
        for (const permission of requiredPermissions) {
            if (await this.hasPermission(userId, permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has ALL of the permissions
     */
    async hasAllPermissions(
        userId: string,
        requiredPermissions: string[]
    ): Promise<boolean> {
        for (const permission of requiredPermissions) {
            if (!(await this.hasPermission(userId, permission))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Create custom role (stub - not implemented for single-tenant)
     */
    async createRole(
        userId: number,
        dto: CreateRoleDto
    ): Promise<Role> {
        throw new Error('Role creation not supported in single-tenant mode');
    }

    /**
     * Assign role to user (stub - not implemented for single-tenant)
     */
    async assignRoleToUser(
        userId: number,
        targetUserId: number,
        roleId: number
    ): Promise<User> {
        throw new Error('Role assignment not supported in single-tenant mode');
    }

    /**
     * Grant permission to user (stub - not implemented for single-tenant)
     */
    async grantPermission(
        userId: number,
        targetUserId: number,
        permissionId: number,
        reason?: string,
        expiresAt?: Date
    ): Promise<UserPermission> {
        throw new Error('Permission grant not supported in single-tenant mode');
    }

    /**
     * Revoke permission from user (stub - not implemented for single-tenant)
     */
    async revokePermission(
        userId: number,
        targetUserId: number,
        permissionId: number,
        reason?: string
    ): Promise<void> {
        throw new Error('Permission revoke not supported in single-tenant mode');
    }

    /**
     * Get user's role
     */
    async getUserRole(userId: number): Promise<string | null> {
        const user = await this.usersRepository.findOne({
            where: { id: userId } as any,
        });

        const roleName = user?.role ? (typeof user.role === 'object' ? (user.role as any).name : String(user.role)) : null;
        return roleName;
    }

    /**
     * Helper: Generate slug from name
     */
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    }

    /**
     * Invalidate permissions cache for user
     */
    async invalidateUserPermissionsCache(userId: number): Promise<void> {
        await this.cacheService.del(`user_permissions:${userId}`);
    }
}
