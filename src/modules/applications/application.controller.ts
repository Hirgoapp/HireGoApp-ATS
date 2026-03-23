import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { FilterApplicationDto } from './dto/filter-application.dto';
import { ApplicationResponseDto, ApplicationListResponseDto } from './dto/application-response.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { CompanyId, UserId } from '../../common/decorators/company-id.decorator';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('api/v1/applications')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ApplicationController {
    constructor(private readonly applicationService: ApplicationService) { }

    @Post()
    @Require('applications:create')
    @ApiOperation({ summary: 'Create application from candidate' })
    @ApiResponse({ status: 201, description: 'Application created', type: ApplicationResponseDto })
    async create(
        @Body() createDto: CreateApplicationDto,
        @CompanyId() companyId: string,
        @UserId() userId: string,
    ) {
        return this.applicationService.create(createDto, companyId, userId);
    }

    @Get()
    @Require('applications:read')
    @ApiOperation({ summary: 'Get all applications with filters' })
    @ApiResponse({ status: 200, description: 'Applications list', type: ApplicationListResponseDto })
    async findAll(
        @Query() filterDto: FilterApplicationDto,
        @CompanyId() companyId: string,
    ) {
        return this.applicationService.findAll(filterDto, companyId);
    }

    @Get('candidate/:candidateId')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get all applications for a candidate' })
    @ApiResponse({ status: 200, description: 'Candidate applications', type: [ApplicationResponseDto] })
    async findByCandidate(
        @Param('candidateId', ParseIntPipe) candidateId: number,
        @CompanyId() companyId: string,
    ) {
        return this.applicationService.findByCandidate(candidateId, companyId);
    }

    @Get('job/:jobId')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get all applications for a job' })
    @ApiResponse({ status: 200, description: 'Job applications', type: [ApplicationResponseDto] })
    async findByJob(
        @Param('jobId', ParseIntPipe) jobId: number,
        @CompanyId() companyId: string,
    ) {
        return this.applicationService.findByJob(jobId, companyId);
    }

    @Get(':id')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get application by ID' })
    @ApiResponse({ status: 200, description: 'Application details', type: ApplicationResponseDto })
    async findOne(
        @Param('id') id: string,
        @CompanyId() companyId: string,
    ) {
        return this.applicationService.findOne(id, companyId);
    }

    @Put(':id')
    @Require('applications:update')
    @ApiOperation({ summary: 'Update application' })
    @ApiResponse({ status: 200, description: 'Application updated', type: ApplicationResponseDto })
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateApplicationDto,
        @CompanyId() companyId: string,
    ) {
        return this.applicationService.update(id, updateDto, companyId);
    }

    @Post(':id/archive')
    @Require('applications:update')
    @ApiOperation({ summary: 'Archive application' })
    @ApiResponse({ status: 200, description: 'Application archived' })
    async archive(
        @Param('id') id: string,
        @CompanyId() companyId: string,
    ) {
        return this.applicationService.archive(id, companyId);
    }

    @Post(':id/unarchive')
    @Require('applications:update')
    @ApiOperation({ summary: 'Unarchive application' })
    @ApiResponse({ status: 200, description: 'Application unarchived' })
    async unarchive(
        @Param('id') id: string,
        @CompanyId() companyId: string,
    ) {
        return this.applicationService.unarchive(id, companyId);
    }

    @Delete(':id')
    @Require('applications:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete application' })
    @ApiResponse({ status: 204, description: 'Application deleted' })
    async remove(
        @Param('id') id: string,
        @CompanyId() companyId: string,
    ) {
        return this.applicationService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @Require('applications:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Permanently delete application' })
    @ApiResponse({ status: 204, description: 'Application permanently deleted' })
    async hardDelete(
        @Param('id') id: string,
        @CompanyId() companyId: string,
    ) {
        return this.applicationService.hardDelete(id, companyId);
    }
}