import { PartialType } from '@nestjs/mapped-types';
import { CreateJobRequirementDto } from './create-job.dto';

export class UpdateJobRequirementDto extends PartialType(CreateJobRequirementDto) { }
