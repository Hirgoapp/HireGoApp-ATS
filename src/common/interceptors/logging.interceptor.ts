import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const { method, url, body } = request;
        const userAgent = request.get('user-agent') || '';
        const startTime = Date.now();

        // Log incoming request
        this.logger.log(
            `→ ${method} ${url} | UA: ${userAgent.substring(0, 50)}...`
        );

        // Log request body for POST/PUT/PATCH (excluding sensitive fields)
        if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
            const sanitizedBody = this.sanitizeBody(body);
            if (Object.keys(sanitizedBody).length > 0) {
                this.logger.debug(`   Body: ${JSON.stringify(sanitizedBody)}`);
            }
        }

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const executionTime = Date.now() - startTime;
                    const statusCode = response.statusCode;
                    const statusEmoji = this.getStatusEmoji(statusCode);

                    this.logger.log(
                        `${statusEmoji} ${method} ${url} | ${statusCode} | ${executionTime}ms`
                    );
                },
                error: (error) => {
                    const executionTime = Date.now() - startTime;
                    const statusCode = error.status || response.statusCode || 500;
                    const statusEmoji = this.getStatusEmoji(statusCode);

                    // Enhanced logging for auth failures
                    if (statusCode === 401 || statusCode === 403) {
                        this.logger.warn(
                            `${statusEmoji} ${method} ${url} | ${statusCode} ${error.message || 'Unauthorized'} | ${executionTime}ms`
                        );
                        if (error.response?.message) {
                            this.logger.warn(`   Error: ${error.response.message}`);
                        }
                    } else {
                        this.logger.error(
                            `${statusEmoji} ${method} ${url} | ${statusCode} ${error.message || 'Error'} | ${executionTime}ms`
                        );
                    }
                },
            })
        );
    }

    private sanitizeBody(body: any): any {
        if (!body || typeof body !== 'object') {
            return {};
        }

        const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret'];
        const sanitized = { ...body };

        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '***REDACTED***';
            }
        }

        return sanitized;
    }

    private getStatusEmoji(statusCode: number): string {
        if (statusCode >= 200 && statusCode < 300) {
            return '✅'; // Success
        } else if (statusCode >= 300 && statusCode < 400) {
            return '↪️'; // Redirect
        } else if (statusCode === 401 || statusCode === 403) {
            return '🔒'; // Auth failure
        } else if (statusCode >= 400 && statusCode < 500) {
            return '⚠️'; // Client error
        } else {
            return '❌'; // Server error
        }
    }
}
