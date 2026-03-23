import { SetMetadata } from '@nestjs/common';

export const RequireCustomFields = () =>
    SetMetadata('REQUIRE_CUSTOM_FIELDS', true);
