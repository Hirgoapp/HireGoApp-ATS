import { Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class ReportsService {
    constructor(private readonly analytics: AnalyticsService) { }

    private toCsv(rows: any[], headers: { key: string; label: string }[]): string {
        const headerLine = headers.map(h => h.label).join(',');
        const dataLines = rows.map(r => headers.map(h => this.csvEscape(r[h.key])).join(','));
        return [headerLine, ...dataLines].join('\n');
    }

    private csvEscape(value: any): string {
        if (value === null || value === undefined) return '';
        const s = String(value);
        if (/[",\n]/.test(s)) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    async funnelCsv(companyId: string): Promise<string> {
        const data = await this.analytics.getFunnel(companyId);
        const byStage = this.toCsv(data.byStageType, [
            { key: 'stage_type', label: 'stage_type' },
            { key: 'count', label: 'count' },
        ]);
        const byStatus = this.toCsv(data.byStatus, [
            { key: 'status', label: 'status' },
            { key: 'count', label: 'count' },
        ]);
        return `# Funnel by Stage\n${byStage}\n\n# Funnel by Status\n${byStatus}`;
    }

    async timeToHireCsv(companyId: string): Promise<string> {
        const stats = await this.analytics.getTimeToHire(companyId);
        const rows = [stats];
        return this.toCsv(rows, [
            { key: 'count', label: 'count' },
            { key: 'avgDays', label: 'avg_days' },
            { key: 'medianDays', label: 'median_days' },
            { key: 'p90Days', label: 'p90_days' },
        ]);
    }

    async sourcesCsv(companyId: string): Promise<string> {
        const rows = await this.analytics.getSourceEffectiveness(companyId);
        return this.toCsv(rows, [
            { key: 'sourceId', label: 'source_id' },
            { key: 'applications', label: 'applications' },
            { key: 'hires', label: 'hires' },
            { key: 'conversionRate', label: 'conversion_rate_pct' },
        ]);
    }

    async recruitersCsv(companyId: string): Promise<string> {
        const rows = await this.analytics.getRecruiterPerformance(companyId);
        return this.toCsv(rows, [
            { key: 'userId', label: 'user_id' },
            { key: 'hires', label: 'hires' },
            { key: 'avgDays', label: 'avg_days_to_hire' },
        ]);
    }

    async jobsCsv(companyId: string): Promise<string> {
        const rows = await this.analytics.getJobPerformance(companyId);
        return this.toCsv(rows, [
            { key: 'jobId', label: 'job_id' },
            { key: 'applications', label: 'applications' },
            { key: 'hired', label: 'hires' },
            { key: 'conversionRate', label: 'conversion_rate_pct' },
            { key: 'avgDaysToHire', label: 'avg_days_to_hire' },
        ]);
    }
}
