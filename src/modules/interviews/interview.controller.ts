import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    ParseUUIDPipe,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { InterviewService } from './services/interview.service';
import { InterviewAssignmentService } from './services/interview-assignment.service';
import { InterviewStatusService } from './services/interview-status.service';
import { CreateInterviewDto, UpdateInterviewDto, CompleteInterviewDto } from './dto/interview.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { InterviewStatus } from './entities/interview.entity';
import { InterviewerRole } from './entities/interview-interviewer.entity';
import { Recommendation } from './entities/interview-feedback.entity';

@ApiTags('Interviews')
@ApiBearerAuth()
@Controller('api/v1/interviews')
@UseGuards(PermissionGuard, TenantGuard)
export class InterviewController {
    constructor(
        private readonly interviewService: InterviewService,
        private readonly assignmentService: InterviewAssignmentService,
        private readonly statusService: InterviewStatusService,
    ) { }

    /**
     * 1. Create and schedule interview for submission
     */
    @Post()
    @RequirePermissions('interviews:create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Schedule new interview for submission' })
    @ApiResponse({ status: 201, description: 'Interview scheduled successfully' })
    async create(@Body() createDto: CreateInterviewDto, @Req() req: Request) {
        const companyId = String((req as any).tenant.companyId);
        const userId = String((req as any).tenant.userId);
        return this.interviewService.create(createDto, companyId, userId);
    }

    /**
     * 2. Get all interviews (paginated, filterable)
     */
    @Get()
    @RequirePermissions('interviews:read')
    @ApiOperation({ summary: 'List all interviews' })
    @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
    @ApiQuery({ name: 'submissionId', required: false, type: 'string', description: 'Filter by submission' })
    @ApiQuery({ name: 'status', required: false, enum: InterviewStatus, description: 'Filter by status' })
    @ApiResponse({ status: 200, description: 'List of interviews' })
    async list(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('submissionId') submissionId?: string,
        @Query('status') status?: InterviewStatus,
        @Req() req?: Request,
    ) {
        const companyId = String((req as any).tenant.companyId);
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.interviewService.getPaginated(companyId, pageNum, limitNum, { submissionId, status });
    }

    /**
     * 3. Get upcoming interviews
     */
    @Get('upcoming')
    @RequirePermissions('interviews:read')
    @ApiOperation({ summary: 'Get upcoming scheduled interviews' })
    @ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
    @ApiResponse({ status: 200, description: 'List of upcoming interviews' })
    async getUpcoming(@Query('limit') limit?: string, @Req() req?: Request) {
        const companyId = String((req as any).tenant.companyId);
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.interviewService.getUpcoming(companyId, limitNum);
    }

    /**
     * 4. Get interview by ID
     */
    @Get(':id')
    @RequirePermissions('interviews:read')
    @ApiOperation({ summary: 'Get interview details' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 200, description: 'Interview details' })
    async getOne(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request) {
        const companyId = String((req as any).tenant.companyId);
        return this.interviewService.findOne(id, companyId);
    }

    /**
     * 5. Update interview (only when scheduled)
     */
    @Patch(':id')
    @RequirePermissions('interviews:update')
    @ApiOperation({ summary: 'Update interview (reschedule, update details)' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 200, description: 'Interview updated' })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateDto: UpdateInterviewDto,
        @Req() req: Request,
    ) {
        const companyId = String((req as any).tenant.companyId);
        const userId = String((req as any).tenant.userId);
        return this.interviewService.update(id, updateDto, companyId, userId);
    }

    /**
     * 6. Mark interview as completed
     */
    @Post(':id/complete')
    @RequirePermissions('interviews:update')
    @ApiOperation({ summary: 'Mark interview as completed' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 200, description: 'Interview marked as completed' })
    async complete(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() completeDto: CompleteInterviewDto,
        @Req() req: Request,
    ) {
        const companyId = String((req as any).tenant.companyId);
        const userId = String((req as any).tenant.userId);
        return this.interviewService.complete(id, completeDto, companyId, userId);
    }

    /**
     * 7. Cancel interview
     */
    @Post(':id/cancel')
    @RequirePermissions('interviews:cancel')
    @ApiOperation({ summary: 'Cancel interview' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 200, description: 'Interview cancelled' })
    async cancel(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { reason?: string },
        @Req() req: Request,
    ) {
        const companyId = String((req as any).tenant.companyId);
        const userId = String((req as any).tenant.userId);
        return this.interviewService.cancel(id, companyId, userId, body.reason);
    }

    /**
     * 8. Evaluate interview (completed → evaluated, terminal)
     */
    @Post(':id/evaluate')
    @RequirePermissions('interviews:update')
    @ApiOperation({ summary: 'Evaluate interview (moves to terminal evaluated state)' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 200, description: 'Interview evaluated' })
    async evaluate(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request) {
        const companyId = String((req as any).tenant.companyId);
        const userId = String((req as any).tenant.userId);
        return this.interviewService.evaluate(id, companyId, userId);
    }

    /**
     * 9. Delete (soft) interview
     */
    @Delete(':id')
    @RequirePermissions('interviews:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete interview (soft delete)' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 204, description: 'Interview deleted' })
    async delete(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request) {
        const companyId = String((req as any).tenant.companyId);
        return this.interviewService.delete(id, companyId);
    }

    /**
     * 10. Assign interviewer to interview
     */
    @Post(':id/interviewers')
    @RequirePermissions('interviews:update')
    @ApiOperation({ summary: 'Assign interviewer to interview' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 201, description: 'Interviewer assigned' })
    async assignInterviewer(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { interviewer_id: string; role?: InterviewerRole },
        @Req() req: Request,
    ) {
        const companyId = String((req as any).tenant.companyId);
        const role = body.role ?? InterviewerRole.INTERVIEWER;
        return this.assignmentService.assignInterviewer(id, body.interviewer_id, role, companyId);
    }

    /**
     * 11. Get interviewers for interview
     */
    @Get(':id/interviewers')
    @RequirePermissions('interviews:read')
    @ApiOperation({ summary: 'Get interviewers assigned to interview' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 200, description: 'List of assigned interviewers' })
    async getInterviewers(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request) {
        const companyId = String((req as any).tenant.companyId);
        return this.assignmentService.getInterviewers(id, companyId);
    }

    /**
     * 12. Remove interviewer from interview
     */
    @Delete(':id/interviewers/:interviewerId')
    @RequirePermissions('interviews:update')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove interviewer from interview' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiParam({ name: 'interviewerId', type: 'number', description: 'User ID' })
    @ApiResponse({ status: 204, description: 'Interviewer removed' })
    async removeInterviewer(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Param('interviewerId', new ParseUUIDPipe()) interviewerId: string,
        @Req() req: Request,
    ) {
        const companyId = String((req as any).tenant.companyId);
        return this.assignmentService.removeInterviewer(id, interviewerId, companyId);
    }

    /**
     * 13. Submit feedback on interview
     */
    @Post(':id/feedback')
    @RequirePermissions('interviews:submit_feedback')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Submit feedback on interview (assigned-only, after completion)' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 201, description: 'Feedback submitted' })
    async submitFeedback(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body()
        body: {
            rating: number;
            recommendation: Recommendation;
            comments?: string;
        },
        @Req() req: Request,
    ) {
        const companyId = String((req as any).tenant.companyId);
        const reviewerId = String((req as any).tenant.userId);
        return this.assignmentService.submitFeedback(
            id,
            reviewerId,
            body.rating,
            body.recommendation,
            body.comments ?? null,
            companyId,
        );
    }

    /**
     * 14. Get feedback for interview
     */
    @Get(':id/feedback')
    @RequirePermissions('interviews:view_feedback')
    @ApiOperation({ summary: 'View feedback for interview (assigned-only)' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 200, description: 'List of feedback' })
    async getFeedback(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request) {
        const companyId = String((req as any).tenant.companyId);
        const requesterId = String((req as any).tenant.userId);
        return this.assignmentService.viewFeedback(id, requesterId, companyId);
    }

    /**
     * 15. Get feedback summary for interview
     */
    @Get(':id/feedback/summary')
    @RequirePermissions('interviews:view_feedback')
    @ApiOperation({ summary: 'Get feedback summary (rating average, recommendation counts)' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 200, description: 'Feedback summary' })
    async getFeedbackSummary(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request) {
        const companyId = String((req as any).tenant.companyId);
        return this.assignmentService.getFeedbackSummary(id, companyId);
    }

    /**
     * 16. Get status history for interview
     */
    @Get(':id/status-history')
    @RequirePermissions('interviews:read')
    @ApiOperation({ summary: 'Get status change history for interview' })
    @ApiParam({ name: 'id', type: 'string', description: 'Interview UUID' })
    @ApiResponse({ status: 200, description: 'Status history' })
    async getStatusHistory(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request) {
        const companyId = String((req as any).tenant.companyId);
        return this.interviewService.getStatusHistory(id, companyId);
    }

    /**
     * 17. Get status counts for tenant
     */
    @Get('stats/by-status')
    @RequirePermissions('interviews:read')
    @ApiOperation({ summary: 'Get interview counts by status' })
    @ApiResponse({ status: 200, description: 'Status counts' })
    async getStatusCounts(@Req() req: Request) {
        const companyId = String((req as any).tenant.companyId);
        return this.interviewService.getStatusCounts(companyId);
    }
}
