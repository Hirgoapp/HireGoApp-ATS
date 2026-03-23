import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    UseGuards,
    Req,
    HttpStatus,
} from '@nestjs/common';
import { MfaService } from '../services/mfa.service';
import { VerifyMfaTokenDto, SetupMfaResponseDto, MfaStatusDto } from '../dto/mfa.dto';
import { PermissionGuard } from '../../guards/permission.guard';

@Controller('auth/mfa')
@UseGuards(PermissionGuard)
export class MfaController {
    constructor(private mfaService: MfaService) { }

    /**
     * Setup MFA - returns secret and QR code
     */
    @Post('setup')
    async setupMfa(@Req() req: any): Promise<SetupMfaResponseDto> {
        const userId = req.user.sub;
        const result = await this.mfaService.setupMfa(userId);

        return {
            secret: result.secret,
            qrCode: result.qrCode,
            backupCodes: result.backupCodes,
        };
    }

    /**
     * Verify and enable MFA
     */
    @Post('verify')
    async verifyMfa(
        @Body() dto: VerifyMfaTokenDto,
        @Req() req: any,
    ) {
        const userId = req.user.sub;
        const result = await this.mfaService.verifyAndEnableMfa(userId, dto.token);

        return {
            message: 'MFA enabled successfully',
            success: result.success,
        };
    }

    /**
     * Get MFA status
     */
    @Get('status')
    async getMfaStatus(@Req() req: any): Promise<MfaStatusDto> {
        const userId = req.user.sub;
        return this.mfaService.getMfaStatus(userId);
    }

    /**
     * Disable MFA
     */
    @Delete()
    async disableMfa(@Req() req: any) {
        const userId = req.user.sub;
        await this.mfaService.disableMfa(userId);

        return {
            message: 'MFA disabled successfully',
        };
    }

    /**
     * Regenerate backup codes
     */
    @Post('backup-codes/regenerate')
    async regenerateBackupCodes(@Req() req: any) {
        const userId = req.user.sub;
        const backupCodes = await this.mfaService.regenerateBackupCodes(userId);

        return {
            message: 'Backup codes regenerated',
            backupCodes,
        };
    }
}
