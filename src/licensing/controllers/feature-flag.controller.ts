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
import { FeatureFlagService } from '../services/feature-flag.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateFeatureFlagDto } from '../dtos/create-feature-flag.dto';
import { RolloutFlagDto } from '../dtos/rollout-flag.dto';

@Controller('api/licensing/feature-flags')
@UseGuards(TenantGuard)
export class FeatureFlagController {
    constructor(private readonly featureFlagService: FeatureFlagService) { }

    /**
     * Check if feature flag is enabled for company
     */
    @Get(':flagName/check')
    async checkFeatureFlag(
        @Param('flagName') flagName: string,
        @Request() req: any
    ) {
        const companyId = req.user.company_id;
        const isEnabled = await this.featureFlagService.isFeatureEnabled(
            companyId,
            flagName
        );

        return {
            flag: flagName,
            enabled: isEnabled,
            companyId,
        };
    }

    /**
     * Get all enabled features for company
     */
    @Get('enabled/list')
    async getEnabledFeatures(@Request() req: any) {
        const companyId = req.user.company_id;
        const features = await this.featureFlagService.getEnabledFeatures(
            companyId
        );

        return {
            companyId,
            enabledFeatures: features,
            count: features.length,
        };
    }

    /**
     * Create feature flag (admin)
     */
    @Post()
    async createFeatureFlag(
        @Body() dto: CreateFeatureFlagDto,
        @Request() req: any
    ) {
        const userId = req.user.id;

        if (!req.user.roles?.includes('ADMIN')) {
            throw new BadRequestException('Admin role required');
        }

        return this.featureFlagService.createFlag(dto, userId);
    }

    /**
     * Enable feature flag (admin)
     */
    @Put(':flagId/enable')
    async enableFeatureFlag(
        @Param('flagId') flagId: string,
        @Request() req: any
    ) {
        const userId = req.user.id;

        if (!req.user.roles?.includes('ADMIN')) {
            throw new BadRequestException('Admin role required');
        }

        return this.featureFlagService.enableFlag(flagId, userId);
    }

    /**
     * Disable feature flag (admin)
     */
    @Put(':flagId/disable')
    async disableFeatureFlag(
        @Param('flagId') flagId: string,
        @Request() req: any
    ) {
        const userId = req.user.id;

        if (!req.user.roles?.includes('ADMIN')) {
            throw new BadRequestException('Admin role required');
        }

        return this.featureFlagService.disableFlag(flagId, userId);
    }

    /**
     * Rollout feature flag to percentage (admin)
     */
    @Put(':flagId/rollout')
    async rolloutFeatureFlag(
        @Param('flagId') flagId: string,
        @Body() dto: RolloutFlagDto,
        @Request() req: any
    ) {
        const userId = req.user.id;

        if (!req.user.roles?.includes('ADMIN')) {
            throw new BadRequestException('Admin role required');
        }

        return this.featureFlagService.rolloutFlag(flagId, dto.percentage, userId);
    }

    /**
     * Add company to feature flag whitelist (admin)
     */
    @Put(':flagId/include/:companyId')
    async includeCompanyInFlag(
        @Param('flagId') flagId: string,
        @Param('companyId') companyId: string,
        @Request() req: any
    ) {
        const userId = req.user.id;

        if (!req.user.roles?.includes('ADMIN')) {
            throw new BadRequestException('Admin role required');
        }

        return this.featureFlagService.includeCompany(flagId, companyId, userId);
    }

    /**
     * Exclude company from feature flag (admin)
     */
    @Put(':flagId/exclude/:companyId')
    async excludeCompanyFromFlag(
        @Param('flagId') flagId: string,
        @Param('companyId') companyId: string,
        @Request() req: any
    ) {
        const userId = req.user.id;

        if (!req.user.roles?.includes('ADMIN')) {
            throw new BadRequestException('Admin role required');
        }

        return this.featureFlagService.excludeCompany(flagId, companyId, userId);
    }
}
