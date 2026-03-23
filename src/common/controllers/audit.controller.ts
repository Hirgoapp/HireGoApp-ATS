import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { CompanyId } from '../decorators/company-id.decorator';
import { TenantGuard } from '../guards/tenant.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('api/v1/audit')
@UseGuards(PermissionGuard, TenantGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    /**
     * GET /api/v1/audit/logs
     * Query audit logs with filters
     */
    @Get('logs')
    @RequirePermissions('audit:view')
    async getAuditLogs(
        @CompanyId() companyId: string,
        @Query('entityType') entityType?: string,
        @Query('entityId') entityId?: string,
        @Query('action') action?: string,
        @Query('userId') userId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const filters = {
            entityType,
            entityId,
            action,
            userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
        };
        return this.auditService.getAuditTrail(companyId, filters);
    }

    /**
     * GET /api/v1/audit/logs/entity/:entityType/:entityId
     * Retrieve history for specific entity
     */
    @Get('logs/entity/:entityType/:entityId')
    @RequirePermissions('audit:view')
    async getEntityHistory(
        @CompanyId() companyId: string,
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
    ) {
        return this.auditService.getEntityHistory(companyId, entityType, entityId);
    }

    /**
     * GET /api/v1/audit/logs/user/:userId
     * Retrieve logs for user actions
     */
    @Get('logs/user/:userId')
    @RequirePermissions('audit:view')
    async getUserActivity(
        @CompanyId() companyId: string,
        @Param('userId') userId: string,
    ) {
        return this.auditService.getUserActivity(companyId, userId);
    }
}
