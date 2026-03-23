import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FeatureFlag } from '../entities/feature-flag.entity';

@Injectable()
export class FeatureFlagRepository {
    constructor(
        @InjectRepository(FeatureFlag)
        private readonly repository: Repository<FeatureFlag>
    ) { }

    /**
     * Find active flag by name
     */
    async findActiveByName(name: string): Promise<FeatureFlag | null> {
        return this.repository.findOne({
            where: {
                name,
                status: 'active',
            },
        });
    }

    /**
     * Find all active flags
     */
    async findAllActive(): Promise<FeatureFlag[]> {
        return this.repository.find({
            where: {
                status: 'active',
            },
        });
    }

    /**
     * Find flag by ID
     */
    async findById(id: string): Promise<FeatureFlag | null> {
        return this.repository.findOne({ where: { id } });
    }

    /**
     * Create flag
     */
    async create(flagData: Partial<FeatureFlag>): Promise<FeatureFlag> {
        const flag = this.repository.create(flagData);
        return this.repository.save(flag);
    }

    /**
     * Update flag
     */
    async update(id: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag> {
        await this.repository.update(id, updates);
        return this.repository.findOne({ where: { id } });
    }

    /**
     * Soft delete flag
     */
    async softDelete(id: string): Promise<void> {
        await this.repository.softDelete(id);
    }

    /**
     * Add company to whitelist
     */
    async addToWhitelist(flagId: string, companyId: string): Promise<FeatureFlag> {
        const flag = await this.repository.findOne({ where: { id: flagId } });
        if (flag) {
            const included = flag.included_companies || [];
            if (!included.includes(companyId)) {
                included.push(companyId);
                flag.included_companies = included;
                await this.repository.save(flag);
            }
        }
        return flag;
    }

    /**
     * Add company to exclusion list
     */
    async addToExcluded(flagId: string, companyId: string): Promise<FeatureFlag> {
        const flag = await this.repository.findOne({ where: { id: flagId } });
        if (flag) {
            const excluded = flag.excluded_companies || [];
            if (!excluded.includes(companyId)) {
                excluded.push(companyId);
                flag.excluded_companies = excluded;
                await this.repository.save(flag);
            }
        }
        return flag;
    }

    /**
     * Remove company from whitelist
     */
    async removeFromWhitelist(flagId: string, companyId: string): Promise<FeatureFlag> {
        const flag = await this.repository.findOne({ where: { id: flagId } });
        if (flag && flag.included_companies) {
            flag.included_companies = flag.included_companies.filter((id) => id !== companyId);
            await this.repository.save(flag);
        }
        return flag;
    }

    /**
     * Remove company from exclusion list
     */
    async removeFromExcluded(flagId: string, companyId: string): Promise<FeatureFlag> {
        const flag = await this.repository.findOne({ where: { id: flagId } });
        if (flag && flag.excluded_companies) {
            flag.excluded_companies = flag.excluded_companies.filter((id) => id !== companyId);
            await this.repository.save(flag);
        }
        return flag;
    }
}
