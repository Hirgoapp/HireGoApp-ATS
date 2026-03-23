export enum EmailTemplate {
    WELCOME = 'welcome',
    INVITATION = 'invitation',
    PASSWORD_RESET = 'password_reset',
    EMAIL_VERIFICATION = 'email_verification',
    APPLICATION_RECEIVED = 'application_received',
    APPLICATION_STATUS_CHANGE = 'application_status_change',
    APPLICATION_REJECTED = 'application_rejected',
    APPLICATION_HIRED = 'application_hired',
    INTERVIEW_SCHEDULED = 'interview_scheduled',
    INTERVIEW_REMINDER = 'interview_reminder',
    INTERVIEW_CANCELLED = 'interview_cancelled',
    EVALUATION_REQUESTED = 'evaluation_requested',
    OFFER_SENT = 'offer_sent',
}

export interface EmailTemplateData {
    [key: string]: any;
}

export interface SendEmailDto {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    template: EmailTemplate;
    templateData: EmailTemplateData;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}
