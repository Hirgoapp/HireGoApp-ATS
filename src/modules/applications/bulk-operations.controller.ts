import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BulkOperationsService } from './bulk-operations.service';
import { BulkMoveToStageDto, BulkRejectApplicationsDto, BulkHireApplicationsDto, BulkOperationResultDto } from './dto/bulk-operations.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { CompanyId, UserId } from '../../common/decorators/company-id.decorator';

@ApiTags('Bulk Operations')
@ApiBearerAuth()
@Controller('api/v1/applications/bulk')
@UseGuards(JwtAuthGuard, RoleGuard)
export class BulkOperationsController {
    constructor(private readonly bulkService: BulkOperationsService) { }

    @Post('move-stage')
    @Require('applications:update')
    @ApiOperation({ summary: 'Bulk move applications to stage' })
    @ApiResponse({ status: 200, description: 'Bulk move result', type: BulkOperationResultDto })
    async bulkMoveToStage(
        @Body() bulkDto: BulkMoveToStageDto,
        @CompanyId() companyId: string,
        @UserId() userId: string,
    ) {
        return this.bulkService.bulkMoveToStage(bulkDto, companyId, userId);
    }

    @Post('reject')
    @Require('applications:update')
    @ApiOperation({ summary: 'Bulk reject applications' })
    @ApiResponse({ status: 200, description: 'Bulk reject result', type: BulkOperationResultDto })
    async bulkReject(
        @Body() bulkDto: BulkRejectApplicationsDto,
        @CompanyId() companyId: string,
        @UserId() userId: string,
    ) {
        return this.bulkService.bulkReject(bulkDto, companyId, userId);
    }

    @Post('hire')
    @Require('applications:update')
    @ApiOperation({ summary: 'Bulk hire applications' })
    @ApiResponse({ status: 200, description: 'Bulk hire result', type: BulkOperationResultDto })
    async bulkHire(
        @Body() bulkDto: BulkHireApplicationsDto,
        @CompanyId() companyId: string,
        @UserId() userId: string,
    ) {
        return this.bulkService.bulkHire(bulkDto, companyId, userId);
    }

    @Post('archive')
    @Require('applications:update')
    @ApiOperation({ summary: 'Bulk archive applications' })
    @ApiResponse({ status: 200, description: 'Bulk archive result', type: BulkOperationResultDto })
    async bulkArchive(
        @Body() body: { application_ids: string[] },
        @CompanyId() companyId: string,
    ) {
        return this.bulkService.bulkArchive(body.application_ids, companyId);
    }

    @Get('statistics')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get bulk operation statistics' })
    @ApiResponse({ status: 200, description: 'Statistics by status and pipeline' })
    async getStatistics(@CompanyId() companyId: string) {
        return this.bulkService.getStatistics(companyId);
    }
}
