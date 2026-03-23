import { IsArray, IsDateString, IsOptional, IsString, Length, ArrayNotEmpty } from 'class-validator';

export class CreateApiKeyDto {
    @IsString()
    @Length(1, 255)
    name: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    scopes: string[];

    @IsDateString()
    @IsOptional()
    expiresAt?: string;
}

export class UpdateApiKeyDto {
    @IsString()
    @Length(1, 255)
    @IsOptional()
    name?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    scopes?: string[];

    @IsDateString()
    @IsOptional()
    expiresAt?: string;

    @IsOptional()
    isActive?: boolean;
}

export class ApiKeyFilterDto {
    @IsOptional()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    scope?: string;
}
