import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
    Query,
    HttpCode,
    HttpStatus,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from '../services/authorization.service';
import { RoleRepository } from '../repositories/role.repository';
import { RolePermissionAuditRepository } from '../repositories/role-permission-audit.repository';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { AssignRoleDto } from '../dtos/assign-role.dto';
import { GrantPermissionDto } from '../dtos/grant-permission.dto';
import { RevokePermissionDto } from '../dtos/revoke-permission.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { PermissionRepository } from '../repositories/permission.repository';
import { RolePermissionRepository } from '../repositories/role-permission.repository';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Controller('api/v1/rbac')
@UseGuards(TenantGuard)
export class RbacController {
    constructor(
        private readonly authorizationService: AuthorizationService,
        private readonly roleRepository: RoleRepository,
        private readonly auditRepository: RolePermissionAuditRepository,
        private readonly permissionRepository: PermissionRepository,
        private readonly rolePermissionRepository: RolePermissionRepository,
        private readonly userRoleRepository: UserRoleRepository,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    /**
     * GET /api/v1/rbac/roles
     * Get all roles for this tenant (and optional system roles)
     */
    @Get('roles')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async getRoles(@Req() req: any, @Query('includeSystem') includeSystem?: string) {
        const companyId = String(req.tenant.companyId);
        const all = await this.roleRepository.findAll();
        const include = includeSystem === 'true';
        const roles = all.filter((r) => r.company_id === companyId || (include && r.company_id === null));
        return {
            success: true,
            data: { roles },
        };
    }

    /**
     * GET /api/v1/rbac/roles/:roleId
     * Get specific role
     */
    @Get('roles/:roleId')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async getRole(@Req() req: any, @Param('roleId') roleId: string) {
        const role = await this.roleRepository.findById(roleId);
        if (!role) throw new NotFoundException('Role not found');
        const companyId = String(req.tenant.companyId);
        if (role.company_id && role.company_id !== companyId) {
            throw new NotFoundException('Role not found');
        }
        return {
            success: true,
            data: { role },
        };
    }

    /**
     * GET /api/v1/rbac/permissions
     * List all active permissions (global definitions)
     */
    @Get('permissions')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async getPermissions() {
        const permissions = await this.permissionRepository.listActivePermissions();
        return { success: true, data: { permissions } };
    }

    /**
     * GET /api/v1/rbac/roles/:roleId/permissions
     * Get permissions for a role (keys)
     */
    @Get('roles/:roleId/permissions')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async getRolePermissions(@Req() req: any, @Param('roleId') roleId: string) {
        const role = await this.roleRepository.findById(roleId);
        if (!role) throw new NotFoundException('Role not found');
        const companyId = String(req.tenant.companyId);
        if (role.company_id && role.company_id !== companyId) {
            throw new NotFoundException('Role not found');
        }

        const rolePermissions = await this.rolePermissionRepository.findByRoleId(roleId);
        const keys = rolePermissions
            .filter((rp) => rp.permission?.is_active)
            .map((rp) => rp.permission.key);

        return { success: true, data: { roleId, keys } };
    }

    /**
     * PUT /api/v1/rbac/roles/:roleId/permissions
     * Replace role permissions (by permission keys). Tenant roles only.
     */
    @Put('roles/:roleId/permissions')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async setRolePermissions(
        @Req() req: any,
        @Param('roleId') roleId: string,
        @Body() body: { keys: string[] },
    ) {
        const companyId = String(req.tenant.companyId);
        const userId = String(req.tenant.userId);

        const role = await this.roleRepository.findById(roleId);
        if (!role) throw new NotFoundException('Role not found');
        if (!role.company_id || role.company_id !== companyId) {
            throw new BadRequestException('Only tenant roles can be modified');
        }

        const keys = Array.isArray(body.keys) ? body.keys : [];
        const active = await this.permissionRepository.listActivePermissions();
        const idByKey = new Map(active.map((p) => [p.key, p.id]));
        const permissionIds = keys.map((k) => idByKey.get(k)).filter((v): v is string => !!v);

        await this.rolePermissionRepository.removeAllPermissions(roleId);
        if (permissionIds.length > 0) {
            await this.rolePermissionRepository.addPermissions(roleId, permissionIds);
        }

        // audit (lightweight)
        await this.auditRepository.log({
            company_id: companyId,
            user_id: userId,
            action: 'ROLE_PERMISSIONS_REPLACED',
            role_id: roleId,
            new_values: { keys },
        } as any);

        return { success: true };
    }

    /**
     * GET /api/v1/rbac/users
     * List users in this tenant (for role assignment UI)
     */
    @Get('users')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async listUsers(@Req() req: any) {
        const companyId = String(req.tenant.companyId);
        const users = await this.usersRepository.find({
            where: { company_id: companyId } as any,
            order: { created_at: 'DESC' } as any,
        });
        return {
            success: true,
            data: {
                users: users.map((u) => ({
                    id: String(u.id),
                    email: u.email,
                    firstName: u.first_name,
                    lastName: u.last_name,
                    role: u.role,
                    isActive: u.is_active,
                    createdAt: u.created_at,
                })),
            },
        };
    }

    /**
     * GET /api/v1/rbac/users/:userId/roles
     */
    @Get('users/:userId/roles')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async getUserRoles(@Req() req: any, @Param('userId') userId: string) {
        const companyId = String(req.tenant.companyId);
        const roles = await this.userRoleRepository.getUserRoles(userId, companyId);
        return {
            success: true,
            data: {
                userId,
                roles: roles.map((ur) => ({ id: ur.role.id, name: ur.role.name, slug: ur.role.slug })),
            },
        };
    }

    /**
     * PUT /api/v1/rbac/users/:userId/roles
     * Replace user roles for this tenant.
     */
    @Put('users/:userId/roles')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async setUserRoles(
        @Req() req: any,
        @Param('userId') userId: string,
        @Body() body: { roleIds: string[] },
    ) {
        const companyId = String(req.tenant.companyId);
        const roleIds = Array.isArray(body.roleIds) ? body.roleIds : [];

        // Ensure roles belong to this tenant (no global/system roles)
        const roles = await this.roleRepository.findAll();
        const allowed = new Set(roles.filter((r) => r.company_id === companyId).map((r) => r.id));
        const filtered = roleIds.filter((id) => allowed.has(id));

        await this.userRoleRepository.clearUserRoles(userId, companyId);
        for (const roleId of filtered) {
            await this.userRoleRepository.assignRole(userId, roleId, companyId);
        }

        return { success: true };
    }

    /**
     * POST /api/v1/rbac/roles
     * Create new tenant role
     */
    @Post('roles')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async createRole(@Body() dto: CreateRoleDto, @Req() request: any) {
        const companyId = String(request.tenant.companyId);
        const userId = String(request.tenant.userId);

        const name = (dto.name || '').trim();
        if (!name) throw new BadRequestException('Role name is required');

        const slug =
            (dto.slug || '')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_]+/g, '_')
                .replace(/^_+|_+$/g, '') || name.toLowerCase().replace(/[^a-z0-9_]+/g, '_');

        // ensure slug unique within tenant
        const existing = (await this.roleRepository.findAll()).find(
            (r) => r.company_id === companyId && r.slug === slug,
        );
        if (existing) throw new BadRequestException('Role slug already exists');

        const role = await this.roleRepository.create({
            company_id: companyId,
            name,
            slug,
            description: dto.description ?? null,
            is_system: false,
            is_default: false,
            display_order: 99,
        });

        // Optional: assign permissionIds if provided
        if (dto.permissionIds && Array.isArray(dto.permissionIds) && dto.permissionIds.length > 0) {
            await this.rolePermissionRepository.addPermissions(role.id, dto.permissionIds);
        }

        await this.auditRepository.log({
            company_id: companyId,
            user_id: userId,
            action: 'ROLE_CREATED',
            role_id: role.id,
            new_values: { name, slug, description: dto.description ?? null },
            reason: dto.reason ?? null,
        } as any);

        return { success: true, data: { role } };
    }

    /**
     * PUT /api/v1/rbac/roles/:roleId
     * Update tenant role (name/description)
     */
    @Put('roles/:roleId')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async updateRole(
        @Req() req: any,
        @Param('roleId') roleId: string,
        @Body() body: { name?: string; description?: string; display_order?: number }
    ) {
        const companyId = String(req.tenant.companyId);
        const userId = String(req.tenant.userId);
        const role = await this.roleRepository.findById(roleId);
        if (!role) throw new NotFoundException('Role not found');
        if (!role.company_id || role.company_id !== companyId) {
            throw new BadRequestException('Only tenant roles can be modified');
        }

        const updates: any = {};
        if (body.name !== undefined) updates.name = String(body.name).trim();
        if (body.description !== undefined) updates.description = body.description ?? null;
        if (body.display_order !== undefined) updates.display_order = body.display_order;

        const updated = await this.roleRepository.update(roleId, updates);

        await this.auditRepository.log({
            company_id: companyId,
            user_id: userId,
            action: 'ROLE_UPDATED',
            role_id: roleId,
            new_values: updates,
        } as any);

        return { success: true, data: { role: updated } };
    }

    /**
     * DELETE /api/v1/rbac/roles/:roleId
     * Soft delete tenant role
     */
    @Delete('roles/:roleId')
    @UseGuards(PermissionGuard)
    @RequirePermissions('roles:manage')
    async deleteRole(@Req() req: any, @Param('roleId') roleId: string) {
        const companyId = String(req.tenant.companyId);
        const userId = String(req.tenant.userId);
        const role = await this.roleRepository.findById(roleId);
        if (!role) throw new NotFoundException('Role not found');
        if (!role.company_id || role.company_id !== companyId) {
            throw new BadRequestException('Only tenant roles can be deleted');
        }
        if (role.slug === 'company_admin') {
            throw new BadRequestException('Cannot delete Company Admin role');
        }

        await this.roleRepository.softDelete(roleId);
        await this.auditRepository.log({
            company_id: companyId,
            user_id: userId,
            action: 'ROLE_DELETED',
            role_id: roleId,
        } as any);
        return { success: true };
    }

    /**
     * POST /api/v1/rbac/users
     * Create a tenant user and assign roles
     */
    @Post('users')
    @UseGuards(PermissionGuard)
    @RequirePermissions('users:create')
    async createUser(
        @Req() req: any,
        @Body() body: { email: string; firstName?: string; lastName?: string; password: string; roleIds?: string[] }
    ) {
        const companyId = String(req.tenant.companyId);
        const actorUserId = String(req.tenant.userId);

        if (!body.email || !body.password) {
            throw new BadRequestException('email and password are required');
        }
        if (body.password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        const existing = await this.usersRepository.findOne({
            where: { company_id: companyId, email: body.email } as any,
        });
        if (existing) {
            throw new BadRequestException('Email already exists in this company');
        }

        const password_hash = await bcrypt.hash(body.password, 10);
        const user = await this.usersRepository.save({
            company_id: companyId,
            email: body.email,
            first_name: body.firstName ?? '',
            last_name: body.lastName ?? '',
            password_hash,
            is_active: true,
            email_verified: false,
            role: 'recruiter',
            permissions: {},
            preferences: {},
        } as any);

        // Assign roles if provided; otherwise assign default role (company default if exists)
        const roles = await this.roleRepository.findAll();
        const tenantRoles = roles.filter((r) => r.company_id === companyId);
        const allowed = new Set(tenantRoles.map((r) => r.id));
        const roleIds = (body.roleIds || []).filter((id) => allowed.has(id));

        if (roleIds.length === 0) {
            const def = tenantRoles.find((r) => r.is_default);
            if (def) roleIds.push(def.id);
        }

        for (const roleId of roleIds) {
            await this.userRoleRepository.assignRole(String(user.id), roleId, companyId);
        }

        await this.auditRepository.log({
            company_id: companyId,
            user_id: actorUserId,
            action: 'USER_CREATED',
            new_values: { createdUserId: String(user.id), email: user.email, roleIds },
        } as any);

        return {
            success: true,
            data: {
                user: {
                    id: String(user.id),
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isActive: user.is_active,
                    createdAt: user.created_at,
                },
            },
        };
    }

    /**
     * PUT /api/v1/rbac/users/:userId
     * Update tenant user profile / status
     */
    @Put('users/:userId')
    @UseGuards(PermissionGuard)
    @RequirePermissions('users:update')
    async updateUser(
        @Req() req: any,
        @Param('userId') userId: string,
        @Body() body: { firstName?: string; lastName?: string; email?: string; isActive?: boolean; password?: string }
    ) {
        const companyId = String(req.tenant.companyId);
        const actorUserId = String(req.tenant.userId);

        const user = await this.usersRepository.findOne({ where: { id: userId, company_id: companyId } as any });
        if (!user) throw new NotFoundException('User not found');

        const updates: any = {};
        if (body.firstName !== undefined) updates.first_name = body.firstName;
        if (body.lastName !== undefined) updates.last_name = body.lastName;
        if (body.email !== undefined) updates.email = body.email;
        if (body.isActive !== undefined) updates.is_active = body.isActive;
        if (body.password !== undefined) {
            if (body.password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
            updates.password_hash = await bcrypt.hash(body.password, 10);
            updates.email_verified = false;
        }

        await this.usersRepository.update(userId, updates);

        await this.auditRepository.log({
            company_id: companyId,
            user_id: actorUserId,
            action: 'USER_UPDATED',
            new_values: { userId: String(user.id), ...updates, passwordUpdated: body.password ? true : undefined },
        } as any);

        return { success: true };
    }

    /**
     * GET /api/v1/rbac/users/:userId
     * Get a tenant user (basic profile)
     */
    @Get('users/:userId')
    @UseGuards(PermissionGuard)
    @RequirePermissions('users:read')
    async getUser(@Req() req: any, @Param('userId') userId: string) {
        const companyId = String(req.tenant.companyId);
        const user = await this.usersRepository.findOne({ where: { id: userId, company_id: companyId } as any });
        if (!user) throw new NotFoundException('User not found');
        return {
            success: true,
            data: {
                user: {
                    id: String(user.id),
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isActive: user.is_active,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at,
                },
            },
        };
    }

    /**
     * DELETE /api/v1/rbac/users/:userId
     * Deactivate a tenant user (safe delete)
     */
    @Delete('users/:userId')
    @UseGuards(PermissionGuard)
    @RequirePermissions('users:delete')
    async deactivateUser(@Req() req: any, @Param('userId') userId: string) {
        const companyId = String(req.tenant.companyId);
        const actorUserId = String(req.tenant.userId);

        const user = await this.usersRepository.findOne({ where: { id: userId, company_id: companyId } as any });
        if (!user) throw new NotFoundException('User not found');

        // Prevent self-deactivation via this endpoint
        if (String(user.id) === String(actorUserId)) {
            throw new BadRequestException('You cannot deactivate your own account');
        }

        await this.usersRepository.update(userId, { is_active: false } as any);
        await this.auditRepository.log({
            company_id: companyId,
            user_id: actorUserId,
            action: 'USER_DEACTIVATED',
            new_values: { userId },
        } as any);
        return { success: true };
    }

    /**
     * POST /api/v1/rbac/users/:userId/role (stub)
     */
    @Post('users/:userId/role')
    @UseGuards(PermissionGuard)
    @RequirePermissions('users:update')
    @HttpCode(HttpStatus.NOT_IMPLEMENTED)
    async assignRole(
        @Param('userId') userId: string,
        @Body() dto: AssignRoleDto,
        @Req() request: any
    ) {
        return {
            success: false,
            message: 'Role assignment not supported in single-tenant mode',
        };
    }

    /**
     * POST /api/v1/rbac/users/:userId/permissions/grant (stub)
     */
    @Post('users/:userId/permissions/grant')
    @UseGuards(PermissionGuard)
    @RequirePermissions('users:update')
    @HttpCode(HttpStatus.NOT_IMPLEMENTED)
    async grantPermission(
        @Param('userId') userId: string,
        @Body() dto: GrantPermissionDto,
        @Req() request: any
    ) {
        return {
            success: false,
            message: 'Permission grant not supported in single-tenant mode',
        };
    }

    /**
     * POST /api/v1/rbac/users/:userId/permissions/revoke (stub)
     */
    @Post('users/:userId/permissions/revoke')
    @UseGuards(PermissionGuard)
    @RequirePermissions('users:update')
    @HttpCode(HttpStatus.NOT_IMPLEMENTED)
    async revokePermission(
        @Param('userId') userId: string,
        @Body() dto: RevokePermissionDto,
        @Req() request: any
    ) {
        return {
            success: false,
            message: 'Permission revoke not supported in single-tenant mode',
        };
    }

    /**
     * GET /api/v1/rbac/audit (stub)
     */
    @Get('audit')
    @UseGuards(PermissionGuard)
    @RequirePermissions('audit:view')
    async getAudit(
        @Req() request: any,
        @Query('limit') limit: string = '100',
        @Query('offset') offset: string = '0'
    ) {
        return {
            success: true,
            data: { auditEntries: [], total: 0, limit, offset },
        };
    }

    /**
     * GET /api/v1/rbac/audit/user/:userId (stub)
     */
    @Get('audit/user/:userId')
    @UseGuards(PermissionGuard)
    @RequirePermissions('audit:view')
    async getAuditByUser(
        @Param('userId') userId: string,
        @Req() request: any,
        @Query('limit') limit: string = '100',
        @Query('offset') offset: string = '0'
    ) {
        return {
            success: true,
            data: { auditEntries: [], limit, offset },
        };
    }
}
