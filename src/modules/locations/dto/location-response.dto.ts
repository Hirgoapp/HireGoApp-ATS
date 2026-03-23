import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationResponseDto {
    @ApiProperty({ description: 'Location ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174001' })
    company_id: string;

    @ApiProperty({ description: 'Location name', example: 'New York Office' })
    name: string;

    @ApiPropertyOptional({ description: 'Location code', example: 'NYC-001' })
    code?: string;

    @ApiPropertyOptional({ description: 'Address' })
    address?: string;

    @ApiPropertyOptional({ description: 'City', example: 'New York' })
    city?: string;

    @ApiPropertyOptional({ description: 'State', example: 'NY' })
    state?: string;

    @ApiPropertyOptional({ description: 'Country', example: 'USA' })
    country?: string;

    @ApiPropertyOptional({ description: 'Postal code', example: '10001' })
    postal_code?: string;

    @ApiPropertyOptional({ description: 'Timezone', example: 'America/New_York' })
    timezone?: string;

    @ApiPropertyOptional({ description: 'Latitude', example: 40.7128 })
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude', example: -74.0060 })
    longitude?: number;

    @ApiProperty({ description: 'Is headquarters', example: false })
    is_headquarters: boolean;

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
