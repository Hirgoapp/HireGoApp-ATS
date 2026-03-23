# Email-Driven Job Module - API Layer Complete

## Summary

The email-driven requirement import API layer has been successfully built. All endpoints are requirement-centric, implement proper versioning, and follow the architectural decisions locked in earlier.

---

## API Endpoints

### 1. POST `/api/v1/requirements/import/preview`

**Purpose:** Parse email and show preview (without saving anything)

**First step of the workflow:**
1. User pastes raw email content
2. Service extracts fields using JobEmailParserService
3. Returns preview with confidence score + potential duplicate warning

**Request Body:**
```typescript
{
  rawEmailContent: string,        // Complete email text (required)
  emailSubject?: string,          // Email subject line (helps extract ECMS ID)
  emailFrom?: string,             // Sender email
  emailReceivedAt?: string        // ISO date string
}
```

**Response (200 OK):**
```typescript
{
  jobId: string,                  // Temporary preview ID
  rawEmailContent: string,        // Email as stored
  extractedFields: {
    client_req_id?: string,       // ECMS Req ID (e.g., "545390")
    job_title?: string,
    skills?: string[],
    experience_years?: number,
    work_locations?: string[],
    interview_mode?: string,
    work_mode?: string,
    vendor_rate_text?: string,
    // ... other extracted fields
  },
  parsingConfidence: number,      // 0.0-1.0 score
  parsingErrors: string[],        // Any extraction errors
  instructions: [{
    id: string,
    type: 'submission'|'interview'|'compliance'|'general',
    title: string,
    content: string,
    highlight_level: 'critical'|'high'|'normal',
    is_mandatory: boolean
  }],
  candidateTracker: {
    id: string,
    required_fields: [{
      field: string,
      type: string,
      required: boolean,
      description: string
    }],
    field_order: string[],
    validation_rules: {},
    template_content: string
  } | null,
  attachmentsMetadata: [{
    filename: string,
    mimeType: string,
    size: number
  }],
  potentialDuplicateMatch?: {
    previousJobId: string,
    clientReqId: string,
    previousVersion: number,
    lastVersionDate: string,
    versioningAction: 'replace'    // Always 'replace' for re-imports
  }
}
```

**Key Features:**
- ✅ Best-effort parsing (never blocking)
- ✅ Confidence score shows extraction quality
- ✅ Duplicate detection: if clientReqId exists, warns user
- ✅ No data saved yet - safe to preview multiple times

---

### 2. POST `/api/v1/requirements/import/confirm`

**Purpose:** Create requirement after user review + edits

**Second step of the workflow:**
1. User reviewed preview
2. Made optional edits to fields, instructions, tracker
3. Confirms and creates requirement

**Request Body:**
```typescript
{
  rawEmailContent: string,        // Must match preview (required)
  editedFields?: {                // User modifications
    client_req_id?: string,
    title?: string,
    description?: string,
    skills?: string[],
    // ... any other job fields
  },
  editedInstructions?: [{         // User edits to instructions
    type: 'submission'|'interview'|'compliance'|'general',
    title: string,
    content: string,
    highlight_level: 'critical'|'high'|'normal',
    is_mandatory: boolean
  }],
  editedCandidateTracker?: {      // User edits to tracker
    required_fields: [{
      field: string,
      type: string,
      required: boolean,
      description: string
    }],
    field_order: string[],
    validation_rules: {},
    template_content: string
  },
  clientId?: string,              // Optional: link to known client
  approvalNote?: string           // Why this requirement is created
}
```

**Response (201 Created):**
```typescript
{
  jobId: string,                  // NEW requirement ID
  clientReqId: string,            // ECMS ID from email
  title: string,
  requirementStatus: 'open',      // Always 'open' on creation
  version: number,                // 1 for new, 2+ for re-imports
  isLatestVersion: boolean,       // true for newly created
  replacedPreviousJobId?: string, // If version > 1, shows old job ID
  emailSourceId: string,          // Link to raw email storage
  instructionCount: number,       // Instructions created
  hasCandidateTracker: boolean,   // Whether tracker was created
  createdAt: string,              // ISO timestamp
  detailsUrl: string              // Link to fetch full details
}
```

**Versioning Logic (Critical):**
- If `clientReqId` is NEW: creates version 1 with status='open'
- If `clientReqId` exists with status='open': 
  - Marks previous as status='replaced', is_latest_version=false
  - Creates new version with version_number++
  - New version is status='open', is_latest_version=true
- All old versions are preserved forever (can view history)

**Transaction Behavior:**
- All entities created atomically (Job + EmailSource + Instructions + Tracker)
- On error: entire transaction rolled back
- No partial creates

---

### 3. GET `/api/v1/requirements/:jobId/details`

**Purpose:** Fetch complete requirement details

**Returns:**
- Raw email content (source of truth)
- All instructions with metadata
- Candidate tracker template
- Attachment metadata
- Link to previous version (if applicable)

**Response (200 OK):**
```typescript
{
  jobId: string,
  clientReqId: string,
  title: string,
  status: string,
  version: number,
  rawEmail: {
    emailSourceId: string,
    rawEmailContent: string,      // COMPLETE EMAIL - source of truth
    emailSubject?: string,
    emailFrom?: string,
    emailReceivedAt: string        // ISO timestamp
  },
  instructions: [{                // ALL instructions for this requirement
    id: string,
    type: 'submission'|'interview'|'compliance'|'general',
    title: string,
    content: string,
    highlight_level: 'critical'|'high'|'normal',
    is_mandatory: boolean,
    display_order: number
  }],
  candidateTracker: {
    id: string,
    required_fields: [{...}],
    field_order: string[],
    validation_rules: {},
    template_content: string
  } | null,
  attachmentsMetadata: [{...}],
  previousVersionJobId?: string   // Link to prior version
}
```

---

### 4. GET `/api/v1/requirements/client/:clientReqId/versions`

**Purpose:** Fetch version history by ECMS ID

**Shows versioning chain:**
- v1 (open) → imported 2024-01-15
- v2 (replaced) → imported 2024-01-20 (replaced v1)
- v3 (open) → imported 2024-01-25 (replaced v2)

**Query Parameters:**
```typescript
{
  status?: 'open'|'on_hold'|'closed'|'cancelled'|'replaced',  // Filter
  includeReplaced?: boolean      // Include 'replaced' versions (default: true)
}
```

**Response (200 OK):**
```typescript
{
  clientReqId: string,
  totalVersions: number,
  currentVersion: {
    jobId: string,
    version: number,
    status: string,
    createdAt: string,
    title: string
  },
  versions: [{                    // ALL versions oldest→newest
    jobId: string,
    version: number,
    status: 'open'|'on_hold'|'closed'|'cancelled'|'replaced',
    createdAt: string,
    title: string,
    replacedByJobId?: string,     // If status='replaced'
    replacedByVersion?: number
  }]
}
```

---

### 5. GET `/api/v1/requirements/:jobId/versions`

**Purpose:** Fetch version history starting from a job ID

**Similar to endpoint #4 but:**
- Input: jobId (instead of clientReqId)
- Finds the requirement chain this job belongs to
- Returns complete version history

---

## Requirement Lifecycle

### Status Field: `requirement_status`

A requirement can be in one of 5 states:

| Status | Meaning | Can Transition To |
|--------|---------|------------------|
| `open` | Active, open for submissions | on_hold, closed, cancelled, replaced |
| `on_hold` | Temporarily suspended | open, closed, cancelled |
| `closed` | No longer accepting submissions | (none - final) |
| `cancelled` | Cancelled before completion | (none - final) |
| `replaced` | Superseded by newer version | (none - final) |

### Versioning Workflow

**Initial Import (v1):**
```
User pastes email with ECMS ID "545390"
→ POST /import/preview → shows extracted data
→ User confirms
→ POST /import/confirm → creates Job v1, status='open'
```

**Re-import Same ECMS ID (v2):**
```
User pastes email with ECMS ID "545390" again (updated requirement)
→ POST /import/preview → detects duplicate, shows warning + previous job
→ User confirms (after reviewing changes)
→ POST /import/confirm 
→ Service marks old Job v1 as status='replaced', is_latest=false
→ Creates new Job v2, status='open', is_latest=true
→ All old data (instructions, tracker) preserved in v1
→ New data (instructions, tracker) created for v2
```

**Viewing History:**
```
GET /requirements/client/545390/versions
→ Returns all versions: v1, v2, v3, etc.
→ Shows which version replaced which
→ User can click on any version to see details
```

---

## Data Integrity Guarantees

### Atomic Transactions
- Creating a requirement creates: Job + JobEmailSource + Instructions + CandidateTracker
- All succeed or all fail (no partial creates)
- If error: entire transaction rolled back

### Raw Email Immutability
- Raw email stored once in `job_email_sources` table
- Never modified
- Always available as source of truth
- Can view email + extracted fields side-by-side

### Version Chain Integrity
- Each version tracks:
  - Its sequence number (`version`)
  - Its status (`requirement_status`)
  - Links to original and replacement versions
  - Timestamps of creation
- Complete history preserved forever

### Multi-Tenant Isolation
- All queries filtered by `company_id`
- Cannot access requirements from other companies
- Enforced at database level (indexes, constraints)

---

## Parsing Philosophy (Embedded in Code)

The service includes this philosophical note for maintainability:

```
IMPORTANT: This is best-effort extraction, NEVER canonical.
- Parsed data is for UI convenience and searchability
- Raw email content in job_email_sources is the authoritative source
- Users can always edit extracted fields
- Parsing errors are tracked but never block job creation
- Confidence score helps users understand extraction quality
```

**Practical Implications:**
1. Parsing errors don't fail the import
2. Low confidence scores are reported but don't block
3. Users always see raw email alongside parsed fields
4. Users can edit any parsed field
5. Edit history is NOT tracked (can add in Phase 2)

---

## Integration Points

### 1. From Job Posting Feature
- Can create traditional job posting → separate from requirements
- Requirements (from email) ≠ Job Postings (internal)
- Can link requirement to candidate tracker when posting

### 2. From Candidate Module
- Submit candidates to a requirement
- Tracker format from requirement guides submission
- Submissions stored per requirement version

### 3. From Analytics
- Report on: requirements imported, versions per requirement, status distribution
- Query by: company, ECMS ID, date range, status

---

## Error Handling

### Common Errors

**400 Bad Request:**
- Empty email content
- Missing required fields
- Invalid email format (though best-effort still tries)

**404 Not Found:**
- Job ID doesn't exist
- Client requirement ID has no versions

**409 Conflict:**
- Rare: versioning race condition (handled by transaction)

---

## Next Steps: Frontend UI

Once APIs are tested and working, build UI with:

1. **Email Import Page:**
   - Large textarea for email paste
   - "Parse & Preview" button → calls POST /preview

2. **Preview Component:**
   - Two-column layout:
     - Left: Raw email (read-only, scrollable)
     - Right: Extracted fields (editable)
   - Shows: confidence score, instructions, tracker
   - "Edit & Confirm" button → calls POST /confirm

3. **Version History UI:**
   - Timeline showing v1 → v2 → v3
   - Status indicators (open, replaced, closed)
   - Click on version → shows details

4. **Details View:**
   - All requirement data
   - Link back to email
   - View instructions
   - View candidate tracker
   - Link to previous/next version

---

## Testing Recommendations

### Test Case 1: New Requirement Import
```bash
POST /requirements/import/preview
Body: { rawEmailContent: "<Infosys email content>" }
Expected: 
  - Extracts ECMS ID from subject or body
  - Finds JD format section
  - Extracts instructions
  - Returns confidence > 0.7
  - No duplicate match

POST /requirements/import/confirm
Body: { rawEmailContent: "<same email>", editedFields: {...} }
Expected:
  - Creates Job with version=1, status='open'
  - Creates JobEmailSource with same email
  - Creates instructions + tracker
  - Returns jobId + emailSourceId
```

### Test Case 2: Re-import Same ECMS ID
```bash
# First import (already done above)
# Now re-import with updated email

POST /requirements/import/preview
Body: { rawEmailContent: "<Updated Infosys email same ECMS>" }
Expected:
  - Extracts same ECMS ID
  - Detects duplicate
  - Returns potentialDuplicateMatch with versioningAction='replace'
  - Shows previous job details

POST /requirements/import/confirm
Expected:
  - Creates Job with version=2, status='open'
  - Marks previous Job v1 as status='replaced'
  - Returns jobId (new) + replacedPreviousJobId (old)

GET /requirements/client/<ECMS>/versions
Expected:
  - Returns 2 versions
  - v1: status='replaced'
  - v2: status='open'
  - Shows replacedByJobId for v1
```

### Test Case 3: Fetch Full Details
```bash
GET /requirements/<jobId>/details
Expected:
  - Returns complete rawEmail content
  - Returns all instructions
  - Returns candidate tracker
  - Returns attachment metadata
  - Shows previousVersionJobId if applicable
```

---

## File Manifest

**New Files Created:**

1. **DTOs:**
   - `src/modules/jobs/dto/import-email-requirement.dto.ts` - Import/confirm request models
   - `src/modules/jobs/dto/email-requirement-response.dto.ts` - Response models

2. **Services:**
   - `src/modules/jobs/services/email-requirement.service.ts` - Core business logic
     - parseEmailPreview()
     - confirmImportRequirement()
     - getRequirementVersionHistory()
     - getRequirementDetails()

3. **Controllers:**
   - `src/modules/jobs/controllers/email-requirement.controller.ts` - API endpoints
     - POST /import/preview
     - POST /import/confirm
     - GET /:jobId/details
     - GET /client/:clientReqId/versions
     - GET /:jobId/versions

4. **Module Update:**
   - `src/modules/jobs/job.module.ts` - Updated with new entities + services

---

## Compliance Checklist

✅ Requirement-centric (not job-centric)
✅ Email as source of truth
✅ Versioning by ECMS Req ID
✅ Requirement_status lifecycle (5 states)
✅ Atomic transactions
✅ Multi-tenant isolation
✅ Best-effort parsing philosophy
✅ Confidence scoring
✅ Attachment metadata support
✅ API contracts documented
✅ Error handling defined
✅ Version history chain preserved
✅ Raw email immutable
✅ User edits possible pre-confirmation

---

## Production Readiness

**Ready for:**
- ✅ API testing with test client (Postman/Insomnia)
- ✅ Integration testing with parser service
- ✅ UI layer development
- ✅ Database migration run

**After passing tests, can proceed to:**
- Frontend UI implementation
- End-to-end testing
- Database migration execution
