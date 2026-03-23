import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { FeatureGuard } from '../../features/guards/feature.guard';
import { RequireFeature } from '../../features/decorators/require-feature.decorator';
import { MatchingService } from './matching.service';

@ApiTags('Matching')
@ApiBearerAuth()
@UseGuards(PermissionGuard, TenantGuard, FeatureGuard)
@RequireFeature('jobs_module')
@Controller('api/v1/matching')
export class MatchingController {
    constructor(private readonly matchingService: MatchingService) {}

    @Get('jobs/:jobId/suggestions')
    @RequirePermissions('jobs:view')
    @ApiOperation({
        summary: 'Ranked candidate suggestions for a job',
        description:
            'Rule-based match (skills 50%, experience 20%, location 10%, keywords 20%). Excludes heavy ML; uses tenant candidate pool.',
    })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'minScore', required: false, type: Number })
    @ApiQuery({ name: 'poolSize', required: false, type: Number })
    @ApiQuery({ name: 'includeSubmitted', required: false, type: Boolean, description: 'If true, keep candidates already submitted' })
    async suggestions(
        @Param('jobId') jobId: string,
        @Query('limit') limit?: string,
        @Query('minScore') minScore?: string,
        @Query('poolSize') poolSize?: string,
        @Query('includeSubmitted') includeSubmitted?: string,
        @Req() req?: any,
    ) {
        const { companyId } = req.tenant;
        return this.matchingService.suggestCandidatesForJob(String(companyId), jobId, {
            limit: limit ? parseInt(limit, 10) : undefined,
            minScore: minScore ? parseInt(minScore, 10) : undefined,
            poolSize: poolSize ? parseInt(poolSize, 10) : undefined,
            excludeSubmitted: includeSubmitted === 'true' ? false : true,
        });
    }
}
