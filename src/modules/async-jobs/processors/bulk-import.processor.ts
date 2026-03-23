import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, OnQueueProgress } from '@nestjs/bull';
import { Job } from 'bull';
import { JobsGateway } from '../jobs.gateway';

interface BulkImportData {
    company_id: string;
    file_path: string;
    label?: string;
    dry_run?: boolean;
    format?: 'csv' | 'json';
}

@Processor('bulk-import')
export class BulkImportProcessor {
    constructor(private readonly gateway: JobsGateway) { }
    @OnQueueActive()
    onActive(job: Job<BulkImportData>) {
        // eslint-disable-next-line no-console
        console.log(`[bulk-import] Active job ${job.id} - ${job.name}`);
        this.gateway.emit('bulk-import', 'active', { id: job.id, name: job.name });
    }

    @OnQueueCompleted()
    onCompleted(job: Job<BulkImportData>, result: any) {
        // eslint-disable-next-line no-console
        console.log(`[bulk-import] Completed job ${job.id}`, result);
        this.gateway.emit('bulk-import', 'completed', { id: job.id, result });
    }

    @OnQueueFailed()
    onFailed(job: Job<BulkImportData>, err: Error) {
        // eslint-disable-next-line no-console
        console.error(`[bulk-import] Failed job ${job.id}`, err.message);
        this.gateway.emit('bulk-import', 'failed', { id: job.id, error: err.message });
    }

    @OnQueueProgress()
    onProgress(job: Job<BulkImportData>, progress: number) {
        this.gateway.emit('bulk-import', 'progress', { id: job.id, progress });
    }

    @Process('candidate-import')
    async handleCandidateImport(job: Job<BulkImportData>) {
        const { file_path, company_id, dry_run, format = 'csv' } = job.data;

        // Simulate reading input in chunks
        const total = 1000;
        for (let i = 0; i < total; i += 100) {
            // Simulate processing chunk
            await new Promise((res) => setTimeout(res, 100));
            await job.progress(Math.round(((i + 100) / total) * 100));
            this.gateway.emit('bulk-import', 'progress', { id: job.id, progress: Math.round(((i + 100) / total) * 100) });
        }

        // Return summary
        return {
            processed: total,
            errors: 0,
            dry_run: !!dry_run,
            company_id,
            file_path,
            format,
        };
    }
}
