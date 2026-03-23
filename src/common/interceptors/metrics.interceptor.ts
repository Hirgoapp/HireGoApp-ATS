import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../modules/metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(private readonly metrics: MetricsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const httpCtx = context.switchToHttp();
        const req = httpCtx.getRequest<Request & { path?: string; method?: string }>();

        const pathRaw = (req as any)?.path || '';
        const method = (req as any)?.method || '';

        // Avoid self-scrape recursion
        if (pathRaw.startsWith('/metrics')) {
            return next.handle();
        }

        // Normalize dynamic segments in paths to reduce cardinality
        // Replace UUIDs and numeric IDs with :id
        const normalizePath = (p: string) =>
            (p || '')
                // UUID v4-like
                .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/g, ':id')
                // Large integers (IDs)
                .replace(/\b\d{6,}\b/g, ':id')
                // Common short numeric segments
                .replace(/\/(\d+)\b/g, '/:id');

        const path = normalizePath(pathRaw);

        return next.handle().pipe(
            tap({
                next: () => {
                    const res = httpCtx.getResponse<any>();
                    const status = res?.statusCode || 200;
                    const durationMs = Date.now() - now;
                    this.metrics.observeRequest(method, path, status, durationMs);
                },
                error: () => {
                    const res = httpCtx.getResponse<any>();
                    const status = res?.statusCode || 500;
                    const durationMs = Date.now() - now;
                    this.metrics.observeRequest(method, path, status, durationMs);
                },
            }),
        );
    }
}
