import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { ApplicationAnalyticsService } from './application-analytics.service';

@ApiTags('Application Analytics')
@ApiBearerAuth()
@Controller('api/v1/applications/analytics')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ApplicationAnalyticsController {
    constructor(private readonly analytics: ApplicationAnalyticsService) { }

    @Get('status-breakdown')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get status breakdown' })
    async status(@CompanyId() companyId: string) {
        return this.analytics.statusBreakdown(companyId);
    }

    @Get('funnel')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get funnel by current stage type' })
    async funnel(@CompanyId() companyId: string, @Query('pipeline_id') pipeline_id?: string) {
        return this.analytics.funnel(companyId, pipeline_id);
    }

    @Get('time-to-hire')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get average time-to-hire (days)' })
    async timeToHire(@CompanyId() companyId: string) {
        return this.analytics.timeToHire(companyId);
    }

    @Get('source-effectiveness')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get source effectiveness (applications, hires, conversion)' })
    async source(@CompanyId() companyId: string) {
        return this.analytics.sourceEffectiveness(companyId);
    }
}
