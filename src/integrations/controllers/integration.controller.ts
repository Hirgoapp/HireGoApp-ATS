import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IntegrationService } from '../services/integration.service';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ConnectIntegrationDto, DisconnectIntegrationDto } from '../dto/integration.dto';
import { Integration } from '../entities/integration.entity';

function redactConfig(config: Record<string, unknown> | null | undefined): Record<string, unknown> {
    const src = config ?? {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(src)) {
        const key = k.toLowerCase();
        const shouldRedact =
            key.includes('token') ||
            key.includes('secret') ||
            key.includes('password') ||
            key.includes('private_key') ||
            key.includes('refresh') ||
            key.endsWith('_enc');

        out[k] = shouldRedact ? '[REDACTED]' : v;
    }
    return out;
}

function sanitizeIntegration(row: Integration): Integration {
    return {
        ...row,
        config: redactConfig(row.config),
    };
}

/**
 * Platform integrations API. All queries are tenant-isolated: company_id from req.tenant only, never from body.
 */
@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('api/v1/integrations')
@UseGuards(PermissionGuard, TenantGuard)
export class IntegrationController {
    constructor(private readonly integrationService: IntegrationService) {}

    @Get()
    @RequirePermissions('integrations:view')
    @ApiOperation({ summary: 'List company integrations' })
    async list(@Req() req: any) {
        const companyId = req.tenant.companyId as string;
        const integrations = await this.integrationService.getCompanyIntegrations(companyId);
        return {
            success: true,
            data: integrations.map(sanitizeIntegration),
        };
    }

    @Post('connect')
    @RequirePermissions('integrations:update')
    @ApiOperation({ summary: 'Connect an integration' })
    async connect(@Body() body: ConnectIntegrationDto, @Req() req: any) {
        const companyId = req.tenant.companyId as string;
        const integration = await this.integrationService.connect(
            companyId,
            body.integration_type,
            body.config ?? {},
        );
        return {
            success: true,
            data: integration ? sanitizeIntegration(integration) : integration,
        };
    }

    @Post('disconnect')
    @RequirePermissions('integrations:update')
    @ApiOperation({ summary: 'Disconnect an integration' })
    async disconnect(@Body() body: DisconnectIntegrationDto, @Req() req: any) {
        const companyId = req.tenant.companyId as string;
        const integration = await this.integrationService.disconnect(
            companyId,
            body.integration_type,
        );
        return {
            success: true,
            data: integration ? sanitizeIntegration(integration) : integration,
        };
    }
}
