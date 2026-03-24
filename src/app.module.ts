import { Module, Logger, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { CandidateModule } from './candidate/candidate.module';
import { JobModule } from './modules/jobs/job.module'; // Updated to use multi-tenant version
import { MatchingModule } from './modules/matching/matching.module';
import { SubmissionModule } from './modules/submissions/submission.module'; // Updated to use multi-tenant version
import { InterviewsModule } from './modules/interviews/interviews.module';
import { OffersModule } from './modules/offers/offers.module';
import { ClientModule } from './modules/clients/client.module';
import { SourceModule } from './modules/sources/source.module';
import { LocationModule } from './modules/locations/location.module';
import { SkillsModule } from './modules/skills/skills.module';
import { EducationModule } from './modules/education/education.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
// import { EvaluationsModule } from './modules/interviews/evaluations.module'; // TEMP disabled – depends on WebhooksModule
import { ApplicationsModule } from './modules/applications/applications.module';
// import { NotificationsModule } from './modules/notifications/notifications.module'; // TEMP disabled – depends on EmailModule
// import { EmailModule } from './modules/email/email.module'; // TEMP disabled – depends on MetricsModule
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
// import { ReportModule } from './reports/report.module'; // Disabled - legacy multi-tenant code
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { LicensingModule } from './licensing/licensing.module';
import { RbacModule } from './rbac/rbac.module';
import { CommonModule } from './common/common.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AsyncJobsModule } from './modules/async-jobs/async-jobs.module';
import { AiModule } from './modules/ai/ai.module';
import { SearchModule } from './modules/search/search.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { RootController } from './root.controller';
import { DebugModule } from './debug/debug.module';
import { SettingsModule } from './settings/settings.module';
import { ActivityModule } from './activity/activity.module';
import { AuditModule } from './audit/audit.module';
import { FilesModule } from './files/files.module';
import { FeaturesModule } from './features/features.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { GlobalSearchModule } from './search/search.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60,
                limit: 120,
            },
        ]),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const dbLogging = String(configService.get<string>('DB_LOGGING', 'false')).toLowerCase() === 'true';

                return {
                    type: 'postgres' as const,
                    host: configService.get<string>('DB_HOST', '127.0.0.1'),
                    port: configService.get<number>('DB_PORT', 5432),
                    username: configService.get<string>('DB_USERNAME', 'postgres'),
                    password: configService.get<string>('DB_PASSWORD', ''),
                    database: configService.get<string>('DB_DATABASE', 'ats_saas'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
                    synchronize: false,
                    logging: dbLogging,
                    ssl: process.env.DB_SSL === 'true'
                        ? { rejectUnauthorized: false }
                        : false,
                };
            },
        }),
        JwtModule.registerAsync({
            global: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET') || 'dev-secret-key',
                signOptions: {
                    expiresIn: '24h',
                },
            }),
        }),
        // Core modules only for auth testing
        CommonModule,
        AuthModule,
        RbacModule,
        SuperAdminModule,
        HealthModule,
        DebugModule,
        SettingsModule,
        ActivityModule,
        AuditModule,
        FilesModule,
        FeaturesModule,
        IntegrationsModule,
        GlobalSearchModule,
        CandidateModule,
        // Business modules
        JobModule,
        MatchingModule,
        ClientModule,
        SubmissionModule,
        InterviewsModule,
        OffersModule,
        DashboardModule,
        ApiKeysModule,
        WebhooksModule,
    ],
    controllers: [RootController],
    providers: [
        Logger,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(TenantContextMiddleware)
            .exclude(
                // Browser opens / without Authorization — show API index, not MissingAuthToken
                { path: '/', method: RequestMethod.GET },
                { path: '/', method: RequestMethod.HEAD },
                // Exclude super-admin routes from tenant middleware
                'api/super-admin/(.*)',
                // Exclude public auth routes
                'api/v1/auth/login',
                'api/v1/auth/refresh',
                // Exclude OAuth callbacks (provider will not send our JWT)
                'api/v1/integrations/oauth/google/callback',
                'api/v1/integrations/oauth/microsoft/callback',
                // Exclude Swagger docs
                'api',
                'api-json',
                // Exclude health endpoints
                'health',
                'readiness',
                'version',
                // Exclude metrics endpoint
                'metrics',
            )
            .forRoutes('*');
    }
}
