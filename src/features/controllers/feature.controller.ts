import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeatureService } from '../services/feature.service';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { EnableFeatureDto, DisableFeatureDto } from '../dto/feature-flag.dto';

/**
 * Feature flags API. All queries are tenant-isolated: company_id is taken from req.tenant only, never from body.
 * Only Company Admin (or users with features:view / features:update) can access.
 */
@ApiTags('Features')
@ApiBearerAuth()
@Controller('api/v1/features')
@UseGuards(PermissionGuard, TenantGuard)
export class FeatureController {
    constructor(private readonly featureService: FeatureService) {}

    @Get()
    @RequirePermissions('features:view')
    @ApiOperation({ summary: 'List company feature flags' })
    async list(@Req() req: any) {
        const companyId = req.tenant.companyId as string;
        const features = await this.featureService.getCompanyFeatures(companyId);
        return {
            success: true,
            data: features,
        };
    }

    @Post('enable')
    @RequirePermissions('features:update')
    @ApiOperation({ summary: 'Enable a feature for the current company' })
    async enable(@Body() body: EnableFeatureDto, @Req() req: any) {
        const companyId = req.tenant.companyId as string;
        const flag = await this.featureService.enableFeature(companyId, body.feature_key);
        return {
            success: true,
            data: flag,
        };
    }

    @Post('disable')
    @RequirePermissions('features:update')
    @ApiOperation({ summary: 'Disable a feature for the current company' })
    async disable(@Body() body: DisableFeatureDto, @Req() req: any) {
        const companyId = req.tenant.companyId as string;
        const flag = await this.featureService.disableFeature(companyId, body.feature_key);
        return {
            success: true,
            data: flag,
        };
    }
}
