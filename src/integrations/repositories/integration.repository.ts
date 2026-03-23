import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration } from '../entities/integration.entity';

@Injectable()
export class IntegrationRepository {
    constructor(
        @InjectRepository(Integration)
        private readonly repo: Repository<Integration>,
    ) {}

    /**
     * Get a single integration for a company by type. Tenant isolation: only uses companyId argument.
     */
    async getIntegration(companyId: string, integrationType: string): Promise<Integration | null> {
        return this.repo.findOne({
            where: { company_id: companyId, integration_type: integrationType },
        });
    }

    /**
     * Create or update an integration for a company. Sets is_active = true.
     */
    async setIntegration(
        companyId: string,
        integrationType: string,
        config: Record<string, unknown>,
    ): Promise<Integration> {
        let row = await this.repo.findOne({
            where: { company_id: companyId, integration_type: integrationType },
        });
        if (row) {
            row.config = config ?? {};
            row.is_active = true;
            return this.repo.save(row);
        }
        row = this.repo.create({
            company_id: companyId,
            integration_type: integrationType,
            config: config ?? {},
            is_active: true,
        });
        return this.repo.save(row);
    }

    /**
     * Disable an integration (soft: is_active = false). Does not delete config.
     */
    async disableIntegration(companyId: string, integrationType: string): Promise<Integration | null> {
        const row = await this.repo.findOne({
            where: { company_id: companyId, integration_type: integrationType },
        });
        if (!row) return null;
        row.is_active = false;
        return this.repo.save(row);
    }

    /**
     * List all integrations for a company. Tenant isolation: only filters by companyId.
     */
    async getCompanyIntegrations(companyId: string): Promise<Integration[]> {
        return this.repo.find({
            where: { company_id: companyId },
            order: { integration_type: 'ASC' },
        });
    }
}
