import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { CompanyFeatureFlag } from './entities/feature-flag.entity';
import { FeatureRepository } from './repositories/feature.repository';
import { FeatureService } from './services/feature.service';
import { FeatureController } from './controllers/feature.controller';
import { FeatureGuard } from './guards/feature.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CompanyFeatureFlag]),
        CacheModule.register({
            ttl: 60_000,
            max: 1000,
        }),
        AuthModule,
    ],
    controllers: [FeatureController],
    providers: [FeatureRepository, FeatureService, FeatureGuard],
    exports: [FeatureService, FeatureGuard],
})
export class FeaturesModule {}
