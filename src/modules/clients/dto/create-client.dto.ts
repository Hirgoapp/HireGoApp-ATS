import { IsString, IsOptional, IsEmail, IsBoolean, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
    @ApiProperty({ description: 'Client name', example: 'Acme Corporation' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Client code', example: 'ACME001' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    code?: string;

    @ApiPropertyOptional({ description: 'Contact person name', example: 'John Doe' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    contact_person?: string;

    @ApiPropertyOptional({ description: 'Email address', example: 'contact@acme.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'Phone number', example: '+1-555-0123' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    phone?: string;

    @ApiPropertyOptional({ description: 'Full address', example: '123 Main St' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'City', example: 'New York' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @ApiPropertyOptional({ description: 'State/Province', example: 'NY' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    state?: string;

    @ApiPropertyOptional({ description: 'Country', example: 'USA' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;

    @ApiPropertyOptional({ description: 'Postal code', example: '10001' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    postal_code?: string;

    @ApiPropertyOptional({ description: 'Website URL', example: 'https://acme.com' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    website?: string;

    @ApiPropertyOptional({ description: 'Industry', example: 'Technology' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    industry?: string;

    @ApiPropertyOptional({ description: 'Client status', example: 'Active', enum: ['Active', 'Inactive', 'Suspended'] })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    status?: string;

    @ApiPropertyOptional({ description: 'Payment terms', example: 'Net 30' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    payment_terms?: string;

    @ApiPropertyOptional({ description: 'Tax ID', example: 'TAX-123456' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    tax_id?: string;

    @ApiPropertyOptional({ description: 'Additional notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Is client active', example: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
