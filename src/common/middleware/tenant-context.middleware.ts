import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { TenantContext, TenantRequest } from '../types/tenant-context';

/**
 * Tenant Context Middleware
 * 
 * Extracts and validates tenant context from JWT token.
 * Attaches tenant context to request object for use in controllers/services.
 * 
 * Purpose: Ensure every request has validated tenant context before reaching controllers
 * Execution: Applied globally before all endpoints
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
    constructor(private jwtService: JwtService) { }

    use(req: any, res: Response, next: NextFunction) {
        try {
            // 1. Extract JWT token from Authorization header
            const token = this.extractToken(req);

            if (!token) {
                throw new UnauthorizedException({
                    success: false,
                    error: 'MissingAuthToken',
                    message: 'Authorization token required'
                });
            }

            // 2. Validate and decode JWT token
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'your-secret-key'
            });

            // 3. Verify required fields in token payload
            // Support both camelCase 'companyId' and snake_case 'company_id'
            const userId = payload.sub || payload.userId || payload.id;
            const companyId = payload.companyId || payload.company_id;

            if (!userId || !companyId) {
                throw new UnauthorizedException({
                    success: false,
                    error: 'InvalidTokenPayload',
                    message: 'Token missing required fields (userId/sub, companyId)'
                });
            }

            // 4. Build and attach tenant context to request
            const tenantContext: TenantContext = {
                companyId: companyId,
                userId: userId,
                role: payload.role || 'viewer',
                permissions: payload.permissions || [],
                ip: req.ip || req.connection.remoteAddress || 'unknown',
                userAgent: req.get('user-agent') || 'unknown',
                timestamp: new Date(),
                licenseLevel: payload.licenseLevel,
                featureFlags: payload.featureFlags || {}
            };

            // Attach to request object for use in controllers
            (req as TenantRequest).tenant = tenantContext;

            next();
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                return res.status(401).json(error.getResponse());
            }

            const errorMessage = error instanceof Error ? error.message : 'Token validation failed';
            return res.status(401).json({
                success: false,
                error: 'AuthenticationFailed',
                message: errorMessage
            });
        }
    }

    /**
     * Extract JWT token from Authorization header
     * Expected format: "Bearer <token>"
     */
    private extractToken(req: Request): string | null {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }
}
