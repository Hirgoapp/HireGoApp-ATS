import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SkillResponseDto {
    @ApiProperty({ description: 'Skill ID' })
    id: string;

    @ApiProperty({ description: 'Company ID' })
    company_id: string;

    @ApiPropertyOptional({ description: 'Category ID' })
    category_id?: string;

    @ApiProperty({ description: 'Skill name' })
    name: string;

    @ApiPropertyOptional({ description: 'Description' })
    description?: string;

    @ApiPropertyOptional({ description: 'Proficiency scale' })
    proficiency_scale?: string;

    @ApiProperty({ description: 'Active flag' })
    is_active: boolean;

    @ApiPropertyOptional({ description: 'Created by' })
    created_by?: string;

    @ApiPropertyOptional({ description: 'Updated by' })
    updated_by?: string;

    @ApiProperty({ description: 'Created at' })
    created_at: Date;

    @ApiProperty({ description: 'Updated at' })
    updated_at: Date;

    @ApiPropertyOptional({ description: 'Deleted at' })
    deleted_at?: Date;
}
