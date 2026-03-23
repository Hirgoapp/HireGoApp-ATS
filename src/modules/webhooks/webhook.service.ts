import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WebhookSubscription, WebhookEventType } from './entities/webhook-subscription.entity';
import { WebhookLog, WebhookDeliveryStatus } from './entities/webhook-log.entity';
import { CreateWebhookSubscriptionDto, UpdateWebhookSubscriptionDto, WebhookSubscriptionFilterDto } from './dto/webhook-subscription.dto';
import { WebhookLogFilterDto } from './dto/webhook-log.dto';
import * as crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(
        @InjectRepository(WebhookSubscription)
        private readonly subscriptionRepository: Repository<WebhookSubscription>,
        @InjectRepository(WebhookLog)
        private readonly logRepository: Repository<WebhookLog>,
        private readonly metrics: MetricsService,
    ) { }

    /**
     * Create a new webhook subscription
     */
    async createSubscription(
        companyId: string,
        dto: CreateWebhookSubscriptionDto,
    ): Promise<WebhookSubscription> {
        // Generate a secure secret for HMAC signing
        const secret = this.generateSecret();

        const subscription = this.subscriptionRepository.create({
            companyId,
            eventType: dto.eventType,
            targetUrl: dto.targetUrl,
            secret,
            description: dto.description,
            headers: dto.headers,
            retryConfig: dto.retryConfig || { max_retries: 3, retry_delay: 60 },
            isActive: true,
        });

        return await this.subscriptionRepository.save(subscription);
    }

    /**
     * Get all subscriptions for a company
     */
    async getSubscriptions(
        companyId: string,
        filter?: WebhookSubscriptionFilterDto,
    ): Promise<WebhookSubscription[]> {
        const query = this.subscriptionRepository.createQueryBuilder('subscription')
            .where('subscription.companyId = :companyId', { companyId });

        if (filter?.eventType) {
            query.andWhere('subscription.eventType = :eventType', { eventType: filter.eventType });
        }

        if (filter?.isActive !== undefined) {
            query.andWhere('subscription.isActive = :isActive', { isActive: filter.isActive });
        }

        return await query.getMany();
    }

    /**
     * Get a single subscription
     */
    async getSubscription(companyId: string, id: string): Promise<WebhookSubscription> {
        const subscription = await this.subscriptionRepository.findOne({
            where: { id, companyId },
        });

        if (!subscription) {
            throw new NotFoundException('Webhook subscription not found');
        }

        return subscription;
    }

    /**
     * Update a webhook subscription
     */
    async updateSubscription(
        companyId: string,
        id: string,
        dto: UpdateWebhookSubscriptionDto,
    ): Promise<WebhookSubscription> {
        const subscription = await this.getSubscription(companyId, id);

        Object.assign(subscription, dto);

        return await this.subscriptionRepository.save(subscription);
    }

    /**
     * Delete a webhook subscription (soft delete)
     */
    async deleteSubscription(companyId: string, id: string): Promise<void> {
        const subscription = await this.getSubscription(companyId, id);
        await this.subscriptionRepository.softRemove(subscription);
    }

    /**
     * Rotate webhook secret
     */
    async rotateSecret(companyId: string, id: string): Promise<{ secret: string }> {
        const subscription = await this.getSubscription(companyId, id);
        subscription.secret = this.generateSecret();
        await this.subscriptionRepository.save(subscription);
        return { secret: subscription.secret };
    }

    /**
     * Test a webhook subscription
     */
    async testWebhook(companyId: string, id: string): Promise<WebhookLog> {
        const subscription = await this.getSubscription(companyId, id);

        const testPayload = {
            event_type: subscription.eventType,
            test: true,
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook delivery',
            },
        };

        return await this.deliverWebhook(subscription, testPayload);
    }

    /**
     * Publish an event to all subscribed webhooks
     */
    async publishEvent(
        companyId: string,
        eventType: WebhookEventType,
        payload: any,
    ): Promise<void> {
        const subscriptions = await this.subscriptionRepository.find({
            where: {
                companyId,
                eventType,
                isActive: true,
            },
        });

        if (subscriptions.length === 0) {
            this.logger.debug(`No active subscriptions for event ${eventType} in company ${companyId}`);
            return;
        }

        // Deliver webhooks asynchronously
        const deliveryPromises = subscriptions.map(subscription =>
            this.deliverWebhook(subscription, {
                event_type: eventType,
                timestamp: new Date().toISOString(),
                data: payload,
            }).catch(error => {
                this.logger.error(
                    `Failed to deliver webhook for subscription ${subscription.id}:`,
                    error.message,
                );
            }),
        );

        await Promise.allSettled(deliveryPromises);
    }

    /**
     * Deliver a webhook to its target URL
     */
    private async deliverWebhook(
        subscription: WebhookSubscription,
        payload: any,
    ): Promise<WebhookLog> {
        const log = this.logRepository.create({
            companyId: subscription.companyId,
            subscriptionId: subscription.id,
            eventType: subscription.eventType,
            payload,
            status: WebhookDeliveryStatus.PENDING,
            retryCount: 0,
        });

        await this.logRepository.save(log);

        try {
            const signature = this.generateSignature(payload, subscription.secret);

            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Event': subscription.eventType,
                'X-Webhook-ID': log.id,
                ...subscription.headers,
            };

            const response = await axios.post(subscription.targetUrl, payload, {
                headers,
                timeout: 30000, // 30 seconds
                validateStatus: (status) => status >= 200 && status < 600, // Don't throw on any status
            });

            // Consider 2xx as success
            if (response.status >= 200 && response.status < 300) {
                log.status = WebhookDeliveryStatus.SUCCESS;
                log.httpStatus = response.status;
                log.responseBody = JSON.stringify(response.data).substring(0, 5000); // Limit size
                this.metrics.incWebhookDelivery(subscription.eventType, 'success');
            } else {
                log.status = WebhookDeliveryStatus.FAILED;
                log.httpStatus = response.status;
                log.responseBody = JSON.stringify(response.data).substring(0, 5000);
                log.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                this.scheduleRetry(log, subscription);
                this.metrics.incWebhookDelivery(subscription.eventType, 'failure');
            }
        } catch (error) {
            log.status = WebhookDeliveryStatus.FAILED;

            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                log.httpStatus = axiosError.response?.status;
                log.responseBody = JSON.stringify(axiosError.response?.data).substring(0, 5000);
                log.errorMessage = axiosError.message;
            } else {
                log.errorMessage = error.message;
            }

            this.scheduleRetry(log, subscription);
            this.metrics.incWebhookDelivery(subscription.eventType, 'failure');
        }

        return await this.logRepository.save(log);
    }

    /**
     * Schedule a retry for a failed webhook
     */
    private scheduleRetry(log: WebhookLog, subscription: WebhookSubscription): void {
        if (log.retryCount < subscription.retryConfig.max_retries) {
            log.status = WebhookDeliveryStatus.RETRYING;
            const delaySeconds = subscription.retryConfig.retry_delay * Math.pow(2, log.retryCount); // Exponential backoff
            log.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
        }
    }

    /**
     * Process pending webhook retries (runs every minute)
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async processRetries(): Promise<void> {
        const now = new Date();

        const pendingRetries = await this.logRepository.find({
            where: {
                status: WebhookDeliveryStatus.RETRYING,
            },
            relations: ['subscription'],
        });

        const readyRetries = pendingRetries.filter(
            log => log.nextRetryAt && log.nextRetryAt <= now,
        );

        if (readyRetries.length === 0) {
            return;
        }

        this.logger.log(`Processing ${readyRetries.length} webhook retries`);

        for (const log of readyRetries) {
            log.retryCount++;
            await this.logRepository.save(log);

            try {
                await this.deliverWebhook(log.subscription, log.payload);
            } catch (error) {
                this.logger.error(`Retry failed for webhook log ${log.id}:`, error.message);
            }
        }
    }

    /**
     * Get webhook delivery logs
     */
    async getLogs(
        companyId: string,
        filter?: WebhookLogFilterDto,
    ): Promise<WebhookLog[]> {
        const query = this.logRepository.createQueryBuilder('log')
            .leftJoinAndSelect('log.subscription', 'subscription')
            .where('log.companyId = :companyId', { companyId })
            .orderBy('log.createdAt', 'DESC')
            .take(100); // Limit to 100 most recent logs

        if (filter?.subscriptionId) {
            query.andWhere('log.subscriptionId = :subscriptionId', { subscriptionId: filter.subscriptionId });
        }

        if (filter?.status) {
            query.andWhere('log.status = :status', { status: filter.status });
        }

        if (filter?.startDate || filter?.endDate) {
            const startDate = filter.startDate ? new Date(filter.startDate) : new Date(0);
            const endDate = filter.endDate ? new Date(filter.endDate) : new Date();
            query.andWhere('log.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
        }

        return await query.getMany();
    }

    /**
     * Get delivery statistics for a subscription
     */
    async getSubscriptionStats(companyId: string, subscriptionId: string): Promise<any> {
        const subscription = await this.getSubscription(companyId, subscriptionId);

        const [total, successful, failed, pending] = await Promise.all([
            this.logRepository.count({ where: { subscriptionId } }),
            this.logRepository.count({ where: { subscriptionId, status: WebhookDeliveryStatus.SUCCESS } }),
            this.logRepository.count({ where: { subscriptionId, status: WebhookDeliveryStatus.FAILED } }),
            this.logRepository.count({ where: { subscriptionId, status: WebhookDeliveryStatus.RETRYING } }),
        ]);

        return {
            subscriptionId,
            eventType: subscription.eventType,
            isActive: subscription.isActive,
            stats: {
                total,
                successful,
                failed,
                pending,
                successRate: total > 0 ? (successful / total * 100).toFixed(2) + '%' : 'N/A',
            },
        };
    }

    /**
     * Generate a secure random secret for HMAC signing
     */
    private generateSecret(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Generate HMAC signature for webhook payload
     */
    private generateSignature(payload: any, secret: string): string {
        const payloadString = JSON.stringify(payload);
        return crypto
            .createHmac('sha256', secret)
            .update(payloadString)
            .digest('hex');
    }

    /**
     * Verify webhook signature (for incoming webhook validation if needed)
     */
    verifySignature(payload: any, signature: string, secret: string): boolean {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature),
        );
    }
}
