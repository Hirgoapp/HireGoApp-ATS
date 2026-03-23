# Email-Driven Job Module - Architectural Corrections (Applied)

## ✅ All Corrections Applied

### 1. **Client Model - SIMPLIFIED** ✓
**Before:** Over-designed with email_domains, contact_persons, rate_card, compliance_requirements, metadata
**After:** Minimal fields only (id, company_id, name, created_at, updated_at, deleted_at)

**Rationale:**
- Client is just a reference, not a master data repository (Phase 1)
- Submission rules, rates, compliance are **PER-REQUIREMENT**, not per-client
- These live in `job_instructions`, `job_candidate_trackers`, and parsed email content
- Email content ALWAYS overrides any client metadata
- Future phases can expand with rate cards, contact persons, etc.

**Impact:** Entities updated:
- [client.entity.ts](cci:1:g:\ATS\src\modules\jobs\entities\client.entity.ts:0:0-0:0) - simplified

---

### 2. **Requirement-Centric Model** ✓
**Architecture Clarification:**

A `Job` record = ONE VERSION of a client requirement
```
Raw Email Source (truth)
    ↓
Job Record (version 1, 2, 3...)
    ↓
Job Instructions (per-requirement)
Job Candidate Tracker (per-requirement)
```

**Key Principle:** The email is the system of record; job record is just indexed representation.

**Updated Comments in:**
- [job.entity.ts](cci:1:g:\ATS\src\modules\jobs\entities\job.entity.ts:213:0-240:0) - requirement-centric architecture
- [job-email-source.entity.ts](cci:1:g:\ATS\src\modules\jobs\entities\job-email-source.entity.ts:1:0-20:0) - source of truth clarification
- [job-email-parser.service.ts](cci:1:g:\ATS\src\modules\jobs\services\job-email-parser.service.ts:1:0-20:0) - best-effort parsing philosophy

---

### 3. **Requirement Status - ADDED** ✓
**New Field:** `requirement_status` (VARCHAR 50)

**Lifecycle Values:**
```
- open        → Actively recruiting
- on_hold     → Temporarily paused by client
- closed      → Completed (candidates hired)
- cancelled   → Requirement cancelled by client
- replaced    → Superseded by newer version (same ECMS Req ID)
```

**Versioning Workflow:**
```
Email Version 1 (ECMS #545390)
  ↓ Creates Job v1 → status: open

Email Version 2 (ECMS #545390 - updated)
  ↓ Creates Job v2 → status: open
  ↓ Sets Job v1 → status: replaced
```

**Implementation:**
```sql
ALTER TABLE jobs ADD COLUMN requirement_status VARCHAR(50) DEFAULT 'open';
```

**Logic (for API later):**
```typescript
// When importing same ECMS Req ID:
oldJob.requirement_status = 'replaced';
newJob.requirement_status = 'open'; // default
```

---

### 4. **Email Attachments Support - ADDED** ✓
**New Field:** `attachments_metadata` (JSONB, array)

**Structure:**
```typescript
attachments_metadata: Array<{
    filename: string;           // 'JD.pdf', 'tracker.xlsx'
    size?: number;              // bytes
    mimeType?: string;          // 'application/pdf'
    url?: string;               // Future: S3 URL when stored
    uploadedAt?: Date;          // Future: when uploaded
}>
```

**Storage Strategy:**
- Phase 1: Store metadata only (filename, size, mimeType)
- Phase 2: Implement actual file upload to S3/cloud storage
- Never block job creation if attachments can't be processed

**Implementation:**
```sql
ALTER TABLE job_email_sources 
ADD COLUMN attachments_metadata JSONB DEFAULT '[]';
```

**UI Handling (future):**
- Show user: "Email had 2 attachments: [JD.pdf] [tracker.xlsx]"
- Allow optional attachment upload later
- Don't require attachments for job creation

---

### 5. **Parsing Philosophy - CLARIFIED** ✓
**Principle:** Best-effort extraction, never canonical/authoritative

**Updated in:**
- [job-email-parser.service.ts](cci:1:g:\ATS\src\modules\jobs\services\job-email-parser.service.ts:1:0-20:0)

**Guarantees:**
✓ Parsed data is for UI convenience and searchability
✓ Raw email remains authoritative source
✓ Users can always edit extracted fields
✓ Parsing errors don't block job creation
✓ Confidence score helps assess extraction quality
✓ Manual paste always works (never blocked)

**Return Structure:**
```typescript
{
    confidence: 0.75,           // How good was extraction?
    fields: { ... },            // Extracted fields (editable)
    instructions: [ ... ],      // Parsed instructions
    candidateTracker: { ... },  // Parsed tracker
    errors: [
        "Could not extract years_required",
        "Vendor rate format unclear"
    ]
}
```

---

## 📊 Schema Summary (Corrected)

### Tables
1. **clients** - Minimal reference only
   - id, company_id, name, created_at, updated_at, deleted_at

2. **job_email_sources** - Raw email storage with versioning
   - raw_email_content (source of truth)
   - parsed_data (best-effort extraction)
   - attachments_metadata (new - for future file support)
   - version, is_latest, superseded_by (versioning)

3. **job_instructions** - Per-requirement submission/interview rules
   - instruction_type, content, highlight_level

4. **job_candidate_trackers** - Per-requirement tracker format
   - required_fields, field_order, validation_rules

5. **jobs** - Indexed representation (ONE VERSION of requirement)
   - requirement_status (new - lifecycle tracking)
   - All contract staffing fields (extracted for querying)
   - Links to latest email_source_id and original_job_id for versioning

---

## 🔄 Data Flow (Corrected)

### Import Workflow
```
1. User: Paste email
   ↓
2. System: Extract to job_email_sources (raw storage)
   ↓
3. Parser: Parse email (best-effort)
   ↓
4. UI: Show extracted fields + raw email preview
   ↓
5. User: Review, edit extracted data
   ↓
6. System: Create job_instructions, job_candidate_trackers
   ↓
7. System: Create Job record with requirement_status='open'
   ↓
8. System: Link job_email_sources.job_id → jobs.id
```

### Update Workflow (Same ECMS Req ID)
```
1. User: Paste updated email with same ECMS #545390
   ↓
2. System: Find latest job_email_source (is_latest=true)
   ↓
3. System: Create NEW job_email_source record (version++)
   ↓
4. System: Old source: is_latest=false, superseded_by=new_id
   ↓
5. System: Create NEW Job record (version++, requirement_status='open')
   ↓
6. System: Old job: requirement_status='replaced'
   ↓
7. System: New job: original_job_id = old_job.id
```

---

## 🚀 Ready for APIs + Frontend

All architectural corrections applied. Now safe to proceed with:

1. ✅ **API Layer**
   - POST /jobs/import-email (paste email)
   - GET /jobs/{id}/preview (show parsed + raw)
   - PUT /jobs/{id}/confirm (save job + instructions + tracker)
   - GET /jobs?requirement_status=open (query by status)
   - GET /jobs/{id}/versions (see all versions)

2. ✅ **Frontend UI**
   - Email paste input
   - Left: Raw email preview (read-only)
   - Right: Extracted fields (editable)
   - Instructions & tracker display
   - Confirm & save button

3. ✅ **Tests**
   - Parse Infosys format
   - Handle versioning (same ECMS ID)
   - Verify requirement_status transitions
   - Ensure raw email always preserved

---

## Confirmation

All corrections have been applied to:
- ✅ Entities (Client, Job, JobEmailSource, JobInstruction, JobCandidateTracker)
- ✅ Migration (1737369600000-CreateEmailDrivenJobsTables.ts)
- ✅ Parser Service (best-effort, non-canonical design)
- ✅ Architecture documentation (requirement-centric model)

**Ready to proceed with API design and implementation.**
