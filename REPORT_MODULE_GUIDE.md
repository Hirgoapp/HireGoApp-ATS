# Reports Module Guide

## Overview

The Reports module provides read-only analytics and reporting APIs for the ATS platform. All endpoints return aggregated data from existing modules (Candidate, Job, Submission, Interview, Offer) without creating separate data structures.

### Key Features

- **Read-only analytics**: GET endpoints only, no mutations
- **Tenant-scoped**: All queries filtered by company_id
- **RBAC protected**: Single `reports:read` permission for all endpoints
- **8 distinct report types**: Cover all critical recruitment metrics
- **Date-range support**: Time-series analytics with custom periods
- **KPI calculations**: Percentages, conversion rates, averages calculated at query time

### Architecture

```
ReportService (8 analytics methods)
    ↓
Queries from existing repositories:
    - CandidateRepository
    - JobRepository
    - SubmissionRepository
    - InterviewRepository
    - OfferRepository
```

## Report Types

### 1. Dashboard Summary
**Endpoint**: `GET /api/v1/reports/dashboard`

High-level overview of recruitment metrics. Shows key performance indicators at a glance.

**Response Structure**:
```typescript
{
  totalJobs: number;           // Total job openings
  openJobs: number;            // Currently open positions
  filledJobs: number;          // Positions filled
  totalCandidates: number;     // Total candidates in system
  activeCandidates: number;    // Candidates in active pipeline
  hiredThisMonth: number;      // Candidates hired this month
  hiredThisYear: number;       // Candidates hired this year
  totalRecruiters: number;     // Number of recruiters
  avgTimeToHire: number;       // Average days from sourcing to hiring
  pipelineHealthScore: number; // Health score (0-100)
  reportDate: Date;
}
```

**Use Cases**:
- Executive dashboard
- Quick health check
- Monthly performance review
- Hiring trend analysis

---

### 2. Pipeline Funnel
**Endpoint**: `GET /api/v1/reports/pipeline/funnel`

Shows candidate progression through the hiring pipeline. Identifies where candidates drop off.

**Pipeline Stages**:
1. **Sourced**: Initial application/interest
2. **Shortlisted**: Selected for consideration
3. **Interviewed**: Interview completed
4. **Offered**: Offer extended
5. **Joined**: Candidate accepted and joined

**Response Structure**:
```typescript
{
  totalCandidates: number;
  stages: [{
    stage: string;           // 'sourced' | 'shortlisted' | 'interviewed' | 'offered' | 'joined'
    count: number;           // Candidates at this stage
    percentage: number;      // % of total
    dropoff: number;         // % dropped from previous stage
  }];
  conversionRate: number;    // % sourced → joined
  avgDaysToHire: number;     // Average days from sourcing to hiring
  reportDate: Date;
}
```

**Calculations**:
- Percentage = (stage count / total candidates) × 100
- Dropoff = ((previous stage - current stage) / previous stage) × 100
- Conversion rate = (joined / sourced) × 100
- Avg days to hire = avg(hired candidates join date - sourced date)

**Use Cases**:
- Identify bottlenecks in hiring process
- Track conversion efficiency
- Measure pipeline health
- Benchmark against industry standards

---

### 3. Job-Wise Candidate Status
**Endpoint**: `GET /api/v1/reports/jobs/candidate-status`

Breakdown of candidates by job and status. Shows distribution across all job openings.

**Response Structure**:
```typescript
{
  totalJobs: number;
  totalCandidates: number;
  jobsWithCandidates: [{
    jobId: string;
    jobTitle: string;
    statusCounts: {
      sourced: number;
      shortlisted: number;
      interviewed: number;
      offered: number;
      joined: number;
    };
    totalCandidates: number;
    fillRate: number;        // % filled
  }];
  topPerformingJobs: [{
    jobId: string;
    jobTitle: string;
    candidateCount: number;
  }];
  reportDate: Date;
}
```

**Fill Rate Calculation**:
- Fill rate = (joined candidates / expected positions) × 100

**Use Cases**:
- Monitor job-specific progress
- Identify slow-to-fill positions
- Allocate recruiter resources
- Track multi-position hiring

---

### 4. Job Performance
**Endpoint**: `GET /api/v1/reports/jobs/performance`

Detailed metrics for each job position. Includes time to fill, cost per hire, and quality metrics.

**Response Structure**:
```typescript
{
  totalJobs: number;
  openJobs: number;
  filledJobs: number;
  fillRate: number;
  avgTimeToFill: number;
  jobs: [{
    jobId: string;
    jobTitle: string;
    status: 'open' | 'filled' | 'closed';
    daysOpen: number;
    submissionCount: number;
    offerCount: number;
    timeToFill: number | null;  // Days from open to filled
    costPerHire: number;         // Calculated from hiring costs
    qualityScore: number;        // 0-100 based on metrics
  }];
  topPerformingJobs: [{...}];
  mostCompetitiveJobs: [{
    jobId: string;
    jobTitle: string;
    candidateCount: number;
  }];
  reportDate: Date;
}
```

**Metrics Definitions**:
- **Time to fill**: Days from job posting to candidate joining
- **Cost per hire**: Total hiring costs / candidates hired
- **Quality score**: Based on offer acceptance rate and performance metrics

**Use Cases**:
- Optimize recruiting process
- Identify difficult-to-fill roles
- Track hiring efficiency
- Budget forecasting

---

### 5. Recruiter Activity Summary
**Endpoint**: `GET /api/v1/reports/recruiters/activity?period=last_30_days`

Performance metrics for each recruiter. Tracks activity and effectiveness.

**Query Parameters**:
- `period`: Time period for metrics
  - `last_30_days` (default): Last 30 days
  - `last_90_days`: Last 90 days
  - `this_year`: Calendar year to date

**Response Structure**:
```typescript
{
  totalRecruiters: number;
  reportPeriod: string;        // Display period (e.g., "Last 30 days")
  recruiters: [{
    recruiterId: string;
    recruiterName: string;
    sourcedCount: number;      // Candidates sourced
    shortlistedCount: number;
    interviewedCount: number;
    offeredCount: number;
    joinedCount: number;
    avgDaysToShortlist: number;
    avgDaysToInterview: number;
    avgDaysToOffer: number;
    productivity: number;      // Candidates processed per day
  }];
  topPerformers: [{
    recruiterId: string;
    recruiterName: string;
    joinedCount: number;
  }];
  teamProductivity: number;    // Average per recruiter
  reportDate: Date;
}
```

**Metrics Definitions**:
- **Productivity**: Total candidates touched / days in period
- **Avg days to X**: Average days from previous stage to X stage
- **Top performers**: Ranked by joined candidates count

**Use Cases**:
- Performance reviews
- Identify training needs
- Resource allocation
- Benchmark individual performance

---

### 6. Interview Metrics
**Endpoint**: `GET /api/v1/reports/interviews/metrics`

Statistics on interviews by round and type. Shows interview effectiveness and quality.

**Response Structure**:
```typescript
{
  totalInterviews: number;
  completedInterviews: number;
  pendingInterviews: number;
  avgScore: number;           // Average interview score (0-100)
  rounds: [{
    round: string;            // Interview round (e.g., "Round 1", "Round 2")
    count: number;            // Number of interviews
    avgScore: number;
    passRate: number;         // % progressing to next round
  }];
  averageScoreByRound: { [round: string]: number };
  reportDate: Date;
}
```

**Calculations**:
- Pass rate = (progressed to next round / total for round) × 100
- Average score: Sum of all scores in round / count

**Use Cases**:
- Interview quality assessment
- Identify difficult interview rounds
- Score consistency checking
- Interviewer calibration

---

### 7. Offer Metrics
**Endpoint**: `GET /api/v1/reports/offers/metrics`

Statistics on offers extended and their outcomes.

**Response Structure**:
```typescript
{
  totalOffers: number;
  offersByStatus: {
    pending: number;
    accepted: number;
    rejected: number;
    expired: number;
  };
  acceptanceRate: number;     // % accepted / total
  averageCTC: number;         // Average compensation
  averageCTCByRole: { [role: string]: number };
  offersToPipelineRatio: number;  // Offers / total candidates
  reportDate: Date;
}
```

**Calculations**:
- Acceptance rate = (accepted / total) × 100
- CTC by role: Average compensation grouped by job/role

**Use Cases**:
- Offer acceptance analysis
- Compensation benchmarking
- Retention risk identification
- Offer strategy optimization

---

### 8. Date Range Analytics (Time-Series)
**Endpoint**: `GET /api/v1/reports/analytics/timeline?fromDate=2024-01-01&toDate=2024-12-31&period=daily`

Trends over custom date ranges. Supports daily, weekly, and monthly aggregation.

**Query Parameters**:
- `fromDate`: Start date (YYYY-MM-DD)
- `toDate`: End date (YYYY-MM-DD)
- `period`: Aggregation period
  - `daily`: Day-by-day breakdown
  - `weekly`: Week-by-week summary
  - `monthly`: Month-by-month summary

**Response Structure**:
```typescript
{
  companyId: string;
  fromDate: Date;
  toDate: Date;
  period: 'daily' | 'weekly' | 'monthly';
  data: [{
    date: Date;              // Start date of period
    sourcedCount: number;    // Candidates sourced in period
    shortlistedCount: number;
    interviewedCount: number;
    offeredCount: number;
    joinedCount: number;
  }];
  reportDate: Date;
}
```

**Use Cases**:
- Hiring trend analysis
- Seasonal pattern identification
- Year-over-year comparison
- Forecasting and planning
- Anomaly detection

---

## Service Methods

All service methods are asynchronous and follow this pattern:

```typescript
async getReport(companyId: string, ...filters): Promise<ReportDto> {
  // 1. Query aggregations from existing repositories
  // 2. Filter by company_id (tenant scoping)
  // 3. Map data to report structure
  // 4. Calculate KPIs
  // 5. Return strongly-typed DTO
}
```

### Query Optimization

All queries use QueryBuilder for optimal database performance:
- Aggregate functions (COUNT, AVG, DATE_TRUNC)
- Grouping operations
- Filtering by company_id at query time
- Pagination support for large datasets

### Error Handling

All methods handle:
- Empty results → return zeros/empty arrays
- Null values → safe default calculations
- Date conversion → proper timezone handling
- Company isolation → no cross-tenant data leakage

---

## Integration with Existing Modules

### Data Sources

| Report | Data Sources | Key Field |
|--------|-------------|-----------|
| Pipeline Funnel | Submission | status |
| Job-Candidate Status | Submission, Job | job_id, status |
| Job Performance | Job, Submission, Offer | status, created_at, joined_at |
| Recruiter Activity | Submission | created_by_id, created_at |
| Interview Metrics | Interview | score, round, status |
| Offer Metrics | Offer | status, ctc |
| Dashboard | All modules | Various |
| Date Range Analytics | Submission | created_at |

### Entity Relationships

```
Job (1) ─────── (N) Submission ─── Interview
            │                    └── Offer
            │
         Candidate
```

---

## Security & Permissions

### RBAC

All endpoints require: `reports:read` permission

```typescript
@Require('reports:read')
```

This is the only permission needed for all report endpoints.

### Tenant Scoping

All queries automatically filtered by company_id:

```typescript
const report = await this.service.getPipelineFunnel(companyId);
// Internal: WHERE company_id = ? ...
```

No cross-tenant data leakage possible.

---

## Performance Considerations

### Query Complexity

- **Dashboard**: 8-10 aggregation queries
- **Pipeline**: 5 aggregation queries
- **Job-wise**: 6-8 aggregation queries
- **Recruiter activity**: 4-6 aggregation queries
- **Interviews**: 3-5 aggregation queries
- **Offers**: 3-4 aggregation queries
- **Date range**: 1-2 range queries

### Optimization Tips

1. **Use date ranges** to limit large datasets
2. **Cache dashboard** for 5-15 minutes
3. **Schedule heavy reports** during off-peak hours
4. **Use weekly aggregation** for historical analysis
5. **Monitor slow queries** in production

---

## Example Usage

### Dashboard via cURL

```bash
curl -X GET http://localhost:3000/api/v1/reports/dashboard \
  -H "Authorization: Bearer <token>" \
  -H "Company-Id: abc123"
```

### Pipeline Funnel via JavaScript

```javascript
const response = await fetch('/api/v1/reports/pipeline/funnel', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Company-Id': companyId
  }
});

const { data: funnel } = await response.json();
console.log(`Conversion rate: ${funnel.conversionRate}%`);
console.log(`Avg time to hire: ${funnel.avgDaysToHire} days`);
```

### Recruiter Activity via Python

```python
import requests
from datetime import datetime

headers = {
    'Authorization': f'Bearer {token}',
    'Company-Id': company_id
}

response = requests.get(
    'http://localhost:3000/api/v1/reports/recruiters/activity',
    params={'period': 'this_year'},
    headers=headers
)

data = response.json()['data']
for recruiter in data['recruiters']:
    print(f"{recruiter['recruiterName']}: {recruiter['joinedCount']} hired")
```

### Time-Series Analytics

```bash
curl -X GET "http://localhost:3000/api/v1/reports/analytics/timeline" \
  -G \
  --data-urlencode "fromDate=2024-01-01" \
  --data-urlencode "toDate=2024-12-31" \
  --data-urlencode "period=monthly" \
  -H "Authorization: Bearer <token>" \
  -H "Company-Id: abc123"
```

---

## Troubleshooting

### No data returned

**Cause**: No matching records in specified date range
**Solution**: Check if data exists for the period; expand date range

### Permission denied

**Cause**: User doesn't have `reports:read` permission
**Solution**: Grant permission in RBAC settings

### Slow query performance

**Cause**: Large dataset or missing indices
**Solution**: Use date range filtering; consider caching

### Cross-tenant data visible

**Cause**: Company_id not properly scoped
**Solution**: Verify TenantGuard is active; check company_id extraction

---

## Future Enhancements

Possible additions to the Reports module:

1. **Custom report builder**: User-defined aggregations
2. **Scheduled reports**: Email delivery on schedule
3. **Report caching**: Redis-based caching for performance
4. **Data export**: CSV, PDF, Excel formats
5. **Advanced filtering**: More granular report customization
6. **Predictive analytics**: ML-based forecasting
7. **Comparative analysis**: Year-over-year, quarter-over-quarter
8. **Real-time dashboards**: WebSocket updates
9. **Audit trail**: Track who accessed which reports
10. **Report versioning**: Track historical report values

---

## Related Documentation

- See [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- See [CORE_MODULES.md](CORE_MODULES.md) for module dependencies
- See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for data model
- See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for quick API reference
