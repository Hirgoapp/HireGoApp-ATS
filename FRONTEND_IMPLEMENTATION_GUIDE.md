# Next Phase Instructions - Frontend UI Implementation

**Current Status:** API Layer ✅ Complete and Ready

**Next Step:** Build React UI for email import workflow

---

## What's Ready for Frontend

### ✅ Backend Services
- 5 fully functional REST endpoints
- Comprehensive error handling
- Atomic transactions
- Multi-tenant isolation

### ✅ API Documentation
- Swagger/OpenAPI format
- Response models defined
- Error codes documented
- Example requests/responses

### ✅ Test Data
- Real Infosys email format provided
- Example ECMS ID: 545390
- Complete parsing example

---

## Frontend Implementation Guide

### Phase: Build React Component for Email Import

**Location:** `frontend/business/src/modules/jobs/components/EmailRequirementImport.tsx`

**Component Structure:**
```
<EmailRequirementImport>
  ├─ State:
  │  ├─ rawEmail (string)
  │  ├─ preview (EmailImportPreviewResponseDto | null)
  │  ├─ isLoading (boolean)
  │  ├─ error (string | null)
  │  └─ step ('paste' | 'preview' | 'success')
  │
  ├─ Handler: onPasteEmail()
  │  └─ calls POST /api/v1/requirements/import/preview
  │
  ├─ Handler: onConfirm()
  │  └─ calls POST /api/v1/requirements/import/confirm
  │
  └─ Render:
     ├─ Step 1: Email Paste (text area)
     ├─ Step 2: Preview (split view)
     └─ Step 3: Success (show created job)
```

### Step 1: Email Paste UI

```typescript
<div className="email-import">
  <h2>Create Requirement from Email</h2>
  <textarea
    value={rawEmail}
    onChange={(e) => setRawEmail(e.target.value)}
    placeholder="Paste full email here..."
    rows={10}
  />
  <button onClick={handlePasteEmail} disabled={isLoading}>
    Parse & Preview
  </button>
</div>
```

**API Call:**
```typescript
const response = await fetch('http://localhost:3000/api/v1/requirements/import/preview', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    rawEmailContent: rawEmail,
    emailSubject: extractSubjectFromEmail(rawEmail)
  })
});
const preview = await response.json();
```

### Step 2: Preview UI (Split View)

```typescript
<div className="preview-container" style={{ display: 'flex', gap: '20px' }}>
  {/* LEFT: Raw Email (Read-Only) */}
  <div className="raw-email" style={{ flex: 1 }}>
    <h3>Raw Email</h3>
    <pre>{preview.rawEmailContent}</pre>
  </div>

  {/* RIGHT: Extracted Fields (Editable) */}
  <div className="extracted-fields" style={{ flex: 1 }}>
    <h3>Extracted Data</h3>
    
    {/* Confidence Score */}
    <div className="confidence-score">
      Parsing Confidence: {(preview.parsingConfidence * 100).toFixed(0)}%
    </div>

    {/* Extracted Fields - User Can Edit */}
    <div className="fields-form">
      {Object.entries(preview.extractedFields).map(([key, value]) => (
        <div key={key} className="form-group">
          <label>{key}</label>
          <input
            defaultValue={value}
            onChange={(e) => handleFieldEdit(key, e.target.value)}
          />
        </div>
      ))}
    </div>

    {/* Instructions */}
    <div className="instructions">
      <h4>Instructions ({preview.instructions.length})</h4>
      {preview.instructions.map((instr, idx) => (
        <div key={idx} className={`instruction ${instr.highlight_level}`}>
          <strong>[{instr.type}]</strong> {instr.title}
          <p>{instr.content}</p>
        </div>
      ))}
    </div>

    {/* Candidate Tracker */}
    {preview.candidateTracker && (
      <div className="candidate-tracker">
        <h4>Candidate Submission Format</h4>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Required</th>
            </tr>
          </thead>
          <tbody>
            {preview.candidateTracker.required_fields.map((field, idx) => (
              <tr key={idx}>
                <td>{field.field}</td>
                <td>{field.type}</td>
                <td>{field.required ? '✓' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Potential Duplicate Match Warning */}
    {preview.potentialDuplicateMatch && (
      <div className="warning-box">
        ⚠️ <strong>Duplicate Detected</strong>
        <p>
          This ECMS ID ({preview.potentialDuplicateMatch.clientReqId}) was previously imported.
          Confirming will create version {preview.potentialDuplicateMatch.previousVersion + 1} 
          and mark the previous version as "replaced".
        </p>
      </div>
    )}

    {/* Confirm Button */}
    <button onClick={handleConfirm} className="btn-primary">
      ✓ Confirm & Create Requirement
    </button>
  </div>
</div>
```

### Step 3: Confirmation & Success

```typescript
const response = await fetch('http://localhost:3000/api/v1/requirements/import/confirm', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    rawEmailContent: rawEmail,
    editedFields: editedFields,  // User edits from step 2
    editedInstructions: editedInstructions,
    editedCandidateTracker: editedCandidateTracker
  })
});

const result = await response.json();

// Show success
<div className="success-box">
  ✓ <strong>Requirement Created!</strong>
  <p>Job ID: {result.jobId}</p>
  <p>Client Req ID: {result.clientReqId}</p>
  <p>Version: {result.version}</p>
  <p>Status: {result.requirementStatus}</p>
  
  {result.replacedPreviousJobId && (
    <p className="info">
      ℹ️ Replaced previous version (ID: {result.replacedPreviousJobId})
    </p>
  )}
  
  <button onClick={() => navigateTo(`/requirements/${result.jobId}/details`)}>
    → View Requirement Details
  </button>
</div>
```

---

## Additional UI Pages Needed

### 1. Requirement Details Page
**Route:** `/requirements/:jobId`

**Shows:**
- Raw email (read-only)
- All extracted fields
- Instructions with metadata
- Candidate tracker
- Link to previous version (if versioned)
- Version number & status

**API Calls:**
```typescript
GET /api/v1/requirements/:jobId/details
```

### 2. Requirement Version History Page
**Route:** `/requirements/:clientReqId/versions`

**Shows:**
- Timeline of all versions
- Status for each version (open, replaced, closed, etc.)
- Dates and basic info
- Click on version to see details

**API Calls:**
```typescript
GET /api/v1/requirements/client/:clientReqId/versions
```

### 3. Requirement List Page
**Route:** `/requirements`

**Shows:**
- All open requirements
- Filter by status
- Search by ECMS ID or job title
- Link to each requirement

**Note:** Use existing job list component, add status filter

---

## API Response Types to Import

In your React component, import these types from backend:

```typescript
// From API response models
interface EmailImportPreviewResponseDto {
  jobId: string;
  rawEmailContent: string;
  extractedFields: Record<string, any>;
  parsingConfidence: number;
  parsingErrors: string[];
  instructions: {
    id: string;
    type: 'submission' | 'interview' | 'compliance' | 'general';
    title: string;
    content: string;
    highlight_level: 'critical' | 'high' | 'normal';
    is_mandatory: boolean;
  }[];
  candidateTracker: {
    id: string;
    required_fields: {
      field: string;
      type: string;
      required: boolean;
      description: string;
    }[];
    field_order: string[];
    validation_rules: Record<string, any>;
    template_content: string;
  } | null;
  attachmentsMetadata: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
  potentialDuplicateMatch?: {
    previousJobId: string;
    clientReqId: string;
    previousVersion: number;
    lastVersionDate: string;
    versioningAction: 'replace';
  };
}

interface CreateRequirementResponseDto {
  jobId: string;
  clientReqId: string;
  title: string;
  requirementStatus: string;
  version: number;
  isLatestVersion: boolean;
  replacedPreviousJobId?: string;
  emailSourceId: string;
  instructionCount: number;
  hasCandidateTracker: boolean;
  createdAt: string;
  detailsUrl: string;
}
```

---

## Testing the Frontend

### Test Case 1: New Requirement
1. Paste Infosys email (provided in API_TESTING_GUIDE.md)
2. Verify parsing extracts:
   - ECMS ID: "545390"
   - Job title: "Senior PEGA Developer"
   - Skills, experience, rate, etc.
3. Verify confidence score > 0.7
4. Click Confirm
5. Verify requirement created (shows job ID)

### Test Case 2: Re-import Same ECMS
1. Paste same Infosys email again (or updated version)
2. Verify "Duplicate Detected" warning shown
3. Shows previous version ID
4. Shows versioning action: "replace"
5. Click Confirm
6. Verify new version created (version = 2)
7. Shows replacedPreviousJobId

### Test Case 3: View Details
1. After creating requirement
2. Click "View Requirement Details"
3. Verify:
   - Raw email shown in full
   - All instructions listed
   - Candidate tracker format shown
   - Version & status displayed
   - Link to previous version (if applicable)

### Test Case 4: View Version History
1. Navigate to `/requirements/545390/versions`
2. Verify:
   - Shows all versions (v1, v2, v3)
   - Current version marked as "open"
   - Old versions marked as "replaced"
   - Replacement chain shown (v1 replaced by v2, v2 replaced by v3)

---

## Backend Readiness Checklist for UI Team

✅ API endpoints available at `http://localhost:3000/api/v1/requirements`
✅ Swagger docs available at `http://localhost:3000/api/docs`
✅ All responses properly typed
✅ Error responses defined
✅ Multi-tenant isolation ready
✅ Transaction safety ensured
✅ Versioning logic implemented
✅ Database schema ready (migration pending)

---

## Deployment Order

1. **Start Backend**
   ```bash
   npm run start:dev
   ```

2. **Run Database Migration** (once UI ready)
   ```bash
   npm run migration:run
   ```

3. **Build & Deploy Frontend**
   ```bash
   cd frontend/business
   npm run build
   ```

---

## Questions for UI Implementation?

All API contracts are defined and documented. Refer to:
- `EMAIL_DRIVEN_REQUIREMENTS_API_COMPLETE.md` - Full API reference
- `API_TESTING_GUIDE.md` - Step-by-step testing examples
- `API_LAYER_COMPLETION_SUMMARY.md` - Architecture & design decisions

---

## Success Criteria for UI

✅ Email paste → preview works
✅ Preview shows raw email + extracted fields
✅ Confidence score displayed
✅ Instructions and tracker visible
✅ Duplicate detection shown
✅ Edit fields possible
✅ Confirm creates requirement
✅ Success shows job ID + version
✅ Version history accessible
✅ Details view shows raw email

---

**Ready for Frontend Implementation!** 🚀

All backend infrastructure is in place. UI team can start building immediately.

