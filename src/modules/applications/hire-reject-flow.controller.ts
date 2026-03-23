import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HireRejectFlowService } from './hire-reject-flow.service';
import { HireApplicationDto, RejectApplicationDto, WithdrawApplicationDto, HireFlowResponseDto, RejectFlowResponseDto } from './dto/hire-reject-flow.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { CompanyId, UserId } from '../../common/decorators/company-id.decorator';

@ApiTags('Hire & Rejection Flow')
@ApiBearerAuth()
@Controller('api/v1/applications')
@UseGuards(JwtAuthGuard, RoleGuard)
export class HireRejectFlowController {
    constructor(private readonly hireRejectFlowService: HireRejectFlowService) { }

    @Post(':id/hire')
    @Require('applications:update')
    @ApiOperation({ summary: 'Hire a candidate' })
    @ApiResponse({ status: 200, description: 'Candidate hired successfully', type: HireFlowResponseDto })
    async hireApplication(
        @Param('id', new ParseUUIDPipe()) applicationId: string,
        @Body() hireDto: HireApplicationDto,
        @CompanyId() companyId: string,
        @UserId() userId: string,
    ) {
        return this.hireRejectFlowService.hireApplication(applicationId, companyId, userId, hireDto);
    }

    @Post(':id/reject')
    @Require('applications:update')
    @ApiOperation({ summary: 'Reject a candidate' })
    @ApiResponse({ status: 200, description: 'Candidate rejected successfully', type: RejectFlowResponseDto })
    async rejectApplication(
        @Param('id', new ParseUUIDPipe()) applicationId: string,
        @Body() rejectDto: RejectApplicationDto,
        @CompanyId() companyId: string,
        @UserId() userId: string,
    ) {
        return this.hireRejectFlowService.rejectApplication(applicationId, companyId, userId, rejectDto);
    }

    @Post(':id/withdraw')
    @Require('applications:update')
    @ApiOperation({ summary: 'Withdraw an application (candidate declines)' })
    @ApiResponse({ status: 200, description: 'Application withdrawn successfully' })
    async withdrawApplication(
        @Param('id', new ParseUUIDPipe()) applicationId: string,
        @Body() withdrawDto: WithdrawApplicationDto,
        @CompanyId() companyId: string,
        @UserId() userId: string,
    ) {
        return this.hireRejectFlowService.withdrawApplication(applicationId, companyId, userId, withdrawDto);
    }

    @Get(':id/rejection-reason')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get rejection reason for an application' })
    @ApiResponse({ status: 200, description: 'Rejection reason details' })
    async getRejectionReason(
        @Param('id', new ParseUUIDPipe()) applicationId: string,
        @CompanyId() companyId: string,
    ) {
        return this.hireRejectFlowService.getRejectionReason(applicationId, companyId);
    }

    @Get('rejection-statistics/summary')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get rejection statistics' })
    @ApiResponse({ status: 200, description: 'Rejection statistics by reason' })
    async getRejectionStatistics(@CompanyId() companyId: string) {
        return this.hireRejectFlowService.getRejectionStatistics(companyId);
    }
}
