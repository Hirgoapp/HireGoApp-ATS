import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../types/tenant-context';

/**
 * @Tenant() Decorator
 * 
 * Injects the tenant context into controller methods.
 * 
 * Usage:
 *   async getCandidate(@Param('id') id: string, @Tenant() tenant: TenantContext) {
 *     // tenant.companyId is available
 *   }
 */
export const Tenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): TenantContext => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenant;
    }
);

/**
 * @CompanyId() Decorator
 * 
 * Injects only the company_id (tenant identifier) into controller methods.
 * 
 * Usage:
 *   async getCandidate(@Param('id') id: string, @CompanyId() companyId: string) {
 *     // companyId is available
 *   }
 */
export const CompanyId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenant?.companyId;
    }
);

/**
 * @UserId() Decorator
 * 
 * Injects the user ID (sub claim) into controller methods.
 * 
 * Usage:
 *   async updateProfile(@UserId() userId: string) {
 *     // userId is available
 *   }
 */
export const UserId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenant?.userId;
    }
);

/**
 * @UserRole() Decorator
 * 
 * Injects the user's role into controller methods.
 * 
 * Usage:
 *   async listUsers(@UserRole() role: string) {
 *     // role is available
 *   }
 */
export const UserRole = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenant?.role;
    }
);

/**
 * @UserPermissions() Decorator
 * 
 * Injects the user's permissions array into controller methods.
 * 
 * Usage:
 *   async updateJob(@UserPermissions() permissions: string[]) {
 *     if (!permissions.includes('jobs:edit')) throw new ForbiddenException();
 *   }
 */
export const UserPermissions = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string[] => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenant?.permissions || [];
    }
);
