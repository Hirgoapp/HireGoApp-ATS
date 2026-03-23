import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../entities/file.entity';

@Injectable()
export class FileRepository {
    constructor(
        @InjectRepository(FileEntity)
        private readonly repository: Repository<FileEntity>,
    ) {}

    async createFile(
        companyId: string,
        data: {
            entityType: string;
            entityId: string;
            fileName: string;
            fileUrl: string;
            fileSize: number;
            mimeType: string;
            storageProvider: string;
            uploadedBy?: string | null;
        },
    ): Promise<FileEntity> {
        const entity = this.repository.create({
            company_id: companyId,
            entity_type: data.entityType,
            entity_id: data.entityId,
            file_name: data.fileName,
            file_url: data.fileUrl,
            file_size: data.fileSize,
            mime_type: data.mimeType,
            storage_provider: data.storageProvider,
            uploaded_by: data.uploadedBy ?? null,
        });
        return this.repository.save(entity);
    }

    async getFiles(companyId: string, entityType: string, entityId: string): Promise<FileEntity[]> {
        return this.repository.find({
            where: { company_id: companyId, entity_type: entityType, entity_id: entityId },
            order: { created_at: 'DESC' },
        });
    }

    async findById(companyId: string, fileId: string): Promise<FileEntity | null> {
        return this.repository.findOne({
            where: { id: fileId, company_id: companyId },
        });
    }

    async deleteFile(companyId: string, fileId: string): Promise<void> {
        await this.repository.delete({ id: fileId, company_id: companyId });
    }
}

