import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AsyncJobsService } from './async-jobs.service';
import { AsyncJobsController } from './async-jobs.controller';
import { BulkImportProcessor } from './processors/bulk-import.processor';
import { ReportsProcessor } from './processors/reports.processor';
import { EmailsProcessor } from './processors/emails.processor';
import { JobsGateway } from './jobs.gateway';

function bullRedisOptions(config: ConfigService) {
    const tlsEnabled = ['true', '1', 'yes'].includes(
        String(config.get<string>('REDIS_TLS', '')).toLowerCase(),
    );
    const password = config.get<string>('REDIS_PASSWORD');
    const redis: Record<string, unknown> = {
        host: config.get<string>('REDIS_HOST', '127.0.0.1'),
        port: config.get<number>('REDIS_PORT', 6379),
    };
    if (password) redis.password = password;
    if (tlsEnabled) redis.tls = {};
    return redis;
}

@Module({
    imports: [
        ConfigModule,
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                redis: bullRedisOptions(config),
            }),
        }),
        BullModule.registerQueue(
            { name: 'bulk-import' },
            { name: 'reports' },
            { name: 'emails' },
        ),
    ],
    controllers: [AsyncJobsController],
    providers: [AsyncJobsService, BulkImportProcessor, ReportsProcessor, EmailsProcessor, JobsGateway],
    exports: [AsyncJobsService],
})
export class AsyncJobsModule { }
