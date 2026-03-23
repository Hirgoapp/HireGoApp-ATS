import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SourceService } from './source.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { FilterSourceDto } from './dto/filter-source.dto';
import { SourceResponseDto } from './dto/source-response.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('sources')
@ApiBearerAuth()
@Controller('api/v1/sources')
@UseGuards(JwtAuthGuard)
export class SourceController {
    constructor(private readonly sourceService: SourceService) { }

    @Post()
    @RequirePermissions('sources:create')
    @ApiOperation({ summary: 'Create a new source' })
    @ApiResponse({ status: 201, description: 'Source created successfully', type: SourceResponseDto })
    async create(@Body() createSourceDto: CreateSourceDto, @Request() req): Promise<SourceResponseDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.sourceService.create(createSourceDto, companyId, userId);
    }

    @Get()
    @RequirePermissions('sources:read')
    @ApiOperation({ summary: 'Get all sources with filters and pagination' })
    @ApiResponse({ status: 200, description: 'Sources retrieved successfully' })
    async findAll(@Request() req, @Query() filterDto: FilterSourceDto) {
        const companyId = req.user.company_id;
        return await this.sourceService.findAll(companyId, filterDto);
    }

    @Get('stats')
    @RequirePermissions('sources:read')
    @ApiOperation({ summary: 'Get source statistics' })
    @ApiResponse({ status: 200, description: 'Source stats retrieved' })
    async getStats(@Request() req) {
        const companyId = req.user.company_id;
        return await this.sourceService.getStats(companyId);
    }

    @Get('stats/count')
    @RequirePermissions('sources:read')
    @ApiOperation({ summary: 'Get total source count' })
    @ApiResponse({ status: 200, description: 'Source count retrieved' })
    async getCount(@Request() req) {
        const companyId = req.user.company_id;
        const count = await this.sourceService.getCount(companyId);
        return { count };
    }

    @Get('stats/by-type/:type')
    @RequirePermissions('sources:read')
    @ApiOperation({ summary: 'Get source count by type' })
    @ApiResponse({ status: 200, description: 'Source count by type retrieved' })
    async getCountByType(@Request() req, @Param('type') type: string) {
        const companyId = req.user.company_id;
        const count = await this.sourceService.getCountByType(companyId, type);
        return { count };
    }

    @Get('by-type/:type')
    @RequirePermissions('sources:read')
    @ApiOperation({ summary: 'Get sources by type' })
    @ApiResponse({ status: 200, description: 'Sources retrieved by type' })
    async findByType(@Request() req, @Param('type') type: string) {
        const companyId = req.user.company_id;
        return await this.sourceService.findByType(companyId, type);
    }

    @Get('active')
    @RequirePermissions('sources:read')
    @ApiOperation({ summary: 'Get all active sources' })
    @ApiResponse({ status: 200, description: 'Active sources retrieved' })
    async findActive(@Request() req) {
        const companyId = req.user.company_id;
        return await this.sourceService.findActive(companyId);
    }

    @Get(':id')
    @RequirePermissions('sources:read')
    @ApiOperation({ summary: 'Get source by ID' })
    @ApiResponse({ status: 200, description: 'Source retrieved successfully', type: SourceResponseDto })
    @ApiResponse({ status: 404, description: 'Source not found' })
    async findOne(@Request() req, @Param('id') id: string): Promise<SourceResponseDto> {
        const companyId = req.user.company_id;
        return await this.sourceService.findOne(id, companyId);
    }

    @Put(':id')
    @RequirePermissions('sources:update')
    @ApiOperation({ summary: 'Update source' })
    @ApiResponse({ status: 200, description: 'Source updated successfully', type: SourceResponseDto })
    @ApiResponse({ status: 404, description: 'Source not found' })
    async update(@Request() req, @Param('id') id: string, @Body() updateSourceDto: UpdateSourceDto): Promise<SourceResponseDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.sourceService.update(id, updateSourceDto, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('sources:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete source (soft delete)' })
    @ApiResponse({ status: 204, description: 'Source deleted successfully' })
    @ApiResponse({ status: 404, description: 'Source not found' })
    async remove(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.sourceService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @RequirePermissions('sources:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Permanently delete source' })
    @ApiResponse({ status: 204, description: 'Source permanently deleted' })
    @ApiResponse({ status: 404, description: 'Source not found' })
    async hardDelete(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.sourceService.hardDelete(id, companyId);
    }
}
