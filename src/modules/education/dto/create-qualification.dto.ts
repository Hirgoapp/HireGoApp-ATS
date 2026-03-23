import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQualificationDto {
    @ApiProperty({ description: 'Qualification name', example: 'Bachelor of Science' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Qualification level', example: 'Bachelor' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    level?: string;

    @ApiPropertyOptional({ description: 'Description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Active flag', example: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
