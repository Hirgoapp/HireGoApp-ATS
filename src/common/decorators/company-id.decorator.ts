import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CompanyId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        // Prefer tenant context injected by TenantContextMiddleware, fall back to user or header
        return request.tenant?.companyId || request.user?.company_id || request.headers['x-company-id'];
    },
);

export const UserId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        // Prefer tenant context injected by TenantContextMiddleware, fall back to decoded user
        return request.tenant?.userId || request.user?.id;
    },
);
