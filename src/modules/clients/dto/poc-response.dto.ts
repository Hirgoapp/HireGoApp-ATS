import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PocResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    company_id: string;

    @ApiProperty()
    client_id: string;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional()
    designation?: string;

    @ApiPropertyOptional()
    email?: string;

    @ApiPropertyOptional()
    phone?: string;

    @ApiPropertyOptional()
    linkedin?: string;

    @ApiPropertyOptional()
    notes?: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;

    @ApiPropertyOptional()
    deleted_at?: Date;
}
