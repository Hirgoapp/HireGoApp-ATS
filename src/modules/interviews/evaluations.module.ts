import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { Application } from '../applications/entities/application.entity';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Evaluation, Application])],
    providers: [EvaluationService],
    controllers: [EvaluationController],
    exports: [EvaluationService],
})
export class EvaluationsModule { }
