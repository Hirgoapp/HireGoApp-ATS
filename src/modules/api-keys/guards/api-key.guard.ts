import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../api-keys.service';

export const REQUIRED_API_SCOPES = 'REQUIRED_API_SCOPES';
export const RequireApiScopes = (...scopes: string[]) => (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(REQUIRED_API_SCOPES, scopes, descriptor?.value || target);
    return descriptor || target;
};

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly apiKeysService: ApiKeysService, private readonly reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const headerKey = req.headers['x-api-key'] || req.headers['authorization'];
        const queryKey = req.query?.api_key;

        const token = typeof headerKey === 'string' && headerKey.startsWith('ak_') ? headerKey : queryKey;
        if (!token || typeof token !== 'string') throw new ForbiddenException('Missing API key');

        const apiKey = await this.apiKeysService.validate(token);
        req.apiKey = apiKey;
        req.tenant = req.tenant || {};
        req.tenant.companyId = apiKey.companyId;

        const requiredScopes: string[] = this.reflector.get<string[]>(REQUIRED_API_SCOPES, context.getHandler()) || [];
        if (requiredScopes.length) {
            const ok = requiredScopes.every((s) => apiKey.scopes.includes(s));
            if (!ok) throw new ForbiddenException('Insufficient API key scope');
        }

        return true;
    }
}
