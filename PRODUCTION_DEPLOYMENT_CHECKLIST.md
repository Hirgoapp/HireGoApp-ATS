# Production Deployment Checklist

Complete all items before deploying to production.

## Pre-Deployment (1-2 Days Before)

- [ ] **Code Review**
  - [ ] All PRs reviewed and approved
  - [ ] No pending changes on `main` branch
  - [ ] Version number bumped in `package.json`

- [ ] **Testing**
  - [ ] Unit tests passing: `npm run test`
  - [ ] Coverage meets minimum (aim for >80%): `npm run test:cov`
  - [ ] Integration tests with production database schema
  - [ ] Manual smoke tests on staging environment

- [ ] **Security**
  - [ ] Dependency audit clean: `npm audit`
  - [ ] No new critical/high vulnerabilities
  - [ ] OWASP Top 10 checklist completed
  - [ ] Secrets rotation verified (JWT, API keys, etc.)

- [ ] **Documentation**
  - [ ] README updated with latest setup/usage
  - [ ] API docs (OpenAPI/Swagger) generated and validated
  - [ ] Deployment guide updated
  - [ ] Runbook created for common issues

## Infrastructure Checks (1 Day Before)

- [ ] **Database**
  - [ ] All migrations tested on staging
  - [ ] Backup strategy in place and tested
  - [ ] Replication lag within SLA (if applicable)
  - [ ] Connection pool settings optimized
  - [ ] Query performance verified for new endpoints

- [ ] **Storage**
  - [ ] S3 bucket encryption enabled (SSE-KMS)
  - [ ] S3 versioning and lifecycle policies configured
  - [ ] Bucket policies restrict public access
  - [ ] IAM roles/permissions verified
  - [ ] CDN (if using CloudFront) cache settings correct

- [ ] **Monitoring & Alerts**
  - [ ] Prometheus scraping verified
  - [ ] Grafana dashboards loaded with sample data
  - [ ] Alert thresholds configured:
    - [ ] CPU > 80%
    - [ ] Memory > 85%
    - [ ] Error rate > 1%
    - [ ] Response time p99 > 500ms
  - [ ] PagerDuty/Slack webhooks configured
  - [ ] Sentry error tracking enabled

- [ ] **Security & Compliance**
  - [ ] WAF (Web Application Firewall) rules loaded
  - [ ] DDoS protection enabled (CloudFlare, AWS Shield)
  - [ ] Firewall rules restrict access (IPs, ports)
  - [ ] HTTPS/TLS certs valid and auto-renewing
  - [ ] CORS headers configured for frontend domains
  - [ ] Rate limiting thresholds set appropriately

## Pre-Deployment (30 Minutes Before)

- [ ] **Final Build**
  - [ ] Docker image built: `docker build -t ats:latest .`
  - [ ] Image scanned for vulnerabilities: `docker scan ats:latest`
  - [ ] Image size reasonable (<500MB)
  - [ ] Image pushed to registry

- [ ] **Load Balancer & DNS**
  - [ ] Health check endpoint configured (`/health`, `/readiness`)
  - [ ] DNS failover tested (if applicable)
  - [ ] Load balancer pool size sufficient for peak traffic

- [ ] **Environment Variables**
  - [ ] All required env vars set in production
  - [ ] No secrets in logs or version control
  - [ ] Database connection string verified
  - [ ] API keys rotated (if necessary)
  - [ ] Feature flags configured correctly

- [ ] **Notifications**
  - [ ] Deploy notification sent to team
  - [ ] On-call engineer notified
  - [ ] Stakeholders aware of deployment window

## Deployment (Day Of)

- [ ] **Blue-Green Deployment (Recommended)**
  - [ ] New version deployed to "green" environment
  - [ ] Smoke tests pass on green: `/health`, `/readiness`
  - [ ] Load tests run on green
  - [ ] Switch traffic from "blue" to "green"
  - [ ] Monitor metrics for 15 minutes

- [ ] **Canary Deployment (Alternative)**
  - [ ] Deploy new version to 5% of pods
  - [ ] Monitor error rate and latency for 5 minutes
  - [ ] Gradually increase to 50%, then 100%
  - [ ] Maintain ability to rollback at each stage

- [ ] **Rolling Deployment (Lower Risk)**
  - [ ] Drain connections from 1 pod
  - [ ] Deploy new version to drained pod
  - [ ] Verify pod health check passes
  - [ ] Repeat for next pod
  - [ ] Monitor overall system health

## Post-Deployment (Immediately After)

- [ ] **Health Checks**
  - [ ] All containers running: `docker ps`
  - [ ] `/health` endpoint returns 200
  - [ ] `/readiness` endpoint returns 200
  - [ ] `/version` endpoint shows correct version
  - [ ] Metrics endpoint `/metrics` accessible

- [ ] **Functional Verification**
  - [ ] Login flow works
  - [ ] Core workflow (create job → apply → interview → offer) works
  - [ ] File upload/download works
  - [ ] Webhook delivery to test endpoint works
  - [ ] Email sending works (check test mailbox)

- [ ] **Performance & Monitoring**
  - [ ] CPU usage normal (<50% idle at baseline)
  - [ ] Memory stable (no leaks)
  - [ ] Database query latency acceptable
  - [ ] Request latency p99 < 500ms
  - [ ] No increase in error rate
  - [ ] Grafana dashboard shows healthy metrics

- [ ] **Logs**
  - [ ] No error spam in application logs
  - [ ] No failed database migrations
  - [ ] No security warnings
  - [ ] Audit logs capturing user actions

- [ ] **User Communication**
  - [ ] Deployment success announced to team
  - [ ] On-call engineer confirms stability
  - [ ] If issues: communication sent to affected users

## Post-Deployment (1-2 Hours After)

- [ ] **Extended Monitoring**
  - [ ] No uptick in error rates
  - [ ] No unusual traffic patterns
  - [ ] Database performance stable
  - [ ] No cascading failures in dependent services

- [ ] **Data Integrity Checks**
  - [ ] New data writing correctly
  - [ ] Old data queries still work
  - [ ] Cache invalidation working (if applicable)

- [ ] **Analytics & Reporting**
  - [ ] Dashboard metrics flowing to BI tools
  - [ ] API usage tracking normal
  - [ ] Customer success notified (especially for UI changes)

## Rollback Plan

If critical issues occur:

```bash
# Immediate rollback (requires previous image tagged)
docker pull ghcr.io/myorg/ats:previous-version
kubectl set image deployment/ats-api \
  ats-api=ghcr.io/myorg/ats:previous-version \
  -n ats-production

# Verify rollback
curl https://api.example.com/version
kubectl logs -l app=ats-api -n ats-production
```

### Rollback Criteria

Roll back immediately if:
- ❌ Database migrations fail
- ❌ API refuses to start (OOM, panic, etc.)
- ❌ Error rate > 5%
- ❌ Login/auth completely broken
- ❌ Data corruption detected
- ❌ Memory leak causing OOM after < 1 hour

### Communication

After rollback:
1. Notify team of rollback + reason
2. Create incident post-mortem ticket
3. Identify root cause
4. Fix and re-deploy with additional testing

## Sign-Off

- [ ] **Deployment Lead**: _________________ Date: _________
- [ ] **On-Call Engineer**: _________________ Date: _________
- [ ] **Product Manager**: _________________ Date: _________

---

## Quick Reference: Deployment Commands

### Kubernetes
```bash
# View deployment
kubectl get deployment -n ats-production

# Update image
kubectl set image deployment/ats-api \
  ats-api=ghcr.io/myorg/ats:main \
  -n ats-production

# View rollout status
kubectl rollout status deployment/ats-api -n ats-production

# Rollback
kubectl rollout undo deployment/ats-api -n ats-production
```

### Docker Compose (Small Deployments)
```bash
docker-compose pull
docker-compose up -d --force-recreate
docker-compose logs -f
```

### Health Check
```bash
curl https://api.example.com/health
curl https://api.example.com/readiness
curl https://api.example.com/metrics | grep http_requests_total
```

## Post-Deployment Monitoring Dashboard

Set up Grafana dashboard with:
- Request rate (target: baseline ± 10%)
- Error rate (target: < 0.1%)
- Latency p99 (target: < 500ms)
- Database connection pool usage
- Memory usage (target: < 70% of limit)
- Webhook delivery success rate (target: > 99%)
