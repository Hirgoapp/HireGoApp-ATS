import { IsUUID, IsOptional, IsString, IsDateString } from 'class-validator';

export class GrantPermissionDto {
    @IsUUID('4')
    targetUserId: string;

    @IsUUID('4')
    permissionId: string;

    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}
