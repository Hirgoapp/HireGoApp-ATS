import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';

/**
 * ClamAV virus scanner integration.
 * Connects to ClamAV daemon via TCP socket for on-demand scanning.
 * 
 * Optional dependency: Set CLAMD_HOST and CLAMD_PORT env vars.
 * If not configured, scanning is silently skipped.
 */
@Injectable()
export class VirusScannerService {
    private readonly logger = new Logger(VirusScannerService.name);
    private readonly clamdHost: string | null;
    private readonly clamdPort: number | null;
    private readonly enabled: boolean;

    constructor() {
        this.clamdHost = process.env.CLAMD_HOST || null;
        this.clamdPort = this.clamdHost ? parseInt(process.env.CLAMD_PORT || '3310', 10) : null;
        this.enabled = !!this.clamdHost;

        if (this.enabled) {
            this.logger.log(`ClamAV integration enabled: ${this.clamdHost}:${this.clamdPort}`);
        } else {
            this.logger.log('ClamAV integration disabled (CLAMD_HOST not set)');
        }
    }

    async scanBuffer(buffer: Buffer, filename: string): Promise<{ safe: boolean; threat?: string }> {
        if (!this.enabled) {
            return { safe: true };
        }

        try {
            const result = await this.pingAndScan(buffer);
            if (result.infected) {
                this.logger.warn(`⚠️  MALWARE DETECTED in ${filename}: ${result.threat}`);
                return { safe: false, threat: result.threat };
            }
            return { safe: true };
        } catch (error) {
            this.logger.error(`ClamAV scan error for ${filename}:`, error.message);
            // Fail open: allow upload if ClamAV is unreachable
            // In production, you may want to fail closed (reject upload)
            return { safe: true };
        }
    }

    private pingAndScan(buffer: Buffer): Promise<{ infected: boolean; threat?: string }> {
        return new Promise((resolve, reject) => {
            const socket = net.createConnection(this.clamdPort!, this.clamdHost!);
            let response = '';

            socket.setTimeout(10000, () => {
                socket.destroy();
                reject(new Error('ClamAV connection timeout'));
            });

            socket.on('connect', () => {
                // Send INSTREAM command to start streaming scan
                socket.write('INSTREAM\r\n');
            });

            socket.on('data', (data) => {
                response += data.toString();
            });

            socket.on('end', () => {
                if (response.includes('FOUND')) {
                    const match = response.match(/FOUND\s+(.+?)$/m);
                    const threat = match ? match[1].trim() : 'Unknown';
                    resolve({ infected: true, threat });
                } else if (response.includes('OK')) {
                    resolve({ infected: false });
                } else {
                    reject(new Error(`Unexpected ClamAV response: ${response}`));
                }
            });

            socket.on('error', (error) => {
                reject(error);
            });

            // Send file size (INSTREAM protocol)
            const sizeBuffer = Buffer.alloc(4);
            sizeBuffer.writeUInt32BE(buffer.length, 0);
            socket.write(sizeBuffer);
            socket.write(buffer);

            // Send end-of-stream marker
            const endMarker = Buffer.alloc(4);
            endMarker.writeUInt32BE(0, 0);
            socket.write(endMarker);
            socket.write('\r\n');
        });
    }
}
