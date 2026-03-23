import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import {
    CreateBetaUserDto,
    UpdateBetaUserDto,
    BetaUserResponseDto,
    CreateFeedbackDto,
    UpdateFeedbackDto,
    FeedbackResponseDto,
    FeedbackStatsDto,
} from './dto/feedback.dto';
import { Require } from '../../rbac/decorators/require.decorator';
import { BetaStatus, BetaTier } from './entities/beta-user.entity';
import { FeedbackType, FeedbackStatus, FeedbackPriority } from './entities/feedback.entity';

@ApiTags('beta-feedback')
@ApiBearerAuth()
@Controller()
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) { }

    // ===== Beta User Endpoints =====

    @Post('beta-users')
    @Require('beta:manage')
    @ApiOperation({ summary: 'Invite a user to beta program' })
    @ApiResponse({ status: 201, description: 'Beta user invitation created', type: BetaUserResponseDto })
    async createBetaUser(@Body() createDto: CreateBetaUserDto, @Request() req: any) {
        return this.feedbackService.createBetaUser(createDto, req.user.id);
    }

    @Get('beta-users')
    @Require('beta:read')
    @ApiOperation({ summary: 'Get all beta users' })
    @ApiQuery({ name: 'status', enum: BetaStatus, required: false })
    @ApiQuery({ name: 'tier', enum: BetaTier, required: false })
    @ApiQuery({ name: 'company_id', required: false })
    @ApiResponse({ status: 200, description: 'List of beta users', type: [BetaUserResponseDto] })
    async findAllBetaUsers(
        @Query('status') status?: BetaStatus,
        @Query('tier') tier?: BetaTier,
        @Query('company_id') companyId?: string,
    ) {
        const filters: any = {};
        if (status) filters.status = status;
        if (tier) filters.tier = tier;
        if (companyId) filters.company_id = companyId;

        return this.feedbackService.findAllBetaUsers(filters);
    }

    @Get('beta-users/stats')
    @Require('beta:read')
    @ApiOperation({ summary: 'Get beta program statistics' })
    @ApiResponse({ status: 200, description: 'Beta program stats' })
    async getBetaStats() {
        return this.feedbackService.getBetaStats();
    }

    @Get('beta-users/:id')
    @Require('beta:read')
    @ApiOperation({ summary: 'Get a beta user by ID' })
    @ApiResponse({ status: 200, description: 'Beta user details', type: BetaUserResponseDto })
    async findOneBetaUser(@Param('id') id: string) {
        return this.feedbackService.findOneBetaUser(id);
    }

    @Patch('beta-users/:id')
    @Require('beta:manage')
    @ApiOperation({ summary: 'Update a beta user' })
    @ApiResponse({ status: 200, description: 'Beta user updated', type: BetaUserResponseDto })
    async updateBetaUser(@Param('id') id: string, @Body() updateDto: UpdateBetaUserDto) {
        return this.feedbackService.updateBetaUser(id, updateDto);
    }

    @Delete('beta-users/:id')
    @Require('beta:manage')
    @ApiOperation({ summary: 'Remove a beta user' })
    @ApiResponse({ status: 200, description: 'Beta user removed' })
    async removeBetaUser(@Param('id') id: string) {
        await this.feedbackService.removeBetaUser(id);
        return { message: 'Beta user removed successfully' };
    }

    @Post('beta-users/accept')
    @ApiOperation({ summary: 'Accept beta invitation (user action)' })
    @ApiResponse({ status: 200, description: 'Beta invitation accepted' })
    async acceptBetaInvitation(@Request() req: any) {
        return this.feedbackService.acceptBetaInvitation(req.user.id, req.user.company_id);
    }

    // ===== Feedback Endpoints =====

    @Post('feedback')
    @ApiOperation({ summary: 'Submit new feedback' })
    @ApiResponse({ status: 201, description: 'Feedback submitted', type: FeedbackResponseDto })
    async createFeedback(@Body() createDto: CreateFeedbackDto, @Request() req: any) {
        return this.feedbackService.createFeedback(req.user.id, req.user.company_id, createDto);
    }

    @Get('feedback')
    @Require('feedback:read')
    @ApiOperation({ summary: 'Get all feedback (admin)' })
    @ApiQuery({ name: 'type', enum: FeedbackType, required: false })
    @ApiQuery({ name: 'status', enum: FeedbackStatus, required: false })
    @ApiQuery({ name: 'priority', enum: FeedbackPriority, required: false })
    @ApiQuery({ name: 'company_id', required: false })
    @ApiQuery({ name: 'user_id', required: false })
    @ApiQuery({ name: 'is_beta', type: Boolean, required: false })
    @ApiResponse({ status: 200, description: 'List of feedback', type: [FeedbackResponseDto] })
    async findAllFeedback(
        @Query('type') type?: FeedbackType,
        @Query('status') status?: FeedbackStatus,
        @Query('priority') priority?: FeedbackPriority,
        @Query('company_id') companyId?: string,
        @Query('user_id') userId?: string,
        @Query('is_beta') isBeta?: string,
    ) {
        const filters: any = {};
        if (type) filters.type = type;
        if (status) filters.status = status;
        if (priority) filters.priority = priority;
        if (companyId) filters.company_id = companyId;
        if (userId) filters.user_id = userId;
        if (isBeta !== undefined) filters.is_beta = isBeta === 'true';

        return this.feedbackService.findAllFeedback(filters);
    }

    @Get('feedback/my-feedback')
    @ApiOperation({ summary: 'Get my submitted feedback' })
    @ApiResponse({ status: 200, description: 'User feedback list', type: [FeedbackResponseDto] })
    async getMyFeedback(@Request() req: any) {
        return this.feedbackService.findAllFeedback({ user_id: req.user.id });
    }

    @Get('feedback/stats')
    @Require('feedback:read')
    @ApiOperation({ summary: 'Get feedback statistics' })
    @ApiQuery({ name: 'company_id', required: false })
    @ApiResponse({ status: 200, description: 'Feedback statistics', type: FeedbackStatsDto })
    async getFeedbackStats(@Query('company_id') companyId?: string) {
        return this.feedbackService.getFeedbackStats(companyId);
    }

    @Get('feedback/:id')
    @Require('feedback:read')
    @ApiOperation({ summary: 'Get a feedback item by ID' })
    @ApiResponse({ status: 200, description: 'Feedback details', type: FeedbackResponseDto })
    async findOneFeedback(@Param('id') id: string) {
        return this.feedbackService.findOneFeedback(id);
    }

    @Patch('feedback/:id')
    @Require('feedback:write')
    @ApiOperation({ summary: 'Update feedback (admin only)' })
    @ApiResponse({ status: 200, description: 'Feedback updated', type: FeedbackResponseDto })
    async updateFeedback(@Param('id') id: string, @Body() updateDto: UpdateFeedbackDto, @Request() req: any) {
        return this.feedbackService.updateFeedback(id, updateDto, req.user.id);
    }

    @Delete('feedback/:id')
    @Require('feedback:write')
    @ApiOperation({ summary: 'Delete feedback' })
    @ApiResponse({ status: 200, description: 'Feedback deleted' })
    async removeFeedback(@Param('id') id: string) {
        await this.feedbackService.removeFeedback(id);
        return { message: 'Feedback deleted successfully' };
    }

    @Post('feedback/:id/upvote')
    @ApiOperation({ summary: 'Upvote feedback' })
    @ApiResponse({ status: 200, description: 'Feedback upvoted' })
    async upvoteFeedback(@Param('id') id: string) {
        return this.feedbackService.upvoteFeedback(id);
    }
}
