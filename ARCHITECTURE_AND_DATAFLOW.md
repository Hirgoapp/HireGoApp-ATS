# ATS Application Architecture & Data Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER'S COMPUTER                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     BROWSER                                 │ │
│  │          http://localhost:5173                              │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │        FRONTEND (React + Vite)                    │   │ │
│  │  │                                                    │   │ │
│  │  │  ┌──────────────────────────────────────┐        │   │ │
│  │  │  │  Router (React Router)               │        │   │ │
│  │  │  │  • /login (public)                   │        │   │ │
│  │  │  │  • /dashboard (protected)            │        │   │ │
│  │  │  │  • /candidates (protected)           │        │   │ │
│  │  │  │  • /jobs (protected)                 │        │   │ │
│  │  │  │  • /submissions (protected)          │        │   │ │
│  │  │  │  • /interviews (protected)           │        │   │ │
│  │  │  │  • /offers (protected)               │        │   │ │
│  │  │  │  • /reports (protected)              │        │   │ │
│  │  │  └──────────────────────────────────────┘        │   │ │
│  │  │                                                    │   │ │
│  │  │  ┌──────────────────────────────────────┐        │   │ │
│  │  │  │  Auth Store (Zustand)                │        │   │ │
│  │  │  │  • user (name, email, permissions)  │        │   │ │
│  │  │  │  • tokens (access, refresh)         │        │   │ │
│  │  │  │  • isAuthenticated boolean          │        │   │ │
│  │  │  └──────────────────────────────────────┘        │   │ │
│  │  │                                                    │   │ │
│  │  │  ┌──────────────────────────────────────┐        │   │ │
│  │  │  │  Services (HTTP Calls)               │        │   │ │
│  │  │  │  • authService                      │        │   │ │
│  │  │  │  • candidatesService                │        │   │ │
│  │  │  │  • jobsService                      │        │   │ │
│  │  │  │  • submissionsService               │        │   │ │
│  │  │  │  • interviewsService                │        │   │ │
│  │  │  │  • offersService                    │        │   │ │
│  │  │  │  • reportsService                   │        │   │ │
│  │  │  └──────────────────────────────────────┘        │   │ │
│  │  │                                                    │   │ │
│  │  │  ┌──────────────────────────────────────┐        │   │ │
│  │  │  │  API Client (Axios)                  │        │   │ │
│  │  │  │  • Base URL: localhost:3000/api/v1  │        │   │ │
│  │  │  │  • JWT Bearer Token in headers      │        │   │ │
│  │  │  │  • Auto-refresh on 401              │        │   │ │
│  │  │  └──────────────────────────────────────┘        │   │ │
│  │  │                                                    │   │ │
│  │  │  ┌──────────────────────────────────────┐        │   │ │
│  │  │  │  Local Storage                       │        │   │ │
│  │  │  │  • ats_access_token                 │        │   │ │
│  │  │  │  • ats_refresh_token                │        │   │ │
│  │  │  │  • ats_user                         │        │   │ │
│  │  │  │  • ats_expires_at                   │        │   │ │
│  │  │  └──────────────────────────────────────┘        │   │ │
│  │  │                                                    │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           ↓↑ (HTTP)                            │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  BACKEND (Node.js)                                      │ │
│  │  http://localhost:3000                                 │ │
│  │                                                         │ │
│  │  ┌────────────────────────────────────────────────┐   │ │
│  │  │        NestJS Server                          │   │ │
│  │  │                                               │   │ │
│  │  │  Controllers:                                 │   │ │
│  │  │  • AuthController (/api/v1/auth)             │   │ │
│  │  │  • CandidatesController (/api/v1/candidates) │   │ │
│  │  │  • JobsController (/api/v1/jobs)             │   │ │
│  │  │  • SubmissionsController                     │   │ │
│  │  │  • InterviewsController                      │   │ │
│  │  │  • OffersController (/api/v1/offers)         │   │ │
│  │  │  • ReportsController (/api/v1/reports)       │   │ │
│  │  │                                               │   │ │
│  │  │  Middleware:                                  │   │ │
│  │  │  • JwtAuthGuard (checks token)               │   │ │
│  │  │  • PermissionGuard (checks permissions)      │   │ │
│  │  │  • TenantContext (multi-tenant)              │   │ │
│  │  │                                               │   │ │
│  │  │  Services (Business Logic):                   │   │ │
│  │  │  • AuthService (login, tokens)               │   │ │
│  │  │  • CandidatesService (CRUD)                  │   │ │
│  │  │  • JobsService (CRUD)                        │   │ │
│  │  │  • SubmissionsService (CRUD)                 │   │ │
│  │  │  • InterviewsService (CRUD)                  │   │ │
│  │  │  • OffersService (CRUD)                      │   │ │
│  │  │  • ReportsService (queries)                  │   │ │
│  │  │  • RbacService (permissions)                 │   │ │
│  │  │                                               │   │ │
│  │  └────────────────────────────────────────────────┘   │ │
│  │                      ↓↑ (SQL)                         │ │
│  │  ┌────────────────────────────────────────────────┐   │ │
│  │  │  TypeORM (Database Layer)                     │   │ │
│  │  │  • Entities (User, Candidate, Job, etc)      │   │ │
│  │  │  • Repositories (CRUD on entities)           │   │ │
│  │  │  • Migrations (schema management)            │   │ │
│  │  └────────────────────────────────────────────────┘   │ │
│  │                      ↓↑ (TCP)                         │ │
│  │  ┌────────────────────────────────────────────────┐   │ │
│  │  │  PostgreSQL (Port 5432)                       │   │ │
│  │  │  Database: ats_saas                           │   │ │
│  │  │  • users (admin account)                      │   │ │
│  │  │  • candidates                                 │   │ │
│  │  │  • jobs                                       │   │ │
│  │  │  • submissions                                │   │ │
│  │  │  • interviews                                 │   │ │
│  │  │  • offers                                     │   │ │
│  │  │  • permissions (RBAC)                         │   │ │
│  │  └────────────────────────────────────────────────┘   │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Examples

### 1. Login Flow

```
User Types Email & Password
    ↓
Frontend: authService.login(email, password)
    ↓
Axios: POST http://localhost:3000/api/v1/auth/login
    ├─ Body: { email, password }
    ↓
Backend: AuthController.login()
    ├─ Validates credentials
    ├─ Generates JWT tokens
    ├─ Returns: { accessToken, refreshToken, user, expiresIn }
    ↓
Frontend: Stores tokens in localStorage & Zustand store
    ├─ ats_access_token
    ├─ ats_refresh_token
    ├─ ats_user
    ├─ ats_expires_at
    ↓
Frontend: Redirects to /dashboard
    ↓
Dashboard loads with user data & live metrics
```

### 2. View Candidates Flow

```
User Clicks "Candidates" in Sidebar
    ↓
Frontend: Navigates to /candidates
    ↓
Frontend: CandidatesPage mounts
    ├─ Checks: hasPermission('candidates:read')
    ├─ If not granted: Redirects to /unauthorized
    ├─ If granted: Continues
    ↓
Frontend: candidatesService.list()
    ↓
Axios: GET http://localhost:3000/api/v1/candidates
    ├─ Headers: { Authorization: 'Bearer {token}' }
    ↓
Backend: JwtAuthGuard validates token
    ├─ If invalid/expired: 401 Unauthorized
    ├─ Frontend interceptor: Attempts token refresh
    ├─ If refresh fails: Redirects to /login
    ├─ If valid: Continues
    ↓
Backend: CandidatesController.findAll()
    ├─ TenantContextMiddleware: Filters by company
    ├─ CandidatesService: Queries DB
    ├─ Returns: { data: [ candidates ], pagination: { ... } }
    ↓
Database: SELECT * FROM candidates WHERE company_id = ?
    ↓
Database: Returns candidate records
    ↓
Backend: Returns 200 OK with candidate data
    ↓
Frontend: candidatesService normalizes response
    ↓
Frontend: Sets state with candidate list
    ↓
React: Re-renders table with data
    ↓
User: Sees list of candidates
```

### 3. Create Candidate Flow

```
User Clicks "Add Candidate" Button
    ↓
Frontend: Checks hasPermission('candidates:create')
    ├─ If not granted: Button disabled
    ├─ If granted: Modal/Form shows
    ↓
User: Fills form (first_name, last_name, email, etc)
    ↓
User: Clicks "Create Candidate"
    ↓
Frontend: Form validation
    ├─ Required fields: first_name, last_name, email
    ├─ Email format validation
    ├─ If validation fails: Shows inline errors
    ├─ If validation passes: Continues
    ↓
Frontend: candidatesService.create({ first_name, last_name, email, ... })
    ↓
Axios: POST http://localhost:3000/api/v1/candidates
    ├─ Headers: { Authorization: 'Bearer {token}' }
    ├─ Body: { first_name, last_name, email, ... }
    ↓
Backend: JwtAuthGuard validates token
    ├─ If invalid: 401 → Frontend redirects to /login
    ├─ If valid: Continues
    ↓
Backend: PermissionGuard checks 'candidates:create' permission
    ├─ If not granted: 403 Forbidden
    ├─ If granted: Continues
    ↓
Backend: CandidatesController.create()
    ├─ Input validation (class-validator)
    ├─ If validation fails: 400 Bad Request with errors
    ├─ If validation passes: Continues
    ↓
Backend: CandidatesService.create()
    ├─ Sets company_id from TenantContext
    ├─ Saves to database
    ↓
Database: INSERT INTO candidates (...)
    ↓
Database: Returns new candidate record
    ↓
Backend: Returns 201 Created with candidate data
    ↓
Frontend: candidatesService normalizes response
    ↓
Frontend: Shows success message & redirects to /candidates
    ↓
CandidatesPage: Reloads candidate list
    ↓
User: Sees newly created candidate in list
```

### 4. Permission Denied Flow

```
User (without 'interviews:create' permission)
    ↓
User Tries to Access: /interviews/new
    ↓
Frontend: React Router renders route
    ├─ Route has: <ProtectedRoute requiredPermission="interviews:create">
    ↓
Frontend: ProtectedRoute component checks permission
    ├─ authStore.hasPermission('interviews:create') = false
    ↓
Frontend: Renders <Navigate to="/unauthorized" />
    ↓
Frontend: User redirected to /unauthorized
    ↓
Frontend: UnauthorizedPage displays error message
    ↓
User: Sees "You do not have permission to perform this action"
```

---

## API Endpoint Structure

```
POST   /api/v1/auth/login                  → Authenticate
GET    /api/v1/auth/me                     → Get current user
POST   /api/v1/auth/refresh                → Refresh token

GET    /api/v1/candidates                  → List candidates
POST   /api/v1/candidates                  → Create candidate
GET    /api/v1/candidates/:id              → Get candidate
PATCH  /api/v1/candidates/:id              → Update candidate

GET    /api/v1/jobs                        → List jobs
POST   /api/v1/jobs                        → Create job
GET    /api/v1/jobs/:id                    → Get job
PATCH  /api/v1/jobs/:id                    → Update job

GET    /api/v1/submissions                 → List submissions
POST   /api/v1/submissions                 → Create submission
GET    /api/v1/submissions/:id             → Get submission
PATCH  /api/v1/submissions/:id             → Update submission

GET    /api/v1/interviews                  → List interviews
POST   /api/v1/interviews                  → Create interview
GET    /api/v1/interviews/:id              → Get interview
PATCH  /api/v1/interviews/:id              → Update interview

GET    /api/v1/offers                      → List offers
POST   /api/v1/offers                      → Create offer
GET    /api/v1/offers/:id                  → Get offer
PATCH  /api/v1/offers/:id                  → Update offer

GET    /api/v1/reports/dashboard           → Get dashboard metrics
GET    /api/v1/reports                     → List reports
```

---

## Database Schema (Simplified)

```
users
├─ id
├─ email
├─ name
├─ password_hash
├─ company_id (tenant)
├─ role
└─ created_at

candidates
├─ id
├─ first_name
├─ last_name
├─ email
├─ company_id (tenant)
└─ created_at

jobs
├─ id
├─ title
├─ description
├─ company_id (tenant)
└─ created_at

submissions
├─ id
├─ candidate_id (FK)
├─ job_id (FK)
├─ current_stage
├─ outcome
├─ company_id (tenant)
└─ created_at

interviews
├─ id
├─ submission_id (FK)
├─ round
├─ mode
├─ status
├─ scheduled_at
├─ company_id (tenant)
└─ created_at

offers
├─ id
├─ submission_id (FK)
├─ ctc
├─ status
├─ joining_date
├─ company_id (tenant)
└─ created_at

permissions
├─ id
├─ name (e.g., "candidates:read")
├─ description
└─ created_at

role_permissions
├─ id
├─ role_id (FK)
├─ permission_id (FK)
└─ created_at
```

---

## Key Architectural Patterns

### 1. **Multi-Tenant Isolation**
Every record has `company_id` to isolate data by tenant.
```
TenantContextMiddleware extracts company from JWT token
  ↓
All queries automatically filtered by company_id
  ↓
User can only see their company's data
```

### 2. **Role-Based Access Control (RBAC)**
```
User → Role (admin, recruiter, etc) → Permissions (candidates:read, jobs:create, etc)
  ↓
PermissionGuard on each endpoint checks user permissions
  ↓
Frontend ProtectedRoute also checks permissions
  ↓
Double-protected (backend + frontend)
```

### 3. **JWT Authentication**
```
Login → Backend generates tokens → Frontend stores in localStorage
  ↓
Every request includes: Authorization: Bearer {token}
  ↓
Backend JwtAuthGuard validates token
  ↓
If expired: Frontend refreshes using refresh token
  ↓
If refresh fails: Redirect to login
```

### 4. **Error Handling**
```
Frontend: API error → getErrorDetails() → Shows user-friendly message
Backend: Validation error → Returns 400 with field-level errors
Frontend: Form displays inline errors
User: Knows exactly what went wrong
```

---

## Security Layers

```
Layer 1: HTTPS (Production)
  ├─ All traffic encrypted

Layer 2: CORS
  ├─ Only localhost:5173 can access backend

Layer 3: JWT Authentication
  ├─ Every request must include valid token
  ├─ Token expires in 24 hours
  ├─ Refresh token enables long sessions

Layer 4: Permission Checking
  ├─ Backend: PermissionGuard on every endpoint
  ├─ Frontend: ProtectedRoute on every page

Layer 5: Input Validation
  ├─ Backend: class-validator checks all inputs
  ├─ Frontend: Form validation before submission

Layer 6: Multi-Tenant Isolation
  ├─ All records filtered by company_id
  ├─ User can only see their company's data
```

---

## Performance Optimizations

```
1. Frontend Code Splitting
   ├─ Routes lazy-loaded (except in dev)
   ├─ Separate bundles for each page
   └─ Faster initial load

2. Token Refresh Caching
   ├─ Prevents multiple refresh requests
   ├─ Uses Promise queue system
   └─ Reduces API calls

3. Pagination
   ├─ Lists paginated (limit: 25-50)
   ├─ Reduces data transfer
   └─ Faster initial page load

4. Database Indexes
   ├─ Indexes on company_id
   ├─ Indexes on email
   └─ Fast queries

5. Lazy Loading
   ├─ Services only fetch when needed
   ├─ No unnecessary API calls
   └─ Efficient bandwidth
```

---

## Data Flow Summary

```
START: npm run dev:all
    ↓
Backend (Port 3000) + Frontend (Port 5173) both start
    ↓
User opens http://localhost:5173
    ↓
Unauthenticated → Redirected to /login
    ↓
User logs in → JWT tokens generated & stored
    ↓
User navigates pages → Components fetch live data
    ↓
Each request:
  1. Frontend sends to Backend API
  2. Backend validates JWT token
  3. Backend checks permissions
  4. Backend queries database
  5. Backend returns data
  6. Frontend displays data
    ↓
User creates records:
  1. Frontend form validation
  2. POST to Backend API
  3. Backend validates & saves
  4. Database persists
  5. Frontend redirects to list
  6. List reloads from database
    ↓
User sees always-live data
```

---

**End of Architecture & Data Flow Documentation**
