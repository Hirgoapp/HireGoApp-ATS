import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
    @ApiProperty({ description: 'Location name', example: 'New York Office' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Location code', example: 'NYC-001' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    code?: string;

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

    @ApiPropertyOptional({ description: 'Timezone', example: 'America/New_York' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    timezone?: string;

    @ApiPropertyOptional({ description: 'Latitude', example: 40.7128 })
    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude', example: -74.0060 })
    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;

    @ApiPropertyOptional({ description: 'Is headquarters', example: false })
    @IsOptional()
    @IsBoolean()
    is_headquarters?: boolean;

    @ApiPropertyOptional({ description: 'Is location active', example: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
