import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Graceful shutdown helper – closed over once bootstrap sets it
let _app: { close(): Promise<void> } | null = null;

async function gracefulShutdown(signal: string, code = 0): Promise<never> {
    console.log(`\n🔴 ${signal} received – shutting down gracefully...`);
    try {
        if (_app) await _app.close();
    } catch {
        // ignore close errors
    }
    process.exit(code);
}

// Process-level error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION:', reason);
    console.error('Promise:', promise);
    gracefulShutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ UNCAUGHT EXCEPTION:', error);
    console.error('Stack:', error.stack);
    gracefulShutdown('uncaughtException', 1);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));
process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));

function getCorsOrigins(): string[] {
    const configuredOrigins = process.env.CORS_ORIGIN;
    if (!configuredOrigins) {
        return [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5180',
            'http://localhost:3001',
            'http://127.0.0.1:5174',
            'http://127.0.0.1:5180',
            'http://127.0.0.1:3001',
        ];
    }

    return configuredOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

async function bootstrap() {
    try {
        console.log('🔵 Step 1: Creating Nest application...');
        const app = await NestFactory.create(AppModule);
        _app = app;
        app.enableShutdownHooks();
        /** Single fixed API port — see API_URL.md (default 3001). No automatic fallback to other ports. */
        const port = parseInt(process.env.PORT || '3001', 10);
        const host = process.env.HOST || '0.0.0.0';
        const publicHost = process.env.PUBLIC_HOST || (host === '0.0.0.0' ? 'localhost' : host);
        const corsOrigins = getCorsOrigins();

        console.log('🔵 Step 1.1: Initializing Sentry (if DSN provided)...');
        const dsn = process.env.SENTRY_DSN;
        if (dsn) {
            Sentry.init({
                dsn,
                tracesSampleRate: 0.1,
                environment: process.env.NODE_ENV || 'development',
            });
        }

        console.log('🔵 Step 2: Enabling CORS...');
        // Enable CORS
        app.enableCors({
            origin: corsOrigins,
            credentials: true,
        });

        console.log('🔵 Step 2.1: Applying security headers (Helmet)...');
        app.use(
            helmet({
                contentSecurityPolicy: {
                    useDefaults: true,
                    directives: {
                        defaultSrc: ["'self'"],
                        imgSrc: ["'self'", 'data:', 'https:'],
                        scriptSrc: ["'self'", "'unsafe-inline'"],
                        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
                        connectSrc: ["'self'", 'https:', 'ws:', 'wss:'],
                    },
                },
                crossOriginEmbedderPolicy: false,
            }),
        );

        console.log('🔵 Step 3: Setting up global pipes...');
        // Global validation pipe
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        console.log('🔵 Step 3.1: Registering global Sentry exception filter...');
        app.useGlobalFilters(new SentryExceptionFilter());

        console.log('🔵 Step 3.2: Registering HTTP logging interceptor...');
        app.useGlobalInterceptors(new LoggingInterceptor());

        console.log('🔵 Step 4: Configuring Swagger...');
        // Swagger/OpenAPI
        const config = new DocumentBuilder()
            .setTitle('HireGoApp API')
            .setDescription('HireGoApp API')
            .setVersion('1.0')
            .addBearerAuth()
            .build();

        console.log('🔵 Step 5: Creating Swagger document...');
        const swaggerLib = require('@nestjs/swagger') as {
            SwaggerModule?: {
                createDocument: (appRef: unknown, cfg: unknown) => unknown;
                setup: (path: string, appRef: unknown, doc: unknown) => void;
            };
        };
        const document = swaggerLib.SwaggerModule?.createDocument(app, config);

        console.log('🔵 Step 6: Setting up Swagger UI...');
        if (document) {
            swaggerLib.SwaggerModule?.setup('api', app, document);
        } else {
            console.warn('⚠️ SwaggerModule is unavailable; skipping /api docs setup.');
        }

        // console.log('🔵 Step 6.5: Setting up S3 storage policies (if enabled)...');
        // try {
        //     const storageService = app.get('StorageService', { strict: false });
        //     if (storageService?.setupBucketPolicies) {
        //         await storageService.setupBucketPolicies();
        //     }
        // } catch (error) {
        //     console.warn('⚠️  S3 setup skipped (StorageService not available)');
        // }

        console.log(`🔵 Step 7: Starting HTTP server on ${host}:${port} (fixed PORT; see API_URL.md)...`);
        let server: any;
        try {
            server = await app.listen(port, host);
        } catch (error: any) {
            if (error?.code === 'EADDRINUSE') {
                console.error('');
                console.error(`❌ Port ${port} is already in use.`);
                console.error(`   This API uses ONE port only (${port}, from PORT in .env). It will not move to 3002/3006.`);
                console.error(`   Fix: stop the other Node/Nest process on ${port}, or run: npm run ports:check`);
                console.error('');
                process.exit(1);
            }
            throw error;
        }

        console.log('🔵 HTTP server started successfully');
        console.log('🔵 Server object type:', typeof server);
        console.log('🔵 Server object is null?', server === null);
        console.log('🔵 Server object:', server ? 'valid' : 'null/undefined');

        const boundPort = port;

        // Check server address
        const addr = server?.address?.();
        console.log('🔵 Server address:', addr);

        // Add error handler
        server?.on('error', (error: any) => {
            console.error('❌ SERVER ERROR EVENT:', error);
        });

        // Add listening handler
        server?.on('listening', () => {
            console.log('✅ SERVER LISTENING EVENT FIRED');
            console.log('✅ Server address after listening event:', server.address());
        });

        // Check port after short delay
        setTimeout(() => {
            console.log('🔵 [After 500ms] Server address:', server?.address?.());
        }, 500);

        console.log(`✅ HireGoApp Backend running on http://${publicHost}:${boundPort}`);
        console.log(`📚 Swagger docs: http://${publicHost}:${boundPort}/api`);
        if (publicHost !== 'localhost') {
            console.log(`🔗 Local-only access remains available at http://localhost:${boundPort}`);
        }

        const heartbeatEnabled = String(process.env.SERVER_HEARTBEAT_LOG || 'false').toLowerCase() === 'true';
        if (heartbeatEnabled) {
            // Optional keep alive heartbeat for deep debugging sessions.
            setInterval(() => {
                console.log('🟢 Heartbeat - server address:', server?.address?.());
            }, 5000);
        }
    } catch (error) {
        console.error('❌ BOOTSTRAP ERROR:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Extra: Log process exit and beforeExit events for debugging
process.on('exit', (code) => {
    console.log(`🔴 Process exit event with code: ${code}`);
});
process.on('beforeExit', (code) => {
    console.log(`🔴 Process beforeExit event with code: ${code}`);
});

bootstrap()
    .then(() => {
        console.log('🔵 Bootstrap complete');
    })
    .catch((error) => {
        console.error('❌ BOOTSTRAP FAILED:', error);
        if (error && error.stack) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    });
