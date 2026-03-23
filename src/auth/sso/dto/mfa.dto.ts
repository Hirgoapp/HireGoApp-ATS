import { IsString, Length } from 'class-validator';

export class VerifyMfaTokenDto {
    @IsString()
    @Length(6, 6)
    token: string;
}

export class SetupMfaResponseDto {
    secret: string;
    qrCode: string;
    backupCodes: string[];
}

export class MfaStatusDto {
    enabled: boolean;
    backupCodesRemaining: number;
}
