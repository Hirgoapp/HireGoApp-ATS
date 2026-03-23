import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interview } from './entities/interview.entity';
import { InterviewRepository } from './repositories/interview.repository';
import { InterviewService } from './services/interview.service';
import { InterviewController } from './controllers/interview.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Interview])],
    providers: [InterviewRepository, InterviewService],
    controllers: [InterviewController],
    exports: [InterviewService],
})
export class InterviewModule { }
