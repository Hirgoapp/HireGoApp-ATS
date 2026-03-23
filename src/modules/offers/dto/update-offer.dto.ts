import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class UpdateOfferDto {
    @IsString()
    @IsOptional()
    offer_number?: string;

    @IsNumber()
    @IsOptional()
    offered_ctc?: number;

    @IsString()
    @IsOptional()
    currency_code?: string;

    @IsDateString()
    @IsOptional()
    offer_date?: string;

    @IsDateString()
    @IsOptional()
    joining_date?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

