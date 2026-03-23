import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationWorkflowService } from './application-workflow.service';
import { MoveApplicationToStageDto } from './dto/move-application-dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { Require } from '../../rbac/decorators/require.decorator';
import { RoleGuard } from '../../rbac/guards/role.guard';
import { CompanyId, UserId } from '../../common/decorators/company-id.decorator';
import { ApplicationTransition } from './entities/application-transition.entity';

@ApiTags('Application Workflow')
@ApiBearerAuth()
@Controller('api/v1/applications')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ApplicationWorkflowController {
    constructor(private readonly workflowService: ApplicationWorkflowService) { }

    @Post(':id/move-stage')
    @Require('applications:update')
    @ApiOperation({ summary: 'Move application to different stage' })
    @ApiResponse({ status: 200, description: 'Application moved to new stage' })
    async moveToStage(
        @Param('id') id: string,
        @Body() moveDto: MoveApplicationToStageDto,
        @CompanyId() companyId: string,
        @UserId() userId: string,
    ) {
        return this.workflowService.moveToStage(id, moveDto, companyId, userId);
    }

    @Get(':id/transitions')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get application transition history' })
    @ApiResponse({
        status: 200,
        description: 'Application transitions',
        type: [ApplicationTransition],
    })
    async getTransitionHistory(
        @Param('id') id: string,
        @CompanyId() companyId: string,
    ) {
        return this.workflowService.getTransitionHistory(id, companyId);
    }

    @Get(':id/transitions/latest')
    @Require('applications:read')
    @ApiOperation({ summary: 'Get latest application transitions' })
    @ApiResponse({ status: 200, description: 'Latest transitions' })
    async getLatestTransitions(
        @Param('id') id: string,
        @CompanyId() companyId: string,
    ) {
        return this.workflowService.getLatestTransitions(id, companyId, 10);
    }
}
