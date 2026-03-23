import {
    Controller,
    Get,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { ReportService } from '../services/report.service';
import {
    PipelineFunnelDto,
    JobCandidateStatusReportDto,
    RecruiterActivitySummaryDto,
    InterviewMetricsDto,
    OfferMetricsDto,
    JobPerformanceReportDto,
    DashboardSummaryDto,
    DateRangeAnalyticsDto,
} from '../dtos/report.dto';
import { TenantGuard, RoleGuard, CompanyId, Require } from '../../shared/guards';

/**
 * Controller for Report endpoints
 * All endpoints are read-only (GET only)
 * All require reports:read permission
 */
@Controller('api/v1/reports')
@UseGuards(TenantGuard, RoleGuard)
export class ReportController {
    constructor(private readonly service: ReportService) { }

    /**
     * Get dashboard summary
     * GET /api/v1/reports/dashboard
     *
     * High-level overview of recruitment metrics
     */
    @Get('dashboard')
    @Require('reports:read')
    async getDashboardSummary(
        @CompanyId() companyId: string,
    ): Promise<{ success: boolean; data: DashboardSummaryDto }> {
        const report = await this.service.getDashboardSummary(companyId);
        return { success: true, data: report };
    }

    /**
     * Get pipeline funnel report
     * GET /api/v1/reports/pipeline/funnel
     *
     * Shows candidate progression through hiring pipeline
     * Stages: sourced → shortlisted → interviewed → offered → joined
     */
    @Get('pipeline/funnel')
    @Require('reports:read')
    async getPipelineFunnel(
        @CompanyId() companyId: string,
    ): Promise<{ success: boolean; data: PipelineFunnelDto }> {
        const report = await this.service.getPipelineFunnel(companyId);
        return { success: true, data: report };
    }

    /**
     * Get job-wise candidate status
     * GET /api/v1/reports/jobs/candidate-status
     *
     * Breakdown of candidates by job and status
     * Shows distribution across all jobs
     */
    @Get('jobs/candidate-status')
    @Require('reports:read')
    async getJobCandidateStatus(
        @CompanyId() companyId: string,
    ): Promise<{ success: boolean; data: JobCandidateStatusReportDto }> {
        const report = await this.service.getJobCandidateStatus(companyId);
        return { success: true, data: report };
    }

    /**
     * Get job performance report
     * GET /api/v1/reports/jobs/performance
     *
     * Metrics for each job: time to fill, submissions, offers, quality
     */
    @Get('jobs/performance')
    @Require('reports:read')
    async getJobPerformanceReport(
        @CompanyId() companyId: string,
    ): Promise<{ success: boolean; data: JobPerformanceReportDto }> {
        const report = await this.service.getJobPerformanceReport(companyId);
        return { success: true, data: report };
    }

    /**
     * Get recruiter activity summary
     * GET /api/v1/reports/recruiters/activity
     *
     * Performance metrics for each recruiter
     * Query params: period (last_30_days|last_90_days|this_year)
     */
    @Get('recruiters/activity')
    @Require('reports:read')
    async getRecruiterActivitySummary(
        @CompanyId() companyId: string,
        @Query('period') period: 'last_30_days' | 'last_90_days' | 'this_year' = 'last_30_days',
    ): Promise<{ success: boolean; data: RecruiterActivitySummaryDto }> {
        const report = await this.service.getRecruiterActivitySummary(companyId, period);
        return { success: true, data: report };
    }

    /**
     * Get interview metrics
     * GET /api/v1/reports/interviews/metrics
     *
     * Statistics on interviews by round, status, average scores
     */
    @Get('interviews/metrics')
    @Require('reports:read')
    async getInterviewMetrics(
        @CompanyId() companyId: string,
    ): Promise<{ success: boolean; data: InterviewMetricsDto }> {
        const report = await this.service.getInterviewMetrics(companyId);
        return { success: true, data: report };
    }

    /**
     * Get offer metrics
     * GET /api/v1/reports/offers/metrics
     *
     * Statistics on offers: status distribution, acceptance rate, average CTC
     */
    @Get('offers/metrics')
    @Require('reports:read')
    async getOfferMetrics(
        @CompanyId() companyId: string,
    ): Promise<{ success: boolean; data: OfferMetricsDto }> {
        const report = await this.service.getOfferMetrics(companyId);
        return { success: true, data: report };
    }

    /**
     * Get time-series analytics
     * GET /api/v1/reports/analytics/timeline
     *
     * Trends over custom date range
     * Query params:
     *   - fromDate: YYYY-MM-DD
     *   - toDate: YYYY-MM-DD
     *   - period: daily|weekly|monthly
     */
    @Get('analytics/timeline')
    @Require('reports:read')
    async getDateRangeAnalytics(
        @CompanyId() companyId: string,
        @Query('fromDate') fromDateStr: string,
        @Query('toDate') toDateStr: string,
        @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    ): Promise<{ success: boolean; data: DateRangeAnalyticsDto }> {
        const fromDate = new Date(fromDateStr);
        const toDate = new Date(toDateStr);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return {
                success: false,
                data: null,
            };
        }

        const report = await this.service.getDateRangeAnalytics(companyId, fromDate, toDate, period);
        return { success: true, data: report };
    }

    /**
     * Health check - Simple test endpoint
     * GET /api/v1/reports/health
     */
    @Get('health')
    @Require('reports:read')
    async healthCheck(): Promise<{ success: boolean; status: string }> {
        return {
            success: true,
            status: 'Reports module is healthy',
        };
    }
}
