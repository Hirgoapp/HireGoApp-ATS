import { IsEnum, IsObject, IsOptional, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SsoProvider } from '../entities/sso-configuration.entity';

class SamlConfigDto {
    @IsString()
    entryPoint: string;

    @IsString()
    issuer: string;

    @IsString()
    cert: string;

    @IsString()
    callbackUrl: string;

    @IsOptional()
    @IsString()
    identifierFormat?: string;

    @IsOptional()
    @IsString()
    signatureAlgorithm?: string;

    @IsOptional()
    @IsString()
    digestAlgorithm?: string;
}

class OAuthConfigDto {
    @IsString()
    clientId: string;

    @IsString()
    clientSecret: string;

    @IsString()
    callbackUrl: string;

    @IsOptional()
    scope?: string[];

    @IsOptional()
    @IsString()
    authorizationUrl?: string;

    @IsOptional()
    @IsString()
    tokenUrl?: string;
}

class AttributeMappingDto {
    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    groups?: string;
}

class RoleMappingDto {
    @IsString()
    sourceAttribute: string;

    @IsObject()
    mappings: { [key: string]: string };

    @IsOptional()
    @IsString()
    defaultRole?: string;
}

export class CreateSsoConfigDto {
    @IsEnum(SsoProvider)
    provider: SsoProvider;

    @IsObject()
    configuration: SamlConfigDto | OAuthConfigDto | any;

    @IsOptional()
    @ValidateNested()
    @Type(() => AttributeMappingDto)
    attribute_mapping?: AttributeMappingDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => RoleMappingDto)
    role_mapping?: RoleMappingDto;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsBoolean()
    enable_jit_provisioning?: boolean;

    @IsOptional()
    @IsString()
    domain?: string;

    @IsOptional()
    @IsString()
    metadata_xml?: string;
}

export class UpdateSsoConfigDto {
    @IsOptional()
    @IsObject()
    configuration?: SamlConfigDto | OAuthConfigDto | any;

    @IsOptional()
    @ValidateNested()
    @Type(() => AttributeMappingDto)
    attribute_mapping?: AttributeMappingDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => RoleMappingDto)
    role_mapping?: RoleMappingDto;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsBoolean()
    enable_jit_provisioning?: boolean;

    @IsOptional()
    @IsString()
    domain?: string;

    @IsOptional()
    @IsString()
    metadata_xml?: string;
}
