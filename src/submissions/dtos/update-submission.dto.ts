import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateRequirementSubmissionDto } from './create-submission.dto';

export class UpdateRequirementSubmissionDto extends PartialType(CreateRequirementSubmissionDto) {
    @IsOptional()
    @IsString()
    stage_change_reason?: string;

    @IsOptional()
    @IsString()
    submission_status?: string;

    @IsOptional()
    @IsString()
    client_feedback?: string;
}
