import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, OnQueueProgress } from '@nestjs/bull';
import { Job } from 'bull';
import { JobsGateway } from '../jobs.gateway';

interface EmailCampaignJobData {
    company_id: string;
    template_id: string;
    recipients: string[];
    label?: string;
    context_json?: string;
}

@Processor('emails')
export class EmailsProcessor {
    constructor(private readonly gateway: JobsGateway) { }

    @OnQueueActive()
    onActive(job: Job<EmailCampaignJobData>) {
        // eslint-disable-next-line no-console
        console.log(`[emails] Active job ${job.id} - ${job.name}`);
        this.gateway.emit('emails', 'active', { id: job.id, name: job.name });
    }

    @OnQueueCompleted()
    onCompleted(job: Job<EmailCampaignJobData>, result: any) {
        // eslint-disable-next-line no-console
        console.log(`[emails] Completed job ${job.id}`, result);
        this.gateway.emit('emails', 'completed', { id: job.id, result });
    }

    @OnQueueFailed()
    onFailed(job: Job<EmailCampaignJobData>, err: Error) {
        // eslint-disable-next-line no-console
        console.error(`[emails] Failed job ${job.id}`, err.message);
        this.gateway.emit('emails', 'failed', { id: job.id, error: err.message });
    }

    @OnQueueProgress()
    onProgress(job: Job<EmailCampaignJobData>, progress: number) {
        this.gateway.emit('emails', 'progress', { id: job.id, progress });
    }

    @Process('send-email-campaign')
    async handleEmailCampaign(job: Job<EmailCampaignJobData>) {
        const { template_id, recipients, context_json } = job.data;

        // Simulate sending emails in batches
        const batchSize = 50;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            await new Promise((res) => setTimeout(res, 100));
            const progressVal = Math.round(((i + batch.length) / recipients.length) * 100);
            await job.progress(progressVal);
        }

        return {
            template_id,
            total: recipients.length,
            sent: recipients.length,
            context: context_json ? JSON.parse(context_json) : undefined,
        };
    }
}
