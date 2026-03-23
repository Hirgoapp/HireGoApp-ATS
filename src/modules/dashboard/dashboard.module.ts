import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardGateway } from './dashboard.gateway';
import { CommonModule } from '../../common/common.module';

@Module({
    imports: [CommonModule],
    controllers: [DashboardController],
    providers: [DashboardService, DashboardGateway],
})
export class DashboardModule { }
