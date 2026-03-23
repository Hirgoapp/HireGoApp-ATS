import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ConflictException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { SuperAdminUser } from '../entities/super-admin-user.entity';
import { CacheService } from '../../common/services/cache.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class SuperAdminAuthService {
    private bcryptRounds = 10;

    constructor(
        @InjectRepository(SuperAdminUser)
        private readonly superAdminUsersRepository: Repository<SuperAdminUser>,
        private readonly cacheService: CacheService,
        private readonly auditService: AuditService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService
    ) { }

    /**
     * Login super admin with email and password
     */
    async login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
        };
    }> {
        console.log('🔍 Super Admin Login Attempt:', { email });

        // Find super admin user by email
        let user: SuperAdminUser | null;

        try {
            user = await this.superAdminUsersRepository.findOne({
                where: { email },
            });
            console.log('🔍 User found:', user ? `YES (${user.email})` : 'NO');
        } catch (error) {
            console.error('❌ Database error:', error.message);
            if (error instanceof QueryFailedError && error.message.includes('super_admin_users')) {
                throw new ServiceUnavailableException('Super admin schema not initialized. Run migrations.');
            }

            throw error;
        }

        if (!user) {
            console.log('❌ Login failed: User not found');
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!user.is_active) {
            console.log('❌ Login failed: Account inactive');
            throw new UnauthorizedException('Super Admin account is inactive');
        }

        // Verify password
        console.log('🔍 Verifying password...');
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log('🔍 Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('❌ Login failed: Invalid password');
            throw new UnauthorizedException('Invalid email or password');
        }

        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        // Update last login
        user.last_login_at = new Date();
        await this.superAdminUsersRepository.save(user);

        // Log audit event - no company for super admin (null)
        // Audit service takes (companyId, userId, context) - but super admin has no company
        // So we skip audit for now or pass null values
        try {
            await this.auditService.log(null, user.id, {
                entityType: 'SuperAdminUser',
                entityId: user.id,
                action: 'LOGIN',
                newValues: { lastLoginAt: new Date().toISOString() },
            });
        } catch (e) {
            // Audit failure shouldn't break login
        }

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
            },
        };
    }

    /**
     * Refresh super admin token
     */
    async refreshToken(
        refreshToken: string
    ): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('SUPER_ADMIN_JWT_REFRESH_SECRET', 'super-admin-refresh-secret'),
            }) as any;

            if (payload.type !== 'super_admin_refresh') {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Get user
            const user = await this.superAdminUsersRepository.findOne({
                where: { id: payload.userId },
            });

            if (!user || !user.is_active) {
                throw new UnauthorizedException('User not found or inactive');
            }

            // Generate new tokens
            const newAccessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Create a new super admin user (admin only, for creating support/ops accounts)
     */
    async createSuperAdminUser(data: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role?: string;
        phone?: string;
    }): Promise<SuperAdminUser> {
        // Check if user already exists
        const existingUser = await this.superAdminUsersRepository.findOne({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictException('Super admin user with this email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, this.bcryptRounds);

        // Create user
        const user = this.superAdminUsersRepository.create({
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            password_hash: passwordHash,
            role: data.role || 'super_admin',
            phone: data.phone,
            is_active: true,
            permissions: {},
            preferences: {},
        });

        const savedUser = await this.superAdminUsersRepository.save(user);

        // Log audit event
        try {
            await this.auditService.log(null, savedUser.id, {
                entityType: 'SuperAdminUser',
                entityId: savedUser.id,
                action: 'CREATE',
                newValues: { email: savedUser.email, role: savedUser.role },
            });
        } catch (e) {
            // Audit failure shouldn't break creation
        }

        return savedUser;
    }

    /**
     * Get super admin user by ID
     */
    async getSuperAdminUser(id: string): Promise<SuperAdminUser> {
        const user = await this.superAdminUsersRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new BadRequestException('Super admin user not found');
        }

        return user;
    }

    /**
     * Get all super-admin users with pagination
     */
    async getAllSuperAdminUsers(
        page: number = 1,
        limit: number = 20,
        search?: string
    ): Promise<{
        users: SuperAdminUser[];
        pagination: { page: number; limit: number; total: number };
    }> {
        let query = this.superAdminUsersRepository.createQueryBuilder('user');

        if (search) {
            query = query.where(
                'user.email ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search',
                { search: `%${search}%` }
            );
        }

        const total = await query.getCount();

        const users = await query
            .orderBy('user.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            users,
            pagination: { page, limit, total },
        };
    }

    /**
     * Update super admin user
     */
    async updateSuperAdminUser(
        id: string,
        data: Partial<{
            firstName: string;
            lastName: string;
            phone: string;
            role: string;
            isActive: boolean;
            preferences: Record<string, any>;
        }>
    ): Promise<SuperAdminUser> {
        const user = await this.getSuperAdminUser(id);

        const updates: Partial<SuperAdminUser> = {};

        if (data.firstName !== undefined) updates.first_name = data.firstName;
        if (data.lastName !== undefined) updates.last_name = data.lastName;
        if (data.phone !== undefined) updates.phone = data.phone;
        if (data.role !== undefined) updates.role = data.role;
        if (data.isActive !== undefined) updates.is_active = data.isActive;
        if (data.preferences !== undefined) updates.preferences = data.preferences;

        const updatedUser = await this.superAdminUsersRepository.save({
            ...user,
            ...updates,
        });

        // Log audit event
        try {
            await this.auditService.log(null, id, {
                entityType: 'SuperAdminUser',
                entityId: user.id,
                action: 'UPDATE',
                newValues: updates,
            });
        } catch (e) {
            // Audit failure shouldn't break update
        }

        return updatedUser;
    }

    /**
     * Change password for super admin user
     */
    async changePassword(
        userId: string,
        oldPassword: string,
        newPassword: string
    ): Promise<void> {
        const user = await this.getSuperAdminUser(userId);

        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, this.bcryptRounds);

        // Update password
        user.password_hash = passwordHash;
        await this.superAdminUsersRepository.save(user);

        // Log audit event
        try {
            await this.auditService.log(null, userId, {
                entityType: 'SuperAdminUser',
                entityId: user.id,
                action: 'PASSWORD_CHANGE',
                newValues: { passwordChanged: true },
            });
        } catch (e) {
            // Audit failure shouldn't break password change
        }
    }

    /**
     * Generate access token for super admin
     */
    private generateAccessToken(user: SuperAdminUser): string {
        const payload = {
            userId: user.id,
            email: user.email,
            type: 'super_admin',
            role: user.role,
            permissions: ['*'], // Super admin has all permissions
        };

        return this.jwtService.sign(payload, {
            expiresIn: '24h',
            secret: this.configService.get('SUPER_ADMIN_JWT_SECRET', 'super-admin-secret'),
        });
    }

    /**
     * Generate refresh token for super admin
     */
    private generateRefreshToken(user: SuperAdminUser): string {
        const payload = {
            userId: user.id,
            type: 'super_admin_refresh',
        };

        return this.jwtService.sign(payload, {
            expiresIn: '7d',
            secret: this.configService.get('SUPER_ADMIN_JWT_REFRESH_SECRET', 'super-admin-refresh-secret'),
        });
    }
}
