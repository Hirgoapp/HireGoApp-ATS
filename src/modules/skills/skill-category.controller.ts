import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkillCategoryService } from './skill-category.service';
import { CreateSkillCategoryDto } from './dto/create-skill-category.dto';
import { UpdateSkillCategoryDto } from './dto/update-skill-category.dto';
import { FilterSkillCategoryDto } from './dto/filter-skill-category.dto';
import { SkillCategoryResponseDto } from './dto/skill-category-response.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('skill-categories')
@ApiBearerAuth()
@Controller('api/v1/skill-categories')
@UseGuards(JwtAuthGuard)
export class SkillCategoryController {
    constructor(private readonly categoryService: SkillCategoryService) { }

    @Post()
    @RequirePermissions('skill-categories:create')
    @ApiOperation({ summary: 'Create skill category' })
    @ApiResponse({ status: 201, type: SkillCategoryResponseDto })
    async create(@Body() dto: CreateSkillCategoryDto, @Request() req): Promise<SkillCategoryResponseDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.categoryService.create(dto, companyId, userId);
    }

    @Get()
    @RequirePermissions('skill-categories:read')
    @ApiOperation({ summary: 'List skill categories' })
    async findAll(@Request() req, @Query() filter: FilterSkillCategoryDto) {
        const companyId = req.user.company_id;
        return await this.categoryService.findAll(companyId, filter);
    }

    @Get('active')
    @RequirePermissions('skill-categories:read')
    @ApiOperation({ summary: 'List active skill categories' })
    async findActive(@Request() req) {
        const companyId = req.user.company_id;
        return await this.categoryService.findActive(companyId);
    }

    @Get(':id')
    @RequirePermissions('skill-categories:read')
    @ApiOperation({ summary: 'Get category by ID' })
    @ApiResponse({ status: 200, type: SkillCategoryResponseDto })
    async findOne(@Request() req, @Param('id') id: string): Promise<SkillCategoryResponseDto> {
        const companyId = req.user.company_id;
        return await this.categoryService.findOne(id, companyId);
    }

    @Put(':id')
    @RequirePermissions('skill-categories:update')
    @ApiOperation({ summary: 'Update category' })
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateSkillCategoryDto) {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.categoryService.update(id, dto, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('skill-categories:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete category' })
    async remove(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.categoryService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @RequirePermissions('skill-categories:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Hard delete category' })
    async hardDelete(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.categoryService.hardDelete(id, companyId);
    }
}
