import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import {
    CreateFeatureFlagDto,
    UpdateFeatureFlagDto,
    CheckFeatureFlagDto,
    FeatureFlagResponseDto,
    BulkFeatureFlagCheckDto,
} from './dto/feature-flag.dto';
import { Require } from '../../rbac/decorators/require.decorator';
import { FlagStatus } from './entities/feature-flag.entity';

@ApiTags('feature-flags')
@ApiBearerAuth()
@Controller('feature-flags')
export class FeatureFlagsController {
    constructor(private readonly featureFlagsService: FeatureFlagsService) { }

    @Post()
    @Require('feature_flags:write')
    @ApiOperation({ summary: 'Create a new feature flag' })
    @ApiResponse({ status: 201, description: 'Feature flag created', type: FeatureFlagResponseDto })
    async create(@Body() createDto: CreateFeatureFlagDto) {
        return this.featureFlagsService.create(createDto);
    }

    @Get()
    @Require('feature_flags:read')
    @ApiOperation({ summary: 'Get all feature flags' })
    @ApiResponse({ status: 200, description: 'List of feature flags', type: [FeatureFlagResponseDto] })
    async findAll(@Query('status') status?: FlagStatus, @Query('is_beta') isBeta?: string) {
        const filters: any = {};
        if (status) filters.status = status;
        if (isBeta !== undefined) filters.is_beta = isBeta === 'true';

        return this.featureFlagsService.findAll(filters);
    }

    @Get('beta')
    @Require('feature_flags:read')
    @ApiOperation({ summary: 'Get all beta features' })
    @ApiResponse({ status: 200, description: 'List of beta features', type: [FeatureFlagResponseDto] })
    async getBetaFeatures(@Query('company_id') companyId: string) {
        return this.featureFlagsService.getBetaFeatures(companyId);
    }

    @Get(':id')
    @Require('feature_flags:read')
    @ApiOperation({ summary: 'Get a feature flag by ID' })
    @ApiResponse({ status: 200, description: 'Feature flag details', type: FeatureFlagResponseDto })
    async findOne(@Param('id') id: string) {
        return this.featureFlagsService.findOne(id);
    }

    @Get(':key/statistics')
    @Require('feature_flags:read')
    @ApiOperation({ summary: 'Get usage statistics for a flag' })
    @ApiResponse({ status: 200, description: 'Flag usage statistics' })
    async getStatistics(@Param('key') key: string) {
        return this.featureFlagsService.getStatistics(key);
    }

    @Patch(':id')
    @Require('feature_flags:write')
    @ApiOperation({ summary: 'Update a feature flag' })
    @ApiResponse({ status: 200, description: 'Feature flag updated', type: FeatureFlagResponseDto })
    async update(@Param('id') id: string, @Body() updateDto: UpdateFeatureFlagDto) {
        return this.featureFlagsService.update(id, updateDto);
    }

    @Delete(':id')
    @Require('feature_flags:write')
    @ApiOperation({ summary: 'Archive a feature flag' })
    @ApiResponse({ status: 200, description: 'Feature flag archived' })
    async remove(@Param('id') id: string) {
        await this.featureFlagsService.remove(id);
        return { message: 'Feature flag archived successfully' };
    }

    @Post('check')
    @ApiOperation({ summary: 'Check if a feature flag is enabled' })
    @ApiResponse({ status: 200, description: 'Flag status', schema: { type: 'object', properties: { enabled: { type: 'boolean' } } } })
    async checkFlag(@Body() checkDto: CheckFeatureFlagDto) {
        const enabled = await this.featureFlagsService.isEnabled(checkDto);
        return { enabled };
    }

    @Post('check/bulk')
    @ApiOperation({ summary: 'Check multiple feature flags at once' })
    @ApiResponse({ status: 200, description: 'Multiple flag statuses' })
    async bulkCheck(@Body() bulkDto: BulkFeatureFlagCheckDto) {
        const results = await this.featureFlagsService.bulkCheck(bulkDto.flag_keys, {
            company_id: bulkDto.company_id,
            user_id: bulkDto.user_id,
            environment: bulkDto.environment,
        });
        return results;
    }

    @Post(':key/beta/enable')
    @Require('feature_flags:write')
    @ApiOperation({ summary: 'Enable beta feature for a company' })
    @ApiResponse({ status: 200, description: 'Beta feature enabled for company' })
    async enableBeta(@Param('key') key: string, @Body('company_id') companyId: string) {
        await this.featureFlagsService.enableBetaForCompany(key, companyId);
        return { message: 'Beta feature enabled successfully' };
    }

    @Post(':key/beta/disable')
    @Require('feature_flags:write')
    @ApiOperation({ summary: 'Disable beta feature for a company' })
    @ApiResponse({ status: 200, description: 'Beta feature disabled for company' })
    async disableBeta(@Param('key') key: string, @Body('company_id') companyId: string) {
        await this.featureFlagsService.disableBetaForCompany(key, companyId);
        return { message: 'Beta feature disabled successfully' };
    }
}
