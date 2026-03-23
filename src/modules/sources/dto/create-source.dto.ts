import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSourceDto {
    @ApiProperty({ description: 'Source name', example: 'LinkedIn' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Source type', example: 'social_media', enum: ['job_board', 'referral', 'social_media', 'career_site', 'agency'] })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    type?: string;

    @ApiPropertyOptional({ description: 'Source description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Cost per hire', example: 500.00 })
    @IsOptional()
    @IsNumber()
    cost_per_hire?: number;

    @ApiPropertyOptional({ description: 'Effectiveness rating (1-5)', example: 4, minimum: 1, maximum: 5 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    effectiveness_rating?: number;

    @ApiPropertyOptional({ description: 'Is source active', example: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
