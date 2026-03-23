import {
    Controller,
    Get,
    Post,
    Put,
    Param,
    Body,
    UseGuards,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { LicenseService } from '../services/license.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { UpdateLicenseDto } from '../dtos/update-license.dto';
import { CheckFeatureDto } from '../dtos/check-feature.dto';

@Controller('api/licensing/licenses')
@UseGuards(TenantGuard)
export class LicenseController {
    constructor(private readonly licenseService: LicenseService) { }

    /**
     * Get company's current license
     */
    @Get('current')
    async getCurrentLicense(@Request() req: any) {
        const companyId = req.user.company_id;
        return this.licenseService.getLicense(companyId);
    }

    /**
     * Check if license is active
     */
    @Get('status')
    async checkLicenseStatus(@Request() req: any) {
        const companyId = req.user.company_id;
        const isActive = await this.licenseService.isLicenseActive(companyId);
        const license = await this.licenseService.getLicense(companyId);

        return {
            isActive,
            tier: license.tier,
            status: license.status,
            expiresAt: license.expires_at,
        };
    }

    /**
     * Check feature access
     */
    @Post('check-feature')
    async checkFeatureAccess(
        @Request() req: any,
        @Body() dto: CheckFeatureDto
    ) {
        const companyId = req.user.company_id;

        const hasAccess = await this.licenseService.hasFeatureAccess(
            companyId,
            dto.feature_name
        );

        if (!hasAccess) {
            return {
                allowed: false,
                message: `Feature ${dto.feature_name} is not available in your license tier`,
            };
        }

        const usage = await this.licenseService.checkFeatureUsage(
            companyId,
            dto.feature_name,
            0
        );

        return {
            allowed: true,
            feature: dto.feature_name,
            usage: usage.remaining,
            limit: usage.limit,
            remaining: usage.remaining,
        };
    }

    /**
     * Get all company features with usage
     */
    @Get('features')
    async getCompanyFeatures(@Request() req: any) {
        const companyId = req.user.company_id;
        return this.licenseService.getCompanyFeatures(companyId);
    }

    /**
     * Upgrade license tier (admin only)
     */
    @Put(':companyId/upgrade')
    async upgradeLicense(
        @Param('companyId') targetCompanyId: string,
        @Body() dto: UpdateLicenseDto,
        @Request() req: any
    ) {
        const userId = req.user.id;
        const companyId = req.user.company_id;

        // Only admin can upgrade other company licenses
        if (targetCompanyId !== companyId && !req.user.roles?.includes('ADMIN')) {
            throw new BadRequestException('Insufficient permissions');
        }

        return this.licenseService.upgradeLicense(
            targetCompanyId,
            dto.tier,
            (dto.billing_cycle || 'monthly') as 'monthly' | 'annual'
        );
    }
}
