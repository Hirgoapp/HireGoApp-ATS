import { IsEmail, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateSuperAdminInviteDto {
    @IsEmail()
    @MaxLength(320)
    email: string;

    /** Required when role is not `super_admin`. */
    @IsOptional()
    @IsUUID()
    companyId?: string;

    @IsString()
    @MinLength(2)
    @MaxLength(64)
    role: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(90)
    expiresInDays?: number;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    personalMessage?: string;
}
