import { ApiProperty } from '@nestjs/swagger';
import { DocumentType, EntityType } from './create-document.dto';

export class DocumentResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    company_id: string;

    @ApiProperty({ enum: EntityType })
    entity_type: EntityType;

    @ApiProperty()
    entity_id: string;

    @ApiProperty()
    file_name: string;

    @ApiProperty()
    original_name: string;

    @ApiProperty()
    file_path: string;

    @ApiProperty()
    file_size: number;

    @ApiProperty()
    mime_type: string;

    @ApiProperty({ enum: DocumentType })
    document_type: DocumentType;

    @ApiProperty()
    storage_type: string;

    @ApiProperty({ required: false })
    extracted_text?: string;

    @ApiProperty({ required: false })
    metadata?: Record<string, any>;

    @ApiProperty()
    is_public: boolean;

    @ApiProperty({ required: false })
    uploaded_by?: string;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}
