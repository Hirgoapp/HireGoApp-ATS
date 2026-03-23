import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LicenseFeature } from '../entities/license-feature.entity';

@Injectable()
export class LicenseFeatureRepository {
    constructor(
        @InjectRepository(LicenseFeature)
        private readonly repository: Repository<LicenseFeature>
    ) { }

    /**
     * Find all features for license
     */
    async findByLicenseId(licenseId: string): Promise<LicenseFeature[]> {
        return this.repository.find({
            where: { license_id: licenseId },
        });
    }

    /**
     * Find specific feature for license
     */
    async findByLicenseAndFeature(
        licenseId: string,
        featureName: string
    ): Promise<LicenseFeature | null> {
        return this.repository.findOne({
            where: { license_id: licenseId, feature_name: featureName },
        });
    }

    /**
     * Create feature
     */
    async create(featureData: Partial<LicenseFeature>): Promise<LicenseFeature> {
        const feature = this.repository.create(featureData);
        return this.repository.save(feature);
    }

    /**
     * Update feature usage
     */
    async updateUsage(id: string, amount: number): Promise<LicenseFeature> {
        const feature = await this.repository.findOne({ where: { id } });
        if (feature) {
            feature.current_usage += amount;
            await this.repository.save(feature);
        }
        return feature;
    }

    /**
     * Reset feature usage
     */
    async resetUsage(id: string): Promise<LicenseFeature> {
        const feature = await this.repository.findOne({ where: { id } });
        if (feature) {
            feature.current_usage = 0;
            feature.reset_date = new Date();
            await this.repository.save(feature);
        }
        return feature;
    }

    /**
     * Update feature limit
     */
    async updateLimit(id: string, newLimit: number | null): Promise<LicenseFeature> {
        await this.repository.update(id, { usage_limit: newLimit });
        return this.repository.findOne({ where: { id } });
    }

    /**
     * Create or update feature for license
     */
    async createOrUpdate(licenseId: string, featureName: string, data: Partial<LicenseFeature>): Promise<LicenseFeature> {
        const existing = await this.findByLicenseAndFeature(licenseId, featureName);

        if (existing) {
            Object.assign(existing, data);
            return this.repository.save(existing);
        }

        return this.create({
            license_id: licenseId,
            feature_name: featureName,
            ...data,
        });
    }
}
