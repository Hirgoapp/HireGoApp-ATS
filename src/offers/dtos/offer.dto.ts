import { IsOptional, IsUUID, IsEnum, IsDateString, IsNumber, Min, Max, IsString } from 'class-validator';
import { EmploymentTypeEnum } from '../entities/offer.entity';

export class CreateOfferDto {
    @IsUUID()
    submission_id: string;

    @IsEnum(EmploymentTypeEnum)
    employment_type: EmploymentTypeEnum;

    @IsDateString()
    @IsOptional()
    start_date?: string;

    @IsDateString()
    @IsOptional()
    expiry_date?: string;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    base_salary?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    bonus?: number;

    @IsString()
    @IsOptional()
    equity?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateOfferDto {
    @IsDateString()
    @IsOptional()
    start_date?: string;

    @IsDateString()
    @IsOptional()
    expiry_date?: string;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    base_salary?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    bonus?: number;

    @IsString()
    @IsOptional()
    equity?: string;

    @IsEnum(EmploymentTypeEnum)
    @IsOptional()
    employment_type?: EmploymentTypeEnum;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class IssueOfferDto {
    @IsString()
    @IsOptional()
    notes?: string;
}

export class AcceptOfferDto {
    @IsDateString()
    @IsOptional()
    accepted_at?: string;

    @IsOptional()
    metadata?: Record<string, any>;
}

export class RejectOfferDto {
    @IsString()
    @IsOptional()
    reason?: string;

    @IsOptional()
    metadata?: Record<string, any>;
}

export class WithdrawOfferDto {
    @IsString()
    reason: string;
}
