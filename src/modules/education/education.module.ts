import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EducationLevel } from './entities/education-level.entity';
import { ExperienceType } from './entities/experience-type.entity';
import { Qualification } from './entities/qualification.entity';
import { EducationLevelService } from './education-level.service';
import { ExperienceTypeService } from './experience-type.service';
import { QualificationService } from './qualification.service';
import { EducationLevelController } from './education-level.controller';
import { ExperienceTypeController } from './experience-type.controller';
import { QualificationController } from './qualification.controller';

@Module({
    imports: [TypeOrmModule.forFeature([EducationLevel, ExperienceType, Qualification])],
    controllers: [EducationLevelController, ExperienceTypeController, QualificationController],
    providers: [EducationLevelService, ExperienceTypeService, QualificationService],
    exports: [EducationLevelService, ExperienceTypeService, QualificationService],
})
export class EducationModule { }
