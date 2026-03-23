/**
 * App Module Configuration
 * 
 * This is the main application module that sets up:
 * - JWT configuration
 * - Tenant context middleware
 * - Audit service
 * - Database connections
 * 
 * This is a TEMPLATE showing how to register multi-tenant enforcement
 * in your NestJS application.
 */

import {
    Module,
    MiddlewareConsumer,
    NestModule,
    Logger,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import middleware, services, and other common modules
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { AuditService } from './common/services/audit.service';

// Import feature modules (to be created)
// import { CandidatesModule } from './modules/candidates/candidates.module';
// import { JobsModule } from './modules/jobs/jobs.module';
// import { UsersModule } from './modules/users/users.module';

@Module({
    imports: [
        // 1. Configuration - Load environment variables
        ConfigModule.forRoot({
            global: true,
            envFilePath: '.env'
        }),

        // 2. JWT Configuration - For token signing/verification
        JwtModule.registerAsync({
            global: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET') || 'your-secret-key',
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRES_IN') || '24h',
                },
            }),
        }),

        // 3. Database Configuration - TypeORM with PostgreSQL
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const dbConfig: any = {
                    type: 'postgres',
                    host: configService.get('DB_HOST') || 'localhost',
                    port: configService.get('DB_PORT') || 5432,
                    username: configService.get('DB_USERNAME') || 'postgres',
                    password: configService.get('DB_PASSWORD') || 'password',
                    database: configService.get('DB_NAME') || 'ats_saas',

                    // Entities will be added as modules are created
                    entities: [
                        // 'src/**/*.entity.ts',
                    ],

                    // Migrations
                    migrations: ['src/database/migrations/*.ts'],
                    migrationsTableName: 'migrations',

                    // Do NOT use synchronize in production
                    // Always use migrations instead
                    synchronize: process.env.NODE_ENV === 'development',

                    // Logging
                    logging: process.env.NODE_ENV === 'development',
                    logger: 'advanced-console',
                };
                return dbConfig;
            },
        }),

        // 4. Feature Modules (to be created)
        // Import these as you create feature modules
        // CandidatesModule,
        // JobsModule,
        // UsersModule,
        // ApplicationsModule,
        // PipelinesModule,
    ],

    // 5. Global Providers
    providers: [
        AuditService,  // Make audit service available globally
        Logger,
    ],

    // 6. Export global providers
    exports: [AuditService],
})
export class AppModule implements NestModule {
    private logger = new Logger('AppModule');

    /**
     * Configure middleware
     * 
     * This is where we register the TenantContextMiddleware
     * to extract and validate tenant context from JWT tokens.
     * 
     * CRITICAL: This middleware must run for ALL routes,
     * and it must run BEFORE any route-specific middleware.
     */
    configure(consumer: MiddlewareConsumer) {
        this.logger.debug('Registering TenantContextMiddleware for all routes');

        // Apply middleware to ALL routes
        consumer
            .apply(TenantContextMiddleware)
            .forRoutes('*');  // Wildcard = all routes

        // Log successful registration
        this.logger.log('✅ TenantContextMiddleware registered');
    }
}

/**
 * ENVIRONMENT VARIABLES REQUIRED
 * 
 * Create a .env file with:
 * 
 * # JWT Configuration
 * JWT_SECRET=your-super-secret-key-min-32-chars
 * JWT_EXPIRES_IN=24h
 * 
 * # Database Configuration
 * DB_HOST=localhost
 * DB_PORT=5432
 * DB_USERNAME=ats_user
 * DB_PASSWORD=secure_password
 * DB_NAME=ats_saas
 * 
 * # Application
 * NODE_ENV=development
 * APP_PORT=3000
 * 
 * # Logging
 * LOG_LEVEL=debug
 */

/**
 * DATABASE MIGRATIONS
 * 
 * Run migrations with:
 * 
 *   npm run migration:run
 * 
 * This creates all tables (companies, users, candidates, jobs, applications, etc.)
 * with proper multi-tenant enforcement (company_id foreign keys, indexes, constraints)
 */

/**
 * CREATING FEATURE MODULES
 * 
 * For each entity (Candidate, Job, etc.), create:
 * 
 * 1. Entity (src/modules/candidates/entities/candidate.entity.ts)
 * 2. Repository (src/modules/candidates/repositories/candidate.repository.ts)
 * 3. Service (src/modules/candidates/services/candidate.service.ts)
 * 4. Controller (src/modules/candidates/controllers/candidate.controller.ts)
 * 5. Module (src/modules/candidates/candidates.module.ts)
 * 
 * Then import the module in AppModule above.
 * 
 * Reference: src/common/examples/candidates.controller.example.ts
 */

/**
 * NEXT STEPS
 * 
 * 1. ✅ Multi-tenant enforcement infrastructure created
 * 2. ⏳ Create feature modules (Candidates, Jobs, Users, etc.)
 * 3. ⏳ Create entity services and controllers
 * 4. ⏳ Add integration tests
 * 5. ⏳ Deploy to staging and test multi-tenant isolation
 * 6. ⏳ Deploy to production
 */
