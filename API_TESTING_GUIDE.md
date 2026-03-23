# API Testing Guide - Email-Driven Requirements Module

## Quick Start: Test with Real Infosys Email

Use the Infosys email example from the architecture conversation:

```
Subject: 545390 - Senior PEGA developer - India - EAIS

Dear Recruitment Team,

Please refer to the following requirement:

JD format:

ECMS Req ID:                545390
Job Title:                  Senior PEGA Developer
Domain:                     PEGA 8.x
Skill Set:                  PEGA, Java, Spring Boot
Experience (Years):         8-10 years
Work Mode:                  Hybrid
Work Location:              Bangalore, India
Interview Mode:             Teams
Notice Period:              2 weeks
Vendor Rate:                Up to INR 15000/Day
Rate Category:              Contract

Submission Guidelines:
- Resume must include 5 relevant projects
- Project details: client, project size, your role
- Availability must be within 2 weeks
- Must be willing for Interview on Teams

Interview Process:
- Technical round: PEGA 8.x concepts, Java coding
- HR round: Contract terms discussion
- Total duration: 45 minutes

Candidate Tracker:

Candidate Details:
- Full Name (Required)
- Current Location (Required)
- Mobile (Required)
- Email (Required)
- Current Company (Optional)
- Notice Period in Days (Required)
- Current Designation (Optional)
- Total Experience in Years (Required)
- PEGA Version Experience (Required)
- Java Version (Optional)
- Spring Framework Experience (Optional)

Important Compliance Notes:
- Background verification mandatory
- NDA signing required before joining
- Ensure candidate is not from blacklist

Regards,
Infosys Recruitment Team
```

---

## Step 1: Parse & Preview

**Endpoint:** `POST /api/v1/requirements/import/preview`

**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/v1/requirements/import/preview \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "rawEmailContent": "[PASTE FULL EMAIL HERE]",
    "emailSubject": "545390 - Senior PEGA developer - India - EAIS"
  }'
```

**Postman:**
1. Create new POST request
2. URL: `http://localhost:3000/api/v1/requirements/import/preview`
3. Headers:
   - `Authorization: Bearer <JWT_TOKEN>`
   - `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "rawEmailContent": "[FULL EMAIL TEXT]",
     "emailSubject": "545390 - Senior PEGA developer - India - EAIS"
   }
   ```
5. Send

**Expected Response (200 OK):**
```json
{
  "jobId": "00000000-0000-0000-0000-000000000000",
  "rawEmailContent": "[email text...]",
  "extractedFields": {
    "client_req_id": "545390",
    "job_title": "Senior PEGA Developer",
    "skills": ["PEGA 8.x", "Java", "Spring Boot"],
    "experience_years": "8-10",
    "work_mode": "Hybrid",
    "work_locations": ["Bangalore, India"],
    "interview_mode": "Teams",
    "vendor_rate_text": "Up to INR 15000/Day"
  },
  "parsingConfidence": 0.85,
  "parsingErrors": [],
  "instructions": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "type": "submission",
      "title": "Submission Guidelines",
      "content": "- Resume must include 5 relevant projects...",
      "highlight_level": "high",
      "is_mandatory": true
    },
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "type": "interview",
      "title": "Interview Process",
      "content": "- Technical round: PEGA 8.x concepts...",
      "highlight_level": "normal",
      "is_mandatory": true
    },
    {
      "id": "00000000-0000-0000-0000-000000000003",
      "type": "compliance",
      "title": "Important Compliance Notes",
      "content": "- Background verification mandatory...",
      "highlight_level": "critical",
      "is_mandatory": true
    }
  ],
  "candidateTracker": {
    "id": "00000000-0000-0000-0000-000000000004",
    "required_fields": [
      {"field": "Full Name", "type": "text", "required": true, "description": ""},
      {"field": "Current Location", "type": "text", "required": true, "description": ""},
      {"field": "Mobile", "type": "phone", "required": true, "description": ""}
    ],
    "field_order": ["Full Name", "Current Location", "Mobile"],
    "validation_rules": {},
    "template_content": "[Original table from email]"
  },
  "attachmentsMetadata": [],
  "potentialDuplicateMatch": null
}
```

**Verification Points:**
- ✅ ECMS ID extracted correctly: "545390"
- ✅ Job title recognized: "Senior PEGA Developer"
- ✅ Skills parsed: PEGA, Java, Spring Boot
- ✅ Experience range captured: "8-10"
- ✅ Instructions categorized: submission (high), interview (normal), compliance (critical)
- ✅ Candidate tracker fields listed: Full Name, Location, Mobile, Email, etc.
- ✅ Confidence score reasonable (0.7-0.95 range for well-formatted email)
- ✅ No duplicate match (first import of this ECMS ID)

---

## Step 2: Confirm & Create

**Once satisfied with preview, confirm and create requirement:**

**Endpoint:** `POST /api/v1/requirements/import/confirm`

**Postman / cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/requirements/import/confirm \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "rawEmailContent": "[SAME EMAIL TEXT]",
    "editedFields": {},
    "editedInstructions": [],
    "editedCandidateTracker": null,
    "approvalNote": "Imported from Infosys - 545390"
  }'
```

**Expected Response (201 Created):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "clientReqId": "545390",
  "title": "Senior PEGA Developer",
  "requirementStatus": "open",
  "version": 1,
  "isLatestVersion": true,
  "replacedPreviousJobId": null,
  "emailSourceId": "550e8400-e29b-41d4-a716-446655440001",
  "instructionCount": 3,
  "hasCandidateTracker": true,
  "createdAt": "2024-01-20T10:30:00Z",
  "detailsUrl": "/api/v1/requirements/550e8400-e29b-41d4-a716-446655440000"
}
```

**Verification Points:**
- ✅ Job created with new UUID
- ✅ Client Req ID stored: "545390"
- ✅ Status = "open"
- ✅ Version = 1 (first version)
- ✅ isLatestVersion = true
- ✅ No replacedPreviousJobId (this is first version)
- ✅ Email source ID created separately
- ✅ 3 instructions created
- ✅ Candidate tracker created

---

## Step 3: Fetch Requirement Details

**See what was stored:**

**Endpoint:** `GET /api/v1/requirements/:jobId/details`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/requirements/550e8400-e29b-41d4-a716-446655440000/details \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

**Expected Response (200 OK):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "clientReqId": "545390",
  "title": "Senior PEGA Developer",
  "status": "open",
  "version": 1,
  "rawEmail": {
    "emailSourceId": "550e8400-e29b-41d4-a716-446655440001",
    "rawEmailContent": "[COMPLETE EMAIL TEXT - UNCHANGED]",
    "emailSubject": "545390 - Senior PEGA developer - India - EAIS",
    "emailReceivedAt": "2024-01-20T10:25:00Z"
  },
  "instructions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "type": "submission",
      "title": "Submission Guidelines",
      "content": "- Resume must include 5 relevant projects...",
      "highlight_level": "high",
      "is_mandatory": true,
      "display_order": 0
    }
  ],
  "candidateTracker": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "required_fields": [
      {"field": "Full Name", "type": "text", "required": true, "description": ""}
    ],
    "field_order": ["Full Name", "..."],
    "validation_rules": {},
    "template_content": "[Original table]"
  },
  "attachmentsMetadata": [],
  "previousVersionJobId": null
}
```

**Verification Points:**
- ✅ Raw email content preserved exactly as pasted
- ✅ Instructions stored with metadata
- ✅ Candidate tracker accessible
- ✅ Email source linked correctly
- ✅ No previous version (this is v1)

---

## Step 4: Test Re-import (Versioning)

**Simulate same requirement arriving again (updated):**

**Parse again:**
```bash
curl -X POST http://localhost:3000/api/v1/requirements/import/preview \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "rawEmailContent": "[UPDATED EMAIL WITH SAME ECMS ID 545390]",
    "emailSubject": "545390 - Senior PEGA developer - India - EAIS"
  }'
```

**Expected Response (200 OK):**
```json
{
  "...": "...",
  "potentialDuplicateMatch": {
    "previousJobId": "550e8400-e29b-41d4-a716-446655440000",
    "clientReqId": "545390",
    "previousVersion": 1,
    "lastVersionDate": "2024-01-20T10:30:00Z",
    "versioningAction": "replace"
  }
}
```

**Confirmation shows warning that v1 will be marked as replaced - confirm anyway:**

```bash
curl -X POST http://localhost:3000/api/v1/requirements/import/confirm \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "rawEmailContent": "[UPDATED EMAIL]",
    "editedFields": {},
    "editedInstructions": [],
    "editedCandidateTracker": null,
    "approvalNote": "Updated requirement - same ECMS ID"
  }'
```

**Expected Response (201 Created):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440100",
  "clientReqId": "545390",
  "title": "Senior PEGA Developer",
  "requirementStatus": "open",
  "version": 2,
  "isLatestVersion": true,
  "replacedPreviousJobId": "550e8400-e29b-41d4-a716-446655440000",
  "emailSourceId": "550e8400-e29b-41d4-a716-446655440101",
  "instructionCount": 3,
  "hasCandidateTracker": true,
  "createdAt": "2024-01-20T11:00:00Z",
  "detailsUrl": "/api/v1/requirements/550e8400-e29b-41d4-a716-446655440100"
}
```

**Verification Points:**
- ✅ New version created (version = 2)
- ✅ New job ID (different from v1)
- ✅ Status still "open"
- ✅ isLatestVersion = true
- ✅ replacedPreviousJobId points to v1
- ✅ Same clientReqId ("545390")

---

## Step 5: View Version History

**See the entire chain:**

**Endpoint:** `GET /api/v1/requirements/client/:clientReqId/versions`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/requirements/client/545390/versions \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

**Expected Response (200 OK):**
```json
{
  "clientReqId": "545390",
  "totalVersions": 2,
  "currentVersion": {
    "jobId": "550e8400-e29b-41d4-a716-446655440100",
    "version": 2,
    "status": "open",
    "createdAt": "2024-01-20T11:00:00Z",
    "title": "Senior PEGA Developer"
  },
  "versions": [
    {
      "jobId": "550e8400-e29b-41d4-a716-446655440000",
      "version": 1,
      "status": "replaced",
      "createdAt": "2024-01-20T10:30:00Z",
      "title": "Senior PEGA Developer",
      "replacedByJobId": "550e8400-e29b-41d4-a716-446655440100",
      "replacedByVersion": 2
    },
    {
      "jobId": "550e8400-e29b-41d4-a716-446655440100",
      "version": 2,
      "status": "open",
      "createdAt": "2024-01-20T11:00:00Z",
      "title": "Senior PEGA Developer"
    }
  ]
}
```

**Verification Points:**
- ✅ Total versions = 2
- ✅ Current version is v2 (latest)
- ✅ v1 marked as "replaced"
- ✅ v1 shows replacedByJobId = v2 ID
- ✅ Complete versioning chain preserved

---

## Debugging Tips

### If parsing confidence is low (< 0.7):
1. Check email format - ensure it has recognizable sections
2. Look at `parsingErrors` array for specific issues
3. Still safe to confirm - user can edit fields
4. Parser designed to be best-effort

### If duplicate match not detected:
1. Verify emailSubject contains ECMS ID at start (e.g., "545390 -")
2. Check that ECMS ID is extractable from raw content
3. Verify it exactly matches previous import

### If job creation fails:
1. Check authorization header is valid JWT
2. Verify company_id is set in token
3. Check rawEmailContent is not empty
4. Look for transaction errors in server logs

---

## Performance Notes

- **Parse Preview**: Should complete in <2 seconds (regex patterns)
- **Confirm Create**: Should complete in <5 seconds (transaction, 4 inserts)
- **Fetch Details**: Should complete in <1 second (index lookup)
- **Version History**: Should complete in <1 second (indexed by client_req_id)

---

## Success Criteria

✅ Parse & Preview returns extracted data with confidence score
✅ Confirm & Create creates all 4 entities (Job, EmailSource, Instructions, Tracker)
✅ First import shows version=1, isLatestVersion=true, no replacedPreviousJobId
✅ Second import with same ECMS shows version=2, replacedPreviousJobId=v1.id
✅ Details endpoint returns raw email + all relationships
✅ Version history shows complete chain with status transitions
✅ All queries properly tenant-isolated by company_id
✅ Transactions are atomic (all or nothing)

---

## Next Steps After API Validation

Once these tests pass:

1. **Frontend UI Development** - Implement preview/confirm workflow in React
2. **Migration Execution** - Run database migration to persist schema
3. **Integration Tests** - Test with full candidate module
4. **Load Testing** - Verify performance at scale
5. **Production Deployment** - Deploy to production environment

