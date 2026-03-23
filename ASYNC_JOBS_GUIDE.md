# Async Job Queue - Phase 13

## Overview
This module introduces background job processing using Bull with Redis. It enables large operations like bulk imports, report generation, and email campaigns to run asynchronously with progress tracking and retries.

## Queues
- `bulk-import`: Candidate CSV imports and similar batch operations
- `reports`: Heavy report generation tasks (PDF/Excel)
- `emails`: Email campaign sending in batches

## API Endpoints
Base: `/api/v1/jobs`

- POST `/bulk-import` – Enqueue candidate import
- POST `/report` – Enqueue report generation
- POST `/email-campaign` – Enqueue email campaign
- GET `/:queue/:id` – Get job details
- GET `/:queue?state=waiting|active|completed|failed|delayed&start=0&end=50` – List jobs
- GET `/:queue/stats` – Queue statistics

Permissions:
- `jobs:enqueue` – Enqueue jobs
- `jobs:read` – Read job status and statistics

## Configuration
Environment variables:
- `REDIS_HOST=127.0.0.1`
- `REDIS_PORT=6379`
- `REDIS_PASSWORD=` (optional)

## Running Redis
- Docker:
```bash
docker run -d -p 6379:6379 redis:alpine
```

- Windows (native):
Install a Redis server from Microsoft archive or use WSL/Docker.

## Usage Examples

Enqueue bulk import:
```bash
curl -X POST http://localhost:3000/api/v1/jobs/bulk-import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "uuid-company",
    "file_path": "https://s3/.../candidates.csv",
    "label": "Q1-candidate-import",
    "dry_run": false
  }'
```

Check job:
```bash
curl -X GET http://localhost:3000/api/v1/jobs/bulk-import/<jobId> \
  -H "Authorization: Bearer $TOKEN"
```

List jobs:
```bash
curl -X GET "http://localhost:3000/api/v1/jobs/bulk-import?state=active&start=0&end=50" \
  -H "Authorization: Bearer $TOKEN"
```

Queue stats:
```bash
curl -X GET http://localhost:3000/api/v1/jobs/bulk-import/stats \
  -H "Authorization: Bearer $TOKEN"
```

## Patterns & Best Practices
- Use `attempts` + `backoff` for resilient jobs
- Track `progress` for user feedback
- Keep jobs idempotent where possible
- Use `removeOnComplete` to keep queues clean
- Consider a dedicated Redis in production

## Next Integrations
- ✅ Connected bulk candidate import endpoints (CSV + JSON) with `?async=true` flag
- ✅ Added WebSocket gateway for live job progress on all queues
- Consider adding admin UI to visualize job status and history

## WebSocket Live Progress
The system broadcasts real-time job events via WebSocket namespace `/ws/jobs`.

### Frontend Integration
Install socket.io-client:
```bash
npm install socket.io-client
```

Connect and listen for events:
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/ws/jobs', {
  transports: ['websocket'],
  auth: { token: 'your-jwt-token' } // Optional if auth required
});

socket.on('connect', () => console.log('Connected:', socket.id));

// Listen to bulk-import events
socket.on('jobs:bulk-import:active', (data) => {
  console.log('Job started:', data); // { id, name }
});

socket.on('jobs:bulk-import:progress', (data) => {
  console.log('Progress update:', data); // { id, progress }
  // Update UI progress bar: data.progress is 0-100
});

socket.on('jobs:bulk-import:completed', (data) => {
  console.log('Job completed:', data); // { id, result }
});

socket.on('jobs:bulk-import:failed', (data) => {
  console.error('Job failed:', data); // { id, error }
});

// Similar patterns for 'reports' and 'emails' queues
socket.on('jobs:reports:progress', (data) => { /* ... */ });
socket.on('jobs:emails:completed', (data) => { /* ... */ });
```

### Event Channels
Format: `jobs:<queue>:<event>`

Queues: `bulk-import`, `reports`, `emails`

Events: `active`, `progress`, `completed`, `failed`

Payload:
- `active`: `{ id, name }`
- `progress`: `{ id, progress }` (progress is 0-100)
- `completed`: `{ id, result }`
- `failed`: `{ id, error }`

## Completion Checklist
- [x] Bull queues configured
- [x] Processors for bulk-import, reports, emails
- [x] Enqueue and monitoring endpoints
- [x] Build passing
- [x] Integrated bulk operations with async flag
- [x] WebSocket live updates for all queues
