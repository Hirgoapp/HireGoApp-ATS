import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { WebhookService } from './webhook.service';
import { CreateWebhookSubscriptionDto, UpdateWebhookSubscriptionDto, WebhookSubscriptionFilterDto } from './dto/webhook-subscription.dto';
import { WebhookLogFilterDto } from './dto/webhook-log.dto';

@Controller('api/v1/webhooks')
@UseGuards(RoleGuard)
export class WebhookController {
    constructor(private readonly webhookService: WebhookService) { }

    /**
     * Create a new webhook subscription
     * POST /webhooks/subscriptions
     */
    @Post('subscriptions')
    @Require('webhooks:create')
    async createSubscription(
        @CompanyId() companyId: string,
        @Body() dto: CreateWebhookSubscriptionDto,
    ) {
        return await this.webhookService.createSubscription(companyId, dto);
    }

    /**
     * Get all webhook subscriptions
     * GET /webhooks/subscriptions
     */
    @Get('subscriptions')
    @Require('webhooks:read')
    async getSubscriptions(
        @CompanyId() companyId: string,
        @Query() filter: WebhookSubscriptionFilterDto,
    ) {
        return await this.webhookService.getSubscriptions(companyId, filter);
    }

    /**
     * Get a single webhook subscription
     * GET /webhooks/subscriptions/:id
     */
    @Get('subscriptions/:id')
    @Require('webhooks:read')
    async getSubscription(
        @CompanyId() companyId: string,
        @Param('id') id: string,
    ) {
        return await this.webhookService.getSubscription(companyId, id);
    }

    /**
     * Update a webhook subscription
     * PUT /webhooks/subscriptions/:id
     */
    @Put('subscriptions/:id')
    @Require('webhooks:update')
    async updateSubscription(
        @CompanyId() companyId: string,
        @Param('id') id: string,
        @Body() dto: UpdateWebhookSubscriptionDto,
    ) {
        return await this.webhookService.updateSubscription(companyId, id, dto);
    }

    /**
     * Delete a webhook subscription
     * DELETE /webhooks/subscriptions/:id
     */
    @Delete('subscriptions/:id')
    @Require('webhooks:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteSubscription(
        @CompanyId() companyId: string,
        @Param('id') id: string,
    ) {
        await this.webhookService.deleteSubscription(companyId, id);
    }

    /**
     * Rotate webhook secret
     * POST /webhooks/subscriptions/:id/rotate-secret
     */
    @Post('subscriptions/:id/rotate-secret')
    @Require('webhooks:update')
    async rotateSecret(
        @CompanyId() companyId: string,
        @Param('id') id: string,
    ) {
        return await this.webhookService.rotateSecret(companyId, id);
    }

    /**
     * Test a webhook subscription
     * POST /webhooks/subscriptions/:id/test
     */
    @Post('subscriptions/:id/test')
    @Require('webhooks:test')
    async testWebhook(
        @CompanyId() companyId: string,
        @Param('id') id: string,
    ) {
        return await this.webhookService.testWebhook(companyId, id);
    }

    /**
     * Get webhook subscription statistics
     * GET /webhooks/subscriptions/:id/stats
     */
    @Get('subscriptions/:id/stats')
    @Require('webhooks:read')
    async getSubscriptionStats(
        @CompanyId() companyId: string,
        @Param('id') id: string,
    ) {
        return await this.webhookService.getSubscriptionStats(companyId, id);
    }

    /**
     * Get webhook delivery logs
     * GET /webhooks/logs
     */
    @Get('logs')
    @Require('webhooks:read')
    async getLogs(
        @CompanyId() companyId: string,
        @Query() filter: WebhookLogFilterDto,
    ) {
        return await this.webhookService.getLogs(companyId, filter);
    }
}
