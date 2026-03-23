# BUSINESS (TENANT) API CONTRACT

**Generated:** January 8, 2026  
**Backend:** NestJS  
**Base Path:** `/api/v1`  
**Purpose:** Complete API contract for Business (tenant) UI development  
**Verification:** Code-verified from backend source  

---

## TABLE OF CONTENTS

1. [Auth Module](#1-auth-module)
2. [RBAC Module](#2-rbac-module)
3. [Jobs Module](#3-jobs-module)
4. [Submissions Module](#4-submissions-module)
5. [Interviews Module](#5-interviews-module)
6. [Offers Module](#6-offers-module)
7. [Users Module](#7-users-module-not-found)
8. [Role → Module Access Matrix](#role--module-access-matrix)

---

## 1. AUTH MODULE

### Controller
- **File:** `src/auth/controllers/auth.controller.ts`
- **Base Route:** `/api/v1/auth`

### Endpoints

#### 1.1 POST `/api/v1/auth/login`
**Purpose:** Authenticate business user with email/password

**Required Role:** None (public)  
**Required Permission:** None

**Request Body:**
```typescript
{
  email: string;      // Valid email, required
  password: string;   // Min 6 chars, required
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: {
    token: string;           // JWT access token
    refreshToken: string;    // JWT refresh token
    user: {
      id: string;            // User ID (converted to string)
      email: string;
      firstName: string;
      role: string;          // Role name (e.g., "Admin", "Recruiter")
      permissions: string[]; // Array of permission strings, or ["*"] for admin
      company: {
        id: string;          // Company ID (single tenant: "default")
        name: string;        // Company name (single tenant: "ATS System")
      };
    };
  };
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials or inactive account
- `400 Bad Request`: Validation errors

---

#### 1.2 POST `/api/v1/auth/logout`
**Purpose:** Logout user and invalidate refresh tokens

**Required Role:** Any authenticated user  
**Required Permission:** None  
**Guard:** `TenantGuard` (requires valid JWT)

**Request Body:** None

**Response (200 OK):**
```typescript
{
  success: true;
  message: "Logged out successfully";
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token

---

#### 1.3 POST `/api/v1/auth/refresh`
**Purpose:** Refresh access token using refresh token

**Required Role:** None  
**Required Permission:** None

**Request Body:**
```typescript
{
  refreshToken: string;  // Required
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: {
    token: string;         // New access token
    refreshToken: string;  // New refresh token
  };
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid, expired, or blacklisted refresh token
- `401 Unauthorized`: User not found or inactive

---

#### 1.4 GET `/api/v1/auth/me/permissions`
**Purpose:** Get current user's effective permissions

**Required Role:** Any authenticated user  
**Required Permission:** None  
**Guard:** `TenantGuard`

**Request:** None

**Response (200 OK):**
```typescript
{
  success: true;
  data: {
    permissions: string[];  // Array of permission strings
  };
}
```

---

#### 1.5 POST `/api/v1/auth/check-permission`
**Purpose:** Check if current user has a specific permission

**Required Role:** Any authenticated user  
**Required Permission:** None  
**Guard:** `TenantGuard`

**Request Body:**
```typescript
{
  permission: string;  // Permission to check (e.g., "jobs:create")
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: {
    hasPermission: boolean;
    permission: string;     // Echoed permission name
  };
}
```

---

### Business Rules
1. **Password:** Minimum 6 characters
2. **Token Expiry:** Access token = 1h, Refresh token = 7d (configurable)
3. **Refresh Token Blacklist:** Logout invalidates refresh tokens via cache
4. **Permissions:** Admin role gets `["*"]`, other roles get explicit permission arrays
5. **Single Tenant:** Company object is hardcoded as `{ id: "default", name: "ATS System" }`

---

### Notes for UI Developers
- **Field Naming:** Use `token` and `refreshToken` (not `accessToken`)
- **Role Normalization:** Role names are lowercase in backend logic (e.g., `admin`, `recruiter`)
- **Permissions Check:** Use `/auth/check-permission` for conditional UI rendering
- **Token Refresh:** Implement 401 interceptor to auto-refresh tokens
- **Last Login Update:** Backend updates `updated_at` on login (no `last_login` field)

---

## 2. RBAC MODULE

### Controller
- **File:** `src/auth/controllers/rbac.controller.ts`
- **Base Route:** `/api/v1/rbac`
- **Guard:** `TenantGuard` (all endpoints)

### Endpoints

#### 2.1 GET `/api/v1/rbac/roles`
**Purpose:** Get all roles for current company

**Required Role:** Any authenticated user  
**Required Permission:** None

**Response (200 OK):**
```typescript
{
  success: true;
  data: {
    roles: Role[];  // Array of role objects
  };
}
```

**Role Object:**
```typescript
{
  id: string;
  company_id: string;
  name: string;           // e.g., "Admin"
  slug: string;           // e.g., "admin"
  description: string;
  is_system: boolean;     // True for default roles
  is_default: boolean;    // True for default assigned role
  display_order: number;
  created_at: Date;
  updated_at: Date;
}
```

---

#### 2.2 GET `/api/v1/rbac/roles/:roleId`
**Purpose:** Get a specific role by ID

**Required Role:** Any authenticated user  
**Required Permission:** None

**Path Params:**
- `roleId` (string): Role ID

**Response (200 OK):**
```typescript
{
  success: true;
  data: {
    role: Role;  // Role object (see 2.1)
  };
}
```

---

#### 2.3 POST `/api/v1/rbac/roles` **(STUB - NOT IMPLEMENTED)**
**Purpose:** Create new role

**Required Role:** Admin  
**Required Permission:** `roles:manage`  
**Guard:** `PermissionGuard`

**Response (501 Not Implemented):**
```typescript
{
  success: false;
  message: "Role creation not supported in single-tenant mode";
  statusCode: 501;
}
```

---

#### 2.4 POST `/api/v1/rbac/users/:userId/role` **(STUB - NOT IMPLEMENTED)**
**Purpose:** Assign role to user

**Required Role:** Admin  
**Required Permission:** `users:update`  
**Guard:** `PermissionGuard`

**Response (501 Not Implemented):**
```typescript
{
  success: false;
  message: "Role assignment not supported in single-tenant mode";
}
```

---

#### 2.5 POST `/api/v1/rbac/users/:userId/permissions/grant` **(STUB - NOT IMPLEMENTED)**
**Purpose:** Grant permission to user

**Required Permission:** `users:update`

**Response (501 Not Implemented):**
```typescript
{
  success: false;
  message: "Permission grant not supported in single-tenant mode";
}
```

---

#### 2.6 POST `/api/v1/rbac/users/:userId/permissions/revoke` **(STUB - NOT IMPLEMENTED)**
**Purpose:** Revoke permission from user

**Required Permission:** `users:update`

**Response (501 Not Implemented):**
```typescript
{
  success: false;
  message: "Permission revoke not supported in single-tenant mode";
}
```

---

#### 2.7 GET `/api/v1/rbac/audit` **(STUB - NOT IMPLEMENTED)**
**Purpose:** Get audit logs

**Required Permission:** `audit:view`

**Query Params:**
- `limit` (string, default: "100")
- `offset` (string, default: "0")

**Response (200 OK):**
```typescript
{
  success: true;
  data: {
    auditEntries: [];  // Always empty array
    total: 0;
    limit: string;
    offset: string;
  };
}
```

---

### Business Rules
1. **System Roles:** Cannot be deleted (Admin, Recruiter, Hiring Manager, Viewer)
2. **Default Role:** Recruiter is the default assigned role
3. **Single Tenant:** Role/permission management is not fully supported

---

### Notes for UI Developers
- **Read-Only:** RBAC module is mostly read-only; mutation endpoints return 501
- **Display Roles:** Use GET `/roles` to show available roles in UI
- **Role Assignment:** NOT SUPPORTED via API in single-tenant mode
- **Audit Logs:** Endpoint exists but returns empty array

---

## 3. JOBS MODULE

### Controller
- **File:** `src/jobs/controllers/job.controller.ts`
- **Base Route:** `/api/v1/jobs`
- **Guard:** `RoleGuard` (all endpoints)

### Endpoints

#### 3.1 POST `/api/v1/jobs`
**Purpose:** Create a new job requirement

**Required Permission:** `jobs:create`

**Request Body:** (All fields optional unless marked required)
```typescript
{
  ecms_req_id: string;                    // Required, unique external ID
  client_id: number;                      // Required, FK to clients table
  job_title: string;                      // Required
  job_description?: string;
  domain?: string;
  business_unit?: string;
  total_experience_min?: number;
  relevant_experience_min?: number;
  mandatory_skills: string;               // Required, comma-separated
  desired_skills?: string;
  country?: string;
  work_location?: string;
  wfo_wfh_hybrid?: string;               // "WFO", "WFH", "Hybrid"
  shift_time?: string;
  number_of_openings?: number;
  project_manager_name?: string;
  project_manager_email?: string;
  delivery_spoc_1_name?: string;
  delivery_spoc_1_email?: string;
  delivery_spoc_2_name?: string;
  delivery_spoc_2_email?: string;
  bgv_timing?: string;
  bgv_vendor?: string;
  interview_mode?: string;
  interview_platforms?: string;
  screenshot_requirement?: string;
  vendor_rate?: number;
  currency?: string;
  client_name?: string;
  email_subject?: string;
  email_received_date?: string;          // ISO date string
  active_flag?: boolean;                 // Default: true
  priority?: string;                     // Default: "Medium"
  extra_fields?: Record<string, any>;    // JSON object
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetJobRequirementDto;  // See 3.2 for shape
}
```

---

#### 3.2 GET `/api/v1/jobs`
**Purpose:** Get all job requirements with filters and pagination

**Required Permission:** `jobs:read`

**Query Params:**
- `skip` (string, default: "0"): Offset for pagination
- `take` (string, default: "20"): Limit per page
- `client_id` (string): Filter by client ID
- `active_flag` (string): Filter by active status ("true"/"false")
- `priority` (string): Filter by priority
- `search` (string): Search in job title and other fields
- `orderBy` (string): `"created_at" | "updated_at" | "job_title" | "priority"`
- `orderDirection` (string): `"ASC" | "DESC"`

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetJobRequirementDto[];
  total: number;  // Total count (for pagination)
}
```

**GetJobRequirementDto Shape:**
```typescript
{
  id: number;
  ecms_req_id: string;
  client_id: number;
  job_title: string;
  job_description: string | null;
  domain: string | null;
  business_unit: string | null;
  total_experience_min: number | null;
  relevant_experience_min: number | null;
  mandatory_skills: string;
  desired_skills: string | null;
  country: string | null;
  work_location: string | null;
  wfo_wfh_hybrid: string | null;
  shift_time: string | null;
  number_of_openings: number | null;
  project_manager_name: string | null;
  project_manager_email: string | null;
  delivery_spoc_1_name: string | null;
  delivery_spoc_1_email: string | null;
  delivery_spoc_2_name: string | null;
  delivery_spoc_2_email: string | null;
  bgv_timing: string | null;
  bgv_vendor: string | null;
  interview_mode: string | null;
  interview_platforms: string | null;
  screenshot_requirement: string | null;
  vendor_rate: number | null;
  currency: string | null;
  client_name: string | null;
  email_subject: string | null;
  email_received_date: Date | null;
  active_flag: boolean;
  priority: string;
  extra_fields: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by: number | null;
}
```

---

#### 3.3 GET `/api/v1/jobs/:id`
**Purpose:** Get a single job requirement by ID

**Required Permission:** `jobs:read`

**Path Params:**
- `id` (number): Job ID

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetJobRequirementDto;
}
```

---

#### 3.4 GET `/api/v1/jobs/ecms/:ecmsReqId`
**Purpose:** Get job requirement by external ECMS ID

**Required Permission:** `jobs:read`

**Path Params:**
- `ecmsReqId` (string): External requirement ID

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetJobRequirementDto;
}
```

---

#### 3.5 PUT `/api/v1/jobs/:id`
**Purpose:** Update job requirement

**Required Permission:** `jobs:update`

**Path Params:**
- `id` (number): Job ID

**Request Body:** (All fields optional, partial update)
```typescript
{
  job_title?: string;
  job_description?: string;
  // ... any other fields from CreateJobRequirementDto
  // except ecms_req_id (cannot be changed)
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetJobRequirementDto;
}
```

---

#### 3.6 DELETE `/api/v1/jobs/:id`
**Purpose:** Delete job requirement

**Required Permission:** `jobs:delete`

**Path Params:**
- `id` (number): Job ID

**Response (204 No Content):** Empty body

---

#### 3.7 GET `/api/v1/jobs/stats/count`
**Purpose:** Get total job requirement count

**Required Permission:** `jobs:read`

**Response (200 OK):**
```typescript
{
  success: true;
  count: number;
}
```

---

#### 3.8 GET `/api/v1/jobs/stats/active`
**Purpose:** Get active job requirement count

**Required Permission:** `jobs:read`

**Response (200 OK):**
```typescript
{
  success: true;
  count: number;
}
```

---

#### 3.9 GET `/api/v1/jobs/by-client/:clientId`
**Purpose:** Find jobs by client ID

**Required Permission:** `jobs:read`

**Path Params:**
- `clientId` (number): Client ID

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetJobRequirementDto[];
}
```

---

#### 3.10 GET `/api/v1/jobs/find/active`
**Purpose:** Find all active jobs

**Required Permission:** `jobs:read`

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetJobRequirementDto[];
}
```

---

#### 3.11 GET `/api/v1/jobs/by-priority/:priority`
**Purpose:** Find jobs by priority

**Required Permission:** `jobs:read`

**Path Params:**
- `priority` (string): Priority level

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetJobRequirementDto[];
}
```

---

### Business Rules
1. **Primary Key:** INTEGER (not UUID)
2. **Unique Constraint:** `ecms_req_id` must be unique
3. **Mandatory Fields:** `ecms_req_id`, `client_id`, `job_title`, `mandatory_skills`
4. **Active Flag:** Defaults to `true`
5. **Priority:** Defaults to `"Medium"`
6. **Extra Fields:** JSON object for custom data
7. **Audit:** `created_by` is set on create; `updated_by` is NOT USED (field doesn't exist in DTO)

---

### Notes for UI Developers
- **ID Type:** Use number (not string) for job IDs
- **Skills Format:** `mandatory_skills` and `desired_skills` are comma-separated strings
- **Pagination:** Use `skip` and `take` for pagination (not `page`/`limit`)
- **Search:** Backend searches across multiple fields (implementation detail in service)
- **Client Relationship:** `client_id` is INTEGER FK (clients module not documented here)
- **Read-Only Fields:** `id`, `created_at`, `updated_at`, `created_by`

---

## 4. SUBMISSIONS MODULE

### Controller
- **File:** `src/submissions/controllers/submission.controller.ts`
- **Base Route:** `/api/v1/submissions`
- **Guard:** `RoleGuard` (all endpoints)

### Endpoints

#### 4.1 POST `/api/v1/submissions`
**Purpose:** Create a new requirement submission

**Required Permission:** `submissions:create`

**Request Body:** (All fields optional unless marked required)
```typescript
{
  job_requirement_id: number;             // Required, FK to job_requirements
  daily_submission_id?: number;
  profile_submission_date: string;        // Required, ISO date string
  vendor_email_id?: string;
  
  // Denormalized Candidate Data
  candidate_title?: string;
  candidate_name: string;                 // Required
  candidate_phone?: string;
  candidate_email?: string;
  candidate_notice_period?: string;
  candidate_current_location?: string;
  candidate_location_applying_for?: string;
  candidate_total_experience?: number;
  candidate_relevant_experience?: number;
  candidate_skills?: string;              // Comma-separated
  
  vendor_quoted_rate?: number;
  
  // Interview Details
  interview_screenshot_url?: string;
  interview_platform?: string;
  screenshot_duration_minutes?: number;
  
  // Candidate Background
  candidate_visa_type?: string;
  candidate_engagement_type?: string;
  candidate_ex_infosys_employee_id?: string;
  
  // Submission Tracking
  submitted_by_user_id?: number;
  submitted_at?: string;                  // ISO date string
  submission_status?: string;             // e.g., "Pending", "Approved", "Rejected"
  status_updated_at?: string;             // ISO date string
  
  // Feedback
  client_feedback?: string;
  client_feedback_date?: string;          // ISO date string
  
  extra_fields?: Record<string, any>;     // JSON object
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetRequirementSubmissionDto;  // See 4.2 for shape
}
```

---

#### 4.2 GET `/api/v1/submissions`
**Purpose:** Get all submissions with filters and pagination

**Required Permission:** `submissions:read`

**Query Params:**
- `skip` (string, default: "0")
- `take` (string, default: "20")
- `job_requirement_id` (string): Filter by job ID
- `submission_status` (string): Filter by status
- `search` (string): Search candidate name and other fields
- `orderBy` (string): `"created_at" | "updated_at" | "submitted_at" | "profile_submission_date"`
- `orderDirection` (string): `"ASC" | "DESC"`

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetRequirementSubmissionDto[];
  total: number;
}
```

**GetRequirementSubmissionDto Shape:**
```typescript
{
  id: number;
  job_requirement_id: number;
  daily_submission_id: number | null;
  profile_submission_date: Date;
  vendor_email_id: string | null;
  candidate_title: string | null;
  candidate_name: string;
  candidate_phone: string | null;
  candidate_email: string | null;
  candidate_notice_period: string | null;
  candidate_current_location: string | null;
  candidate_location_applying_for: string | null;
  candidate_total_experience: number | null;
  candidate_relevant_experience: number | null;
  candidate_skills: string | null;
  vendor_quoted_rate: number | null;
  interview_screenshot_url: string | null;
  interview_platform: string | null;
  screenshot_duration_minutes: number | null;
  candidate_visa_type: string | null;
  candidate_engagement_type: string | null;
  candidate_ex_infosys_employee_id: string | null;
  submitted_by_user_id: number | null;
  submitted_at: Date;
  submission_status: string | null;
  status_updated_at: Date | null;
  client_feedback: string | null;
  client_feedback_date: Date | null;
  extra_fields: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by: number | null;
  updated_by: number | null;
}
```

---

#### 4.3 GET `/api/v1/submissions/:id`
**Purpose:** Get a single submission by ID

**Required Permission:** `submissions:read`

**Path Params:**
- `id` (number): Submission ID

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetRequirementSubmissionDto;
}
```

---

#### 4.4 PUT `/api/v1/submissions/:id`
**Purpose:** Update submission

**Required Permission:** `submissions:update`

**Path Params:**
- `id` (number): Submission ID

**Request Body:** (All fields optional, partial update)
```typescript
{
  submission_status?: string;
  client_feedback?: string;
  // ... any other fields from CreateRequirementSubmissionDto
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetRequirementSubmissionDto;
}
```

---

#### 4.5 DELETE `/api/v1/submissions/:id`
**Purpose:** Delete submission

**Required Permission:** `submissions:delete`

**Path Params:**
- `id` (number): Submission ID

**Response (204 No Content):** Empty body

---

#### 4.6 GET `/api/v1/submissions/stats/count`
**Purpose:** Get total submission count

**Required Permission:** `submissions:read`

**Response (200 OK):**
```typescript
{
  success: true;
  count: number;
}
```

---

#### 4.7 GET `/api/v1/submissions/by-job-requirement/:jobRequirementId`
**Purpose:** Find submissions for a specific job

**Required Permission:** `submissions:read`

**Path Params:**
- `jobRequirementId` (number): Job ID

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetRequirementSubmissionDto[];
}
```

---

#### 4.8 GET `/api/v1/submissions/by-status/:status`
**Purpose:** Find submissions by status

**Required Permission:** `submissions:read`

**Path Params:**
- `status` (string): Submission status

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetRequirementSubmissionDto[];
}
```

---

#### 4.9 GET `/api/v1/submissions/by-vendor/:vendorEmail`
**Purpose:** Find submissions by vendor email

**Required Permission:** `submissions:read`

**Path Params:**
- `vendorEmail` (string): Vendor email address

**Response (200 OK):**
```typescript
{
  success: true;
  data: GetRequirementSubmissionDto[];
}
```

---

#### 4.10 GET `/api/v1/submissions/count-by-status/:status`
**Purpose:** Count submissions by status

**Required Permission:** `submissions:read`

**Path Params:**
- `status` (string): Submission status

**Response (200 OK):**
```typescript
{
  success: true;
  count: number;
}
```

---

#### 4.11 GET `/api/v1/submissions/count-by-requirement/:jobRequirementId`
**Purpose:** Count submissions for a job

**Required Permission:** `submissions:read`

**Path Params:**
- `jobRequirementId` (number): Job ID

**Response (200 OK):**
```typescript
{
  success: true;
  count: number;
}
```

---

### Business Rules
1. **Primary Key:** INTEGER (not UUID)
2. **No Candidate FK:** Candidate data is denormalized directly in submissions table
3. **Mandatory Fields:** `job_requirement_id`, `profile_submission_date`, `candidate_name`
4. **Submitted At:** Auto-set on create if not provided
5. **Status Values:** Backend does not enforce enum (freeform string)
6. **Audit:** Tracks `created_by` and `updated_by`

---

### Notes for UI Developers
- **ID Type:** Use number (not string) for submission IDs
- **No Candidate Relation:** Submissions store candidate data inline (no FK to candidates table)
- **Status Field:** Freeform string; frontend should define status constants
- **Skills Format:** `candidate_skills` is comma-separated string
- **Pagination:** Use `skip`/`take` (not `page`/`limit`)
- **Read-Only Fields:** `id`, `created_at`, `updated_at`, `created_by`, `updated_by`

---

## 5. INTERVIEWS MODULE

### Controller
- **File:** `src/interviews/controllers/interview.controller.ts`
- **Base Route:** `/interviews` **(NOT `/api/v1/interviews`)**
- **Guard:** `JwtAuthGuard` (all endpoints)

### Endpoints

#### 5.1 POST `/interviews`
**Purpose:** Schedule a new interview

**Required Permission:** `interviews:create`

**Request Body:**
```typescript
{
  submission_id: string;                 // Required, UUID
  job_requirement_id: string;            // Required, UUID
  candidate_id?: string;                 // Optional, UUID
  round: InterviewRound;                 // Required, enum
  scheduled_date?: string;               // Optional, YYYY-MM-DD
  scheduled_time?: string;               // Optional, HH:MM:SS
  interviewer_id?: string;               // Optional, UUID (FK to users)
  mode: InterviewMode;                   // Required, enum
  status?: InterviewStatus;              // Optional, enum (default: SCHEDULED)
  rating?: number;                       // Optional, 0-10 (precision 3, scale 1)
  feedback?: string;                     // Optional
  outcome?: string;                      // Optional
  candidate_notes?: string;              // Optional
  remarks?: string;                      // Optional
  location?: string;                     // Optional (for offline interviews)
  meeting_link?: string;                 // Optional (for online interviews)
  reschedule_reason?: string;            // Optional
}
```

**Enums:**
```typescript
// InterviewMode
enum InterviewMode {
  ONLINE = "Online",
  OFFLINE = "Offline",
  PHONE = "Phone"
}

// InterviewRound
enum InterviewRound {
  SCREENING = "Screening",
  FIRST_ROUND = "First Round",
  SECOND_ROUND = "Second Round",
  THIRD_ROUND = "Third Round",
  HR = "HR",
  TECHNICAL = "Technical"
}

// InterviewStatus
enum InterviewStatus {
  SCHEDULED = "Scheduled",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
  RESCHEDULED = "Rescheduled",
  NO_SHOW = "No Show",
  IN_PROGRESS = "In Progress"
}
```

**Response (201 Created):**
```typescript
GetInterviewDto  // See 5.3 for shape
```

---

#### 5.2 GET `/interviews`
**Purpose:** List all interviews with filters

**Required Permission:** `interviews:read`

**Query Params:**
- `skip` (string): Offset
- `take` (string): Limit
- `submission_id` (string): Filter by submission UUID
- `interviewer_id` (string): Filter by interviewer UUID
- `round` (string): Filter by InterviewRound enum
- `status` (string): Filter by InterviewStatus enum
- `from_date` (string): Filter from date (YYYY-MM-DD)
- `to_date` (string): Filter to date (YYYY-MM-DD)
- `orderBy` (string): `"created_at" | "updated_at" | "scheduled_date"`
- `orderDirection` (string): `"ASC" | "DESC"`

**Response (200 OK):**
```typescript
{
  data: GetInterviewDto[];
  total: number;
}
```

---

#### 5.3 GET `/interviews/:id`
**Purpose:** Get a single interview

**Required Permission:** `interviews:read`

**Path Params:**
- `id` (string): Interview UUID

**Response (200 OK):**
```typescript
GetInterviewDto
```

**GetInterviewDto Shape:**
```typescript
{
  id: string;                           // UUID
  company_id: string;                   // UUID
  submission_id: string;                // UUID
  job_requirement_id: string;           // UUID
  candidate_id: string | null;          // UUID
  round: InterviewRound;
  scheduled_date: string | null;        // Date string
  scheduled_time: string | null;
  interviewer_id: string | null;        // UUID
  mode: InterviewMode;
  status: InterviewStatus;
  rating: number | null;
  feedback: string | null;
  outcome: string | null;
  candidate_notes: string | null;
  remarks: string | null;
  location: string | null;
  meeting_link: string | null;
  reschedule_reason: string | null;
  created_by: string | null;            // UUID
  updated_by: string | null;            // UUID
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
```

---

#### 5.4 GET `/interviews/stats/count`
**Purpose:** Get interview count by status

**Required Permission:** `interviews:read`

**Response (200 OK):**
```typescript
{
  count: number;
}
```

---

#### 5.5 GET `/interviews/submission/:submission_id`
**Purpose:** Get interviews for a submission

**Required Permission:** `interviews:read`

**Path Params:**
- `submission_id` (string): Submission UUID

**Response (200 OK):**
```typescript
GetInterviewDto[]
```

---

#### 5.6 PUT `/interviews/:id/feedback`
**Purpose:** Record interview feedback

**Required Permission:** `interviews:update`

**Path Params:**
- `id` (string): Interview UUID

**Request Body:**
```typescript
{
  feedback: string;       // Required
  rating: number;         // Required, 0-10
  remarks?: string;       // Optional
}
```

**Response (200 OK):**
```typescript
GetInterviewDto
```

---

#### 5.7 PUT `/interviews/:id/complete`
**Purpose:** Mark interview as completed

**Required Permission:** `interviews:update`

**Path Params:**
- `id` (string): Interview UUID

**Request Body:** None

**Response (200 OK):**
```typescript
GetInterviewDto
```

---

#### 5.8 PUT `/interviews/:id/reschedule`
**Purpose:** Reschedule an interview

**Required Permission:** `interviews:update`

**Path Params:**
- `id` (string): Interview UUID

**Request Body:**
```typescript
{
  scheduled_date: string;    // Required, YYYY-MM-DD
  scheduled_time: string;    // Required, HH:MM:SS
  reason?: string;           // Optional
}
```

**Response (200 OK):**
```typescript
GetInterviewDto
```

---

#### 5.9 PUT `/interviews/:id/cancel`
**Purpose:** Cancel an interview

**Required Permission:** `interviews:update`

**Path Params:**
- `id` (string): Interview UUID

**Request Body:**
```typescript
{
  reason?: string;  // Optional
}
```

**Response (200 OK):**
```typescript
GetInterviewDto
```

---

#### 5.10 PUT `/interviews/:id`
**Purpose:** Update an interview

**Required Permission:** `interviews:update`

**Path Params:**
- `id` (string): Interview UUID

**Request Body:** (All fields optional, partial update)
```typescript
UpdateInterviewDto  // Any field from CreateInterviewDto
```

**Response (200 OK):**
```typescript
GetInterviewDto
```

---

#### 5.11 DELETE `/interviews/:id`
**Purpose:** Delete an interview (soft delete)

**Required Permission:** `interviews:delete`

**Path Params:**
- `id` (string): Interview UUID

**Response (204 No Content):** Empty body

---

### Business Rules
1. **Primary Key:** UUID (not INTEGER)
2. **Company Scoping:** All operations scoped to `company_id` from JWT
3. **Status Transitions:**
   - `SCHEDULED` → `COMPLETED`, `CANCELLED`, `RESCHEDULED`, `NO_SHOW`
   - `RESCHEDULED` → `SCHEDULED`
   - No explicit state machine validation (service layer handles it)
4. **Terminal States:** `COMPLETED`, `CANCELLED`, `NO_SHOW` (updates may be restricted)
5. **Rating:** Decimal(3,1) - e.g., 0.0 to 10.0
6. **Soft Delete:** `deleted_at` timestamp used

---

### Notes for UI Developers
- **Base Path WARNING:** Interviews use `/interviews` NOT `/api/v1/interviews`
- **ID Type:** Use string (UUID) for interview IDs
- **Enums:** Use exact enum values (case-sensitive)
- **Company Scoping:** Backend extracts `company_id` from JWT (`req.user.company_id`)
- **Feedback Flow:** Use PUT `/interviews/:id/feedback` for structured feedback entry
- **Status Actions:** Use dedicated endpoints (`/complete`, `/reschedule`, `/cancel`) for common actions
- **Read-Only Fields:** `id`, `company_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`

---

## 6. OFFERS MODULE

### Controller
- **File:** `src/offers/controllers/offer.controller.ts`
- **Base Route:** `/api/v1/offers`
- **Guard:** `JwtAuthGuard` (all endpoints)

### Endpoints

#### 6.1 POST `/api/v1/offers`
**Purpose:** Create a new offer (draft)

**Required Permission:** `offers:create`

**Request Body:**
```typescript
{
  submission_id: string;                // Required, UUID
  employment_type: EmploymentTypeEnum;  // Required, enum
  start_date?: string;                  // Optional, YYYY-MM-DD
  expiry_date?: string;                 // Optional, YYYY-MM-DD
  currency?: string;                    // Optional (default: USD)
  base_salary?: number;                 // Optional, min 0
  bonus?: number;                       // Optional, min 0
  equity?: string;                      // Optional
  notes?: string;                       // Optional
}
```

**Enums:**
```typescript
// EmploymentTypeEnum
enum EmploymentTypeEnum {
  FULL_TIME = "full_time",
  CONTRACT = "contract",
  INTERN = "intern",
  PART_TIME = "part_time"
}

// OfferStatusEnum (read-only, not sent in request)
enum OfferStatusEnum {
  DRAFT = "draft",
  ISSUED = "issued",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  WITHDRAWN = "withdrawn"
}
```

**Response (200 OK):**
```typescript
{
  id: string;                           // UUID
  company_id: string;                   // UUID
  submission_id: string;                // UUID
  status: OfferStatusEnum;              // "draft"
  offer_version: number;                // Default: 1
  currency: string;
  base_salary: number | null;
  bonus: number | null;
  equity: string | null;
  employment_type: EmploymentTypeEnum;
  start_date: Date | null;
  expiry_date: Date | null;
  notes: string | null;
  created_by_id: number;                // INTEGER user ID
  updated_by_id: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
```

---

#### 6.2 GET `/api/v1/offers`
**Purpose:** Get all offers (paginated)

**Required Permission:** `offers:read`

**Query Params:**
- `page` (string, default: "1"): Page number
- `limit` (string, default: "20"): Items per page

**Response (200 OK):**
```typescript
{
  data: Offer[];
  total: number;
  page: number;
  limit: number;
}
```

---

#### 6.3 GET `/api/v1/offers/:id`
**Purpose:** Get offer by ID

**Required Permission:** `offers:read`

**Path Params:**
- `id` (string): Offer UUID

**Response (200 OK):**
```typescript
Offer  // See 6.1 response shape
```

---

#### 6.4 GET `/api/v1/offers/submission/:submissionId`
**Purpose:** Get offers by submission

**Required Permission:** `offers:read`

**Path Params:**
- `submissionId` (string): Submission UUID

**Query Params:**
- `page` (string, default: "1")
- `limit` (string, default: "20")

**Response (200 OK):**
```typescript
{
  data: Offer[];
  total: number;
  page: number;
  limit: number;
}
```

---

#### 6.5 PATCH `/api/v1/offers/:id`
**Purpose:** Update offer (draft only)

**Required Permission:** `offers:update`

**Path Params:**
- `id` (string): Offer UUID

**Request Body:** (All fields optional, partial update)
```typescript
{
  start_date?: string;
  expiry_date?: string;
  currency?: string;
  base_salary?: number;
  bonus?: number;
  equity?: string;
  employment_type?: EmploymentTypeEnum;
  notes?: string;
}
```

**Response (200 OK):**
```typescript
Offer
```

**Business Rule:** Only `draft` offers can be updated

---

#### 6.6 POST `/api/v1/offers/:id/issue`
**Purpose:** Issue offer (transition from draft → issued)

**Required Permission:** `offers:issue`

**Path Params:**
- `id` (string): Offer UUID

**Request Body:**
```typescript
{
  notes?: string;  // Optional
}
```

**Response (200 OK):**
```typescript
Offer  // status changed to "issued"
```

**Business Rule:** Only `draft` offers can be issued

---

#### 6.7 POST `/api/v1/offers/:id/accept`
**Purpose:** Accept offer (transition from issued → accepted)

**Required Permission:** `offers:accept`

**Path Params:**
- `id` (string): Offer UUID

**Request Body:**
```typescript
{
  accepted_at?: string;              // Optional, ISO date string
  metadata?: Record<string, any>;    // Optional
}
```

**Response (200 OK):**
```typescript
Offer  // status changed to "accepted"
```

**Business Rule:** Only `issued` offers can be accepted

---

#### 6.8 POST `/api/v1/offers/:id/reject`
**Purpose:** Reject offer (transition from issued → rejected)

**Required Permission:** `offers:reject`

**Path Params:**
- `id` (string): Offer UUID

**Request Body:**
```typescript
{
  reason?: string;                   // Optional
  metadata?: Record<string, any>;    // Optional
}
```

**Response (200 OK):**
```typescript
Offer  // status changed to "rejected"
```

**Business Rule:** Only `issued` offers can be rejected

---

#### 6.9 POST `/api/v1/offers/:id/withdraw`
**Purpose:** Withdraw offer (transition from issued → withdrawn)

**Required Permission:** `offers:withdraw`

**Path Params:**
- `id` (string): Offer UUID

**Request Body:**
```typescript
{
  reason: string;  // Required
}
```

**Response (200 OK):**
```typescript
Offer  // status changed to "withdrawn"
```

**Business Rule:** Only `issued` offers can be withdrawn

---

#### 6.10 DELETE `/api/v1/offers/:id`
**Purpose:** Delete offer (soft delete, draft only)

**Required Permission:** `offers:update`

**Path Params:**
- `id` (string): Offer UUID

**Response (204 No Content):** Empty body

**Business Rule:** Only `draft` offers can be deleted

---

#### 6.11 GET `/api/v1/offers/:id/status-history`
**Purpose:** Get offer status history

**Required Permission:** `offers:view_history`

**Path Params:**
- `id` (string): Offer UUID

**Response (200 OK):**
```typescript
{
  history: StatusHistoryEntry[];
}
```

**StatusHistoryEntry Shape:**
```typescript
{
  id: string;
  offer_id: string;
  from_status: OfferStatusEnum | null;
  to_status: OfferStatusEnum;
  changed_by_id: number;
  changed_at: Date;
  reason: string | null;
}
```

---

#### 6.12 GET `/api/v1/offers/stats/by-status`
**Purpose:** Get offer statistics by status

**Required Permission:** `offers:read`

**Response (200 OK):**
```typescript
{
  draft: number;
  issued: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
  total: number;
}
```

---

### Business Rules
1. **Primary Key:** UUID
2. **Company Scoping:** All operations scoped to `company_id` from JWT
3. **Status State Machine:**
   - `draft` → `issued` (via POST `/issue`)
   - `issued` → `accepted` (via POST `/accept`)
   - `issued` → `rejected` (via POST `/reject`)
   - `issued` → `withdrawn` (via POST `/withdraw`)
4. **Terminal States:** `accepted`, `rejected`, `withdrawn` (no further transitions)
5. **Update Restriction:** Only `draft` offers can be updated or deleted
6. **Soft Delete:** Uses `deleted_at` timestamp
7. **Version Tracking:** `offer_version` increments on updates (implementation detail)

---

### Notes for UI Developers
- **ID Type:** Use string (UUID) for offer IDs
- **User ID Type:** `created_by_id` and `updated_by_id` are INTEGER (not UUID)
- **Status Transitions:** Use dedicated POST endpoints for state changes (not PATCH)
- **Pagination:** Offers use `page`/`limit` (not `skip`/`take`)
- **Currency:** Defaults to "USD" if not provided
- **Salary Fields:** Decimal(15,2) precision for monetary values
- **Read-Only Fields:** `id`, `company_id`, `status`, `offer_version`, `created_by_id`, `updated_by_id`, `created_at`, `updated_at`, `deleted_at`
- **History Tracking:** Status changes are audited in separate table

---

## 7. USERS MODULE (NOT FOUND)

### Status
**NOT FOUND** - No dedicated Users controller exists in the backend.

### Notes
- User management is handled through:
  1. Auth module for authentication
  2. RBAC module for role queries
  3. Super Admin module for user CRUD (excluded from this contract)
- Business users cannot create/update/delete other users via Business APIs
- User information is retrieved via `/api/v1/auth/me` (not implemented, but user data is in login response)

### Workaround for UI
- Display current user info from login response (`user` object)
- List users is NOT SUPPORTED via Business API
- User management must be done via Super Admin UI

---

## ROLE → MODULE ACCESS MATRIX

### Confirmed Roles (from seeds)
1. **Admin** (`admin`)
2. **Recruiter** (`recruiter`)
3. **Hiring Manager** (`hiring_manager`)
4. **Viewer** (`viewer`)

---

### Permission Breakdown by Role

#### ADMIN
**Full Access:** All modules with wildcard permissions

| Module       | Read | Create | Update | Delete | Special Permissions |
|--------------|------|--------|--------|--------|---------------------|
| Auth         | ✓    | -      | -      | -      | -                   |
| RBAC         | ✓    | ✗      | ✗      | ✗      | `roles:manage`, `audit:view` |
| Jobs         | ✓    | ✓      | ✓      | ✓      | `jobs:publish`      |
| Submissions  | ✓    | ✓      | ✓      | ✓      | -                   |
| Interviews   | ✓    | ✓      | ✓      | ✓      | -                   |
| Offers       | ✓    | ✓      | ✓      | ✓      | `offers:issue`, `offers:accept`, `offers:reject`, `offers:withdraw`, `offers:view_history` |
| Users        | ✓    | ✓      | ✓      | ✓      | `users:invite`      |
| Settings     | ✓    | -      | ✓      | -      | `settings:manage`   |
| Reports      | ✓    | -      | ✓      | -      | `reports:export`    |
| Webhooks     | ✓    | ✓      | ✓      | ✓      | `webhooks:manage`   |

**Full Permission List:**
```
candidates:*, jobs:*, applications:*, skill-categories:*, skills:*, 
education-levels:*, experience-types:*, qualifications:*, documents:*, 
pipelines:*, users:read, users:create, users:update, users:invite, 
users:delete, reports:*, settings:manage, roles:manage, audit:view, 
webhooks:manage, api:access
```

---

#### RECRUITER
**Day-to-Day Operations:** Full access to core ATS workflows

| Module       | Read | Create | Update | Delete | Special Permissions |
|--------------|------|--------|--------|--------|---------------------|
| Auth         | ✓    | -      | -      | -      | -                   |
| RBAC         | ✓    | ✗      | ✗      | ✗      | -                   |
| Jobs         | ✓    | ✓      | ✗      | ✗      | `jobs:publish`      |
| Submissions  | ✓    | ✓      | ✓      | ✗      | -                   |
| Interviews   | ✓    | ✓      | ✓      | ✓      | -                   |
| Offers       | ✓    | ✓      | ✓      | ✓      | -                   |
| Users        | ✗    | ✗      | ✗      | ✗      | -                   |
| Candidates   | ✓    | ✓      | ✓      | ✗      | -                   |
| Documents    | ✓    | ✓      | ✗      | ✗      | -                   |
| Reports      | ✓    | -      | -      | -      | -                   |

**Full Permission List:**
```
candidates:read, candidates:create, candidates:update, jobs:read, 
jobs:create, jobs:publish, applications:read, applications:create, 
applications:update, skill-categories:read, skills:read, 
education-levels:read, experience-types:read, qualifications:read, 
documents:read, documents:create, pipelines:read, reports:view, 
api:access
```

**Note:** Recruiters can publish jobs but cannot update/delete them after creation

---

#### HIRING MANAGER
**Review & Decision Making:** Read access + limited update for applications

| Module       | Read | Create | Update | Delete | Special Permissions |
|--------------|------|--------|--------|--------|---------------------|
| Auth         | ✓    | -      | -      | -      | -                   |
| RBAC         | ✓    | ✗      | ✗      | ✗      | -                   |
| Jobs         | ✓    | ✗      | ✗      | ✗      | -                   |
| Submissions  | ✓    | ✗      | ✗      | ✗      | -                   |
| Interviews   | ✓    | ✗      | ✗      | ✗      | -                   |
| Offers       | ✓    | ✗      | ✗      | ✗      | -                   |
| Users        | ✗    | ✗      | ✗      | ✗      | -                   |
| Candidates   | ✓    | ✗      | ✗      | ✗      | -                   |
| Applications | ✓    | ✗      | ✓      | ✗      | -                   |
| Documents    | ✓    | ✗      | ✗      | ✗      | -                   |
| Reports      | ✓    | -      | -      | -      | `reports:export`    |

**Full Permission List:**
```
candidates:read, jobs:read, applications:read, skill-categories:read, 
skills:read, education-levels:read, experience-types:read, 
qualifications:read, documents:read, pipelines:read, 
applications:update, reports:view, reports:export
```

**Note:** Hiring Managers can update applications (move candidates through stages) but cannot create/delete

---

#### VIEWER
**Read-Only Access:** View-only permissions across all modules

| Module       | Read | Create | Update | Delete | Special Permissions |
|--------------|------|--------|--------|--------|---------------------|
| Auth         | ✓    | -      | -      | -      | -                   |
| RBAC         | ✓    | ✗      | ✗      | ✗      | -                   |
| Jobs         | ✓    | ✗      | ✗      | ✗      | -                   |
| Submissions  | ✓    | ✗      | ✗      | ✗      | -                   |
| Interviews   | ✓    | ✗      | ✗      | ✗      | -                   |
| Offers       | ✓    | ✗      | ✗      | ✗      | -                   |
| Users        | ✗    | ✗      | ✗      | ✗      | -                   |
| Candidates   | ✓    | ✗      | ✗      | ✗      | -                   |
| Applications | ✓    | ✗      | ✗      | ✗      | -                   |
| Documents    | ✓    | ✗      | ✗      | ✗      | -                   |
| Reports      | ✓    | -      | -      | -      | -                   |

**Full Permission List:**
```
candidates:read, jobs:read, applications:read, skill-categories:read, 
skills:read, education-levels:read, experience-types:read, 
qualifications:read, documents:read, pipelines:read, reports:view
```

**Note:** Viewers have strictly read-only access with no modification permissions

---

### Permission Enforcement

**Mechanism:**
- `@Require()` decorator on controller methods (e.g., `@Require('jobs:create')`)
- `@RequirePermissions()` decorator (e.g., `@RequirePermissions('interviews:create')`)
- `RoleGuard` validates permissions from JWT payload
- `PermissionGuard` validates specific permission requirements

**Wildcard:**
- Admin role gets `["*"]` permission array
- Wildcard grants access to ALL permissions automatically

**Permission Format:**
- `resource:action` (e.g., `jobs:read`, `offers:issue`)
- Wildcards: `resource:*` or `["*"]` for full access

---

### Module-Specific Notes

#### Jobs
- **Admin:** Full CRUD + publish
- **Recruiter:** Create + publish (no update/delete after creation)
- **Hiring Manager:** Read-only
- **Viewer:** Read-only

#### Submissions
- **Admin:** Full CRUD
- **Recruiter:** Create + update (no delete)
- **Hiring Manager:** Read-only
- **Viewer:** Read-only

#### Interviews
- **Admin:** Full CRUD
- **Recruiter:** Full CRUD
- **Hiring Manager:** Read-only
- **Viewer:** Read-only

#### Offers
- **Admin:** Full lifecycle management (draft → issue → accept/reject/withdraw)
- **Recruiter:** Full lifecycle management
- **Hiring Manager:** Read-only
- **Viewer:** Read-only

#### RBAC
- **Admin:** Read roles + stub mutation endpoints (501)
- **Others:** Read roles only

---

## APPENDIX: COMMON PATTERNS

### A. Standard Response Envelope
Most endpoints wrap responses in:
```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  statusCode?: number;
}
```

**Exceptions:**
- Interviews module returns raw DTOs (no envelope)
- DELETE endpoints return 204 with empty body

---

### B. Pagination Patterns

**Pattern 1: Skip/Take (Jobs, Submissions)**
```
GET /api/v1/jobs?skip=0&take=20
Response: { success: true, data: [], total: number }
```

**Pattern 2: Page/Limit (Offers)**
```
GET /api/v1/offers?page=1&limit=20
Response: { data: [], total: number, page: number, limit: number }
```

**Pattern 3: Skip/Take (Interviews)**
```
GET /interviews?skip=0&take=20
Response: { data: [], total: number }
```

---

### C. Error Response Pattern
```typescript
{
  statusCode: number;      // HTTP status code
  message: string;         // Error message
  error?: string;          // Error type (e.g., "Unauthorized")
}
```

**Common Errors:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing/invalid JWT or permission denied
- `404 Not Found`: Resource not found
- `501 Not Implemented`: Stub endpoints (RBAC mutations)

---

### D. Filtering & Search
- **Jobs:** `search` param searches across multiple fields
- **Submissions:** `search` param searches candidate name and related fields
- **Interviews:** Dedicated filter params per field (no generic search)
- **Offers:** No search/filter (except pagination and submission_id)

---

### E. Ordering
Most list endpoints support:
- `orderBy`: Field name (e.g., `"created_at"`, `"updated_at"`)
- `orderDirection`: `"ASC"` or `"DESC"`

---

### F. Soft Delete
- **Interviews:** Uses `deleted_at` timestamp
- **Offers:** Uses `deleted_at` timestamp
- **Jobs/Submissions:** Hard delete (no `deleted_at`)

---

### G. Audit Fields
- `created_by` / `updated_by`: Set automatically from JWT user ID
- `created_at` / `updated_at`: Auto-managed timestamps
- UI should NOT send these fields in create/update requests

---

## DOCUMENT VERSION

**Generated:** January 8, 2026  
**Last Updated:** January 8, 2026  
**Version:** 1.0.0  
**Coverage:** 6 modules (Auth, RBAC, Jobs, Submissions, Interviews, Offers)  
**Status:** Complete and code-verified

---

**END OF BUSINESS API CONTRACT**
