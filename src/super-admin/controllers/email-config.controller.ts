import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { EmailConfigService, EmailConfig, IntegrationStatus } from '../services/email-config.service';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@ApiTags('Super Admin - Email Configuration')
@ApiBearerAuth()
@Controller('api/super-admin/email-config')
@UseGuards(SuperAdminGuard)
export class EmailConfigController {
    constructor(private readonly emailConfigService: EmailConfigService) { }

    /**
     * GET /api/super-admin/email-config
     * Get current email configuration
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get current email configuration' })
    @ApiResponse({
        status: 200,
        description: 'Email configuration retrieved',
        schema: {
            example: {
                success: true,
                data: {
                    provider: 'graph',
                    fromEmail: 'support@workatyourplace.com',
                    fromName: 'ATS Platform',
                    graph: {
                        tenantId: 'a4b0c5a1-b570-4ad4-bc66-b79d79588e7b',
                        clientId: '31ef6058-bcc8-4803-80d4-6089e37d9fc3',
                        clientSecret: '***[MASKED]***',
                    },
                },
            },
        },
    })
    async getEmailConfig() {
        const config = await this.emailConfigService.getEmailConfig();
        return {
            success: true,
            data: config,
        };
    }

    /**
     * PATCH /api/super-admin/email-config
     * Update email configuration
     */
    @Patch()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update email configuration' })
    @ApiResponse({
        status: 200,
        description: 'Email configuration updated',
    })
    async updateEmailConfig(@Body() body: Partial<EmailConfig>) {
        if (!body) {
            throw new BadRequestException('Configuration data is required');
        }

        const config = await this.emailConfigService.updateEmailConfig(body);
        return {
            success: true,
            data: config,
            message: 'Email configuration updated successfully',
        };
    }

    /**
     * POST /api/super-admin/email-config/test
     * Test email configuration
     */
    @Post('test')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Test email configuration' })
    @ApiResponse({
        status: 200,
        description: 'Test email sent',
        schema: {
            example: {
                success: true,
                data: {
                    success: true,
                    message: 'Test email sent successfully to test@example.com',
                },
            },
        },
    })
    async testEmailConfig(
        @Body()
        body: {
            recipientEmail: string;
            config?: Partial<EmailConfig>;
        }
    ) {
        if (!body.recipientEmail) {
            throw new BadRequestException('Recipient email is required');
        }

        const result = await this.emailConfigService.testEmailConfig(
            body.config || {},
            body.recipientEmail
        );

        return {
            success: true,
            data: result,
        };
    }

    /**
     * GET /api/super-admin/email-config/integrations
     * Get email integration statuses
     */
    @Get('integrations')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get email integration statuses' })
    @ApiResponse({
        status: 200,
        description: 'Integration statuses retrieved',
        schema: {
            example: {
                success: true,
                data: [
                    {
                        type: 'graph',
                        label: 'Microsoft Graph / Office 365',
                        isConnected: true,
                        status: 'connected',
                    },
                    {
                        type: 'smtp',
                        label: 'SMTP Server',
                        isConnected: false,
                        status: 'disconnected',
                    },
                    {
                        type: 'sendgrid',
                        label: 'SendGrid',
                        isConnected: false,
                        status: 'disconnected',
                    },
                ],
            },
        },
    })
    async getIntegrationStatuses(): Promise<{ success: boolean; data: IntegrationStatus[] }> {
        const statuses = await this.emailConfigService.getIntegrationStatuses();
        return {
            success: true,
            data: statuses,
        };
    }

    /**
     * POST /api/super-admin/email-config/provider/:type/connect
     * Connect email provider (switch active provider)
     */
    @Post('provider/:type/connect')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Connect/switch email provider' })
    async connectProvider(@Body() body: Partial<EmailConfig>) {
        if (!body.provider) {
            throw new BadRequestException('Provider type is required');
        }

        const config = await this.emailConfigService.updateEmailConfig(body);
        return {
            success: true,
            data: config,
            message: `Email provider switched to ${body.provider}`,
        };
    }

    /**
     * GET /api/super-admin/email-config/providers
     * Get list of available email providers
     */
    @Get('providers')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get available email providers' })
    @ApiResponse({
        status: 200,
        description: 'List of available email providers',
        schema: {
            example: {
                success: true,
                data: [
                    {
                        id: 'graph',
                        name: 'Microsoft Graph / Office 365',
                        description: 'Send emails via Microsoft Graph API',
                        icon: '☁️',
                        requiresConfig: ['tenantId', 'clientId', 'clientSecret'],
                    },
                    {
                        id: 'smtp',
                        name: 'SMTP Server',
                        description: 'Standard SMTP email server',
                        icon: '✉️',
                        requiresConfig: ['host', 'port', 'user', 'pass'],
                    },
                    {
                        id: 'sendgrid',
                        name: 'SendGrid',
                        description: 'SendGrid email delivery service',
                        icon: '📬',
                        requiresConfig: ['apiKey'],
                    },
                ],
            },
        },
    })
    async getAvailableProviders() {
        const providers = [
            {
                id: 'graph',
                name: 'Microsoft Graph / Office 365',
                description: 'Send emails via Microsoft Graph API',
                icon: '☁️',
                requiresConfig: ['tenantId', 'clientId', 'clientSecret'],
            },
            {
                id: 'smtp',
                name: 'SMTP Server',
                description: 'Standard SMTP email server',
                icon: '✉️',
                requiresConfig: ['host', 'port', 'user', 'pass'],
            },
            {
                id: 'sendgrid',
                name: 'SendGrid',
                description: 'SendGrid email delivery service',
                icon: '📬',
                requiresConfig: ['apiKey'],
            },
        ];

        return {
            success: true,
            data: providers,
        };
    }
}
