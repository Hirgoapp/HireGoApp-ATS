import { Injectable } from '@nestjs/common';
import { IntegrationRepository } from '../repositories/integration.repository';
import { Integration } from '../entities/integration.entity';
import { IntegrationAccountRepository } from '../repositories/integration-account.repository';

@Injectable()
export class IntegrationService {
    constructor(
        private readonly integrationRepository: IntegrationRepository,
        private readonly integrationAccountRepository: IntegrationAccountRepository,
    ) {}

    /**
     * Get integration config for a company and type. Returns null if not found or inactive.
     * Other modules (files, notifications, etc.) can use this to get credentials/settings.
     */
    async getIntegrationConfig(
        companyId: string,
        integrationType: string,
    ): Promise<Record<string, unknown> | null> {
        const integration = await this.integrationRepository.getIntegration(
            companyId,
            integrationType,
        );
        if (!integration || !integration.is_active) return null;
        return integration.config ?? null;
    }

    /**
     * Get the full integration entity if needed (e.g. for display, or to check is_active).
     */
    async getIntegration(companyId: string, integrationType: string): Promise<Integration | null> {
        return this.integrationRepository.getIntegration(companyId, integrationType);
    }

    /**
     * Connect (create or update) an integration for a company.
     */
    async connect(
        companyId: string,
        integrationType: string,
        config: Record<string, unknown>,
    ): Promise<Integration> {
        return this.integrationRepository.setIntegration(companyId, integrationType, config ?? {});
    }

    /**
     * Disable an integration for a company.
     */
    async disconnect(companyId: string, integrationType: string): Promise<Integration | null> {
        // If disconnecting a provider integration, also disable its connected accounts.
        // This ensures a full disconnect from company-owned services.
        if (integrationType === 'google_drive') {
            await this.integrationAccountRepository.disableAll(companyId, 'google');
        } else if (integrationType === 'onedrive') {
            await this.integrationAccountRepository.disableAll(companyId, 'microsoft');
        }
        return this.integrationRepository.disableIntegration(companyId, integrationType);
    }

    /**
     * List all integrations for a company (for API listing). Sanitize config in controller if needed.
     */
    async getCompanyIntegrations(companyId: string): Promise<Integration[]> {
        return this.integrationRepository.getCompanyIntegrations(companyId);
    }
}
