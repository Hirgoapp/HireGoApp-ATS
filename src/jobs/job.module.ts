import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobRequirement } from './entities/job-requirement.entity';
import { JobRequirementRepository } from './repositories/job.repository';
import { JobRequirementService } from './services/job.service';
import { JobRequirementController } from './controllers/job.controller';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([JobRequirement]),
        CustomFieldsModule,
        RbacModule,
    ],
    providers: [JobRequirementRepository, JobRequirementService],
    controllers: [JobRequirementController],
    exports: [JobRequirementService],
})
export class JobModule { }
