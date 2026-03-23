# ATS SaaS - Backend Folder Structure & Setup Guide

## Project Root Structure

```
ats-backend/
├── src/
│   ├── main.ts                      # Application entry point
│   ├── app.module.ts                # Root module
│   ├── app.controller.ts            # Health check endpoints
│   ├── app.service.ts
│   │
│   ├── common/                      # Shared utilities & infrastructure
│   │   ├── decorators/              # Custom decorators
│   │   │   ├── tenant.decorator.ts
│   │   │   ├── auth.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── permissions.decorator.ts
│   │   │
│   │   ├── filters/                 # Global exception filters
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── tenant-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   │
│   │   ├── guards/                  # Route guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── tenant.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── permissions.guard.ts
│   │   │   └── license.guard.ts
│   │   │
│   │   ├── interceptors/            # Request/response interceptors
│   │   │   ├── audit.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   ├── cache.interceptor.ts
│   │   │   └── correlation-id.interceptor.ts
│   │   │
│   │   ├── middleware/              # Express middleware
│   │   │   ├── tenant.middleware.ts
│   │   │   ├── logging.middleware.ts
│   │   │   ├── rate-limit.middleware.ts
│   │   │   └── error-handler.middleware.ts
│   │   │
│   │   ├── pipes/                   # Validation pipes
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-uuid.pipe.ts
│   │   │
│   │   ├── utils/                   # Helper functions
│   │   │   ├── tenant.utils.ts
│   │   │   ├── crypto.utils.ts
│   │   │   ├── date.utils.ts
│   │   │   ├── string.utils.ts
│   │   │   └── validation.utils.ts
│   │   │
│   │   ├── constants/               # Application constants
│   │   │   ├── messages.constants.ts
│   │   │   ├── error-codes.constants.ts
│   │   │   ├── roles.constants.ts
│   │   │   └── permissions.constants.ts
│   │   │
│   │   ├── types/                   # TypeScript type definitions
│   │   │   ├── index.ts
│   │   │   ├── tenant-context.type.ts
│   │   │   ├── jwt-payload.type.ts
│   │   │   └── api-response.type.ts
│   │   │
│   │   ├── config/                  # Configuration management
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   ├── storage.config.ts
│   │   │   └── env.validation.ts
│   │   │
│   │   └── dto/                     # Global DTOs
│   │       ├── paginated.response.dto.ts
│   │       ├── api-response.dto.ts
│   │       └── error-response.dto.ts
│   │
│   ├── database/                    # Database layer
│   │   ├── migrations/              # TypeORM migrations
│   │   │   ├── 1_create_companies.ts
│   │   │   ├── 2_create_users.ts
│   │   │   ├── 3_create_jobs.ts
│   │   │   └── ... (more migrations)
│   │   │
│   │   ├── seeds/                   # Database seeding (dev/test)
│   │   │   ├── seed.ts
│   │   │   ├── companies.seed.ts
│   │   │   ├── users.seed.ts
│   │   │   └── jobs.seed.ts
│   │   │
│   │   └── queries/                 # Complex queries/views (optional)
│   │       └── analytics.queries.ts
│   │
│   ├── modules/                     # Feature modules
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.service.ts
│   │   │   ├── password.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts (auth-specific)
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   └── jwt-payload.dto.ts
│   │   │   └── tests/
│   │   │       ├── auth.service.spec.ts
│   │   │       ├── auth.controller.spec.ts
│   │   │       └── auth.e2e.spec.ts
│   │   │
│   │   ├── companies/
│   │   │   ├── companies.module.ts
│   │   │   ├── companies.controller.ts
│   │   │   ├── companies.service.ts
│   │   │   ├── entities/
│   │   │   │   └── company.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-company.dto.ts
│   │   │   │   ├── update-company.dto.ts
│   │   │   │   ├── company-settings.dto.ts
│   │   │   │   └── company.response.dto.ts
│   │   │   ├── repositories/
│   │   │   │   └── company.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── license.service.ts
│   │   │   │   ├── settings.service.ts
│   │   │   │   └── onboarding.service.ts
│   │   │   └── tests/
│   │   │       ├── companies.service.spec.ts
│   │   │       └── companies.controller.spec.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   ├── user-profile.dto.ts
│   │   │   │   └── user.response.dto.ts
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── user-invitation.service.ts
│   │   │   │   ├── role.service.ts
│   │   │   │   └── permission.service.ts
│   │   │   └── tests/
│   │   │       └── users.service.spec.ts
│   │   │
│   │   ├── candidates/
│   │   │   ├── candidates.module.ts
│   │   │   ├── candidates.controller.ts
│   │   │   ├── candidates.service.ts
│   │   │   ├── entities/
│   │   │   │   └── candidate.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-candidate.dto.ts
│   │   │   │   ├── update-candidate.dto.ts
│   │   │   │   ├── candidate-profile.dto.ts
│   │   │   │   ├── candidate-search.dto.ts
│   │   │   │   └── candidate.response.dto.ts
│   │   │   ├── repositories/
│   │   │   │   └── candidate.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── candidate-search.service.ts
│   │   │   │   ├── candidate-deduplication.service.ts
│   │   │   │   └── candidate-bulk-import.service.ts
│   │   │   └── tests/
│   │   │       └── candidates.service.spec.ts
│   │   │
│   │   ├── jobs/
│   │   │   ├── jobs.module.ts
│   │   │   ├── jobs.controller.ts
│   │   │   ├── jobs.service.ts
│   │   │   ├── entities/
│   │   │   │   └── job.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-job.dto.ts
│   │   │   │   ├── update-job.dto.ts
│   │   │   │   ├── job-detail.dto.ts
│   │   │   │   └── job.response.dto.ts
│   │   │   ├── repositories/
│   │   │   │   └── job.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── job-template.service.ts
│   │   │   │   └── job-analytics.service.ts
│   │   │   └── tests/
│   │   │       └── jobs.service.spec.ts
│   │   │
│   │   ├── applications/
│   │   │   ├── applications.module.ts
│   │   │   ├── applications.controller.ts
│   │   │   ├── applications.service.ts
│   │   │   ├── entities/
│   │   │   │   └── application.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-application.dto.ts
│   │   │   │   ├── update-application.dto.ts
│   │   │   │   ├── move-application.dto.ts
│   │   │   │   ├── application-filter.dto.ts
│   │   │   │   └── application.response.dto.ts
│   │   │   ├── repositories/
│   │   │   │   └── application.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── application-stage.service.ts
│   │   │   │   ├── interview.service.ts
│   │   │   │   ├── evaluation.service.ts
│   │   │   │   └── application-bulk-action.service.ts
│   │   │   └── tests/
│   │   │       └── applications.service.spec.ts
│   │   │
│   │   ├── pipelines/
│   │   │   ├── pipelines.module.ts
│   │   │   ├── pipelines.controller.ts
│   │   │   ├── pipelines.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── pipeline.entity.ts
│   │   │   │   └── pipeline-stage.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-pipeline.dto.ts
│   │   │   │   ├── update-pipeline.dto.ts
│   │   │   │   ├── create-stage.dto.ts
│   │   │   │   ├── update-stage.dto.ts
│   │   │   │   └── pipeline.response.dto.ts
│   │   │   ├── repositories/
│   │   │   │   ├── pipeline.repository.ts
│   │   │   │   └── pipeline-stage.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── pipeline-stage.service.ts
│   │   │   │   └── pipeline-validation.service.ts
│   │   │   └── tests/
│   │   │       └── pipelines.service.spec.ts
│   │   │
│   │   ├── custom-fields/
│   │   │   ├── custom-fields.module.ts
│   │   │   ├── custom-fields.controller.ts
│   │   │   ├── custom-fields.service.ts
│   │   │   ├── entities/
│   │   │   │   └── custom-field.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-custom-field.dto.ts
│   │   │   │   ├── update-custom-field.dto.ts
│   │   │   │   └── custom-field.response.dto.ts
│   │   │   ├── repositories/
│   │   │   │   └── custom-field.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── custom-field-validation.service.ts
│   │   │   │   └── custom-field-render.service.ts
│   │   │   └── tests/
│   │   │       └── custom-fields.service.spec.ts
│   │   │
│   │   ├── documents/
│   │   │   ├── documents.module.ts
│   │   │   ├── documents.controller.ts
│   │   │   ├── documents.service.ts
│   │   │   ├── entities/
│   │   │   │   └── document.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── upload-document.dto.ts
│   │   │   │   └── document-metadata.dto.ts
│   │   │   ├── repositories/
│   │   │   │   └── document.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── document-storage.service.ts
│   │   │   │   ├── document-parsing.service.ts (future)
│   │   │   │   └── document-scanner.service.ts (future)
│   │   │   └── tests/
│   │   │       └── documents.service.spec.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── entities/
│   │   │   │   └── notification.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── send-notification.dto.ts
│   │   │   │   └── notification-preferences.dto.ts
│   │   │   ├── repositories/
│   │   │   │   └── notification.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── email.service.ts
│   │   │   │   ├── notification-template.service.ts
│   │   │   │   └── notification-queue.service.ts
│   │   │   ├── templates/
│   │   │   │   ├── welcome.template.ts
│   │   │   │   ├── application-received.template.ts
│   │   │   │   ├── stage-changed.template.ts
│   │   │   │   └── (more templates)
│   │   │   └── tests/
│   │   │       └── notifications.service.spec.ts
│   │   │
│   │   ├── audit/
│   │   │   ├── audit.module.ts
│   │   │   ├── audit.controller.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── entities/
│   │   │   │   └── activity-log.entity.ts
│   │   │   ├── dto/
│   │   │   │   └── activity-log.response.dto.ts
│   │   │   ├── repositories/
│   │   │   │   └── activity-log.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── audit-query.service.ts
│   │   │   │   └── compliance.service.ts
│   │   │   └── tests/
│   │   │       └── audit.service.spec.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── analytics-filter.dto.ts
│   │   │   │   ├── report-request.dto.ts
│   │   │   │   └── analytics.response.dto.ts
│   │   │   ├── services/
│   │   │   │   ├── report.service.ts
│   │   │   │   └── dashboard.service.ts
│   │   │   └── tests/
│   │   │       └── analytics.service.spec.ts
│   │   │
│   │   ├── webhooks/
│   │   │   ├── webhooks.module.ts
│   │   │   ├── webhooks.controller.ts
│   │   │   ├── webhooks.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── webhook-subscription.entity.ts
│   │   │   │   └── webhook-log.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-webhook.dto.ts
│   │   │   │   ├── webhook-event.dto.ts
│   │   │   │   └── webhook.response.dto.ts
│   │   │   ├── repositories/
│   │   │   │   ├── webhook-subscription.repository.ts
│   │   │   │   └── webhook-log.repository.ts
│   │   │   ├── services/
│   │   │   │   ├── webhook-publisher.service.ts
│   │   │   │   └── webhook-delivery.service.ts
│   │   │   ├── events/
│   │   │   │   ├── webhook.events.ts
│   │   │   │   └── (event handlers)
│   │   │   └── tests/
│   │   │       └── webhooks.service.spec.ts
│   │   │
│   │   ├── api-keys/
│   │   │   ├── api-keys.module.ts
│   │   │   ├── api-keys.controller.ts
│   │   │   ├── api-keys.service.ts
│   │   │   ├── entities/
│   │   │   │   └── api-key.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-api-key.dto.ts
│   │   │   │   ├── rotate-api-key.dto.ts
│   │   │   │   └── api-key.response.dto.ts
│   │   │   ├── repositories/
│   │   │   │   └── api-key.repository.ts
│   │   │   ├── services/
│   │   │   │   └── api-key-validation.service.ts
│   │   │   └── tests/
│   │   │       └── api-keys.service.spec.ts
│   │   │
│   │   └── search/ (future)
│   │       └── ...
│   │
│   ├── shared/                      # Shared services & utilities
│   │   ├── cache/
│   │   │   ├── cache.module.ts
│   │   │   ├── cache.service.ts
│   │   │   └── redis.config.ts
│   │   │
│   │   ├── storage/
│   │   │   ├── storage.module.ts
│   │   │   ├── storage.service.ts      # S3 abstraction
│   │   │   └── s3.config.ts
│   │   │
│   │   ├── email/
│   │   │   ├── email.module.ts
│   │   │   ├── email.service.ts        # SendGrid abstraction
│   │   │   └── sendgrid.config.ts
│   │   │
│   │   ├── queue/
│   │   │   ├── queue.module.ts
│   │   │   ├── queue.service.ts        # Bull Queue abstraction
│   │   │   └── queue.config.ts
│   │   │
│   │   └── events/
│   │       ├── events.module.ts
│   │       └── event.emitter.ts        # Event bus
│   │
│   └── migrations/                  # Database migrations
│       └── ...
│
├── test/                            # Test utilities & fixtures
│   ├── fixtures/
│   │   ├── company.fixture.ts
│   │   ├── user.fixture.ts
│   │   ├── candidate.fixture.ts
│   │   ├── job.fixture.ts
│   │   └── application.fixture.ts
│   │
│   ├── helpers/
│   │   ├── database.helper.ts
│   │   ├── auth.helper.ts
│   │   └── request.helper.ts
│   │
│   └── setup.ts                     # Test configuration
│
├── config/                          # Configuration files
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── env.example                  # Example environment variables
│
├── docker/                          # Docker setup
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .env.example                     # Example environment variables
├── .env.local                       # Local development (git ignored)
├── .env.test                        # Test environment
├── .env.production                  # Production (secrets manager)
│
├── .eslintrc.js                     # ESLint config
├── .prettierrc                      # Prettier config
├── jest.config.js                  # Jest test config
├── tsconfig.json                   # TypeScript config
├── tsconfig.build.json             # TypeScript build config
│
├── package.json
├── package-lock.json
│
├── README.md                        # Setup & documentation
├── ARCHITECTURE.md                  # Architecture guide
├── DATABASE_SCHEMA.md               # Database schema
├── CORE_MODULES.md                  # Modules documentation
├── API_ENDPOINTS.md                 # API documentation
└── DEPLOYMENT.md                    # Deployment guide
```

## Key Design Patterns

### **Module Organization**
Each feature module follows this structure:
- `*.module.ts`: NestJS module with providers, imports, exports
- `*.controller.ts`: HTTP route handlers
- `*.service.ts`: Business logic
- `entities/`: TypeORM entities
- `dto/`: Data transfer objects
- `repositories/`: Data access layer
- `services/`: Additional services (optional)
- `tests/`: Unit, integration, e2e tests

### **Tenant Isolation Enforced Here**
Every repository query includes:
```typescript
// Example
where: {
  companyId: tenantContext.companyId,
  ...otherFilters
}
```

### **Dependency Injection**
```typescript
// Example service injection
constructor(
  private userService: UserService,
  private auditService: AuditService,
  private cacheService: CacheService,
) {}
```

---

## Environment Variables

Create `.env.local` for development:

```bash
# Server
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ats_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=ats_dev
DATABASE_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_key_here_at_least_32_chars
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# AWS S3 (Document Storage)
AWS_REGION=us-east-1
AWS_S3_BUCKET=ats-documents-dev
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# SendGrid (Email)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@ats.local

# External Services
LOG_LEVEL=debug
SENTRY_DSN= # optional

# Feature Flags
ENABLE_SSO=false
ENABLE_AI_FEATURES=false
```

---

## Development Scripts (package.json)

```json
{
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "NODE_ENV=production node dist/main",
    "typeorm": "typeorm",
    "migration:generate": "typeorm migration:generate -n",
    "migration:run": "typeorm migration:run",
    "migration:revert": "typeorm migration:revert",
    "seed": "ts-node src/database/seeds/seed.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint src --ext ts",
    "format": "prettier --write 'src/**/*.ts'"
  }
}
```

---

## Next Steps

1. **Initialize NestJS project** with this structure
2. **Set up PostgreSQL** and Redis locally
3. **Create database migrations** for each table
4. **Implement authentication module** first (auth is blocking for others)
5. **Build core modules** in dependency order (companies → users → candidates → jobs → applications)
6. **Add middleware & guards** for tenant isolation
7. **Write tests** as features are built
8. **Document API endpoints** with Swagger

This foundation provides:
- ✅ Multi-tenant architecture from day one
- ✅ Scalable module organization
- ✅ Tenant isolation at every layer
- ✅ Separation of concerns
- ✅ Easy to test and maintain
- ✅ Ready for scaling

