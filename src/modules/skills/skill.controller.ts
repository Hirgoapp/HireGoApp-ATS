import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkillService } from './skill.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { FilterSkillDto } from './dto/filter-skill.dto';
import { SkillResponseDto } from './dto/skill-response.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('skills')
@ApiBearerAuth()
@Controller('api/v1/skills')
@UseGuards(JwtAuthGuard)
export class SkillController {
    constructor(private readonly skillService: SkillService) { }

    @Post()
    @RequirePermissions('skills:create')
    @ApiOperation({ summary: 'Create skill' })
    @ApiResponse({ status: 201, type: SkillResponseDto })
    async create(@Body() dto: CreateSkillDto, @Request() req): Promise<SkillResponseDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.skillService.create(dto, companyId, userId);
    }

    @Get()
    @RequirePermissions('skills:read')
    @ApiOperation({ summary: 'List skills' })
    async findAll(@Request() req, @Query() filter: FilterSkillDto) {
        const companyId = req.user.company_id;
        return await this.skillService.findAll(companyId, filter);
    }

    @Get('active')
    @RequirePermissions('skills:read')
    @ApiOperation({ summary: 'List active skills' })
    async findActive(@Request() req) {
        const companyId = req.user.company_id;
        return await this.skillService.findActive(companyId);
    }

    @Get('by-category/:categoryId')
    @RequirePermissions('skills:read')
    @ApiOperation({ summary: 'List skills by category' })
    async findByCategory(@Request() req, @Param('categoryId') categoryId: string) {
        const companyId = req.user.company_id;
        return await this.skillService.findByCategory(categoryId, companyId);
    }

    @Get('search')
    @RequirePermissions('skills:read')
    @ApiOperation({ summary: 'Search skills' })
    async search(@Request() req, @Query('term') term: string) {
        const companyId = req.user.company_id;
        return await this.skillService.search(companyId, term);
    }

    @Get(':id')
    @RequirePermissions('skills:read')
    @ApiOperation({ summary: 'Get skill by ID' })
    @ApiResponse({ status: 200, type: SkillResponseDto })
    async findOne(@Request() req, @Param('id') id: string): Promise<SkillResponseDto> {
        const companyId = req.user.company_id;
        return await this.skillService.findOne(id, companyId);
    }

    @Put(':id')
    @RequirePermissions('skills:update')
    @ApiOperation({ summary: 'Update skill' })
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateSkillDto) {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.skillService.update(id, dto, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('skills:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete skill' })
    async remove(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.skillService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @RequirePermissions('skills:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Hard delete skill' })
    async hardDelete(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.skillService.hardDelete(id, companyId);
    }
}
