import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Candidate } from '../../candidate/entities/candidate.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { AuthModule } from '../../auth/auth.module';
import { FeaturesModule } from '../../features/features.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Job, Candidate, Submission]),
        AuthModule,
        FeaturesModule,
    ],
    controllers: [MatchingController],
    providers: [MatchingService],
    exports: [MatchingService],
})
export class MatchingModule {}
