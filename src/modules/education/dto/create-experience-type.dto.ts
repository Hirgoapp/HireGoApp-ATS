import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExperienceTypeDto {
    @ApiProperty({ description: 'Experience type name', example: 'Software Development' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Minimum years of experience', example: 2 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    min_years?: number;

    @ApiPropertyOptional({ description: 'Active flag', example: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
