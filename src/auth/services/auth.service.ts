import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { AuthorizationService } from './authorization.service';
import { CacheService } from '../../common/services/cache.service';
import { AuditService } from '../../common/services/audit.service';

export interface TokenPayload {
    userId: string;
    sub?: string;
    email: string;
    companyId?: string;
    roleName?: string | null;
    permissions?: string[];
    iat?: number;
    exp?: number;
}

export interface RefreshTokenPayload {
    userId: string;
    type: 'refresh';
}

@Injectable()
export class AuthService {
    private accessTokenSecret: string;
    private refreshTokenSecret: string;
    private accessTokenExpiry: string;
    private refreshTokenExpiry: string;
    private bcryptRounds = 10;

    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,
        private readonly authorizationService: AuthorizationService,
        private readonly cacheService: CacheService,
        private readonly auditService: AuditService,
        private readonly configService: ConfigService
    ) {
        this.accessTokenSecret = this.configService.get<string>('JWT_SECRET', 'your-secret-key');
        this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'your-refresh-secret-key');
        this.accessTokenExpiry = this.configService.get<string>('JWT_EXPIRY', '1h');
        this.refreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
    }

    async login(email: string, password: string): Promise<any> {
        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user) throw new UnauthorizedException('Invalid email or password');
        if (!user.is_active) throw new UnauthorizedException('User account is inactive');

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) throw new UnauthorizedException('Invalid email or password');

        const roleStr = typeof user.role === 'object' ? (user.role as any).name : String(user.role || '');
        const companyId = user.company_id || 'default';

        // Resolve effective permissions from tenant RBAC tables when possible.
        // Fallback to legacy admin wildcard or minimal permissions if RBAC not seeded yet.
        let permissions: string[] = [];
        try {
            permissions = await this.authorizationService.getUserPermissionsForCompany(
                String(user.id),
                String(companyId),
            );
        } catch {
            const isAdmin = roleStr.toLowerCase() === 'admin' || roleStr.toLowerCase() === 'administrator';
            permissions = isAdmin ? ['*'] : ['candidates:read', 'jobs:view', 'jobs:create', 'submissions:read'];
        }

        const token = this.generateAccessToken(user, permissions);
        const refreshToken = this.generateRefreshToken(user);

        await this.usersRepository.update(user.id, { updated_at: new Date() });
        await this.auditService.log(user.company_id || null, String(user.id), {
            entityType: 'user',
            entityId: String(user.id),
            action: 'LOGIN',
        });

        return {
            token,
            refreshToken,
            user: {
                id: String(user.id),
                email: user.email,
                firstName: user.first_name,
                role: roleStr || 'recruiter',
                permissions,
                company: { id: String(companyId), name: 'hiregoapp' },
            },
        };
    }

    async logout(userId: string, companyId?: string | null): Promise<void> {
        await this.cacheService.del(`refresh_tokens:${userId}`);
        await this.auditService.log(companyId || null, userId, {
            entityType: 'user',
            entityId: userId,
            action: 'LOGOUT',
        });
    }

    async refreshToken(refreshToken: string): Promise<any> {
        try {
            const payload = jwt.verify(refreshToken, this.refreshTokenSecret) as RefreshTokenPayload;
            const isBlacklisted = await this.cacheService.get(`refresh_token_blacklist:${refreshToken}`);
            if (isBlacklisted) throw new UnauthorizedException('Refresh token has been revoked');

            const user = await this.usersRepository.findOne({ where: { id: payload.userId }, relations: ['role'] });
            if (!user || !user.is_active) throw new UnauthorizedException('User not found or inactive');

            const roleStr = typeof user.role === 'object' ? (user.role as any).name : String(user.role || '');
            const companyId = user.company_id || 'default';
            let permissions: string[] = [];
            try {
                permissions = await this.authorizationService.getUserPermissionsForCompany(
                    String(user.id),
                    String(companyId),
                );
            } catch {
                const isAdmin = roleStr.toLowerCase() === 'admin' || roleStr.toLowerCase() === 'administrator';
                permissions = isAdmin ? ['*'] : ['candidates:read', 'jobs:view', 'jobs:create', 'submissions:read'];
            }

            return {
                token: this.generateAccessToken(user, permissions),
                refreshToken: this.generateRefreshToken(user),
            };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException('Refresh token has expired');
            }
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async verifyToken(token: string): Promise<TokenPayload> {
        try {
            return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    generateAccessToken(user: User, permissions: string[]): string {
        const payload: TokenPayload = {
            userId: user.id,
            sub: String(user.id),
            email: user.email,
            companyId: user.company_id || 'default',
            permissions,
        };
        return jwt.sign(payload, this.accessTokenSecret as any, { expiresIn: this.accessTokenExpiry } as any);
    }

    generateRefreshToken(user: User): string {
        const payload: RefreshTokenPayload = { userId: user.id, type: 'refresh' };
        return jwt.sign(payload, this.refreshTokenSecret as any, { expiresIn: this.refreshTokenExpiry } as any);
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.bcryptRounds);
    }

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    async blacklistRefreshToken(refreshToken: string, ttl: number = 604800): Promise<void> {
        await this.cacheService.set(`refresh_token_blacklist:${refreshToken}`, true, ttl);
    }
}
