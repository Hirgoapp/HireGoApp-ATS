import { SetMetadata } from '@nestjs/common';

export const RequireLicense = (tier: 'BASIC' | 'PREMIUM' | 'ENTERPRISE') =>
    SetMetadata('REQUIRED_LICENSE_TIER', tier);
