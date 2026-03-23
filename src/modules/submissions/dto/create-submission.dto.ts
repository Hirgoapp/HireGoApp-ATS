import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    IsObject,
    MaxLength,
} from 'class-validator';

export class CreateSubmissionDto {
    @ApiProperty({
        description: 'Candidate UUID',
        format: 'uuid',
    })
    @IsUUID()
    @IsNotEmpty()
    candidate_id: string;

    @ApiProperty({
        description: 'Job UUID (must belong to same company)',
        format: 'uuid',
    })
    @IsUUID()
    @IsNotEmpty()
    job_id: string;

    @ApiPropertyOptional({
        description: 'Internal notes (text)',
    })
    @IsString()
    @IsOptional()
    @MaxLength(5000)
    internal_notes?: string;

    @ApiPropertyOptional({
        description: 'Source tag (manual/imported/referral)',
    })
    @IsString()
    @IsOptional()
    source?: string;

    @ApiPropertyOptional({
        description: 'Tags (JSON array)',
    })
    @IsObject()
    @IsOptional()
    tags?: any[] | null;
}
