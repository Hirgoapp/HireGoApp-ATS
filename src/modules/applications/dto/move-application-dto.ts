import { IsNotEmpty, IsUUID, IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransitionReason } from '../entities/application-transition.entity';

export class MoveApplicationToStageDto {
    @ApiProperty({ description: 'Target stage UUID' })
    @IsNotEmpty()
    @IsUUID()
    to_stage_id: string;

    @ApiPropertyOptional({ enum: TransitionReason })
    @IsOptional()
    @IsEnum(TransitionReason)
    reason?: TransitionReason;

    @ApiPropertyOptional({ description: 'Transition notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    metadata?: Record<string, any>;
}
