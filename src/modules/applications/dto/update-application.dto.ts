import { PartialType } from '@nestjs/swagger';
import { CreateApplicationDto } from './create-application.dto';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
    candidate_id?: number;
    job_id?: number;
    pipeline_id?: string;
    current_stage_id?: string;
}
