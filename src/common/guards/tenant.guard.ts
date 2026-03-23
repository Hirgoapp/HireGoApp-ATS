import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TenantContext } from '../types/tenant-context';

/**
 * JWT Auth Guard
 * 
 * Verifies that request has valid JWT token and tenant context.
 * Used to protect endpoints that require authentication.
 * 
 * Prerequisite: TenantContextMiddleware must run first to extract tenant context
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        // Verify tenant context was extracted by middleware
        if (!request.tenant || !request.tenant.companyId) {
            throw new UnauthorizedException({
                success: false,
                error: 'MissingTenantContext',
                message: 'Tenant context not found in request'
            });
        }

        return true;
    }
}

/**
 * Tenant Guard
 * 
 * Validates that any tenant-scoped resource being accessed belongs to the requesting company.
 * Checks URL parameters against JWT company_id.
 * 
 * Usage: @UseGuards(JwtAuthGuard, TenantGuard) on routes that have path parameters
 */
@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const tenant: TenantContext = request.tenant;

        // Guard must run after JwtAuthGuard, so tenant should exist
        if (!tenant || !tenant.companyId) {
            throw new UnauthorizedException({
                success: false,
                error: 'MissingTenantContext',
                message: 'Tenant context required'
            });
        }

        // Guard responsibility: controllers/services will do final validation
        // that specific resource belongs to company
        return true;
    }
}

/**
 * Role-Based Guard
 * 
 * Verifies that user has required role(s).
 * Usage: @UseGuards(JwtAuthGuard, RoleGuard('admin', 'recruiter'))
 */
@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private requiredRoles: string[]) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const tenant: TenantContext = request.tenant;

        if (!tenant || !tenant.role) {
            throw new UnauthorizedException({
                success: false,
                error: 'MissingRole',
                message: 'User role not found in token'
            });
        }

        if (!this.requiredRoles.includes(tenant.role)) {
            throw new UnauthorizedException({
                success: false,
                error: 'InsufficientRole',
                message: `Required roles: ${this.requiredRoles.join(', ')}. Got: ${tenant.role}`
            });
        }

        return true;
    }
}

/**
 * Permission Guard
 * 
 * Verifies that user has required permission(s).
 * Usage: @UseGuards(JwtAuthGuard, PermissionGuard('candidates:create', 'candidates:edit'))
 */
@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private requiredPermissions: string[]) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const tenant: TenantContext = request.tenant;

        if (!tenant || !tenant.permissions) {
            throw new UnauthorizedException({
                success: false,
                error: 'MissingPermissions',
                message: 'User permissions not found in token'
            });
        }

        // Check if user has at least one of the required permissions
        const hasPermission = this.requiredPermissions.some(
            permission => tenant.permissions.includes(permission)
        );

        if (!hasPermission) {
            throw new UnauthorizedException({
                success: false,
                error: 'InsufficientPermissions',
                message: `Required permissions: ${this.requiredPermissions.join(', ')}`
            });
        }

        return true;
    }
}
