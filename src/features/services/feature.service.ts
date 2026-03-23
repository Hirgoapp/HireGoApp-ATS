import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FeatureRepository } from '../repositories/feature.repository';
import { CompanyFeatureFlag } from '../entities/feature-flag.entity';

const CACHE_TTL_MS = 60_000; // 1 minute
const CACHE_KEY_PREFIX = 'company_feature:';

@Injectable()
export class FeatureService {
    constructor(
        private readonly featureRepository: FeatureRepository,
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
    ) {}

    /**
     * Check if a feature is enabled for a company. Uses cache for performance.
     * Tenant isolation: only uses companyId passed by caller (from req.tenant).
     */
    async isEnabled(companyId: string, featureKey: string): Promise<boolean> {
        const cacheKey = `${CACHE_KEY_PREFIX}${companyId}:${featureKey}`;
        const cached = await this.cache.get<boolean>(cacheKey);
        if (cached !== undefined && cached !== null) {
            return cached;
        }
        const enabled = await this.featureRepository.isFeatureEnabled(companyId, featureKey);
        await this.cache.set(cacheKey, enabled, CACHE_TTL_MS);
        return enabled;
    }

    /**
     * Enable a feature for a company. Clears cache for that company's feature.
     */
    async enableFeature(companyId: string, featureKey: string): Promise<CompanyFeatureFlag> {
        const result = await this.featureRepository.enableFeature(companyId, featureKey);
        await this.clearFeatureCache(companyId, featureKey);
        return result;
    }

    /**
     * Disable a feature for a company. Clears cache for that company's feature.
     */
    async disableFeature(companyId: string, featureKey: string): Promise<CompanyFeatureFlag> {
        const result = await this.featureRepository.disableFeature(companyId, featureKey);
        await this.clearFeatureCache(companyId, featureKey);
        return result;
    }

    /**
     * Get all feature flags for a company. Optionally use cache for the list (here we skip list cache for simplicity).
     */
    async getCompanyFeatures(companyId: string): Promise<CompanyFeatureFlag[]> {
        return this.featureRepository.getCompanyFeatures(companyId);
    }

    private async clearFeatureCache(companyId: string, featureKey: string): Promise<void> {
        const cacheKey = `${CACHE_KEY_PREFIX}${companyId}:${featureKey}`;
        await this.cache.del(cacheKey);
    }
}
