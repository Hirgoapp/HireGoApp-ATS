import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ActivityService } from '../services/activity.service';
import { ActivityRepository } from '../repositories/activity.repository';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('api/v1/activity')
@UseGuards(PermissionGuard, TenantGuard)
export class ActivityController {
    constructor(
        private readonly activityService: ActivityService,
        private readonly activityRepository: ActivityRepository,
    ) { }

    /**
     * GET /api/v1/activity
     * List all activities for the company with pagination.
     */
    @Get()
    @RequirePermissions('activity:view')
    async listActivities(
        @Req() req: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50',
        @Query('entityType') entityType?: string,
    ) {
        const { companyId } = req.tenant;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));

        const result = await this.activityRepository.findWithPagination(
            companyId,
            pageNum,
            pageSize,
            entityType,
        );

        return {
            success: true,
            data: result.data,
            pagination: {
                total: result.total,
                page: pageNum,
                limit: pageSize,
                pages: Math.ceil(result.total / pageSize),
            },
        };
    }

    /**
     * GET /api/v1/activity/:entityType/:entityId
     * Returns activity timeline for a specific record.
     */
    @Get(':entityType/:entityId')
    @RequirePermissions('activity:view')
    async getEntityActivities(
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
        @Req() req: any,
    ) {
        const { companyId } = req.tenant;
        const activities = await this.activityService.getEntityActivities(
            String(companyId),
            entityType,
            entityId,
        );

        return {
            success: true,
            data: activities,
        };
    }
}

