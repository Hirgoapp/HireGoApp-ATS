import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Document } from './entities/document.entity';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { StorageService } from '../../common/services/storage.service';
import { VirusScannerService } from '../../common/services/virus-scanner.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Document]),
        MulterModule.register({
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
        }),
    ],
    controllers: [DocumentController],
    providers: [DocumentService, StorageService, VirusScannerService], exports: [DocumentService],
})
export class DocumentsModule { }