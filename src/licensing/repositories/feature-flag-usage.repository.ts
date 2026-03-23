import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FeatureFlagUsage } from '../entities/feature-flag-usage.entity';

@Injectable()
export class FeatureFlagUsageRepository {
    constructor(
        @InjectRepository(FeatureFlagUsage)
        private readonly repository: Repository<FeatureFlagUsage>
    ) { }

    /**
     * Find or create usage record
     */
    async findOrCreate(
        flagId: string,
        companyId: string
    ): Promise<FeatureFlagUsage> {
        let usage = await this.repository.findOne({
            where: { feature_flag_id: flagId, company_id: companyId },
        });

        if (!usage) {
            usage = this.repository.create({
                feature_flag_id: flagId,
                company_id: companyId,
                access_count: 0,
            });
            usage = await this.repository.save(usage);
        }

        return usage;
    }

    /**
     * Record flag access
     */
    async recordAccess(flagId: string, companyId: string): Promise<FeatureFlagUsage> {
        const usage = await this.findOrCreate(flagId, companyId);
        usage.last_accessed_at = new Date();
        usage.access_count++;
        if (!usage.enabled_at) {
            usage.enabled_at = new Date();
        }
        return this.repository.save(usage);
    }

    /**
     * Get usage for flag
     */
    async findByFlagId(flagId: string): Promise<FeatureFlagUsage[]> {
        return this.repository.find({
            where: { feature_flag_id: flagId },
        });
    }

    /**
     * Get usage for company
     */
    async findByCompanyId(companyId: string): Promise<FeatureFlagUsage[]> {
        return this.repository.find({
            where: { company_id: companyId },
        });
    }
}
