import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto, UpdateEvaluationDto } from './dto/evaluation.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { CompanyId, UserId } from '../../common/decorators/company-id.decorator';

@ApiTags('Evaluations')
@ApiBearerAuth()
@Controller('api/v1/evaluations')
@UseGuards(JwtAuthGuard, RoleGuard)
export class EvaluationController {
    constructor(private readonly evaluationService: EvaluationService) { }

    @Post()
    @Require('evaluations:create')
    @ApiOperation({ summary: 'Create an evaluation' })
    async create(
        @Body() dto: CreateEvaluationDto,
        @CompanyId() companyId: string,
        @UserId() _userId: string,
    ) {
        return this.evaluationService.create(dto, companyId);
    }

    @Get('application/:applicationId')
    @Require('evaluations:read')
    @ApiOperation({ summary: 'List evaluations for an application' })
    async findByApplication(
        @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
        @CompanyId() companyId: string,
    ) {
        return this.evaluationService.findByApplication(applicationId, companyId);
    }

    @Get(':id')
    @Require('evaluations:read')
    @ApiOperation({ summary: 'Get a single evaluation' })
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CompanyId() companyId: string,
    ) {
        return this.evaluationService.findOne(id, companyId);
    }

    @Put(':id')
    @Require('evaluations:update')
    @ApiOperation({ summary: 'Update an evaluation' })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateEvaluationDto,
        @CompanyId() companyId: string,
    ) {
        return this.evaluationService.update(id, dto, companyId);
    }

    @Delete(':id')
    @Require('evaluations:delete')
    @ApiOperation({ summary: 'Delete an evaluation' })
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CompanyId() companyId: string,
    ) {
        return this.evaluationService.remove(id, companyId);
    }

    @Get('application/:applicationId/average-rating')
    @Require('evaluations:read')
    @ApiOperation({ summary: 'Get application average rating' })
    async getAverage(
        @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
        @CompanyId() companyId: string,
    ) {
        const avg = await this.evaluationService.getApplicationAverageRating(applicationId, companyId);
        return { application_id: applicationId, average_rating: avg };
    }
}
