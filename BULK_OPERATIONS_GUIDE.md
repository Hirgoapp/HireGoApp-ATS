# Bulk Operations Guide

## Overview

The ATS Backend supports bulk operations for efficient data management at scale. This guide covers bulk import and bulk update operations for candidates.

## Features

- **Bulk Import**: Import candidates from JSON arrays or CSV files
- **Bulk Update**: Update multiple candidates simultaneously
- **Duplicate Detection**: Automatic detection with skip or fail options
- **Error Handling**: Detailed error reporting per row/candidate
- **Progress Tracking**: Real-time success/failure counts
- **CSV Support**: Full CSV parsing with column mapping and validation

---

## Bulk Import from JSON

### Endpoint

```
POST /api/v1/candidates/bulk/import
```

### Request Body

```json
{
  "candidates": [
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "location": "San Francisco, CA",
      "skill_set": ["JavaScript", "React", "Node.js"],
      "experience_years": 5,
      "status": "NEW",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "github_url": "https://github.com/johndoe",
      "notes": "Experienced full-stack developer",
      "custom_fields": {
        "certification": "AWS Certified",
        "availability": "immediate"
      },
      "tags": ["senior", "remote"]
    }
  ],
  "skip_duplicates": true,
  "send_welcome_email": false,
  "assign_to_recruiter_id": "uuid-of-recruiter"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `candidates` | Array | Yes | Array of candidate objects to import |
| `skip_duplicates` | Boolean | No | If true, skip candidates with duplicate emails instead of failing (default: false) |
| `send_welcome_email` | Boolean | No | Send welcome email to imported candidates (default: false) |
| `assign_to_recruiter_id` | String (UUID) | No | Assign all imported candidates to specified recruiter |

### Response

```json
{
  "total": 50,
  "success": 47,
  "failed": 1,
  "skipped": 2,
  "errors": [
    {
      "row": 5,
      "email": "duplicate@example.com",
      "error": "Email already exists (skipped)"
    },
    {
      "row": 12,
      "email": "invalid@",
      "name": "Test User",
      "error": "Invalid email format"
    }
  ],
  "imported_ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

---

## Bulk Import from CSV

### Endpoint

```
POST /api/v1/candidates/bulk/import/csv
```

### Request

**Content-Type**: `multipart/form-data`

**Form Fields**:
- `file` (required): CSV file with candidate data
- `skip_duplicates` (optional): Boolean flag
- `send_welcome_email` (optional): Boolean flag
- `assign_to_recruiter_id` (optional): UUID string

### CSV Format

#### Required Columns
- `name`
- `email`

#### Optional Columns
- `phone`
- `location`
- `skill_set` (comma or semicolon-separated)
- `experience_years`
- `status` (NEW, SCREENING, INTERVIEWING, OFFERED, HIRED, REJECTED, WITHDRAWN)
- `linkedin_url`
- `github_url`
- `notes`
- `tags` (comma or semicolon-separated)
- `custom_fields` (JSON string)

#### Column Aliases

The CSV parser supports flexible column naming:

| Standard Name | Accepted Aliases |
|---------------|------------------|
| `email` | `email_address`, `e_mail` |
| `phone` | `phone_number`, `telephone`, `mobile` |
| `skill_set` | `skills`, `technologies`, `tech_stack` |
| `experience_years` | `experience`, `years_of_experience`, `yoe` |
| `linkedin_url` | `linkedin`, `linkedin_profile` |
| `github_url` | `github`, `github_profile` |

#### Example CSV

```csv
name,email,phone,location,skill_set,experience_years,status,linkedin_url,github_url,notes,tags
John Doe,john.doe@example.com,+1234567890,"San Francisco, CA","JavaScript,React,Node.js",5,NEW,https://linkedin.com/in/johndoe,https://github.com/johndoe,Experienced full-stack developer,"senior,remote"
Jane Smith,jane.smith@example.com,+9876543210,"New York, NY","Python,Django,PostgreSQL",7,SCREENING,https://linkedin.com/in/janesmith,,Strong backend engineer,"backend,senior"
```

### Download CSV Template

```
GET /api/v1/candidates/bulk/csv-template
```

Returns a sample CSV file with headers and one example row.

### Example: Upload CSV via cURL

```bash
curl -X POST http://localhost:3000/api/v1/candidates/bulk/import/csv \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@candidates.csv" \
  -F "skip_duplicates=true" \
  -F "assign_to_recruiter_id=uuid-of-recruiter"
```

---

## Bulk Update

### Endpoint

```
POST /api/v1/candidates/bulk/update
```

### Request Body

```json
{
  "candidate_ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ],
  "status": "SCREENING",
  "recruiter_id": "uuid-of-recruiter",
  "add_tags": ["reviewed", "priority"],
  "remove_tags": ["pending"],
  "add_notes": "Moved to screening phase via bulk operation"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `candidate_ids` | Array (UUID) | Yes | Array of candidate IDs to update |
| `status` | Enum | No | New status for all candidates |
| `recruiter_id` | String (UUID) | No | Assign all candidates to this recruiter |
| `add_tags` | Array (String) | No | Tags to add (won't duplicate existing tags) |
| `remove_tags` | Array (String) | No | Tags to remove |
| `add_notes` | String | No | Notes to append (timestamped automatically) |

### Response

```json
{
  "total": 10,
  "success": 9,
  "failed": 1,
  "errors": [
    {
      "candidate_id": "uuid-5",
      "error": "Candidate not found or does not belong to your company"
    }
  ],
  "updated_ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

---

## Use Cases

### 1. Initial Data Migration

**Scenario**: Migrating 1,000 candidates from legacy system

**Approach**:
1. Export candidates to CSV from legacy system
2. Map columns to ATS format (see CSV template)
3. Use bulk import CSV endpoint with `skip_duplicates: true`
4. Review error report and fix failed rows
5. Re-import failed rows after corrections

**Example**:

```bash
# Download template
curl -o template.csv http://localhost:3000/api/v1/candidates/bulk/csv-template \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Upload your mapped CSV
curl -X POST http://localhost:3000/api/v1/candidates/bulk/import/csv \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@legacy_candidates.csv" \
  -F "skip_duplicates=true"
```

### 2. Bulk Status Change

**Scenario**: Move 50 candidates from SCREENING to INTERVIEWING

**Approach**:
1. Get list of candidate IDs (via search or filter)
2. Use bulk update endpoint to change status
3. Optionally add notes explaining the batch change

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/candidates/bulk/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_ids": ["uuid-1", "uuid-2", ...],
    "status": "INTERVIEWING",
    "add_notes": "Advanced to interview stage after initial screening"
  }'
```

### 3. Recruiter Reassignment

**Scenario**: Reassign 100 candidates to a new recruiter

**Approach**:

```bash
curl -X POST http://localhost:3000/api/v1/candidates/bulk/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_ids": ["uuid-1", "uuid-2", ...],
    "recruiter_id": "new-recruiter-uuid",
    "add_notes": "Reassigned due to team restructuring"
  }'
```

### 4. Tag Management

**Scenario**: Add "Q1-2026" tag to all candidates created in Q1

**Approach**:

```bash
curl -X POST http://localhost:3000/api/v1/candidates/bulk/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_ids": ["uuid-1", "uuid-2", ...],
    "add_tags": ["Q1-2026", "reviewed"]
  }'
```

---

## Error Handling

### Common CSV Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing required fields (name, email)` | Row missing name or email | Add required data |
| `Invalid email format` | Email doesn't match pattern | Fix email format |
| `Email already exists` | Duplicate email in database | Use `skip_duplicates: true` or remove duplicate |
| `Duplicate email in import batch` | Same email appears multiple times in CSV | Remove duplicates from CSV |

### Common Bulk Update Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Candidate not found` | ID doesn't exist or wrong company | Verify candidate ID and company ownership |
| `Invalid status value` | Status not in allowed enum | Use valid status (NEW, SCREENING, etc.) |

---

## Best Practices

### 1. **Start Small**
- Test with 10-20 records first
- Review errors and adjust process
- Scale up to full dataset

### 2. **Use skip_duplicates for Migrations**
- Set `skip_duplicates: true` for initial imports
- Review skipped records to ensure no data loss
- Re-import critical missing records manually

### 3. **Validate CSV Before Upload**
- Use CSV template as reference
- Validate emails with regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Ensure required columns exist
- Test with small sample first

### 4. **Handle Errors Gracefully**
- Check response for `errors` array
- Log failed rows with details
- Fix and re-import failed records
- Keep original CSV for audit trail

### 5. **Chunking for Large Datasets**
- For 10,000+ records, split into chunks of 500-1000
- Import chunks sequentially with delay (avoid rate limits)
- Track progress and resume from last successful chunk

**Example Chunking Script**:

```javascript
async function bulkImportInChunks(candidates, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < candidates.length; i += chunkSize) {
    chunks.push(candidates.slice(i, i + chunkSize));
  }

  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Importing chunk ${i + 1}/${chunks.length}...`);
    const result = await fetch('/api/v1/candidates/bulk/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        candidates: chunks[i],
        skip_duplicates: true
      })
    });
    results.push(await result.json());
    
    // Delay between chunks (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
```

### 6. **Monitor Performance**
- Track import time vs. record count
- Monitor database CPU/memory during large imports
- Consider async processing for 5,000+ records (future enhancement)

---

## Performance Considerations

### Current Limitations

- **Synchronous Processing**: Bulk operations are processed synchronously
- **Recommended Batch Size**: 500-1000 records per request
- **Timeout Risk**: Very large imports (5,000+ records) may timeout

### Timeouts

- Default HTTP timeout: 30 seconds
- For large imports, split into smaller batches
- Future enhancement: Async job queue for large imports (10,000+ records)

### Database Impact

- Bulk import creates N database INSERT operations
- Bulk update creates N UPDATE operations
- Ensure database has adequate resources for concurrent operations

---

## Future Enhancements

- [ ] Async job queue for large imports (Bull/BullMQ)
- [ ] Progress tracking via WebSocket or polling endpoint
- [ ] Excel (.xlsx) file support
- [ ] Dry-run mode (validation only, no import)
- [ ] Import history and rollback
- [ ] Resume failed imports from checkpoint

---

## Troubleshooting

### Issue: CSV Import Returns 400 "CSV parsing failed"

**Cause**: Invalid CSV format or encoding

**Solution**:
- Ensure CSV is UTF-8 encoded
- Check for proper quote escaping (`"` should be `""`)
- Verify no extra commas in quoted fields
- Use CSV template as reference

### Issue: All Rows Skipped as Duplicates

**Cause**: Emails already exist in database

**Solution**:
- Use advanced search to verify existing candidates
- Check if candidates were already imported
- If updating existing candidates, use bulk update instead

### Issue: Bulk Update Returns "Candidate not found"

**Cause**: Candidate IDs belong to different company or don't exist

**Solution**:
- Verify candidate IDs with GET endpoint first
- Ensure IDs are from your company (multi-tenant isolation)
- Check for typos in UUIDs

### Issue: Import Slow for Large CSV

**Cause**: Network latency or database load

**Solution**:
- Split CSV into smaller files (500-1000 records each)
- Import during off-peak hours
- Consider increasing server resources

---

## Security Considerations

### Authentication
- All bulk operations require valid JWT token
- Token must include `company_id` for multi-tenant isolation

### Authorization
- Bulk import requires `candidates:create` permission
- Bulk update requires `candidates:update` permission
- RBAC enforcement prevents cross-company operations

### Data Validation
- All inputs validated via class-validator decorators
- Email format validated with regex
- SQL injection prevented via TypeORM parameterization
- File upload restricted to CSV files only

### Rate Limiting
- Consider implementing rate limits for bulk endpoints
- Recommended: 10 requests per minute per user
- Use Redis for distributed rate limiting

---

## API Reference Summary

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/v1/candidates/bulk/import` | POST | `candidates:create` | Import from JSON |
| `/api/v1/candidates/bulk/import/csv` | POST | `candidates:create` | Import from CSV |
| `/api/v1/candidates/bulk/csv-template` | GET | `candidates:read` | Download CSV template |
| `/api/v1/candidates/bulk/update` | POST | `candidates:update` | Bulk update candidates |

---

## Support

For issues or questions:
- Check this guide first
- Review error messages in response
- Check application logs for detailed stack traces
- Contact support with error details and request IDs
