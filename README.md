# ATS SaaS - Production-Ready Applicant Tracking System

A comprehensive, multi-tenant SaaS platform for modern recruitment companies. Built with NestJS, PostgreSQL, and React for enterprise-grade ATS capabilities.

> **Backend API (one port only):** **`http://localhost:3001`** — details in **[API_URL.md](./API_URL.md)**. The server does not fall back to other ports; free **3001** if startup fails.

## 📋 Documentation Index

This foundation includes the following design documents:

### 1. **[ARCHITECTURE.md](./ARCHITECTURE.md)**
   - High-level system architecture & data flow
   - Multi-tenancy strategy (shared DB with data isolation)
   - Security layers & tenant boundaries
   - Licensing & feature control system
   - Caching & background job strategy
   - Deployment architecture overview

### 2. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)**
   - Complete PostgreSQL schema with 14 tables
   - Entity relationships & constraints
   - JSONB fields for metadata & customization
   - Performance considerations & indexing strategy
   - Soft-delete patterns for audit trails
   - Key design decisions & rationale

### 3. **[CORE_MODULES.md](./CORE_MODULES.md)**
   - 16 core feature modules (Auth, Companies, Users, Candidates, Jobs, Applications, etc.)
   - Module responsibilities & key services
   - Inter-module dependencies
   - DTOs & data structures
   - Cross-cutting concerns (middleware, interceptors, filters)
   - Communication patterns (sync, async, webhooks)

### 4. **[BACKEND_FOLDER_STRUCTURE.md](./BACKEND_FOLDER_STRUCTURE.md)**
   - Complete NestJS project folder structure
   - File organization & naming conventions
   - Module organization pattern
   - Environment variable configuration
   - Development scripts (package.json)
   - Design patterns & best practices

### 5. **[API_ENDPOINTS.md](./API_ENDPOINTS.md)**
   - Complete REST API reference (60+ endpoints)
   - Authentication (register, login, refresh, logout)
   - Companies, Users, Candidates, Jobs management
   - Application workflow & stage transitions
   - Custom fields, Documents, Notifications
   - Analytics, Webhooks, API Keys
   - Pagination, filtering, and sorting standards
   - Rate limiting & error handling

### 6. **[CLOUD_SETUP_STEP_BY_STEP.md](./CLOUD_SETUP_STEP_BY_STEP.md)**
   - Move from on-prem dev to **Azure** (PostgreSQL, Redis, App Service, Static Web Apps)
   - GitHub Actions workflows and required secrets/variables

### 7. **[IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)**
   - 7-phase implementation plan (15 weeks)
   - Phase 1: Foundation & Core Infrastructure (Weeks 1-3)
   - Phase 2: Candidate & Job Management (Weeks 4-6)
   - Phase 3: Applications & Workflow (Weeks 7-9)
   - Phase 4: Notifications & Integrations (Weeks 10-11)
   - Phase 5: Analytics & Reporting (Week 12)
   - Phase 6: Production Readiness (Weeks 13-14)
   - Phase 7: Launch & Post-Launch (Week 15+)
   - Success metrics & risk mitigation

---

## 🏗️ System Architecture Quick Overview

```
┌─────────────────────────────────────────────────────┐
│           Frontend (React + TypeScript)              │
│    Web App | Shared UI Component Library            │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│   API Gateway & Security (Auth, Tenant Validation)  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│     Backend API (NestJS + TypeScript)               │
│  • Auth, Companies, Users, Candidates, Jobs         │
│  • Applications, Pipelines, Custom Fields           │
│  • Documents, Notifications, Webhooks               │
│  • Analytics, Audit Logs, API Keys                  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│   Data Access & Business Logic (Repositories)       │
│  • TypeORM Queries | Caching (Redis)               │
│  • Event Bus | Background Jobs (Bull Queue)        │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         PostgreSQL + Redis Cache                    │
└─────────────────────────────────────────────────────┘

External: Email (SendGrid) | Storage (S3) | Webhooks
```

---

## 🎯 Multi-Tenant Design

### Approach: **Shared Database with Data Isolation**

✅ **Single PostgreSQL database** for all companies  
✅ **company_id** present in every table for isolation  
✅ **Application-level** tenant enforcement (not just DB)  
✅ **Metadata-driven** customization (no schema changes per customer)  
✅ **Row-level security policies** ready for PostgreSQL RLS  

### Security at Every Layer
1. User authenticates → JWT includes `company_id`
2. Every API endpoint validates tenant ownership
3. All database queries filtered by `company_id`
4. Middleware enforces boundaries
5. Audit logs track all access

---

## 📊 Database Overview

### 14 Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **companies** | Tenant data | id, license_tier, feature_flags, settings |
| **users** | Team members | id, company_id, role, permissions |
| **candidates** | Candidate database | id, company_id, email, status, source |
| **jobs** | Job postings | id, company_id, title, pipeline_id, status |
| **applications** | Application tracker | id, job_id, candidate_id, current_stage_id |
| **pipelines** | Recruitment pipelines | id, company_id, name, is_default |
| **pipeline_stages** | Pipeline stages | id, pipeline_id, order_index, is_terminal |
| **custom_fields** | Metadata-driven fields | id, entity_type, field_type, validation_rules |
| **documents** | Resumes & files | id, candidate_id, s3_key, extracted_text |
| **activity_log** | Audit trail | id, entity_type, action_type, old/new_values |
| **notifications** | In-app & email | id, user_id, type, delivery_channels |
| **api_keys** | API access | id, company_id, key_hash, scopes |
| **webhook_subscriptions** | Event subscriptions | id, company_id, event_type, webhook_url |
| **webhook_logs** | Delivery tracking | id, subscription_id, status_code, payload |

### JSONB Customization Fields
- `companies.feature_flags` - License-based features
- `companies.settings` - Company preferences
- `custom_fields.validation_rules` - Dynamic validation
- `applications.custom_fields` - Tenant-specific data
- `users.permissions` - Fine-grained RBAC

---

## 🔐 Security Foundation

### Authentication & Authorization
- ✅ JWT-based authentication with refresh tokens
- ✅ Role-based access control (admin, recruiter, hiring_manager, viewer)
- ✅ Fine-grained permission system
- ✅ API key management for integrations
- ✅ Tenant isolation enforcement at every layer

### Data Protection
- ✅ Encryption for sensitive fields (passwords, API keys)
- ✅ Soft deletes for audit trails & recovery
- ✅ Immutable activity logs with before/after values
- ✅ Rate limiting & DDoS protection
- ✅ SQL injection prevention (TypeORM parameterized queries)

### Compliance Ready
- ✅ GDPR: Right to be forgotten, data export
- ✅ SOC 2: Audit logs, access controls
- ✅ Data retention policies
- ✅ HIPAA-ready encryption (if healthcare candidate data)

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 13+
- **Cache**: Redis
- **ORM**: TypeORM
- **Authentication**: JWT + Passport.js
- **Job Queue**: Bull (Redis-backed)
- **Logging**: Winston
- **Email**: SendGrid
- **Storage**: AWS S3
- **Testing**: Jest + Supertest
- **API Docs**: Swagger/OpenAPI

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Orchestration**: Docker Compose (MVP), Kubernetes (scale)
- **Infrastructure**: AWS (RDS, ElastiCache, S3, Route53)

### Monitoring
- **Error Tracking**: Sentry (optional)
- **Metrics**: Prometheus + Grafana (optional)
- **Logging**: ELK Stack (optional)
- **APM**: Datadog (optional)

---

## 🚀 Quick Start (Development)

### Prerequisites
```bash
# Required
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 13+ (or use Docker)
- Redis (or use Docker)
```

### Environment Setup
```bash
# Clone repository
git clone <repo-url> ats-backend
cd ats-backend

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your config
vi .env.local
```

### Start Development
```bash
# Start databases & Redis
docker-compose up -d

# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Seed test data
npm run seed

# API only (watch mode)
npm run dev

# API + Business UI + Super Admin UI (recommended)
npm run dev:full
```

**Ports:** API **`http://localhost:3001`** · Business **`http://localhost:5180/login`** · Super Admin **`http://localhost:5174/login`** — see **[API_URL.md](./API_URL.md)**.

**Verify DB + API + both portals (with servers running):** `npm run smoke:dev`

**Default logins (if seeds were run):** Tenant **`demo.admin@dummy.com` / `DemoPass@123`** · Super Admin **`admin@ats.com` / `ChangeMe@123`**

### Testing
```bash
# Unit tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:cov

# E2E tests
npm run test:e2e
```

---

## 📈 Key Features (MVP)

### Company Management
- ✅ Multi-tenant architecture
- ✅ License tier management (basic, premium, enterprise)
- ✅ Custom feature flags
- ✅ Company settings & preferences
- ✅ User team management with roles

### Recruitment Workflow
- ✅ Candidate database with full profiles
- ✅ Job postings & management
- ✅ Customizable recruitment pipelines
- ✅ Application tracking through pipeline stages
- ✅ Candidate ratings & evaluations
- ✅ Interview scheduling & tracking

### Customization
- ✅ Custom fields per entity (candidates, jobs, applications)
- ✅ Custom pipeline stages per company
- ✅ Role-based field visibility
- ✅ Metadata-driven (no schema changes)

### Integration & Extension
- ✅ REST API for all features
- ✅ API key management
- ✅ Webhook events & subscriptions
- ✅ Background job processing
- ✅ Email notifications

### Analytics & Reporting
- ✅ Recruitment funnel metrics
- ✅ Time-to-hire calculations
- ✅ Source effectiveness analysis
- ✅ Recruiter performance tracking
- ✅ Export reports (CSV, PDF)

### Compliance & Audit
- ✅ Immutable audit trail
- ✅ Activity logging (who, what, when, where)
- ✅ Data retention policies
- ✅ Soft deletes with recovery
- ✅ GDPR compliance framework

---

## 🗺️ Future Enhancements (Post-MVP)

### Phase 2+
- [ ] React web application UI
- [ ] Mobile app (iOS/Android)
- [ ] Advanced AI features (resume screening, skill matching)
- [ ] Video interviewing integration
- [ ] Integration with LinkedIn, job boards
- [ ] Calendar integration (Google, Outlook)
- [ ] Advanced automation workflows
- [ ] White-label platform
- [ ] SSO integration (Google, Azure, Okta)
- [ ] Advanced analytics dashboards
- [ ] Offer letter generation
- [ ] Background check integration
- [ ] Multi-language support

---

## 📝 Core Modules (16 Total)

1. **Auth & Multi-Tenancy** - Authentication, tenant isolation, RBAC
2. **Companies** - Tenant management, licensing, settings
3. **Users** - Team member management, roles, permissions
4. **Candidates** - Candidate database, profiles, deduplication
5. **Jobs** - Job postings, templates, analytics
6. **Applications** - Application tracking, stage management
7. **Pipelines** - Customizable recruitment pipelines
8. **Custom Fields** - Metadata-driven field customization
9. **Documents** - Resume upload, storage, parsing
10. **Notifications** - In-app & email notifications
11. **Audit & Logging** - Immutable activity trail
12. **Analytics** - Recruitment metrics & reporting
13. **Webhooks** - Event subscriptions & integrations
14. **API Keys** - Third-party API access
15. **Search** (Future) - Full-text search & filtering
16. **Health & Monitoring** - System health checks

---

## 🔗 API Reference

60+ REST endpoints covering:
- **Authentication** (login, register, refresh, logout)
- **Companies** (profile, settings, license)
- **Users** (team management, roles, permissions)
- **Candidates** (CRUD, search, bulk import)
- **Jobs** (CRUD, templates, analytics)
- **Applications** (tracking, stage transitions, evaluations)
- **Pipelines** (customization, stages)
- **Custom Fields** (field definitions, validation)
- **Documents** (upload, download, parsing)
- **Notifications** (send, receive, preferences)
- **Analytics** (funnel, metrics, reports)
- **Webhooks** (subscriptions, delivery)
- **API Keys** (generation, rotation)

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete reference.

---

## 📊 Implementation Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| **1** | Weeks 1-3 | Foundation & Infrastructure |
| **2** | Weeks 4-6 | Candidate & Job Management |
| **3** | Weeks 7-9 | Applications & Workflow |
| **4** | Weeks 10-11 | Notifications & Integrations |
| **5** | Week 12 | Analytics & Reporting |
| **6** | Weeks 13-14 | Production Readiness |
| **7** | Week 15+ | Launch & Support |

**Estimated MVP**: 14-15 weeks with 3-4 person team

---

## 🎓 Best Practices Included

### Architecture
- ✅ Clean separation of concerns (controller → service → repository)
- ✅ Dependency injection throughout
- ✅ Multi-layered security
- ✅ Metadata-driven design for flexibility
- ✅ Async processing with job queues
- ✅ Comprehensive error handling

### Code Quality
- ✅ TypeScript for type safety
- ✅ ESLint + Prettier for code standards
- ✅ Jest for unit/integration testing
- ✅ Structured logging with Winston
- ✅ API documentation with Swagger
- ✅ Comprehensive comments & docstrings

### Database
- ✅ Normalized schema with proper constraints
- ✅ Strategic indexing for performance
- ✅ Soft deletes for audit trails
- ✅ Connection pooling ready
- ✅ Migration management with TypeORM
- ✅ Seed data for testing

### DevOps
- ✅ Docker containerization
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Environment-based configuration
- ✅ Database migration automation
- ✅ Deployment ready (Docker/Kubernetes)

---

## 🤝 Contributing

This is a foundation document. To implement:

1. **Read the documentation** in order (Architecture → Schema → Modules → Structure → Roadmap)
2. **Set up development environment** following Backend Folder Structure
3. **Follow the implementation roadmap** phase by phase
4. **Write tests** as you build each module
5. **Document your changes** in API endpoints

---

## 📞 Support & Questions

- Refer to the detailed documentation files for answers
- Each document has a specific purpose and comprehensive details
- Cross-references between documents guide implementation
- Use the roadmap to stay on track during development

---

## 📄 License

This architecture and documentation is for your SaaS ATS project. Customize as needed for your specific requirements.

---

## 🎯 Success Checklist

Before going to production:

- [ ] All 14 database tables created & tested
- [ ] 16 core modules implemented with tests
- [ ] 60+ API endpoints working & documented
- [ ] Multi-tenant isolation verified & tested
- [ ] Security audit completed (0 critical vulnerabilities)
- [ ] Performance optimization done (< 100ms response time)
- [ ] Monitoring & alerting set up
- [ ] Disaster recovery plan in place
- [ ] Customer support process ready
- [ ] Complete documentation & training materials

---

## 🚀 Ready to Build?

Start with **Phase 1** in the [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md).

This foundation provides everything needed to build a production-ready, enterprise-grade ATS SaaS platform. Good luck! 🎉

