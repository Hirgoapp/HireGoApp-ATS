import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for importing a requirement from raw email
 * This is the first step of the workflow: email paste → parse → preview
 */
export class ImportEmailRequirementDto {
    @ApiProperty({
        description: 'Complete raw email content (pasted as-is from email client)',
        example: '545390 - Senior PEGA developer\n\nDear Team,\n\nPlease refer to the requirement...',
    })
    @IsString()
    @IsNotEmpty()
    rawEmailContent: string;

    @ApiPropertyOptional({
        description: 'Email subject line (helps with client_req_id extraction)',
        example: '545390 - Senior PEGA developer - India - EAIS',
    })
    @IsString()
    @IsOptional()
    emailSubject?: string;

    @ApiPropertyOptional({
        description: 'Email sender (parsed if not provided)',
        example: 'recruitment@infosys.com',
    })
    @IsString()
    @IsOptional()
    emailFrom?: string;

    @ApiPropertyOptional({
        description: 'Email received date (ISO string)',
        example: '2024-01-15T10:30:00Z',
    })
    @IsString()
    @IsOptional()
    emailReceivedAt?: string;
}

/**
 * DTO for confirming and creating a requirement
 * This is the final step after user review: save as new version
 */
export class ConfirmImportRequirementDto {
    @ApiProperty({
        description: 'Raw email content (unchanged from preview)',
    })
    @IsString()
    @IsNotEmpty()
    rawEmailContent: string;

    @ApiPropertyOptional({
        description: 'User-edited job fields (any changes from preview)',
    })
    @IsOptional()
    editedFields?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'User-edited instructions (any changes from preview)',
    })
    @IsOptional()
    editedInstructions?: Array<{
        type: string;
        title: string;
        content: string;
        highlight_level: 'critical' | 'high' | 'normal';
        is_mandatory: boolean;
    }>;

    @ApiPropertyOptional({
        description: 'User-edited candidate tracker (any changes from preview)',
    })
    @IsOptional()
    editedCandidateTracker?: {
        required_fields: Array<{
            field: string;
            type: string;
            required: boolean;
            description: string;
        }>;
        field_order: string[];
        validation_rules: Record<string, any>;
        template_content: string;
    };

    @ApiPropertyOptional({
        description: 'Client ID (optional, for linking to known client)',
    })
    @IsString()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional({
        description: 'Approval note (why this requirement is being created/updated)',
    })
    @IsString()
    @IsOptional()
    approvalNote?: string;
}

/**
 * DTO for fetching requirement version history
 * Lists all versions of the same requirement (same client_req_id)
 */
export class RequirementVersionHistoryQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by requirement status',
        enum: ['open', 'on_hold', 'closed', 'cancelled', 'replaced'],
    })
    @IsString()
    @IsOptional()
    status?: string;

    @ApiPropertyOptional({
        description: 'Include replaced versions (default: true)',
    })
    @IsOptional()
    includeReplaced?: boolean;
}
