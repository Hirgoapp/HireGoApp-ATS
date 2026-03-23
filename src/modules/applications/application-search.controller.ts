import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { AdvancedApplicationSearchDto } from './dto/advanced-application-search.dto';
import { ApplicationService } from './application.service';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('api/v1/applications/search')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ApplicationSearchController {
    constructor(private readonly applicationService: ApplicationService) { }

    @Post('advanced')
    @Require('applications:read')
    @ApiOperation({ summary: 'Advanced application search' })
    async advanced(@Body() dto: AdvancedApplicationSearchDto, @CompanyId() companyId: string) {
        return this.applicationService.advancedSearch(dto, companyId);
    }
}
