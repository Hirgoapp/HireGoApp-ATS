import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Req,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequirementService } from '../services/requirement.service';
import { PermissionGuard } from '../../../auth/guards/permission.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { FeatureGuard } from '../../../features/guards/feature.guard';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator';
import { RequireFeature } from '../../../features/decorators/require-feature.decorator';

@ApiTags('Job Requirements')
@ApiBearerAuth()
@Controller('api/v1/jobs')
@UseGuards(PermissionGuard, TenantGuard, FeatureGuard)
@RequireFeature('jobs_module')
export class RequirementController {
    constructor(private readonly requirementService: RequirementService) {}

    // Requirements CRUD

    @Post()
    @RequirePermissions('jobs:create')
    @ApiOperation({ summary: 'Create job requirement' })
    async create(@Body() dto: any, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        return this.requirementService.createRequirement(companyId, userId, dto);
    }

    @Get()
    @RequirePermissions('jobs:view')
    @ApiOperation({ summary: 'List job requirements' })
    async list(@Query() query: { status?: string }, @Req() req: any) {
        const { companyId } = req.tenant;
        return this.requirementService.getRequirements(companyId, { status: query.status });
    }

    @Get(':id')
    @RequirePermissions('jobs:view')
    @ApiOperation({ summary: 'Get requirement by ID' })
    async getOne(@Param('id') id: string, @Req() req: any) {
        const { companyId } = req.tenant;
        return this.requirementService.getRequirementById(companyId, id);
    }

    @Put(':id')
    @RequirePermissions('jobs:update')
    @ApiOperation({ summary: 'Update requirement' })
    async update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        return this.requirementService.updateRequirement(companyId, userId, id, dto);
    }

    @Delete(':id')
    @RequirePermissions('jobs:delete')
    @ApiOperation({ summary: 'Delete requirement (soft)' })
    async remove(@Param('id') id: string, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        return this.requirementService.deleteRequirement(companyId, userId, id);
    }

    // Assignments

    @Post(':id/assign')
    @RequirePermissions('jobs:update')
    @ApiOperation({ summary: 'Assign recruiter to requirement' })
    async assign(
        @Param('id') id: string,
        @Body()
        body: {
            assigned_to_user_id: string;
            target_count?: number;
            target_submission_date?: string;
            assignment_notes?: string;
        },
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        return this.requirementService.assignRecruiter(companyId, userId, id, body);
    }

    @Post(':id/cancel-assignment')
    @RequirePermissions('jobs:update')
    @ApiOperation({ summary: 'Cancel recruiter assignment' })
    async cancelAssignment(
        @Param('id') assignmentId: string,
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        return this.requirementService.cancelAssignment(companyId, userId, assignmentId);
    }

    // Submissions

    @Post(':id/submit-candidate')
    @RequirePermissions('jobs:update')
    @ApiOperation({ summary: 'Submit candidate for requirement' })
    async submitCandidate(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        return this.requirementService.submitCandidate(companyId, userId, id, dto);
    }

    @Put('submissions/:id/status')
    @RequirePermissions('jobs:update')
    @ApiOperation({ summary: 'Update submission status' })
    async updateSubmissionStatus(
        @Param('id') id: string,
        @Body() dto: { submission_status: string },
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        return this.requirementService.updateSubmissionStatus(
            companyId,
            userId,
            Number(id),
            dto,
        );
    }

    // Export

    @Get(':id/export-submissions')
    @RequirePermissions('jobs:view')
    @ApiOperation({ summary: 'Export requirement submissions' })
    async exportSubmissions(@Param('id') id: string, @Req() req: any) {
        const { companyId } = req.tenant;
        return this.requirementService.exportSubmissions(companyId, id);
    }

    // Analytics

    @Get('analytics/summary')
    @RequirePermissions('jobs:view')
    @ApiOperation({ summary: 'Job requirements analytics summary' })
    async analytics(@Req() req: any) {
        const { companyId } = req.tenant;
        return this.requirementService.getAnalytics(companyId);
    }
}

