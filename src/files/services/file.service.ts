import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FileRepository } from '../repositories/file.repository';
import { StorageProviderFactory } from '../providers/storage-provider.factory';
import { ActivityService } from '../../activity/services/activity.service';
import { AuditService } from '../../common/services/audit.service';
import { FileEntity } from '../entities/file.entity';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

@Injectable()
export class FileService {
    constructor(
        private readonly fileRepository: FileRepository,
        private readonly storageFactory: StorageProviderFactory,
        private readonly activityService: ActivityService,
        private readonly auditService: AuditService,
    ) {}

    async upload(
        companyId: string,
        userId: string,
        entityType: string,
        entityId: string,
        file: Express.Multer.File,
    ): Promise<FileEntity> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException('File size exceeds 25MB limit');
        }

        const provider = await this.storageFactory.getProvider(companyId);

        const relativePath = `${companyId}/${entityType}/${entityId}`;
        const fileUrl = await provider.upload(file, relativePath);

        const saved = await this.fileRepository.createFile(companyId, {
            entityType,
            entityId,
            fileName: file.originalname,
            fileUrl,
            fileSize: file.size,
            mimeType: file.mimetype,
            storageProvider: 'local',
            uploadedBy: userId,
        });

        // Activity timeline
        await this.activityService.logActivity(companyId, userId, {
            entityType,
            entityId,
            activityType: 'FILE_UPLOADED',
            message: `File uploaded: ${file.originalname}`,
            metadata: {
                fileId: saved.id,
                fileName: saved.file_name,
                mimeType: saved.mime_type,
            },
        });

        // Audit log
        await this.auditService.log(companyId, userId, {
            entityType: 'File',
            entityId: saved.id,
            action: 'FILE_UPLOADED',
            newValues: {
                entityType,
                entityId,
                fileName: saved.file_name,
                fileUrl: saved.file_url,
                mimeType: saved.mime_type,
                fileSize: saved.file_size,
            },
        });

        return saved;
    }

    async getFiles(companyId: string, entityType: string, entityId: string): Promise<FileEntity[]> {
        return this.fileRepository.getFiles(companyId, entityType, entityId);
    }

    async deleteFile(companyId: string, userId: string, fileId: string): Promise<void> {
        const file = await this.fileRepository.findById(companyId, fileId);
        if (!file) {
            throw new NotFoundException('File not found');
        }

        const provider = await this.storageFactory.getProvider(companyId);
        await provider.delete(file.file_url);

        await this.fileRepository.deleteFile(companyId, fileId);

        // Activity
        await this.activityService.logActivity(companyId, userId, {
            entityType: file.entity_type,
            entityId: file.entity_id,
            activityType: 'FILE_DELETED',
            message: `File deleted: ${file.file_name}`,
            metadata: {
                fileId: file.id,
                fileName: file.file_name,
            },
        });

        // Audit
        await this.auditService.log(companyId, userId, {
            entityType: 'File',
            entityId: file.id,
            action: 'FILE_DELETED',
            oldValues: {
                entityType: file.entity_type,
                entityId: file.entity_id,
                fileName: file.file_name,
                fileUrl: file.file_url,
                mimeType: file.mime_type,
                fileSize: file.file_size,
            },
        });
    }
}

