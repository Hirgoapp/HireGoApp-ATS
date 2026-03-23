import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pipeline } from './entities/pipeline.entity';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Pipeline, PipelineStage])],
    controllers: [PipelineController],
    providers: [PipelineService],
    exports: [PipelineService],
})
export class PipelinesModule { }
