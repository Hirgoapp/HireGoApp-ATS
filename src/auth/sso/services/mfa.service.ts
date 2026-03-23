import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { MfaSecret } from '../entities/mfa-secret.entity';
import { User } from '../../entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MfaService {
    private readonly logger = new Logger(MfaService.name);
    private readonly encryptionKey: string;

    constructor(
        @InjectRepository(MfaSecret)
        private mfaSecretRepo: Repository<MfaSecret>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private configService: ConfigService,
    ) {
        // Get encryption key from env or generate one (store securely in production)
        this.encryptionKey = this.configService.get<string>('MFA_ENCRYPTION_KEY') ||
            crypto.randomBytes(32).toString('hex');
    }

    /**
     * Setup MFA for user - generate secret and QR code
     */
    async setupMfa(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
        const user = await this.userRepo.findOne({ where: { id: userId } as any });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Check if MFA already exists
        let mfaSecret = await this.mfaSecretRepo.findOne({ where: { user_id: userId } });

        if (mfaSecret && mfaSecret.is_enabled) {
            throw new BadRequestException('MFA is already enabled for this user');
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `hiregoapp (${user.email})`,
            issuer: 'hiregoapp',
        });

        // Generate backup codes
        const backupCodes = this.generateBackupCodes(10);

        // Encrypt secret and backup codes
        const encryptedSecret = this.encrypt(secret.base32);
        const encryptedBackupCodes = backupCodes.map(code => this.encrypt(code));

        if (!mfaSecret) {
            // Create new MFA secret
            mfaSecret = this.mfaSecretRepo.create({
                user_id: userId,
                secret: encryptedSecret,
                is_enabled: false,
                is_verified: false,
                backup_codes: encryptedBackupCodes,
                used_backup_codes_count: 0,
            });
        } else {
            // Update existing
            mfaSecret.secret = encryptedSecret;
            mfaSecret.backup_codes = encryptedBackupCodes;
            mfaSecret.is_verified = false;
            mfaSecret.used_backup_codes_count = 0;
        }

        await this.mfaSecretRepo.save(mfaSecret);

        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        this.logger.log(`MFA setup initiated for user ${user.email}`);

        return {
            secret: secret.base32,
            qrCode,
            backupCodes, // Return plaintext to user (one-time only!)
        };
    }

    /**
     * Verify and enable MFA
     */
    async verifyAndEnableMfa(userId: string, token: string): Promise<{ success: boolean }> {
        const mfaSecret = await this.mfaSecretRepo.findOne({ where: { user_id: userId } });
        if (!mfaSecret) {
            throw new BadRequestException('MFA not setup');
        }

        if (mfaSecret.is_enabled && mfaSecret.is_verified) {
            throw new BadRequestException('MFA is already enabled');
        }

        // Decrypt secret
        const secret = this.decrypt(mfaSecret.secret);

        // Verify token
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2, // Allow 2 time steps before/after
        });

        if (!verified) {
            throw new UnauthorizedException('Invalid MFA token');
        }

        // Enable MFA
        mfaSecret.is_enabled = true;
        mfaSecret.is_verified = true;
        mfaSecret.verified_at = new Date();
        await this.mfaSecretRepo.save(mfaSecret);

        this.logger.log(`MFA enabled for user ${userId}`);

        return { success: true };
    }

    /**
     * Verify MFA token during login
     */
    async verifyMfaToken(userId: string, token: string): Promise<boolean> {
        const mfaSecret = await this.mfaSecretRepo.findOne({
            where: { user_id: userId, is_enabled: true }
        });

        if (!mfaSecret) {
            return false;
        }

        // Try TOTP first
        const secret = this.decrypt(mfaSecret.secret);
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2,
        });

        if (verified) {
            mfaSecret.last_used_at = new Date();
            await this.mfaSecretRepo.save(mfaSecret);
            return true;
        }

        // Try backup codes
        const backupCodeValid = await this.verifyBackupCode(userId, token);
        if (backupCodeValid) {
            mfaSecret.last_used_at = new Date();
            await this.mfaSecretRepo.save(mfaSecret);
            return true;
        }

        return false;
    }

    /**
     * Verify backup code
     */
    private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
        const mfaSecret = await this.mfaSecretRepo.findOne({
            where: { user_id: userId, is_enabled: true }
        });

        if (!mfaSecret || !mfaSecret.backup_codes) {
            return false;
        }

        // Check if code matches any backup code
        for (const encryptedCode of mfaSecret.backup_codes) {
            const decryptedCode = this.decrypt(encryptedCode);
            if (decryptedCode === code) {
                // Remove used backup code
                mfaSecret.backup_codes = mfaSecret.backup_codes.filter(
                    bc => bc !== encryptedCode
                );
                mfaSecret.used_backup_codes_count += 1;
                await this.mfaSecretRepo.save(mfaSecret);

                this.logger.log(`Backup code used for user ${userId}. Remaining: ${mfaSecret.backup_codes.length}`);
                return true;
            }
        }

        return false;
    }

    /**
     * Disable MFA
     */
    async disableMfa(userId: string): Promise<void> {
        const mfaSecret = await this.mfaSecretRepo.findOne({ where: { user_id: userId } });
        if (!mfaSecret) {
            throw new BadRequestException('MFA not setup');
        }

        mfaSecret.is_enabled = false;
        mfaSecret.is_verified = false;
        await this.mfaSecretRepo.save(mfaSecret);

        this.logger.log(`MFA disabled for user ${userId}`);
    }

    /**
     * Get MFA status
     */
    async getMfaStatus(userId: string): Promise<{ enabled: boolean; backupCodesRemaining: number }> {
        const mfaSecret = await this.mfaSecretRepo.findOne({ where: { user_id: userId } });

        if (!mfaSecret) {
            return { enabled: false, backupCodesRemaining: 0 };
        }

        return {
            enabled: mfaSecret.is_enabled,
            backupCodesRemaining: mfaSecret.backup_codes?.length || 0,
        };
    }

    /**
     * Regenerate backup codes
     */
    async regenerateBackupCodes(userId: string): Promise<string[]> {
        const mfaSecret = await this.mfaSecretRepo.findOne({ where: { user_id: userId } });
        if (!mfaSecret || !mfaSecret.is_enabled) {
            throw new BadRequestException('MFA not enabled');
        }

        const backupCodes = this.generateBackupCodes(10);
        const encryptedBackupCodes = backupCodes.map(code => this.encrypt(code));

        mfaSecret.backup_codes = encryptedBackupCodes;
        mfaSecret.used_backup_codes_count = 0;
        await this.mfaSecretRepo.save(mfaSecret);

        this.logger.log(`Backup codes regenerated for user ${userId}`);

        return backupCodes;
    }

    /**
     * Generate random backup codes
     */
    private generateBackupCodes(count: number): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric code
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        return codes;
    }

    /**
     * Encrypt data using AES-256
     */
    private encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const key = Buffer.from(this.encryptionKey.substring(0, 32), 'utf-8');
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt data using AES-256
     */
    private decrypt(text: string): string {
        const parts = text.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const key = Buffer.from(this.encryptionKey.substring(0, 32), 'utf-8');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
