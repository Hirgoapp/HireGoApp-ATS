import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { ApplicationWorkflowService } from './application-workflow.service';
import { ApplicationWorkflowController } from './application-workflow.controller';
import { BulkOperationsService } from './bulk-operations.service';
import { BulkOperationsController } from './bulk-operations.controller';
import { HireRejectFlowService } from './hire-reject-flow.service';
import { HireRejectFlowController } from './hire-reject-flow.controller';
import { ApplicationAnalyticsService } from './application-analytics.service';
import { ApplicationAnalyticsController } from './application-analytics.controller';
import { ApplicationSearchController } from './application-search.controller';
import { Application } from './entities/application.entity';
import { ApplicationTransition } from './entities/application-transition.entity';
import { RejectionReason } from './entities/rejection-reason.entity';
import { Pipeline } from '../pipelines/entities/pipeline.entity';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import { JobRequirement } from '../jobs/entities/job-requirement.entity';
@Module({
    imports: [
        TypeOrmModule.forFeature([
            Application,
            ApplicationTransition,
            RejectionReason,
            Pipeline,
            PipelineStage,
            JobRequirement,
        ]),
    ],
    controllers: [
        ApplicationController,
        ApplicationWorkflowController,
        BulkOperationsController,
        HireRejectFlowController,
        ApplicationAnalyticsController,
        ApplicationSearchController,
    ],
    providers: [
        ApplicationService,
        ApplicationWorkflowService,
        BulkOperationsService,
        HireRejectFlowService,
        ApplicationAnalyticsService,
    ],
    exports: [
        ApplicationService,
        ApplicationWorkflowService,
        BulkOperationsService,
        HireRejectFlowService,
        ApplicationAnalyticsService,
    ],
})
export class ApplicationsModule { }
