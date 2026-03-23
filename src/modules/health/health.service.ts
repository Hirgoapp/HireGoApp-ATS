import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class HealthService {
    constructor(private readonly dataSource: DataSource) { }

    async dbCheck() {
        try {
            await this.dataSource.query('SELECT 1');
            return { status: 'up' };
        } catch (err: any) {
            return { status: 'down', error: err?.message || 'DB check failed' };
        }
    }

    getVersion() {
        try {
            const pkgPath = path.resolve(process.cwd(), 'package.json');
            const raw = fs.readFileSync(pkgPath, 'utf8');
            const pkg = JSON.parse(raw);
            return { version: pkg.version || 'unknown' };
        } catch {
            return { version: 'unknown' };
        }
    }

    systemInfo() {
        return {
            pid: process.pid,
            node: process.version,
            platform: process.platform,
            uptimeSec: Math.round(process.uptime()),
            memory: process.memoryUsage(),
        };
    }
}
