import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkUpdateCandidateDto {
    @ApiProperty({
        example: ['uuid-1', 'uuid-2', 'uuid-3'],
        description: 'Array of candidate IDs to update',
        type: [String]
    })
    @IsArray()
    @IsUUID('4', { each: true })
    candidate_ids: string[];

    @ApiPropertyOptional({
        example: 'Screening',
        description: 'New status for all candidates'
    })
    @IsOptional()
    @IsString()
    candidate_status?: string;
    @ApiPropertyOptional({
        example: 'uuid-of-recruiter',
        description: 'Assign all candidates to this recruiter'
    })
    @IsOptional()
    @IsUUID('4')
    recruiter_id?: string;



    @ApiPropertyOptional({
        example: 'Moved to screening phase via bulk operation',
        description: 'Notes to add to all candidates'
    })
    @IsOptional()
    @IsString()
    add_notes?: string;
}

export class BulkUpdateResultDto {
    @ApiProperty({ example: 10, description: 'Total candidates to update' })
    total: number;

    @ApiProperty({ example: 9, description: 'Successfully updated candidates' })
    success: number;

    @ApiProperty({ example: 1, description: 'Failed updates' })
    failed: number;

    @ApiProperty({
        example: [
            { candidate_id: 'uuid-5', error: 'Candidate not found' }
        ],
        description: 'Details of failed updates'
    })
    errors: Array<{
        candidate_id: string;
        error: string;
    }>;

    @ApiProperty({
        example: ['uuid-1', 'uuid-2', 'uuid-3'],
        description: 'IDs of successfully updated candidates',
        type: [String]
    })
    updated_ids: string[];
}
