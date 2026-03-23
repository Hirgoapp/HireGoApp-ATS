import { ApiProperty } from '@nestjs/swagger';
import { Application } from '../entities/application.entity';

export class ApplicationResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    company_id: string;

    @ApiProperty()
    candidate_id: number;

    @ApiProperty()
    job_id: number;
    @ApiProperty()
    current_stage_id: string;

    @ApiProperty({ required: false })
    source_id?: string;

    @ApiProperty()
    applied_at: Date;

    @ApiProperty()
    status: string;

    @ApiProperty({ required: false })
    rating?: number;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty({ required: false })
    resume_file_id?: string;

    @ApiProperty({ required: false })
    cover_letter_file_id?: string;

    @ApiProperty()
    metadata: Record<string, any>;

    @ApiProperty({ required: false })
    assigned_to?: string;

    @ApiProperty()
    is_archived: boolean;

    @ApiProperty({ required: false })
    archived_at?: Date;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;

    // Relations (optional, loaded when needed)
    @ApiProperty({ required: false })
    candidate?: any;

    @ApiProperty({ required: false })
    job?: any;

    @ApiProperty({ required: false })
    current_stage?: any;

    @ApiProperty({ required: false })
    source?: any;

    @ApiProperty({ required: false })
    assignee?: any;

    static fromEntity(application: Application): ApplicationResponseDto {
        const dto = new ApplicationResponseDto();
        Object.assign(dto, application);
        return dto;
    }
}

export class ApplicationListResponseDto {
    @ApiProperty({ type: [ApplicationResponseDto] })
    data: ApplicationResponseDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;
}
