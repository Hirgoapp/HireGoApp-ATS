# Grafana Dashboard Setup Guide

This guide covers setting up Grafana to visualize ATS SaaS production metrics collected by Prometheus.

## Quick Start (Docker Compose)

### 1. Start the Monitoring Stack

```bash
cd /path/to/ats
docker-compose -f docker-compose.monitoring.yml up -d
```

This starts:
- **API** (port 3000): NestJS ATS backend with metrics endpoint.
- **Postgres** (port 5432): Database.
- **Prometheus** (port 9090): Time-series metrics DB.
- **Grafana** (port 3001): Visualization dashboard.

### 2. Access Grafana

- **URL**: http://localhost:3001
- **Default credentials**:
  - Username: `admin`
  - Password: `admin`

### 3. View the Dashboard

Once logged in:
1. Navigate to **Dashboards** (left sidebar).
2. Select **ATS Dashboards** folder.
3. Click **ATS SaaS - Production Metrics**.

The dashboard automatically loads the `grafana-dashboard-ats-prod.json` provisioned dashboard.

## Dashboard Panels

| Panel | Description | Metric |
|-------|-------------|--------|
| **HTTP Request Rate** | Requests per second by route | `rate(http_requests_total[5m])` |
| **HTTP Latency** | p95/p99 response times | `histogram_quantile(...)` |
| **Error Rate** | 5xx errors per second | `rate(http_requests_total{status=~"5.."}[5m])` |
| **Webhook Deliveries** | Webhooks sent (stacked by status) | `increase(webhook_deliveries_total[5m])` |
| **Email Sends** | Emails sent (by template & status) | `increase(email_sends_total[5m])` |

## Manual Dashboard Import

If provisioning doesn't work:

### 1. Get the Dashboard JSON

```bash
cat grafana-dashboard-ats-prod.json
```

### 2. Import into Grafana UI

1. Go to **Dashboards** → **New** → **Import**.
2. Paste the JSON or upload `grafana-dashboard-ats-prod.json`.
3. Select **Prometheus** as the data source.
4. Click **Import**.

## Prometheus Configuration

The stack uses `prometheus.yml` to scrape metrics from the API:

```yaml
scrape_configs:
  - job_name: 'ats-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### Verify Prometheus Scraping

1. Go to http://localhost:9090.
2. Search for `http_requests_total` in **Graph** tab.
3. You should see a graph of request counts.

## Customizing the Dashboard

### Add a New Panel

1. In Grafana, click **Add Panel** (top-right).
2. Write a Prometheus query, e.g.:
   ```
   rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
   ```
3. Configure visualization type (graph, gauge, stat, etc.).
4. Save the dashboard.

### Useful Metrics

All metrics exposed at `GET /metrics`:

- **HTTP**:
  - `http_requests_total` — Total requests (labels: method, route, status).
  - `http_request_duration_seconds` — Latency histogram.

- **Business**:
  - `webhook_deliveries_total` — Webhook delivery attempts (labels: status).
  - `email_sends_total` — Email sends (labels: template, provider, status).

- **System** (from prom-client default):
  - `nodejs_heap_size_used_bytes` — Node.js memory usage.
  - `process_resident_memory_bytes` — Process memory (RSS).
  - `process_cpu_seconds_total` — CPU time.

## Production Setup

### 1. Replace Prometheus Config

In production, edit `prometheus.yml` to scrape from actual API servers:

```yaml
scrape_configs:
  - job_name: 'ats-prod'
    static_configs:
      - targets: ['api.production.com:3000']
    metrics_path: '/metrics'
    scheme: 'https'
    tls_config:
      insecure_skip_verify: false
```

### 2. Deploy with Kubernetes

Use Helm charts:

```bash
# Add Prometheus community repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --values prometheus-values.yml

# Port-forward to access Grafana
kubectl port-forward svc/prometheus-grafana 3001:80
```

### 3. Persist Data

In production, use external storage:

```yaml
# docker-compose.monitoring.yml
prometheus:
  volumes:
    - name: prometheus-data
      persistentVolumeClaim:
        claimName: prometheus-pvc
```

## Alerting (Optional)

Add alert rules in Prometheus:

```yaml
# prometheus-alerts.yml
groups:
  - name: ats_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High 5xx error rate detected"
```

## Troubleshooting

**Q: Dashboard panels show "No data"**
- Verify Prometheus is scraping: http://localhost:9090/targets
- Check API is running: http://localhost:3000/metrics
- Ensure metrics are being incremented (send test requests).

**Q: Prometheus can't reach API**
```
error="Get \"http://localhost:3000/metrics\": connection refused"
```
- Verify API is running: `docker-compose -f docker-compose.monitoring.yml ps`
- Check network: `docker network ls` and `docker inspect <network-name>`
- If using custom Docker network, update prometheus.yml to use service name: `http://api:3000`

**Q: Grafana provisioning not working**
- Check volume mounts in docker-compose.
- Verify files exist: `ls grafana/provisioning-*`
- Check Grafana logs: `docker logs <grafana-container-id>`

## Cleanup

Stop the monitoring stack:

```bash
docker-compose -f docker-compose.monitoring.yml down
docker-compose -f docker-compose.monitoring.yml down -v  # Also remove volumes
```

## References

- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/grafana/latest/)
- [prom-client (Node.js)](https://github.com/siimon/prom-client)
