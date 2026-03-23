import { IsString, IsUUID, IsEnum, IsBoolean, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentType {
    RESUME = 'resume',
    COVER_LETTER = 'cover_letter',
    CERTIFICATE = 'certificate',
    ID_PROOF = 'id_proof',
    CONTRACT = 'contract',
    OFFER_LETTER = 'offer_letter',
    OTHER = 'other',
}

export enum EntityType {
    CANDIDATE = 'candidate',
    JOB = 'job',
    SUBMISSION = 'submission',
    INTERVIEW = 'interview',
    OFFER = 'offer',
}

export class CreateDocumentDto {
    @ApiProperty({ enum: EntityType })
    @IsEnum(EntityType)
    entity_type: EntityType;

    @ApiProperty()
    @IsUUID()
    entity_id: string;

    @ApiProperty({ enum: DocumentType })
    @IsEnum(DocumentType)
    document_type: DocumentType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    is_public?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
