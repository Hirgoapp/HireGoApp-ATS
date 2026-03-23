import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { EmailModule } from '../email/email.module';
import { EventPublisherService } from './event-publisher.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, NotificationPreference]),
        EmailModule,
    ],
    controllers: [NotificationController],
    providers: [NotificationService, EventPublisherService],
    exports: [NotificationService, EventPublisherService],
})
export class NotificationsModule { }
