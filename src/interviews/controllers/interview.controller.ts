import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InterviewService } from '../services/interview.service';
import { CreateInterviewDto } from '../dtos/create-interview.dto';
import { UpdateInterviewDto } from '../dtos/update-interview.dto';
import { GetInterviewDto } from '../dtos/get-interview.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { InterviewRound, InterviewStatus } from '../entities/interview.entity';

@ApiTags('Interviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('interviews')
export class InterviewController {
    constructor(private readonly interviewService: InterviewService) { }

    @Post()
    @RequirePermissions('interviews:create')
    @ApiOperation({ summary: 'Schedule a new interview' })
    @ApiResponse({ status: 201, description: 'Interview scheduled successfully' })
    async schedule(
        @Request() req,
        @Body() createInterviewDto: CreateInterviewDto,
    ): Promise<GetInterviewDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return this.interviewService.schedule(companyId, userId, createInterviewDto);
    }

    @Get('stats/count')
    @RequirePermissions('interviews:read')
    @ApiOperation({ summary: 'Get interview count by status' })
    async getCount(@Request() req): Promise<{ count: number }> {
        const companyId = req.user.company_id;
        const count = await this.interviewService.getCount(companyId);
        return { count };
    }

    @Get('submission/:submission_id')
    @RequirePermissions('interviews:read')
    @ApiOperation({ summary: 'Get interviews for a submission' })
    async getBySubmission(
        @Param('submission_id') submissionId: string,
        @Request() req,
    ): Promise<GetInterviewDto[]> {
        const companyId = req.user.company_id;
        return this.interviewService.getInterviewsBySubmission(submissionId, companyId);
    }

    @Get()
    @RequirePermissions('interviews:read')
    @ApiOperation({ summary: 'List all interviews with filters' })
    async findAll(
        @Request() req,
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('submission_id') submissionId?: string,
        @Query('interviewer_id') interviewerId?: string,
        @Query('round') round?: InterviewRound,
        @Query('status') status?: InterviewStatus,
        @Query('from_date') fromDate?: string,
        @Query('to_date') toDate?: string,
        @Query('orderBy') orderBy?: 'created_at' | 'updated_at' | 'scheduled_date',
        @Query('orderDirection') orderDirection?: 'ASC' | 'DESC',
    ): Promise<{ data: GetInterviewDto[]; total: number }> {
        const companyId = req.user.company_id;
        const { data, total } = await this.interviewService.getInterviews(companyId, {
            skip: skip ? parseInt(skip, 10) : undefined,
            take: take ? parseInt(take, 10) : undefined,
            submission_id: submissionId,
            interviewer_id: interviewerId,
            round,
            status,
            from_date: fromDate,
            to_date: toDate,
            orderBy,
            orderDirection,
        });
        return { data, total };
    }

    @Get(':id')
    @RequirePermissions('interviews:read')
    @ApiOperation({ summary: 'Get a single interview' })
    async findOne(
        @Param('id') interviewId: string,
        @Request() req,
    ): Promise<GetInterviewDto> {
        const companyId = req.user.company_id;
        return this.interviewService.getInterview(interviewId, companyId);
    }

    @Put(':id/feedback')
    @RequirePermissions('interviews:update')
    @ApiOperation({ summary: 'Record interview feedback' })
    async recordFeedback(
        @Param('id') interviewId: string,
        @Request() req,
        @Body() dto: { feedback: string; rating: number; remarks?: string },
    ): Promise<GetInterviewDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return this.interviewService.recordFeedback(
            interviewId,
            companyId,
            userId,
            dto.feedback,
            dto.rating,
            dto.remarks,
        );
    }

    @Put(':id/complete')
    @RequirePermissions('interviews:update')
    @ApiOperation({ summary: 'Mark interview as completed' })
    async markCompleted(
        @Param('id') interviewId: string,
        @Request() req,
    ): Promise<GetInterviewDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return this.interviewService.markCompleted(interviewId, companyId, userId);
    }

    @Put(':id/reschedule')
    @RequirePermissions('interviews:update')
    @ApiOperation({ summary: 'Reschedule an interview' })
    async reschedule(
        @Param('id') interviewId: string,
        @Request() req,
        @Body() dto: { scheduled_date: string; scheduled_time: string; reason?: string },
    ): Promise<GetInterviewDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return this.interviewService.reschedule(
            interviewId,
            companyId,
            userId,
            dto.scheduled_date,
            dto.scheduled_time,
            dto.reason,
        );
    }

    @Put(':id/cancel')
    @RequirePermissions('interviews:update')
    @ApiOperation({ summary: 'Cancel an interview' })
    async cancel(
        @Param('id') interviewId: string,
        @Request() req,
        @Body() dto: { reason?: string },
    ): Promise<GetInterviewDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return this.interviewService.cancel(interviewId, companyId, userId, dto.reason);
    }

    @Put(':id')
    @RequirePermissions('interviews:update')
    @ApiOperation({ summary: 'Update an interview' })
    async update(
        @Param('id') interviewId: string,
        @Request() req,
        @Body() updateInterviewDto: UpdateInterviewDto,
    ): Promise<GetInterviewDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return this.interviewService.update(interviewId, companyId, userId, updateInterviewDto);
    }

    @Delete(':id')
    @RequirePermissions('interviews:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an interview' })
    async remove(
        @Param('id') interviewId: string,
        @Request() req,
    ): Promise<void> {
        const companyId = req.user.company_id;
        await this.interviewService.delete(interviewId, companyId);
    }
}
