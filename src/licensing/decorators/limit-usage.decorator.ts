import { SetMetadata } from '@nestjs/common';

export const LimitUsage = (feature: string, amount: number) =>
    SetMetadata('USAGE_LIMIT', { feature, amount });
