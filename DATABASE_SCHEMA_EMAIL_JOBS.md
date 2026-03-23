# Email-Driven Job Module - Database Schema Design

## Overview
This schema supports email-based job requirement ingestion with versioning, client tracking, and flexible data extraction.

## New Tables

### 1. **clients** (Client Companies)
Stores client organizations that send job requirements (Infosys, TCS, etc.)

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL, -- Parent staffing company
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    email_domains TEXT[], -- ['@infosys.com', '@tcs.com']
    contact_persons JSONB DEFAULT '[]',
    preferred_submission_email VARCHAR(255),
    rate_card JSONB, -- Standard rate structures
    compliance_requirements TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_clients_company ON clients(company_id, deleted_at);
CREATE INDEX idx_clients_email_domains ON clients USING gin(email_domains);
```

### 2. **job_email_sources** (Raw Email Storage)
Stores complete raw email content as source of truth

```sql
CREATE TABLE job_email_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    job_id UUID, -- NULL initially, linked after job creation
    client_id UUID,
    
    -- Email metadata
    email_subject TEXT,
    sender_email VARCHAR(255),
    sender_name VARCHAR(255),
    received_date TIMESTAMP,
    email_thread_id VARCHAR(500), -- For future email sync
    
    -- Raw content
    raw_email_content TEXT NOT NULL, -- Complete email (HTML/text)
    raw_email_html TEXT, -- HTML version if available
    email_format VARCHAR(20) DEFAULT 'text', -- 'text', 'html', 'mixed'
    
    -- Parsed metadata
    client_req_id VARCHAR(100), -- ECMS Req ID / Client Reference
    parsed_data JSONB DEFAULT '{}', -- Extracted fields
    parsing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'parsed', 'failed'
    parsing_confidence DECIMAL(3,2), -- 0.00 to 1.00
    parsing_errors JSONB,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT true,
    superseded_by UUID, -- Links to newer version
    
    -- Tracking
    imported_by_id UUID,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
    CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT fk_imported_by FOREIGN KEY (imported_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_email_sources_company_job ON job_email_sources(company_id, job_id);
CREATE INDEX idx_email_sources_client_req ON job_email_sources(client_req_id, is_latest);
CREATE INDEX idx_email_sources_client ON job_email_sources(client_id, received_date DESC);
CREATE UNIQUE INDEX idx_email_sources_latest_req ON job_email_sources(client_req_id, company_id) 
    WHERE is_latest = true AND deleted_at IS NULL;
```

### 3. **job_instructions** (Client-Specific Instructions)
Stores submission guidelines, compliance rules, interview instructions

```sql
CREATE TABLE job_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    company_id UUID NOT NULL,
    
    instruction_type VARCHAR(50) NOT NULL, -- 'submission', 'interview', 'compliance', 'general'
    title VARCHAR(255),
    content TEXT NOT NULL,
    content_format VARCHAR(20) DEFAULT 'text', -- 'text', 'html', 'markdown'
    
    display_order INTEGER DEFAULT 0,
    is_mandatory BOOLEAN DEFAULT true,
    highlight_level VARCHAR(20) DEFAULT 'normal', -- 'critical', 'high', 'normal'
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_job_instructions_job ON job_instructions(job_id, instruction_type);
```

### 4. **job_candidate_trackers** (Dynamic Candidate Submission Format)
Stores the expected candidate tracker/submission format for each job

```sql
CREATE TABLE job_candidate_trackers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    company_id UUID NOT NULL,
    
    tracker_name VARCHAR(255) DEFAULT 'Candidate Tracker',
    required_fields JSONB NOT NULL, -- Array of field definitions
    /*
    Example:
    [
        {"field": "ECMS REQ ID", "type": "text", "required": true},
        {"field": "Profile submission date", "type": "date", "required": true},
        {"field": "Candidate Name", "type": "text", "required": true},
        {"field": "Phone No", "type": "phone", "required": true},
        {"field": "Email", "type": "email", "required": true},
        {"field": "Notice Period", "type": "text", "required": false},
        {"field": "Current Location", "type": "text", "required": false},
        {"field": "Interview screenshot", "type": "file", "required": true},
        {"field": "Vendor Quoted Rate", "type": "text", "required": true}
    ]
    */
    
    field_order TEXT[], -- Array of field names in display order
    validation_rules JSONB, -- Additional validation rules
    template_content TEXT, -- Original table/format from email
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_candidate_trackers_job ON job_candidate_trackers(job_id);
```

## Enhanced Jobs Table

Add contract staffing specific fields to existing jobs table:

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_req_id VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_project_manager VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS delivery_spoc VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pu_unit VARCHAR(100); -- PU / Business Unit
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS vendor_rate_value DECIMAL(12,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS vendor_rate_currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS vendor_rate_unit VARCHAR(20); -- 'hourly', 'daily', 'monthly'
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS vendor_rate_text TEXT; -- Raw rate text from email
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_mode VARCHAR(100); -- 'Client Interview/F2F', 'Telephonic', etc.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_mode VARCHAR(50); -- 'Hybrid', 'WFO', 'WFH'
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS background_check_timing VARCHAR(50); -- 'Before onboarding', 'After onboarding'
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS domain_industry VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS relevant_experience VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS desired_skills TEXT[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_locations TEXT[]; -- Multiple locations
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS submission_email VARCHAR(255); -- Where to submit candidates
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS email_source_id UUID; -- Link to latest email source
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS original_job_id UUID; -- For versioning

ALTER TABLE jobs ADD CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD CONSTRAINT fk_email_source FOREIGN KEY (email_source_id) REFERENCES job_email_sources(id) ON DELETE SET NULL;

CREATE INDEX idx_jobs_client_req ON jobs(client_req_id, company_id);
CREATE INDEX idx_jobs_client ON jobs(client_id, deleted_at);
CREATE INDEX idx_jobs_email_source ON jobs(email_source_id);
```

## Data Flow

### Import Flow:
1. User pastes email → `job_email_sources` (raw storage)
2. Parse email → Extract fields into `parsed_data` JSONB
3. User reviews/edits → Create `jobs` record
4. Extract instructions → Create `job_instructions` records
5. Extract tracker format → Create `job_candidate_trackers` record
6. Link: `job_email_sources.job_id = jobs.id`

### Update Flow (Same ECMS Req ID):
1. New email pasted with same `client_req_id`
2. Create new `job_email_sources` record (version++)
3. Set old source: `is_latest = false`, `superseded_by = new_id`
4. Create new `jobs` record (version++)
5. Set old job: `is_latest_version = false`
6. Link: `jobs.original_job_id = original_job.id`

### Version History:
```sql
-- Get all versions of a requirement
SELECT * FROM job_email_sources 
WHERE client_req_id = '545390' 
ORDER BY version DESC;

-- Get latest active job for a requirement
SELECT * FROM jobs 
WHERE client_req_id = '545390' 
  AND is_latest_version = true 
  AND deleted_at IS NULL;
```

## Key Design Principles

1. **Email as Source of Truth**: Raw email always stored, never lost
2. **Flexible Extraction**: `parsed_data` JSONB allows any field structure
3. **Version Control**: Complete history of requirements and updates
4. **Client-Specific Rules**: Instructions and trackers per job
5. **No Validation Blocking**: Best-effort parsing, user can always edit

## Future Extensions

- Email sync: Store `email_thread_id`, `message_id` for O365/Gmail integration
- AI parsing: Store `parsing_confidence` and `parsing_errors`
- Client master data: Rich client profiles with rate cards
- Submission tracking: Link candidates to tracker requirements
