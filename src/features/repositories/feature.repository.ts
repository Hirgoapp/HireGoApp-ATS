import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyFeatureFlag } from '../entities/feature-flag.entity';

@Injectable()
export class FeatureRepository {
    constructor(
        @InjectRepository(CompanyFeatureFlag)
        private readonly repo: Repository<CompanyFeatureFlag>,
    ) {}

    /**
     * Check if a feature is enabled for a company. Tenant isolation: only uses companyId argument.
     */
    async isFeatureEnabled(companyId: string, featureKey: string): Promise<boolean> {
        const row = await this.repo.findOne({
            where: { company_id: companyId, feature_key: featureKey },
            select: ['is_enabled'],
        });
        return row?.is_enabled ?? false;
    }

    /**
     * Enable a feature for a company. Upserts so (company_id, feature_key) is unique.
     */
    async enableFeature(companyId: string, featureKey: string): Promise<CompanyFeatureFlag> {
        let row = await this.repo.findOne({
            where: { company_id: companyId, feature_key: featureKey },
        });
        if (row) {
            row.is_enabled = true;
            return this.repo.save(row);
        }
        row = this.repo.create({
            company_id: companyId,
            feature_key: featureKey,
            is_enabled: true,
        });
        return this.repo.save(row);
    }

    /**
     * Disable a feature for a company.
     */
    async disableFeature(companyId: string, featureKey: string): Promise<CompanyFeatureFlag> {
        let row = await this.repo.findOne({
            where: { company_id: companyId, feature_key: featureKey },
        });
        if (row) {
            row.is_enabled = false;
            return this.repo.save(row);
        }
        row = this.repo.create({
            company_id: companyId,
            feature_key: featureKey,
            is_enabled: false,
        });
        return this.repo.save(row);
    }

    /**
     * Get all feature flags for a company. Tenant isolation: only filters by companyId.
     */
    async getCompanyFeatures(companyId: string): Promise<CompanyFeatureFlag[]> {
        return this.repo.find({
            where: { company_id: companyId },
            order: { feature_key: 'ASC' },
        });
    }
}
