import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendEmailDto, EmailTemplate } from './interfaces/email.interface';
import axios from 'axios';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;
    private readonly fromEmail: string;
    private readonly fromName: string;
    private readonly providerLabel: string;

    constructor(private readonly configService: ConfigService, private readonly metrics: MetricsService) {
        this.fromEmail = this.configService.get('EMAIL_FROM', 'noreply@ats-saas.com');
        this.fromName = this.configService.get('EMAIL_FROM_NAME', 'hiregoapp');

        // Initialize transporter based on environment
        const emailProvider = this.configService.get('EMAIL_PROVIDER', 'smtp');
        this.providerLabel = emailProvider;

        if (emailProvider === 'sendgrid') {
            this.initializeSendGrid();
        } else if (emailProvider === 'graph') {
            this.initializeGraph();
        } else {
            this.initializeSMTP();
        }
    }

    /**
     * Initialize SendGrid transport
     */
    private initializeSendGrid() {
        const sendgridApiKey = this.configService.get('SENDGRID_API_KEY');

        if (!sendgridApiKey) {
            this.logger.warn('SendGrid API key not configured, email sending disabled');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
                user: 'apikey',
                pass: sendgridApiKey,
            },
        });

        this.logger.log('Email service initialized with SendGrid');
    }

    /**
     * Initialize SMTP transport (fallback)
     */
    private initializeSMTP() {
        const smtpHost = this.configService.get('SMTP_HOST');
        const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');

        if (!smtpHost || !smtpUser || !smtpPass) {
            this.logger.warn('SMTP credentials not configured, email sending disabled');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        this.logger.log('Email service initialized with SMTP');
    }

    /**
     * Initialize Microsoft Graph mail sending (client credentials)
     */
    private initializeGraph() {
        const tenantId = this.configService.get('GRAPH_TENANT_ID');
        const clientId = this.configService.get('GRAPH_CLIENT_ID');
        const clientSecret = this.configService.get('GRAPH_CLIENT_SECRET');
        const fromEmail = this.configService.get('EMAIL_FROM');

        if (!tenantId || !clientId || !clientSecret || !fromEmail) {
            this.logger.warn('Graph mail not configured (missing tenant/client/secret or EMAIL_FROM), email sending disabled');
            return;
        }

        // Transporter remains undefined; we will use fetch token + axios per send
        this.transporter = undefined as any;
        this.logger.log('Email service initialized with Microsoft Graph');
    }

    /**
     * Send email using template
     */
    async sendEmail(emailDto: SendEmailDto): Promise<boolean> {
        try {
            if (this.providerLabel === 'graph') {
                return await this.sendViaGraph(emailDto);
            }

            if (!this.transporter) {
                this.logger.warn('Email transporter not configured, skipping email send');
                return false;
            }

            const html = this.renderTemplate(emailDto.template, emailDto.templateData);

            const mailOptions: nodemailer.SendMailOptions = {
                from: `${this.fromName} <${this.fromEmail}>`,
                to: Array.isArray(emailDto.to) ? emailDto.to.join(', ') : emailDto.to,
                subject: emailDto.subject,
                html,
            };

            if (emailDto.cc) {
                mailOptions.cc = Array.isArray(emailDto.cc) ? emailDto.cc.join(', ') : emailDto.cc;
            }

            if (emailDto.bcc) {
                mailOptions.bcc = Array.isArray(emailDto.bcc) ? emailDto.bcc.join(', ') : emailDto.bcc;
            }

            if (emailDto.attachments) {
                mailOptions.attachments = emailDto.attachments;
            }

            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent successfully: ${result.messageId}`);
            this.metrics.incEmailSend(emailDto.template, this.providerLabel, 'success');
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`, error.stack);
            this.metrics.incEmailSend(emailDto.template, this.providerLabel, 'failure');
            return false;
        }
    }

    private async sendViaGraph(emailDto: SendEmailDto): Promise<boolean> {
        try {
            const tenantId = this.configService.get('GRAPH_TENANT_ID');
            const clientId = this.configService.get('GRAPH_CLIENT_ID');
            const clientSecret = this.configService.get('GRAPH_CLIENT_SECRET');
            const sender = this.configService.get('EMAIL_FROM');

            if (!tenantId || !clientId || !clientSecret || !sender) {
                this.logger.warn('Graph mail missing configuration; skipping send');
                return false;
            }

            // Get token via client credentials
            const tokenResp = await axios.post(
                `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
                new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    scope: 'https://graph.microsoft.com/.default',
                    grant_type: 'client_credentials',
                }).toString(),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const accessToken = tokenResp.data.access_token as string;
            const html = this.renderTemplate(emailDto.template, emailDto.templateData);

            const toRecipients = (Array.isArray(emailDto.to) ? emailDto.to : [emailDto.to]).map((addr) => ({ emailAddress: { address: addr } }));
            const ccRecipients = emailDto.cc ? (Array.isArray(emailDto.cc) ? emailDto.cc : [emailDto.cc]).map((addr) => ({ emailAddress: { address: addr } })) : undefined;
            const bccRecipients = emailDto.bcc ? (Array.isArray(emailDto.bcc) ? emailDto.bcc : [emailDto.bcc]).map((addr) => ({ emailAddress: { address: addr } })) : undefined;

            const message: any = {
                subject: emailDto.subject,
                body: { contentType: 'HTML', content: html },
                toRecipients,
            };
            if (ccRecipients) message.ccRecipients = ccRecipients;
            if (bccRecipients) message.bccRecipients = bccRecipients;

            const payload = { message, saveToSentItems: true };

            const res = await axios.post(
                `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
                payload,
                { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
            );

            this.logger.log(`Graph email sent: status ${res.status}`);
            this.metrics.incEmailSend(emailDto.template, this.providerLabel, 'success');
            return true;
        } catch (err: any) {
            this.logger.error(`Graph email failed: ${err?.response?.status} ${JSON.stringify(err?.response?.data)}`);
            this.metrics.incEmailSend(emailDto.template, this.providerLabel, 'failure');
            return false;
        }
    }

    /**
     * Send bulk emails
     */
    async sendBulkEmails(emails: SendEmailDto[]): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const email of emails) {
            const result = await this.sendEmail(email);
            if (result) {
                success++;
            } else {
                failed++;
            }
        }

        this.logger.log(`Bulk email sent: ${success} success, ${failed} failed`);
        return { success, failed };
    }

    /**
     * Render email template with data
     */
    private renderTemplate(template: EmailTemplate, data: Record<string, any>): string {
        const templates: Record<EmailTemplate, (data: any) => string> = {
            [EmailTemplate.WELCOME]: this.welcomeTemplate,
            [EmailTemplate.INVITATION]: this.invitationTemplate,
            [EmailTemplate.PASSWORD_RESET]: this.passwordResetTemplate,
            [EmailTemplate.EMAIL_VERIFICATION]: this.emailVerificationTemplate,
            [EmailTemplate.APPLICATION_RECEIVED]: this.applicationReceivedTemplate,
            [EmailTemplate.APPLICATION_STATUS_CHANGE]: this.applicationStatusChangeTemplate,
            [EmailTemplate.APPLICATION_REJECTED]: this.applicationRejectedTemplate,
            [EmailTemplate.APPLICATION_HIRED]: this.applicationHiredTemplate,
            [EmailTemplate.INTERVIEW_SCHEDULED]: this.interviewScheduledTemplate,
            [EmailTemplate.INTERVIEW_REMINDER]: this.interviewReminderTemplate,
            [EmailTemplate.INTERVIEW_CANCELLED]: this.interviewCancelledTemplate,
            [EmailTemplate.EVALUATION_REQUESTED]: this.evaluationRequestedTemplate,
            [EmailTemplate.OFFER_SENT]: this.offerSentTemplate,
        };

        const templateFn = templates[template];
        if (!templateFn) {
            this.logger.warn(`Template not found: ${template}`);
            return `<p>Email template not available</p>`;
        }

        return templateFn.call(this, data);
    }

    /**
     * Base email layout
     */
    private baseLayout(content: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: #3B82F6; color: #fff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #3B82F6; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .button:hover { background: #2563EB; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>hiregoapp</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} hiregoapp. All rights reserved.</p>
            <p>This email was sent from an automated system. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    // Email Templates

    private welcomeTemplate(data: { name: string; companyName: string; loginUrl: string }): string {
        return this.baseLayout(`
            <h2>Welcome to ${data.companyName}!</h2>
            <p>Hi ${data.name},</p>
            <p>Your account has been created successfully. You can now log in to the platform and start managing your recruitment process.</p>
            <a href="${data.loginUrl}" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
        `);
    }

    private invitationTemplate(data: { name: string; companyName: string; inviterName: string; acceptUrl: string }): string {
        return this.baseLayout(`
            <h2>You've been invited to join ${data.companyName}</h2>
            <p>Hi ${data.name},</p>
            <p>${data.inviterName} has invited you to join their team on hiregoapp.</p>
            <a href="${data.acceptUrl}" class="button">Accept Invitation</a>
            <p>This invitation will expire in 7 days.</p>
        `);
    }

    private passwordResetTemplate(data: { name: string; resetUrl: string }): string {
        return this.baseLayout(`
            <h2>Password Reset Request</h2>
            <p>Hi ${data.name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        `);
    }

    private emailVerificationTemplate(data: { name: string; verificationUrl: string }): string {
        return this.baseLayout(`
            <h2>Verify Your Email</h2>
            <p>Hi ${data.name},</p>
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${data.verificationUrl}" class="button">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
        `);
    }

    private applicationReceivedTemplate(data: { candidateName: string; jobTitle: string; companyName: string }): string {
        return this.baseLayout(`
            <h2>Application Received</h2>
            <p>Hi ${data.candidateName},</p>
            <p>Thank you for applying for the <strong>${data.jobTitle}</strong> position at ${data.companyName}.</p>
            <p>We have received your application and our team will review it shortly. We'll be in touch soon!</p>
        `);
    }

    private applicationStatusChangeTemplate(data: { candidateName: string; jobTitle: string; oldStatus: string; newStatus: string; stageName: string }): string {
        return this.baseLayout(`
            <h2>Application Status Update</h2>
            <p>Hi ${data.candidateName},</p>
            <p>Your application for <strong>${data.jobTitle}</strong> has been updated.</p>
            <p>New Status: <strong>${data.stageName}</strong></p>
            <p>We appreciate your patience during this process.</p>
        `);
    }

    private applicationRejectedTemplate(data: { candidateName: string; jobTitle: string; companyName: string; feedback?: string }): string {
        return this.baseLayout(`
            <h2>Application Update</h2>
            <p>Hi ${data.candidateName},</p>
            <p>Thank you for your interest in the <strong>${data.jobTitle}</strong> position at ${data.companyName}.</p>
            <p>After careful consideration, we have decided to move forward with other candidates who more closely match our current needs.</p>
            ${data.feedback ? `<p><strong>Feedback:</strong> ${data.feedback}</p>` : ''}
            <p>We appreciate the time you invested in the application process and wish you the best in your job search.</p>
        `);
    }

    private applicationHiredTemplate(data: { candidateName: string; jobTitle: string; companyName: string; startDate?: string }): string {
        return this.baseLayout(`
            <h2>Congratulations!</h2>
            <p>Hi ${data.candidateName},</p>
            <p>We are delighted to inform you that you have been selected for the <strong>${data.jobTitle}</strong> position at ${data.companyName}!</p>
            ${data.startDate ? `<p>Your start date is scheduled for <strong>${data.startDate}</strong>.</p>` : ''}
            <p>Our HR team will be in touch shortly with next steps and onboarding information.</p>
            <p>Welcome to the team!</p>
        `);
    }

    private interviewScheduledTemplate(data: { candidateName: string; jobTitle: string; interviewDate: string; interviewTime: string; interviewType: string; meetingLink?: string; location?: string }): string {
        return this.baseLayout(`
            <h2>Interview Scheduled</h2>
            <p>Hi ${data.candidateName},</p>
            <p>Your interview for the <strong>${data.jobTitle}</strong> position has been scheduled.</p>
            <p><strong>Date:</strong> ${data.interviewDate}</p>
            <p><strong>Time:</strong> ${data.interviewTime}</p>
            <p><strong>Type:</strong> ${data.interviewType}</p>
            ${data.meetingLink ? `<a href="${data.meetingLink}" class="button">Join Virtual Interview</a>` : ''}
            ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
            <p>Please let us know if you need to reschedule. We look forward to speaking with you!</p>
        `);
    }

    private interviewReminderTemplate(data: { candidateName: string; jobTitle: string; interviewDate: string; interviewTime: string; meetingLink?: string }): string {
        return this.baseLayout(`
            <h2>Interview Reminder</h2>
            <p>Hi ${data.candidateName},</p>
            <p>This is a reminder that your interview for <strong>${data.jobTitle}</strong> is scheduled for:</p>
            <p><strong>${data.interviewDate} at ${data.interviewTime}</strong></p>
            ${data.meetingLink ? `<a href="${data.meetingLink}" class="button">Join Interview</a>` : ''}
            <p>See you soon!</p>
        `);
    }

    private interviewCancelledTemplate(data: { candidateName: string; jobTitle: string; reason?: string }): string {
        return this.baseLayout(`
            <h2>Interview Cancelled</h2>
            <p>Hi ${data.candidateName},</p>
            <p>We regret to inform you that your interview for <strong>${data.jobTitle}</strong> has been cancelled.</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            <p>We will reach out to reschedule at a later time.</p>
        `);
    }

    private evaluationRequestedTemplate(data: { evaluatorName: string; candidateName: string; jobTitle: string; evaluationUrl: string; dueDate?: string }): string {
        return this.baseLayout(`
            <h2>Evaluation Request</h2>
            <p>Hi ${data.evaluatorName},</p>
            <p>You have been requested to evaluate <strong>${data.candidateName}</strong> for the <strong>${data.jobTitle}</strong> position.</p>
            <a href="${data.evaluationUrl}" class="button">Submit Evaluation</a>
            ${data.dueDate ? `<p><strong>Due Date:</strong> ${data.dueDate}</p>` : ''}
        `);
    }

    private offerSentTemplate(data: { candidateName: string; jobTitle: string; companyName: string; offerUrl: string; expiryDate?: string }): string {
        return this.baseLayout(`
            <h2>Job Offer</h2>
            <p>Hi ${data.candidateName},</p>
            <p>Congratulations! We are pleased to extend an offer for the <strong>${data.jobTitle}</strong> position at ${data.companyName}.</p>
            <a href="${data.offerUrl}" class="button">View Offer Details</a>
            ${data.expiryDate ? `<p>Please respond by <strong>${data.expiryDate}</strong>.</p>` : ''}
        `);
    }
}
