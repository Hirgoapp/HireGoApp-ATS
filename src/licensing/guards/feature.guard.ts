import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from '../services/feature-flag.service';
import { LicenseService } from '../services/license.service';

@Injectable()
export class FeatureGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly featureFlagService: FeatureFlagService,
        private readonly licenseService: LicenseService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route has @RequireFeature decorator
        const requiredFeature = this.reflector.get<string>(
            'REQUIRED_FEATURE',
            context.getHandler()
        );

        if (!requiredFeature) {
            return true; // No feature requirement
        }

        const request = context.switchToHttp().getRequest();
        const companyId = request.user?.company_id;

        if (!companyId) {
            throw new ForbiddenException('Company context required');
        }

        try {
            // Check license is active
            const isLicenseActive = await this.licenseService.isLicenseActive(
                companyId
            );

            if (!isLicenseActive) {
                throw new ForbiddenException('License is not active or has expired');
            }

            // Check feature access through license
            const hasLicenseAccess = await this.licenseService.hasFeatureAccess(
                companyId,
                requiredFeature
            );

            if (!hasLicenseAccess) {
                throw new ForbiddenException(
                    `Feature ${requiredFeature} is not included in your license`
                );
            }

            // Check feature flag
            const isFlagEnabled = await this.featureFlagService.isFeatureEnabled(
                companyId,
                requiredFeature
            );

            if (!isFlagEnabled) {
                throw new ForbiddenException(
                    `Feature ${requiredFeature} is not currently enabled`
                );
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            throw new ForbiddenException('Feature validation failed');
        }
    }
}
