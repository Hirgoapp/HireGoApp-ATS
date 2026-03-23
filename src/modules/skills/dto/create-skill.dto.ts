import { IsString, IsOptional, IsUUID, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillDto {
    @ApiProperty({ description: 'Skill name', example: 'TypeScript' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Category ID' })
    @IsOptional()
    @IsUUID()
    category_id?: string;

    @ApiPropertyOptional({ description: 'Skill description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Proficiency scale label', example: 'Advanced' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    proficiency_scale?: string;

    @ApiPropertyOptional({ description: 'Active flag', example: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
