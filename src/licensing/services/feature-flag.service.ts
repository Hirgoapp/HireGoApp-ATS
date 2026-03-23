import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { FeatureFlagRepository } from '../repositories/feature-flag.repository';
import { FeatureFlagUsageRepository } from '../repositories/feature-flag-usage.repository';
import { LicenseService } from './license.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class FeatureFlagService {
    constructor(
        private readonly featureFlagRepository: FeatureFlagRepository,
        private readonly featureFlagUsageRepository: FeatureFlagUsageRepository,
        private readonly licenseService: LicenseService,
        private readonly auditService: AuditService
    ) { }

    /**
     * Check if feature flag is enabled for company
     */
    async isFeatureEnabled(
        companyId: string,
        flagName: string
    ): Promise<boolean> {
        try {
            const flag = await this.featureFlagRepository.findActiveByName(flagName);

            if (!flag) {
                return false;
            }

            // Check scheduling
            const now = new Date();
            if (flag.scheduled_at && flag.scheduled_at > now) {
                return false; // Not yet scheduled
            }
            if (flag.scheduled_end_at && flag.scheduled_end_at < now) {
                return false; // Scheduling ended
            }

            // Check global enable
            if (!flag.is_enabled_globally) {
                return false;
            }

            // Check company exclusion
            if (flag.excluded_companies?.includes(companyId)) {
                return false;
            }

            // Check whitelist (if exists)
            if (
                flag.included_companies &&
                flag.included_companies.length > 0 &&
                !flag.included_companies.includes(companyId)
            ) {
                return false;
            }

            // Check license tier targeting
            if (flag.target_tiers && flag.target_tiers.length > 0) {
                try {
                    const license = await this.licenseService.getLicense(companyId);
                    if (!flag.target_tiers.includes(license.tier)) {
                        return false;
                    }
                } catch {
                    return false;
                }
            }

            // Check gradual rollout percentage
            if (flag.enabled_percentage && flag.enabled_percentage < 100) {
                const hash = this.hashCompanyId(companyId);
                if (hash % 100 >= flag.enabled_percentage) {
                    return false;
                }
            }

            // Record usage
            await this.featureFlagUsageRepository.recordAccess(flag.id, companyId);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get all enabled features for company
     */
    async getEnabledFeatures(companyId: string): Promise<string[]> {
        const flags = await this.featureFlagRepository.findAllActive();

        const enabled: string[] = [];

        for (const flag of flags) {
            const isEnabled = await this.isFeatureEnabled(companyId, flag.name);
            if (isEnabled) {
                enabled.push(flag.name);
            }
        }

        return enabled;
    }

    /**
     * Create new feature flag
     */
    async createFlag(
        dto: Partial<FeatureFlag>,
        createdById: string
    ): Promise<FeatureFlag> {
        const flag = await this.featureFlagRepository.create({
            ...dto,
            status: 'draft',
            is_enabled_globally: false,
            created_by_id: createdById,
        });

        // Audit
        await this.auditService.log(null, createdById, {
            entityType: 'feature_flag',
            entityId: flag.id,
            action: 'FEATURE_FLAG_CREATED',
            details: {
                name: flag.name,
                flagType: flag.flag_type,
            },
        });

        return flag;
    }

    /**
     * Enable flag globally
     */
    async enableFlag(flagId: string, userId: string): Promise<FeatureFlag> {
        const flag = await this.featureFlagRepository.findById(flagId);

        if (!flag) {
            throw new NotFoundException(`Feature flag ${flagId} not found`);
        }

        flag.status = 'active';
        flag.is_enabled_globally = true;

        const updated = await this.featureFlagRepository.update(flagId, flag);

        // Audit
        await this.auditService.log(null, userId, {
            entityType: 'feature_flag',
            entityId: flagId,
            action: 'FEATURE_FLAG_ENABLED',
            details: {
                name: flag.name,
            },
        });

        return updated;
    }

    /**
     * Disable flag
     */
    async disableFlag(flagId: string, userId: string): Promise<FeatureFlag> {
        const flag = await this.featureFlagRepository.findById(flagId);

        if (!flag) {
            throw new NotFoundException(`Feature flag ${flagId} not found`);
        }

        flag.is_enabled_globally = false;

        const updated = await this.featureFlagRepository.update(flagId, flag);

        // Audit
        await this.auditService.log(null, userId, {
            entityType: 'feature_flag',
            entityId: flagId,
            action: 'FEATURE_FLAG_DISABLED',
            details: {
                name: flag.name,
            },
        });

        return updated;
    }

    /**
     * Gradual rollout - enable for percentage
     */
    async rolloutFlag(
        flagId: string,
        percentage: number,
        userId: string
    ): Promise<FeatureFlag> {
        if (percentage < 0 || percentage > 100) {
            throw new BadRequestException('Percentage must be between 0 and 100');
        }

        const flag = await this.featureFlagRepository.findById(flagId);

        if (!flag) {
            throw new NotFoundException(`Feature flag ${flagId} not found`);
        }

        flag.enabled_percentage = percentage;
        flag.status = 'active';

        const updated = await this.featureFlagRepository.update(flagId, flag);

        // Audit
        await this.auditService.log(null, userId, {
            entityType: 'feature_flag',
            entityId: flagId,
            action: 'FEATURE_FLAG_ROLLOUT',
            details: {
                name: flag.name,
                percentage,
            },
        });

        return updated;
    }

    /**
     * Add company to whitelist
     */
    async includeCompany(
        flagId: string,
        companyId: string,
        userId: string
    ): Promise<FeatureFlag> {
        const flag = await this.featureFlagRepository.addToWhitelist(
            flagId,
            companyId
        );

        if (!flag) {
            throw new NotFoundException(`Feature flag ${flagId} not found`);
        }

        // Audit
        await this.auditService.log(null, userId, {
            entityType: 'feature_flag',
            entityId: flagId,
            action: 'FEATURE_FLAG_COMPANY_INCLUDED',
            details: {
                companyId,
            },
        });

        return flag;
    }

    /**
     * Exclude company from flag
     */
    async excludeCompany(
        flagId: string,
        companyId: string,
        userId: string
    ): Promise<FeatureFlag> {
        const flag = await this.featureFlagRepository.addToExcluded(
            flagId,
            companyId
        );

        if (!flag) {
            throw new NotFoundException(`Feature flag ${flagId} not found`);
        }

        // Audit
        await this.auditService.log(null, userId, {
            entityType: 'feature_flag',
            entityId: flagId,
            action: 'FEATURE_FLAG_COMPANY_EXCLUDED',
            details: {
                companyId,
            },
        });

        return flag;
    }

    /**
     * Hash company ID for consistent percentage rollout
     */
    private hashCompanyId(companyId: string): number {
        let hash = 0;
        for (let i = 0; i < companyId.length; i++) {
            const char = companyId.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}
