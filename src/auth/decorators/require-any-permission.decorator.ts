import { SetMetadata } from '@nestjs/common';

export const RequireAnyPermission = (...permissions: string[]) => {
    return SetMetadata('ANY_PERMISSION', permissions);
};
