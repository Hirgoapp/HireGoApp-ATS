import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard to ensure only Super Admin users can access endpoints
 * Checks that token type is 'super_admin'
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest();

        // Extract token from Authorization header
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            // Verify token with super admin secret
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('SUPER_ADMIN_JWT_SECRET', 'super-admin-secret'),
            }) as any;

            // Check token type
            if (payload.type !== 'super_admin') {
                throw new ForbiddenException('Super Admin access required');
            }

            // Ensure user ID is present
            if (!payload.userId) {
                throw new UnauthorizedException('Invalid token');
            }

            // Attach user to request for use in controllers
            (request as any).user = payload;

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private extractToken(request: Request): string | null {
        const authHeader = request.headers.authorization;
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

/**
 * Guard to ensure only Company Users can access endpoints
 * Checks that token type is 'company_user' and company_id is present
 * Prevents Super Admin tokens from being used on company endpoints
 */
@Injectable()
export class CompanyUserGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest();

        const user = request.user as any;

        if (!user) {
            throw new UnauthorizedException('No token provided');
        }

        // Reject if this is a super admin token
        if (user.type === 'super_admin') {
            throw new ForbiddenException('Super Admin tokens cannot access company endpoints');
        }

        // Check token type
        if (user.type !== 'company_user') {
            throw new ForbiddenException('Company user access required');
        }

        // Ensure company_id and user ID are present
        if (!user.companyId) {
            throw new UnauthorizedException('No company_id in token');
        }

        if (!user.userId) {
            throw new UnauthorizedException('Invalid token');
        }

        return true;
    }
}

/**
 * Guard to allow both Super Admin and Company Users
 * Used for endpoints that both types should access
 */
@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest();

        const user = request.user as any;

        if (!user) {
            throw new UnauthorizedException('No token provided');
        }

        // Ensure user ID is present
        if (!user.userId) {
            throw new UnauthorizedException('Invalid token');
        }

        return true;
    }
}
