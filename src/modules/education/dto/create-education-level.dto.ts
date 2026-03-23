import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEducationLevelDto {
    @ApiProperty({ description: 'Education level name', example: 'Bachelor' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Active flag', example: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
