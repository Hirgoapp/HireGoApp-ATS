import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    Res,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { SsoService } from '../services/sso.service';
import { CreateSsoConfigDto, UpdateSsoConfigDto } from '../dto/sso-config.dto';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { SsoProvider } from '../entities/sso-configuration.entity';

@Controller('auth/sso')
export class SsoController {
    constructor(private ssoService: SsoService) { }

    // ================== SSO Configuration Management ==================

    @Post('config')
    @UseGuards(PermissionGuard)
    @RequirePermissions('settings:write')
    async createSsoConfig(
        @Body() dto: CreateSsoConfigDto,
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        const userId = req.user.sub;

        const config = await this.ssoService.createSsoConfig(companyId, dto, userId);

        return {
            message: 'SSO configuration created successfully',
            data: config,
        };
    }

    @Get('config')
    @UseGuards(PermissionGuard)
    @RequirePermissions('settings:read')
    async listSsoConfigs(@Req() req: any) {
        const companyId = req.user.company_id;
        const configs = await this.ssoService.listSsoConfigs(companyId);

        return {
            data: configs,
            total: configs.length,
        };
    }

    @Get('config/:id')
    @UseGuards(PermissionGuard)
    @RequirePermissions('settings:read')
    async getSsoConfig(@Param('id') id: string) {
        // Will be retrieved in service
        return { message: 'Not implemented yet' };
    }

    @Put('config/:id')
    @UseGuards(PermissionGuard)
    @RequirePermissions('settings:write')
    async updateSsoConfig(
        @Param('id') id: string,
        @Body() dto: UpdateSsoConfigDto,
        @Req() req: any,
    ) {
        const userId = req.user.sub;
        const config = await this.ssoService.updateSsoConfig(id, dto, userId);

        return {
            message: 'SSO configuration updated successfully',
            data: config,
        };
    }

    @Delete('config/:id')
    @UseGuards(PermissionGuard)
    @RequirePermissions('settings:write')
    async deleteSsoConfig(@Param('id') id: string) {
        await this.ssoService.deleteSsoConfig(id);
        return { message: 'SSO configuration deleted successfully' };
    }

    @Post('config/:id/test')
    @UseGuards(PermissionGuard)
    @RequirePermissions('settings:write')
    async testSsoConfig(@Param('id') id: string) {
        const result = await this.ssoService.testSsoConfig(id);
        return result;
    }

    // ================== Google OAuth ==================

    @Get('google/login')
    @UseGuards(AuthGuard('google'))
    async googleLogin() {
        // Initiates Google OAuth flow
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req: any, @Res() res: Response) {
        try {
            const profile = req.user;

            // Get SSO config by email domain or default
            const config = await this.ssoService.getSsoConfigByEmail(profile.email);
            if (!config) {
                throw new BadRequestException('SSO not configured for this email domain');
            }

            const result = await this.ssoService.handleSsoLogin(
                profile,
                config.company_id,
                config.id,
                req,
            );

            // Redirect to frontend with tokens
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            const redirectUrl = `${frontendUrl}/auth/callback?token=${result.token}&refresh=${result.refreshToken}`;

            return res.redirect(redirectUrl);
        } catch (error) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            return res.redirect(`${frontendUrl}/auth/error?message=${error.message}`);
        }
    }

    // ================== SAML 2.0 ==================

    @Get('saml/login')
    async samlLogin(
        @Query('company_id') companyId: string,
        @Res() res: Response,
    ) {
        if (!companyId) {
            throw new BadRequestException('company_id is required');
        }

        // Get SAML config and redirect to IdP
        const config = await this.ssoService.getSsoConfig(companyId, SsoProvider.SAML);

        // In a real implementation, use passport-saml to generate auth request
        return res.json({
            message: 'SAML login initiated',
            config_id: config.id,
            entry_point: (config.configuration as any).entryPoint,
        });
    }

    @Post('saml/callback')
    @UseGuards(AuthGuard('saml'))
    async samlCallback(@Req() req: any, @Res() res: Response) {
        try {
            const profile = req.user;

            // Find config by SAML issuer or other identifier
            // For now, we'll assume it's in the session or request
            const config = await this.ssoService.getSsoConfigByEmail(profile.email);
            if (!config) {
                throw new BadRequestException('SSO not configured');
            }

            const result = await this.ssoService.handleSsoLogin(
                profile,
                config.company_id,
                config.id,
                req,
            );

            // Redirect to frontend with tokens
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            const redirectUrl = `${frontendUrl}/auth/callback?token=${result.token}&refresh=${result.refreshToken}`;

            return res.redirect(redirectUrl);
        } catch (error) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            return res.redirect(`${frontendUrl}/auth/error?message=${error.message}`);
        }
    }

    @Get('saml/metadata')
    async samlMetadata(@Query('company_id') companyId: string) {
        // Return SAML metadata XML for SP (Service Provider)
        const config = await this.ssoService.getSsoConfig(companyId, SsoProvider.SAML);

        return {
            metadata: config.metadata_xml || 'Metadata not configured',
        };
    }

    // ================== Session Management ==================

    @Get('sessions')
    @UseGuards(PermissionGuard)
    @RequirePermissions('users:read')
    async getActiveSessions(@Req() req: any) {
        const userId = req.user.sub;
        const sessions = await this.ssoService.getActiveSessions(userId);

        return {
            data: sessions,
            total: sessions.length,
        };
    }

    @Post('sessions/:token/revoke')
    @UseGuards(PermissionGuard)
    @RequirePermissions('users:write')
    async revokeSession(@Param('token') token: string) {
        await this.ssoService.invalidateSsoSession(token);
        return { message: 'Session revoked successfully' };
    }
}
