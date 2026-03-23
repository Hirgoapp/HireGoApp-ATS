import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, NotificationFilterDto, MarkAsReadDto } from './dto/notification.dto';
import { UpdateNotificationPreferenceDto } from './dto/notification-preference.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(PermissionGuard, TenantGuard)
@Controller('api/v1/notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    @ApiOperation({ summary: 'Get user notifications' })
    @ApiResponse({ status: 200, description: 'Notifications retrieved' })
    @RequirePermissions('notifications:view')
    async getNotifications(
        @Query() filterDto: NotificationFilterDto,
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        return this.notificationService.findByUser(String(userId), String(companyId), filterDto);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    @ApiResponse({ status: 200, description: 'Unread count retrieved' })
    @RequirePermissions('notifications:view')
    async getUnreadCount(@Req() req: any) {
        const { companyId, userId } = req.tenant;
        const count = await this.notificationService.getUnreadCount(String(userId), String(companyId));
        return { unread_count: count };
    }

    @Post('mark-as-read')
    @ApiOperation({ summary: 'Mark notifications as read' })
    @ApiResponse({ status: 200, description: 'Notifications marked as read' })
    @RequirePermissions('notifications:update')
    async markAsRead(
        @Body() markAsReadDto: MarkAsReadDto,
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        await this.notificationService.markAsRead(
            markAsReadDto.notification_ids,
            String(userId),
            String(companyId),
        );
        return { message: 'Notifications marked as read' };
    }

    @Post('mark-all-as-read')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({ status: 200, description: 'All notifications marked as read' })
    @RequirePermissions('notifications:update')
    async markAllAsRead(@Req() req: any) {
        const { companyId, userId } = req.tenant;
        await this.notificationService.markAllAsRead(String(userId), String(companyId));
        return { message: 'All notifications marked as read' };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a notification' })
    @ApiParam({ name: 'id', description: 'Notification ID' })
    @ApiResponse({ status: 200, description: 'Notification deleted' })
    @RequirePermissions('notifications:update')
    async deleteNotification(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        await this.notificationService.delete(id, String(userId), String(companyId));
        return { message: 'Notification deleted' };
    }

    @Get('preferences')
    @ApiOperation({ summary: 'Get notification preferences' })
    @ApiResponse({ status: 200, description: 'Preferences retrieved' })
    @RequirePermissions('notifications:view')
    async getPreferences(@Req() req: any) {
        const { userId } = req.tenant;
        return this.notificationService.getUserPreferences(String(userId));
    }

    @Put('preferences/:type')
    @ApiOperation({ summary: 'Update notification preference for a specific type' })
    @ApiParam({ name: 'type', description: 'Notification type' })
    @ApiResponse({ status: 200, description: 'Preference updated' })
    @RequirePermissions('notifications:update')
    async updatePreference(
        @Param('type') type: string,
        @Req() req: any,
        @Body() updateDto: UpdateNotificationPreferenceDto,
    ) {
        const { userId } = req.tenant;
        return this.notificationService.updatePreference(String(userId), type, updateDto);
    }
}
