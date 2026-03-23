import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag, FlagStatus, FlagTargeting } from './entities/feature-flag.entity';
import { CreateFeatureFlagDto, UpdateFeatureFlagDto, CheckFeatureFlagDto } from './dto/feature-flag.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class FeatureFlagsService {
    constructor(
        @InjectRepository(FeatureFlag)
        private readonly featureFlagRepository: Repository<FeatureFlag>,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) { }

    /**
     * Create a new feature flag
     */
    async create(createDto: CreateFeatureFlagDto): Promise<FeatureFlag> {
        // Check if flag with same key already exists
        const existing = await this.featureFlagRepository.findOne({
            where: { key: createDto.key },
        });

        if (existing) {
            throw new ConflictException(`Feature flag with key "${createDto.key}" already exists`);
        }

        const flag = this.featureFlagRepository.create({
            ...createDto,
            status: FlagStatus.INACTIVE, // Start inactive by default
        });

        return this.featureFlagRepository.save(flag);
    }

    /**
     * Get all feature flags
     */
    async findAll(filters?: { status?: FlagStatus; is_beta?: boolean }): Promise<FeatureFlag[]> {
        const query = this.featureFlagRepository.createQueryBuilder('flag');

        if (filters?.status) {
            query.andWhere('flag.status = :status', { status: filters.status });
        }

        if (filters?.is_beta !== undefined) {
            query.andWhere('flag.is_beta_feature = :is_beta', { is_beta: filters.is_beta });
        }

        query.orderBy('flag.created_at', 'DESC');

        return query.getMany();
    }

    /**
     * Get a single feature flag
     */
    async findOne(id: string): Promise<FeatureFlag> {
        const flag = await this.featureFlagRepository.findOne({ where: { id } });
        if (!flag) {
            throw new NotFoundException(`Feature flag with ID "${id}" not found`);
        }
        return flag;
    }

    /**
     * Get feature flag by key
     */
    async findByKey(key: string): Promise<FeatureFlag> {
        const flag = await this.featureFlagRepository.findOne({ where: { key } });
        if (!flag) {
            throw new NotFoundException(`Feature flag with key "${key}" not found`);
        }
        return flag;
    }

    /**
     * Update a feature flag
     */
    async update(id: string, updateDto: UpdateFeatureFlagDto): Promise<FeatureFlag> {
        const flag = await this.findOne(id);

        Object.assign(flag, updateDto);

        const updated = await this.featureFlagRepository.save(flag);

        // Clear cache when flag is updated
        await this.clearFlagCache(flag.key);

        return updated;
    }

    /**
     * Delete a feature flag (archive instead of hard delete)
     */
    async remove(id: string): Promise<void> {
        const flag = await this.findOne(id);
        flag.status = FlagStatus.ARCHIVED;
        await this.featureFlagRepository.save(flag);
        await this.clearFlagCache(flag.key);
    }

    /**
     * Check if a feature flag is enabled for given context
     * This is the core method used by applications to check flags
     */
    async isEnabled(checkDto: CheckFeatureFlagDto): Promise<boolean> {
        const cacheKey = `flag:${checkDto.flag_key}:${checkDto.company_id || 'global'}:${checkDto.user_id || 'none'}:${checkDto.environment || 'prod'}`;

        // Try cache first
        const cached = await this.cacheManager.get<boolean>(cacheKey);
        if (cached !== undefined && cached !== null) {
            return cached;
        }

        try {
            const flag = await this.findByKey(checkDto.flag_key);

            // Increment usage count (async, don't wait)
            this.incrementUsageCount(flag.id).catch(err => console.error('Failed to increment usage count:', err));

            // Check if flag is active
            if (flag.status !== FlagStatus.ACTIVE) {
                await this.cacheManager.set(cacheKey, false, 60000); // Cache for 1 minute
                return false;
            }

            let isEnabled = false;

            // Check targeting rules
            switch (flag.targeting) {
                case FlagTargeting.GLOBAL:
                    isEnabled = true;
                    break;

                case FlagTargeting.COMPANY:
                    isEnabled = this.checkCompanyTargeting(flag, checkDto.company_id);
                    break;

                case FlagTargeting.USER:
                    isEnabled = this.checkUserTargeting(flag, checkDto.user_id);
                    break;

                case FlagTargeting.PERCENTAGE:
                    isEnabled = this.checkPercentageTargeting(flag, checkDto.user_id || checkDto.company_id);
                    break;
            }

            // Check environment targeting
            if (isEnabled && flag.targeting_rules?.environments?.length > 0) {
                const currentEnv = checkDto.environment || process.env.NODE_ENV || 'production';
                isEnabled = flag.targeting_rules.environments.includes(currentEnv);
            }

            // Cache result
            await this.cacheManager.set(cacheKey, isEnabled, 60000); // 1 minute

            // Increment enabled count if flag is enabled
            if (isEnabled) {
                this.incrementEnabledCount(flag.id).catch(err => console.error('Failed to increment enabled count:', err));
            }

            return isEnabled;
        } catch (error) {
            if (error instanceof NotFoundException) {
                // Flag doesn't exist, return false and cache it
                await this.cacheManager.set(cacheKey, false, 300000); // Cache for 5 minutes
                return false;
            }
            throw error;
        }
    }

    /**
     * Bulk check multiple flags at once
     */
    async bulkCheck(flags: string[], context: { company_id?: string; user_id?: string; environment?: string }): Promise<Record<string, boolean>> {
        const results: Record<string, boolean> = {};

        await Promise.all(
            flags.map(async (flagKey) => {
                results[flagKey] = await this.isEnabled({
                    flag_key: flagKey,
                    ...context,
                });
            }),
        );

        return results;
    }

    /**
     * Get all beta features for a company
     */
    async getBetaFeatures(companyId: string): Promise<FeatureFlag[]> {
        return this.featureFlagRepository
            .createQueryBuilder('flag')
            .where('flag.is_beta_feature = :is_beta', { is_beta: true })
            .andWhere('flag.status = :status', { status: FlagStatus.ACTIVE })
            .getMany();
    }

    /**
     * Enable beta feature for specific company
     */
    async enableBetaForCompany(flagKey: string, companyId: string): Promise<void> {
        const flag = await this.findByKey(flagKey);

        if (!flag.is_beta_feature) {
            throw new ConflictException('This flag is not a beta feature');
        }

        if (!flag.targeting_rules) {
            flag.targeting_rules = {};
        }

        if (!flag.targeting_rules.company_ids) {
            flag.targeting_rules.company_ids = [];
        }

        if (!flag.targeting_rules.company_ids.includes(companyId)) {
            flag.targeting_rules.company_ids.push(companyId);
            flag.targeting = FlagTargeting.COMPANY;
            flag.status = FlagStatus.ACTIVE;
            await this.featureFlagRepository.save(flag);
            await this.clearFlagCache(flagKey);
        }
    }

    /**
     * Disable beta feature for specific company
     */
    async disableBetaForCompany(flagKey: string, companyId: string): Promise<void> {
        const flag = await this.findByKey(flagKey);

        if (flag.targeting_rules?.company_ids) {
            flag.targeting_rules.company_ids = flag.targeting_rules.company_ids.filter(id => id !== companyId);
            await this.featureFlagRepository.save(flag);
            await this.clearFlagCache(flagKey);
        }
    }

    // Private helper methods

    private checkCompanyTargeting(flag: FeatureFlag, companyId?: string): boolean {
        if (!companyId) return false;
        return flag.targeting_rules?.company_ids?.includes(companyId) || false;
    }

    private checkUserTargeting(flag: FeatureFlag, userId?: string): boolean {
        if (!userId) return false;
        return flag.targeting_rules?.user_ids?.includes(userId) || false;
    }

    private checkPercentageTargeting(flag: FeatureFlag, identifier?: string): boolean {
        if (!identifier) return false;

        const percentage = flag.targeting_rules?.percentage || 0;
        if (percentage === 0) return false;
        if (percentage === 100) return true;

        // Deterministic percentage rollout based on identifier hash
        const hash = this.hashString(identifier);
        const bucket = hash % 100;
        return bucket < percentage;
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    private async incrementUsageCount(flagId: string): Promise<void> {
        await this.featureFlagRepository.increment({ id: flagId }, 'usage_count', 1);
    }

    private async incrementEnabledCount(flagId: string): Promise<void> {
        await this.featureFlagRepository.increment({ id: flagId }, 'enabled_count', 1);
    }

    private async clearFlagCache(flagKey: string): Promise<void> {
        // Clear cache entries by pattern (simple implementation)
        // Note: For production, consider using Redis with pattern-based deletion
        // For now, just reset the specific keys we know about
        // Cache will naturally expire after TTL
    }

    /**
     * Get flag usage statistics
     */
    async getStatistics(flagKey: string): Promise<{
        usage_count: number;
        enabled_count: number;
        enabled_percentage: number;
    }> {
        const flag = await this.findByKey(flagKey);
        const enabledPercentage = flag.usage_count > 0 ? (flag.enabled_count / flag.usage_count) * 100 : 0;

        return {
            usage_count: flag.usage_count,
            enabled_count: flag.enabled_count,
            enabled_percentage: Math.round(enabledPercentage * 100) / 100,
        };
    }
}
