import { IsString, IsUUID, IsArray, IsOptional, MinLength } from 'class-validator';

export class CreateRoleDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    permissionIds?: string[];

    @IsOptional()
    @IsString()
    reason?: string;
}
