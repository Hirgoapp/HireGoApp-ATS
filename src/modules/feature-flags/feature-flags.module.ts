import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlag } from './entities/feature-flag.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([FeatureFlag]),
        CacheModule.register({
            ttl: 60000, // 1 minute cache for feature flags
            max: 1000, // Store up to 1000 flag check results
        }),
    ],
    controllers: [FeatureFlagsController],
    providers: [FeatureFlagsService],
    exports: [FeatureFlagsService],
})
export class FeatureFlagsModule { }
