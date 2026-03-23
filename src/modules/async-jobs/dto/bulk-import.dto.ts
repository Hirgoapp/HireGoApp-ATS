import { IsString, IsUUID, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnqueueBulkImportDto {
    @ApiProperty({ description: 'Company ID to scope the import', example: 'uuid-company' })
    @IsUUID()
    company_id: string;

    @ApiProperty({ description: 'CSV file location (path or signed URL)' })
    @IsString()
    file_path: string;

    @ApiPropertyOptional({ description: 'Optional job label for tracking', example: 'Q1-candidate-import' })
    @IsOptional()
    @IsString()
    label?: string;

    @ApiPropertyOptional({ description: 'Dry run to validate without persisting', default: false })
    @IsOptional()
    @IsBoolean()
    dry_run?: boolean;

    @ApiPropertyOptional({ description: 'Input format', enum: ['csv', 'json'], default: 'csv' })
    @IsOptional()
    @IsIn(['csv', 'json'])
    format?: 'csv' | 'json';
}
