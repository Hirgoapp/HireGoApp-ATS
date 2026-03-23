import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionService } from './services/submission.service';
import { SubmissionStatusService } from './services/submission-status.service';
import { SubmissionController } from './submission.controller';
import { SubmissionRepository } from './repositories/submission.repository';
import { Submission } from './entities/submission.entity';
import { SubmissionStatusHistory } from './entities/submission-status-history.entity';
import { Job } from '../jobs/entities/job.entity';
import { Candidate } from '../../candidate/entities/candidate.entity';
import { ActivityModule } from '../../activity/activity.module';
import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Submission,
            SubmissionStatusHistory,
            Job,
            Candidate,
        ]),
        ActivityModule,
        CommonModule,
        AuthModule,
    ],
    controllers: [SubmissionController],
    providers: [
        SubmissionService,
        SubmissionStatusService,
        SubmissionRepository,
    ],
    exports: [
        SubmissionService,
        SubmissionStatusService,
        SubmissionRepository,
        TypeOrmModule,
    ],
})
export class SubmissionModule { }
