import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureService } from '../services/feature.service';
import { REQUIRED_FEATURE_KEY } from '../decorators/require-feature.decorator';

/**
 * Guard that ensures the current company has the required feature enabled.
 * Use with @RequireFeature('feature_key') on the handler.
 *
 * Usage:
 *   @RequireFeature('candidates_module')
 *   @UseGuards(FeatureGuard)
 *   @Get()
 *   listCandidates() { ... }
 *
 * If the feature is not enabled for the tenant company, returns 403 Forbidden.
 */
@Injectable()
export class FeatureGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly featureService: FeatureService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredFeature = this.reflector.get<string>(
            REQUIRED_FEATURE_KEY,
            context.getHandler(),
        );

        if (!requiredFeature) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const companyId = request.tenant?.companyId;

        if (!companyId) {
            throw new ForbiddenException('Company context required');
        }

        const isEnabled = await this.featureService.isEnabled(
            String(companyId),
            requiredFeature,
        );

        if (!isEnabled) {
            throw new ForbiddenException(
                `Feature "${requiredFeature}" is not enabled for your company`,
            );
        }

        return true;
    }
}
