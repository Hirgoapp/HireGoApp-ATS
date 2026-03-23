import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    BadRequestException,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request,
} from '@nestjs/common';
import { SuperAdminService } from '../services/super-admin.service';
import { SuperAdminAuthService } from '../services/super-admin-auth.service';
import { SuperAdminInviteService } from '../services/super-admin-invite.service';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { CreateSuperAdminInviteDto } from '../dto/create-super-admin-invite.dto';
import { SuperAdminInviteStatus } from '../entities/super-admin-invite.entity';

@Controller('api/super-admin')
@UseGuards(SuperAdminGuard)
export class SuperAdminController {
    constructor(
        private readonly superAdminService: SuperAdminService,
        private readonly superAdminAuthService: SuperAdminAuthService,
        private readonly superAdminInviteService: SuperAdminInviteService,
    ) { }

    // ============================================================================
    // COMPANY MANAGEMENT ENDPOINTS
    // ============================================================================

    /**
     * POST /api/super-admin/companies
     * Create a new company with initial admin user
     */
    @Post('companies')
    @HttpCode(HttpStatus.CREATED)
    async createCompany(
        @Request() req: any,
        @Body()
        body: {
            name: string;
            slug: string;
            email: string;
            licenseTier: string;
            initialAdmin: {
                firstName: string;
                lastName: string;
                email: string;
                password: string;
            };
            settings?: Record<string, any>;
        }
    ) {
        // Validate required fields
        if (!body.name || !body.slug || !body.email || !body.licenseTier || !body.initialAdmin) {
            throw new BadRequestException(
                'name, slug, email, licenseTier, and initialAdmin are required'
            );
        }

        if (
            !body.initialAdmin.firstName ||
            !body.initialAdmin.lastName ||
            !body.initialAdmin.email ||
            !body.initialAdmin.password
        ) {
            throw new BadRequestException('All initial admin fields are required');
        }

        if (body.initialAdmin.password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        const superAdminId = req.user?.userId;

        const result = await this.superAdminService.createCompany(body, superAdminId);

        return {
            success: true,
            data: {
                company: {
                    id: result.company.id,
                    name: result.company.name,
                    slug: result.company.slug,
                    email: result.company.email,
                    licenseTier: result.company.license_tier,
                    isActive: result.company.is_active,
                    createdAt: result.company.created_at,
                },
                admin: {
                    id: result.admin.id,
                    email: result.admin.email,
                    firstName: result.admin.first_name,
                    lastName: result.admin.last_name,
                    role: result.admin.role,
                    companyId: result.admin.company_id,
                },
            },
        };
    }

    /**
     * GET /api/super-admin/companies
     * List all companies with pagination and filtering
     */
    @Get('companies')
    @HttpCode(HttpStatus.OK)
    async getCompanies(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('search') search?: string,
        @Query('isActive') isActive?: string
    ) {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
        const isActiveFlag = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

        const result = await this.superAdminService.getAllCompanies(
            pageNum,
            limitNum,
            search,
            isActiveFlag
        );

        // Enrich with user counts
        const countsMap = await this.superAdminService.getUserCountsForCompanies(result.companies.map((c) => c.id));

        return {
            success: true,
            data: {
                companies: result.companies.map((c) => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    status: c.is_active ? 'active' : 'inactive',
                    licenseType: c.license_tier,
                    modules: {},
                    userCount: countsMap[c.id] || 0,
                    createdAt: c.created_at,
                    updatedAt: c.updated_at,
                })),
                pagination: result.pagination,
            },
        };
    }

    /**
     * GET /api/super-admin/companies/:companyId
     * Get company details
     */
    @Get('companies/:companyId')
    @HttpCode(HttpStatus.OK)
    async getCompany(@Param('companyId') companyId: string) {
        if (!companyId) {
            throw new BadRequestException('Company ID is required');
        }

        const company = await this.superAdminService.getCompanyById(companyId);

        const admins = await this.superAdminService.getCompanyAdmins(companyId);
        const userCount = await this.superAdminService.getCompanyUserCount(companyId);

        return {
            success: true,
            data: {
                id: company.id,
                name: company.name,
                slug: company.slug,
                email: company.email,
                description: company.settings?.description ?? '',
                status: company.is_active ? 'active' : 'inactive',
                licenseType: company.license_tier,
                modules: company.feature_flags || {},
                userCount,
                admin: admins.length > 0 ? {
                    id: admins[0].id,
                    email: admins[0].email,
                    firstName: admins[0].first_name,
                    lastName: admins[0].last_name,
                } : undefined,
                createdAt: company.created_at,
                updatedAt: company.updated_at,
            },
        };
    }

    /**
     * PATCH /api/super-admin/companies/:companyId
     * Update company details
     */
    @Patch('companies/:companyId')
    @HttpCode(HttpStatus.OK)
    async updateCompany(
        @Request() req: any,
        @Param('companyId') companyId: string,
        @Body()
        body: {
            name?: string;
            slug?: string;
            email?: string;
            description?: string;
            isActive?: boolean;
            licenseTier?: string;
            settings?: Record<string, any>;
        }
    ) {
        if (!companyId) {
            throw new BadRequestException('Company ID is required');
        }

        const superAdminId = req.user?.userId;

        const company = await this.superAdminService.updateCompany(
            companyId,
            body,
            superAdminId
        );

        return {
            success: true,
            data: {
                id: company.id,
                name: company.name,
                slug: company.slug,
                email: company.email,
                description: company.settings?.description ?? '',
                isActive: company.is_active,
                licenseTier: company.license_tier,
                updatedAt: company.updated_at,
            },
        };
    }

    /**
     * DELETE /api/super-admin/companies/:companyId
     * Soft-delete a company
     */
    @Delete('companies/:companyId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteCompany(
        @Request() req: any,
        @Param('companyId') companyId: string
    ) {
        if (!companyId) {
            throw new BadRequestException('Company ID is required');
        }

        const superAdminId = req.user?.userId;
        await this.superAdminService.deleteCompany(companyId, superAdminId);
    }

    // ============================================================================
    // LICENSE MANAGEMENT ENDPOINTS
    // ============================================================================

    /**
     * GET /api/super-admin/licenses/active-count
     * Get the count of active licenses (stub implementation)
     */
    @Get('licenses/active-count')
    @HttpCode(HttpStatus.OK)
    async getActiveLicenseCount() {
        const count = await this.superAdminService.getActiveLicenseCount();
        return {
            success: true,
            data: {
                activeLicenseCount: count,
                count,
            },
        };
    }

    // ============================================================================
    // INVITATION MANAGEMENT
    // ============================================================================

    /**
     * GET /api/super-admin/invites/pending-count
     */
    @Get('invites/pending-count')
    @HttpCode(HttpStatus.OK)
    async getPendingInvitesCount() {
        await this.superAdminInviteService.expireStaleInvites();
        const count = await this.superAdminInviteService.countPendingValidInvites();
        return {
            success: true,
            data: { count },
        };
    }

    /**
     * GET /api/super-admin/invites
     */
    @Get('invites')
    @HttpCode(HttpStatus.OK)
    async listInvites(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('status') status?: string,
        @Query('companyId') companyId?: string,
        @Query('search') search?: string,
    ) {
        await this.superAdminInviteService.expireStaleInvites();
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        let st: SuperAdminInviteStatus | undefined;
        if (status && Object.values(SuperAdminInviteStatus).includes(status as SuperAdminInviteStatus)) {
            st = status as SuperAdminInviteStatus;
        } else if (status) {
            throw new BadRequestException(`Invalid status: ${status}`);
        }
        const result = await this.superAdminInviteService.listInvites(
            pageNum,
            limitNum,
            st,
            companyId,
            search,
        );
        return { success: true, data: result };
    }

    /**
     * POST /api/super-admin/invites
     */
    @Post('invites')
    @HttpCode(HttpStatus.CREATED)
    async createInvite(@Request() req: any, @Body() body: CreateSuperAdminInviteDto) {
        const superAdminId = req.user?.userId;
        const result = await this.superAdminInviteService.createInvite(body, superAdminId);
        return { success: true, data: result };
    }

    /**
     * POST /api/super-admin/invites/:inviteId/resend
     */
    @Post('invites/:inviteId/resend')
    @HttpCode(HttpStatus.OK)
    async resendInvite(@Request() req: any, @Param('inviteId') inviteId: string) {
        if (!inviteId) {
            throw new BadRequestException('inviteId is required');
        }
        const superAdminId = req.user?.userId;
        const result = await this.superAdminInviteService.resendInvite(inviteId, superAdminId);
        return { success: true, data: result };
    }

    /**
     * POST /api/super-admin/invites/:inviteId/revoke
     */
    @Post('invites/:inviteId/revoke')
    @HttpCode(HttpStatus.OK)
    async revokeInvite(@Request() req: any, @Param('inviteId') inviteId: string) {
        if (!inviteId) {
            throw new BadRequestException('inviteId is required');
        }
        const superAdminId = req.user?.userId;
        const invite = await this.superAdminInviteService.revokeInvite(inviteId, superAdminId);
        return { success: true, data: { invite } };
    }

    /**
     * POST /api/super-admin/licenses
     * Assign or update license for a company
     */
    @Post('licenses')
    @HttpCode(HttpStatus.CREATED)
    async assignLicense(
        @Request() req: any,
        @Body()
        body: {
            companyId: string;
            tier: string;
            billingCycle?: string;
            startsAt: string;
            expiresAt: string;
            autoRenew?: boolean;
            customLimits?: Record<string, any>;
        }
    ) {
        if (!body.companyId || !body.tier || !body.startsAt || !body.expiresAt) {
            throw new BadRequestException(
                'companyId, tier, startsAt, and expiresAt are required'
            );
        }

        const superAdminId = req.user?.userId;

        const result = await this.superAdminService.assignLicense(
            {
                companyId: body.companyId,
                tier: body.tier,
                billingCycle: body.billingCycle,
                startsAt: new Date(body.startsAt),
                expiresAt: new Date(body.expiresAt),
                autoRenew: body.autoRenew,
                customLimits: body.customLimits,
            },
            superAdminId
        );

        return {
            success: true,
            data: result,
        };
    }

    /**
     * GET /api/super-admin/licenses/:companyId
     * Get company's current license details
     */
    @Get('licenses/:companyId')
    @HttpCode(HttpStatus.OK)
    async getLicense(@Param('companyId') companyId: string) {
        if (!companyId) {
            throw new BadRequestException('Company ID is required');
        }

        // Get company to show license info
        const company = await this.superAdminService.getCompanyById(companyId);

        return {
            success: true,
            data: {
                companyId: company.id,
                tier: company.license_tier,
                isActive: company.is_active,
            },
        };
    }

    // ============================================================================
    // FEATURE MODULE MANAGEMENT ENDPOINTS
    // ============================================================================

    /**
     * GET /api/super-admin/modules/:companyId
     * Get all feature flags for a company
     */
    @Get('modules/:companyId')
    @HttpCode(HttpStatus.OK)
    async getModules(@Param('companyId') companyId: string) {
        if (!companyId) {
            throw new BadRequestException('Company ID is required');
        }

        const modules = await this.superAdminService.getCompanyModules(companyId);

        return {
            success: true,
            data: {
                companyId,
                modules,
            },
        };
    }

    /**
     * POST /api/super-admin/modules/:companyId/enable
     * Enable a feature module for a company
     */
    @Post('modules/:companyId/enable')
    @HttpCode(HttpStatus.OK)
    async enableModule(
        @Request() req: any,
        @Param('companyId') companyId: string,
        @Body()
        body: {
            module: string;
            reason?: string;
        }
    ) {
        if (!companyId || !body.module) {
            throw new BadRequestException('Company ID and module are required');
        }

        const superAdminId = req.user?.userId;

        const result = await this.superAdminService.enableModule(
            companyId,
            {
                module: body.module,
                enabledAt: new Date(),
                reason: body.reason,
            },
            superAdminId
        );

        return {
            success: true,
            data: result,
        };
    }

    /**
     * POST /api/super-admin/modules/:companyId/disable
     * Disable a feature module for a company
     */
    @Post('modules/:companyId/disable')
    @HttpCode(HttpStatus.OK)
    async disableModule(
        @Request() req: any,
        @Param('companyId') companyId: string,
        @Body()
        body: {
            module: string;
            reason?: string;
        }
    ) {
        if (!companyId || !body.module) {
            throw new BadRequestException('Company ID and module are required');
        }

        const superAdminId = req.user?.userId;

        const result = await this.superAdminService.disableModule(
            companyId,
            {
                module: body.module,
                disabledAt: new Date(),
                reason: body.reason,
            },
            superAdminId
        );

        return {
            success: true,
            data: result,
        };
    }

    // ============================================================================
    // COMPANY ADMIN USER MANAGEMENT ENDPOINTS
    // ============================================================================

    /**
     * POST /api/super-admin/companies/:companyId/admins
     * Create a company admin user
     */
    @Post('companies/:companyId/admins')
    @HttpCode(HttpStatus.CREATED)
    async createCompanyAdmin(
        @Request() req: any,
        @Param('companyId') companyId: string,
        @Body()
        body: {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
            role?: string;
        }
    ) {
        if (
            !companyId ||
            !body.firstName ||
            !body.lastName ||
            !body.email ||
            !body.password
        ) {
            throw new BadRequestException(
                'All admin fields (firstName, lastName, email, password) are required'
            );
        }

        if (body.password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        const superAdminId = req.user?.userId;

        const admin = await this.superAdminService.createCompanyAdmin(
            companyId,
            body,
            superAdminId
        );

        return {
            success: true,
            data: {
                id: admin.id,
                email: admin.email,
                firstName: admin.first_name,
                lastName: admin.last_name,
                role: admin.role,
                companyId: admin.company_id,
                createdAt: admin.created_at,
            },
        };
    }

    /**
     * POST /api/super-admin/companies/:companyId/resend-welcome-email
     * Resend welcome email to company admin
     */
    @Post('companies/:companyId/resend-welcome-email')
    @HttpCode(HttpStatus.OK)
    async resendWelcomeEmail(@Param('companyId') companyId: string) {
        if (!companyId) {
            throw new BadRequestException('Company ID is required');
        }

        await this.superAdminService.resendCompanyWelcomeEmail(companyId);

        return {
            success: true,
            message: 'Welcome email resent successfully',
        };
    }

    /**
     * GET /api/super-admin/companies/:companyId/admins
     * Get all admin users for a company
     */
    @Get('companies/:companyId/admins')
    @HttpCode(HttpStatus.OK)
    async getCompanyAdmins(@Param('companyId') companyId: string) {
        if (!companyId) {
            throw new BadRequestException('Company ID is required');
        }

        const admins = await this.superAdminService.getCompanyAdmins(companyId);

        return {
            success: true,
            data: {
                companyId,
                admins: admins.map((a) => ({
                    id: a.id,
                    email: a.email,
                    firstName: a.first_name,
                    lastName: a.last_name,
                    role: a.role,
                    isActive: a.is_active,
                    lastLoginAt: a.last_login_at,
                    createdAt: a.created_at,
                })),
            },
        };
    }

    /**
     * PATCH /api/super-admin/companies/:companyId/admins/:adminId
     * Update a company admin user
     */
    @Patch('companies/:companyId/admins/:adminId')
    @HttpCode(HttpStatus.OK)
    async updateCompanyAdmin(
        @Request() req: any,
        @Param('companyId') companyId: string,
        @Param('adminId') adminId: string,
        @Body()
        body: {
            firstName?: string;
            lastName?: string;
            email?: string;
            password?: string;
            role?: string;
            isActive?: boolean;
        }
    ) {
        if (!companyId) {
            throw new BadRequestException('Company ID is required');
        }

        const superAdminId = req.user?.userId;

        const admin = await this.superAdminService.updateCompanyAdmin(
            companyId,
            adminId,
            body,
            superAdminId
        );

        return {
            success: true,
            data: {
                id: admin.id,
                email: admin.email,
                firstName: admin.first_name,
                lastName: admin.last_name,
                role: admin.role,
                isActive: admin.is_active,
                companyId: admin.company_id,
                updatedAt: admin.updated_at,
            },
        };
    }

    // ============================================================================
    // SUPER-ADMIN USER MANAGEMENT ENDPOINTS
    // ============================================================================

    /**
     * GET /api/super-admin/users
     * Get all super-admin users with pagination
     */
    @Get('users')
    @HttpCode(HttpStatus.OK)
    async getSuperAdminUsers(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('search') search?: string
    ) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

        const result = await this.superAdminAuthService.getAllSuperAdminUsers(
            pageNum,
            limitNum,
            search
        );

        return {
            success: true,
            data: {
                users: result.users.map((u) => ({
                    id: u.id,
                    email: u.email,
                    firstName: u.first_name,
                    lastName: u.last_name,
                    role: u.role,
                    isActive: u.is_active,
                    emailVerified: u.email_verified,
                    lastLoginAt: u.last_login_at,
                    createdAt: u.created_at,
                })),
                pagination: result.pagination,
            },
        };
    }
}
