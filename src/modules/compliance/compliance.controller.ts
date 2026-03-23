import { Controller, Get, UseGuards } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';

@Controller('compliance')
@UseGuards(RoleGuard)
export class ComplianceController {
    constructor(private readonly service: ComplianceService) { }

    @Get('export')
    @Require('compliance:view')
    async exportSnapshot(@CompanyId() companyId: string) {
        return this.service.exportSnapshot(companyId);
    }
}
