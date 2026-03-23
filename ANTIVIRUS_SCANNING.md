# Antivirus Scanning (ClamAV Integration)

Optional on-demand virus scanning for uploaded documents using ClamAV daemon.

## Overview

When enabled, all file uploads are scanned via the [ClamAV](https://www.clamav.net/) antivirus daemon before being stored. If malware is detected, the upload is rejected.

## Setup

### 1. Install ClamAV Daemon

**Ubuntu/Debian:**
```bash
apt-get install clamav clamav-daemon
```

**macOS (Homebrew):**
```bash
brew install clamav
```

**Docker:**
```bash
docker run -d --name clamd -p 3310:3310 mkodockx/docker-clamav
```

### 2. Configure ClamAV

Ensure the daemon is running on a known host/port:

```bash
# Start daemon
clamd

# Test connection
echo "PING" | nc localhost 3310
# Expected response: PONG
```

### 3. Set Environment Variables

```bash
export CLAMD_HOST=localhost
export CLAMD_PORT=3310
```

Optional (defaults shown):
- `CLAMD_TIMEOUT=10000` - Timeout in milliseconds for scan operations.

## How It Works

1. User uploads a file via `POST /api/v1/documents/upload`.
2. [VirusScannerService](../src/common/services/virus-scanner.service.ts) connects to ClamAV daemon.
3. File buffer is sent using INSTREAM protocol.
4. ClamAV responds with FOUND (malware detected) or OK (clean).
5. If infected, upload is rejected with 400 Bad Request.
6. If clean (or if ClamAV is unavailable), upload proceeds.

## Behavior When ClamAV Unavailable

- If `CLAMD_HOST` is not set: Scanning is disabled; all uploads proceed (no impact).
- If `CLAMD_HOST` is set but daemon is unreachable: Upload **succeeds** (fail-open mode).
  - **Override**: Set `CLAMD_FAIL_CLOSED=true` to reject uploads when ClamAV is unreachable.

## Database Integration

The `documents` table does not store scan results by default. To audit scans, you can:

1. Add a `malware_scan_status` column (enum: none, pending, clean, infected).
2. Update [VirusScannerService](../src/common/services/virus-scanner.service.ts) to log scan results.
3. Query audit logs for rejection history.

## Performance

- Single scan: ~100–500ms (depends on file size and ClamAV load).
- 10MB file on average system: ~200ms.
- Scanning is **synchronous** in the upload endpoint; consider async scanning for large files.

### Async Scanning (Future Enhancement)

For better UX with large files:
1. Accept upload immediately.
2. Queue scan in background job.
3. Update document status after scan completes.
4. Alert user of any detections.

## Production Checklist

- [ ] ClamAV daemon running on dedicated VM/container.
- [ ] Network isolation: ClamAV accessible only to API server.
- [ ] Regularly update ClamAV signatures: `freshclam` (automatic daemon).
- [ ] Monitor ClamAV logs for scan errors.
- [ ] Set alerts for high infection rates.
- [ ] Consider fail-closed mode (`CLAMD_FAIL_CLOSED=true`) if security is paramount.

## Troubleshooting

**Q: Connection refused**
```
Error: connect ECONNREFUSED 127.0.0.1:3310
```
- Verify ClamAV daemon is running: `ps aux | grep clamd`
- Check host/port: `echo "PING" | nc localhost 3310`

**Q: Timeout errors**
```
Error: ClamAV connection timeout
```
- Increase timeout: `export CLAMD_TIMEOUT=15000`
- Check ClamAV CPU/memory: `top`, `htop`

**Q: Signature database stale**
```
All files report as clean despite known malware
```
- Update signatures: `freshclam`
- Verify: `clamscan --version`, `sigtool -u`

## Example: Docker Compose Setup

```yaml
version: '3.8'
services:
  api:
    image: ats-saas:latest
    ports:
      - "3000:3000"
    environment:
      CLAMD_HOST: clamd
      CLAMD_PORT: 3310
      STORAGE_PROVIDER: s3
    depends_on:
      - clamd

  clamd:
    image: mkodockx/docker-clamav:latest
    ports:
      - "3310:3310"
    volumes:
      - clamd_data:/var/lib/clamav

volumes:
  clamd_data:
```

Run with:
```bash
docker-compose up -d
```

Then test:
```bash
curl -H "Authorization: Bearer TOKEN" \
  -F "file=@test.txt" \
  -F "entity_type=candidate" \
  -F "entity_id=123" \
  http://localhost:3000/api/v1/documents/upload
```

## References

- [ClamAV Manual](https://docs.clamav.net/)
- [ClamAV INSTREAM Protocol](https://docs.clamav.net/Usage/Scanning#instream)
