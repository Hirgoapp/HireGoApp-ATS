import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';

@Controller('analytics')
@UseGuards(RoleGuard)
export class AnalyticsController {
    constructor(private readonly service: AnalyticsService) { }

    @Get('funnel')
    @Require('analytics:view')
    async funnel(@CompanyId() companyId: string) {
        return this.service.getFunnel(companyId);
    }

    @Get('time-to-hire')
    @Require('analytics:view')
    async timeToHire(@CompanyId() companyId: string) {
        return this.service.getTimeToHire(companyId);
    }

    @Get('sources')
    @Require('analytics:view')
    async sources(@CompanyId() companyId: string) {
        return this.service.getSourceEffectiveness(companyId);
    }

    @Get('recruiters')
    @Require('analytics:view')
    async recruiters(@CompanyId() companyId: string) {
        return this.service.getRecruiterPerformance(companyId);
    }

    @Get('jobs')
    @Require('analytics:view')
    async jobs(@CompanyId() companyId: string) {
        return this.service.getJobPerformance(companyId);
    }
}
