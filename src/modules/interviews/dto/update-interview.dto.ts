import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateInterviewDto {
    @IsString()
    @IsOptional()
    interview_round?: string;

    @IsString()
    @IsOptional()
    interview_type?: string;

    @IsString()
    @IsOptional()
    interview_mode?: string;

    @IsDateString()
    @IsOptional()
    scheduled_at?: string;

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

