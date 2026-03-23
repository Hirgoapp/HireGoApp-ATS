import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationAccount, IntegrationProvider } from '../entities/integration-account.entity';

@Injectable()
export class IntegrationAccountRepository {
    constructor(
        @InjectRepository(IntegrationAccount)
        private readonly repo: Repository<IntegrationAccount>,
    ) {}

    async list(companyId: string, provider: IntegrationProvider): Promise<IntegrationAccount[]> {
        return this.repo.find({
            where: { company_id: companyId, provider },
            order: { email: 'ASC' },
        });
    }

    async upsert(
        companyId: string,
        provider: IntegrationProvider,
        email: string,
        patch: Partial<IntegrationAccount>,
    ): Promise<IntegrationAccount> {
        const existing = await this.repo.findOne({ where: { company_id: companyId, provider, email } });
        if (existing) {
            Object.assign(existing, patch);
            return this.repo.save(existing);
        }
        const created = this.repo.create({
            company_id: companyId,
            provider,
            email,
            is_active: true,
            is_verified: false,
            config: {},
            ...patch,
        });
        return this.repo.save(created);
    }

    async setActive(
        companyId: string,
        provider: IntegrationProvider,
        email: string,
        isActive: boolean,
    ): Promise<IntegrationAccount | null> {
        const row = await this.repo.findOne({ where: { company_id: companyId, provider, email } });
        if (!row) return null;
        row.is_active = isActive;
        return this.repo.save(row);
    }

    async disableAll(companyId: string, provider: IntegrationProvider): Promise<number> {
        const res = await this.repo.update(
            { company_id: companyId, provider },
            { is_active: false },
        );
        return res.affected ?? 0;
    }
}

