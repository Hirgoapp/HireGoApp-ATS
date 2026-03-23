import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementSubmission } from './entities/requirement-submission.entity';
import { RequirementSubmissionRepository } from './repositories/submission.repository';
import { RequirementSubmissionService } from './services/submission.service';
import { RequirementSubmissionController } from './controllers/submission.controller';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([RequirementSubmission]),
        CustomFieldsModule,
        RbacModule,
    ],
    providers: [RequirementSubmissionRepository, RequirementSubmissionService],
    controllers: [RequirementSubmissionController],
    exports: [RequirementSubmissionService],
})
export class SubmissionModule { }
