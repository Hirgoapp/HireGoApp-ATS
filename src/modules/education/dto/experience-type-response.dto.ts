import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExperienceTypeResponseDto {
    @ApiProperty({ description: 'Experience type ID' })
    id: string;

    @ApiProperty({ description: 'Company ID' })
    company_id: string;

    @ApiProperty({ description: 'Experience type name' })
    name: string;

    @ApiPropertyOptional({ description: 'Description' })
    description?: string;

    @ApiProperty({ description: 'Minimum years required' })
    min_years: number;

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
