# Dynamic Job Description System

## Overview

The Dynamic JD System allows companies to use their own custom job description formats instead of being limited to predefined fields. This provides maximum flexibility while maintaining searchability and structure.

## Architecture

### Backend Components

1. **Database Schema** (`job.entity.ts`)
   - `jd_content` (TEXT) - Stores the actual JD content (plain/markdown/HTML)
   - `jd_format` (VARCHAR) - Format indicator: 'plain', 'markdown', 'html', 'structured'
   - `jd_file_url` (VARCHAR) - Path to uploaded JD file (PDF, DOCX, TXT)
   - `jd_file_metadata` (JSONB) - File info: filename, size, mimeType, extracted text preview
   - `jd_sections` (JSONB) - Parsed sections: [{ heading, content, order, type }, ...]
   - `use_dynamic_jd` (BOOLEAN) - Toggle between dynamic JD and legacy structured fields

2. **Migration** (`1737305000000-AddDynamicJdFields.ts`)
   - Run: `npm run migration:run`
   - Adds all dynamic JD fields to jobs table
   - Non-breaking: Preserves existing description/requirements fields

3. **File Upload Service** (`jd-file.service.ts`)
   - Handles PDF, DOCX, TXT file uploads
   - Extracts text content from files
   - Auto-parses sections using heuristics
   - Stores files in `/uploads/jd-files/`

4. **Upload Controller** (`jd-upload.controller.ts`)
   - Endpoint: `POST /api/v1/jobs/:jobId/jd-upload`
   - Accepts multipart/form-data
   - Max file size: 5MB
   - Returns extracted text and metadata

### Frontend Components

1. **DynamicJdEditor.tsx**
   - Two-tab interface: "Paste/Type JD" and "Upload File"
   - Format selector: Plain Text, Markdown, HTML
   - Large textarea for copy-pasting complete JDs
   - File upload dropzone with drag-and-drop
   - Real-time format preview hints

2. **DynamicJdViewer.tsx**
   - Renders JD based on format type
   - Markdown rendering with styled headings, lists, code blocks
   - HTML rendering with sanitization
   - Structured sections with icons and formatted layout
   - Automatic bullet point detection and formatting

## Usage Workflows

### Workflow 1: Paste Complete JD

```typescript
// User copies JD from their existing document
const jd = `
Senior Software Engineer

About the Role:
We are seeking an experienced Senior Software Engineer...

Key Responsibilities:
- Lead development of core platform features
- Mentor junior developers
- Collaborate with product team

Required Qualifications:
- 5+ years of software development
- Expert in React, Node.js, TypeScript
- Strong problem-solving skills
`;

// System stores as plain text with format='plain'
// No need to split into predefined fields
```

### Workflow 2: Upload JD File

```bash
# User uploads existing-jd.pdf
POST /api/v1/jobs/{jobId}/jd-upload
Content-Type: multipart/form-data

Response:
{
  "fileUrl": "/uploads/jd-files/uuid.pdf",
  "metadata": {
    "filename": "existing-jd.pdf",
    "size": 245678,
    "mimeType": "application/pdf",
    "extractedText": "Senior Software Engineer\n\nAbout the Role..."
  },
  "extractedLength": 2456
}
```

### Workflow 3: Markdown Format

```markdown
# Senior Software Engineer

## 🎯 About the Role
We are seeking an **experienced** Senior Software Engineer to join our platform team.

## ✅ Key Responsibilities
- Lead development of core features
- Mentor junior developers
- Design scalable architecture

## 🎓 Required Qualifications
- 5+ years of software development
- Expert in *React*, *Node.js*, *TypeScript*
- Strong problem-solving skills

## ⭐ Nice to Have
- Experience with Kubernetes
- AWS certification
- Open source contributions
```

### Workflow 4: Auto-Parsed Sections

```typescript
// System automatically detects sections
const sections = [
  { heading: "About the Role", content: "...", order: 0, type: "about" },
  { heading: "Key Responsibilities", content: "...", order: 1, type: "responsibilities" },
  { heading: "Required Qualifications", content: "...", order: 2, type: "qualifications" },
];

// Renders with icons and structured layout
```

## Integration with Existing Form

Update `JobForm.tsx` to support both modes:

```typescript
const [useDynamicJd, setUseDynamicJd] = useState(false);

// Toggle UI
<div>
  <label>
    <input type="checkbox" checked={useDynamicJd} onChange={e => setUseDynamicJd(e.target.checked)} />
    Use Dynamic JD System (paste complete JD or upload file)
  </label>
</div>

{useDynamicJd ? (
  <DynamicJdEditor
    value={formData.jd_content}
    format={formData.jd_format}
    onContentChange={(content, format) => {
      setFormData(prev => ({ ...prev, jd_content: content, jd_format: format, use_dynamic_jd: true }));
    }}
    onFileUpload={async (file) => {
      // Upload file and get extracted text
      const result = await uploadJdFile(jobId, file);
      setFormData(prev => ({
        ...prev,
        jd_content: result.extractedText,
        jd_file_url: result.fileUrl,
        use_dynamic_jd: true
      }));
    }}
  />
) : (
  // Legacy fields: description, requirements, etc.
  <LegacyJobFields />
)}
```

## Display Integration

Update `JobDetails.tsx`:

```typescript
{job.use_dynamic_jd ? (
  <DynamicJdViewer
    content={job.jd_content}
    format={job.jd_format}
    sections={job.jd_sections}
  />
) : (
  // Legacy display with description/requirements
  <LegacyJobDisplay />
)}
```

## File Extraction Libraries

### Install Dependencies

```bash
# For PDF extraction
npm install pdf-parse

# For DOCX extraction
npm install mammoth

# For markdown rendering (frontend)
npm install react-markdown
```

### Enable PDF Extraction

```typescript
// In jd-file.service.ts
private async extractFromPdf(filePath: string): Promise<string> {
  const pdfParse = require('pdf-parse');
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}
```

### Enable DOCX Extraction

```typescript
// In jd-file.service.ts
private async extractFromDocx(filePath: string): Promise<string> {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}
```

## Benefits

### For Companies
- ✅ Use existing JD formats without modification
- ✅ No need to adapt to predefined fields
- ✅ Copy-paste from Word/PDF documents
- ✅ Upload files directly
- ✅ Preserve brand formatting and style

### For Recruiters
- ✅ Faster job posting (no field-by-field entry)
- ✅ Maintain consistency with company standards
- ✅ Easy updates (just paste new version)
- ✅ Support for rich formatting

### For Candidates
- ✅ Better-formatted, more readable JDs
- ✅ Preserve original structure and emphasis
- ✅ Clearer role expectations

## Future Enhancements

### AI-Powered Features
1. **Smart Section Detection**
   - Use NLP to identify sections more accurately
   - Extract skills, requirements, benefits automatically

2. **JD Quality Scoring**
   - Analyze completeness, clarity, inclusivity
   - Suggest improvements

3. **Auto-Translation**
   - Translate JDs to multiple languages
   - Maintain formatting and structure

4. **Skill Extraction**
   - Automatically populate required_skills array
   - Build skill taxonomy from JD content

### Advanced Rendering
1. **Print-Optimized View**
   - PDF generation from JD content
   - Professional formatting

2. **Mobile-Responsive Display**
   - Collapsible sections
   - Touch-friendly navigation

3. **Comparison View**
   - Side-by-side JD comparison
   - Highlight differences

## Migration Path

### Existing Jobs
- Keep using `description` and `requirements` fields
- Set `use_dynamic_jd = false`
- No changes needed

### New Jobs
- Offer choice: "Use Dynamic JD" checkbox
- Default to dynamic JD for better UX
- Allow switching between modes

### Gradual Rollout
1. Phase 1: Add dynamic JD fields to database
2. Phase 2: Update job creation form with toggle
3. Phase 3: Enable file upload
4. Phase 4: Add AI-powered parsing
5. Phase 5: Make dynamic JD the default

## Testing

```bash
# Run migration
npm run migration:run

# Test file upload
curl -X POST http://localhost:3000/api/v1/jobs/{jobId}/jd-upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@sample-jd.pdf"

# Verify data
SELECT id, title, use_dynamic_jd, jd_format, jd_file_url FROM jobs WHERE use_dynamic_jd = true;
```

## Security Considerations

1. **File Upload**
   - Validate file types and sizes
   - Scan for malware (integrate ClamAV)
   - Store files outside web root

2. **HTML Sanitization**
   - Use DOMPurify library
   - Remove script tags and event handlers
   - Whitelist allowed HTML tags

3. **Access Control**
   - Only company admins can upload JDs
   - File URLs should be authenticated
   - Prevent directory traversal attacks

## Performance

1. **File Storage**
   - Use cloud storage (S3, Azure Blob) for scalability
   - Implement CDN for faster delivery
   - Compress large files

2. **Text Extraction**
   - Cache extracted text to avoid re-processing
   - Queue large file processing
   - Set timeouts for extraction

3. **Rendering**
   - Lazy-load markdown renderer
   - Virtualize long JD content
   - Cache parsed HTML

---

**Status:** ✅ Design Complete | Backend Implemented | Frontend Components Ready
**Next Steps:** Run migration → Install dependencies → Test file upload → Update JobForm
