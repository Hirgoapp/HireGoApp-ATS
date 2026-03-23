import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillCategory } from './entities/skill-category.entity';
import { Skill } from './entities/skill.entity';
import { SkillCategoryService } from './skill-category.service';
import { SkillService } from './skill.service';
import { SkillCategoryController } from './skill-category.controller';
import { SkillController } from './skill.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SkillCategory, Skill])],
    controllers: [SkillCategoryController, SkillController],
    providers: [SkillCategoryService, SkillService],
    exports: [SkillCategoryService, SkillService],
})
export class SkillsModule { }
