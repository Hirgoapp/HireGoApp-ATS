import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([WebhookSubscription, WebhookLog]),
        MetricsModule,
    ],
    controllers: [WebhookController],
    providers: [WebhookService],
    exports: [WebhookService],
})
export class WebhooksModule { }
