import { IsUUID, IsOptional, IsString } from 'class-validator';

export class RevokePermissionDto {
    @IsUUID('4')
    targetUserId: string;

    @IsUUID('4')
    permissionId: string;

    @IsOptional()
    @IsString()
    reason?: string;
}
