import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QualificationService } from './qualification.service';
import { CreateQualificationDto } from './dto/create-qualification.dto';
import { UpdateQualificationDto } from './dto/update-qualification.dto';
import { FilterQualificationDto } from './dto/filter-qualification.dto';
import { QualificationResponseDto } from './dto/qualification-response.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('qualifications')
@ApiBearerAuth()
@Controller('api/v1/qualifications')
@UseGuards(JwtAuthGuard)
export class QualificationController {
    constructor(private readonly qualificationService: QualificationService) { }

    @Post()
    @RequirePermissions('qualifications:create')
    @ApiOperation({ summary: 'Create qualification' })
    @ApiResponse({ status: 201, type: QualificationResponseDto })
    async create(@Body() dto: CreateQualificationDto, @Request() req): Promise<QualificationResponseDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.qualificationService.create(dto, companyId, userId);
    }

    @Get()
    @RequirePermissions('qualifications:read')
    @ApiOperation({ summary: 'List qualifications' })
    async findAll(@Request() req, @Query() filter: FilterQualificationDto) {
        const companyId = req.user.company_id;
        return await this.qualificationService.findAll(companyId, filter);
    }

    @Get('active')
    @RequirePermissions('qualifications:read')
    @ApiOperation({ summary: 'List active qualifications' })
    async findActive(@Request() req) {
        const companyId = req.user.company_id;
        return await this.qualificationService.findActive(companyId);
    }

    @Get(':id')
    @RequirePermissions('qualifications:read')
    @ApiOperation({ summary: 'Get qualification by ID' })
    @ApiResponse({ status: 200, type: QualificationResponseDto })
    async findOne(@Request() req, @Param('id') id: string): Promise<QualificationResponseDto> {
        const companyId = req.user.company_id;
        return await this.qualificationService.findOne(id, companyId);
    }

    @Put(':id')
    @RequirePermissions('qualifications:update')
    @ApiOperation({ summary: 'Update qualification' })
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateQualificationDto) {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.qualificationService.update(id, dto, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('qualifications:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete qualification' })
    async remove(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.qualificationService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @RequirePermissions('qualifications:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Hard delete qualification' })
    async hardDelete(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.qualificationService.hardDelete(id, companyId);
    }
}
