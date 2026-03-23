# Performance Baselines & SLAs

This document defines target performance levels and service-level agreements for ATS SaaS.

## Key Performance Indicators (KPIs)

### API Response Times

| Endpoint | Operation | Target p95 | Target p99 | Typical Use |
|----------|-----------|------------|------------|------------|
| `GET /api/v1/candidates` | List | 300ms | 600ms | Recruiter browsing |
| `POST /api/v1/candidates/search/advanced` | Search | 400ms | 800ms | Recruiter finding talent |
| `POST /api/v1/candidates` | Create | 500ms | 1000ms | Bulk import |
| `GET /api/v1/candidates/:id` | Read | 150ms | 300ms | View profile |
| `PATCH /api/v1/candidates/:id` | Update | 300ms | 600ms | Edit details |
| `GET /api/v1/applications` | List | 350ms | 700ms | Pipeline view |
| `POST /api/v1/applications` | Create | 400ms | 800ms | New application |
| `PATCH /api/v1/applications/:id` | Update stage | 250ms | 500ms | Move in pipeline |
| `GET /api/v1/dashboard/*` | Dashboard panels | 200ms | 400ms | Real-time dashboard |
| `POST /api/v1/documents/upload` | Upload | 1000ms | 2000ms | Resume upload |
| `GET /api/v1/documents/:id/download` | Download | 500ms | 1500ms | Download file |
| `GET /health` | Health check | 50ms | 100ms | Probes |
| `GET /metrics` | Prometheus | 100ms | 200ms | Monitoring |

### Error Rates

| Scenario | Target | Action |
|----------|--------|--------|
| Normal operation | <0.1% | Monitor |
| Spike (2x load) | <0.5% | Alert |
| Stress test (5x load) | <5% | Degrade gracefully |
| Outage recovery | <10% | for <5 minutes |

### Availability

| Service Level | Uptime | Target Downtime/month |
|---------------|--------|----------------------|
| Standard SLA | 99.5% | ~3.6 hours |
| Premium SLA | 99.9% | ~43 minutes |
| Enterprise SLA | 99.95% | ~22 minutes |

### Throughput

| Metric | Target | Scaling |
|--------|--------|---------|
| Concurrent users | 100+ | Horizontal scaling |
| Requests/sec (baseline) | 1000 RPS | Load balancer |
| Requests/sec (peak) | 5000 RPS | Multi-instance |
| Database connections | 200 max | Connection pooling |
| WebSocket connections | 10,000+ | Node.js clustering |

## Database Performance

### Query Latency

| Query Type | Target | Notes |
|------------|--------|-------|
| Simple lookup (PK) | <5ms | Indexed |
| Indexed range | <20ms | e.g., created_at |
| Full-text search | <100ms | GIN index |
| Aggregation (COUNT) | <50ms | COUNT(*) on indexed column |
| Join (2 tables) | <30ms | With proper indexes |
| Complex query (5+ joins) | <500ms | Optimize or denormalize |

### Connection Pool

```
Min connections: 10
Max connections: 100
Idle timeout: 30s
Max lifetime: 30m
Queue timeout: 5s
```

## Load Profiles

### Normal Business Hours (9-5 UTC)

```
User distribution:
- 70% recruiters (viewing, searching, creating apps)
- 20% candidates (applying, uploading docs)
- 10% admins (config, reporting)

Peak load:
- 9-11 AM UTC: ~100 concurrent users
- 2-4 PM UTC: ~80 concurrent users
- Average: ~50 concurrent users
```

### Off-hours & Batch Processing

```
Scheduled jobs:
- Email digests: 2 AM UTC (low load, <5 RPS)
- Analytics aggregation: 3 AM UTC (high DB load, <100 RPS API)
- Compliance snapshots: 4 AM UTC (I/O heavy)
- Webhook retries: Continuous (backoff)
```

## Scaling Thresholds

### Horizontal Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU | >70% for 5 min | Add instance |
| Memory | >80% for 5 min | Add instance |
| Response time p95 | >1s | Add instance |
| Error rate | >1% | Investigate + scale |
| Pending requests | >1000 | Scale immediately |

### Vertical Scaling (Instance Size)

**Recommended configurations**:

| Load Level | Instance Type | Replicas | DB Size | Approx Cost |
|-----------|--------------|----------|---------|------------|
| Proof-of-Concept | t3.small | 1 | 10 GB | $0.023/hr |
| Startup (50 users) | t3.medium | 2 | 50 GB | $0.0416/hr |
| Growth (200 users) | m5.large | 3 | 200 GB | $0.096/hr |
| Production (1000 users) | m5.xlarge | 5 | 500 GB | $0.192/hr |
| Enterprise (5000 users) | c5.2xlarge | 10+ | 2 TB | Custom |

## Caching Strategy

### Response Caching

| Endpoint | TTL | Policy |
|----------|-----|--------|
| GET /candidates | 5 min | User-specific (company_id) |
| GET /candidates/:id | 10 min | Invalidate on PATCH |
| GET /dashboard/* | 5 min | Lazy update on change |
| GET /jobs | 15 min | Invalidate on POST/PATCH |
| GET /applications | 2 min | Volatile (frequently updated) |
| GET /metrics | No cache | Real-time |

### Database Query Caching

- **Read replicas**: For reporting queries
- **Query result cache**: Redis for expensive aggregations
- **Connection pooling**: PgBouncer or built-in

## Compliance & Data

### Backup SLA

- **Frequency**: Every 6 hours
- **Retention**: 30 days (rolling)
- **RTO**: <1 hour (restore time)
- **RPO**: <6 hours (data loss tolerance)

### Audit Logging

- **Writes/sec**: <100 (async)
- **Retention**: 1 year
- **Query latency**: <200ms

## Monitoring & Alerting

### Critical Alerts

1. **API Down** (5xx errors >10%)
   - Trigger: Immediate
   - Response: Page on-call

2. **Database Down** (connection errors >50%)
   - Trigger: Immediate
   - Response: Failover

3. **High Latency** (p95 >2s)
   - Trigger: 5 min window
   - Response: Investigate

4. **High Error Rate** (>5%)
   - Trigger: 2 min window
   - Response: Alert + investigate

5. **Storage Full** (>85% used)
   - Trigger: 1 hour before full
   - Response: Expand + cleanup

### Dashboard Metrics

- Real-time request rate (RPS)
- p50/p95/p99 latency
- Error rate %
- Active users
- Database query time
- Cache hit ratio
- Memory usage
- CPU usage
- Disk usage

## Performance Testing Schedule

### Pre-Launch (Before GA)

```
Week 1: Baseline tests (normal load)
Week 2: Spike tests (2-3x peak)
Week 3: Stress tests (5-10x peak)
Week 4: Endurance tests (24h sustained)
Week 5: Production readiness review
```

### Quarterly (Post-Launch)

```
Month 1, 4, 7, 10:
- Baseline retest (detect degradation)
- Stress test with latest data volume
- Capacity planning review
```

## Optimization Priorities

### Quick Wins (1-2 weeks)

- [ ] Add database indexes (identified in load tests)
- [ ] Enable HTTP caching headers
- [ ] Optimize query N+1 problems
- [ ] Reduce JSON payload sizes

### Medium-term (1-3 months)

- [ ] Implement read replicas for reporting
- [ ] Add Redis caching for hot endpoints
- [ ] Optimize search indices (full-text)
- [ ] Database query refactoring

### Long-term (3+ months)

- [ ] Microservices decomposition (if needed)
- [ ] Event-driven architecture for async jobs
- [ ] GraphQL layer (optional)
- [ ] Multi-region deployment

## References

- [Google SRE Book - SLOs](https://sre.google/sre-book/slo-document-example/)
- [AWS Well-Architected Performance Pillar](https://docs.aws.amazon.com/wellarchitected/latest/performance-pillar/welcome.html)
- [PostgreSQL Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
