import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StageType } from '../entities/pipeline-stage.entity';

export class PipelineStageResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    pipeline_id: string;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional()
    description?: string;

    @ApiProperty()
    stage_order: number;

    @ApiProperty({ enum: StageType })
    stage_type: StageType;

    @ApiPropertyOptional()
    color?: string;

    @ApiProperty()
    is_active: boolean;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}

export class PipelineResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    company_id: string;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional()
    description?: string;

    @ApiProperty()
    is_default: boolean;

    @ApiProperty()
    is_active: boolean;

    @ApiPropertyOptional()
    created_by?: string;

    @ApiPropertyOptional()
    updated_by?: string;

    @ApiProperty({ type: [PipelineStageResponseDto] })
    stages?: PipelineStageResponseDto[];

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}
