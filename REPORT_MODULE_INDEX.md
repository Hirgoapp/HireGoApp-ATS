# Reports Module Index

## Module Navigation Guide

The Reports module provides read-only analytics for the ATS platform. This index helps you navigate all resources.

---

## 📋 Quick Navigation

### For API Users
- **Quick Start**: [REPORT_QUICK_REFERENCE.md](REPORT_QUICK_REFERENCE.md) - 5-minute overview of all endpoints
- **Full Guide**: [REPORT_MODULE_GUIDE.md](REPORT_MODULE_GUIDE.md) - Comprehensive documentation
- **Code Examples**: [Code Examples Section](#code-examples) - Practical usage patterns

### For Developers
- **Module Setup**: [src/reports/report.module.ts](src/reports/report.module.ts)
- **Controller**: [src/reports/controllers/report.controller.ts](src/reports/controllers/report.controller.ts)
- **Service**: [src/reports/services/report.service.ts](src/reports/services/report.service.ts)
- **DTOs**: [src/reports/dtos/report.dto.ts](src/reports/dtos/report.dto.ts)

### For Architects
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md) - System design overview
- **Database Schema**: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Data relationships
- **Core Modules**: [CORE_MODULES.md](CORE_MODULES.md) - Module dependencies

---

## 📁 File Organization

```
ATS/
├── src/
│   └── reports/
│       ├── report.module.ts ..................... Module configuration & DI
│       ├── controllers/
│       │   └── report.controller.ts ............ 8 GET endpoints (read-only)
│       ├── services/
│       │   └── report.service.ts .............. 8 analytics methods
│       └── dtos/
│           └── report.dto.ts .................. 9 report response types
│
├── REPORT_MODULE_GUIDE.md ....................... Full documentation (detailed)
├── REPORT_QUICK_REFERENCE.md ................... Quick reference (concise)
└── REPORT_MODULE_INDEX.md ...................... This file

```

---

## 🎯 8 Report Types

All reports are read-only, tenant-scoped, and require `reports:read` permission.

| # | Report | Endpoint | Purpose | Query Params |
|---|--------|----------|---------|--------------|
| 1 | Dashboard | `GET /api/v1/reports/dashboard` | Key metrics overview | None |
| 2 | Pipeline Funnel | `GET /api/v1/reports/pipeline/funnel` | Candidate progression | None |
| 3 | Job-Candidate Status | `GET /api/v1/reports/jobs/candidate-status` | Status breakdown by job | None |
| 4 | Job Performance | `GET /api/v1/reports/jobs/performance` | Job-level metrics | None |
| 5 | Recruiter Activity | `GET /api/v1/reports/recruiters/activity` | Recruiter performance | `period` |
| 6 | Interview Metrics | `GET /api/v1/reports/interviews/metrics` | Interview statistics | None |
| 7 | Offer Metrics | `GET /api/v1/reports/offers/metrics` | Offer analytics | None |
| 8 | Time-Series | `GET /api/v1/reports/analytics/timeline` | Trends over time | `fromDate`, `toDate`, `period` |

**See**: [REPORT_QUICK_REFERENCE.md](REPORT_QUICK_REFERENCE.md) for examples

---

## 🔧 Module Architecture

### Dependency Graph

```
ReportModule
    ├── ReportController
    ├── ReportService
    └── Imports:
        ├── CandidateModule
        ├── JobModule
        ├── SubmissionModule
        ├── InterviewModule
        ├── OfferModule
        └── RbacModule
```

### Request Flow

```
Client Request
    ↓
TenantGuard (verify company_id)
    ↓
RoleGuard (verify roles)
    ↓
@Require('reports:read') (verify permission)
    ↓
ReportController.getReport(companyId, ...filters)
    ↓
ReportService.getReport(...) 
    ↓
Query existing repositories (Candidate, Job, Submission, Interview, Offer)
    ↓
Aggregate & calculate KPIs
    ↓
Return ReportDto (company-scoped, secure)
```

### Query Sources

```
Dashboard ────────────────────────────────────┐
                                              │
Pipeline Funnel ──── Submission               │
                     Interview            ┌──→ ReportService
Job-Candidate ────── Job                  │
Job Performance ───── Offer                │
Recruiter Activity ── Candidate           │
Interview Metrics ────────────────────────┘
Offer Metrics ─────────────────────────────┘
Date-Range ────────────────────────────────┘
```

---

## 📖 Documentation Structure

### [REPORT_QUICK_REFERENCE.md](REPORT_QUICK_REFERENCE.md) (Quick Read - ~500 lines)
**Best for**: API users, quick lookup, examples
- Endpoint summary table
- HTTP request/response formats
- Permission requirements
- 8 quick examples (one per report type)
- Error responses
- Response time statistics
- Client code examples (JS, Python, cURL)

### [REPORT_MODULE_GUIDE.md](REPORT_MODULE_GUIDE.md) (Deep Dive - ~600 lines)
**Best for**: Developers, architects, detailed understanding
- Overview and architecture
- Detailed explanation of all 8 reports
- Response structure for each report type
- Use cases for each report
- Service method documentation
- Query optimization tips
- Integration guide
- Performance considerations
- Troubleshooting guide
- Future enhancement ideas

### [REPORT_MODULE_INDEX.md](REPORT_MODULE_INDEX.md) (Navigation - This File)
**Best for**: Finding resources, understanding module structure
- Quick navigation links
- File organization
- Architecture diagrams
- Integration checklist
- Development tasks

---

## 🚀 Getting Started

### Step 1: Import the Module
```typescript
// src/app.module.ts
import { ReportModule } from './reports/report.module';

@Module({
  imports: [
    // ... other modules
    ReportModule,
  ],
})
export class AppModule {}
```

### Step 2: Verify Dependencies
Ensure these modules are imported/available:
- ✅ CandidateModule
- ✅ JobModule
- ✅ SubmissionModule
- ✅ InterviewModule
- ✅ OfferModule
- ✅ RbacModule

### Step 3: Test an Endpoint
```bash
curl -X GET http://localhost:3000/api/v1/reports/dashboard \
  -H "Authorization: Bearer <token>" \
  -H "Company-Id: <company_id>"
```

### Step 4: Grant Permission
Assign `reports:read` permission to users needing access:
```typescript
// In user/role management
user.roles[0].permissions.add('reports:read');
```

---

## 🔐 Security Model

### Authentication
- All endpoints require valid JWT token
- Token provided in `Authorization: Bearer <token>` header

### Authorization
- All endpoints require `reports:read` permission
- Single permission for all report access

### Tenant Scoping
- All queries automatically filtered by `company_id`
- Extracted from request via TenantGuard
- Passed to ReportService
- Applied to all database queries
- Prevents cross-tenant data leakage

### Data Isolation
```
CompanyA ────────────── ReportService ────────────── CompanyA Data Only
                            ↓
                    (WHERE company_id = ?)
CompanyB ────────────────────↓──────────────── CompanyB Data Only
```

---

## 📊 Service Methods (8 Total)

All methods follow async pattern: `async getReport(companyId, ...filters): Promise<ReportDto>`

| # | Method | Params | Returns | Aggregates |
|---|--------|--------|---------|------------|
| 1 | `getDashboardSummary` | companyId | DashboardSummaryDto | All modules |
| 2 | `getPipelineFunnel` | companyId | PipelineFunnelDto | Submission, Candidate |
| 3 | `getJobCandidateStatus` | companyId | JobCandidateStatusReportDto | Job, Submission |
| 4 | `getJobPerformanceReport` | companyId | JobPerformanceReportDto | Job, Submission, Offer |
| 5 | `getRecruiterActivitySummary` | companyId, period | RecruiterActivitySummaryDto | Submission, Candidate |
| 6 | `getInterviewMetrics` | companyId | InterviewMetricsDto | Interview |
| 7 | `getOfferMetrics` | companyId | OfferMetricsDto | Offer |
| 8 | `getDateRangeAnalytics` | companyId, fromDate, toDate, period | DateRangeAnalyticsDto | Submission |

---

## 📦 Response DTOs (9 Total)

All DTOs include `reportDate` field for audit trail.

| DTO | Fields | Purpose |
|-----|--------|---------|
| DashboardSummaryDto | totalJobs, openJobs, totalCandidates, hiredThisMonth, healthScore, etc | Overview |
| PipelineFunnelDto | stages[], conversionRate, avgDaysToHire | Funnel analysis |
| JobCandidateStatusReportDto | jobsWithCandidates[], topPerformingJobs[] | Job breakdown |
| JobPerformanceReportDto | jobs[], fillRate, avgTimeToFill | Job metrics |
| RecruiterActivitySummaryDto | recruiters[], topPerformers[], teamProductivity | Recruiter performance |
| InterviewMetricsDto | rounds[], avgScore, passRates | Interview stats |
| OfferMetricsDto | offersByStatus, acceptanceRate, avgCTC | Offer stats |
| DateRangeAnalyticsDto | data[], period, fromDate, toDate | Time-series |

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Each service method returns correct DTO structure
- [ ] Company scoping verified (no cross-tenant data)
- [ ] Edge cases handled (null values, empty results)
- [ ] Calculations verified (percentages, averages)

### Integration Tests
- [ ] Controller endpoints accessible
- [ ] TenantGuard works (rejects invalid company_id)
- [ ] RoleGuard works (rejects missing reports:read)
- [ ] Response format consistent across all endpoints

### Performance Tests
- [ ] Dashboard response < 500ms
- [ ] Pipeline funnel response < 300ms
- [ ] Job-wise status response < 800ms
- [ ] Time-series response scales with date range

### Security Tests
- [ ] Cross-tenant data leakage prevented
- [ ] Invalid tokens rejected (401)
- [ ] Missing permission rejected (403)
- [ ] SQL injection prevented (QueryBuilder)

---

## 🔄 Integration Points

### Data Flow (Example: Pipeline Funnel)

```
1. Client requests: GET /api/v1/reports/pipeline/funnel
                       ↓
2. TenantGuard extracts: company_id = "company-123"
                       ↓
3. RoleGuard verifies: user.permissions.includes('reports:read')
                       ↓
4. Controller calls: service.getPipelineFunnel("company-123")
                       ↓
5. Service queries:
     - Submission.findAll(company_id) → Get all submissions
     - Group by status → Calculate percentages
     - Calculate conversion rate & avg days
                       ↓
6. Service returns: PipelineFunnelDto with aggregated data
                       ↓
7. Controller returns: { success: true, data: PipelineFunnelDto }
                       ↓
8. Client receives: Pipeline funnel analysis
```

### Dependencies Used

| Module | Used By | Purpose |
|--------|---------|---------|
| CandidateModule | Dashboard, Pipeline | Candidate counts |
| JobModule | Job-wise, Job Performance, Dashboard | Job details, statuses |
| SubmissionModule | All (core data) | Pipeline stages, recruiter attribution |
| InterviewModule | Interview Metrics, Dashboard | Interview data, scores |
| OfferModule | Offer Metrics, Dashboard | Offer statuses, CTC |
| RbacModule | All | Permission validation |

---

## 🚨 Common Issues

### Issue: "reports:read permission not found"
**Solution**: Ensure RBAC module is loaded and permission is created in database

### Issue: No data returned for company
**Solution**: Verify company_id is correct; check if data exists in source modules

### Issue: Slow query performance
**Solution**: Use date range filtering in time-series; implement caching for dashboard

### Issue: Cross-tenant data visible
**Solution**: Verify TenantGuard is active; check company_id extraction

**See**: [REPORT_MODULE_GUIDE.md - Troubleshooting](REPORT_MODULE_GUIDE.md#troubleshooting)

---

## 📋 Implementation Checklist

### Development
- [x] Create DTOs (9 types)
- [x] Create service (8 methods)
- [x] Create controller (8 endpoints)
- [x] Create module (DI setup)
- [x] Create documentation (2 guides)

### Deployment
- [ ] Add ReportModule to AppModule imports
- [ ] Verify all 5 dependencies loaded
- [ ] Create reports:read RBAC permission
- [ ] Grant permission to user roles
- [ ] Test all 8 endpoints

### Monitoring
- [ ] Set up query performance monitoring
- [ ] Alert on slow reports
- [ ] Track permission usage
- [ ] Monitor cross-tenant attempts

### Documentation
- [ ] Link to main README
- [ ] Update API documentation
- [ ] Create admin guide (optional)
- [ ] Create user guide (optional)

---

## 💡 Tips & Best Practices

### Performance
1. **Cache dashboard** - Updates 5-15 minutes
2. **Use date ranges** - Limit time-series queries
3. **Batch requests** - Get multiple reports in sequence
4. **Monitor slow queries** - Set up database logging

### Security
1. **Always verify company_id** - Even though automatic
2. **Audit report access** - Log who accesses sensitive reports
3. **Rate limit** - Prevent abuse of heavy queries
4. **Validate date inputs** - Prevent invalid date ranges

### Reliability
1. **Handle null values** - Edge cases in aggregations
2. **Set timeouts** - Prevent hanging queries
3. **Error logging** - Capture aggregation failures
4. **Graceful degradation** - Return partial data if possible

---

## 🔮 Future Enhancements

Planned additions to Reports module (not in current release):

1. **Custom report builder** - User-defined aggregations
2. **Scheduled reports** - Email delivery on schedule
3. **Report caching** - Redis-based performance optimization
4. **Data export** - CSV, PDF, Excel formats
5. **Advanced filtering** - More granular customization
6. **Predictive analytics** - ML-based forecasting
7. **Comparative analysis** - Year-over-year comparison
8. **Real-time dashboards** - WebSocket updates

---

## 📞 Support

### For Questions About:
- **Specific endpoints**: See [REPORT_QUICK_REFERENCE.md](REPORT_QUICK_REFERENCE.md)
- **Implementation details**: See [REPORT_MODULE_GUIDE.md](REPORT_MODULE_GUIDE.md)
- **System architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Data model**: See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

### Troubleshooting Steps:
1. Check [REPORT_MODULE_GUIDE.md - Troubleshooting](REPORT_MODULE_GUIDE.md#troubleshooting)
2. Verify [implementation checklist](#-implementation-checklist)
3. Review [common issues](#-common-issues)
4. Check server logs for errors

---

## 📝 Version Information

- **Reports Module**: Phase 5E
- **Release Date**: 2024
- **Status**: ✅ Complete
- **Dependencies**: Phase 1-5D (all prior phases)

---

## Related Documentation

- [00_START_HERE.md](00_START_HERE.md) - Project overview
- [README.md](README.md) - Getting started
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [CORE_MODULES.md](CORE_MODULES.md) - Module reference
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Data model
- [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) - Project phases
- [API_ENDPOINTS.md](API_ENDPOINTS.md) - All API endpoints
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Platform quick reference

---

**Last Updated**: 2024  
**Module Status**: ✅ Complete  
**Module Coverage**: 100% (8/8 reports, 8/8 endpoints, all documentation)
