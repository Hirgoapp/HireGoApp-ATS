import { IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { WebhookDeliveryStatus } from '../entities/webhook-log.entity';

export class WebhookLogFilterDto {
    @IsUUID()
    @IsOptional()
    subscriptionId?: string;

    @IsEnum(WebhookDeliveryStatus)
    @IsOptional()
    status?: WebhookDeliveryStatus;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;
}
