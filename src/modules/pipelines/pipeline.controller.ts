import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto, UpdatePipelineStageDto } from './dto/update-pipeline.dto';
import { FilterPipelineDto } from './dto/filter-pipeline.dto';
import { PipelineResponseDto } from './dto/pipeline-response.dto';
import { Pipeline } from './entities/pipeline.entity';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('pipelines')
@ApiBearerAuth()
@Controller('api/v1/pipelines')
@UseGuards(JwtAuthGuard)
export class PipelineController {
    constructor(private readonly pipelineService: PipelineService) { }

    @Post()
    @RequirePermissions('pipelines:create')
    @ApiOperation({ summary: 'Create pipeline' })
    @ApiResponse({ status: 201, type: PipelineResponseDto })
    async create(@Body() dto: CreatePipelineDto, @Request() req): Promise<Pipeline> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.pipelineService.create(dto, companyId, userId);
    }

    @Post('default')
    @RequirePermissions('pipelines:create')
    @ApiOperation({ summary: 'Create default pipeline' })
    @ApiResponse({ status: 201, type: PipelineResponseDto })
    async createDefault(@Request() req): Promise<Pipeline> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.pipelineService.createDefault(companyId, userId);
    }

    @Get()
    @RequirePermissions('pipelines:read')
    @ApiOperation({ summary: 'List pipelines' })
    async findAll(@Request() req, @Query() filter: FilterPipelineDto) {
        const companyId = req.user.company_id;
        return await this.pipelineService.findAll(companyId, filter);
    }

    @Get('default')
    @RequirePermissions('pipelines:read')
    @ApiOperation({ summary: 'Get default pipeline' })
    @ApiResponse({ status: 200, type: PipelineResponseDto })
    async findDefault(@Request() req): Promise<Pipeline> {
        const companyId = req.user.company_id;
        return await this.pipelineService.findDefault(companyId);
    }

    @Get(':id')
    @RequirePermissions('pipelines:read')
    @ApiOperation({ summary: 'Get pipeline by ID' })
    @ApiResponse({ status: 200, type: PipelineResponseDto })
    async findOne(@Request() req, @Param('id') id: string): Promise<Pipeline> {
        const companyId = req.user.company_id;
        return await this.pipelineService.findOne(id, companyId);
    }

    @Put(':id')
    @RequirePermissions('pipelines:update')
    @ApiOperation({ summary: 'Update pipeline' })
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePipelineDto) {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.pipelineService.update(id, dto, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('pipelines:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete pipeline' })
    async remove(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.pipelineService.remove(id, companyId);
    }

    @Post(':id/stages')
    @RequirePermissions('pipelines:update')
    @ApiOperation({ summary: 'Add stage to pipeline' })
    async addStage(@Request() req, @Param('id') pipelineId: string, @Body() dto: any) {
        const companyId = req.user.company_id;
        return await this.pipelineService.addStage(pipelineId, dto, companyId);
    }

    @Put('stages/:stageId')
    @RequirePermissions('pipelines:update')
    @ApiOperation({ summary: 'Update pipeline stage' })
    async updateStage(@Request() req, @Param('stageId') stageId: string, @Body() dto: UpdatePipelineStageDto) {
        const companyId = req.user.company_id;
        return await this.pipelineService.updateStage(stageId, dto, companyId);
    }

    @Delete('stages/:stageId')
    @RequirePermissions('pipelines:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete pipeline stage' })
    async removeStage(@Request() req, @Param('stageId') stageId: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.pipelineService.removeStage(stageId, companyId);
    }
}
