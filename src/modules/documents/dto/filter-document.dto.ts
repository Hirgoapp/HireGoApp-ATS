import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType, EntityType } from './create-document.dto';

export class FilterDocumentDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(EntityType)
    entity_type?: EntityType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    entity_id?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(DocumentType)
    document_type?: DocumentType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @ApiPropertyOptional({ default: 'created_at' })
    @IsOptional()
    @IsString()
    sortBy?: string = 'created_at';

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
