import { Injectable, BadRequestException } from '@nestjs/common';
import { IntegrationAccountRepository } from '../repositories/integration-account.repository';
import { IntegrationAccount, IntegrationProvider } from '../entities/integration-account.entity';

@Injectable()
export class IntegrationAccountService {
    constructor(private readonly repo: IntegrationAccountRepository) {}

    async list(companyId: string, provider: IntegrationProvider): Promise<IntegrationAccount[]> {
        return this.repo.list(companyId, provider);
    }

    async addPending(companyId: string, provider: IntegrationProvider, email: string): Promise<IntegrationAccount> {
        const normalized = String(email || '').trim().toLowerCase();
        if (!normalized.includes('@')) throw new BadRequestException('Invalid email');
        return this.repo.upsert(companyId, provider, normalized, { is_verified: false, is_active: true });
    }

    async disable(companyId: string, provider: IntegrationProvider, email: string): Promise<IntegrationAccount | null> {
        return this.repo.setActive(companyId, provider, email.toLowerCase(), false);
    }
}

