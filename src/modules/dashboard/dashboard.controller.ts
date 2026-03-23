import { Body, Controller, Get, Put, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('api/v1/dashboard')
@UseGuards(TenantGuard)
export class DashboardController {
    constructor(private readonly service: DashboardService) { }

    @Get('overview')
    async overview(@Req() req: any) {
        const companyId = String(req.tenant.companyId);
        const data = await this.service.getOverview(companyId);
        return { success: true, data };
    }

    @Get('widgets/catalog')
    async widgetCatalog() {
        const data = await this.service.getWidgetCatalog();
        return { success: true, data };
    }

    @Get('layout')
    async getLayout(@Req() req: any, @Query('role') role?: string) {
        const companyId = String(req.tenant.companyId);
        const userId = String(req.tenant.userId);
        const effectiveRole = role || req.user?.role || 'employee';
        const data = await this.service.getLayout(companyId, userId, effectiveRole);
        return { success: true, data };
    }

    @Put('layout')
    async saveLayout(@Req() req: any, @Body() payload: any, @Query('role') role?: string) {
        const companyId = String(req.tenant.companyId);
        const userId = String(req.tenant.userId);
        const effectiveRole = role || req.user?.role || 'employee';
        const data = await this.service.saveLayout(companyId, userId, effectiveRole, payload);
        return { success: true, data };
    }

    @Get('templates/role')
    async getRoleTemplate(@Req() req: any, @Query('role') role?: string) {
        const companyId = String(req.tenant.companyId);
        const effectiveRole = role || req.user?.role || 'employee';
        const data = await this.service.getRoleTemplate(companyId, effectiveRole);
        return { success: true, data };
    }

    @Put('templates/role')
    async saveRoleTemplate(@Req() req: any, @Body() payload: any, @Query('role') role?: string) {
        const companyId = String(req.tenant.companyId);
        const effectiveRole = role || req.user?.role || 'employee';
        const data = await this.service.saveRoleTemplate(companyId, effectiveRole, payload);
        return { success: true, data };
    }
}
