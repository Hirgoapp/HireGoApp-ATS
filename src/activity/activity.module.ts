import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityRepository } from './repositories/activity.repository';
import { ActivityService } from './services/activity.service';
import { ActivityController } from './controllers/activity.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Activity]), AuthModule],
    controllers: [ActivityController],
    providers: [ActivityRepository, ActivityService],
    exports: [ActivityService],
})
export class ActivityModule {}

