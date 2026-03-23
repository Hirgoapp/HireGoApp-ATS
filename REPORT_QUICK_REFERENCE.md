# Reports Module - Quick Reference

## Endpoint Summary

| Endpoint | Method | Purpose | Query Params |
|----------|--------|---------|--------------|
| `/api/v1/reports/dashboard` | GET | Key metrics overview | None |
| `/api/v1/reports/pipeline/funnel` | GET | Pipeline progression | None |
| `/api/v1/reports/jobs/candidate-status` | GET | Job-wise candidate breakdown | None |
| `/api/v1/reports/jobs/performance` | GET | Job performance metrics | None |
| `/api/v1/reports/recruiters/activity` | GET | Recruiter performance | `period=last_30_days\|last_90_days\|this_year` |
| `/api/v1/reports/interviews/metrics` | GET | Interview statistics | None |
| `/api/v1/reports/offers/metrics` | GET | Offer analytics | None |
| `/api/v1/reports/analytics/timeline` | GET | Time-series data | `fromDate`, `toDate`, `period=daily\|weekly\|monthly` |

---

## HTTP Request Format

### Headers (All Requests)

```
Authorization: Bearer <access_token>
Company-Id: <company_id>
Content-Type: application/json
```

### Response Format (Success - 200)

```json
{
  "success": true,
  "data": {
    // Report-specific fields
  }
}
```

### Response Format (Error - 400/403/500)

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

---

## Permission Requirements

**All endpoints require**: `reports:read`

```
❌ Without permission:
  403 Forbidden - User does not have reports:read permission

✅ With permission:
  200 OK - Report data returned
```

---

## Quick Examples

### 1. Dashboard Summary

**Request**:
```bash
GET /api/v1/reports/dashboard
Authorization: Bearer token
Company-Id: company-123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalJobs": 25,
    "openJobs": 12,
    "filledJobs": 13,
    "totalCandidates": 450,
    "activeCandidates": 120,
    "hiredThisMonth": 5,
    "hiredThisYear": 42,
    "totalRecruiters": 8,
    "avgTimeToHire": 34,
    "pipelineHealthScore": 78,
    "reportDate": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. Pipeline Funnel

**Request**:
```bash
GET /api/v1/reports/pipeline/funnel
Authorization: Bearer token
Company-Id: company-123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalCandidates": 500,
    "stages": [
      {
        "stage": "sourced",
        "count": 500,
        "percentage": 100.0,
        "dropoff": 0.0
      },
      {
        "stage": "shortlisted",
        "count": 250,
        "percentage": 50.0,
        "dropoff": 50.0
      },
      {
        "stage": "interviewed",
        "count": 100,
        "percentage": 20.0,
        "dropoff": 60.0
      },
      {
        "stage": "offered",
        "count": 50,
        "percentage": 10.0,
        "dropoff": 50.0
      },
      {
        "stage": "joined",
        "count": 45,
        "percentage": 9.0,
        "dropoff": 10.0
      }
    ],
    "conversionRate": 9.0,
    "avgDaysToHire": 34,
    "reportDate": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3. Job-Wise Candidate Status

**Request**:
```bash
GET /api/v1/reports/jobs/candidate-status
Authorization: Bearer token
Company-Id: company-123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalJobs": 12,
    "totalCandidates": 234,
    "jobsWithCandidates": [
      {
        "jobId": "job-1",
        "jobTitle": "Senior Software Engineer",
        "statusCounts": {
          "sourced": 45,
          "shortlisted": 25,
          "interviewed": 10,
          "offered": 3,
          "joined": 2
        },
        "totalCandidates": 85,
        "fillRate": 50.0
      }
    ],
    "topPerformingJobs": [
      {
        "jobId": "job-2",
        "jobTitle": "Product Manager",
        "candidateCount": 98
      }
    ],
    "reportDate": "2024-01-15T10:30:00Z"
  }
}
```

---

### 4. Recruiter Activity

**Request**:
```bash
GET /api/v1/reports/recruiters/activity?period=last_30_days
Authorization: Bearer token
Company-Id: company-123
```

**Query Parameters**:
- `period`: `last_30_days` (default), `last_90_days`, `this_year`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalRecruiters": 8,
    "reportPeriod": "Last 30 days",
    "recruiters": [
      {
        "recruiterId": "user-1",
        "recruiterName": "John Smith",
        "sourcedCount": 45,
        "shortlistedCount": 30,
        "interviewedCount": 15,
        "offeredCount": 5,
        "joinedCount": 3,
        "avgDaysToShortlist": 3,
        "avgDaysToInterview": 8,
        "avgDaysToOffer": 5,
        "productivity": 1.5
      }
    ],
    "topPerformers": [
      {
        "recruiterId": "user-1",
        "recruiterName": "John Smith",
        "joinedCount": 3
      }
    ],
    "teamProductivity": 1.2,
    "reportDate": "2024-01-15T10:30:00Z"
  }
}
```

---

### 5. Interview Metrics

**Request**:
```bash
GET /api/v1/reports/interviews/metrics
Authorization: Bearer token
Company-Id: company-123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalInterviews": 156,
    "completedInterviews": 145,
    "pendingInterviews": 11,
    "avgScore": 72.5,
    "rounds": [
      {
        "round": "Round 1",
        "count": 100,
        "avgScore": 68.0,
        "passRate": 85.0
      },
      {
        "round": "Round 2",
        "count": 85,
        "avgScore": 75.0,
        "passRate": 70.0
      },
      {
        "round": "Round 3",
        "count": 60,
        "avgScore": 78.0,
        "passRate": 75.0
      }
    ],
    "averageScoreByRound": {
      "Round 1": 68.0,
      "Round 2": 75.0,
      "Round 3": 78.0
    },
    "reportDate": "2024-01-15T10:30:00Z"
  }
}
```

---

### 6. Offer Metrics

**Request**:
```bash
GET /api/v1/reports/offers/metrics
Authorization: Bearer token
Company-Id: company-123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalOffers": 48,
    "offersByStatus": {
      "pending": 5,
      "accepted": 35,
      "rejected": 6,
      "expired": 2
    },
    "acceptanceRate": 72.9,
    "averageCTC": 85000,
    "averageCTCByRole": {
      "Senior Engineer": 95000,
      "Engineer": 75000,
      "Product Manager": 90000
    },
    "offersToPipelineRatio": 0.21,
    "reportDate": "2024-01-15T10:30:00Z"
  }
}
```

---

### 7. Job Performance

**Request**:
```bash
GET /api/v1/reports/jobs/performance
Authorization: Bearer token
Company-Id: company-123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalJobs": 12,
    "openJobs": 7,
    "filledJobs": 5,
    "fillRate": 41.7,
    "avgTimeToFill": 34,
    "jobs": [
      {
        "jobId": "job-1",
        "jobTitle": "Senior Software Engineer",
        "status": "open",
        "daysOpen": 25,
        "submissionCount": 85,
        "offerCount": 5,
        "timeToFill": 32,
        "costPerHire": 5000,
        "qualityScore": 82
      }
    ],
    "topPerformingJobs": [
      {
        "jobId": "job-2",
        "jobTitle": "Product Manager",
        "candidateCount": 98
      }
    ],
    "mostCompetitiveJobs": [
      {
        "jobId": "job-1",
        "jobTitle": "Senior Software Engineer",
        "candidateCount": 85
      }
    ],
    "reportDate": "2024-01-15T10:30:00Z"
  }
}
```

---

### 8. Time-Series Analytics

**Request**:
```bash
GET /api/v1/reports/analytics/timeline?fromDate=2024-01-01&toDate=2024-01-31&period=daily
Authorization: Bearer token
Company-Id: company-123
```

**Query Parameters**:
- `fromDate`: Start date (YYYY-MM-DD) - Required
- `toDate`: End date (YYYY-MM-DD) - Required
- `period`: `daily`, `weekly`, or `monthly` - Default: `daily`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "companyId": "company-123",
    "fromDate": "2024-01-01",
    "toDate": "2024-01-31",
    "period": "daily",
    "data": [
      {
        "date": "2024-01-01",
        "sourcedCount": 12,
        "shortlistedCount": 6,
        "interviewedCount": 2,
        "offeredCount": 1,
        "joinedCount": 0
      },
      {
        "date": "2024-01-02",
        "sourcedCount": 15,
        "shortlistedCount": 8,
        "interviewedCount": 3,
        "offeredCount": 1,
        "joinedCount": 1
      }
    ],
    "reportDate": "2024-01-15T10:30:00Z"
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```
**Solution**: Provide valid authorization token

### 403 Forbidden
```json
{
  "success": false,
  "message": "User does not have reports:read permission"
}
```
**Solution**: Grant `reports:read` permission to user

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid date format. Expected YYYY-MM-DD"
}
```
**Solution**: Use correct date format (YYYY-MM-DD)

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An error occurred while generating the report"
}
```
**Solution**: Check server logs; contact support

---

## Request/Response Statistics

| Report | Avg Response Time | Data Volume | Cacheability |
|--------|-------------------|-------------|--------------|
| Dashboard | 200-500ms | 1-2 KB | 5-15 min |
| Pipeline Funnel | 150-300ms | 1 KB | 15 min |
| Job-Candidate Status | 300-800ms | 2-5 KB | 5 min |
| Recruiter Activity | 200-600ms | 1-3 KB | 15 min |
| Interview Metrics | 150-400ms | 1 KB | 15 min |
| Offer Metrics | 100-300ms | 1 KB | 15 min |
| Job Performance | 400-1000ms | 3-8 KB | 5 min |
| Time-Series | 500-2000ms | 5-50 KB | Custom |

---

## Client Implementation Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1/reports';

async function getDashboard(token: string, companyId: string) {
  const response = await axios.get(`${API_BASE}/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Company-Id': companyId
    }
  });
  return response.data.data;
}

async function getPipelineFunnel(token: string, companyId: string) {
  const response = await axios.get(`${API_BASE}/pipeline/funnel`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Company-Id': companyId
    }
  });
  return response.data.data;
}

async function getRecruiterActivity(
  token: string,
  companyId: string,
  period: 'last_30_days' | 'last_90_days' | 'this_year' = 'last_30_days'
) {
  const response = await axios.get(`${API_BASE}/recruiters/activity`, {
    params: { period },
    headers: {
      'Authorization': `Bearer ${token}`,
      'Company-Id': companyId
    }
  });
  return response.data.data;
}

async function getTimeSeriesData(
  token: string,
  companyId: string,
  fromDate: string,
  toDate: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  const response = await axios.get(`${API_BASE}/analytics/timeline`, {
    params: { fromDate, toDate, period },
    headers: {
      'Authorization': `Bearer ${token}`,
      'Company-Id': companyId
    }
  });
  return response.data.data;
}

// Usage
const dashboard = await getDashboard(token, 'company-123');
console.log(`Open jobs: ${dashboard.openJobs}`);
```

### Python

```python
import requests
from datetime import datetime, timedelta

API_BASE = 'http://localhost:3000/api/v1/reports'

def get_dashboard(token: str, company_id: str) -> dict:
    response = requests.get(
        f'{API_BASE}/dashboard',
        headers={
            'Authorization': f'Bearer {token}',
            'Company-Id': company_id
        }
    )
    return response.json()['data']

def get_pipeline_funnel(token: str, company_id: str) -> dict:
    response = requests.get(
        f'{API_BASE}/pipeline/funnel',
        headers={
            'Authorization': f'Bearer {token}',
            'Company-Id': company_id
        }
    )
    return response.json()['data']

def get_time_series(
    token: str,
    company_id: str,
    from_date: str,
    to_date: str,
    period: str = 'daily'
) -> dict:
    response = requests.get(
        f'{API_BASE}/analytics/timeline',
        params={
            'fromDate': from_date,
            'toDate': to_date,
            'period': period
        },
        headers={
            'Authorization': f'Bearer {token}',
            'Company-Id': company_id
        }
    )
    return response.json()['data']

# Usage
dashboard = get_dashboard(token, 'company-123')
print(f"Total candidates: {dashboard['totalCandidates']}")
```

### cURL

```bash
#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
COMPANY_ID="company-123"
API_BASE="http://localhost:3000/api/v1/reports"

# Dashboard
curl -X GET "$API_BASE/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Company-Id: $COMPANY_ID" \
  -H "Content-Type: application/json"

# Pipeline Funnel
curl -X GET "$API_BASE/pipeline/funnel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Company-Id: $COMPANY_ID"

# Recruiter Activity (This Year)
curl -X GET "$API_BASE/recruiters/activity?period=this_year" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Company-Id: $COMPANY_ID"

# Time-Series (January 2024, Weekly)
curl -X GET "$API_BASE/analytics/timeline" \
  -G \
  --data-urlencode "fromDate=2024-01-01" \
  --data-urlencode "toDate=2024-01-31" \
  --data-urlencode "period=weekly" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Company-Id: $COMPANY_ID"
```

---

## Integration Checklist

- [ ] Import ReportModule in AppModule
- [ ] Ensure TenantGuard is configured globally
- [ ] Ensure RoleGuard is configured globally
- [ ] Grant `reports:read` permission to users needing reports
- [ ] Test all 8 endpoints with sample data
- [ ] Implement caching strategy for reports (optional)
- [ ] Set up monitoring for slow queries (optional)
- [ ] Configure CORS if calling from different domain
- [ ] Document custom reports if extending (optional)

---

## Related Documentation

- [Full Guide](REPORT_MODULE_GUIDE.md) - Detailed documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Data model
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick API reference
