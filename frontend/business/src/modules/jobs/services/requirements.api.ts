import api from '../../../services/api';

export interface ImportEmailRequirementDto {
    rawEmailContent: string;
    emailSubject?: string;
    emailFrom?: string;
    emailReceivedAt?: string;
}

export interface ConfirmImportRequirementDto {
    rawEmailContent: string;
    editedFields?: Record<string, any>;
    editedInstructions?: Array<{
        type: 'submission' | 'interview' | 'compliance' | 'general';
        title: string;
        content: string;
        highlight_level: 'critical' | 'high' | 'normal';
        is_mandatory: boolean;
    }>;
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
    } | null;
    clientId?: string;
    approvalNote?: string;
}

export interface EmailImportPreviewResponseDto {
    jobId: string;
    rawEmailContent: string;
    extractedFields: Record<string, any>;
    parsingConfidence: number;
    parsingErrors: string[];
    instructions: Array<{
        id: string;
        type: 'submission' | 'interview' | 'compliance' | 'general';
        title: string;
        content: string;
        highlight_level: 'critical' | 'high' | 'normal';
        is_mandatory: boolean;
    }>;
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
    attachmentsMetadata: Array<{
        filename: string;
        mimeType: string;
        size: number;
    }>;
    potentialDuplicateMatch?: {
        previousJobId: string;
        clientReqId: string;
        previousVersion: number;
        lastVersionDate: string;
        versioningAction: 'replace' | 'update' | 'new';
    } | null;
}

export interface CreateRequirementResponseDto {
    jobId: string;
    clientReqId: string;
    title: string;
    requirementStatus: 'open' | 'on_hold' | 'closed' | 'cancelled' | 'replaced';
    version: number;
    isLatestVersion: boolean;
    replacedPreviousJobId?: string;
    emailSourceId: string;
    instructionCount: number;
    hasCandidateTracker: boolean;
    createdAt: string;
    detailsUrl: string;
}

export interface RequirementDetailsResponseDto {
    jobId: string;
    clientReqId: string;
    title: string;
    status: string;
    version: number;
    rawEmail: {
        emailSourceId: string;
        rawEmailContent: string;
        emailSubject?: string;
        emailFrom?: string;
        emailReceivedAt?: string;
    };
    instructions: Array<{
        id: string;
        type: 'submission' | 'interview' | 'compliance' | 'general';
        title: string;
        content: string;
        highlight_level: 'critical' | 'high' | 'normal';
        is_mandatory: boolean;
        display_order: number;
    }>;
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
    attachmentsMetadata: Array<{
        filename: string;
        mimeType: string;
        size: number;
    }>;
    previousVersionJobId?: string;
}

export interface RequirementVersionHistoryResponseDto {
    clientReqId: string;
    totalVersions: number;
    currentVersion: {
        jobId: string;
        version: number;
        status: 'open' | 'on_hold' | 'closed' | 'cancelled' | 'replaced';
        createdAt: string;
        title: string;
    };
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

export async function parseEmailPreview(payload: ImportEmailRequirementDto): Promise<EmailImportPreviewResponseDto> {
    const res = await api.post('/requirements/import/preview', payload);
    return res.data as EmailImportPreviewResponseDto;
}

export async function confirmImportRequirement(payload: ConfirmImportRequirementDto): Promise<CreateRequirementResponseDto> {
    const res = await api.post('/requirements/import/confirm', payload);
    return res.data as CreateRequirementResponseDto;
}

export async function getRequirementDetails(jobId: string): Promise<RequirementDetailsResponseDto> {
    const res = await api.get(`/requirements/${jobId}/details`);
    return res.data as RequirementDetailsResponseDto;
}

export async function getRequirementVersionHistoryByClient(clientReqId: string): Promise<RequirementVersionHistoryResponseDto> {
    const res = await api.get(`/requirements/client/${clientReqId}/versions`);
    return res.data as RequirementVersionHistoryResponseDto;
}
