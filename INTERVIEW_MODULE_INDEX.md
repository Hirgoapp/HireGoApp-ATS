# Interview Module - Project Index

## Overview

This document provides a complete index of all files, documentation, and resources for the Interview module implementation for the ATS SaaS platform.

## Table of Contents

1. [Module Files](#module-files)
2. [Documentation](#documentation)
3. [Implementation Details](#implementation-details)
4. [Quick Access Links](#quick-access-links)

---

## Module Files

### Entities (1 file)
- **[interview.entity.ts](src/interviews/entities/interview.entity.ts)** (~120 lines)
  - `Interview` class: Main entity managing interview sessions
  - `InterviewRound` enum: 7 interview round types
  - `InterviewMode` enum: 3 interview modes (online, offline, phone)
  - `InterviewStatus` enum: 5 status values

### Repository (1 file)
- **[interview.repository.ts](src/interviews/repositories/interview.repository.ts)** (~250 lines)
  - 18 methods for data access
  - Advanced filtering by submission, interviewer, round, status, date range
  - Pagination and sorting support
  - Soft delete and company scoping

### Services (1 file)
- **[interview.service.ts](src/interviews/services/interview.service.ts)** (~350 lines)
  - Business logic layer
  - Interview scheduling with duplicate prevention
  - Feedback recording and score validation
  - Status management (schedule, complete, cancel, reschedule)
  - Audit logging integration

### Controllers (1 file)
- **[interview.controller.ts](src/interviews/controllers/interview.controller.ts)** (~280 lines)
  - 10 REST endpoints
  - RBAC guards and permission checks
  - Request/response handling

### DTOs (3 files)
- **[create-interview.dto.ts](src/interviews/dtos/create-interview.dto.ts)** (~25 lines)
  - Input validation for interview scheduling
- **[update-interview.dto.ts](src/interviews/dtos/update-interview.dto.ts)** (~15 lines)
  - Input validation for interview updates
- **[get-interview.dto.ts](src/interviews/dtos/get-interview.dto.ts)** (~30 lines)
  - Response formatting DTO

### Module Configuration (1 file)
- **[interview.module.ts](src/interviews/interview.module.ts)** (~20 lines)
  - Dependency injection setup
  - Module imports and exports

### Database (2 files)
- **[1701000002000-CreateInterviewsTable.ts](src/database/migrations/1701000002000-CreateInterviewsTable.ts)** (~200 lines)
  - Schema for `interviews` table (19 columns)
  - 5 indices for query performance

- **[1701000002000-CreateInterviewsSeeder.ts](src/database/seeds/1701000002000-CreateInterviewsSeeder.ts)** (~160 lines)
  - 8 sample interviews across different rounds and statuses
  - Test data for development and testing

### Documentation (3 files)
- **[INTERVIEW_MODULE_GUIDE.md](INTERVIEW_MODULE_GUIDE.md)** (~500 lines)
  - Complete implementation reference
  - Architecture, API endpoints, DTOs, service methods
  - Integration points and error handling

- **[INTERVIEW_QUICK_REFERENCE.md](INTERVIEW_QUICK_REFERENCE.md)** (~400 lines)
  - Quick API reference with examples
  - Use cases with cURL, JavaScript, Python code
  - Troubleshooting guide and best practices

- **[INTERVIEW_MODULE_IMPLEMENTATION_SUMMARY.md](INTERVIEW_MODULE_IMPLEMENTATION_SUMMARY.md)** (~400 lines)
  - Project completion summary
  - Deliverables checklist
  - Code quality standards and metrics

---

## Documentation

### Primary Documentation
| Document | Purpose | Audience |
|----------|---------|----------|
| [INTERVIEW_MODULE_GUIDE.md](INTERVIEW_MODULE_GUIDE.md) | Complete implementation reference | Developers, Architects |
| [INTERVIEW_QUICK_REFERENCE.md](INTERVIEW_QUICK_REFERENCE.md) | Quick API examples and usage | API Consumers, QA |
| [INTERVIEW_MODULE_IMPLEMENTATION_SUMMARY.md](INTERVIEW_MODULE_IMPLEMENTATION_SUMMARY.md) | Project status and completion | Project Managers, Leads |

### Document Sections Quick Links

**Implementation Guide Sections**:
- [Architecture Overview](INTERVIEW_MODULE_GUIDE.md#architecture)
- [Database Schema](INTERVIEW_MODULE_GUIDE.md#database-schema)
- [API Endpoints](INTERVIEW_MODULE_GUIDE.md#api-endpoints)
- [Key Features](INTERVIEW_MODULE_GUIDE.md#key-features)
- [Service Methods](INTERVIEW_MODULE_GUIDE.md#service-methods)
- [Repository Methods](INTERVIEW_MODULE_GUIDE.md#repository-methods)
- [Integration Points](INTERVIEW_MODULE_GUIDE.md#integration-points)

**Quick Reference Sections**:
- [API Reference Table](INTERVIEW_QUICK_REFERENCE.md#quick-api-reference)
- [Common Use Cases](INTERVIEW_QUICK_REFERENCE.md#common-use-cases)
- [Status Codes & Errors](INTERVIEW_QUICK_REFERENCE.md#status-codes--errors)
- [Database Queries](INTERVIEW_QUICK_REFERENCE.md#database-queries)
- [Environment Setup](INTERVIEW_QUICK_REFERENCE.md#environment-setup)

---

## Implementation Details

### Architecture

```
Controller Layer (10 endpoints)
    ↓
Service Layer (13 methods)
    ↓
Repository Layer (18 methods)
    ↓
Entity Layer (Interview)
    ↓
Database Layer (1 table, 5 indices)
```

### Core Entity

**Interview** (19 columns)
- Identifiers: id, company_id
- Links: submission_id, interviewer_id
- Schedule: scheduled_date, scheduled_time
- Interview Type: round, mode, status
- Location: location, meeting_link
- Feedback: feedback, score, remarks
- Audit: created_by_id, updated_by_id, created_at, updated_at, deleted_at

### API Endpoints

| # | Method | Path | Permission | Purpose |
|---|--------|------|-----------|---------|
| 1 | POST | /api/v1/interviews | interviews:create | Schedule interview |
| 2 | GET | /api/v1/interviews | interviews:read | List interviews |
| 3 | GET | /api/v1/interviews/:id | interviews:read | Get single |
| 4 | PUT | /api/v1/interviews/:id | interviews:update | Update details |
| 5 | PUT | /api/v1/interviews/:id/feedback | interviews:update | Record feedback |
| 6 | PUT | /api/v1/interviews/:id/complete | interviews:update | Mark completed |
| 7 | PUT | /api/v1/interviews/:id/reschedule | interviews:update | Reschedule |
| 8 | PUT | /api/v1/interviews/:id/cancel | interviews:update | Cancel |
| 9 | DELETE | /api/v1/interviews/:id | interviews:delete | Delete |
| 10 | GET | /api/v1/interviews/submission/:id | interviews:read | Get by submission |

### Database Schema

**Interviews Table**
```
Columns: 19
Indices: 5
- id (UUID, PK)
- company_id (UUID, IDX)
- submission_id (UUID)
- interviewer_id (UUID)
- round (ENUM: screening|first|second|third|final|hr|technical)
- scheduled_date (DATE, IDX)
- scheduled_time (TIME)
- mode (ENUM: online|offline|phone)
- status (ENUM: scheduled|completed|cancelled|rescheduled|no_show, IDX)
- feedback (TEXT)
- score (DECIMAL 3.1)
- remarks (TEXT)
- location (TEXT)
- meeting_link (TEXT)
- created_by_id, updated_by_id (UUID)
- created_at, updated_at, deleted_at (TIMESTAMP)
```

### Service Methods

| Method | Purpose | Parameters | Returns |
|--------|---------|-----------|---------|
| schedule | Schedule interview | companyId, userId, DTO | GetInterviewDto |
| getInterview | Get single | companyId, interviewId | GetInterviewDto |
| getInterviews | List with filtering | companyId, options | {data: [], total} |
| recordFeedback | Record feedback/score | companyId, interviewId, userId, feedback, score | GetInterviewDto |
| markCompleted | Mark as completed | companyId, interviewId, userId | GetInterviewDto |
| reschedule | Reschedule date/time | companyId, interviewId, userId, date, time | GetInterviewDto |
| cancel | Cancel with reason | companyId, interviewId, userId, reason | GetInterviewDto |
| update | Update fields | companyId, interviewId, userId, DTO | GetInterviewDto |
| delete | Soft delete | companyId, interviewId, userId | void |
| getCount | Total count | companyId | number |
| getCountByRound | Count by round | companyId, round | number |
| getCountByStatus | Count by status | companyId, status | number |
| getInterviewsBySubmission | Get all for submission | companyId, submissionId | GetInterviewDto[] |

### Integration Points

| Module | Purpose | Methods Used |
|--------|---------|--------------|
| AuditService | Logging | log |
| RbacModule | Permissions | role guard, decorators |
| TenantModule | Multi-tenancy | company_id extraction |

### File Statistics

| Component | Files | Lines | Key Counts |
|-----------|-------|-------|-----------|
| Entities | 1 | 120 | 1 class, 3 enums, 5 indices |
| Repository | 1 | 250 | 18 methods |
| Service | 1 | 350 | 13 methods |
| Controller | 1 | 280 | 10 endpoints |
| DTOs | 3 | 70 | 3 validation classes |
| Module | 1 | 20 | DI setup |
| Migration | 1 | 200 | 1 table, 5 indices |
| Seeder | 1 | 160 | 8 samples |
| **Total Code** | **10** | **1,450** | |
| Documentation | 3 | **1,300+** | |
| **Grand Total** | **13** | **2,750+** | |

---

## Quick Access Links

### By Use Case

**I want to...**

- **Schedule an interview**: See [Use Case 1](INTERVIEW_QUICK_REFERENCE.md#use-case-1-schedule-phone-screening)
- **Record feedback and score**: See [Use Case 3](INTERVIEW_QUICK_REFERENCE.md#use-case-3-record-interview-feedback-and-score)
- **Reschedule an interview**: See [Use Case 5](INTERVIEW_QUICK_REFERENCE.md#use-case-5-reschedule-interview)
- **Cancel an interview**: See [Use Case 6](INTERVIEW_QUICK_REFERENCE.md#use-case-6-cancel-interview)
- **Get interviewer's schedule**: See [Use Case 8](INTERVIEW_QUICK_REFERENCE.md#use-case-8-get-interviewers-schedule)
- **Analyze interview pipeline**: See [Query Examples](INTERVIEW_QUICK_REFERENCE.md#high-performance-queries)

### By Role

**Backend Developer**
1. Read [INTERVIEW_MODULE_GUIDE.md](INTERVIEW_MODULE_GUIDE.md#architecture)
2. Study [Entity Layer](src/interviews/entities/interview.entity.ts)
3. Review [Service Layer](src/interviews/services/interview.service.ts)
4. Check [Integration Points](INTERVIEW_MODULE_GUIDE.md#integration-points)

**API Consumer**
1. Start with [API Reference Table](INTERVIEW_QUICK_REFERENCE.md#quick-api-reference)
2. Find relevant [Use Case](INTERVIEW_QUICK_REFERENCE.md#common-use-cases)
3. Copy code example (cURL, JS, Python)
4. Refer to [Error Handling](INTERVIEW_QUICK_REFERENCE.md#status-codes--errors) if needed

**QA / Tester**
1. Review [Permissions Matrix](INTERVIEW_MODULE_GUIDE.md#permissions-matrix)
2. Study [Seeded Test Data](src/database/seeds/1701000002000-CreateInterviewsSeeder.ts)
3. Check [Error Examples](INTERVIEW_QUICK_REFERENCE.md#common-error-examples)
4. Follow [Testing Considerations](INTERVIEW_MODULE_GUIDE.md#testing-considerations)

**DevOps / DBA**
1. Check [Migration File](src/database/migrations/1701000002000-CreateInterviewsTable.ts)
2. Review [Database Schema](INTERVIEW_MODULE_GUIDE.md#database-schema)
3. See [Environment Setup](INTERVIEW_QUICK_REFERENCE.md#environment-setup)
4. Check [Deployment Checklist](INTERVIEW_MODULE_IMPLEMENTATION_SUMMARY.md#deployment-checklist)

### By Technical Topic

**Database**
- [Schema Design](INTERVIEW_MODULE_GUIDE.md#database-schema)
- [Indices Strategy](INTERVIEW_MODULE_GUIDE.md#database-schema)
- [Migration File](src/database/migrations/1701000002000-CreateInterviewsTable.ts)
- [SQL Query Examples](INTERVIEW_QUICK_REFERENCE.md#high-performance-queries)

**API Design**
- [Endpoint Listing](INTERVIEW_MODULE_GUIDE.md#api-endpoints)
- [Request/Response Examples](INTERVIEW_QUICK_REFERENCE.md#common-use-cases)
- [Error Handling](INTERVIEW_QUICK_REFERENCE.md#status-codes--errors)
- [Filtering & Pagination](INTERVIEW_MODULE_GUIDE.md#advanced-filtering)

**Security & Multi-Tenancy**
- [Tenant Isolation](INTERVIEW_MODULE_GUIDE.md#1-tenant-isolation)
- [RBAC Integration](INTERVIEW_MODULE_GUIDE.md#integration-points)
- [Permissions Matrix](INTERVIEW_MODULE_GUIDE.md#permissions-matrix)
- [Guards & Decorators](src/interviews/controllers/interview.controller.ts)

**Audit & Compliance**
- [Audit Logging](INTERVIEW_MODULE_GUIDE.md#7-audit-logging)
- [Soft Deletes](INTERVIEW_MODULE_GUIDE.md#8-soft-deletes)
- [AuditService Integration](src/interviews/services/interview.service.ts)

**Data Validation**
- [DTO Definitions](INTERVIEW_MODULE_GUIDE.md#dto-definitions)
- [Validation Rules](src/interviews/dtos/create-interview.dto.ts)
- [Score Validation](INTERVIEW_QUICK_REFERENCE.md#score-interpretation)

**Interview Management**
- [Interview Rounds](INTERVIEW_QUICK_REFERENCE.md#interview-round-types)
- [Interview Modes](INTERVIEW_QUICK_REFERENCE.md#interview-mode-selection)
- [Status Transitions](INTERVIEW_MODULE_GUIDE.md#5-interview-status-tracking)

---

## File Organization

```
ATS/
├── src/interviews/
│   ├── entities/
│   │   └── interview.entity.ts ................... Domain models
│   ├── repositories/
│   │   └── interview.repository.ts .............. Data access
│   ├── services/
│   │   └── interview.service.ts ................. Business logic
│   ├── controllers/
│   │   └── interview.controller.ts ............. REST endpoints
│   ├── dtos/
│   │   ├── create-interview.dto.ts .............. Input validation
│   │   ├── update-interview.dto.ts .............. Update validation
│   │   └── get-interview.dto.ts ................. Response DTO
│   └── interview.module.ts ....................... Module config
│
├── src/database/
│   ├── migrations/
│   │   └── 1701000002000-CreateInterviewsTable.ts  Schema
│   └── seeds/
│       └── 1701000002000-CreateInterviewsSeeder.ts Test data
│
└── [Root]
    ├── INTERVIEW_MODULE_GUIDE.md ................ Complete reference
    ├── INTERVIEW_QUICK_REFERENCE.md ............ Quick examples
    ├── INTERVIEW_MODULE_IMPLEMENTATION_SUMMARY.md  Project status
    └── INTERVIEW_MODULE_INDEX.md ............... This file
```

---

## Key Metrics Summary

| Metric | Value |
|--------|-------|
| **Total Files** | 13 |
| **Code Files** | 10 |
| **Documentation Files** | 3 |
| **Total Lines** | 2,750+ |
| **Production Code** | ~1,450 lines |
| **Documentation** | ~1,300 lines |
| **Database Tables** | 1 |
| **Database Indices** | 5 |
| **Entity Columns** | 19 |
| **Repository Methods** | 18 |
| **Service Methods** | 13 |
| **Controller Endpoints** | 10 |
| **DTOs** | 3 |
| **Test Records** | 8 |
| **RBAC Permissions** | 4 |
| **Interview Rounds** | 7 |
| **Interview Modes** | 3 |
| **Interview Statuses** | 5 |

---

## Status

✅ **Implementation**: COMPLETE (100%)  
✅ **Documentation**: COMPLETE (100%)  
✅ **Testing Data**: COMPLETE (8 samples)  
✅ **Production Ready**: YES  

---

## Related Modules

- [Submission Module](SUBMISSION_MODULE_GUIDE.md) - Interview links to submissions
- [Candidate Module](../CANDIDATE_MODULE_GUIDE.md) - Candidates referenced through submissions
- [Job Module](../JOB_MODULE_GUIDE.md) - Jobs referenced through submissions
- [RBAC & Authentication](../RBAC_IMPLEMENTATION_GUIDE.md) - Permission checking
- [Audit Module](../AUDIT_IMPLEMENTATION_GUIDE.md) - Logging and compliance

---

**Last Updated**: December 2025  
**Version**: 1.0  
**Status**: Production Ready  

For issues or questions, refer to the relevant documentation file listed above.
