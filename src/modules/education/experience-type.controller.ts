import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExperienceTypeService } from './experience-type.service';
import { CreateExperienceTypeDto } from './dto/create-experience-type.dto';
import { UpdateExperienceTypeDto } from './dto/update-experience-type.dto';
import { FilterExperienceTypeDto } from './dto/filter-experience-type.dto';
import { ExperienceTypeResponseDto } from './dto/experience-type-response.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('experience-types')
@ApiBearerAuth()
@Controller('api/v1/experience-types')
@UseGuards(JwtAuthGuard)
export class ExperienceTypeController {
    constructor(private readonly typeService: ExperienceTypeService) { }

    @Post()
    @RequirePermissions('experience-types:create')
    @ApiOperation({ summary: 'Create experience type' })
    @ApiResponse({ status: 201, type: ExperienceTypeResponseDto })
    async create(@Body() dto: CreateExperienceTypeDto, @Request() req): Promise<ExperienceTypeResponseDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.typeService.create(dto, companyId, userId);
    }

    @Get()
    @RequirePermissions('experience-types:read')
    @ApiOperation({ summary: 'List experience types' })
    async findAll(@Request() req, @Query() filter: FilterExperienceTypeDto) {
        const companyId = req.user.company_id;
        return await this.typeService.findAll(companyId, filter);
    }

    @Get('active')
    @RequirePermissions('experience-types:read')
    @ApiOperation({ summary: 'List active experience types' })
    async findActive(@Request() req) {
        const companyId = req.user.company_id;
        return await this.typeService.findActive(companyId);
    }

    @Get(':id')
    @RequirePermissions('experience-types:read')
    @ApiOperation({ summary: 'Get experience type by ID' })
    @ApiResponse({ status: 200, type: ExperienceTypeResponseDto })
    async findOne(@Request() req, @Param('id') id: string): Promise<ExperienceTypeResponseDto> {
        const companyId = req.user.company_id;
        return await this.typeService.findOne(id, companyId);
    }

    @Put(':id')
    @RequirePermissions('experience-types:update')
    @ApiOperation({ summary: 'Update experience type' })
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateExperienceTypeDto) {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.typeService.update(id, dto, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('experience-types:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete experience type' })
    async remove(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.typeService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @RequirePermissions('experience-types:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Hard delete experience type' })
    async hardDelete(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.typeService.hardDelete(id, companyId);
    }
}
