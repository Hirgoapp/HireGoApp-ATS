import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('api/v1/audit-logs')
@UseGuards(PermissionGuard, TenantGuard)
export class AuditLogController {
    constructor(private readonly auditLogRepository: AuditLogRepository) { }

    /**
     * GET /api/v1/audit-logs
     * List audit logs for the company with pagination and filtering.
     */
    @Get()
    @RequirePermissions('audit:view')
    async listAuditLogs(
        @Req() req: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50',
        @Query('entityType') entityType?: string,
        @Query('action') action?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const { companyId } = req.tenant;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));

        const filters: any = {
            companyId,
        };

        if (entityType) filters.entityType = entityType;
        if (action) filters.action = action;

        const result = await this.auditLogRepository.findWithPagination(
            filters,
            pageNum,
            pageSize,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
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
}
