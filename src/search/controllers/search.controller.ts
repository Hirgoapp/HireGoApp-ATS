import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService, GlobalSearchResult } from '../services/search.service';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { SearchQueryDto } from '../dto/search-query.dto';

/**
 * Global search API. Tenant-isolated: company_id from req.tenant only.
 */
@ApiTags('Search')
@ApiBearerAuth()
@Controller('api/v1/search')
@UseGuards(PermissionGuard, TenantGuard)
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Get()
    @RequirePermissions('search:view')
    @ApiOperation({ summary: 'Global search across clients, jobs, candidates, submissions' })
    async search(
        @Query() query: SearchQueryDto,
        @Req() req: any,
    ): Promise<{ results: GlobalSearchResult[] }> {
        const companyId = req.tenant.companyId as string;
        const term = query.q ?? '';
        const results = await this.searchService.globalSearch(companyId, term);
        return { results };
    }
}
