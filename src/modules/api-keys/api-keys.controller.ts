import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyFilterDto } from './dto/api-key.dto';
import { CompanyId, UserId } from '../../common/decorators/company-id.decorator';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { Require } from '../../rbac/decorators/require.decorator';

@Controller('api/v1/api-keys')
@UseGuards(RoleGuard)
export class ApiKeysController {
    constructor(private readonly service: ApiKeysService) { }

    @Post()
    @Require('api-keys:create')
    async create(@CompanyId() companyId: string, @UserId() userId: string, @Body() dto: CreateApiKeyDto) {
        return this.service.create(companyId, userId, dto);
    }

    @Get()
    @Require('api-keys:read')
    async list(@CompanyId() companyId: string, @Query() filter: ApiKeyFilterDto) {
        return this.service.list(companyId, filter);
    }

    @Get(':id')
    @Require('api-keys:read')
    async get(@CompanyId() companyId: string, @Param('id') id: string) {
        return this.service.get(companyId, id);
    }

    @Put(':id')
    @Require('api-keys:update')
    async update(@CompanyId() companyId: string, @Param('id') id: string, @Body() dto: UpdateApiKeyDto) {
        return this.service.update(companyId, id, dto);
    }

    @Post(':id/rotate')
    @Require('api-keys:update')
    async rotate(@CompanyId() companyId: string, @Param('id') id: string) {
        return this.service.rotate(companyId, id);
    }

    @Delete(':id')
    @Require('api-keys:delete')
    async revoke(@CompanyId() companyId: string, @Param('id') id: string) {
        return this.service.revoke(companyId, id);
    }
}
