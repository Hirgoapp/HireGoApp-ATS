import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientResponseDto {
    @ApiProperty({ description: 'Client ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174001' })
    company_id: string;

    @ApiProperty({ description: 'Client name', example: 'Acme Corporation' })
    name: string;

    @ApiPropertyOptional({ description: 'Client code', example: 'ACME001' })
    code?: string;

    @ApiPropertyOptional({ description: 'Contact person', example: 'John Doe' })
    contact_person?: string;

    @ApiPropertyOptional({ description: 'Email', example: 'contact@acme.com' })
    email?: string;

    @ApiPropertyOptional({ description: 'Phone', example: '+1-555-0123' })
    phone?: string;

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

    @ApiPropertyOptional({ description: 'Website', example: 'https://acme.com' })
    website?: string;

    @ApiPropertyOptional({ description: 'Industry', example: 'Technology' })
    industry?: string;

    @ApiProperty({ description: 'Status', example: 'Active' })
    status: string;

    @ApiPropertyOptional({ description: 'Payment terms', example: 'Net 30' })
    payment_terms?: string;

    @ApiPropertyOptional({ description: 'Tax ID', example: 'TAX-123456' })
    tax_id?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;

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
