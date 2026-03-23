import { IsString } from 'class-validator';

export class UpdateInterviewStatusDto {
    @IsString()
    status: string;

    @IsString()
    feedback: string;

    @IsString()
    notes: string;
}

