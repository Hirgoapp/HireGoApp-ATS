import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { EnqueueBulkImportDto } from './dto/bulk-import.dto';
import { EnqueueReportDto } from './dto/report.dto';
import { EnqueueEmailCampaignDto } from './dto/email.dto';

@Injectable()
export class AsyncJobsService {
    constructor(
        @InjectQueue('bulk-import') private readonly bulkImportQueue: Queue,
        @InjectQueue('reports') private readonly reportsQueue: Queue,
        @InjectQueue('emails') private readonly emailsQueue: Queue,
    ) { }

    async enqueueBulkImport(dto: EnqueueBulkImportDto): Promise<Job> {
        return this.bulkImportQueue.add('candidate-import', dto, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            jobId: dto.label || undefined,
        });
    }

    async enqueueReport(dto: EnqueueReportDto): Promise<Job> {
        return this.reportsQueue.add('generate-report', dto, {
            attempts: 3,
            backoff: { type: 'fixed', delay: 10000 },
            removeOnComplete: true,
            jobId: dto.label || undefined,
        });
    }

    async enqueueEmailCampaign(dto: EnqueueEmailCampaignDto): Promise<Job> {
        return this.emailsQueue.add('send-email-campaign', dto, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            jobId: dto.label || undefined,
        });
    }

    async getJob(queueName: string, id: string): Promise<Job | null> {
        const queue = this.getQueue(queueName);
        return queue.getJob(id);
    }

    async removeJob(queueName: string, id: string): Promise<void> {
        const queue = this.getQueue(queueName);
        const job = await queue.getJob(id);
        if (job) await job.remove();
    }

    async retryJob(queueName: string, id: string): Promise<void> {
        const queue = this.getQueue(queueName);
        const job = await queue.getJob(id);
        if (job) await job.retry();
    }

    async listJobs(queueName: string, state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' = 'waiting', start = 0, end = 50) {
        const queue = this.getQueue(queueName);
        switch (state) {
            case 'waiting':
                return queue.getWaiting(start, end);
            case 'active':
                return queue.getActive(start, end);
            case 'completed':
                return queue.getCompleted(start, end);
            case 'failed':
                return queue.getFailed(start, end);
            case 'delayed':
                return queue.getDelayed(start, end);
        }
    }

    async getStats(queueName: string) {
        const queue = this.getQueue(queueName);
        const counts = await queue.getJobCounts();
        return counts;
    }

    private getQueue(name: string): Queue {
        switch (name) {
            case 'bulk-import':
                return this.bulkImportQueue;
            case 'reports':
                return this.reportsQueue;
            case 'emails':
                return this.emailsQueue;
            default:
                throw new Error(`Unknown queue: ${name}`);
        }
    }
}
