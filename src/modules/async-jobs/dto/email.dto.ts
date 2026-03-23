import { IsString, IsUUID, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnqueueEmailCampaignDto {
    @ApiProperty({ description: 'Company ID for scoping', example: 'uuid-company' })
    @IsUUID()
    company_id: string;

    @ApiProperty({ description: 'Email template ID', example: 'template-ats-updates' })
    @IsString()
    template_id: string;

    @ApiProperty({ description: 'Recipients list' })
    @IsArray()
    recipients: string[];

    @ApiPropertyOptional({ description: 'Optional label for tracking', example: 'Jan-updates' })
    @IsOptional()
    @IsString()
    label?: string;

    @ApiPropertyOptional({ description: 'Optional context payload for template rendering' })
    @IsOptional()
    @IsString()
    context_json?: string;
}
