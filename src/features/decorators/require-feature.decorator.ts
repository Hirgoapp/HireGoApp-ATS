import { SetMetadata } from '@nestjs/common';

export const REQUIRED_FEATURE_KEY = 'REQUIRED_FEATURE';

/**
 * Mark a route as requiring a feature to be enabled for the current company.
 * Use together with FeatureGuard: @RequireFeature('candidates_module') @UseGuards(FeatureGuard)
 */
export const RequireFeature = (featureKey: string) =>
    SetMetadata(REQUIRED_FEATURE_KEY, featureKey);
