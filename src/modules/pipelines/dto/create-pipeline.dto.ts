import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StageType } from '../entities/pipeline-stage.entity';

export class CreatePipelineStageDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsInt()
    @Min(1)
    stage_order: number;

    @ApiProperty({ enum: StageType })
    @IsEnum(StageType)
    stage_type: StageType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    color?: string;
}

export class CreatePipelineDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    is_default?: boolean;

    @ApiPropertyOptional({ type: [CreatePipelineStageDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePipelineStageDto)
    stages?: CreatePipelineStageDto[];
}
