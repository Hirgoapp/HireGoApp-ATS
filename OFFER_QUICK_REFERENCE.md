# Offer Module - Quick Reference Guide

## Quick API Reference Table

| # | Method | Endpoint | Permission | Purpose |
|---|--------|----------|-----------|---------|
| 1 | POST | `/api/v1/offers` | `offers:create` | Create draft offer |
| 2 | GET | `/api/v1/offers` | `offers:read` | List offers (filtered) |
| 3 | GET | `/api/v1/offers/:id` | `offers:read` | Get single offer |
| 4 | PUT | `/api/v1/offers/:id` | `offers:update` | Update draft offer |
| 5 | PUT | `/api/v1/offers/:id/send` | `offers:update` | Send to candidate |
| 6 | PUT | `/api/v1/offers/:id/accept` | `offers:update` | Accept offer |
| 7 | PUT | `/api/v1/offers/:id/reject` | `offers:update` | Reject offer |
| 8 | PUT | `/api/v1/offers/:id/withdraw` | `offers:update` | Withdraw offer |
| 9 | POST | `/api/v1/offers/:id/revisions` | `offers:update` | Create revision |
| 10 | GET | `/api/v1/offers/submission/:subId/versions` | `offers:read` | Get all versions |
| 11 | GET | `/api/v1/offers/status/pending` | `offers:read` | Get pending offers |
| 12 | GET | `/api/v1/offers/status/expiring` | `offers:read` | Get expiring offers |
| 13 | GET | `/api/v1/offers/stats/distribution` | `offers:read` | Status distribution |
| 14 | GET | `/api/v1/offers/stats/count` | `offers:read` | Total count |
| 15 | GET | `/api/v1/offers/stats/average-ctc` | `offers:read` | Average CTC |
| 16 | DELETE | `/api/v1/offers/:id` | `offers:delete` | Delete offer |

---

## Common Use Cases

### Use Case 1: Create & Send Job Offer

**Scenario**: HR creates offer for selected candidate

**Steps**:
1. Create draft offer
2. Review internally
3. Send to candidate

**Code Examples**:

**cURL**:
```bash
# 1. Create draft offer
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "550e8400-e29b-41d4-a716-446655440001",
    "ctc": 1200000,
    "breakup": {
      "baseSalary": 800000,
      "dearness": 60000,
      "houseRent": 200000,
      "specialAllowance": 80000,
      "bonus": 60000,
      "totalCTC": 1200000
    },
    "designation": "Product Manager",
    "joiningDate": "2025-04-01",
    "department": "Product",
    "reportingManager": "Sarah Johnson",
    "location": "Mumbai",
    "expiresAt": "2025-02-05"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "id": "uuid",
#     "status": "draft",
#     "ctc": 1200000,
#     "designation": "Product Manager",
#     ...
#   }
# }

# 2. Send offer to candidate
OFFER_ID="uuid-from-response"
curl -X PUT http://localhost:3000/api/v1/offers/$OFFER_ID/send \
  -H "Authorization: Bearer $TOKEN"

# Response: Offer with status: "sent"
```

**JavaScript**:
```javascript
// 1. Create offer
const createResponse = await fetch('http://localhost:3000/api/v1/offers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    submissionId: 'submission-uuid',
    ctc: 1200000,
    breakup: {
      baseSalary: 800000,
      dearness: 60000,
      houseRent: 200000,
      specialAllowance: 80000,
      bonus: 60000,
      totalCTC: 1200000
    },
    designation: 'Product Manager',
    joiningDate: '2025-04-01',
    department: 'Product',
    reportingManager: 'Sarah Johnson',
    location: 'Mumbai'
  })
});

const { data: offer } = await createResponse.json();

// 2. Send offer
const sendResponse = await fetch(
  `http://localhost:3000/api/v1/offers/${offer.id}/send`,
  {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const { data: sentOffer } = await sendResponse.json();
console.log('Offer sent at:', sentOffer.sentAt);
```

**Python**:
```python
import requests
import json

headers = {'Authorization': f'Bearer {token}'}

# 1. Create offer
offer_data = {
    'submissionId': 'submission-uuid',
    'ctc': 1200000,
    'breakup': {
        'baseSalary': 800000,
        'dearness': 60000,
        'houseRent': 200000,
        'specialAllowance': 80000,
        'bonus': 60000,
        'totalCTC': 1200000
    },
    'designation': 'Product Manager',
    'joiningDate': '2025-04-01'
}

response = requests.post(
    'http://localhost:3000/api/v1/offers',
    headers=headers,
    json=offer_data
)
offer = response.json()['data']

# 2. Send offer
send_response = requests.put(
    f'http://localhost:3000/api/v1/offers/{offer["id"]}/send',
    headers=headers
)
sent_offer = send_response.json()['data']
print(f"Offer sent to candidate at {sent_offer['sentAt']}")
```

---

### Use Case 2: Candidate Accepts Offer

**Scenario**: Candidate reviews and accepts offer

**cURL**:
```bash
OFFER_ID="uuid"
curl -X PUT http://localhost:3000/api/v1/offers/$OFFER_ID/accept \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "success": true,
#   "data": {
#     "id": "uuid",
#     "status": "accepted",
#     "acceptedAt": "2025-01-25T10:30:00Z",
#     ...
#   }
# }
```

**JavaScript**:
```javascript
const acceptResponse = await fetch(
  `http://localhost:3000/api/v1/offers/${offerId}/accept`,
  {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const { data: acceptedOffer } = await acceptResponse.json();
```

---

### Use Case 3: Revise Offer After Negotiation

**Scenario**: Candidate negotiates salary, company creates revised offer

**cURL**:
```bash
OFFER_ID="uuid"
curl -X POST http://localhost:3000/api/v1/offers/$OFFER_ID/revisions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revisionReason": "Salary increase based on candidate negotiation",
    "ctc": 1300000,
    "breakup": {
      "baseSalary": 850000,
      "dearness": 70000,
      "houseRent": 220000,
      "specialAllowance": 90000,
      "bonus": 70000,
      "totalCTC": 1300000
    }
  }'

# Response: New offer with currentVersion: 2, status: "draft"
```

**JavaScript**:
```javascript
const revisionResponse = await fetch(
  `http://localhost:3000/api/v1/offers/${offerId}/revisions`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      revisionReason: 'Salary increase based on negotiation',
      ctc: 1300000,
      breakup: { ... }
    })
  }
);

const { data: revisedOffer } = await revisionResponse.json();
console.log(`Created revision ${revisedOffer.currentVersion}`);
```

---

### Use Case 4: View All Offer Versions for Candidate

**Scenario**: Track offer evolution for hiring decision documentation

**cURL**:
```bash
SUBMISSION_ID="uuid"
curl http://localhost:3000/api/v1/offers/submission/$SUBMISSION_ID/versions \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of all versions for submission
# [
#   { id: "uuid", currentVersion: 2, status: "accepted", ... },
#   { id: "uuid", currentVersion: 1, status: "rejected", ... }
# ]
```

**JavaScript**:
```javascript
const versionsResponse = await fetch(
  `http://localhost:3000/api/v1/offers/submission/${submissionId}/versions`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const versions = await versionsResponse.json();
versions.data.forEach((offer, index) => {
  console.log(`v${offer.currentVersion}: ${offer.status}`);
});
```

---

### Use Case 5: List All Pending Offers

**Scenario**: Manager views offers awaiting candidate response

**cURL**:
```bash
curl 'http://localhost:3000/api/v1/offers/status/pending?skip=0&take=20' \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "success": true,
#   "data": [
#     { id: "uuid", status: "sent", designation: "PM", ... },
#     { id: "uuid", status: "draft", designation: "Dev", ... }
#   ],
#   "total": 15
# }
```

**JavaScript**:
```javascript
const response = await fetch(
  'http://localhost:3000/api/v1/offers/status/pending?skip=0&take=20',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const { data: pendingOffers, total } = await response.json();
```

---

### Use Case 6: Filter Offers by Designation

**Scenario**: Find all offers for specific role

**cURL**:
```bash
curl 'http://localhost:3000/api/v1/offers?designation=Senior%20Engineer&take=10' \
  -H "Authorization: Bearer $TOKEN"

# Partial match on designation
```

**JavaScript**:
```javascript
const response = await fetch(
  'http://localhost:3000/api/v1/offers?designation=Senior Engineer&take=10',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

---

### Use Case 7: Get Offers Expiring Soon

**Scenario**: Identify offers close to expiration for follow-up

**cURL**:
```bash
# Get offers expiring within 7 days
curl 'http://localhost:3000/api/v1/offers/status/expiring?days=7' \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of offers with expiresAt within 7 days
```

---

### Use Case 8: Get Status Distribution

**Scenario**: View offer pipeline metrics

**cURL**:
```bash
curl http://localhost:3000/api/v1/offers/stats/distribution \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "success": true,
#   "data": {
#     "draft": 5,
#     "sent": 8,
#     "accepted": 12,
#     "rejected": 3,
#     "withdrawn": 2,
#     "expired": 1
#   }
# }
```

---

### Use Case 9: Get Average CTC

**Scenario**: Analyze salary expenditure trends

**cURL**:
```bash
curl http://localhost:3000/api/v1/offers/stats/average-ctc \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "success": true,
#   "data": 1285000
# }
```

---

### Use Case 10: Withdraw Offer

**Scenario**: Business needs change, withdraw sent offer

**cURL**:
```bash
OFFER_ID="uuid"
curl -X PUT http://localhost:3000/api/v1/offers/$OFFER_ID/withdraw \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Position filled internally"
  }'

# Response: Offer with status: "withdrawn"
```

---

## Status Codes & Errors

| Code | Scenario | Example Response |
|------|----------|------------------|
| 201 | Offer created | `{ "success": true, "data": {...} }` |
| 200 | Success (GET/PUT) | `{ "success": true, "data": {...} }` |
| 204 | Success (DELETE) | (No content) |
| 400 | Bad request | `{ "message": "Only draft offers can be sent" }` |
| 404 | Not found | `{ "message": "Offer not found" }` |
| 401 | Unauthorized | `{ "message": "Invalid token" }` |
| 403 | Forbidden | `{ "message": "Insufficient permissions" }` |
| 500 | Server error | `{ "message": "Internal server error" }` |

### Common Error Examples

**Duplicate offer**:
```json
{
  "statusCode": 400,
  "message": "Offer already exists for this submission"
}
```

**Invalid status transition**:
```json
{
  "statusCode": 400,
  "message": "Only draft offers can be sent"
}
```

**Offer expired**:
```json
{
  "statusCode": 400,
  "message": "Offer has expired"
}
```

**Offer not found**:
```json
{
  "statusCode": 404,
  "message": "Offer not found"
}
```

---

## Database Queries

### Query 1: Get All Active Offers by Status

```sql
SELECT id, submission_id, designation, ctc, status, created_at
FROM offers
WHERE company_id = $1
  AND deleted_at IS NULL
  AND status = $2
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### Query 2: Get All Versions for Candidate

```sql
SELECT id, submission_id, current_version, status, ctc, created_at
FROM offers
WHERE company_id = $1
  AND submission_id = $2
  AND deleted_at IS NULL
ORDER BY current_version DESC;
```

### Query 3: Get Expiring Offers

```sql
SELECT id, submission_id, designation, expires_at
FROM offers
WHERE company_id = $1
  AND status = 'sent'
  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND deleted_at IS NULL
ORDER BY expires_at ASC;
```

### Query 4: Status Distribution

```sql
SELECT status, COUNT(*) as count
FROM offers
WHERE company_id = $1
  AND deleted_at IS NULL
GROUP BY status;
```

### Query 5: Average CTC

```sql
SELECT AVG(ctc) as average_ctc
FROM offers
WHERE company_id = $1
  AND deleted_at IS NULL;
```

### Query 6: Offers by Month

```sql
SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count
FROM offers
WHERE company_id = $1
  AND created_at >= NOW() - INTERVAL '12 months'
  AND deleted_at IS NULL
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month ASC;
```

---

## Environment Setup

### Required Configuration

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ats_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# Feature Flags
ENABLE_OFFERS=true
OFFER_EXPIRY_DAYS=7
```

### Permissions Required

```json
{
  "offers:create": "Create new offers",
  "offers:read": "View offers and details",
  "offers:update": "Update offer details and status",
  "offers:delete": "Delete offers"
}
```

---

## Pagination & Filtering

### Pagination Example

```bash
# Get page 2 (20 per page)
curl 'http://localhost:3000/api/v1/offers?skip=20&take=20'

# Get page 3 (50 per page)
curl 'http://localhost:3000/api/v1/offers?skip=100&take=50'
```

### Filtering Combinations

```bash
# Draft offers only
curl 'http://localhost:3000/api/v1/offers?status=draft'

# Senior Engineer offers
curl 'http://localhost:3000/api/v1/offers?designation=Senior%20Engineer'

# For specific submission
curl 'http://localhost:3000/api/v1/offers?submissionId=uuid'

# Multiple filters
curl 'http://localhost:3000/api/v1/offers?status=sent&designation=Manager&take=10'
```

### Sorting Options

```bash
# Sort by creation date (newest first)
curl 'http://localhost:3000/api/v1/offers?sortBy=createdAt&sortOrder=DESC'

# Sort by joining date (earliest first)
curl 'http://localhost:3000/api/v1/offers?sortBy=joiningDate&sortOrder=ASC'

# Sort by last update (oldest first)
curl 'http://localhost:3000/api/v1/offers?sortBy=updatedAt&sortOrder=ASC'
```

---

## Offer Status Types

| Status | Description | Can Accept | Can Reject | Can Revise |
|--------|-------------|-----------|-----------|-----------|
| DRAFT | Being prepared | ✗ | ✗ | ✓ |
| SENT | Sent to candidate | ✗ | ✓ | ✓ |
| ACCEPTED | Candidate accepted | ✗ | ✗ | ✗ |
| REJECTED | Candidate rejected | ✗ | ✗ | ✗ |
| WITHDRAWN | Company withdrew | ✗ | ✗ | ✗ |
| EXPIRED | Acceptance deadline passed | ✗ | ✗ | ✗ |

---

## Salary Breakup Components

**Standard Components**:
- **baseSalary**: Fixed annual salary
- **dearness**: Dearness allowance
- **houseRent**: HRA (House Rent Allowance)
- **specialAllowance**: Special/other allowance
- **bonus**: Annual bonus (amount or %)
- **stockOptions**: ESOP/stock value
- **signingBonus**: Sign-on bonus
- **performanceBonus**: Performance-based bonus
- **otherBenefits**: Other benefits sum
- **totalCTC**: Total compensation (calculated)

**Example Breakup**:
```json
{
  "baseSalary": 800000,
  "dearness": 60000,
  "houseRent": 200000,
  "specialAllowance": 80000,
  "bonus": 60000,
  "totalCTC": 1200000
}
```

---

## Troubleshooting

### Issue: "Offer already exists for this submission"
**Solution**: Each submission can have one active offer. Create revision or delete previous offer.

### Issue: "Only draft offers can be updated"
**Solution**: Create revision to modify sent offers.

### Issue: "Offer has expired"
**Solution**: Candidate cannot accept expired offer. Create revision with new expiry date.

### Issue: "Invalid status transition"
**Solution**: Check offer status. Refer to status workflow table.

### Issue: Pagination not working
**Solution**: Ensure skip and take are numbers, and take ≤ max allowed.

### Issue: Filtering returns no results
**Solution**: Verify filter values match stored data exactly (case-sensitive for enum values).

---

## Performance Tips

1. **Use pagination**: Always paginate large result sets
2. **Filter early**: Use status/designation filters before fetching
3. **Batch operations**: Create revisions instead of updating sent offers
4. **Index awareness**: Primary filters (company_id, status, submission_id) are indexed
5. **Caching**: Cache offer list for same filters/pagination

---

## Related Endpoints

- **Submissions**: `/api/v1/submissions` (linked offers)
- **Candidates**: `/api/v1/candidates` (referenced via submission)
- **Jobs**: `/api/v1/jobs` (referenced via submission)
- **Interviews**: `/api/v1/interviews` (precede offers)

---

## API Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": { /* response object(s) */ },
  "total": 25 // only for paginated endpoints
}
```

All error responses:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "timestamp": "2025-01-25T10:30:00Z"
}
```

---

**Last Updated**: December 2025  
**Version**: 1.0  
**Status**: Production Ready
