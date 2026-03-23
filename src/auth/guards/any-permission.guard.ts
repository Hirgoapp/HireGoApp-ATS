import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../services/authorization.service';

@Injectable()
export class AnyPermissionGuard implements CanActivate {
    constructor(
        private readonly authorizationService: AuthorizationService,
        private readonly reflector: Reflector
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Get required permissions from decorator
        const requiredPermissions = this.reflector.get<string[]>(
            'ANY_PERMISSION',
            context.getHandler()
        );

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true; // No permission check required
        }

        const request = context.switchToHttp().getRequest();
        const { userId } = request.tenant;

        if (!userId) {
            throw new ForbiddenException('Tenant context missing');
        }

        // Check if user has ANY of the required permissions
        const hasPermission = await this.authorizationService.hasAnyPermission(
            String(userId),
            requiredPermissions
        );

        if (!hasPermission) {
            throw new ForbiddenException(
                `User must have at least one of these permissions: ${requiredPermissions.join(', ')}`
            );
        }

        return true;
    }
}
