import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ChangeSubmissionStatusDto {
    @ApiProperty({
        description: 'New status for submission',
        enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'],
    })
    @IsString()
    @IsNotEmpty()
    new_status: string;

    @ApiPropertyOptional({
        description: 'Reason for status change (required for rejected/withdrawn)',
        maxLength: 1000,
    })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    reason?: string;
}
