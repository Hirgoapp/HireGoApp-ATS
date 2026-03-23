import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { Candidate } from './entities/candidate.entity';
import { CandidateSkill } from './entities/candidate-skill.entity';
import { CandidateEducation } from './entities/candidate-education.entity';
import { CandidateExperience } from './entities/candidate-experience.entity';
import { CandidateDocument } from './entities/candidate-document.entity';
import { CandidateAddress } from './entities/candidate-address.entity';
import { CandidateHistory } from './entities/candidate-history.entity';
import { CandidateAttachment } from './entities/candidate-attachment.entity';
import { AsyncJobsModule } from '../modules/async-jobs/async-jobs.module';
import { StorageService } from '../common/services/storage.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Candidate,
            CandidateSkill,
            CandidateEducation,
            CandidateExperience,
            CandidateDocument,
            CandidateAddress,
            CandidateHistory,
            CandidateAttachment,
        ]),
        AsyncJobsModule,
    ],
    controllers: [CandidateController],
    providers: [CandidateService, StorageService],
    exports: [CandidateService],
})
export class CandidateModule { }
