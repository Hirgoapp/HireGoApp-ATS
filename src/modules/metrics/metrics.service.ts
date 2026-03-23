import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Histogram, Counter } from 'prom-client';

@Injectable()
export class MetricsService {
    private readonly register = new Registry();
    private readonly httpDuration: Histogram<string>;
    private readonly httpRequests: Counter<string>;
    private readonly webhookDeliveries: Counter<string>;
    private readonly emailSends: Counter<string>;

    constructor() {
        collectDefaultMetrics({ register: this.register, prefix: 'ats_' });

        this.httpDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration in seconds',
            labelNames: ['method', 'path', 'status_code'],
            buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
            registers: [this.register],
        });

        this.httpRequests = new Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'path', 'status_code'],
            registers: [this.register],
        });

        this.webhookDeliveries = new Counter({
            name: 'webhook_deliveries_total',
            help: 'Total number of webhook delivery attempts',
            labelNames: ['event', 'status'],
            registers: [this.register],
        });

        this.emailSends = new Counter({
            name: 'email_sends_total',
            help: 'Total number of email send attempts',
            labelNames: ['template', 'provider', 'status'],
            registers: [this.register],
        });
    }

    observeRequest(method: string, path: string, status: number, durationMs: number) {
        const labels = {
            method: (method || 'UNKNOWN').toUpperCase(),
            path: path || 'unknown',
            status_code: String(status || 0),
        } as const;
        this.httpRequests.inc(labels, 1);
        this.httpDuration.observe(labels, durationMs / 1000);
    }

    async metricsText(): Promise<string> {
        return this.register.metrics();
    }

    // Domain metrics helpers
    incWebhookDelivery(event: string, status: 'success' | 'failure') {
        this.webhookDeliveries.inc({ event, status }, 1);
    }

    incEmailSend(template: string, provider: string, status: 'success' | 'failure') {
        this.emailSends.inc({ template, provider, status }, 1);
    }
}
