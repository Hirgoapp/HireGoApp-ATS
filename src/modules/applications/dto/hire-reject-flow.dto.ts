import { IsUUID, IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RejectionReasonType } from '../entities/rejection-reason.entity';

export class HireApplicationDto {
    @ApiPropertyOptional({ description: 'Hire notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Notify candidate via email' })
    @IsOptional()
    notify_candidate?: boolean;
}

export class RejectApplicationDto {
    @ApiProperty({ enum: RejectionReasonType })
    @IsNotEmpty()
    @IsEnum(RejectionReasonType)
    reason_type: RejectionReasonType;

    @ApiProperty({ description: 'Detailed rejection reason' })
    @IsNotEmpty()
    @IsString()
    reason_details: string;

    @ApiPropertyOptional({ description: 'Notify candidate via email' })
    @IsOptional()
    notify_candidate?: boolean;
}

export class WithdrawApplicationDto {
    @ApiPropertyOptional({ description: 'Withdrawal reason' })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class HireFlowResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    current_stage_id: string;

    @ApiProperty()
    hired_at: Date;

    @ApiProperty()
    message: string;
}

export class RejectFlowResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    current_stage_id: string;

    @ApiProperty()
    rejection_reason_id: string;

    @ApiProperty()
    rejected_at: Date;

    @ApiProperty()
    message: string;
}
