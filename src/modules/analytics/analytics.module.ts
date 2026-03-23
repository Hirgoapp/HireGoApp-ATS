import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Application } from '../applications/entities/application.entity';
import { ApplicationTransition } from '../applications/entities/application-transition.entity';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import { CacheService } from '../../common/services/cache.service';

@Module({
    imports: [TypeOrmModule.forFeature([Application, ApplicationTransition, PipelineStage])],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, CacheService],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
