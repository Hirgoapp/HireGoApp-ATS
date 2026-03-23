import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JdUploadController } from './controllers/jd-upload.controller';
import { JdFileService } from './services/jd-file.service';
import { EmailParserService } from './services/email-parser.service';
import { Job } from './entities/job.entity';
import { Client } from './entities/client.entity';
import { JobEmailSource } from './entities/job-email-source.entity';
import { JobInstruction } from './entities/job-instruction.entity';
import { JobCandidateTracker } from './entities/job-candidate-tracker.entity';
import { JobEmailParserService } from './services/job-email-parser.service';
import { EmailRequirementService } from './services/email-requirement.service';
import { EmailRequirementController } from './controllers/email-requirement.controller';
import { JobRequirement } from './entities/job-requirement.entity';
import { RequirementAssignment } from './entities/requirement-assignment.entity';
import { RequirementService } from './services/requirement.service';
import { RequirementController } from './controllers/requirement.controller';
import { RequirementSubmission } from '../../submissions/entities/requirement-submission.entity';
import { AIJobParserService } from './services/ai-job-parser.service';
import { GeminiJobParserService } from './services/gemini-job-parser.service';
import { HybridAIParserService } from './services/hybrid-ai-parser.service';
import { ActivityModule } from '../../activity/activity.module';
import { FeaturesModule } from '../../features/features.module';
import { AuthModule } from '../../auth/auth.module';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Job,
            Client,
            JobEmailSource,
            JobInstruction,
            JobCandidateTracker,
            JobRequirement,
            RequirementAssignment,
            RequirementSubmission,
        ]),
        ActivityModule,
        FeaturesModule,
        AuthModule,
        MulterModule.register({
            storage: diskStorage({
                destination: './uploads/jd-files',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `jd-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
        }),
    ],
    controllers: [JobController, JdUploadController, EmailRequirementController, RequirementController],
    providers: [
        JobService,
        JdFileService,
        EmailParserService,
        JobEmailParserService,
        EmailRequirementService,
        AIJobParserService,
        GeminiJobParserService,
        HybridAIParserService,
        RequirementService,
    ],
    exports: [
        JobService,
        EmailParserService,
        JobEmailParserService,
        EmailRequirementService,
        AIJobParserService,
        GeminiJobParserService,
        HybridAIParserService,
        TypeOrmModule
    ],
})
export class JobModule { }
