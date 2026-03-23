import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AsyncJobsService } from './async-jobs.service';
import { EnqueueBulkImportDto } from './dto/bulk-import.dto';
import { EnqueueReportDto } from './dto/report.dto';
import { EnqueueEmailCampaignDto } from './dto/email.dto';
import { Require } from '../../rbac/decorators/require.decorator';

@ApiTags('async-jobs')
@ApiBearerAuth()
@Controller('jobs')
export class AsyncJobsController {
    constructor(private readonly jobsService: AsyncJobsService) { }

    @Post('bulk-import')
    @Require('jobs:enqueue')
    @ApiOperation({ summary: 'Enqueue bulk candidate import job' })
    async enqueueBulkImport(@Body() dto: EnqueueBulkImportDto) {
        const job = await this.jobsService.enqueueBulkImport(dto);
        return { jobId: job.id, queue: 'bulk-import' };
    }

    @Post('report')
    @Require('jobs:enqueue')
    @ApiOperation({ summary: 'Enqueue report generation job' })
    async enqueueReport(@Body() dto: EnqueueReportDto) {
        const job = await this.jobsService.enqueueReport(dto);
        return { jobId: job.id, queue: 'reports' };
    }

    @Post('email-campaign')
    @Require('jobs:enqueue')
    @ApiOperation({ summary: 'Enqueue email campaign job' })
    async enqueueEmail(@Body() dto: EnqueueEmailCampaignDto) {
        const job = await this.jobsService.enqueueEmailCampaign(dto);
        return { jobId: job.id, queue: 'emails' };
    }

    @Get(':queue/:id')
    @Require('jobs:read')
    @ApiOperation({ summary: 'Get job details' })
    async getJob(@Param('queue') queue: string, @Param('id') id: string) {
        const job = await this.jobsService.getJob(queue, id);
        return job ? { id: job.id, name: job.name, state: await job.getState(), progress: job.progress } : null;
    }

    @Get(':queue')
    @Require('jobs:read')
    @ApiOperation({ summary: 'List jobs by state' })
    @ApiQuery({ name: 'state', required: false, enum: ['waiting', 'active', 'completed', 'failed', 'delayed'] })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    async listJobs(
        @Param('queue') queue: string,
        @Query('state') state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' = 'waiting',
        @Query('start') start = 0,
        @Query('end') end = 50,
    ) {
        return this.jobsService.listJobs(queue, state, start, end);
    }

    @Get(':queue/stats')
    @Require('jobs:read')
    @ApiOperation({ summary: 'Get queue statistics' })
    async stats(@Param('queue') queue: string) {
        return this.jobsService.getStats(queue);
    }
}
