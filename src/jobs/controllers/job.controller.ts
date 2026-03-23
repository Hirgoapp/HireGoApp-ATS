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
import { JobRequirementService } from '../services/job.service';
import { CreateJobRequirementDto } from '../dtos/create-job.dto';
import { UpdateJobRequirementDto } from '../dtos/update-job.dto';
import { GetJobRequirementDto } from '../dtos/get-job.dto';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';

/**
 * JobRequirementController
 * Handles job requirement CRUD operations
 * Uses INTEGER primary keys (not UUID)
 * Single-tenant ATS module
 */
@Controller('api/v1/jobs')
@UseGuards(RoleGuard)
export class JobRequirementController {
    constructor(private readonly jobRequirementService: JobRequirementService) { }

    /**
     * Create a new job requirement
     * POST /api/v1/jobs
     */
    @Post()
    @Require('jobs:create')
    async create(
        @UserId() userId: number,
        @Body() createJobRequirementDto: CreateJobRequirementDto,
    ): Promise<{ success: boolean; data: GetJobRequirementDto }> {
        const job = await this.jobRequirementService.create(userId, createJobRequirementDto);
        return {
            success: true,
            data: job,
        };
    }

    /**
     * Get all job requirements
     * GET /api/v1/jobs?skip=0&take=20&client_id=1&active_flag=true&priority=High&search=engineer
     */
    @Get()
    @Require('jobs:read')
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('client_id') clientId?: string,
        @Query('active_flag') activeFlag?: string,
        @Query('priority') priority?: string,
        @Query('search') search?: string,
        @Query('orderBy') orderBy?: 'created_at' | 'updated_at' | 'job_title' | 'priority',
        @Query('orderDirection') orderDirection?: 'ASC' | 'DESC',
    ): Promise<{ success: boolean; data: GetJobRequirementDto[]; total: number }> {
        const { data, total } = await this.jobRequirementService.getAll({
            skip: skip ? parseInt(skip) : 0,
            take: take ? parseInt(take) : 20,
            client_id: clientId ? parseInt(clientId) : undefined,
            active_flag: activeFlag ? activeFlag === 'true' : undefined,
            priority,
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
     * Get a single job requirement by ID (INTEGER)
     * GET /api/v1/jobs/:id
     */
    @Get(':id')
    @Require('jobs:read')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ success: boolean; data: GetJobRequirementDto }> {
        const job = await this.jobRequirementService.getById(id);
        return {
            success: true,
            data: job,
        };
    }

    /**
     * Get job requirement by ecms_req_id
     * GET /api/v1/jobs/ecms/:ecmsReqId
     */
    @Get('ecms/:ecmsReqId')
    @Require('jobs:read')
    async findByEcmsReqId(
        @Param('ecmsReqId') ecmsReqId: string,
    ): Promise<{ success: boolean; data: GetJobRequirementDto }> {
        const job = await this.jobRequirementService.getByEcmsReqId(ecmsReqId);
        return {
            success: true,
            data: job,
        };
    }

    /**
     * Update job requirement
     * PUT /api/v1/jobs/:id
     */
    @Put(':id')
    @Require('jobs:update')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @UserId() userId: number,
        @Body() updateJobRequirementDto: UpdateJobRequirementDto,
    ): Promise<{ success: boolean; data: GetJobRequirementDto }> {
        const job = await this.jobRequirementService.update(id, userId, updateJobRequirementDto);
        return {
            success: true,
            data: job,
        };
    }

    /**
     * Delete job requirement
     * DELETE /api/v1/jobs/:id
     */
    @Delete(':id')
    @Require('jobs:delete')
    @HttpCode(204)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.jobRequirementService.delete(id);
    }

    /**
     * Get job requirement count
     * GET /api/v1/jobs/stats/count
     */
    @Get('stats/count')
    @Require('jobs:read')
    async getCount(): Promise<{ success: boolean; count: number }> {
        const count = await this.jobRequirementService.count();
        return {
            success: true,
            count,
        };
    }

    /**
     * Get active job requirement count
     * GET /api/v1/jobs/stats/active
     */
    @Get('stats/active')
    @Require('jobs:read')
    async getCountActive(): Promise<{ success: boolean; count: number }> {
        const count = await this.jobRequirementService.countActive();
        return {
            success: true,
            count,
        };
    }

    /**
     * Find job requirements by client
     * GET /api/v1/jobs/by-client/:clientId
     */
    @Get('by-client/:clientId')
    @Require('jobs:read')
    async findByClient(
        @Param('clientId', ParseIntPipe) clientId: number,
    ): Promise<{ success: boolean; data: GetJobRequirementDto[] }> {
        const jobs = await this.jobRequirementService.findByClient(clientId);
        return {
            success: true,
            data: jobs,
        };
    }

    /**
     * Find active job requirements
     * GET /api/v1/jobs/find/active
     */
    @Get('find/active')
    @Require('jobs:read')
    async findActive(): Promise<{ success: boolean; data: GetJobRequirementDto[] }> {
        const jobs = await this.jobRequirementService.findActive();
        return {
            success: true,
            data: jobs,
        };
    }

    /**
     * Find job requirements by priority
     * GET /api/v1/jobs/by-priority/:priority
     */
    @Get('by-priority/:priority')
    @Require('jobs:read')
    async findByPriority(
        @Param('priority') priority: string,
    ): Promise<{ success: boolean; data: GetJobRequirementDto[] }> {
        const jobs = await this.jobRequirementService.findByPriority(priority);
        return {
            success: true,
            data: jobs,
        };
    }
}
