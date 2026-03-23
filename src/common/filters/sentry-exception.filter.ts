import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<any>();
        const request = ctx.getRequest<any>();

        // Report to Sentry if initialized
        try {
            if ((Sentry as any)?.getCurrentHub()?.getClient()) {
                Sentry.captureException(exception, {
                    contexts: {
                        request: {
                            method: request?.method,
                            url: request?.url,
                            headers: request?.headers,
                            ip: request?.ip,
                        },
                    },
                });
            }
        } catch { }

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const payload = {
            success: false,
            message: exception?.message || 'Internal server error',
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request?.url,
        };

        response.status(status).json(payload);
    }
}
