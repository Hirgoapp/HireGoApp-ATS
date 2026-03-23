import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interview } from './entities/interview.entity';
import { InterviewStatusHistory } from './entities/interview-status-history.entity';
import { InterviewFeedback } from './entities/interview-feedback.entity';
import { InterviewInterviewer } from './entities/interview-interviewer.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { InterviewService } from './services/interview.service';
import { InterviewStatusService } from './services/interview-status.service';
import { InterviewAssignmentService } from './services/interview-assignment.service';
import { InterviewRepository } from './repositories/interview.repository';
import { InterviewFeedbackRepository } from './repositories/interview-feedback.repository';
import { InterviewStatusHistoryRepository } from './repositories/interview-status-history.repository';
import { InterviewController } from './interview.controller';
import { AuthModule } from '../../auth/auth.module';
import { CommonModule } from '../../common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Interview,
            InterviewStatusHistory,
            InterviewFeedback,
            InterviewInterviewer,
            Submission,
        ]),
        CommonModule,
        AuthModule,
    ],
    providers: [
        InterviewService,
        InterviewStatusService,
        InterviewAssignmentService,
        InterviewRepository,
        InterviewFeedbackRepository,
        InterviewStatusHistoryRepository,
    ],
    controllers: [InterviewController],
    exports: [InterviewService, InterviewStatusService, InterviewAssignmentService],
})
export class InterviewsModule { }
