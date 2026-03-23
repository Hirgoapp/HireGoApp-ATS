import apiClient from './apiClient';

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
    lastTested?: string;
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
}

export interface EmailProvider {
    id: 'graph' | 'smtp' | 'sendgrid';
    name: string;
    description: string;
    icon: string;
    requiresConfig: string[];
}

/**
 * Get current email configuration
 */
export async function getEmailConfig(): Promise<EmailConfig> {
    const res = await apiClient.get('/super-admin/email-config');
    return (res.data as any).data as EmailConfig;
}

/**
 * Update email configuration
 */
export async function updateEmailConfig(config: Partial<EmailConfig>): Promise<EmailConfig> {
    const res = await apiClient.patch('/super-admin/email-config', config);
    return (res.data as any).data as EmailConfig;
}

/**
 * Test email configuration
 */
export async function testEmailConfig(
    recipientEmail: string,
    config?: Partial<EmailConfig>
): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post('/super-admin/email-config/test', {
        recipientEmail,
        config,
    });
    return (res.data as any).data as { success: boolean; message: string };
}

/**
 * Get email integration statuses
 */
export async function getIntegrationStatuses(): Promise<IntegrationStatus[]> {
    const res = await apiClient.get('/super-admin/email-config/integrations');
    return (res.data as any).data as IntegrationStatus[];
}

/**
 * Get available email providers
 */
export async function getAvailableProviders(): Promise<EmailProvider[]> {
    const res = await apiClient.get('/super-admin/email-config/providers');
    return (res.data as any).data as EmailProvider[];
}

/**
 * Connect/switch email provider
 */
export async function connectProvider(config: Partial<EmailConfig>): Promise<EmailConfig> {
    const res = await apiClient.post(`/super-admin/email-config/provider/${config.provider}/connect`, config);
    return (res.data as any).data as EmailConfig;
}
