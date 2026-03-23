import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';
import * as fs from 'fs';
import * as path from 'path';
import { StorageService } from '../../common/services/storage.service';
import { VirusScannerService } from '../../common/services/virus-scanner.service';

@Injectable()
export class DocumentService {
    private readonly uploadDir = path.join(process.cwd(), 'uploads');

    constructor(
        @InjectRepository(Document)
        private readonly documentRepo: Repository<Document>,
        private readonly storage: StorageService,
        private readonly virusScanner: VirusScannerService,
    ) {
        this.ensureUploadDir();
    }

    private async ensureUploadDir() {
        try {
            await fs.promises.mkdir(this.uploadDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }

    async upload(
        file: any,
        dto: CreateDocumentDto,
        companyId: string,
        userId: string,
    ): Promise<Document> {
        // Scan for malware
        const scanResult = await this.virusScanner.scanBuffer(file.buffer, file.originalname);
        if (!scanResult.safe) {
            throw new BadRequestException(`File rejected: ${scanResult.threat || 'Malware detected'}`);
        }

        const fileName = `${companyId}/${Date.now()}-${file.originalname}`;
        const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
        let location = '';
        let storageType: 'local' | 's3' = 'local';
        if (provider === 's3') {
            const uploaded = await this.storage.upload(file.buffer, fileName, file.mimetype, !!dto.is_public);
            location = uploaded.location;
            storageType = 's3';
        } else {
            const localName = `${Date.now()}-${file.originalname}`;
            const localPath = path.join(this.uploadDir, localName);
            await fs.promises.writeFile(localPath, file.buffer);
            location = localPath;
            storageType = 'local';
        }

        const document = this.documentRepo.create({
            company_id: companyId,
            entity_type: dto.entity_type,
            entity_id: dto.entity_id,
            file_name: path.basename(fileName),
            original_name: file.originalname,
            file_path: location,
            file_size: file.size,
            mime_type: file.mimetype,
            document_type: dto.document_type,
            storage_type: storageType,
            is_public: dto.is_public || false,
            metadata: dto.metadata || {},
            uploaded_by: userId,
        });

        return await this.documentRepo.save(document);
    }

    async findAll(companyId: string, filter: FilterDocumentDto) {
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...rest } = filter;
        const qb = this.documentRepo
            .createQueryBuilder('document')
            .where('document.company_id = :companyId', { companyId })
            .andWhere('document.deleted_at IS NULL');

        if (rest.entity_type) qb.andWhere('document.entity_type = :entity_type', { entity_type: rest.entity_type });
        if (rest.entity_id) qb.andWhere('document.entity_id = :entity_id', { entity_id: rest.entity_id });
        if (rest.document_type) qb.andWhere('document.document_type = :document_type', { document_type: rest.document_type });
        if (rest.search) {
            qb.andWhere('(document.original_name ILIKE :search OR document.extracted_text ILIKE :search)', {
                search: `%${rest.search}%`,
            });
        }

        const total = await qb.getCount();
        const data = await qb
            .orderBy(`document.${sortBy}`, sortOrder)
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total, page, limit };
    }

    async findOne(id: string, companyId: string): Promise<Document> {
        const document = await this.documentRepo.findOne({
            where: { id, company_id: companyId, deleted_at: null },
        });
        if (!document) throw new NotFoundException(`Document ${id} not found`);
        return document;
    }

    async findByEntity(entityType: string, entityId: string, companyId: string): Promise<Document[]> {
        return await this.documentRepo.find({
            where: {
                company_id: companyId,
                entity_type: entityType,
                entity_id: entityId,
                deleted_at: null,
            },
            order: { created_at: 'DESC' },
        });
    }

    async update(id: string, dto: UpdateDocumentDto, companyId: string): Promise<Document> {
        const document = await this.findOne(id, companyId);
        Object.assign(document, dto);
        return await this.documentRepo.save(document);
    }

    async remove(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.documentRepo.softDelete(id);
    }

    async hardDelete(id: string, companyId: string): Promise<void> {
        const document = await this.findOne(id, companyId);

        // Delete physical/S3 file
        try {
            await this.storage.delete(document.file_path);
        } catch (error) {
            console.error('Failed to delete file:', error);
        }

        await this.documentRepo.delete(id);
    }

    async download(id: string, companyId: string): Promise<{ buffer: Buffer; document: Document }> {
        const document = await this.findOne(id, companyId);

        let buffer: Buffer;
        try {
            buffer = await this.storage.getBuffer(document.file_path);
        } catch (e) {
            throw new NotFoundException('File not found in storage');
        }
        return { buffer, document };
    }

    async getPresignedDownloadUrl(id: string, companyId: string): Promise<{ url: string; expiresIn: number } | null> {
        const document = await this.findOne(id, companyId);
        const expiresIn = parseInt(process.env.S3_PRESIGNED_EXPIRES || '300', 10);
        const contentDisposition = `attachment; filename="${document.original_name}"`;
        const url = await this.storage.getPresignedUrl(document.file_path, expiresIn, contentDisposition);
        if (!url) return null;
        return { url, expiresIn };
    }

    async extractText(id: string, companyId: string, extractedText: string): Promise<Document> {
        const document = await this.findOne(id, companyId);
        document.extracted_text = extractedText;
        return await this.documentRepo.save(document);
    }
}
