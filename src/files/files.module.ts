import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { FileRepository } from './repositories/file.repository';
import { FileService } from './services/file.service';
import { FileController } from './controllers/file.controller';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { StorageProviderFactory } from './providers/storage-provider.factory';
import { SettingsModule } from '../settings/settings.module';
import { ActivityModule } from '../activity/activity.module';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FileEntity]),
        SettingsModule,
        ActivityModule,
        CommonModule,
        AuthModule,
    ],
    controllers: [FileController],
    providers: [
        FileRepository,
        FileService,
        LocalStorageProvider,
        StorageProviderFactory,
    ],
    exports: [FileService],
})
export class FilesModule { }

