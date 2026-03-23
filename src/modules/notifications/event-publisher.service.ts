import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { EmailTemplate } from '../email/interfaces/email.interface';

/**
 * Event publisher service for triggering notifications and emails
 * This service acts as a bridge between domain events and notification/email systems
 */
@Injectable()
export class EventPublisherService {
    private readonly logger = new Logger(EventPublisherService.name);

    constructor(private readonly notificationService: NotificationService) { }

    /**
     * Publish application created event
     */
    async publishApplicationCreated(data: {
        companyId: string;
        userId: string;
        userEmail: string;
        candidateName: string;
        jobTitle: string;
        applicationId: string;
    }): Promise<void> {
        try {
            await this.notificationService.createAndNotify(
                {
                    user_id: data.userId,
                    type: NotificationType.APPLICATION_CREATED,
                    title: 'New Application Received',
                    message: `${data.candidateName} has applied for ${data.jobTitle}`,
                    entity_type: 'application',
                    entity_id: data.applicationId,
                    link: `/applications/${data.applicationId}`,
                },
                data.companyId,
                {
                    userEmail: data.userEmail,
                    emailTemplate: EmailTemplate.APPLICATION_RECEIVED,
                    emailSubject: `Application Received: ${data.jobTitle}`,
                    emailTemplateData: {
                        candidateName: data.candidateName,
                        jobTitle: data.jobTitle,
                        companyName: 'hiregoapp',
                    },
                },
            );
        } catch (error) {
            this.logger.error(`Failed to publish application created event: ${error.message}`);
        }
    }

    /**
     * Publish application stage changed event
     */
    async publishApplicationStageChanged(data: {
        companyId: string;
        userId: string;
        userEmail: string;
        candidateName: string;
        jobTitle: string;
        oldStage: string;
        newStage: string;
        applicationId: string;
    }): Promise<void> {
        try {
            await this.notificationService.createAndNotify(
                {
                    user_id: data.userId,
                    type: NotificationType.APPLICATION_STAGE_CHANGED,
                    title: 'Application Status Updated',
                    message: `${data.candidateName}'s application moved to ${data.newStage}`,
                    entity_type: 'application',
                    entity_id: data.applicationId,
                    link: `/applications/${data.applicationId}`,
                },
                data.companyId,
                {
                    userEmail: data.userEmail,
                    emailTemplate: EmailTemplate.APPLICATION_STATUS_CHANGE,
                    emailSubject: `Application Update: ${data.jobTitle}`,
                    emailTemplateData: {
                        candidateName: data.candidateName,
                        jobTitle: data.jobTitle,
                        oldStatus: data.oldStage,
                        newStatus: data.newStage,
                        stageName: data.newStage,
                    },
                },
            );
        } catch (error) {
            this.logger.error(`Failed to publish application stage changed event: ${error.message}`);
        }
    }

    /**
     * Publish application rejected event
     */
    async publishApplicationRejected(data: {
        companyId: string;
        userId: string;
        userEmail: string;
        candidateName: string;
        jobTitle: string;
        applicationId: string;
        feedback?: string;
    }): Promise<void> {
        try {
            await this.notificationService.createAndNotify(
                {
                    user_id: data.userId,
                    type: NotificationType.APPLICATION_REJECTED,
                    title: 'Application Rejected',
                    message: `${data.candidateName}'s application for ${data.jobTitle} has been rejected`,
                    entity_type: 'application',
                    entity_id: data.applicationId,
                    link: `/applications/${data.applicationId}`,
                },
                data.companyId,
                {
                    userEmail: data.userEmail,
                    emailTemplate: EmailTemplate.APPLICATION_REJECTED,
                    emailSubject: `Application Update: ${data.jobTitle}`,
                    emailTemplateData: {
                        candidateName: data.candidateName,
                        jobTitle: data.jobTitle,
                        companyName: 'hiregoapp',
                        feedback: data.feedback,
                    },
                },
            );
        } catch (error) {
            this.logger.error(`Failed to publish application rejected event: ${error.message}`);
        }
    }

    /**
     * Publish application hired event
     */
    async publishApplicationHired(data: {
        companyId: string;
        userId: string;
        userEmail: string;
        candidateName: string;
        jobTitle: string;
        applicationId: string;
        startDate?: string;
    }): Promise<void> {
        try {
            await this.notificationService.createAndNotify(
                {
                    user_id: data.userId,
                    type: NotificationType.APPLICATION_HIRED,
                    title: 'Candidate Hired',
                    message: `${data.candidateName} has been hired for ${data.jobTitle}`,
                    entity_type: 'application',
                    entity_id: data.applicationId,
                    link: `/applications/${data.applicationId}`,
                },
                data.companyId,
                {
                    userEmail: data.userEmail,
                    emailTemplate: EmailTemplate.APPLICATION_HIRED,
                    emailSubject: `Congratulations - ${data.jobTitle}`,
                    emailTemplateData: {
                        candidateName: data.candidateName,
                        jobTitle: data.jobTitle,
                        companyName: 'hiregoapp',
                        startDate: data.startDate,
                    },
                },
            );
        } catch (error) {
            this.logger.error(`Failed to publish application hired event: ${error.message}`);
        }
    }

    /**
     * Publish interview scheduled event
     */
    async publishInterviewScheduled(data: {
        companyId: string;
        userId: string;
        userEmail: string;
        candidateName: string;
        jobTitle: string;
        interviewDate: string;
        interviewTime: string;
        interviewType: string;
        meetingLink?: string;
        location?: string;
        interviewId: string;
    }): Promise<void> {
        try {
            await this.notificationService.createAndNotify(
                {
                    user_id: data.userId,
                    type: NotificationType.INTERVIEW_SCHEDULED,
                    title: 'Interview Scheduled',
                    message: `Interview with ${data.candidateName} scheduled for ${data.interviewDate}`,
                    entity_type: 'interview',
                    entity_id: data.interviewId,
                    link: `/interviews/${data.interviewId}`,
                },
                data.companyId,
                {
                    userEmail: data.userEmail,
                    emailTemplate: EmailTemplate.INTERVIEW_SCHEDULED,
                    emailSubject: `Interview Scheduled: ${data.jobTitle}`,
                    emailTemplateData: {
                        candidateName: data.candidateName,
                        jobTitle: data.jobTitle,
                        interviewDate: data.interviewDate,
                        interviewTime: data.interviewTime,
                        interviewType: data.interviewType,
                        meetingLink: data.meetingLink,
                        location: data.location,
                    },
                },
            );
        } catch (error) {
            this.logger.error(`Failed to publish interview scheduled event: ${error.message}`);
        }
    }

    /**
     * Publish evaluation requested event
     */
    async publishEvaluationRequested(data: {
        companyId: string;
        evaluatorId: string;
        evaluatorEmail: string;
        evaluatorName: string;
        candidateName: string;
        jobTitle: string;
        evaluationUrl: string;
        dueDate?: string;
    }): Promise<void> {
        try {
            await this.notificationService.createAndNotify(
                {
                    user_id: data.evaluatorId,
                    type: NotificationType.EVALUATION_REQUESTED,
                    title: 'Evaluation Request',
                    message: `Please evaluate ${data.candidateName} for ${data.jobTitle}`,
                    link: data.evaluationUrl,
                },
                data.companyId,
                {
                    userEmail: data.evaluatorEmail,
                    emailTemplate: EmailTemplate.EVALUATION_REQUESTED,
                    emailSubject: `Evaluation Request: ${data.candidateName}`,
                    emailTemplateData: {
                        evaluatorName: data.evaluatorName,
                        candidateName: data.candidateName,
                        jobTitle: data.jobTitle,
                        evaluationUrl: data.evaluationUrl,
                        dueDate: data.dueDate,
                    },
                },
            );
        } catch (error) {
            this.logger.error(`Failed to publish evaluation requested event: ${error.message}`);
        }
    }
}
