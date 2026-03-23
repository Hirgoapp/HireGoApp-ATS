# 📐 Dynamic JD System - Architecture & Technical Overview

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (React Frontend)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  JobForm                        JobDetails                        │
│  ┌──────────────────┐          ┌──────────────────┐             │
│  │ ✓ Job Title      │          │ Job Information  │             │
│  │ ✓ Toggle Dynamic │          │ DynamicJdViewer  │             │
│  │ ✓ Department     │          │ (format-aware)   │             │
│  │ ✓ Location       │          │ Download Link    │             │
│  └──────────────────┘          └──────────────────┘             │
│         │                              ▲                         │
│         │ (use_dynamic_jd = true)     │                         │
│         ▼                              │                         │
│  DynamicJdEditor ◄────────────────────┘                         │
│  ┌──────────────────────────────────┐                           │
│  │ ✏️ Paste/Type | 📎 Upload        │                           │
│  ├──────────────────────────────────┤                           │
│  │ Format: Plain | Markdown | HTML  │                           │
│  │ Content: [Textarea or FileInput] │                           │
│  │ MaxSize: 5MB, Types: PDF/DOCX   │                           │
│  └──────────────────────────────────┘                           │
│         │                                                        │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │ POST /api/v1/jobs (with jd_content, jd_format)
          │ OR
          │ POST /api/v1/jobs/:jobId/jd-upload (file)
          │
┌─────────▼────────────────────────────────────────────────────────┐
│                    SERVER (NestJS Backend)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  JOB CONTROLLER                  JD UPLOAD CONTROLLER            │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │ POST /jobs       │           │ POST /:id/upload │            │
│  │ PUT /jobs/:id    │           │ FileInterceptor  │            │
│  │ GET /jobs/:id    │           │ Type Validation  │            │
│  └────────┬─────────┘           └────────┬─────────┘            │
│           │                               │                     │
│           └───────────┬───────────────────┘                     │
│                       │                                         │
│                       ▼                                         │
│           ┌────────────────────────┐                           │
│           │    JD FILE SERVICE     │                           │
│           ├────────────────────────┤                           │
│           │ processAndStoreJdFile()│                           │
│           │ extractTextFromFile()  │                           │
│           │ extractFromPdf()       │                           │
│           │ extractFromDocx()      │                           │
│           │ parseJdIntoSections()  │                           │
│           └────────────┬───────────┘                           │
│                        │                                        │
│        ┌───────────────┼───────────────┐                       │
│        │               │               │                       │
│        ▼               ▼               ▼                       │
│    FILE SYSTEM    DB: Job       DB: JD Data                   │
│  uploads/jd-files/    Entity    (JSONB)                       │
│  ├─ uuid-1.pdf                  ├─ jd_content                │
│  ├─ uuid-2.docx   job.id        ├─ jd_format                │
│  └─ uuid-3.txt    job.title     ├─ jd_file_url              │
│                   job.use_       ├─ jd_file_metadata         │
│                   dynamic_jd     └─ jd_sections              │
│                   job.status                                  │
│                   ...                                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### User Flow 1: Paste Dynamic JD
```
User Input
    │
    ▼
Open Create Job Page
    │
    ▼
Check "Use Dynamic JD System" ✓
    │
    ▼
Enter Job Title & Details
    │
    ▼
Select Format (Markdown)
    │
    ▼
Paste Complete JD Text
    │
    ▼
Click Save
    │
    ▼
JobForm Component
  │ Builds payload:
  │ - title: "Senior Dev"
  │ - use_dynamic_jd: true
  │ - jd_format: "markdown"
  │ - jd_content: "# Senior..."
    │
    ▼
POST /api/v1/jobs
    │
    ▼
NestJS JobController
  │ Validates DTO
  │ Saves to database
    │
    ▼
Database Updated
  ├─ jobs.title = "Senior Dev"
  ├─ jobs.use_dynamic_jd = true
  ├─ jobs.jd_format = "markdown"
  └─ jobs.jd_content = "# Senior..."
    │
    ▼
Success Response
    │
    ▼
User Sees Job in List
```

### User Flow 2: Upload JD File
```
User Input
    │
    ▼
Open Create Job Page
    │
    ▼
Check "Use Dynamic JD System" ✓
    │
    ▼
Click "Upload File" Tab
    │
    ▼
Drag-Drop or Click to Select PDF
    │
    ▼
File Selected (job-desc.pdf, 45KB)
    │
    ▼
Validation
  ├─ Check type: application/pdf ✓
  └─ Check size: 45KB < 5MB ✓
    │
    ▼
User Enters Job Details
    │
    ▼
Click Save
    │
    ▼
Form Submission
  │ First creates job:
  │ POST /api/v1/jobs { title, department, ... }
    │
    ▼
Job Created (id: uuid-123)
    │
    ▼
Upload File
  │ POST /api/v1/jobs/uuid-123/jd-upload
  │ Content-Type: multipart/form-data
  │ file: <pdf buffer>
    │
    ▼
JdUploadController
  │ Receives file
  │ Validates file
    │
    ▼
JdFileService.processAndStoreJdFile()
    │
    ├─ Save to disk: uploads/jd-files/uuid-456.pdf
    │
    ├─ Extract text: "Senior Developer position..."
    │ (using pdf-parse library)
    │
    ├─ Parse sections: [{heading: "Responsibilities", content: "...", order: 1}]
    │
    └─ Update job record:
      ├─ jd_file_url = "/uploads/jd-files/uuid-456.pdf"
      ├─ jd_file_metadata = {filename, size, mimeType, extractedText preview}
      ├─ jd_content = extracted text
      ├─ jd_format = "plain"
      └─ jd_sections = parsed sections array
    │
    ▼
Response Sent to Client
    │
    ▼
JobDetailsPage Fetches Job
  │ GET /api/v1/jobs/uuid-123
    │
    ▼
Job Data Received
  │ {
  │   id: "uuid-123",
  │   title: "Senior Developer",
  │   use_dynamic_jd: true,
  │   jd_content: "Senior Developer position...",
  │   jd_file_url: "/uploads/jd-files/uuid-456.pdf",
  │   jd_format: "plain",
  │   ...
  │ }
    │
    ▼
DynamicJdViewer Renders
  │ Format = "plain"
  │ Shows extracted text with preserved formatting
  │ Shows download link for original PDF
    │
    ▼
User Sees Job Details with JD
```

### Component Rendering Flow: View Job
```
JobDetails Component (Page)
    │
    ├─ Load job data via API
    │
    ├─ Check: job.use_dynamic_jd?
    │
    ├─ If TRUE:
    │  │
    │  └─ Render <DynamicJdViewer>
    │     │
    │     ├─ Receive props:
    │     │  ├─ content: job.jd_content
    │     │  ├─ format: job.jd_format
    │     │  └─ sections: job.jd_sections
    │     │
    │     ├─ Determine format:
    │     │  │
    │     │  ├─ If "plain" → Simple text display
    │     │  │
    │     │  ├─ If "markdown" → ReactMarkdown component
    │     │  │  ├─ Parse markdown
    │     │  │  ├─ Render headings, lists, code
    │     │  │  └─ Apply styling
    │     │  │
    │     │  ├─ If "html" → HTML renderer
    │     │  │  ├─ Sanitize (remove scripts)
    │     │  │  └─ Render safe HTML
    │     │  │
    │     │  └─ If "structured" → Section renderer
    │     │     ├─ Sort by order
    │     │     ├─ Show icons
    │     │     └─ Display each section
    │     │
    │     └─ If file uploaded:
    │        └─ Show download link
    │
    ├─ If FALSE:
    │  │
    │  └─ Render legacy fields
    │     ├─ Show description
    │     └─ Show requirements
    │
    └─ End
```

---

## 🗄️ Database Schema

### Jobs Table - New Columns

```sql
-- Column Name          | Type     | Default | Nullable | Notes
use_dynamic_jd         | BOOLEAN  | FALSE   | YES      | Toggle flag
jd_content             | TEXT     | NULL    | YES      | Raw JD content
jd_format              | VARCHAR  | 'plain' | YES      | Format indicator
jd_file_url            | VARCHAR  | NULL    | YES      | File path
jd_file_metadata       | JSONB    | NULL    | YES      | File metadata
jd_sections            | JSONB    | NULL    | YES      | Parsed sections
```

### Example Data

#### Plain Text JD
```json
{
  "use_dynamic_jd": true,
  "jd_format": "plain",
  "jd_content": "Senior Software Engineer\n\nAbout:\nWe're looking for...",
  "jd_file_url": null,
  "jd_file_metadata": null,
  "jd_sections": null
}
```

#### Markdown JD
```json
{
  "use_dynamic_jd": true,
  "jd_format": "markdown",
  "jd_content": "# Senior Software Engineer\n## About\nWe're looking for...",
  "jd_file_url": null,
  "jd_file_metadata": null,
  "jd_sections": [
    {
      "heading": "About the Role",
      "content": "We're seeking...",
      "order": 1,
      "type": "about"
    },
    {
      "heading": "Responsibilities",
      "content": "- Design systems\n- Lead team",
      "order": 2,
      "type": "responsibilities"
    }
  ]
}
```

#### Uploaded PDF JD
```json
{
  "use_dynamic_jd": true,
  "jd_format": "plain",
  "jd_content": "Extracted text from PDF...",
  "jd_file_url": "/uploads/jd-files/abc123def456.pdf",
  "jd_file_metadata": {
    "filename": "job-description.pdf",
    "size": 45678,
    "mimeType": "application/pdf",
    "uploadedAt": "2026-01-19T10:30:00Z",
    "extractedText": "Senior Software Engineer position. We are seeking..."
  },
  "jd_sections": [
    {
      "heading": "Role Overview",
      "content": "We are seeking a Senior Software Engineer...",
      "order": 1,
      "type": "about"
    }
  ]
}
```

---

## 🔐 Security Architecture

### Authentication Flow
```
User Login
    │
    ▼
JWT Token Generated
    │
    ▼
Store in Frontend (localStorage/sessionStorage)
    │
    ▼
For Each Request
    │
    ├─ Add Authorization header
    │  └─ "Bearer <jwt-token>"
    │
    ▼
Backend Receives Request
    │
    ├─ JwtAuthGuard validates token
    │
    ├─ Extract user info from token
    │
    ├─ Check permissions
    │  └─ User must have jobs:create
    │
    ├─ If valid: Continue request
    │
    └─ If invalid: Return 401 Unauthorized
```

### File Upload Security
```
User Selects File
    │
    ▼
Frontend Validation
    │
    ├─ Check type: PDF | DOCX | TXT only
    │ └─ MIME type must match
    │
    ├─ Check size: ≤ 5MB
    │
    └─ If valid: Proceed, else: Show error
    │
    ▼
Send to Backend
    │
    ├─ Multipart form with JWT
    │
    ├─ JwtAuthGuard validates token
    │
    ▼
Backend Receives File
    │
    ├─ Validate JWT (again)
    │
    ├─ FileInterceptor validation
    │  ├─ Check MIME type (whitelist)
    │  ├─ Check file size limit
    │  └─ Check buffer is not null
    │
    ├─ Generate unique filename (UUID)
    │ └─ Prevents path traversal attacks
    │
    ├─ Store in isolated directory
    │ └─ uploads/jd-files/
    │
    ├─ Extract text (if PDF/DOCX)
    │
    └─ Return safe response
```

### HTML Sanitization
```
User Uploads HTML JD
    │
    ▼
DynamicJdViewer Receives content
    │
    ├─ Format = "html"
    │
    ├─ Call sanitizeHtml()
    │  │
    │  ├─ Parse HTML
    │  │
    │  ├─ Remove dangerous tags
    │  │ ├─ <script>
    │  │ ├─ <iframe>
    │  │ ├─ <object>
    │  │ └─ etc.
    │  │
    │  ├─ Remove event handlers
    │  │ ├─ onclick=
    │  │ ├─ onload=
    │  │ └─ etc.
    │  │
    │  ├─ Strip style attributes
    │  │ └─ Prevent CSS injection
    │  │
    │  └─ Return clean HTML
    │
    ├─ Render safe HTML
    │
    └─ Display to user
```

---

## 🎯 Component Interfaces

### DynamicJdEditor
```typescript
interface DynamicJdEditorProps {
  value: string;                           // Current content
  format: 'plain' | 'markdown' | 'html';   // Selected format
  onContentChange: (                       // Content changed
    content: string,
    format: string
  ) => void;
  onFileUpload?: (file: File) => void;    // File selected
}
```

### DynamicJdViewer
```typescript
interface DynamicJdViewerProps {
  content: string;                                    // JD content
  format: 'plain' | 'markdown' | 'html' | 'structured'; // Format
  sections?: Array<{                      // Parsed sections
    heading: string;
    content: string;
    order: number;
    type?: string;
  }>;
}
```

### JdFileService Methods
```typescript
// Main entry point for file processing
async processAndStoreJdFile(
  jobId: string,
  file: Express.Multer.File
): Promise<{
  fileUrl: string;
  metadata: Record<string, any>;
  extractedLength: number;
}>

// Extract text based on file type
private async extractTextFromFile(
  filePath: string,
  mimeType: string
): Promise<string>

// Parse JD into structured sections
private parseJdIntoSections(
  text: string
): Array<{
  heading: string;
  content: string;
  order: number;
  type?: string;
}>
```

---

## 🔄 Integration Points

### Frontend ↔ Backend

#### 1. Create Job with Dynamic JD
```
POST /api/v1/jobs
{
  title: string
  use_dynamic_jd: boolean
  jd_format: 'plain' | 'markdown' | 'html'
  jd_content: string
  department?: string
  location?: string
  ... (other fields)
}

Response:
{
  id: uuid
  ... (job data with jd fields)
}
```

#### 2. Upload JD File
```
POST /api/v1/jobs/:jobId/jd-upload
Content-Type: multipart/form-data

file: <binary file data>

Response:
{
  success: boolean
  data: {
    fileUrl: string
    metadata: { filename, size, mimeType, ... }
    extractedLength: number
  }
}
```

#### 3. Get Job with Dynamic JD
```
GET /api/v1/jobs/:jobId

Response:
{
  id: uuid
  title: string
  use_dynamic_jd: boolean
  jd_format: string
  jd_content: string
  jd_file_url: string | null
  jd_file_metadata: object | null
  jd_sections: object[] | null
  ... (other fields)
}
```

---

## 📊 State Management

### JobForm Component State
```typescript
const [useDynamicJd, setUseDynamicJd] = useState(false);
const [formData, setFormData] = useState({
  title: '',
  description: '',
  requirements: '',
  // ... other fields
  jd_content: '',
  jd_format: 'plain',
  use_dynamic_jd: false,
});
```

### JobDetails Component State
```typescript
const [job, setJob] = useState<JobDetail | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

---

## 🎨 Rendering Hierarchy

```
JobForm / JobDetails
    │
    ├─ If useDynamicJd === true:
    │  │
    │  └─ Show DynamicJdEditor / DynamicJdViewer
    │     │
    │     └─ Based on format:
    │        ├─ Plain: <div>{content}</div>
    │        ├─ Markdown: <ReactMarkdown>{content}</ReactMarkdown>
    │        ├─ HTML: <div dangerouslySetInnerHTML={sanitized} />
    │        └─ Structured: <SectionsList>{sections}</SectionsList>
    │
    └─ Else (useDynamicJd === false):
       │
       └─ Show legacy fields
          ├─ <textarea>{description}</textarea>
          └─ <textarea>{requirements}</textarea>
```

---

## ⚡ Performance Considerations

### Frontend
- ReactMarkdown: Lazy loaded only when needed
- Sections: Memoized to prevent re-renders
- File upload: Non-blocking, shows progress

### Backend
- File storage: Local filesystem (fast)
- Text extraction: Async, doesn't block API
- Database queries: Indexed on job.id
- File size: Limited to 5MB to prevent memory issues

### Database
- JSONB columns: Indexed for fast queries
- No large text in main SELECT (use lazy loading)
- Backward compatible (no schema breaking changes)

---

## 🚀 Deployment Architecture

```
Staging / Production
    │
    ├─ Backend Server
    │  ├─ NestJS Application
    │  ├─ PostgreSQL Database
    │  └─ uploads/jd-files/ Directory
    │     └─ (or configure to use S3)
    │
    ├─ Frontend Server (Optional)
    │  └─ React SPA (Vite build)
    │
    └─ Monitoring
       ├─ Error logging
       ├─ File upload tracking
       └─ Database performance
```

---

This architecture ensures:
✅ Security (JWT, validation, sanitization)
✅ Performance (local storage, indexed queries)
✅ Reliability (error handling, backward compatibility)
✅ Scalability (stateless design, JSONB flexibility)
✅ Maintainability (clear separation of concerns)

---

**Last Updated**: January 19, 2026
**Version**: 1.0 (Production Ready)
