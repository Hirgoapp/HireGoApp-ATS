import { Controller, Get } from '@nestjs/common';

/**
 * Public root — browser hits http://localhost:3001/ without a JWT.
 * Tenant middleware is excluded for this path only.
 */
@Controller()
export class RootController {
    @Get()
    apiIndex() {
        const business =
            process.env.COMPANY_LOGIN_URL || 'http://localhost:5180/login';
        const superAdmin =
            process.env.SUPER_ADMIN_UI_URL || 'http://localhost:5174/login';
        const host =
            process.env.PUBLIC_HOST && process.env.PORT
                ? `http://${process.env.PUBLIC_HOST}:${process.env.PORT}`
                : null;

        return {
            ok: true,
            service: 'HireGoApp API',
            message:
                'This URL is the REST API, not a login page. Open the portal links below in your browser to sign in.',
            api: {
                health: '/health',
                readiness: '/readiness',
                swagger: '/api',
                tenantLogin: 'POST /api/v1/auth/login',
                superAdminLogin: 'POST /api/super-admin/auth/login',
            },
            loginInBrowser: {
                businessPortal: business,
                superAdminPortal: superAdmin,
            },
            ...(host ? { sameNetworkApiBase: host } : {}),
        };
    }
}
