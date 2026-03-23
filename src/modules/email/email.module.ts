import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
    imports: [ConfigModule, MetricsModule],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }
