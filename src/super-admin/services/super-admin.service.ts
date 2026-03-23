import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { Repository, Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { AuditService } from '../../common/services/audit.service';
import { CacheService } from '../../common/services/cache.service';
import { EmailService } from '../../modules/email/email.service';
import { EmailTemplate } from '../../modules/email/interfaces/email.interface';
import { ConfigService } from '@nestjs/config';
import { AuthorizationService } from '../../auth/services/authorization.service';

interface CreateCompanyDto {
    name: string;
    slug: string;
    email: string;
    licenseTier?: string;
    settings?: Record<string, any>;
    initialAdmin: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
    };
}

interface AssignLicenseDto {
    companyId: string;
    tier: string;
    billingCycle?: string;
    startsAt: Date;
    expiresAt: Date;
    autoRenew?: boolean;
    customLimits?: Record<string, any>;
}

interface CreateCompanyAdminDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
}

interface UpdateCompanyAdminDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: string;
    isActive?: boolean;
}

interface EnableModuleDto {
    module: string;
    enabledAt?: Date;
    reason?: string;
}

interface DisableModuleDto {
    module: string;
    disabledAt?: Date;
    reason?: string;
}

@Injectable()
export class SuperAdminService {
    private bcryptRounds = 10;
    private readonly defaultFeatureFlags = {
        jobs: true,
        candidates: true,
        interviews: true,
        offers: true,
        submissions: true,
        reports: true,
        api: false,
        webhooks: false,
        sso: false,
        analytics: true,
        custom_fields: true,
        bulk_import: false,
    };

    constructor(
        @InjectRepository(Company)
        private readonly companiesRepository: Repository<Company>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly auditService: AuditService,
        private readonly cacheService: CacheService,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService,
        private readonly authorizationService: AuthorizationService,
    ) { }

    private getCompanyLoginUrl(): string {
        return this.configService.get('COMPANY_LOGIN_URL', 'http://localhost:3001/login');
    }

    /**
     * Get total user count for a company (all roles)
     */
    async getCompanyUserCount(companyId: string): Promise<number> {
        return await this.usersRepository.count({ where: { company_id: companyId } as any });
    }

    /**
     * Get user counts for multiple companies in a single query
     */
    async getUserCountsForCompanies(companyIds: string[]): Promise<Record<string, number>> {
        if (!companyIds || companyIds.length === 0) return {};

        const rows = await this.usersRepository
            .createQueryBuilder('user')
            .select('user.company_id', 'company_id')
            .addSelect('COUNT(*)', 'count')
            .where('user.company_id IN (:...ids)', { ids: companyIds })
            .groupBy('user.company_id')
            .getRawMany<{ company_id: string; count: string }>();

        const map: Record<string, number> = {};
        for (const r of rows) {
            map[r.company_id] = parseInt(r.count, 10) || 0;
        }
        return map;
    }

    /**
     * Companies with an assigned license tier (active tenants).
     */
    async getActiveLicenseCount(): Promise<number> {
        return await this.companiesRepository.count({
            where: {
                is_active: true,
                license_tier: Not(IsNull()),
            },
        });
    }

    /**
     * Create a new company with initial admin user
     */
    async createCompany(
        data: CreateCompanyDto,
        superAdminId: string
    ): Promise<{
        company: Company;
        admin: User;
    }> {
        // Check if company slug already exists
        const existingCompany = await this.companiesRepository.findOne({
            where: { slug: data.slug },
        });

        if (existingCompany) {
            throw new ConflictException('Company slug already exists');
        }

        // Check if initial admin email already exists
        const existingUser = await this.usersRepository.findOne({
            where: { email: data.initialAdmin.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already in use by another user');
        }

        // Create company
        const company = this.companiesRepository.create({
            name: data.name,
            slug: data.slug,
            email: data.email,
            license_tier: data.licenseTier || 'basic',
            feature_flags: this.defaultFeatureFlags,
            settings: data.settings || { timezone: 'UTC' },
            is_active: true,
        });

        const savedCompany = await this.companiesRepository.save(company);

        // Hash admin password
        const passwordHash = await bcrypt.hash(
            data.initialAdmin.password,
            this.bcryptRounds
        );

        // Create initial admin user
        const adminUser = this.usersRepository.create({
            company_id: savedCompany.id,
            first_name: data.initialAdmin.firstName,
            last_name: data.initialAdmin.lastName,
            email: data.initialAdmin.email,
            password_hash: passwordHash,
            role: 'admin',
            is_active: true,
            email_verified: false,
            permissions: {},
            preferences: {},
        });

        const savedAdmin = await this.usersRepository.save(adminUser);

        // Seed default roles and assign Company Admin role to initial admin user
        await this.authorizationService.seedDefaultRolesForCompany(savedCompany.id, String(savedAdmin.id));

        // Send welcome/invite email via configured mailer
        try {
            const loginUrl = this.getCompanyLoginUrl();
            await this.emailService.sendEmail({
                to: savedAdmin.email,
                subject: `Welcome to ${savedCompany.name}`,
                template: EmailTemplate.WELCOME,
                templateData: {
                    name: `${savedAdmin.first_name} ${savedAdmin.last_name}`.trim() || savedAdmin.email,
                    companyName: savedCompany.name,
                    loginUrl,
                },
            });
        } catch (err) {
            // Log but don't block company creation
            console.warn('Failed to send welcome email to initial admin', err.message || err);
        }

        // Log audit event
        await this.auditService.log(null, superAdminId, {
            action: 'SUPER_ADMIN_COMPANY_CREATED',
            entityId: savedCompany.id,
            entityType: 'Company',
            newValues: {
                name: savedCompany.name,
                slug: savedCompany.slug,
                licenseTier: savedCompany.license_tier,
                adminEmail: savedAdmin.email,
            },
        });

        // Clear company list cache
        await this.cacheService.delete('companies:list');

        return {
            company: savedCompany,
            admin: savedAdmin,
        };
    }

    /**
     * Get all companies (excludes soft-deleted)
     */
    async getAllCompanies(
        page: number = 1,
        limit: number = 20,
        search?: string,
        isActive?: boolean
    ): Promise<{
        companies: Company[];
        pagination: { page: number; limit: number; total: number };
    }> {
        let query = this.companiesRepository.createQueryBuilder('company').andWhere('company.deleted_at IS NULL');

        if (search) {
            query = query.andWhere(
                '(company.name ILIKE :search OR company.slug ILIKE :search OR company.email ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (isActive !== undefined) {
            query = query.andWhere('company.is_active = :isActive', { isActive });
        }

        const total = await query.getCount();

        const companies = await query
            .orderBy('company.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            companies,
            pagination: { page, limit, total },
        };
    }

    /**
     * Get company by ID (throws if not found; includes soft-deleted for super-admin operations)
     */
    async getCompanyById(companyId: string): Promise<Company> {
        const company = await this.companiesRepository.findOne({
            where: { id: companyId },
        });

        if (!company) {
            throw new NotFoundException('Company not found');
        }

        return company;
    }

    /**
     * Soft-delete a company (sets deleted_at)
     */
    async deleteCompany(companyId: string, superAdminId: string): Promise<void> {
        const company = await this.getCompanyById(companyId);

        if (company.deleted_at) {
            throw new BadRequestException('Company is already deleted');
        }

        company.deleted_at = new Date();
        await this.companiesRepository.save(company);

        await this.auditService.log(null, superAdminId, {
            action: 'SUPER_ADMIN_COMPANY_DELETED',
            entityId: companyId,
            entityType: 'Company',
        });

        await this.cacheService.delete(`company:${companyId}`);
        await this.cacheService.delete('companies:list');
    }

    /**
     * Update company
     */
    async updateCompany(
        companyId: string,
        data: Partial<{
            name: string;
            slug: string;
            email: string;
            description: string;
            isActive: boolean;
            licenseTier: string;
            settings: Record<string, any>;
        }>,
        superAdminId: string
    ): Promise<Company> {
        const company = await this.getCompanyById(companyId);

        if (data.slug !== undefined && data.slug !== company.slug) {
            const existing = await this.companiesRepository.findOne({
                where: { slug: data.slug },
            });
            if (existing) {
                throw new ConflictException('Company slug already in use');
            }
        }

        const updates: Partial<Company> = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.slug !== undefined) updates.slug = data.slug;
        if (data.email !== undefined) updates.email = data.email;
        if (data.isActive !== undefined) updates.is_active = data.isActive;
        if (data.licenseTier !== undefined) updates.license_tier = data.licenseTier;
        if (data.settings !== undefined) {
            updates.settings = { ...company.settings, ...data.settings };
        }
        if (data.description !== undefined) {
            updates.settings = { ...company.settings, description: data.description };
        }

        const updatedCompany = await this.companiesRepository.save({
            ...company,
            ...updates,
        });

        // Log audit event
        await this.auditService.log(null, superAdminId, {
            action: 'SUPER_ADMIN_COMPANY_UPDATED',
            entityId: companyId,
            entityType: 'Company',
            newValues: updates,
        });

        // Clear cache
        await this.cacheService.delete(`company:${companyId}`);
        await this.cacheService.delete('companies:list');

        return updatedCompany;
    }

    /**
     * Assign license to company
     */
    async assignLicense(
        data: AssignLicenseDto,
        superAdminId: string
    ): Promise<{ success: boolean; message: string }> {
        const company = await this.getCompanyById(data.companyId);

        // Update company license tier
        company.license_tier = data.tier;
        await this.companiesRepository.save(company);

        // Log audit event
        await this.auditService.log(null, superAdminId, {
            action: 'SUPER_ADMIN_LICENSE_ASSIGNED',
            entityId: data.companyId,
            entityType: 'License',
            newValues: {
                tier: data.tier,
                billingCycle: data.billingCycle || 'monthly',
                startsAt: data.startsAt,
                expiresAt: data.expiresAt,
                autoRenew: data.autoRenew !== false,
                customLimits: data.customLimits,
            },
        });

        // Clear cache
        await this.cacheService.delete(`company:${data.companyId}`);

        return {
            success: true,
            message: `License tier '${data.tier}' assigned to company`,
        };
    }

    /**
     * Enable a feature module for a company
     */
    async enableModule(
        companyId: string,
        data: EnableModuleDto,
        superAdminId: string
    ): Promise<{
        module: string;
        isEnabled: boolean;
        enabledAt: Date;
    }> {
        const company = await this.getCompanyById(companyId);

        // Update feature flag
        company.feature_flags = {
            ...company.feature_flags,
            [data.module]: true,
        };

        await this.companiesRepository.save(company);

        // Log audit event
        await this.auditService.log(null, superAdminId, {
            action: 'SUPER_ADMIN_MODULE_ENABLED',
            entityId: companyId,
            entityType: 'FeatureFlag',
            newValues: {
                module: data.module,
                enabled: true,
                reason: data.reason,
            },
        });

        // Clear cache
        await this.cacheService.delete(`company:${companyId}`);
        await this.cacheService.delete(`company:${companyId}:features`);

        const enabledAt = data.enabledAt || new Date();

        return {
            module: data.module,
            isEnabled: true,
            enabledAt,
        };
    }

    /**
     * Disable a feature module for a company
     */
    async disableModule(
        companyId: string,
        data: DisableModuleDto,
        superAdminId: string
    ): Promise<{
        module: string;
        isEnabled: boolean;
        disabledAt: Date;
    }> {
        const company = await this.getCompanyById(companyId);

        // Update feature flag
        company.feature_flags = {
            ...company.feature_flags,
            [data.module]: false,
        };

        await this.companiesRepository.save(company);

        // Log audit event
        await this.auditService.log(null, superAdminId, {
            action: 'SUPER_ADMIN_MODULE_DISABLED',
            entityId: companyId,
            entityType: 'FeatureFlag',
            newValues: {
                module: data.module,
                enabled: false,
                reason: data.reason,
            },
        });

        // Clear cache
        await this.cacheService.delete(`company:${companyId}`);
        await this.cacheService.delete(`company:${companyId}:features`);

        const disabledAt = data.disabledAt || new Date();

        return {
            module: data.module,
            isEnabled: false,
            disabledAt,
        };
    }

    /**
     * Get all modules status for a company
     */
    async getCompanyModules(companyId: string): Promise<Record<string, any>> {
        const company = await this.getCompanyById(companyId);
        return company.feature_flags || this.defaultFeatureFlags;
    }

    /**
     * Create a company admin user
     */
    async createCompanyAdmin(
        companyId: string,
        data: CreateCompanyAdminDto,
        superAdminId: string
    ): Promise<User> {
        const company = await this.getCompanyById(companyId);

        // Check if user email already exists in this company
        const existingUser = await this.usersRepository.findOne({
            where: { company_id: companyId, email: data.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already in use in this company');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, this.bcryptRounds);

        // Create admin user
        const adminUser = this.usersRepository.create({
            company_id: companyId,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            password_hash: passwordHash,
            role: data.role || 'admin',
            is_active: true,
            email_verified: false,
            permissions: {},
            preferences: {},
        });

        const savedAdmin = await this.usersRepository.save(adminUser);

        // Send welcome/invite email via configured mailer
        try {
            const loginUrl = this.getCompanyLoginUrl();
            await this.emailService.sendEmail({
                to: savedAdmin.email,
                subject: `Welcome to ${company.name}`,
                template: EmailTemplate.WELCOME,
                templateData: {
                    name: `${savedAdmin.first_name} ${savedAdmin.last_name}`.trim() || savedAdmin.email,
                    companyName: company.name,
                    loginUrl,
                },
            });
        } catch (err) {
            console.warn('Failed to send welcome email to new admin', err.message || err);
        }

        // Log audit event
        await this.auditService.log(null, superAdminId, {
            action: 'SUPER_ADMIN_COMPANY_ADMIN_CREATED',
            entityId: savedAdmin.id?.toString(),
            entityType: 'User',
            newValues: {
                email: savedAdmin.email,
                role: savedAdmin.role,
                companyId,
            },
        });

        // Clear cache
        await this.cacheService.delete(`company:${companyId}:users`);

        return savedAdmin;
    }

    /**
     * Get all admin users for a company
     */
    async getCompanyAdmins(companyId: string): Promise<User[]> {
        const admins = await this.usersRepository.find({
            where: { company_id: companyId, role: 'admin' },
            order: { created_at: 'DESC' },
        });

        return admins;
    }

    /**
     * Update a company admin user
     */
    async updateCompanyAdmin(
        companyId: string,
        adminId: string,
        data: UpdateCompanyAdminDto,
        superAdminId: string
    ): Promise<User> {
        await this.getCompanyById(companyId);

        const admin = await this.usersRepository.findOne({
            where: { id: adminId, company_id: companyId },
        });

        if (!admin) {
            throw new NotFoundException('Admin user not found');
        }

        // Enforce company-scoped email uniqueness when changing email
        if (data.email !== undefined && data.email !== admin.email) {
            const existingUser = await this.usersRepository.findOne({
                where: { company_id: companyId, email: data.email },
            });
            if (existingUser) {
                throw new ConflictException('Email already in use in this company');
            }
        }

        if (data.password !== undefined) {
            if (data.password.length < 8) {
                throw new BadRequestException('Password must be at least 8 characters');
            }
            admin.password_hash = await bcrypt.hash(data.password, this.bcryptRounds);
            admin.email_verified = false;
        }

        if (data.firstName !== undefined) admin.first_name = data.firstName;
        if (data.lastName !== undefined) admin.last_name = data.lastName;
        if (data.email !== undefined) admin.email = data.email;
        if (data.role !== undefined) admin.role = data.role;
        if (data.isActive !== undefined) admin.is_active = data.isActive;

        const saved = await this.usersRepository.save(admin);

        await this.auditService.log(null, superAdminId, {
            action: 'SUPER_ADMIN_COMPANY_ADMIN_UPDATED',
            entityId: saved.id?.toString(),
            entityType: 'User',
            newValues: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                role: data.role,
                isActive: data.isActive,
                passwordUpdated: data.password ? true : undefined,
                companyId,
            },
        });

        await this.cacheService.delete(`company:${companyId}:users`);

        return saved;
    }

    /**
     * Resend welcome email to company admin
     */
    async resendCompanyWelcomeEmail(companyId: string): Promise<void> {
        const company = await this.companiesRepository.findOne({
            where: { id: companyId },
        });

        if (!company) {
            throw new Error(`Company with ID ${companyId} not found`);
        }

        // Get the first admin user for this company
        const admin = await this.usersRepository.findOne({
            where: { company_id: companyId, role: 'admin' },
            order: { created_at: 'ASC' },
        });

        if (!admin) {
            throw new Error(`No admin user found for company ${companyId}`);
        }

        // Send welcome email
        const loginUrl = this.getCompanyLoginUrl();

        await this.emailService.sendEmail({
            to: admin.email,
            subject: `Welcome to ${company.name} - Your HireGoApp Account`,
            template: EmailTemplate.WELCOME,
            templateData: {
                name: `${admin.first_name} ${admin.last_name}`.trim() || admin.email,
                companyName: company.name,
                loginUrl,
            },
        });
    }
}
