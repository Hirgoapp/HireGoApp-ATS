# Phase 4.3: Webhooks Module - Complete

## Overview
The Webhooks Module enables real-time event notifications to external systems via HTTP callbacks. Organizations can subscribe to application lifecycle events and receive immediate notifications when changes occur.

## Features Implemented

### 1. Webhook Subscription Management
- **Create Subscriptions**: Subscribe to specific event types with target URLs
- **Update Subscriptions**: Modify target URLs, headers, and retry configuration
- **Enable/Disable**: Toggle subscriptions on/off without deletion
- **Secret Rotation**: Generate new HMAC secrets for security
- **Soft Delete**: Preserve history with soft deletion

### 2. Event Types Supported
```typescript
- application.created          // New application submitted
- application.stage_changed    // Application moved to new stage
- application.rejected         // Application rejected
- application.hired            // Candidate hired
- candidate.created            // New candidate added
- candidate.updated            // Candidate profile updated
- job.published                // Job posting published
- job.closed                   // Job posting closed
- interview.scheduled          // Interview scheduled
- interview.completed          // Interview completed
- evaluation.submitted         // Interview evaluation submitted
- offer.sent                   // Offer sent to candidate
```

### 3. Webhook Delivery System
- **HMAC Signature**: Every webhook includes `X-Webhook-Signature` header for verification
- **Custom Headers**: Add custom headers to webhook requests
- **Timeout Handling**: 30-second timeout per delivery attempt
- **Exponential Backoff**: Automatic retry with increasing delays (60s, 120s, 240s)
- **Delivery Logging**: Track all attempts with responses and errors

### 4. Monitoring & Analytics
- **Delivery Logs**: View all webhook deliveries with status and responses
- **Statistics**: Success rate, total deliveries, failure count per subscription
- **Retry Queue**: Automatic background processing of failed deliveries
- **Test Endpoint**: Send test webhooks to verify configuration

## Database Schema

### webhook_subscriptions
```sql
id              UUID PRIMARY KEY
company_id      UUID FK → companies(id)
event_type      VARCHAR(100)
target_url      VARCHAR(500)
secret          VARCHAR(255)         -- HMAC signing secret
is_active       BOOLEAN
description     TEXT
retry_config    JSONB                -- { max_retries, retry_delay }
headers         JSONB                -- Custom HTTP headers
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
deleted_at      TIMESTAMPTZ

Indexes:
- (company_id, event_type)
- (company_id, is_active)
```

### webhook_logs
```sql
id              UUID PRIMARY KEY
company_id      UUID FK → companies(id)
subscription_id UUID FK → webhook_subscriptions(id)
event_type      VARCHAR(100)
payload         JSONB                -- Full webhook payload
status          VARCHAR(50)          -- pending, success, failed, retrying
http_status     INTEGER              -- HTTP response code
response_body   TEXT                 -- Response from target server
error_message   TEXT
retry_count     INTEGER
next_retry_at   TIMESTAMPTZ
created_at      TIMESTAMPTZ

Indexes:
- (company_id, subscription_id, created_at)
- (status)
- (next_retry_at)
```

## API Endpoints

### Subscription Management

#### Create Webhook Subscription
```http
POST /api/v1/webhooks/subscriptions
Permission: webhooks:create

{
  "eventType": "application.created",
  "targetUrl": "https://your-app.com/webhooks/ats",
  "description": "Application lifecycle notifications",
  "headers": {
    "Authorization": "Bearer your-token"
  },
  "retryConfig": {
    "max_retries": 3,
    "retry_delay": 60
  }
}

Response: {
  "id": "uuid",
  "secret": "generated-hmac-secret",
  "isActive": true,
  ...
}
```

#### List Subscriptions
```http
GET /api/v1/webhooks/subscriptions
    ?eventType=application.created
    &isActive=true
Permission: webhooks:read

Response: [
  {
    "id": "uuid",
    "eventType": "application.created",
    "targetUrl": "https://...",
    "isActive": true,
    "description": "...",
    "retryConfig": { "max_retries": 3, "retry_delay": 60 },
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Update Subscription
```http
PUT /api/v1/webhooks/subscriptions/:id
Permission: webhooks:update

{
  "targetUrl": "https://new-url.com/webhooks",
  "isActive": false,
  "retryConfig": {
    "max_retries": 5,
    "retry_delay": 120
  }
}
```

#### Rotate Secret
```http
POST /api/v1/webhooks/subscriptions/:id/rotate-secret
Permission: webhooks:update

Response: {
  "secret": "new-generated-secret"
}
```

#### Test Webhook
```http
POST /api/v1/webhooks/subscriptions/:id/test
Permission: webhooks:test

Response: {
  "id": "log-uuid",
  "status": "success",
  "httpStatus": 200,
  "responseBody": "..."
}
```

#### Delete Subscription
```http
DELETE /api/v1/webhooks/subscriptions/:id
Permission: webhooks:delete

Response: 204 No Content
```

### Monitoring

#### Get Delivery Logs
```http
GET /api/v1/webhooks/logs
    ?subscriptionId=uuid
    &status=failed
    &startDate=2024-01-01
    &endDate=2024-01-31
Permission: webhooks:read

Response: [
  {
    "id": "uuid",
    "subscriptionId": "uuid",
    "eventType": "application.created",
    "status": "success",
    "httpStatus": 200,
    "retryCount": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Get Subscription Statistics
```http
GET /api/v1/webhooks/subscriptions/:id/stats
Permission: webhooks:read

Response: {
  "subscriptionId": "uuid",
  "eventType": "application.created",
  "isActive": true,
  "stats": {
    "total": 1250,
    "successful": 1200,
    "failed": 50,
    "pending": 0,
    "successRate": "96.00%"
  }
}
```

## Webhook Payload Format

All webhooks follow this standard format:

```json
{
  "event_type": "application.created",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    // Event-specific data
    "id": "uuid",
    "jobId": "uuid",
    "candidateId": "uuid",
    // ... additional fields
  }
}
```

### Headers Included
```
Content-Type: application/json
X-Webhook-Signature: <hmac-sha256-signature>
X-Webhook-Event: application.created
X-Webhook-ID: <log-uuid>
<custom headers from subscription>
```

## Security

### HMAC Signature Verification

Recipients should verify webhook authenticity using the HMAC signature:

```typescript
import * as crypto from 'crypto';

function verifyWebhookSignature(
  payload: any,
  signature: string,
  secret: string,
): boolean {
  const payloadString = JSON.stringify(payload);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

// Usage in webhook receiver
app.post('/webhooks/ats', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;
  
  if (!verifyWebhookSignature(payload, signature, YOUR_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
  res.status(200).json({ received: true });
});
```

## Retry Logic

### Retry Strategy
1. **Initial Attempt**: Immediate delivery on event
2. **First Retry**: After 60 seconds (configurable)
3. **Second Retry**: After 120 seconds (2x delay)
4. **Third Retry**: After 240 seconds (4x delay)
5. **Final State**: Marked as failed if max retries exceeded

### Retry Configuration
```json
{
  "max_retries": 3,      // Maximum retry attempts (0-10)
  "retry_delay": 60      // Initial delay in seconds
}
```

### Status Flow
```
pending → success (HTTP 2xx)
        ↓
pending → failed → retrying → success/failed
```

## Background Processing

The system runs a cron job every minute to process pending retries:

```typescript
@Cron(CronExpression.EVERY_MINUTE)
async processRetries() {
  // Find logs with status=retrying and nextRetryAt <= now
  // Attempt redelivery
  // Update status and schedule next retry if needed
}
```

## Integration with Application Flow

### Publishing Events

To publish events from your application code:

```typescript
import { WebhookService } from './modules/webhooks/webhook.service';
import { WebhookEventType } from './modules/webhooks/entities/webhook-subscription.entity';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly webhookService: WebhookService,
  ) {}

  async createApplication(dto: CreateApplicationDto): Promise<Application> {
    const application = await this.applicationRepository.save(...);
    
    // Publish webhook event
    await this.webhookService.publishEvent(
      application.companyId,
      WebhookEventType.APPLICATION_CREATED,
      {
        id: application.id,
        jobId: application.jobId,
        candidateId: application.candidateId,
        stage: application.stage,
        appliedAt: application.appliedAt,
      },
    );
    
    return application;
  }
}
```

## Files Created

### Migrations
- `1736255000000-CreateWebhookSubscriptionsTable.ts`
- `1736256000000-CreateWebhookLogsTable.ts`

### Entities
- `entities/webhook-subscription.entity.ts` - Subscription configuration
- `entities/webhook-log.entity.ts` - Delivery tracking

### DTOs
- `dto/webhook-subscription.dto.ts` - Create/Update/Filter DTOs
- `dto/webhook-log.dto.ts` - Log filter DTO

### Service & Controller
- `webhook.service.ts` - Business logic, delivery, retry processing
- `webhook.controller.ts` - REST API endpoints

### Module
- `webhooks.module.ts` - Module configuration

### Integration
- `app.module.ts` - Added WebhooksModule and ScheduleModule

## Dependencies Added
```json
{
  "axios": "^1.x.x",          // HTTP client for webhook delivery
  "@nestjs/schedule": "^4.x.x" // Cron jobs for retry processing
}
```

## Testing

### Manual Testing

1. **Create a Subscription**:
```bash
curl -X POST http://localhost:3000/api/v1/webhooks/subscriptions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "application.created",
    "targetUrl": "https://webhook.site/your-unique-url"
  }'
```

2. **Test the Webhook**:
```bash
curl -X POST http://localhost:3000/api/v1/webhooks/subscriptions/{id}/test \
  -H "Authorization: Bearer <token>"
```

3. **View Delivery Logs**:
```bash
curl -X GET http://localhost:3000/api/v1/webhooks/logs \
  -H "Authorization: Bearer <token>"
```

### Using webhook.site
1. Visit https://webhook.site to get a unique URL
2. Create a subscription pointing to that URL
3. Trigger an event or use the test endpoint
4. View the received webhook in webhook.site

## Next Steps

To integrate webhooks throughout the application:

1. **Add to ApplicationService**: Publish events on create/update/reject/hire
2. **Add to JobService**: Publish events on job published/closed
3. **Add to CandidateService**: Publish events on candidate create/update
4. **Add to InterviewService**: Publish events on interview scheduled/completed
5. **Add to EvaluationService**: Publish events on evaluation submitted
6. **Add to OfferService**: Publish events on offer sent

Example integration pattern:
```typescript
// After successful operation
await this.webhookService.publishEvent(
  companyId,
  WebhookEventType.APPLICATION_STAGE_CHANGED,
  payload,
);
```

## Phase 4.3 Status: ✅ COMPLETE

All webhook features have been implemented:
- ✅ Webhook subscription management
- ✅ Event publishing system
- ✅ Delivery with retries and exponential backoff
- ✅ HMAC signature validation
- ✅ Delivery logging and monitoring
- ✅ Background retry processing
- ✅ Statistics and analytics
- ✅ Test endpoint
- ✅ Secret rotation
- ✅ Multi-tenant isolation

**Ready for**: Phase 4.4 - Enhanced Audit Logging
