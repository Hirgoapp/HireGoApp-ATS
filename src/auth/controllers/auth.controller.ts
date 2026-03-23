import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthorizationService } from '../services/authorization.service';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { CheckPermissionDto } from '../dtos/check-permission.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { PermissionGuard } from '../guards/permission.guard';

@Controller('api/v1/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly authorizationService: AuthorizationService
    ) { }

    /**
     * POST /auth/login
     * Login with email and password
     * Returns: { token, refreshToken, user }
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        const result = await this.authService.login(dto.email, dto.password);
        return {
            success: true,
            data: result,
        };
    }

    /**
     * POST /auth/logout
     * Logout user (invalidate tokens)
     */
    @Post('logout')
    @UseGuards(TenantGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Req() request: any) {
        const { userId, companyId } = request.tenant;
        await this.authService.logout(String(userId), String(companyId));
        return {
            success: true,
            message: 'Logged out successfully',
        };
    }

    /**
     * POST /auth/refresh
     * Refresh access token
     * Body: { refreshToken }
     * Returns: { token, refreshToken }
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshTokenDto) {
        const result = await this.authService.refreshToken(dto.refreshToken);
        return {
            success: true,
            data: result,
        };
    }

    /**
     * GET /auth/me/permissions
     * Get current user's effective permissions
     */
    @Get('me/permissions')
    @UseGuards(TenantGuard)
    async getMyPermissions(@Req() request: any) {
        const { userId, companyId } = request.tenant;
        const permissions = await this.authorizationService.getUserPermissionsForCompany(
            String(userId),
            String(companyId),
        );
        return {
            success: true,
            data: { permissions },
        };
    }

    /**
     * POST /auth/check-permission
     * Check if current user has specific permission
     * Body: { permission }
     * Returns: { hasPermission: boolean }
     */
    @Post('check-permission')
    @UseGuards(TenantGuard)
    async checkPermission(@Body() dto: CheckPermissionDto, @Req() request: any) {
        const { userId, companyId } = request.tenant;
        const hasPermission = await this.authorizationService.userHasPermission(
            String(userId),
            String(companyId),
            dto.permission
        );
        return {
            success: true,
            data: { hasPermission, permission: dto.permission },
        };
    }
}
