import { IsNotEmpty, IsUUID, IsInt, Min, Max, IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluationStatus } from '../entities/evaluation.entity';

export class CreateEvaluationDto {
    @ApiProperty({ description: 'Application UUID' })
    @IsNotEmpty()
    @IsUUID()
    application_id: string;

    @ApiProperty({ description: 'Evaluator (user) UUID' })
    @IsNotEmpty()
    @IsUUID()
    evaluator_id: string;

    @ApiProperty({ description: 'Rating 1-5', minimum: 1, maximum: 5 })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ enum: EvaluationStatus })
    @IsOptional()
    @IsEnum(EvaluationStatus)
    status?: EvaluationStatus;

    @ApiPropertyOptional({ description: 'Detailed feedback' })
    @IsOptional()
    @IsString()
    feedback?: string;

    @ApiPropertyOptional({ description: 'Candidate strengths' })
    @IsOptional()
    @IsString()
    strengths?: string;

    @ApiPropertyOptional({ description: 'Candidate weaknesses' })
    @IsOptional()
    @IsString()
    weaknesses?: string;

    @ApiPropertyOptional({ description: 'Evaluator recommendation' })
    @IsOptional()
    @IsString()
    recommendation?: string;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    metadata?: Record<string, any>;
}

export class UpdateEvaluationDto {
    @ApiPropertyOptional({ description: 'Rating 1-5', minimum: 1, maximum: 5 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiPropertyOptional({ enum: EvaluationStatus })
    @IsOptional()
    @IsEnum(EvaluationStatus)
    status?: EvaluationStatus;

    @ApiPropertyOptional({ description: 'Detailed feedback' })
    @IsOptional()
    @IsString()
    feedback?: string;

    @ApiPropertyOptional({ description: 'Candidate strengths' })
    @IsOptional()
    @IsString()
    strengths?: string;

    @ApiPropertyOptional({ description: 'Candidate weaknesses' })
    @IsOptional()
    @IsString()
    weaknesses?: string;

    @ApiPropertyOptional({ description: 'Evaluator recommendation' })
    @IsOptional()
    @IsString()
    recommendation?: string;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    metadata?: Record<string, any>;
}
