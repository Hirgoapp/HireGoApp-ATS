import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { License, LicenseTier, LicenseStatus } from '../entities/license.entity';
import { LicenseFeature } from '../entities/license-feature.entity';
import { LicenseRepository } from '../repositories/license.repository';
import { LicenseFeatureRepository } from '../repositories/license-feature.repository';
import { AuditService } from '../../common/services/audit.service';

export interface LicenseTierFeatures {
    name: string;
    monthlyPrice: number;
    annualPrice: number;
    features: Record<string, { enabled: boolean; limit: number | null }>;
    maxUsers: number;
    maxCandidates: number;
    apiCallsPerDay: number;
    customFieldsLimit: number;
    pipelineStagesLimit: number;
    supportLevel: 'email' | 'priority' | 'dedicated';
}

@Injectable()
export class LicenseService {
    private readonly tierDefinitions: Record<LicenseTier, LicenseTierFeatures>;

    constructor(
        private readonly licenseRepository: LicenseRepository,
        private readonly licenseFeatureRepository: LicenseFeatureRepository,
        private readonly auditService: AuditService
    ) {
        this.tierDefinitions = this.initializeTierDefinitions();
    }

    /**
     * Get license for company
     */
    async getLicense(companyId: string): Promise<License> {
        const license = await this.licenseRepository.findByCompanyId(companyId);

        if (!license) {
            throw new NotFoundException(
                `License not found for company ${companyId}`
            );
        }

        return license;
    }

    /**
     * Check if license is active
     */
    async isLicenseActive(companyId: string): Promise<boolean> {
        try {
            const license = await this.licenseRepository.findByCompanyId(companyId);

            if (!license) {
                return false;
            }

            // Check status and expiration
            if (license.status !== LicenseStatus.ACTIVE) {
                return false;
            }

            if (license.expires_at < new Date()) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if company has access to feature
     */
    async hasFeatureAccess(
        companyId: string,
        featureName: string
    ): Promise<boolean> {
        try {
            const license = await this.getLicense(companyId);

            if (!license || license.status !== LicenseStatus.ACTIVE) {
                return false;
            }

            // Check if license is expired
            if (license.expires_at < new Date()) {
                return false;
            }

            const tierFeatures = this.tierDefinitions[license.tier as LicenseTier];
            if (!tierFeatures) {
                return false;
            }

            const feature = tierFeatures.features[featureName];
            return feature?.enabled ?? false;
        } catch {
            return false;
        }
    }

    /**
     * Check feature usage limit
     */
    async checkFeatureUsage(
        companyId: string,
        featureName: string,
        amount: number = 1
    ): Promise<{ allowed: boolean; remaining: number; limit: number | null }> {
        const license = await this.getLicense(companyId);

        // Get feature configuration
        const tierFeatures = this.tierDefinitions[license.tier as LicenseTier];
        const featureConfig = tierFeatures.features[featureName];

        if (!featureConfig?.enabled) {
            return {
                allowed: false,
                remaining: 0,
                limit: null,
            };
        }

        // If no limit (unlimited)
        if (featureConfig.limit === null) {
            return {
                allowed: true,
                remaining: Infinity,
                limit: null,
            };
        }

        // Check against license_features table
        let licenseFeature = await this.licenseFeatureRepository.findByLicenseAndFeature(
            license.id,
            featureName
        );

        if (!licenseFeature) {
            licenseFeature = await this.licenseFeatureRepository.create({
                license_id: license.id,
                feature_name: featureName,
                is_enabled: true,
                usage_limit: featureConfig.limit,
                current_usage: 0,
            });
        }

        // Check usage
        const remaining = licenseFeature.usage_limit - licenseFeature.current_usage;
        const allowed = remaining >= amount;

        return {
            allowed,
            remaining: Math.max(0, remaining),
            limit: licenseFeature.usage_limit,
        };
    }

    /**
     * Increment feature usage
     */
    async incrementFeatureUsage(
        companyId: string,
        featureName: string,
        amount: number = 1
    ): Promise<void> {
        const license = await this.getLicense(companyId);

        const licenseFeature = await this.licenseFeatureRepository.findByLicenseAndFeature(
            license.id,
            featureName
        );

        if (licenseFeature) {
            await this.licenseFeatureRepository.updateUsage(licenseFeature.id, amount);
        }
    }

    /**
     * Get tier features
     */
    getTierFeatures(tier: LicenseTier): LicenseTierFeatures {
        return this.tierDefinitions[tier] || this.tierDefinitions[LicenseTier.BASIC];
    }

    /**
     * Upgrade license to new tier
     */
    async upgradeLicense(
        companyId: string,
        newTier: LicenseTier,
        billingCycle: 'monthly' | 'annual'
    ): Promise<License> {
        const license = await this.getLicense(companyId);
        const tierConfig = this.tierDefinitions[newTier];

        // Calculate new expiration
        const now = new Date();
        const expiresAt =
            billingCycle === 'annual'
                ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
                : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        const oldTier = license.tier;

        license.tier = newTier;
        license.status = LicenseStatus.ACTIVE;
        license.starts_at = now;
        license.expires_at = expiresAt;
        license.billing_cycle = billingCycle;

        const updated = await this.licenseRepository.update(license.id, license);

        // Audit log
        await this.auditService.log(companyId, null, {
            entityType: 'license',
            entityId: license.id,
            action: 'UPGRADE',
            details: {
                oldTier,
                newTier,
                billingCycle,
                expiresAt,
            },
        });

        return updated;
    }

    /**
     * Set custom limit for ENTERPRISE
     */
    async setCustomLimit(
        companyId: string,
        featureName: string,
        newLimit: number | null
    ): Promise<LicenseFeature> {
        const license = await this.getLicense(companyId);

        if (license.tier !== LicenseTier.ENTERPRISE) {
            throw new BadRequestException(
                'Custom limits only available for ENTERPRISE tier'
            );
        }

        const feature = await this.licenseFeatureRepository.createOrUpdate(
            license.id,
            featureName,
            {
                is_enabled: true,
                usage_limit: newLimit,
            }
        );

        // Audit
        await this.auditService.log(companyId, null, {
            entityType: 'license_feature',
            entityId: feature.id,
            action: 'CUSTOM_LIMIT_SET',
            details: {
                featureName,
                newLimit,
            },
        });

        return feature;
    }

    /**
     * Get all features with usage for company
     */
    async getCompanyFeatures(companyId: string): Promise<Record<string, any>> {
        const license = await this.getLicense(companyId);
        const tierFeatures = this.tierDefinitions[license.tier as LicenseTier];
        const licenseFeatures = await this.licenseFeatureRepository.findByLicenseId(
            license.id
        );

        const result = {};

        for (const [featureName, config] of Object.entries(
            tierFeatures.features
        )) {
            const licenseFeature = licenseFeatures.find(
                (f) => f.feature_name === featureName
            );

            result[featureName] = {
                enabled: config.enabled,
                limit: config.limit,
                current_usage: licenseFeature?.current_usage ?? 0,
                remaining:
                    config.limit === null
                        ? 'unlimited'
                        : config.limit -
                        (licenseFeature?.current_usage ?? 0),
            };
        }

        return result;
    }

    /**
     * Initialize tier definitions
     */
    private initializeTierDefinitions(): Record<LicenseTier, LicenseTierFeatures> {
        return {
            [LicenseTier.BASIC]: {
                name: 'Basic - Startup',
                monthlyPrice: 29,
                annualPrice: 290,
                maxUsers: 3,
                maxCandidates: 1000,
                apiCallsPerDay: 10000,
                customFieldsLimit: 5,
                pipelineStagesLimit: 5,
                supportLevel: 'email',
                features: {
                    jobs: { enabled: true, limit: 5 },
                    candidates: { enabled: true, limit: 1000 },
                    applications: { enabled: true, limit: null },
                    custom_fields: { enabled: true, limit: 5 },
                    pipelines: { enabled: true, limit: 2 },
                    bulk_import: { enabled: false, limit: null },
                    api_access: { enabled: false, limit: null },
                    webhooks: { enabled: false, limit: null },
                    analytics: { enabled: false, limit: null },
                    sso: { enabled: false, limit: null },
                    white_label: { enabled: false, limit: null },
                },
            },
            [LicenseTier.PREMIUM]: {
                name: 'Premium - Growing Teams',
                monthlyPrice: 99,
                annualPrice: 990,
                maxUsers: 15,
                maxCandidates: 10000,
                apiCallsPerDay: 100000,
                customFieldsLimit: 50,
                pipelineStagesLimit: 10,
                supportLevel: 'priority',
                features: {
                    jobs: { enabled: true, limit: null },
                    candidates: { enabled: true, limit: 10000 },
                    applications: { enabled: true, limit: null },
                    custom_fields: { enabled: true, limit: 50 },
                    pipelines: { enabled: true, limit: 10 },
                    bulk_import: { enabled: true, limit: null },
                    api_access: { enabled: true, limit: null },
                    webhooks: { enabled: true, limit: 100 },
                    analytics: { enabled: true, limit: null },
                    sso: { enabled: false, limit: null },
                    white_label: { enabled: false, limit: null },
                },
            },
            [LicenseTier.ENTERPRISE]: {
                name: 'Enterprise - Custom',
                monthlyPrice: null,
                annualPrice: null,
                maxUsers: null,
                maxCandidates: null,
                apiCallsPerDay: null,
                customFieldsLimit: null,
                pipelineStagesLimit: null,
                supportLevel: 'dedicated',
                features: {
                    jobs: { enabled: true, limit: null },
                    candidates: { enabled: true, limit: null },
                    applications: { enabled: true, limit: null },
                    custom_fields: { enabled: true, limit: null },
                    pipelines: { enabled: true, limit: null },
                    bulk_import: { enabled: true, limit: null },
                    api_access: { enabled: true, limit: null },
                    webhooks: { enabled: true, limit: null },
                    analytics: { enabled: true, limit: null },
                    sso: { enabled: true, limit: null },
                    white_label: { enabled: true, limit: null },
                },
            },
        };
    }
}
