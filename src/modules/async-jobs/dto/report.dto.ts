import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnqueueReportDto {
    @ApiProperty({ description: 'Company ID to scope the report', example: 'uuid-company' })
    @IsUUID()
    company_id: string;

    @ApiProperty({ description: 'Report type', example: 'applications-summary' })
    @IsString()
    type: string;

    @ApiPropertyOptional({ description: 'JSON stringified parameters for the report' })
    @IsOptional()
    @IsString()
    params?: string;

    @ApiPropertyOptional({ description: 'Optional label for tracking', example: 'Q1-applications-report' })
    @IsOptional()
    @IsString()
    label?: string;
}
