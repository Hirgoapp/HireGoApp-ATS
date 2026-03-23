import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { CreateNotificationDto, NotificationFilterDto } from './dto/notification.dto';
import { UpdateNotificationPreferenceDto } from './dto/notification-preference.dto';
import { EmailService } from '../email/email.service';
import { EmailTemplate } from '../email/interfaces/email.interface';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(NotificationPreference)
        private readonly preferenceRepository: Repository<NotificationPreference>,
        private readonly emailService: EmailService,
    ) { }

    /**
     * Create a notification for a user
     */
    async create(createDto: CreateNotificationDto, companyId: string): Promise<Notification> {
        // Check user preferences before creating notification
        const preference = await this.getUserPreference(createDto.user_id, createDto.type);

        // If in-app notifications are disabled for this type, skip
        if (preference && !preference.in_app_enabled) {
            return null;
        }

        const notification = this.notificationRepository.create({
            ...createDto,
            company_id: companyId,
        });

        return this.notificationRepository.save(notification);
    }

    /**
     * Create multiple notifications (bulk)
     */
    async createBulk(
        userIds: string[],
        type: NotificationType,
        title: string,
        message: string,
        companyId: string,
        options?: {
            link?: string;
            entity_type?: string;
            entity_id?: string;
            metadata?: Record<string, any>;
        },
    ): Promise<Notification[]> {
        const notifications = [];

        for (const userId of userIds) {
            const preference = await this.getUserPreference(userId, type);

            // Skip if user disabled this notification type
            if (preference && !preference.in_app_enabled) {
                continue;
            }

            const notification = this.notificationRepository.create({
                user_id: userId,
                company_id: companyId,
                type,
                title,
                message,
                ...options,
            });

            notifications.push(notification);
        }

        if (notifications.length > 0) {
            return this.notificationRepository.save(notifications);
        }

        return [];
    }

    /**
     * Get notifications for a user with pagination
     */
    async findByUser(
        userId: string,
        companyId: string,
        filterDto: NotificationFilterDto,
    ): Promise<{ notifications: Notification[]; total: number; unread_count: number }> {
        const { is_read, type, page = 1, limit = 20 } = filterDto;

        const queryBuilder = this.notificationRepository
            .createQueryBuilder('notification')
            .where('notification.user_id = :userId', { userId })
            .andWhere('notification.company_id = :companyId', { companyId });

        if (is_read !== undefined) {
            queryBuilder.andWhere('notification.is_read = :is_read', { is_read });
        }

        if (type) {
            queryBuilder.andWhere('notification.type = :type', { type });
        }

        queryBuilder
            .orderBy('notification.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [notifications, total] = await queryBuilder.getManyAndCount();

        // Get unread count separately
        const unread_count = await this.notificationRepository.count({
            where: {
                user_id: userId,
                company_id: companyId,
                is_read: false,
            },
        });

        return { notifications, total, unread_count };
    }

    /**
     * Mark notifications as read
     */
    async markAsRead(notificationIds: string[], userId: string, companyId: string): Promise<void> {
        await this.notificationRepository
            .createQueryBuilder()
            .update(Notification)
            .set({ is_read: true, read_at: new Date() })
            .where('id IN (:...ids)', { ids: notificationIds })
            .andWhere('user_id = :userId', { userId })
            .andWhere('company_id = :companyId', { companyId })
            .execute();
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string, companyId: string): Promise<void> {
        await this.notificationRepository
            .createQueryBuilder()
            .update(Notification)
            .set({ is_read: true, read_at: new Date() })
            .where('user_id = :userId', { userId })
            .andWhere('company_id = :companyId', { companyId })
            .andWhere('is_read = :is_read', { is_read: false })
            .execute();
    }

    /**
     * Delete a notification
     */
    async delete(id: string, userId: string, companyId: string): Promise<void> {
        const notification = await this.notificationRepository.findOne({
            where: { id, user_id: userId, company_id: companyId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        await this.notificationRepository.remove(notification);
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string, companyId: string): Promise<number> {
        return this.notificationRepository.count({
            where: {
                user_id: userId,
                company_id: companyId,
                is_read: false,
            },
        });
    }

    /**
     * Get user notification preference for a specific type
     */
    async getUserPreference(userId: string, notificationType: NotificationType): Promise<NotificationPreference | null> {
        return this.preferenceRepository.findOne({
            where: { user_id: userId, notification_type: notificationType },
        });
    }

    /**
     * Get all notification preferences for a user
     */
    async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
        return this.preferenceRepository.find({
            where: { user_id: userId },
        });
    }

    /**
     * Update notification preference
     */
    async updatePreference(
        userId: string,
        notificationType: string,
        updateDto: UpdateNotificationPreferenceDto,
    ): Promise<NotificationPreference> {
        let preference = await this.preferenceRepository.findOne({
            where: { user_id: userId, notification_type: notificationType },
        });

        if (!preference) {
            // Create default preference if doesn't exist
            preference = this.preferenceRepository.create({
                user_id: userId,
                notification_type: notificationType,
                in_app_enabled: true,
                email_enabled: true,
            });
        }

        Object.assign(preference, updateDto);
        return this.preferenceRepository.save(preference);
    }

    /**
     * Check if notification should be sent via email (used by email service)
     */
    async shouldSendEmail(userId: string, notificationType: NotificationType): Promise<boolean> {
        const preference = await this.getUserPreference(userId, notificationType);

        // Default to true if no preference set
        if (!preference) {
            return true;
        }

        return preference.email_enabled;
    }

    /**
     * Send notification with optional email
     */
    async createAndNotify(
        createDto: CreateNotificationDto,
        companyId: string,
        emailData?: {
            userEmail: string;
            emailTemplate: EmailTemplate;
            emailSubject: string;
            emailTemplateData: Record<string, any>;
        },
    ): Promise<Notification | null> {
        // Create in-app notification
        const notification = await this.create(createDto, companyId);

        // Send email if provided and user preference allows
        if (emailData && (await this.shouldSendEmail(createDto.user_id, createDto.type))) {
            await this.emailService.sendEmail({
                to: emailData.userEmail,
                subject: emailData.emailSubject,
                template: emailData.emailTemplate,
                templateData: emailData.emailTemplateData,
            });
        }

        return notification;
    }
}
