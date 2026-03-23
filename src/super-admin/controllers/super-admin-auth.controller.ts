import {
    Controller,
    Post,
    Body,
    BadRequestException,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request,
} from '@nestjs/common';
import { SuperAdminAuthService } from '../services/super-admin-auth.service';
import { SuperAdminGuard } from '../guards/super-admin.guard';

interface LoginRequest {
    email: string;
    password: string;
}

interface RefreshTokenRequest {
    refreshToken: string;
}

@Controller('api/super-admin/auth')
export class SuperAdminAuthController {
    constructor(private readonly superAdminAuthService: SuperAdminAuthService) { }

    /**
     * POST /api/super-admin/auth/login
     * Login a super admin user
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: LoginRequest) {
        // Validate input
        if (!body.email || !body.password) {
            throw new BadRequestException('Email and password are required');
        }

        const result = await this.superAdminAuthService.login(body.email, body.password);

        return {
            success: true,
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    role: result.user.role,
                },
            },
        };
    }

    /**
     * POST /api/super-admin/auth/refresh
     * Refresh super admin token
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() body: RefreshTokenRequest) {
        if (!body.refreshToken) {
            throw new BadRequestException('Refresh token is required');
        }

        const result = await this.superAdminAuthService.refreshToken(body.refreshToken);

        return {
            success: true,
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            },
        };
    }

    /**
     * POST /api/super-admin/auth/logout
     * Logout super admin (client-side token invalidation)
     */
    @Post('logout')
    @UseGuards(SuperAdminGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req: any) {
        // Just return success - token invalidation happens on client side
        // In production, you could implement token blacklisting here
        return {
            success: true,
            message: 'Logged out successfully',
        };
    }

    /**
     * POST /api/super-admin/auth/change-password
     * Change super admin password
     */
    @Post('change-password')
    @UseGuards(SuperAdminGuard)
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @Request() req: any,
        @Body()
        body: {
            oldPassword: string;
            newPassword: string;
        }
    ) {
        if (!body.oldPassword || !body.newPassword) {
            throw new BadRequestException('Old and new passwords are required');
        }

        if (body.newPassword.length < 8) {
            throw new BadRequestException('New password must be at least 8 characters');
        }

        const userId = req.user?.userId;

        await this.superAdminAuthService.changePassword(
            userId,
            body.oldPassword,
            body.newPassword
        );

        return {
            success: true,
            message: 'Password changed successfully',
        };
    }
}
