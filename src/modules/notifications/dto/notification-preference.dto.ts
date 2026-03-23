import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class UpdateNotificationPreferenceDto {
    @ApiPropertyOptional({ description: 'Enable/disable in-app notifications' })
    @IsBoolean()
    in_app_enabled?: boolean;

    @ApiPropertyOptional({ description: 'Enable/disable email notifications' })
    @IsBoolean()
    email_enabled?: boolean;
}

export class NotificationPreferenceResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    user_id: string;

    @ApiProperty()
    notification_type: string;

    @ApiProperty()
    in_app_enabled: boolean;

    @ApiProperty()
    email_enabled: boolean;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}
