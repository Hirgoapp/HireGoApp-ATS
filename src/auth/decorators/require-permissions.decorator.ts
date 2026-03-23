import { SetMetadata } from '@nestjs/common';

export const RequirePermissions = (...permissions: string[]) => {
    return SetMetadata('REQUIRED_PERMISSIONS', permissions);
};
