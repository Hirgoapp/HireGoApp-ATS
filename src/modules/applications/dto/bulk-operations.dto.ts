import { IsNotEmpty, IsArray, IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransitionReason } from '../entities/application-transition.entity';

export class BulkMoveToStageDto {
    @ApiProperty({ type: [String], description: 'Array of application UUIDs' })
    @IsNotEmpty()
    @IsArray()
    @IsUUID('4', { each: true })
    application_ids: string[];

    @ApiProperty({ description: 'Target stage UUID' })
    @IsNotEmpty()
    @IsUUID()
    to_stage_id: string;

    @ApiPropertyOptional({ enum: TransitionReason })
    @IsOptional()
    @IsEnum(TransitionReason)
    reason?: TransitionReason;

    @ApiPropertyOptional({ description: 'Bulk operation notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class BulkRejectApplicationsDto {
    @ApiProperty({ type: [String], description: 'Array of application UUIDs' })
    @IsNotEmpty()
    @IsArray()
    @IsUUID('4', { each: true })
    application_ids: string[];

    @ApiProperty({ description: 'Rejection reason' })
    @IsNotEmpty()
    @IsString()
    reason: string;

    @ApiPropertyOptional({ description: 'Rejection notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Notify candidates via email' })
    @IsOptional()
    notify_candidates?: boolean;
}

export class BulkHireApplicationsDto {
    @ApiProperty({ type: [String], description: 'Array of application UUIDs' })
    @IsNotEmpty()
    @IsArray()
    @IsUUID('4', { each: true })
    application_ids: string[];

    @ApiPropertyOptional({ description: 'Hire notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Notify candidates via email' })
    @IsOptional()
    notify_candidates?: boolean;
}

export class BulkOperationResultDto {
    @ApiProperty({ description: 'Number of successful operations' })
    success: number;

    @ApiProperty({ description: 'Number of failed operations' })
    failed: number;

    @ApiProperty({ description: 'Error details by application ID' })
    errors: Record<string, string>;
}
