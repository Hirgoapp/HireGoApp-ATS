import { IsEnum, IsString, IsOptional } from 'class-validator';

export enum LicenseTier {
    BASIC = 'basic',
    PREMIUM = 'premium',
    ENTERPRISE = 'enterprise',
}

export class UpdateLicenseDto {
    @IsEnum(LicenseTier)
    tier: LicenseTier;

    @IsOptional()
    @IsString()
    billing_cycle?: 'monthly' | 'annual' | 'custom';
}
