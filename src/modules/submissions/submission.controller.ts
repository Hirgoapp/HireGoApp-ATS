import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    Logger,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubmissionService } from './services/submission.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { ChangeSubmissionStatusDto } from './dto/change-status.dto';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { Submission } from './entities/submission.entity';

/** Comma-separated: `candidate`, `candidates`, `job`, `jobs` (e.g. `include=candidate,job`). */
function parseSubmissionInclude(include?: string): { includeCandidate: boolean; includeJob: boolean } {
    const parts = (include ?? '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return {
        includeCandidate: parts.some((p) => p === 'candidate' || p === 'candidates'),
        includeJob: parts.some((p) => p === 'job' || p === 'jobs'),
    };
}

@ApiTags('Submissions')
@ApiBearerAuth('access-token')
@UseGuards(PermissionGuard, TenantGuard)
@Controller('api/v1/submissions')
export class SubmissionController {
    private readonly logger = new Logger(SubmissionController.name);

    constructor(private readonly submissionService: SubmissionService) { }

    /**
     * Create new submission
     * Status automatically set to 'applied'
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermissions('submissions:create')
    @ApiOperation({
        summary: 'Create submission',
        description: 'Create a new candidate application to a job. Status automatically set to "applied".',
    })
    @ApiResponse({ status: 201, description: 'Submission created', type: Submission })
    @ApiResponse({ status: 409, description: 'Duplicate submission (candidate already applied)' })
    @ApiResponse({ status: 404, description: 'Candidate or job not found' })
    async createSubmission(
        @Body() createDto: CreateSubmissionDto,
        @Req() req: any,
    ): Promise<Submission> {
        const { companyId, userId } = req.tenant;
        return this.submissionService.createSubmission(String(companyId), createDto, Number(userId));
    }

    /**
     * Get submission by ID
     */
    @Get(':id')
    @RequirePermissions('submissions:view')
    @ApiOperation({
        summary: 'Get submission',
        description: 'Get submission details by ID',
    })
    @ApiResponse({ status: 200, description: 'Submission retrieved', type: Submission })
    @ApiResponse({ status: 404, description: 'Submission not found' })
    async getSubmissionById(
        @Param('id') submissionId: string,
        @Req() req: any,
    ): Promise<Submission> {
        const { companyId } = req.tenant;
        return this.submissionService.getSubmissionById(submissionId, String(companyId));
    }

    /**
     * Update submission details (cover letter, salary, notes)
     */
    @Patch(':id')
    @RequirePermissions('submissions:update')
    @ApiOperation({
        summary: 'Update submission',
        description: 'Update submission details (not status). Use /status endpoint to change status.',
    })
    @ApiResponse({ status: 200, description: 'Submission updated', type: Submission })
    @ApiResponse({ status: 404, description: 'Submission not found' })
    async updateSubmission(
        @Param('id') submissionId: string,
        @Body() updateDto: UpdateSubmissionDto,
        @Req() req: any,
    ): Promise<Submission> {
        const { companyId, userId } = req.tenant;
        return this.submissionService.updateSubmission(
            submissionId,
            String(companyId),
            updateDto,
            Number(userId),
        );
    }

    /**
     * Change submission status with validation
     */
    @Patch(':id/status')
    @RequirePermissions('submissions:update')
    @ApiOperation({
        summary: 'Change submission status',
        description:
            'Transition submission to new status following state machine rules. Terminal states cannot transition.',
    })
    @ApiResponse({ status: 200, description: 'Status changed', type: Submission })
    @ApiResponse({ status: 400, description: 'Invalid status transition' })
    @ApiResponse({ status: 404, description: 'Submission not found' })
    @ApiResponse({ status: 409, description: 'Cannot transition from terminal state' })
    async changeSubmissionStatus(
        @Param('id') submissionId: string,
        @Body() changeDto: ChangeSubmissionStatusDto,
        @Req() req: any,
    ): Promise<Submission> {
        const { companyId, userId } = req.tenant;
        return this.submissionService.changeStatus(
            submissionId,
            String(companyId),
            changeDto,
            Number(userId),
        );
    }

    /**
     * Get submission status history
     */
    @Get(':id/history')
    @RequirePermissions('submissions:view')
    @ApiOperation({
        summary: 'Get submission history',
        description: 'Get all status transitions for a submission with audit trail',
    })
    @ApiResponse({ status: 200, description: 'Status history retrieved' })
    @ApiResponse({ status: 404, description: 'Submission not found' })
    async getStatusHistory(
        @Param('id') submissionId: string,
        @Req() req: any,
    ) {
        const { companyId } = req.tenant;
        return this.submissionService.getStatusHistory(submissionId, String(companyId));
    }

    /**
     * Get submissions for a specific job
     */
    @Get('job/:jobId/submissions')
    @RequirePermissions('submissions:view')
    @ApiOperation({
        summary: 'Get submissions for job',
        description: 'Get all submissions for a specific job with optional filtering by status',
    })
    @ApiResponse({ status: 200, description: 'Submissions retrieved' })
    @ApiResponse({ status: 404, description: 'Job not found' })
    async getSubmissionsByJob(
        @Param('jobId') jobId: string,
        @Query('status') status?: string,
        @Query('skip') skip: number = 0,
        @Query('take') take: number = 20,
        @Query('include') include?: string,
        @Req() req?: any,
    ) {
        const { companyId } = req.tenant;
        const { includeCandidate, includeJob } = parseSubmissionInclude(include);
        return this.submissionService.getSubmissionsByJobId(
            jobId,
            String(companyId),
            skip,
            take,
            status as any,
            includeCandidate,
            includeJob,
        );
    }

    /**
     * Get submissions for a specific candidate
     */
    @Get('candidate/:candidateId/submissions')
    @RequirePermissions('submissions:view')
    @ApiOperation({
        summary: 'Get submissions for candidate',
        description: 'Get all submissions for a specific candidate',
    })
    @ApiResponse({ status: 200, description: 'Submissions retrieved' })
    @ApiResponse({ status: 404, description: 'Candidate not found' })
    async getSubmissionsByCandidate(
        @Param('candidateId') candidateIdParam: string,
        @Query('status') status?: string,
        @Query('skip') skip: number = 0,
        @Query('take') take: number = 20,
        @Query('include') include?: string,
        @Req() req?: any,
    ) {
        const { companyId } = req.tenant;
        const { includeCandidate, includeJob } = parseSubmissionInclude(include);
        return this.submissionService.getSubmissionsByCandidateId(
            candidateIdParam,
            String(companyId),
            skip,
            take,
            status as any,
            includeJob,
            includeCandidate,
        );
    }

    /**
     * Get all submissions for company
     */
    @Get()
    @RequirePermissions('submissions:view')
    @ApiOperation({
        summary: 'List submissions',
        description: 'Get all submissions with optional filtering by status/job/candidate',
    })
    @ApiResponse({ status: 200, description: 'Submissions retrieved' })
    async getAllSubmissions(
        @Query('status') status?: string,
        @Query('job_id') jobId?: string,
        @Query('candidate_id') candidateIdParam?: string,
        @Query('skip') skip: number = 0,
        @Query('take') take: number = 20,
        @Query('include') include?: string,
        @Req() req?: any,
    ) {
        const { companyId } = req.tenant;
        const { includeCandidate, includeJob } = parseSubmissionInclude(include);
        return this.submissionService.getAllSubmissions(String(companyId), skip, take, {
            status: status as any,
            job_id: jobId,
            candidate_id: candidateIdParam || undefined,
            include_candidate: includeCandidate,
            include_job: includeJob,
        });
    }

    /**
     * Get submission status breakdown
     */
    @Get('stats/by-status')
    @RequirePermissions('submissions:view')
    @ApiOperation({
        summary: 'Get submission stats',
        description: 'Get count of submissions by status for a job or company',
    })
    @ApiResponse({ status: 200, description: 'Stats retrieved' })
    async getStatusStats(
        @Query('job_id') jobId?: string,
        @Req() req?: any,
    ) {
        const { companyId } = req.tenant;
        return this.submissionService.getStatusStats(String(companyId), jobId);
    }

    /**
     * Delete (soft delete) submission
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @RequirePermissions('submissions:delete')
    @ApiOperation({
        summary: 'Delete submission',
        description: 'Soft delete a submission (marks as deleted but preserves history)',
    })
    @ApiResponse({ status: 204, description: 'Submission deleted' })
    @ApiResponse({ status: 404, description: 'Submission not found' })
    async deleteSubmission(
        @Param('id') submissionId: string,
        @Req() req: any,
    ): Promise<void> {
        const { companyId, userId } = req.tenant;
        return this.submissionService.deleteSubmission(
            submissionId,
            String(companyId),
            Number(userId),
        );
    }
}
