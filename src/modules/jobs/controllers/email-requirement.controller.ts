import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../../common/guards/tenant.guard';
// import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { EmailRequirementService } from '../services/email-requirement.service';
import {
    ImportEmailRequirementDto,
    ConfirmImportRequirementDto,
    RequirementVersionHistoryQueryDto,
} from '../dto/import-email-requirement.dto';
import {
    EmailImportPreviewResponseDto,
    CreateRequirementResponseDto,
    RequirementVersionHistoryResponseDto,
    RequirementDetailsResponseDto,
} from '../dto/email-requirement-response.dto';

/**
 * EmailRequirementController
 * Handles all endpoints for email-driven requirement import workflow
 *
 * Public endpoints:
 * - POST /requirements/import/preview - Parse email and show preview
 * - POST /requirements/import/confirm - Confirm and create requirement
 * - GET /requirements/{jobId}/details - Get complete requirement details
 * - GET /requirements/{clientReqId}/versions - Get version history
 *
 * Requirements are treated as requirements (not jobs), and versioned by ECMS ID
 */
@ApiTags('Email Requirements')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard)  // Uncomment after guard import is available
@Controller('api/v1/requirements')
export class EmailRequirementController {
    constructor(private readonly emailRequirementService: EmailRequirementService) { }

    /**
     * STEP 1: Import Email - Parse and Preview
     * Accepts raw email paste, extracts fields, shows preview
     * Does NOT create anything yet
     *
     * @param importDto - Raw email content + optional metadata
     * @param req - Request with user context
     * @returns Preview with extracted fields, instructions, tracker, confidence score
     */
    @Post('import/preview')
    @ApiOperation({
        summary: 'Parse email and preview extracted requirement data',
        description: `
First step of email import workflow:
1. User pastes raw email content
2. Service parses and extracts fields
3. Returns preview for user review
4. User can edit fields before confirming
        `,
    })
    @ApiResponse({
        status: 200,
        description: 'Preview generated successfully (no data saved)',
        type: EmailImportPreviewResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid email content or parsing error',
    })
    @HttpCode(HttpStatus.OK)
    async parseEmailPreview(
        @Body() importDto: ImportEmailRequirementDto,
        @Req() req: any,
    ): Promise<EmailImportPreviewResponseDto> {
        const companyId = req.user?.company_id || req.company_id;
        const userId = req.user?.userId || req.userId;

        return this.emailRequirementService.parseEmailPreview(
            importDto,
            companyId,
            userId,
        );
    }

    /**
     * STEP 2: Confirm Import - Create Requirement
     * User has reviewed preview and approved/edited fields
     * Now create Job + JobEmailSource + Instructions + CandidateTracker
     *
     * If client_req_id matches existing, marks old as 'replaced' and creates new version
     *
     * @param confirmDto - Finalized data from preview (user edits applied)
     * @param req - Request with user context
     * @returns Created requirement ID + metadata
     */
    @Post('import/confirm')
    @ApiOperation({
        summary: 'Confirm import and create requirement (with versioning)',
        description: `
Second step of email import workflow:
1. User has reviewed preview and edited fields
2. Service creates: Job + JobEmailSource + Instructions + CandidateTracker
3. If client_req_id matches existing: marks old as 'replaced', creates new version
4. Returns created IDs and version info
        `,
    })
    @ApiResponse({
        status: 201,
        description: 'Requirement created successfully (or new version if re-import)',
        type: CreateRequirementResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid data or missing required fields',
    })
    @ApiResponse({
        status: 409,
        description: 'Versioning conflict or duplicate requirement',
    })
    @HttpCode(HttpStatus.CREATED)
    async confirmImportRequirement(
        @Body() confirmDto: ConfirmImportRequirementDto,
        @Req() req: any,
    ): Promise<CreateRequirementResponseDto> {
        const companyId = req.user?.company_id || req.company_id;
        const userId = req.user?.userId || req.userId;

        return this.emailRequirementService.confirmImportRequirement(
            confirmDto,
            companyId,
            userId,
        );
    }

    /**
     * Get Requirement Details (Raw Email + Instructions + Tracker)
     * Fetch complete information for a requirement version
     * Includes:
     * - Raw email content (source of truth)
     * - All instructions with highlight levels
     * - Candidate tracker template
     * - Attachment metadata
     * - Link to previous version if applicable
     *
     * @param jobId - Job/Requirement ID
     * @param req - Request with user context
     * @returns Complete requirement details
     */
    @Get(':jobId/details')
    @ApiOperation({
        summary: 'Get complete requirement details including raw email, instructions, tracker',
    })
    @ApiResponse({
        status: 200,
        description: 'Requirement details fetched',
        type: RequirementDetailsResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Requirement not found',
    })
    @HttpCode(HttpStatus.OK)
    async getRequirementDetails(
        @Param('jobId') jobId: string,
        @Req() req: any,
    ): Promise<RequirementDetailsResponseDto> {
        const companyId = req.user?.company_id || req.company_id;

        return this.emailRequirementService.getRequirementDetails(jobId, companyId);
    }

    /**
     * Get Requirement Version History
     * Fetch all versions of a requirement (by client_req_id / ECMS ID)
     * Shows versioning chain: v1 → v2 (v1 replaced) → v3 (v2 replaced)
     *
     * Query Parameters:
     * - status: Filter by status (open|on_hold|closed|cancelled|replaced)
     * - includeReplaced: Include 'replaced' status versions (default: true)
     *
     * @param clientReqId - ECMS ID or client requirement ID
     * @param queryDto - Query filters
     * @param req - Request with user context
     * @returns Version history with status and replacement chain
     */
    @Get('client/:clientReqId/versions')
    @ApiOperation({
        summary: 'Get version history for requirement (by ECMS ID)',
        description: `
Fetch all versions of a requirement identified by client_req_id (ECMS ID).
Shows the complete versioning chain:
- v1 (open) → imported 2024-01-15
- v2 (replaced) → imported 2024-01-20 (replaced v1)
- v3 (open) → imported 2024-01-25 (replaced v2)

Use query params to filter by status or exclude replaced versions.
        `,
    })
    @ApiResponse({
        status: 200,
        description: 'Version history retrieved',
        type: RequirementVersionHistoryResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Requirement not found',
    })
    @HttpCode(HttpStatus.OK)
    async getRequirementVersionHistory(
        @Param('clientReqId') clientReqId: string,
        @Query() queryDto: RequirementVersionHistoryQueryDto,
        @Req() req: any,
    ): Promise<RequirementVersionHistoryResponseDto> {
        const companyId = req.user?.company_id || req.company_id;

        return this.emailRequirementService.getRequirementVersionHistory(
            clientReqId,
            companyId,
            queryDto,
        );
    }

    /**
     * Alternative endpoint: Get version history by job ID
     * Useful when user has a specific job and wants to see its version chain
     *
     * @param jobId - Job ID to find its requirement and show version history
     * @param queryDto - Query filters
     * @param req - Request with user context
     * @returns Version history for the requirement this job belongs to
     */
    @Get(':jobId/versions')
    @ApiOperation({
        summary: 'Get version history starting from a specific job ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Version history retrieved',
        type: RequirementVersionHistoryResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Job or requirement not found',
    })
    @HttpCode(HttpStatus.OK)
    async getVersionHistoryFromJob(
        @Param('jobId') jobId: string,
        @Query() queryDto: RequirementVersionHistoryQueryDto,
        @Req() req: any,
    ): Promise<RequirementVersionHistoryResponseDto> {
        const companyId = req.user?.company_id || req.company_id;

        // First fetch the job to get its client_req_id
        // Note: Implementation assumes EmailRequirementService has a getJob method
        // For now, we'll need to add this to the service
        // This is a helper endpoint - we'll implement after service is finalized

        throw new Error('This endpoint needs service implementation');
    }
}
