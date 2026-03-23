import { DataSource } from 'typeorm';
import { License } from '../../licensing/entities/license.entity';
import { LicenseFeature } from '../../licensing/entities/license-feature.entity';
import { FeatureFlag } from '../../licensing/entities/feature-flag.entity';

export async function seedLicensesAndFeatureFlags(
    dataSource: DataSource
): Promise<void> {
    const licenseRepository = dataSource.getRepository(License);
    const licenseFeatureRepository = dataSource.getRepository(LicenseFeature);
    const featureFlagRepository = dataSource.getRepository(FeatureFlag);

    // Define default licenses per tier
    const defaultLicenses = [
        {
            company_id: '550e8400-e29b-41d4-a716-446655440000', // Sample company 1
            tier: 'BASIC',
            status: 'ACTIVE',
            billing_cycle: 'monthly',
            auto_renew: true,
            starts_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        {
            company_id: '550e8400-e29b-41d4-a716-446655440001', // Sample company 2
            tier: 'PREMIUM',
            status: 'ACTIVE',
            billing_cycle: 'annual',
            auto_renew: true,
            starts_at: new Date(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        {
            company_id: '550e8400-e29b-41d4-a716-446655440002', // Sample company 3
            tier: 'ENTERPRISE',
            status: 'ACTIVE',
            billing_cycle: 'custom',
            auto_renew: true,
            starts_at: new Date(),
            expires_at: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
            custom_limits: {
                max_users: 1000,
                max_candidates: 1000000,
                api_calls_per_day: 1000000,
            },
        },
    ];

    // Define features for each tier
    const basicFeatures = [
        { name: 'jobs', limit: 5 },
        { name: 'candidates', limit: 1000 },
        { name: 'applications', limit: null },
        { name: 'custom_fields', limit: 5 },
        { name: 'pipelines', limit: 2 },
        { name: 'api_access', limit: 10000 },
    ];

    const premiumFeatures = [
        { name: 'jobs', limit: null },
        { name: 'candidates', limit: 10000 },
        { name: 'applications', limit: null },
        { name: 'custom_fields', limit: 50 },
        { name: 'pipelines', limit: 10 },
        { name: 'api_access', limit: 100000 },
        { name: 'bulk_import', limit: null },
        { name: 'webhooks', limit: 100 },
        { name: 'analytics', limit: null },
    ];

    const enterpriseFeatures = [
        { name: 'jobs', limit: null },
        { name: 'candidates', limit: null },
        { name: 'applications', limit: null },
        { name: 'custom_fields', limit: null },
        { name: 'pipelines', limit: null },
        { name: 'api_access', limit: null },
        { name: 'bulk_import', limit: null },
        { name: 'webhooks', limit: null },
        { name: 'analytics', limit: null },
        { name: 'sso', limit: null },
        { name: 'white_label', limit: null },
    ];

    // Create default licenses
    for (const licenseData of defaultLicenses) {
        let license = await licenseRepository.findOne({
            where: { company_id: licenseData.company_id },
        });

        if (!license) {
            license = licenseRepository.create(licenseData as any) as any;
            license = await licenseRepository.save(license) as any;

            // Add features based on tier
            const features = {
                BASIC: basicFeatures,
                PREMIUM: premiumFeatures,
                ENTERPRISE: enterpriseFeatures,
            }[license.tier];

            for (const feature of features) {
                const licenseFeature = licenseFeatureRepository.create({
                    license_id: license.id,
                    feature_name: feature.name,
                    is_enabled: true,
                    usage_limit: feature.limit,
                    current_usage: 0,
                    reset_date: new Date(),
                });
                await licenseFeatureRepository.save(licenseFeature);
            }
        }
    }

    // Create default feature flags
    const defaultFlags = [
        {
            name: 'advanced_reporting',
            description: 'Advanced analytics and reporting features',
            flag_type: 'boolean',
            status: 'active',
            is_enabled_globally: true,
            enabled_percentage: 100,
            target_tiers: ['PREMIUM', 'ENTERPRISE'],
        },
        {
            name: 'ai_candidate_matching',
            description: 'AI-powered candidate matching',
            flag_type: 'percentage',
            status: 'active',
            is_enabled_globally: true,
            enabled_percentage: 50, // Gradual rollout at 50%
            target_tiers: ['PREMIUM', 'ENTERPRISE'],
        },
        {
            name: 'workflow_automation',
            description: 'Workflow automation features',
            flag_type: 'boolean',
            status: 'active',
            is_enabled_globally: true,
            enabled_percentage: 100,
            target_tiers: ['ENTERPRISE'],
        },
        {
            name: 'custom_integrations',
            description: 'Custom third-party integrations',
            flag_type: 'boolean',
            status: 'active',
            is_enabled_globally: true,
            enabled_percentage: 100,
            target_tiers: ['ENTERPRISE'],
        },
        {
            name: 'beta_features',
            description: 'Beta and experimental features',
            flag_type: 'user_list',
            status: 'active',
            is_enabled_globally: false, // Disabled by default
            enabled_percentage: 0,
            included_companies: [
                '550e8400-e29b-41d4-a716-446655440000', // Sample company 1 in whitelist
            ],
        },
    ];

    for (const flagData of defaultFlags) {
        const existing = await featureFlagRepository.findOne({
            where: { name: flagData.name },
        });

        if (!existing) {
            const flag = featureFlagRepository.create(flagData as any);
            await featureFlagRepository.save(flag);
        }
    }

    console.log('✅ Licenses and feature flags seeded successfully');
}

/**
 * Run this seed manually with:
 * npm run seed
 */
