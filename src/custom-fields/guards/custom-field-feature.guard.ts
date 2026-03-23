import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from '../../licensing/services/feature-flag.service';

@Injectable()
export class CustomFieldFeatureGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly featureFlagService: FeatureFlagService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route has @RequireCustomFields decorator
        const requireCustomFields = this.reflector.get<boolean>(
            'REQUIRE_CUSTOM_FIELDS',
            context.getHandler()
        );

        if (!requireCustomFields) {
            return true; // No custom fields check required
        }

        const request = context.switchToHttp().getRequest();
        const companyId = request.user?.company_id;

        if (!companyId) {
            throw new ForbiddenException('Company context required');
        }

        // Check if custom_fields feature is enabled
        const isEnabled = await this.featureFlagService.isFeatureEnabled(
            companyId,
            'custom_fields'
        );

        if (!isEnabled) {
            throw new ForbiddenException(
                'Custom fields feature is not enabled for your company'
            );
        }

        return true;
    }
}
