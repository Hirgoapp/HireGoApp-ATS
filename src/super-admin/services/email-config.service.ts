import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

export interface EmailConfig {
    provider: 'graph' | 'smtp' | 'sendgrid';
    fromEmail: string;
    fromName: string;
    graph?: {
        tenantId: string;
        clientId: string;
        clientSecret: string;
    };
    smtp?: {
        host: string;
        port: number;
        user: string;
        pass: string;
        secure: boolean;
    };
    sendgrid?: {
        apiKey: string;
    };
}

export interface IntegrationStatus {
    type: 'graph' | 'smtp' | 'sendgrid';
    label: string;
    isConnected: boolean;
    lastTested?: Date;
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
}

@Injectable()
export class EmailConfigService {
    private readonly logger = new Logger(EmailConfigService.name);

    constructor(private readonly configService: ConfigService) { }

    /**
     * Get current email configuration
     */
    async getEmailConfig(): Promise<EmailConfig> {
        const provider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp');
        const fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@ats-saas.com');
        const fromName = this.configService.get<string>('EMAIL_FROM_NAME', 'ATS Platform');

        const config: EmailConfig = {
            provider: provider as 'graph' | 'smtp' | 'sendgrid',
            fromEmail,
            fromName,
        };

        // Add provider-specific config (without secrets)
        if (provider === 'graph') {
            config.graph = {
                tenantId: this.configService.get<string>('GRAPH_TENANT_ID', ''),
                clientId: this.configService.get<string>('GRAPH_CLIENT_ID', ''),
                clientSecret: this.maskSecret(this.configService.get<string>('GRAPH_CLIENT_SECRET', '')),
            };
        } else if (provider === 'smtp') {
            config.smtp = {
                host: this.configService.get<string>('SMTP_HOST', ''),
                port: this.configService.get<number>('SMTP_PORT', 587),
                user: this.configService.get<string>('SMTP_USER', ''),
                pass: this.maskSecret(this.configService.get<string>('SMTP_PASS', '')),
                secure: this.configService.get<number>('SMTP_PORT', 587) === 465,
            };
        } else if (provider === 'sendgrid') {
            config.sendgrid = {
                apiKey: this.maskSecret(this.configService.get<string>('SENDGRID_API_KEY', '')),
            };
        }

        return config;
    }

    /**
     * Update email configuration
     */
    async updateEmailConfig(config: Partial<EmailConfig>): Promise<EmailConfig> {
        if (!config.provider || !['graph', 'smtp', 'sendgrid'].includes(config.provider)) {
            throw new BadRequestException('Invalid email provider');
        }

        if (!config.fromEmail || !config.fromName) {
            throw new BadRequestException('From email and name are required');
        }

        // Validate provider-specific config
        if (config.provider === 'graph' && config.graph) {
            if (!config.graph.tenantId || !config.graph.clientId || !config.graph.clientSecret) {
                throw new BadRequestException('Graph provider requires tenantId, clientId, and clientSecret');
            }
        } else if (config.provider === 'smtp' && config.smtp) {
            if (!config.smtp.host || !config.smtp.port || !config.smtp.user || !config.smtp.pass) {
                throw new BadRequestException('SMTP provider requires host, port, user, and pass');
            }
        } else if (config.provider === 'sendgrid' && config.sendgrid) {
            if (!config.sendgrid.apiKey) {
                throw new BadRequestException('SendGrid provider requires apiKey');
            }
        }

        // In production, you would store this encrypted in a database/vault
        // For now, we log the configuration change
        this.logger.log(`Email configuration updated for provider: ${config.provider}`);

        return this.getEmailConfig();
    }

    /**
     * Test email configuration by sending a test email
     */
    async testEmailConfig(config: Partial<EmailConfig>, recipientEmail: string): Promise<{ success: boolean; message: string }> {
        try {
            const provider = config.provider || this.configService.get('EMAIL_PROVIDER', 'smtp');

            if (provider === 'graph') {
                return await this.testGraphConfig(config.graph, config.fromEmail || 'support@workatyourplace.com', recipientEmail);
            } else if (provider === 'smtp') {
                return await this.testSmtpConfig(config.smtp, config.fromEmail, recipientEmail);
            } else if (provider === 'sendgrid') {
                return await this.testSendGridConfig(config.sendgrid, config.fromEmail, recipientEmail);
            }

            throw new BadRequestException('Invalid email provider');
        } catch (error: any) {
            this.logger.error('Email configuration test failed', error.message);
            return {
                success: false,
                message: error.message || 'Failed to send test email',
            };
        }
    }

    /**
     * Test Microsoft Graph configuration
     */
    private async testGraphConfig(
        config: any,
        fromEmail: string,
        recipientEmail: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            if (!config?.tenantId || !config?.clientId || !config?.clientSecret) {
                throw new BadRequestException('Missing Graph credentials');
            }

            // Get access token
            const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
            const tokenResponse = await axios.post(tokenUrl, undefined, {
                params: {
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    scope: 'https://graph.microsoft.com/.default',
                    grant_type: 'client_credentials',
                },
            });

            const accessToken = tokenResponse.data.access_token;

            // Send test email
            await axios.post(
                'https://graph.microsoft.com/v1.0/me/sendMail',
                {
                    message: {
                        subject: 'Email Configuration Test',
                        body: {
                            contentType: 'HTML',
                            content: '<p>This is a test email to verify your email configuration is working correctly.</p>',
                        },
                        toRecipients: [
                            {
                                emailAddress: {
                                    address: recipientEmail,
                                },
                            },
                        ],
                        from: {
                            emailAddress: {
                                address: fromEmail,
                                name: 'ATS Platform Test',
                            },
                        },
                    },
                    saveToSentItems: true,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            return {
                success: true,
                message: `Test email sent successfully to ${recipientEmail}`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Graph configuration test failed: ${error.response?.data?.error?.message || error.message}`,
            };
        }
    }

    /**
     * Test SMTP configuration
     */
    private async testSmtpConfig(config: any, fromEmail: string, recipientEmail: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!config?.host || !config?.port || !config?.user || !config?.pass) {
                throw new BadRequestException('Missing SMTP credentials');
            }

            const transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.secure || config.port === 465,
                auth: {
                    user: config.user,
                    pass: config.pass,
                },
            });

            await transporter.sendMail({
                from: `${fromEmail}`,
                to: recipientEmail,
                subject: 'Email Configuration Test',
                html: '<p>This is a test email to verify your SMTP configuration is working correctly.</p>',
            });

            return {
                success: true,
                message: `Test email sent successfully to ${recipientEmail}`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `SMTP configuration test failed: ${error.message}`,
            };
        }
    }

    /**
     * Test SendGrid configuration
     */
    private async testSendGridConfig(config: any, fromEmail: string, recipientEmail: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!config?.apiKey) {
                throw new BadRequestException('Missing SendGrid API key');
            }

            const response = await axios.post(
                'https://api.sendgrid.com/v3/mail/send',
                {
                    personalizations: [
                        {
                            to: [{ email: recipientEmail }],
                        },
                    ],
                    from: {
                        email: fromEmail,
                        name: 'ATS Platform Test',
                    },
                    subject: 'Email Configuration Test',
                    content: [
                        {
                            type: 'text/html',
                            value: '<p>This is a test email to verify your SendGrid configuration is working correctly.</p>',
                        },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${config.apiKey}`,
                    },
                }
            );

            return {
                success: true,
                message: `Test email sent successfully to ${recipientEmail}`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `SendGrid configuration test failed: ${error.response?.data?.errors?.[0]?.message || error.message}`,
            };
        }
    }

    /**
     * Get all integration statuses
     */
    async getIntegrationStatuses(): Promise<IntegrationStatus[]> {
        const currentProvider = this.configService.get('EMAIL_PROVIDER', 'smtp');

        return [
            {
                type: 'graph',
                label: 'Microsoft Graph / Office 365',
                isConnected: currentProvider === 'graph',
                status: currentProvider === 'graph' ? 'connected' : 'disconnected',
            },
            {
                type: 'smtp',
                label: 'SMTP Server',
                isConnected: currentProvider === 'smtp',
                status: currentProvider === 'smtp' ? 'connected' : 'disconnected',
            },
            {
                type: 'sendgrid',
                label: 'SendGrid',
                isConnected: currentProvider === 'sendgrid',
                status: currentProvider === 'sendgrid' ? 'connected' : 'disconnected',
            },
        ];
    }

    /**
     * Mask sensitive information
     */
    private maskSecret(secret: string): string {
        if (!secret || secret.length < 8) {
            return '***';
        }
        return secret.substring(0, 4) + '***' + secret.substring(secret.length - 4);
    }
}
