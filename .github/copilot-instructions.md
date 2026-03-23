# Project Guidelines

## Code Style
- Keep TypeScript/NestJS patterns consistent with existing feature modules under `src/modules/**` and root modules under `src/**`.
- Use DTO validation and Swagger decorators together (`class-validator` + `@nestjs/swagger`) for request contracts.
- Prefer existing response shape used across APIs: `success`, `data`, `message` (and structured error responses).
- Follow existing naming patterns:
  - Entities: `*.entity.ts`
  - DTOs: `*dto.ts`
  - Services: `*.service.ts`
  - Controllers: `*.controller.ts`
  - Repositories: `*.repository.ts`

## Architecture
- Backend is a NestJS monolith with modular boundaries (`src/modules/**`) and shared cross-cutting concerns (`src/common/**`).
- Data layer uses TypeORM + PostgreSQL migrations/seeds (`src/database/**`, `ormconfig.ts`).
- Multi-tenancy is mandatory: tenant context from JWT must flow through middleware/guards and all tenant-scoped queries.
- Frontend is split into two Vite apps:
  - `frontend/business` (business portal)
  - `frontend/super-admin` (super-admin portal)
- For architecture details, use docs instead of re-deriving assumptions:
  - `ARCHITECTURE.md`
  - `BACKEND_FOLDER_STRUCTURE.md`
  - `CORE_MODULES.md`
  - `DATABASE_SCHEMA.md`

## Build and Test
- Install: `npm install`
- Backend dev: `npm run dev`
- Full stack dev (backend + both frontends): `npm run dev:full`
- Check dev ports before starting: `npm run ports:check`
- Build: `npm run build`
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- Lint: `npm run lint`
- Format: `npm run format`
- DB migrations: `npm run migration:run`
- DB seed: `npm run seed`

## Conventions
- API base port is `3001` (see `API_URL.md` and `.env.example`). If backend does not start, check port conflicts first.
- Run migrations before seeds on new or reset environments.
- Keep tenant isolation explicit in code changes (middleware, guards, repository filters).
- Prefer extending existing module patterns over introducing new architecture styles.
- Reuse existing docs and indexes for implementation detail lookups:
  - Setup: `00_READ_ME_FIRST.md`, `MIGRATION_GUIDE_NEW_DEVICE.md`, `BACKEND_SETUP_CHECKLIST.md`
  - API: `API_ENDPOINTS.md`, `API_CONSUMER_GUIDE.md`, `API_TESTING_GUIDE.md`
  - Troubleshooting: `TROUBLESHOOTING_GUIDE.md`

## Environment and Pitfalls
- Required local dependencies: PostgreSQL and (for async jobs/features) Redis.
- Copy `.env.example` to `.env` and provide DB/Redis/JWT values before running migrations.
- Windows PowerShell can fail on `npm.ps1`; use `npm.cmd` when execution policy blocks script execution.
- Keep frontend API base URLs aligned with backend (`http://localhost:3001`) to avoid auth/CORS confusion.
- Some docs may be historical; when docs conflict, prefer current `package.json` scripts and active source code.
