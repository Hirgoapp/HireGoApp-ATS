import { PartialType } from '@nestjs/swagger';
import { CreatePipelineDto, CreatePipelineStageDto } from './create-pipeline.dto';

export class UpdatePipelineDto extends PartialType(CreatePipelineDto) { }
export class UpdatePipelineStageDto extends PartialType(CreatePipelineStageDto) { }
