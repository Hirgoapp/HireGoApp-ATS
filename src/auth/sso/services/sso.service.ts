import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SsoConfiguration, SsoProvider } from '../entities/sso-configuration.entity';
import { SsoSession } from '../entities/sso-session.entity';
import { User } from '../../entities/user.entity';
import { AuthService } from '../../services/auth.service';
import { CreateSsoConfigDto, UpdateSsoConfigDto } from '../dto/sso-config.dto';

export interface SsoUserProfile {
    provider: string;
    providerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    groups?: string[];
    attributes?: any;
}

@Injectable()
export class SsoService {
    private readonly logger = new Logger(SsoService.name);

    constructor(
        @InjectRepository(SsoConfiguration)
        private ssoConfigRepo: Repository<SsoConfiguration>,
        @InjectRepository(SsoSession)
        private ssoSessionRepo: Repository<SsoSession>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private jwtService: JwtService,
        private authService: AuthService,
        private configService: ConfigService,
    ) { }

    /**
     * Get SSO configuration for a company and provider
     */
    async getSsoConfig(companyId: string, provider: SsoProvider): Promise<SsoConfiguration> {
        const config = await this.ssoConfigRepo.findOne({
            where: { company_id: companyId, provider, is_active: true },
        });

        if (!config) {
            throw new BadRequestException(`SSO configuration not found for provider: ${provider}`);
        }

        return config;
    }

    /**
     * Get SSO configuration by email domain
     */
    async getSsoConfigByEmail(email: string): Promise<SsoConfiguration | null> {
        const domain = email.split('@')[1];
        if (!domain) return null;

        return this.ssoConfigRepo.findOne({
            where: { domain: `@${domain}`, is_active: true },
        });
    }

    /**
     * Create SSO configuration for a company
     */
    async createSsoConfig(
        companyId: string,
        dto: CreateSsoConfigDto,
        createdBy: string,
    ): Promise<SsoConfiguration> {
        const config = this.ssoConfigRepo.create({
            company_id: companyId,
            provider: dto.provider,
            configuration: dto.configuration,
            attribute_mapping: dto.attribute_mapping,
            role_mapping: dto.role_mapping,
            is_active: dto.is_active ?? true,
            enable_jit_provisioning: dto.enable_jit_provisioning ?? false,
            domain: dto.domain,
            metadata_xml: dto.metadata_xml,
            created_by: createdBy,
        });

        return this.ssoConfigRepo.save(config);
    }

    /**
     * Update SSO configuration
     */
    async updateSsoConfig(
        configId: string,
        dto: UpdateSsoConfigDto,
        updatedBy: string,
    ): Promise<SsoConfiguration> {
        const config = await this.ssoConfigRepo.findOne({ where: { id: configId } });
        if (!config) {
            throw new BadRequestException('SSO configuration not found');
        }

        Object.assign(config, {
            ...dto,
            updated_by: updatedBy,
        });

        return this.ssoConfigRepo.save(config);
    }

    /**
     * Delete SSO configuration
     */
    async deleteSsoConfig(configId: string): Promise<void> {
        await this.ssoConfigRepo.delete(configId);
    }

    /**
     * List SSO configurations for a company
     */
    async listSsoConfigs(companyId: string): Promise<SsoConfiguration[]> {
        return this.ssoConfigRepo.find({
            where: { company_id: companyId },
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Handle SSO login - find or create user
     */
    async handleSsoLogin(
        profile: SsoUserProfile,
        companyId: string,
        ssoConfigId: string,
        req?: any,
    ): Promise<{ user: User; token: string; refreshToken: string }> {
        // Find existing user by email
        let user = await this.userRepo.findOne({
            where: { email: profile.email },
        });

        const config = await this.ssoConfigRepo.findOne({ where: { id: ssoConfigId } });

        // Just-In-Time (JIT) provisioning
        if (!user && config?.enable_jit_provisioning) {
            user = await this.provisionUser(profile, companyId, config);
        }

        if (!user) {
            throw new UnauthorizedException('User not found and JIT provisioning is disabled');
        }

        if (!user.is_active) {
            throw new UnauthorizedException('User account is disabled');
        }

        // Update user info from SSO profile if needed
        await this.updateUserFromProfile(user, profile, config);

        // Generate JWT tokens
        const permissions = ['*']; // Simplified for now
        const token = await this.authService.generateAccessToken(user, permissions);
        const refreshToken = await this.authService.generateRefreshToken(user);

        // Create SSO session
        await this.createSsoSession(String(user.id), ssoConfigId, token, req);

        this.logger.log(`SSO login successful for user ${user.email} via ${profile.provider}`);

        return { user, token, refreshToken };
    }

    /**
     * Provision a new user from SSO profile (JIT)
     */
    private async provisionUser(
        profile: SsoUserProfile,
        companyId: string,
        config: SsoConfiguration,
    ): Promise<User> {
        this.logger.log(`Provisioning new user from SSO: ${profile.email}`);

        const user = this.userRepo.create({
            company_id: companyId,
            email: profile.email,
            username: profile.email, // Required field
            password_hash: '', // No password for SSO users
            first_name: profile.firstName || '',
            last_name: profile.lastName || '',
            is_active: true,
        });

        // Note: Role mapping would require Role entity lookup
        // For now, users are created without role assignment

        return this.userRepo.save(user);
    }

    /**
     * Update user information from SSO profile
     */
    private async updateUserFromProfile(
        user: User,
        profile: SsoUserProfile,
        config: SsoConfiguration,
    ): Promise<void> {
        let updated = false;

        // Update basic info if changed
        if (profile.firstName && user.first_name !== profile.firstName) {
            user.first_name = profile.firstName;
            updated = true;
        }
        if (profile.lastName && user.last_name !== profile.lastName) {
            user.last_name = profile.lastName;
            updated = true;
        }

        // Note: Role mapping would require Role entity lookup

        if (updated) {
            await this.userRepo.save(user);
            this.logger.log(`Updated user ${user.email} from SSO profile`);
        }
    }

    /**
     * Map SSO groups to application role
     */
    private mapRoleFromGroups(groups: string[], roleMapping: any): string | null {
        for (const group of groups) {
            if (roleMapping.mappings[group]) {
                return roleMapping.mappings[group];
            }
        }
        return roleMapping.defaultRole || null;
    }

    /**
     * Create SSO session
     */
    private async createSsoSession(
        userId: string,
        ssoConfigId: string,
        token: string,
        req?: any,
    ): Promise<SsoSession> {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

        const session = this.ssoSessionRepo.create({
            user_id: userId,
            sso_configuration_id: ssoConfigId,
            session_token: crypto.randomBytes(32).toString('hex'),
            expires_at: expiresAt,
            ip_address: req?.ip,
            user_agent: req?.headers?.['user-agent'],
            is_active: true,
        });

        return this.ssoSessionRepo.save(session);
    }

    /**
     * Invalidate SSO session
     */
    async invalidateSsoSession(sessionToken: string): Promise<void> {
        await this.ssoSessionRepo.update(
            { session_token: sessionToken },
            { is_active: false },
        );
    }

    /**
     * Get active SSO sessions for user
     */
    async getActiveSessions(userId: string): Promise<SsoSession[]> {
        return this.ssoSessionRepo.find({
            where: { user_id: userId, is_active: true },
            relations: ['sso_configuration'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Test SSO configuration
     */
    async testSsoConfig(configId: string): Promise<{ success: boolean; message: string }> {
        const config = await this.ssoConfigRepo.findOne({ where: { id: configId } });
        if (!config) {
            throw new BadRequestException('SSO configuration not found');
        }

        // Basic validation
        if (config.provider === SsoProvider.SAML) {
            const samlConfig: any = config.configuration;
            if (!samlConfig.entryPoint || !samlConfig.cert) {
                return { success: false, message: 'Missing required SAML configuration' };
            }
        } else if (config.provider === SsoProvider.GOOGLE) {
            const oauthConfig: any = config.configuration;
            if (!oauthConfig.clientId || !oauthConfig.clientSecret) {
                return { success: false, message: 'Missing required OAuth configuration' };
            }
        }

        return { success: true, message: 'Configuration appears valid' };
    }
}
