# Load Testing Guide

This directory contains k6 load testing scripts to validate ATS SaaS performance under various conditions.

## Prerequisites

### Install k6

**macOS:**
```bash
brew install k6
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D3D0EB922D0B7D07A72B
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6-stable.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```bash
choco install k6
```

**Docker:**
```bash
docker run --rm -i loadimpact/k6 run -
```

### Generate Test Token

Create a test user account or use an existing one, then generate a JWT token:

```bash
# Login to your ATS instance
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Extract the `access_token` from response
```

## Test Scenarios

### 1. Baseline Load Test (`load-test-baseline.js`)

**Purpose**: Establish baseline performance with normal load

**Load Profile**:
- 0→10 users over 30s
- 10 users for 90s
- 10→50 users over 20s
- 50 users for 90s
- 50→0 users over 20s

**Thresholds**:
- p95 latency < 500ms
- p99 latency < 1000ms
- Error rate < 1%

**Run**:
```bash
k6 run \
  -e BASE_URL=http://localhost:3000 \
  -e API_TOKEN=your-jwt-token \
  k6/tests/load-test-baseline.js
```

### 2. Spike Test (`spike-test.js`)

**Purpose**: Detect how system handles sudden traffic spikes

**Load Profile**:
- 10 users baseline
- Spike to 100 users over 10s
- Hold for 30s
- Return to baseline

**Thresholds**:
- p95 latency < 1s
- p99 latency < 2s
- Error rate < 1%

**Run**:
```bash
k6 run \
  -e BASE_URL=http://localhost:3000 \
  -e API_TOKEN=your-jwt-token \
  k6/tests/spike-test.js
```

### 3. Stress Test (`stress-test.js`)

**Purpose**: Find breaking point of system

**Load Profile**:
- Gradual ramp: 0→50→100→200→500 users (5 stages)

**Thresholds**:
- p95 latency < 2s
- p99 latency < 3s
- Error rate < 5% (acceptable degradation)

**Run**:
```bash
k6 run \
  -e BASE_URL=http://localhost:3000 \
  -e API_TOKEN=your-jwt-token \
  k6/tests/stress-test.js
```

### 4. Endurance Test (`endurance-test.js`)

**Purpose**: Detect memory leaks and performance degradation over time

**Load Profile**:
- 2m ramp-up to 50 users
- 10m sustained at 50 users
- 2m ramp-down

**Thresholds**:
- p95 latency < 500ms (consistent)
- Error rate < 1%

**Run**:
```bash
k6 run \
  -e BASE_URL=http://localhost:3000 \
  -e API_TOKEN=your-jwt-token \
  k6/tests/endurance-test.js
```

## Run All Tests

Use the provided script:

```bash
bash k6/run-all-tests.sh
```

Or with custom settings:

```bash
BASE_URL=https://staging-api.example.com \
API_TOKEN=your-token \
bash k6/run-all-tests.sh
```

## Interpreting Results

### Key Metrics

| Metric | Interpretation |
|--------|---|
| `http_req_duration` | Response time (lower is better) |
| `http_req_failed` | % of failed requests (should be <1%) |
| `iterations` | Total requests completed |
| `vus` | Virtual users (concurrent) |
| `vus_max` | Peak concurrent users |

### Example Output

```
    data_received..................: 1.2 GB    12 MB/s
    data_sent.......................: 450 MB   4.5 MB/s
    http_req_blocked................: avg=5.4ms    min=1µs     med=2.1ms   max=123ms    p(90)=8.2ms  p(95)=10.3ms
    http_req_connecting.............: avg=3.2ms    min=0s      med=0s      max=89ms     p(90)=4.1ms  p(95)=6.2ms
    http_req_duration..............: avg=234ms    min=50ms    med=180ms   max=2.3s     p(90)=450ms  p(95)=550ms
    http_req_failed.................: 0.23%
    http_req_receiving.............: avg=12ms     min=0s      med=8ms     max=200ms    p(90)=25ms   p(95)=30ms
    http_req_sending...............: avg=3.2ms    min=0s      med=1ms     max=50ms     p(90)=5ms    p(95)=8ms
    http_req_tls_handshaking........: avg=0s       min=0s      med=0s      max=0s       p(90)=0s     p(95)=0s
    http_req_waiting...............: avg=218ms    min=35ms    med=165ms   max=2.1s     p(90)=425ms  p(95)=520ms
    http_requests..................: 5000      50/s
    iteration_duration..............: avg=250ms    min=65ms    med=195ms   max=2.4s     p(90)=480ms  p(95)=580ms
```

**✅ PASS Criteria**:
- p95 latency < 500ms ✓
- p99 latency < 1000ms ✓
- Error rate < 1% ✓

## Troubleshooting

**Q: "Connection refused" errors**
- Ensure API is running: `curl http://localhost:3000/health`
- Check BASE_URL is correct

**Q: "Unauthorized" (401) errors**
- Verify API_TOKEN is valid JWT
- Check token hasn't expired
- Ensure user has required permissions

**Q: High error rates**
- Check API logs for errors
- Verify database is responsive
- Reduce concurrent users (--vus flag)
- Increase duration (--duration flag) for warm-up

**Q: Out of memory**
- k6 is running in test machine memory
- Reduce VUs or use k6 Cloud for distributed load

## Performance Baselines (Target)

| Endpoint | Avg Latency | p95 | p99 | Error Rate |
|----------|-------------|-----|-----|-----------|
| GET /candidates | 100ms | 250ms | 400ms | <0.1% |
| POST /candidates/search/advanced | 150ms | 400ms | 800ms | <0.5% |
| POST /candidates | 200ms | 500ms | 1000ms | <0.5% |
| GET /dashboard/key-stats | 80ms | 200ms | 300ms | <0.1% |
| GET /applications | 120ms | 300ms | 500ms | <0.1% |
| GET /health | 20ms | 50ms | 100ms | <0.01% |

## Production Load Estimate

**Expected peak load** (based on 500 concurrent users):
- **RPS**: ~5,000 requests/sec
- **Bandwidth**: 15-20 MB/s (both directions)
- **Database**: ~5,000 queries/sec
- **Memory**: 4-8 GB
- **CPU**: 4-8 cores recommended

## Continuous Monitoring

Integrate load tests into CI/CD:

```yaml
# GitHub Actions example
- name: Run load tests
  run: |
    bash k6/run-all-tests.sh
    # Fail if errors > threshold
    grep "http_req_failed: 0" k6/results/*.csv
```

## References

- [k6 Official Docs](https://k6.io/docs/)
- [k6 GitHub](https://github.com/grafana/k6)
- [k6 Best Practices](https://k6.io/docs/using-k6/scenarios/executors/)
