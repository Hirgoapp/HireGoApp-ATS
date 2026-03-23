import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

type EncPayload = {
    alg: 'aes-256-gcm';
    iv: string; // base64
    tag: string; // base64
    data: string; // base64
};

@Injectable()
export class IntegrationCryptoService {
    private readonly key: Buffer | null;

    constructor() {
        // 32 bytes key. Accept base64 or hex to reduce foot-guns.
        const raw = process.env.INTEGRATIONS_ENCRYPTION_KEY;
        if (!raw) {
            this.key = null;
            return;
        }
        const trimmed = raw.trim();
        try {
            if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
                this.key = Buffer.from(trimmed, 'hex');
            } else {
                this.key = Buffer.from(trimmed, 'base64');
            }
            if (this.key.length !== 32) {
                this.key = null;
            }
        } catch {
            this.key = null;
        }
    }

    isEnabled(): boolean {
        return !!this.key;
    }

    encrypt(plainText: string): EncPayload {
        if (!this.key) {
            throw new Error('INTEGRATIONS_ENCRYPTION_KEY not configured');
        }
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
        const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return {
            alg: 'aes-256-gcm',
            iv: iv.toString('base64'),
            tag: tag.toString('base64'),
            data: encrypted.toString('base64'),
        };
    }

    decrypt(payload: EncPayload): string {
        if (!this.key) {
            throw new Error('INTEGRATIONS_ENCRYPTION_KEY not configured');
        }
        const iv = Buffer.from(payload.iv, 'base64');
        const tag = Buffer.from(payload.tag, 'base64');
        const data = Buffer.from(payload.data, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
        return decrypted.toString('utf8');
    }
}

