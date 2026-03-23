import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { IntegrationAccountService } from '../services/integration-account.service';

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

@ApiTags('Integration Accounts')
@ApiBearerAuth()
@Controller('api/v1/integrations/accounts')
@UseGuards(PermissionGuard, TenantGuard)
export class IntegrationAccountsController {
    constructor(private readonly svc: IntegrationAccountService) {}

    @Get('google')
    @RequirePermissions('integrations:view')
    @ApiOperation({ summary: 'List connected Google sender accounts (mailboxes)' })
    async listGoogle(@Req() req: any) {
        const companyId = req.tenant.companyId as string;
        const rows = await this.svc.list(companyId, 'google');
        return {
            success: true,
            data: rows.map((r) => ({
                ...r,
                config: redactConfig(r.config),
            })),
        };
    }

    @Post('google/add')
    @RequirePermissions('integrations:update')
    @ApiOperation({ summary: 'Add a Google sender email (pending verification)' })
    async addGoogle(@Req() req: any, @Body() body: { email: string }) {
        const companyId = req.tenant.companyId as string;
        const row = await this.svc.addPending(companyId, 'google', body.email);
        return {
            success: true,
            data: { ...row, config: redactConfig(row.config) },
        };
    }

    @Post('google/disable')
    @RequirePermissions('integrations:update')
    @ApiOperation({ summary: 'Disable a Google sender email' })
    async disableGoogle(@Req() req: any, @Body() body: { email: string }) {
        const companyId = req.tenant.companyId as string;
        const row = await this.svc.disable(companyId, 'google', body.email);
        return {
            success: true,
            data: row ? { ...row, config: redactConfig(row.config) } : null,
        };
    }
}

