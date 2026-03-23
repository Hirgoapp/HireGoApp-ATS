# Advanced Analytics Dashboard - Phase 11

## Overview

The Advanced Analytics Dashboard provides comprehensive business intelligence and recruitment insights for the ATS platform. This module offers real-time metrics, funnel analysis, time-to-hire tracking, source effectiveness, recruiter performance, and job analytics.

## Features

- **Dashboard Overview**: Key metrics at a glance
- **Recruitment Funnel**: Stage-by-stage conversion analysis
- **Time-to-Hire Metrics**: Average, median, min/max hiring times
- **Source Effectiveness**: ROI analysis by candidate source
- **Recruiter Performance**: Individual and team metrics
- **Job Performance**: Application and conversion rates by job
- **Caching Layer**: 5-minute cache for performance optimization

---

## API Endpoints

### Base URL
```
/api/v1/analytics
```

### Authentication
All endpoints require:
- Valid JWT token
- `analytics:read` or `analytics:view` permission

---

## 1. Dashboard Overview

### Endpoint
```
GET /api/v1/analytics/dashboard
```

### Description
Get a comprehensive dashboard with key metrics and trends.

### Response
```json
{
  "total_candidates": 1250,
  "total_jobs": 45,
  "total_applications": 350,
  "hires_this_month": 12,
  "new_applications_this_week": 85,
  "interviews_scheduled": 23,
  "avg_time_to_hire": 21.5,
  "overall_conversion_rate": 5.8,
  "applications_trend": [
    { "date": "2026-01-01", "value": 42 },
    { "date": "2026-01-02", "value": 38 }
  ],
  "top_sources": [
    {
      "source_name": "LinkedIn",
      "total_applications": 250,
      "total_hires": 15,
      "conversion_rate": 6.0,
      "avg_time_to_hire": 18.5,
      "percentage_of_total": 16.67
    }
  ]
}
```

### Use Case
Display on the main dashboard for quick insights into recruitment health.

---

## 2. Recruitment Funnel Analytics

### Endpoint
```
GET /api/v1/analytics/funnel
```

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `period` | AnalyticsPeriod | Time period | `last_30_days` |
| `start_date` | ISO Date | Custom start date | `2026-01-01` |
| `end_date` | ISO Date | Custom end date | `2026-01-31` |
| `job_id` | UUID | Filter by job | `uuid-of-job` |
| `pipeline_id` | UUID | Filter by pipeline | `uuid-of-pipeline` |

### Response
```json
{
  "total_applications": 500,
  "stages": [
    {
      "stage_name": "Applied",
      "count": 500,
      "conversion_rate": 100.0,
      "percentage_of_total": 100.0,
      "avg_days_in_stage": 2.5
    },
    {
      "stage_name": "Screening",
      "count": 350,
      "conversion_rate": 70.0,
      "percentage_of_total": 70.0,
      "avg_days_in_stage": 3.5
    },
    {
      "stage_name": "Interview",
      "count": 150,
      "conversion_rate": 42.86,
      "percentage_of_total": 30.0,
      "avg_days_in_stage": 5.2
    },
    {
      "stage_name": "Offer",
      "count": 50,
      "conversion_rate": 33.33,
      "percentage_of_total": 10.0,
      "avg_days_in_stage": 4.1
    },
    {
      "stage_name": "Hired",
      "count": 25,
      "conversion_rate": 50.0,
      "percentage_of_total": 5.0,
      "avg_days_in_stage": 7.3
    }
  ],
  "total_hires": 25,
  "overall_conversion_rate": 5.0,
  "avg_time_to_hire": 21.5
}
```

### Use Cases
- Identify bottlenecks in the hiring funnel
- Track conversion rates between stages
- Optimize stage transitions
- Compare pipeline performance

---

## 3. Time-to-Hire Metrics

### Endpoint
```
GET /api/v1/analytics/time-to-hire
```

### Query Parameters
Same as funnel analytics, plus:
- `recruiter_id`: Filter by specific recruiter
- `group_by`: Group time series data (day, week, month, quarter)

### Response
```json
{
  "overall": {
    "avg_days": 21.5,
    "median_days": 18.0,
    "min_days": 7.0,
    "max_days": 45.0,
    "total_hires": 25
  },
  "time_series": [
    { "date": "2026-W01", "value": 19.5 },
    { "date": "2026-W02", "value": 22.3 }
  ],
  "by_job": [
    {
      "job_id": "uuid-1",
      "job_title": "Senior Software Engineer",
      "avg_days": 18.5,
      "median_days": 17.0,
      "min_days": 12.0,
      "max_days": 28.0,
      "total_hires": 5
    }
  ],
  "by_department": [
    {
      "department": "Engineering",
      "avg_days": 19.2,
      "median_days": 18.0,
      "min_days": 10.0,
      "max_days": 35.0,
      "total_hires": 15
    }
  ]
}
```

### Use Cases
- Benchmark hiring efficiency
- Identify slow-moving positions
- Compare departments or recruiters
- Set realistic hiring timelines

---

## 4. Source Effectiveness

### Endpoint
```
GET /api/v1/analytics/sources
```

### Query Parameters
- `period`: Time period for analysis
- `start_date` / `end_date`: Custom date range

### Response
```json
[
  {
    "source_name": "LinkedIn",
    "total_applications": 250,
    "total_hires": 15,
    "conversion_rate": 6.0,
    "avg_time_to_hire": 18.5,
    "cost_per_hire": 1500.0,
    "percentage_of_total": 16.67
  },
  {
    "source_name": "Referrals",
    "total_applications": 120,
    "total_hires": 18,
    "conversion_rate": 15.0,
    "avg_time_to_hire": 14.2,
    "percentage_of_total": 8.0
  },
  {
    "source_name": "Indeed",
    "total_applications": 450,
    "total_hires": 12,
    "conversion_rate": 2.67,
    "avg_time_to_hire": 25.8,
    "percentage_of_total": 30.0
  }
]
```

### Use Cases
- Allocate recruiting budget effectively
- Identify high-quality sources
- Calculate ROI per channel
- Optimize sourcing strategy

### Insights
- **Referrals** typically have highest conversion rate (10-20%)
- **Job boards** have highest volume but lower conversion (2-5%)
- **Direct applications** often have medium conversion (5-8%)

---

## 5. Recruiter Performance

### Endpoint
```
GET /api/v1/analytics/recruiters
```

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | Number | Max recruiters to return | 10 |
| `period` | AnalyticsPeriod | Time period | `last_30_days` |
| `start_date` | ISO Date | Custom start | - |
| `end_date` | ISO Date | Custom end | - |

### Response
```json
[
  {
    "recruiter_id": "uuid-1",
    "recruiter_name": "Jane Smith",
    "total_applications": 85,
    "total_hires": 12,
    "conversion_rate": 14.12,
    "avg_time_to_hire": 19.5,
    "active_jobs": 32,
    "pending_applications": 45,
    "avg_candidate_rating": 4.2
  },
  {
    "recruiter_id": "uuid-2",
    "recruiter_name": "John Doe",
    "total_applications": 92,
    "total_hires": 8,
    "conversion_rate": 8.70,
    "avg_time_to_hire": 24.3,
    "active_jobs": 28,
    "pending_applications": 38,
    "avg_candidate_rating": 3.9
  }
]
```

### Use Cases
- Track individual performance
- Identify top performers
- Balance workload across team
- Set performance goals

### Metrics Explained
- **Conversion Rate**: Hires / Total Applications
- **Avg Time-to-Hire**: Average days from application to hire
- **Active Jobs**: Currently assigned open positions
- **Pending Applications**: Applications awaiting action

---

## 6. Job Performance

### Endpoint
```
GET /api/v1/analytics/jobs
```

### Query Parameters
- `period`: Time period for analysis
- `start_date` / `end_date`: Custom date range

### Response
```json
[
  {
    "job_id": "uuid-1",
    "job_title": "Senior Software Engineer",
    "department": "Engineering",
    "total_applications": 120,
    "total_hires": 8,
    "conversion_rate": 6.67,
    "avg_time_to_hire": 22.5,
    "status": "Active",
    "days_open": 15,
    "positions_filled": 3,
    "total_positions": 5
  },
  {
    "job_id": "uuid-2",
    "job_title": "Product Manager",
    "department": "Product",
    "total_applications": 85,
    "total_hires": 2,
    "conversion_rate": 2.35,
    "avg_time_to_hire": 28.3,
    "status": "Active",
    "days_open": 45,
    "positions_filled": 1,
    "total_positions": 2
  }
]
```

### Use Cases
- Identify hard-to-fill positions
- Adjust job descriptions for better applications
- Allocate resources to critical hires
- Forecast hiring timelines

### Red Flags
- **Low conversion rate (<3%)**: Job description may be unclear or requirements too strict
- **High days open (>60 days)**: May need salary adjustment or sourcing strategy change
- **Low application volume (<5/week)**: Job posting may need better visibility

---

## Performance Optimization

### Caching Strategy
- **TTL**: 5 minutes (300 seconds) for all analytics endpoints
- **Cache Key Pattern**: `analytics:{metric}:{company_id}:{query_hash}`
- **Max Items**: 100 cached results per company

### Query Optimization
- **Indexes**: All queries use existing database indexes
- **Aggregations**: Performed at database level using TypeORM query builder
- **Lazy Loading**: Related entities loaded only when needed

### Response Times
- **Target**: <500ms for p95
- **Typical**: 100-300ms (with cache hit: <50ms)
- **Large datasets (10,000+ applications)**: May take up to 1 second

---

## Example Workflows

### Workflow 1: Monthly Performance Review

```bash
# 1. Get dashboard overview
curl -X GET http://localhost:3000/api/v1/analytics/dashboard \
  -H "Authorization: Bearer ${TOKEN}"

# 2. Get recruiter performance
curl -X GET http://localhost:3000/api/v1/analytics/recruiters?period=last_30_days \
  -H "Authorization: Bearer ${TOKEN}"

# 3. Get time-to-hire breakdown
curl -X GET http://localhost:3000/api/v1/analytics/time-to-hire?period=last_30_days \
  -H "Authorization: Bearer ${TOKEN}"
```

### Workflow 2: Source ROI Analysis

```bash
# Get source effectiveness for Q1 2026
curl -X GET "http://localhost:3000/api/v1/analytics/sources?period=custom&start_date=2026-01-01&end_date=2026-03-31" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Workflow 3: Job-Specific Funnel

```bash
# Get funnel for specific job
curl -X GET "http://localhost:3000/api/v1/analytics/funnel?job_id=uuid-of-job&period=last_90_days" \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## Integration with Frontend

### Dashboard Widget Example (React)

```typescript
import { useEffect, useState } from 'react';
import { analyticsApi } from './api/analytics';

export function DashboardWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await analyticsApi.getDashboard();
        setData(response);
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboard();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboard, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="dashboard-grid">
      <MetricCard title="Total Candidates" value={data.total_candidates} />
      <MetricCard title="Active Jobs" value={data.total_jobs} />
      <MetricCard title="Hires This Month" value={data.hires_this_month} />
      <TrendChart data={data.applications_trend} />
      <SourcesTable sources={data.top_sources} />
    </div>
  );
}
```

---

## Security & Permissions

### Required Permissions
- `analytics:read` or `analytics:view`: Access all analytics endpoints
- Multi-tenant isolation: Data automatically scoped to user's company

### Data Privacy
- No PII exposed in aggregated metrics
- Individual candidate details not included
- GDPR-compliant aggregation

---

## Troubleshooting

### Issue: Slow Response Times

**Cause**: Large dataset or cache miss

**Solution**:
- Reduce date range (use `last_30_days` instead of `last_year`)
- Wait 5 minutes for cache to populate
- Check database indexes are present

### Issue: Inconsistent Numbers

**Cause**: Data updated during calculation

**Solution**:
- Analytics use point-in-time snapshots
- Refresh analytics page to get latest data
- Consider cached data may be up to 5 minutes old

### Issue: Missing Data for New Company

**Cause**: Insufficient data for meaningful analytics

**Solution**:
- Analytics require at least 10 applications
- New companies will show zeros until data accumulates
- Historical data imported from CSV will be included

---

## Future Enhancements

- [ ] Real-time WebSocket updates for live metrics
- [ ] Custom report builder with drag-and-drop
- [ ] Scheduled email reports (daily, weekly, monthly)
- [ ] PDF/Excel export of analytics data
- [ ] Predictive analytics (forecast hires, identify churn risk)
- [ ] Machine learning insights (recommend sourcing channels)
- [ ] Benchmarking against industry averages
- [ ] Goal tracking and alerts

---

## Performance Benchmarks

### Dataset Sizes Tested
- **Small**: 100-1,000 applications → <100ms
- **Medium**: 1,000-10,000 applications → 100-500ms
- **Large**: 10,000-100,000 applications → 500-2000ms

### Recommendations
- For 100,000+ applications, consider pre-aggregating data nightly
- Use materialized views for frequently accessed metrics
- Consider Redis caching layer for high-traffic environments

---

## API Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid date range: start_date must be before end_date"
}
```

---

## Support

For issues or questions:
- Check cache settings if data seems stale
- Verify `analytics:read` permission is assigned
- Review database indexes for performance
- Contact support with query parameters and response times
