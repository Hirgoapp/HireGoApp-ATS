import { PartialType } from '@nestjs/swagger';
import { CreateExperienceTypeDto } from './create-experience-type.dto';

export class UpdateExperienceTypeDto extends PartialType(CreateExperienceTypeDto) { }
