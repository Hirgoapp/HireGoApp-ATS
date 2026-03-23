import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsObject } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
    @ApiProperty({ description: 'User ID to notify' })
    @IsUUID()
    user_id: string;

    @ApiProperty({ enum: NotificationType, description: 'Notification type' })
    @IsEnum(NotificationType)
    type: NotificationType;

    @ApiProperty({ description: 'Notification title' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Notification message' })
    @IsString()
    message: string;

    @ApiPropertyOptional({ description: 'Link to related resource' })
    @IsOptional()
    @IsString()
    link?: string;

    @ApiPropertyOptional({ description: 'Entity type (e.g., application, candidate)' })
    @IsOptional()
    @IsString()
    entity_type?: string;

    @ApiPropertyOptional({ description: 'Entity ID' })
    @IsOptional()
    @IsUUID()
    entity_id?: string;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

export class MarkAsReadDto {
    @ApiProperty({ description: 'Array of notification IDs to mark as read' })
    @IsUUID('4', { each: true })
    notification_ids: string[];
}

export class NotificationFilterDto {
    @ApiPropertyOptional({ description: 'Filter by read/unread status' })
    @IsOptional()
    is_read?: boolean;

    @ApiPropertyOptional({ enum: NotificationType, description: 'Filter by notification type' })
    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    @IsOptional()
    limit?: number = 20;
}
