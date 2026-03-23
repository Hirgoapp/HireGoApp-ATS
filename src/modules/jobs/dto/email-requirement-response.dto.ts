import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for email import preview
 * Shows user what was extracted, before confirmation
 */
export class EmailImportPreviewResponseDto {
    @ApiProperty({
        description: 'Job ID (draft)',
    })
    jobId: string;

    @ApiProperty({
        description: 'Raw email content as stored',
    })
    rawEmailContent: string;

    @ApiProperty({
        description: 'Extracted and parsed fields',
    })
    extractedFields: Record<string, any>;

    @ApiProperty({
        description: 'Parsing confidence (0.0-1.0)',
    })
    parsingConfidence: number;

    @ApiProperty({
        description: 'Parsing errors encountered',
    })
    parsingErrors: string[];

    @ApiProperty({
        description: 'Extracted instructions',
    })
    instructions: Array<{
        id: string;
        type: 'submission' | 'interview' | 'compliance' | 'general';
        title: string;
        content: string;
        highlight_level: 'critical' | 'high' | 'normal';
        is_mandatory: boolean;
    }>;

    @ApiProperty({
        description: 'Extracted candidate tracker format',
    })
    candidateTracker: {
        id: string;
        required_fields: Array<{
            field: string;
            type: string;
            required: boolean;
            description: string;
        }>;
        field_order: string[];
        validation_rules: Record<string, any>;
        template_content: string;
    } | null;

    @ApiProperty({
        description: 'Attachment metadata from email',
    })
    attachmentsMetadata: Array<{
        filename: string;
        mimeType: string;
        size: number;
    }>;

    @ApiPropertyOptional({
        description: 'If this is a re-import, shows the matched previous version',
    })
    potentialDuplicateMatch?: {
        previousJobId: string;
        clientReqId: string;
        previousVersion: number;
        lastVersionDate: string;
        versioningAction: 'replace' | 'update' | 'new';
    };
}

/**
 * Response DTO for confirmed requirement creation
 * Returns the newly created requirement (job + related entities)
 */
export class CreateRequirementResponseDto {
    @ApiProperty({
        description: 'Newly created job/requirement ID',
    })
    jobId: string;

    @ApiProperty({
        description: 'Client reference ID from email (ECMS ID)',
    })
    clientReqId: string;

    @ApiProperty({
        description: 'Job title',
    })
    title: string;

    @ApiProperty({
        description: 'Requirement status',
        enum: ['open', 'on_hold', 'closed', 'cancelled', 'replaced'],
    })
    requirementStatus: string;

    @ApiProperty({
        description: 'Version number of this requirement',
    })
    version: number;

    @ApiProperty({
        description: 'Is this the latest version',
    })
    isLatestVersion: boolean;

    @ApiPropertyOptional({
        description: 'If this replaces a previous version, show it',
    })
    replacedPreviousJobId?: string;

    @ApiProperty({
        description: 'Email source record ID',
    })
    emailSourceId: string;

    @ApiProperty({
        description: 'Number of instructions created',
    })
    instructionCount: number;

    @ApiProperty({
        description: 'Whether candidate tracker was created',
    })
    hasCandidateTracker: boolean;

    @ApiProperty({
        description: 'Timestamp created',
    })
    createdAt: string;

    @ApiProperty({
        description: 'Link to fetch full job details',
    })
    detailsUrl: string;
}

/**
 * Response DTO for requirement version history
 */
export class RequirementVersionHistoryResponseDto {
    @ApiProperty({
        description: 'Client requirement ID (ECMS)',
    })
    clientReqId: string;

    @ApiProperty({
        description: 'Total number of versions',
    })
    totalVersions: number;

    @ApiProperty({
        description: 'Current/latest version info',
    })
    currentVersion: {
        jobId: string;
        version: number;
        status: string;
        createdAt: string;
        title: string;
    };

    @ApiProperty({
        description: 'History of all versions (oldest to newest)',
    })
    versions: Array<{
        jobId: string;
        version: number;
        status: 'open' | 'on_hold' | 'closed' | 'cancelled' | 'replaced';
        createdAt: string;
        title: string;
        replacedByJobId?: string;
        replacedByVersion?: number;
    }>;
}

/**
 * Response DTO for fetching raw email + instructions + tracker
 */
export class RequirementDetailsResponseDto {
    @ApiProperty({
        description: 'Job ID',
    })
    jobId: string;

    @ApiProperty({
        description: 'Client requirement ID',
    })
    clientReqId: string;

    @ApiProperty({
        description: 'Job title',
    })
    title: string;

    @ApiProperty({
        description: 'Requirement status',
    })
    status: string;

    @ApiProperty({
        description: 'Version number',
    })
    version: number;

    @ApiProperty({
        description: 'Complete raw email content',
    })
    rawEmail: {
        emailSourceId: string;
        rawEmailContent: string;
        emailSubject?: string;
        emailFrom?: string;
        emailReceivedAt: string;
    };

    @ApiProperty({
        description: 'All instructions for this requirement',
    })
    instructions: Array<{
        id: string;
        type: 'submission' | 'interview' | 'compliance' | 'general';
        title: string;
        content: string;
        highlight_level: 'critical' | 'high' | 'normal';
        is_mandatory: boolean;
        display_order: number;
    }>;

    @ApiProperty({
        description: 'Candidate tracker template',
    })
    candidateTracker: {
        id: string;
        required_fields: Array<{
            field: string;
            type: string;
            required: boolean;
            description: string;
        }>;
        field_order: string[];
        validation_rules: Record<string, any>;
        template_content: string;
    } | null;

    @ApiProperty({
        description: 'Attachment metadata',
    })
    attachmentsMetadata: Array<{
        filename: string;
        mimeType: string;
        size: number;
    }>;

    @ApiPropertyOptional({
        description: 'Link to previous version (if replaced)',
    })
    previousVersionJobId?: string;
}
