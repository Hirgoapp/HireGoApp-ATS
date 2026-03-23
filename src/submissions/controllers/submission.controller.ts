import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    ParseIntPipe,
} from '@nestjs/common';
import { RequirementSubmissionService } from '../services/submission.service';
import { CreateRequirementSubmissionDto } from '../dtos/create-submission.dto';
import { UpdateRequirementSubmissionDto } from '../dtos/update-submission.dto';
import { GetRequirementSubmissionDto } from '../dtos/get-submission.dto';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';

/**
 * RequirementSubmissionController
 * Handles requirement submission CRUD operations
 * Uses INTEGER primary keys (not UUID)
 * Single-tenant ATS module
 */
@Controller('api/v1/submissions')
@UseGuards(RoleGuard)
export class RequirementSubmissionController {
    constructor(private readonly submissionService: RequirementSubmissionService) { }

    /**
     * Create a new requirement submission
     * POST /api/v1/submissions
     */
    @Post()
    @Require('submissions:create')
    async create(
        @UserId() userId: number,
        @Body() createSubmissionDto: CreateRequirementSubmissionDto,
    ): Promise<{ success: boolean; data: GetRequirementSubmissionDto }> {
        const submission = await this.submissionService.create(userId, createSubmissionDto);
        return {
            success: true,
            data: submission,
        };
    }

    /**
     * Get all requirement submissions
     * GET /api/v1/submissions?skip=0&take=20&job_requirement_id=1&submission_status=Approved&search=candidate_name
     */
    @Get()
    @Require('submissions:read')
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('job_requirement_id') jobRequirementId?: string,
        @Query('submission_status') submissionStatus?: string,
        @Query('search') search?: string,
        @Query('orderBy') orderBy?: 'created_at' | 'updated_at' | 'submitted_at' | 'profile_submission_date',
        @Query('orderDirection') orderDirection?: 'ASC' | 'DESC',
    ): Promise<{ success: boolean; data: GetRequirementSubmissionDto[]; total: number }> {
        const { data, total } = await this.submissionService.getAll({
            skip: skip ? parseInt(skip) : 0,
            take: take ? parseInt(take) : 20,
            job_requirement_id: jobRequirementId ? parseInt(jobRequirementId) : undefined,
            submission_status: submissionStatus,
            search,
            orderBy,
            orderDirection,
        });

        return {
            success: true,
            data,
            total,
        };
    }

    /**
     * Get a single requirement submission by ID (INTEGER)
     * GET /api/v1/submissions/:id
     */
    @Get(':id')
    @Require('submissions:read')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ success: boolean; data: GetRequirementSubmissionDto }> {
        const submission = await this.submissionService.getById(id);
        return {
            success: true,
            data: submission,
        };
    }

    /**
     * Update requirement submission
     * PUT /api/v1/submissions/:id
     */
    @Put(':id')
    @Require('submissions:update')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @UserId() userId: number,
        @Body() updateSubmissionDto: UpdateRequirementSubmissionDto,
    ): Promise<{ success: boolean; data: GetRequirementSubmissionDto }> {
        const submission = await this.submissionService.update(id, userId, updateSubmissionDto);
        return {
            success: true,
            data: submission,
        };
    }

    /**
     * Delete requirement submission
     * DELETE /api/v1/submissions/:id
     */
    @Delete(':id')
    @Require('submissions:delete')
    @HttpCode(204)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.submissionService.delete(id);
    }

    /**
     * Get submission count
     * GET /api/v1/submissions/stats/count
     */
    @Get('stats/count')
    @Require('submissions:read')
    async getCount(): Promise<{ success: boolean; count: number }> {
        const count = await this.submissionService.count();
        return {
            success: true,
            count,
        };
    }

    /**
     * Find submissions by job requirement
     * GET /api/v1/submissions/by-job-requirement/:jobRequirementId
     */
    @Get('by-job-requirement/:jobRequirementId')
    @Require('submissions:read')
    async findByJobRequirement(
        @Param('jobRequirementId', ParseIntPipe) jobRequirementId: number,
    ): Promise<{ success: boolean; data: GetRequirementSubmissionDto[] }> {
        const submissions = await this.submissionService.findByJobRequirement(jobRequirementId);
        return {
            success: true,
            data: submissions,
        };
    }

    /**
     * Find submissions by status
     * GET /api/v1/submissions/by-status/:status
     */
    @Get('by-status/:status')
    @Require('submissions:read')
    async findByStatus(
        @Param('status') status: string,
    ): Promise<{ success: boolean; data: GetRequirementSubmissionDto[] }> {
        const submissions = await this.submissionService.findByStatus(status);
        return {
            success: true,
            data: submissions,
        };
    }

    /**
     * Find submissions by vendor email
     * GET /api/v1/submissions/by-vendor/:vendorEmail
     */
    @Get('by-vendor/:vendorEmail')
    @Require('submissions:read')
    async findByVendorEmail(
        @Param('vendorEmail') vendorEmail: string,
    ): Promise<{ success: boolean; data: GetRequirementSubmissionDto[] }> {
        const submissions = await this.submissionService.findByVendorEmail(vendorEmail);
        return {
            success: true,
            data: submissions,
        };
    }

    /**
     * Count submissions by status
     * GET /api/v1/submissions/count-by-status/:status
     */
    @Get('count-by-status/:status')
    @Require('submissions:read')
    async countByStatus(
        @Param('status') status: string,
    ): Promise<{ success: boolean; count: number }> {
        const count = await this.submissionService.countByStatus(status);
        return {
            success: true,
            count,
        };
    }

    /**
     * Count submissions by job requirement
     * GET /api/v1/submissions/count-by-requirement/:jobRequirementId
     */
    @Get('count-by-requirement/:jobRequirementId')
    @Require('submissions:read')
    async countByJobRequirement(
        @Param('jobRequirementId', ParseIntPipe) jobRequirementId: number,
    ): Promise<{ success: boolean; count: number }> {
        const count = await this.submissionService.countByJobRequirement(jobRequirementId);
        return {
            success: true,
            count,
        };
    }
}
