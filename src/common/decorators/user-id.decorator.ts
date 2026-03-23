import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        // Prefer tenant context injected by TenantContextMiddleware, fall back to decoded user
        return request.tenant?.userId || request.user?.id;
    },
);
