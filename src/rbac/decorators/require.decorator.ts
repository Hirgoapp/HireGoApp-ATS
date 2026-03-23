import { SetMetadata } from '@nestjs/common';

export const Require = (...permissions: string[]) => SetMetadata('permissions', permissions);
