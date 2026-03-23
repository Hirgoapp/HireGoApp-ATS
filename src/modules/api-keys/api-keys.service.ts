import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { ApiKeyUsage } from './entities/api-key-usage.entity';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyFilterDto } from './dto/api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
    constructor(
        @InjectRepository(ApiKey) private readonly apiKeyRepo: Repository<ApiKey>,
        @InjectRepository(ApiKeyUsage) private readonly usageRepo: Repository<ApiKeyUsage>,
    ) { }

    /** Generate a new API key token, hash and preview */
    private generateKeyMaterial() {
        const raw = `ak_${crypto.randomBytes(24).toString('hex')}`; // ~48 hex chars
        const hash = crypto.createHash('sha256').update(raw).digest('hex');
        const preview = raw.slice(0, 20);
        return { raw, hash, preview };
    }

    async create(companyId: string, userId: string, dto: CreateApiKeyDto) {
        const { raw, hash, preview } = this.generateKeyMaterial();

        const key = this.apiKeyRepo.create({
            companyId,
            createdById: userId,
            name: dto.name,
            scopes: dto.scopes,
            keyHash: hash,
            keyPreview: preview,
            isActive: true,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        });

        const saved = await this.apiKeyRepo.save(key);

        // Return the raw key once for the client to store securely
        return { id: saved.id, key: raw, keyPreview: saved.keyPreview };
    }

    async list(companyId: string, filter?: ApiKeyFilterDto) {
        const qb = this.apiKeyRepo.createQueryBuilder('k').where('k.company_id = :companyId', { companyId });
        if (filter?.isActive !== undefined) qb.andWhere('k.is_active = :isActive', { isActive: filter.isActive });
        if (filter?.scope) qb.andWhere(':scope = ANY(k.scopes)', { scope: filter.scope });
        return qb.orderBy('k.created_at', 'DESC').getMany();
    }

    async get(companyId: string, id: string) {
        const key = await this.apiKeyRepo.findOne({ where: { id, companyId } });
        if (!key) throw new NotFoundException('API key not found');
        return key;
    }

    async update(companyId: string, id: string, dto: UpdateApiKeyDto) {
        const key = await this.get(companyId, id);
        if (dto.name !== undefined) key.name = dto.name;
        if (dto.scopes !== undefined) key.scopes = dto.scopes;
        if (dto.expiresAt !== undefined) key.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
        if (dto.isActive !== undefined) key.isActive = !!dto.isActive;
        return this.apiKeyRepo.save(key);
    }

    async revoke(companyId: string, id: string) {
        const key = await this.get(companyId, id);
        key.isActive = false;
        key.deletedAt = new Date();
        return this.apiKeyRepo.save(key);
    }

    async rotate(companyId: string, id: string) {
        const key = await this.get(companyId, id);
        const { raw, hash, preview } = this.generateKeyMaterial();
        key.keyHash = hash;
        key.keyPreview = preview;
        await this.apiKeyRepo.save(key);
        return { id: key.id, key: raw, keyPreview: key.keyPreview };
    }

    /** Validate incoming API key token and record usage */
    async validate(token: string): Promise<ApiKey> {
        const hash = crypto.createHash('sha256').update(token).digest('hex');
        const key = await this.apiKeyRepo.findOne({ where: { keyHash: hash, isActive: true } });
        if (!key) throw new ForbiddenException('Invalid API key');
        if (key.expiresAt && key.expiresAt < new Date()) throw new ForbiddenException('API key expired');
        key.lastUsedAt = new Date();
        await this.apiKeyRepo.save(key);
        return key;
    }

    async recordUsage(key: ApiKey, req: any, statusCode?: number) {
        const usage = this.usageRepo.create({
            companyId: key.companyId,
            apiKeyId: key.id,
            path: req?.path || null,
            method: req?.method || null,
            ipAddress: (req?.ip || req?.headers?.['x-forwarded-for']) ?? null,
            userAgent: req?.get?.('user-agent') ?? null,
            statusCode: statusCode ?? null,
        });
        await this.usageRepo.save(usage);
    }
}
