import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('api/v1/settings')
@UseGuards(PermissionGuard)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get('schema')
    @RequirePermissions('settings:view')
    async getSchema() {
        return {
            success: true,
            data: this.settingsService.getSchema(),
        };
    }

    @Get()
    @RequirePermissions('settings:view')
    async getAll(@Req() req: any) {
        const { companyId } = req.tenant;
        const settings = await this.settingsService.getAllSettings(String(companyId));
        return {
            success: true,
            data: settings,
        };
    }

    @Get(':key')
    @RequirePermissions('settings:view')
    async getOne(@Param('key') key: string, @Req() req: any) {
        const { companyId } = req.tenant;
        const setting = await this.settingsService.getSetting(String(companyId), key);
        return {
            success: true,
            data: setting,
        };
    }

    @Post()
    @RequirePermissions('settings:update')
    async set(
        @Body() body: { key: string; value: any },
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        const setting = await this.settingsService.setSetting(
            String(companyId),
            String(userId),
            body.key,
            body.value,
        );
        return {
            success: true,
            data: setting,
        };
    }

    @Put(':key')
    @RequirePermissions('settings:update')
    async put(
        @Param('key') key: string,
        @Body() body: { value: any },
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        const setting = await this.settingsService.setSetting(
            String(companyId),
            String(userId),
            key,
            body.value,
        );
        return {
            success: true,
            data: setting,
        };
    }

    @Post(':key/reset')
    @RequirePermissions('settings:update')
    async reset(@Param('key') key: string, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        await this.settingsService.deleteSetting(String(companyId), String(userId), key);
        return { success: true };
    }

    @Delete(':key')
    @RequirePermissions('settings:update')
    async remove(@Param('key') key: string, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        await this.settingsService.deleteSetting(String(companyId), String(userId), key);
        return {
            success: true,
        };
    }
}

