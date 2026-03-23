import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SourceResponseDto {
    @ApiProperty({ description: 'Source ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174001' })
    company_id: string;

    @ApiProperty({ description: 'Source name', example: 'LinkedIn' })
    name: string;

    @ApiPropertyOptional({ description: 'Source type', example: 'social_media' })
    type?: string;

    @ApiPropertyOptional({ description: 'Description' })
    description?: string;

    @ApiPropertyOptional({ description: 'Cost per hire', example: 500.00 })
    cost_per_hire?: number;

    @ApiPropertyOptional({ description: 'Effectiveness rating (1-5)', example: 4 })
    effectiveness_rating?: number;

    @ApiProperty({ description: 'Is active', example: true })
    is_active: boolean;

    @ApiPropertyOptional({ description: 'Created by user ID' })
    created_by?: string;

    @ApiPropertyOptional({ description: 'Updated by user ID' })
    updated_by?: string;

    @ApiProperty({ description: 'Creation date' })
    created_at: Date;

    @ApiProperty({ description: 'Last update date' })
    updated_at: Date;

    @ApiPropertyOptional({ description: 'Deletion date' })
    deleted_at?: Date;
}
