import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';

@Controller('reports')
@UseGuards(RoleGuard)
export class ReportsController {
    constructor(private readonly service: ReportsService) { }

    private sendCsv(res: Response, filename: string, csv: string) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }

    @Get('analytics/funnel.csv')
    @Require('reports:export')
    async funnel(@CompanyId() companyId: string, @Res() res: Response) {
        const csv = await this.service.funnelCsv(companyId);
        this.sendCsv(res, 'funnel.csv', csv);
    }

    @Get('analytics/time-to-hire.csv')
    @Require('reports:export')
    async timeToHire(@CompanyId() companyId: string, @Res() res: Response) {
        const csv = await this.service.timeToHireCsv(companyId);
        this.sendCsv(res, 'time-to-hire.csv', csv);
    }

    @Get('analytics/sources.csv')
    @Require('reports:export')
    async sources(@CompanyId() companyId: string, @Res() res: Response) {
        const csv = await this.service.sourcesCsv(companyId);
        this.sendCsv(res, 'sources.csv', csv);
    }

    @Get('analytics/recruiters.csv')
    @Require('reports:export')
    async recruiters(@CompanyId() companyId: string, @Res() res: Response) {
        const csv = await this.service.recruitersCsv(companyId);
        this.sendCsv(res, 'recruiters.csv', csv);
    }

    @Get('analytics/jobs.csv')
    @Require('reports:export')
    async jobs(@CompanyId() companyId: string, @Res() res: Response) {
        const csv = await this.service.jobsCsv(companyId);
        this.sendCsv(res, 'jobs.csv', csv);
    }
}
