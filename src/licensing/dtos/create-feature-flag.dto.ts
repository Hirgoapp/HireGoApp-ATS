import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export enum FlagType {
    BOOLEAN = 'boolean',
    PERCENTAGE = 'percentage',
    USER_LIST = 'user_list',
}

export class CreateFeatureFlagDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(FlagType)
    flag_type: FlagType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    enabled_percentage?: number;
}
