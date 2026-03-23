import { IsUUID, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateInterviewDto {
    @IsUUID()
    submission_id: string;

    @IsString()
    interview_round: string;

    @IsString()
    @IsOptional()
    interview_type?: string;

    @IsString()
    @IsOptional()
    interview_mode?: string;

    @IsDateString()
    scheduled_at: string;

    @IsString()
    @IsOptional()
    interviewer_name?: string;

    @IsString()
    @IsOptional()
    interviewer_email?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

