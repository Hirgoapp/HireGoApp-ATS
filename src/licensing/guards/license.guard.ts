import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicenseService } from '../services/license.service';

@Injectable()
export class LicenseGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly licenseService: LicenseService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route has @RequireLicense decorator
        const requiredTier = this.reflector.get<string>(
            'REQUIRED_LICENSE_TIER',
            context.getHandler()
        );

        if (!requiredTier) {
            return true; // No license requirement
        }

        const request = context.switchToHttp().getRequest();
        const companyId = request.user?.company_id;

        if (!companyId) {
            throw new ForbiddenException('Company context required');
        }

        try {
            // Check if license is active
            const isActive = await this.licenseService.isLicenseActive(companyId);

            if (!isActive) {
                throw new ForbiddenException(
                    'License is not active or has expired'
                );
            }

            // Check tier requirement
            const license = await this.licenseService.getLicense(companyId);

            const tierHierarchy = ['BASIC', 'PREMIUM', 'ENTERPRISE'];
            const requiredIndex = tierHierarchy.indexOf(requiredTier);
            const actualIndex = tierHierarchy.indexOf(license.tier);

            if (actualIndex < requiredIndex) {
                throw new ForbiddenException(
                    `License tier ${license.tier} does not meet required tier ${requiredTier}`
                );
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            throw new ForbiddenException('License validation failed');
        }
    }
}
