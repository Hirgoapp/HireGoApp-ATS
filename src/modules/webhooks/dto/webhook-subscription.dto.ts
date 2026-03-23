import { IsEnum, IsString, IsUrl, IsBoolean, IsOptional, IsObject, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { WebhookEventType } from '../entities/webhook-subscription.entity';

export class RetryConfigDto {
    @IsInt()
    @Min(0)
    max_retries: number;

    @IsInt()
    @Min(0)
    retry_delay: number;
}

export class CreateWebhookSubscriptionDto {
    @IsEnum(WebhookEventType)
    eventType: WebhookEventType;

    @IsUrl({ require_tld: false })
    targetUrl: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsObject()
    @IsOptional()
    headers?: Record<string, string>;

    @ValidateNested()
    @Type(() => RetryConfigDto)
    @IsOptional()
    retryConfig?: RetryConfigDto;
}

export class UpdateWebhookSubscriptionDto {
    @IsUrl({ require_tld: false })
    @IsOptional()
    targetUrl?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsString()
    @IsOptional()
    description?: string;

    @IsObject()
    @IsOptional()
    headers?: Record<string, string>;

    @ValidateNested()
    @Type(() => RetryConfigDto)
    @IsOptional()
    retryConfig?: RetryConfigDto;
}

export class WebhookSubscriptionFilterDto {
    @IsEnum(WebhookEventType)
    @IsOptional()
    eventType?: WebhookEventType;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
