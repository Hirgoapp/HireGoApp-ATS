import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../services/authorization.service';
import { AuditService } from '../../common/services/audit.service';
import { PermissionRepository } from '../repositories/permission.repository';

@Injectable()
export class SensitiveActionInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly authorizationService: AuthorizationService,
        private readonly auditService: AuditService,
        private readonly permissionRepository: PermissionRepository
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const { companyId, userId } = request.tenant || {};

        // Get required permissions from decorator
        const requiredPermissions = this.reflector.get<string[]>(
            'REQUIRED_PERMISSIONS',
            context.getHandler()
        );

        const anyPermissions = this.reflector.get<string[]>(
            'ANY_PERMISSION',
            context.getHandler()
        );

        const allPermissions = [
            ...(requiredPermissions || []),
            ...(anyPermissions || []),
        ];

        // Check if any of the required permissions are sensitive
        if (allPermissions.length > 0 && userId) {
            try {
                // Simplified: In single-tenant mode, all admin permissions are considered sensitive
                // No need to query database for is_sensitive field since it doesn't exist
                const adminPermissions = ['users:delete', 'roles:delete', 'permissions:delete'];
                const hasSensitivePermission = allPermissions.some((perm) =>
                    adminPermissions.includes(perm)
                );

                if (hasSensitivePermission) {
                    // Log sensitive action access attempt
                    const matchingSensitivePerms = allPermissions.filter((perm) =>
                        adminPermissions.includes(perm)
                    );

                    // Get additional request context
                    const ipAddress = this.getClientIp(request);
                    const method = request.method;
                    const path = request.path;
                    const userAgent = request.get('user-agent');

                    // Log to audit trail
                    await this.auditService.log('SYSTEM', String(userId), {
                        entityType: 'sensitive_action',
                        entityId: `${method}:${path}`,
                        action: 'SENSITIVE_ACTION_ATTEMPTED',
                        details: {
                            permissions: matchingSensitivePerms,
                            method,
                            path,
                            ipAddress,
                            userAgent,
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
            } catch (error) {
                // Silently fail - don't block the request if audit fails
                console.error('Error in SensitiveActionInterceptor:', error);
            }
        }

        return next.handle().pipe(
            tap(async (data) => {
                // Log successful sensitive action
                if (allPermissions.length > 0 && userId) {
                    try {
                        const adminPermissions = ['users:delete', 'roles:delete', 'permissions:delete'];
                        const hasSensitivePermission = allPermissions.some((perm) =>
                            adminPermissions.includes(perm)
                        );

                        if (hasSensitivePermission) {
                            const matchingSensitivePerms = allPermissions.filter((perm) =>
                                adminPermissions.includes(perm)
                            );

                            const ipAddress = this.getClientIp(request);
                            const method = request.method;
                            const path = request.path;

                            // Log successful sensitive action
                            await this.auditService.log('SYSTEM', String(userId), {
                                entityType: 'sensitive_action',
                                entityId: `${method}:${path}`,
                                action: 'SENSITIVE_ACTION_COMPLETED',
                                details: {
                                    permissions: matchingSensitivePerms,
                                    method,
                                    path,
                                    ipAddress,
                                    timestamp: new Date().toISOString(),
                                },
                            });
                        }
                    } catch (error) {
                        console.error('Error logging sensitive action completion:', error);
                    }
                }
            })
        );
    }

    /**
     * Helper: Get client IP from request
     */
    private getClientIp(request: any): string {
        return (
            request.ip ||
            request.headers['x-forwarded-for']?.split(',')[0].trim() ||
            request.socket?.remoteAddress ||
            'unknown'
        );
    }
}
