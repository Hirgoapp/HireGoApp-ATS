import { IsString } from 'class-validator';

export class UpdateOfferStatusDto {
    @IsString()
    status: string;

    @IsString()
    notes: string;
}

