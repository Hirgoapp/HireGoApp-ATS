import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../services/authorization.service';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly authorizationService: AuthorizationService,
        private readonly reflector: Reflector
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Get required permissions from decorator
        const requiredPermissions = this.reflector.get<string[]>(
            'REQUIRED_PERMISSIONS',
            context.getHandler()
        );

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true; // No permission check required
        }

        const request = context.switchToHttp().getRequest();
        const tenant = request.tenant;

        if (!tenant || !tenant.userId || !tenant.companyId) {
            throw new ForbiddenException('Tenant context missing');
        }

        const userId = String(tenant.userId);
        const companyId = String(tenant.companyId);

        // Check if user has ALL required permissions in this company
        for (const perm of requiredPermissions) {
            const allowed = await this.authorizationService.userHasPermission(
                userId,
                companyId,
                perm,
            );
            if (!allowed) {
                throw new ForbiddenException(
                    `Missing required permissions: ${requiredPermissions.join(', ')}`,
                );
            }
        }

        return true;
    }
}
