import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, OnQueueProgress } from '@nestjs/bull';
import { Job } from 'bull';
import { JobsGateway } from '../jobs.gateway';

interface ReportJobData {
    company_id: string;
    type: string;
    params?: string;
    label?: string;
}

@Processor('reports')
export class ReportsProcessor {
    constructor(private readonly gateway: JobsGateway) { }

    @OnQueueActive()
    onActive(job: Job<ReportJobData>) {
        // eslint-disable-next-line no-console
        console.log(`[reports] Active job ${job.id} - ${job.name}`);
        this.gateway.emit('reports', 'active', { id: job.id, name: job.name });
    }

    @OnQueueCompleted()
    onCompleted(job: Job<ReportJobData>, result: any) {
        // eslint-disable-next-line no-console
        console.log(`[reports] Completed job ${job.id}`, result);
        this.gateway.emit('reports', 'completed', { id: job.id, result });
    }

    @OnQueueFailed()
    onFailed(job: Job<ReportJobData>, err: Error) {
        // eslint-disable-next-line no-console
        console.error(`[reports] Failed job ${job.id}`, err.message);
        this.gateway.emit('reports', 'failed', { id: job.id, error: err.message });
    }

    @OnQueueProgress()
    onProgress(job: Job<ReportJobData>, progress: number) {
        this.gateway.emit('reports', 'progress', { id: job.id, progress });
    }

    @Process('generate-report')
    async handleGenerateReport(job: Job<ReportJobData>) {
        const { type, params, company_id } = job.data;

        // Simulate report generation with progress
        await job.progress(25);
        await new Promise((res) => setTimeout(res, 500));
        await job.progress(75);
        await new Promise((res) => setTimeout(res, 500));
        await job.progress(100);

        return {
            company_id,
            type,
            params: params ? JSON.parse(params) : undefined,
            url: `/generated-reports/${type}/${job.id}.pdf`,
        };
    }
}
