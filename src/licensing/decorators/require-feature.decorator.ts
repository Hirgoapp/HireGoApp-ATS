import { SetMetadata } from '@nestjs/common';

export const RequireFeature = (featureName: string) =>
    SetMetadata('REQUIRED_FEATURE', featureName);
