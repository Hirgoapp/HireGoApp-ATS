import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './entities/license.entity';
import { LicenseFeature } from './entities/license-feature.entity';
import { FeatureFlag } from './entities/feature-flag.entity';
import { FeatureFlagUsage } from './entities/feature-flag-usage.entity';
import { LicenseRepository } from './repositories/license.repository';
import { LicenseFeatureRepository } from './repositories/license-feature.repository';
import { FeatureFlagRepository } from './repositories/feature-flag.repository';
import { FeatureFlagUsageRepository } from './repositories/feature-flag-usage.repository';
import { LicenseService } from './services/license.service';
import { FeatureFlagService } from './services/feature-flag.service';
import { LicenseGuard } from './guards/license.guard';
import { FeatureGuard } from './guards/feature.guard';
import { UsageLimitGuard } from './guards/usage-limit.guard';
import { LicenseController } from './controllers/license.controller';
import { FeatureFlagController } from './controllers/feature-flag.controller';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        CommonModule,
        TypeOrmModule.forFeature([
            License,
            LicenseFeature,
            FeatureFlag,
            FeatureFlagUsage,
        ]),
    ],
    providers: [
        LicenseRepository,
        LicenseFeatureRepository,
        FeatureFlagRepository,
        FeatureFlagUsageRepository,
        LicenseService,
        FeatureFlagService,
        LicenseGuard,
        FeatureGuard,
        UsageLimitGuard,
    ],
    controllers: [LicenseController, FeatureFlagController],
    exports: [
        LicenseService,
        FeatureFlagService,
        LicenseGuard,
        FeatureGuard,
        UsageLimitGuard,
    ],
})
export class LicensingModule { }
