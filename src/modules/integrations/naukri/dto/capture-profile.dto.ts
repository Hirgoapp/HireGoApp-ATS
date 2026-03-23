import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CaptureProfileDto {
    @IsString()
    @IsNotEmpty()
    naukri_profile_id: string;

    @IsString()
    @IsNotEmpty()
    candidate_name: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    skills?: string;

    @IsOptional()
    @IsString()
    experience?: string;

    @IsOptional()
    @IsString()
    current_company?: string;

    @IsOptional()
    @IsString()
    designation?: string;

    @IsOptional()
    @IsString()
    location?: string;
}

