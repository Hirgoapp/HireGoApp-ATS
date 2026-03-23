import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { SettingsRepository } from './repositories/settings.repository';
import { SettingsService } from './services/settings.service';
import { SettingsController } from './controllers/settings.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Setting]), CommonModule, AuthModule],
    controllers: [SettingsController],
    providers: [SettingsRepository, SettingsService],
    exports: [SettingsService],
})
export class SettingsModule {}

