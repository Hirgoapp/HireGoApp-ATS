import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';
import { ImportEmailDto, CreateJobFromEmailDto } from './dto/import-email.dto';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { EmailParserService } from './services/email-parser.service';
import { HybridAIParserService } from './services/hybrid-ai-parser.service';
import { FeatureGuard } from '../../features/guards/feature.guard';
import { RequireFeature } from '../../features/decorators/require-feature.decorator';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(PermissionGuard, TenantGuard, FeatureGuard)
@RequireFeature('jobs_module')
@Controller('api/v1/jobs')
export class JobController {
    constructor(
        private readonly jobService: JobService,
        private readonly emailParserService: EmailParserService,
        private readonly hybridAIParser: HybridAIParserService,
    ) { }

    @Post()
    @RequirePermissions('jobs:create')
    async create(@Body() createJobDto: CreateJobDto, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        return this.jobService.create(createJobDto, companyId, userId);
    }

    @Post('import-from-email')
    @RequirePermissions('jobs:create')
    @ApiOperation({ summary: 'Parse email content and extract job data' })
    async importFromEmail(@Body() importEmailDto: ImportEmailDto) {
        return this.emailParserService.parse(importEmailDto.emailContent);
    }

    @Post('create-from-email')
    @RequirePermissions('jobs:create')
    @ApiOperation({ summary: 'Create job from parsed email data' })
    async createFromEmail(@Body() createJobFromEmailDto: CreateJobFromEmailDto, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        return this.jobService.createFromEmail(createJobFromEmailDto, companyId, userId);
    }

    @Post('parse-content')
    @ApiOperation({ summary: 'Parse and extract job data from pasted content using AI' })
    async parseContent(@Body() body: { content: string }) {
        try {
            if (!body.content || body.content.trim().length === 0) {
                return { error: 'Content cannot be empty' };
            }

            // Extract using regex/parser first
            const parsed = this.emailParserService.parse(body.content);
            const regexFields: Record<string, any> = parsed?.extractedFields || {};
            const jdMetadata: Record<string, any> = parsed?.jdMetadata || {};

            // Then use hybrid AI for intelligent extraction
            const aiResult = await this.hybridAIParser.extractJobDetails(body.content);

            // Merge results: regex as base, AI fills in gaps
            const merged = {
                ...regexFields,
                ...jdMetadata,
                ...aiResult,
                parsed_content_raw: body.content,
                extraction_confidence: aiResult?.confidence ?? 0,
                extraction_provider: aiResult?.provider ?? 'unknown',
                extraction_timestamp: new Date(),
            } as Record<string, any>;

            return {
                success: true,
                data: merged,
                confidence: aiResult.confidence,
                provider: aiResult.provider,
                message: `Extracted with ${aiResult.provider} (confidence: ${(aiResult.confidence * 100).toFixed(1)}%)`,
            };
        } catch (error: any) {
            console.error('Parse content error:', error.message);
            return {
                success: false,
                error: error.message || 'Failed to parse content',
            };
        }
    }

    @Get()
    @RequirePermissions('jobs:view')
    async findAll(@Query() filters: FilterJobDto, @Req() req: any) {
        const { companyId } = req.tenant;
        return this.jobService.findAll(filters, companyId);
    }

    @Get('stats')
    @RequirePermissions('jobs:view')
    async getStats(@Req() req: any) {
        const { companyId } = req.tenant;
        return this.jobService.getStats(companyId);
    }

    @Get(':id')
    @RequirePermissions('jobs:view')
    async findOne(@Param('id') id: string, @Req() req: any) {
        const { companyId } = req.tenant;
        return this.jobService.findOne(id, companyId);
    }

    @Put(':id')
    @RequirePermissions('jobs:update')
    async update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        return this.jobService.update(id, updateJobDto, companyId, userId);
    }

    @Put(':id/close')
    @RequirePermissions('jobs:update')
    @ApiOperation({ summary: 'Close a job' })
    async close(@Param('id') id: string, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        return this.jobService.closeJob(id, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('jobs:delete')
    async remove(@Param('id') id: string, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        return this.jobService.remove(id, companyId, userId);
    }
}

