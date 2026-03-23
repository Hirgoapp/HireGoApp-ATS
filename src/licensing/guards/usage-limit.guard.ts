import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicenseService } from '../services/license.service';

@Injectable()
export class UsageLimitGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly licenseService: LicenseService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route has @LimitUsage decorator
        const usageLimit = this.reflector.get<{
            feature: string;
            amount: number;
        }>('USAGE_LIMIT', context.getHandler());

        if (!usageLimit) {
            return true; // No usage limit
        }

        const request = context.switchToHttp().getRequest();
        const companyId = request.user?.company_id;

        if (!companyId) {
            throw new ForbiddenException('Company context required');
        }

        try {
            const { feature, amount } = usageLimit;

            // Check usage against limit
            const usage = await this.licenseService.checkFeatureUsage(
                companyId,
                feature,
                amount
            );

            if (!usage.allowed) {
                throw new ForbiddenException(
                    `Feature ${feature} limit exceeded. Remaining: ${usage.remaining}/${usage.limit}`
                );
            }

            // Increment usage for the request
            // Store in request context for use in post-execution
            request.featureUsage = {
                feature,
                amount,
            };

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            throw new ForbiddenException('Usage limit validation failed');
        }
    }
}
