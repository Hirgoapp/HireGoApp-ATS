import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
    constructor(private readonly service: HealthService) { }

    @Get('health')
    async health() {
        const db = await this.service.dbCheck();
        return {
            status: db.status === 'up' ? 'ok' : 'degraded',
            checks: { db },
            ts: new Date().toISOString(),
        };
    }

    @Get('readiness')
    async readiness() {
        const db = await this.service.dbCheck();
        return {
            ready: db.status === 'up',
            checks: { db },
            ts: new Date().toISOString(),
        };
    }

    @Get('version')
    version() {
        return this.service.getVersion();
    }
}
