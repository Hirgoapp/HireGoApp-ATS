import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EducationLevelService } from './education-level.service';
import { CreateEducationLevelDto } from './dto/create-education-level.dto';
import { UpdateEducationLevelDto } from './dto/update-education-level.dto';
import { FilterEducationLevelDto } from './dto/filter-education-level.dto';
import { EducationLevelResponseDto } from './dto/education-level-response.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('education-levels')
@ApiBearerAuth()
@Controller('api/v1/education-levels')
@UseGuards(JwtAuthGuard)
export class EducationLevelController {
    constructor(private readonly levelService: EducationLevelService) { }

    @Post()
    @RequirePermissions('education-levels:create')
    @ApiOperation({ summary: 'Create education level' })
    @ApiResponse({ status: 201, type: EducationLevelResponseDto })
    async create(@Body() dto: CreateEducationLevelDto, @Request() req): Promise<EducationLevelResponseDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.levelService.create(dto, companyId, userId);
    }

    @Get()
    @RequirePermissions('education-levels:read')
    @ApiOperation({ summary: 'List education levels' })
    async findAll(@Request() req, @Query() filter: FilterEducationLevelDto) {
        const companyId = req.user.company_id;
        return await this.levelService.findAll(companyId, filter);
    }

    @Get('active')
    @RequirePermissions('education-levels:read')
    @ApiOperation({ summary: 'List active education levels' })
    async findActive(@Request() req) {
        const companyId = req.user.company_id;
        return await this.levelService.findActive(companyId);
    }

    @Get(':id')
    @RequirePermissions('education-levels:read')
    @ApiOperation({ summary: 'Get education level by ID' })
    @ApiResponse({ status: 200, type: EducationLevelResponseDto })
    async findOne(@Request() req, @Param('id') id: string): Promise<EducationLevelResponseDto> {
        const companyId = req.user.company_id;
        return await this.levelService.findOne(id, companyId);
    }

    @Put(':id')
    @RequirePermissions('education-levels:update')
    @ApiOperation({ summary: 'Update education level' })
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateEducationLevelDto) {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.levelService.update(id, dto, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('education-levels:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete education level' })
    async remove(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.levelService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @RequirePermissions('education-levels:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Hard delete education level' })
    async hardDelete(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.levelService.hardDelete(id, companyId);
    }
}
