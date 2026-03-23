# ATS Frontend Foundation - Implementation Guide

## Overview

Complete frontend foundation for the ATS SaaS application built with React + TypeScript + Vite. Implements JWT authentication, protected routes, permission-based access control, and a responsive global layout aligned with the backend architecture.

**Tech Stack:**
- React 18 + TypeScript
- Vite (build & dev server)
- Axios (HTTP client)
- Zustand (state management)
- React Router v6 (routing)
- Tailwind CSS (styling)

---

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── apiClient.ts          # Axios instance with interceptors
│   │   └── apiConfig.ts           # API endpoints, base URL, config
│   ├── auth/
│   │   ├── authService.ts         # Auth API service
│   │   └── tokenStorage.ts        # JWT token management (localStorage)
│   ├── components/
│   │   └── [Feature components]
│   ├── layout/
│   │   ├── Header.tsx             # Top navigation with user menu
│   │   ├── Sidebar.tsx            # Side navigation (permission-filtered)
│   │   └── MainLayout.tsx         # Main layout wrapper
│   ├── pages/
│   │   ├── LoginPage.tsx          # Login form
│   │   ├── DashboardPage.tsx      # Dashboard (protected)
│   │   ├── NotFoundPage.tsx       # 404 error
│   │   └── UnauthorizedPage.tsx   # 403 forbidden
│   ├── routes/
│   │   └── AppRoutes.tsx          # Route definitions & ProtectedRoute
│   ├── store/
│   │   └── authStore.ts           # Zustand auth store
│   ├── types/
│   │   ├── auth.ts                # Auth types
│   │   └── api.ts                 # API response types
│   ├── utils/
│   │   ├── permissions.ts         # Permission/role checking utilities
│   │   └── errors.ts              # Error handling utilities
│   ├── App.tsx                    # Root component
│   ├── App.css                    # App styles
│   ├── main.tsx                   # React DOM entry point
│   └── index.css                  # Global styles
├── package.json                   # Dependencies
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── index.html                     # HTML entry point
├── .env.example                   # Environment variables template
└── .gitignore                     # Git ignore patterns
```

---

## Core Features

### 1. Authentication System (Zustand Store)

**Location:** `src/store/authStore.ts`

```typescript
// Usage in components
import { useAuthStore } from '@/store/authStore';

function MyComponent() {
  const { user, isAuthenticated, login, logout, hasPermission } = useAuthStore();
  
  if (!isAuthenticated) return <div>Not logged in</div>;
  
  return <div>Welcome, {user?.name}!</div>;
}
```

**State:**
- `user`: Current logged-in user (null if not authenticated)
- `accessToken`: JWT access token
- `refreshToken`: JWT refresh token
- `isAuthenticated`: Boolean flag
- `isLoading`: During auth checks
- `error`: Error message

**Actions:**
- `login(email, password)`: Authenticate user
- `logout()`: Clear auth and redirect
- `refreshToken()`: Refresh access token (automatic on 401)
- `initializeAuth()`: Restore auth from localStorage
- `clearError()`: Clear error message

**Permission Checking:**
```typescript
// In component
const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions } = useAuthStore();

if (hasPermission('candidates:read')) {
  // Show candidates feature
}

if (hasRole('admin')) {
  // Show admin panel
}
```

---

### 2. API Client with Interceptors

**Location:** `src/api/apiClient.ts`

**Features:**
- Automatic JWT token attachment to all requests
- Automatic 401 token refresh and retry
- Token refresh queue (prevents race conditions)
- Error handling aligned with backend

**Request Interceptor:**
```
Request → Attach "Authorization: Bearer {token}" header → Send to backend
```

**Response Interceptor:**
```
Response (200) → Return data
Response (401) → Token refresh → Retry request with new token
Response (401 after refresh) → Logout and redirect to /login
Other errors → Return error
```

**Usage:**
```typescript
import { apiClient } from '@/api/apiClient';

// GET request
const candidates = await apiClient.get('/candidates');

// POST request
const newCandidate = await apiClient.post('/candidates', { name: 'John' });

// Token is automatically attached
// 401 errors are automatically handled
```

---

### 3. Protected Routes

**Location:** `src/routes/AppRoutes.tsx`

```typescript
// Basic protection (auth required)
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// Permission required
<ProtectedRoute requiredPermission="candidates:read">
  <CandidatesPage />
</ProtectedRoute>

// Role required
<ProtectedRoute requiredRole="admin">
  <AdminPage />
</ProtectedRoute>
```

**Behavior:**
- No auth → Redirect to `/login`
- Missing permission → Redirect to `/unauthorized`
- Missing role → Redirect to `/unauthorized`
- Has access → Render component

---

### 4. Permission & Role Utilities

**Location:** `src/utils/permissions.ts`

**Hook-based checks (in components):**
```typescript
import { 
  useHasPermission, 
  useHasRole, 
  useHasAnyPermission 
} from '@/utils/permissions';

function MyComponent() {
  const canRead = useHasPermission('candidates:read');
  const isAdmin = useHasRole('admin');
  const hasAnyReporting = useHasAnyPermission(['reports:read', 'reports:export']);
  
  return (
    <>
      {canRead && <button>View Candidates</button>}
      {isAdmin && <button>Admin Settings</button>}
    </>
  );
}
```

**Standalone checks (outside components):**
```typescript
import { hasPermission, hasRole } from '@/utils/permissions';

// Use store state directly
if (hasPermission('candidates:read')) {
  // Can view candidates
}
```

**Permission Constants:**
```typescript
import { PERMISSIONS, ROLES } from '@/utils/permissions';

// Use constants for type safety
<ProtectedRoute requiredPermission={PERMISSIONS.CANDIDATES_READ}>
  <CandidatesPage />
</ProtectedRoute>
```

---

### 5. Error Handling

**Location:** `src/utils/errors.ts`

**Extract error message:**
```typescript
import { getErrorMessage, getUserFriendlyMessage } from '@/utils/errors';

try {
  await apiClient.post('/login', credentials);
} catch (error) {
  const message = getErrorMessage(error);           // Raw message
  const friendly = getUserFriendlyMessage(error);   // User-friendly
}
```

**Error checking functions:**
```typescript
import {
  isNetworkError,
  isUnauthorizedError,
  isForbiddenError,
  isValidationError,
  isServerError
} from '@/utils/errors';

if (isValidationError(error)) {
  // Show validation errors
}
```

**Error logging:**
```typescript
import { logError } from '@/utils/errors';

try {
  // ...
} catch (error) {
  logError(error, {
    action: 'create_candidate',
    companyId: user?.companyId,
    userId: user?.id
  });
}
```

---

## Authentication Flow

### Login Flow
```
1. User enters email/password on LoginPage
2. submitLogin() calls authStore.login(email, password)
3. authService.login() → POST /auth/login
4. Backend returns: { accessToken, refreshToken, user, expiresIn }
5. Zustand store saves tokens to localStorage + state
6. Navigate to /dashboard
```

### Token Refresh Flow
```
1. API request made with attached token
2. Backend returns 401 Unauthorized
3. Response interceptor detects 401
4. Calls authService.refreshToken() → POST /auth/refresh
5. Backend returns new accessToken
6. Store new token in localStorage
7. Retry original request with new token
8. Return data to caller
```

### Automatic Logout Flow
```
1. Token refresh fails (invalid/expired refresh token)
2. Response interceptor catches error
3. Calls clearTokens() and setToLogout state
4. Redirects to /login
5. User must login again
```

---

## API Integration with Backend

### Expected Backend Endpoints

**Authentication:**
- `POST /auth/login` → Login user
- `POST /auth/refresh` → Refresh access token
- `POST /auth/logout` → Logout user
- `GET /auth/me` → Get current user
- `GET /auth/verify` → Verify token

**Request/Response Format:**

Login Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Login Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "companyId": "comp_456",
    "companyName": "Acme Corp",
    "role": "recruiter",
    "permissions": ["candidates:read", "jobs:read", ...]
  }
}
```

Error Response:
```json
{
  "statusCode": 400,
  "message": "Invalid credentials",
  "error": "BadRequest",
  "errors": {
    "email": ["Email not found"]
  }
}
```

---

## Configuration

### Environment Variables

Create `.env.local`:
```dotenv
VITE_API_URL=http://localhost:3000/api/v1
```

The app uses `import.meta.env.VITE_API_URL` to configure the API base URL.

---

## Development

### Setup

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`

### Build

```bash
npm run build
```

Outputs to `dist/` directory.

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

---

## Component Examples

### Using Auth State

```typescript
import { useAuthStore } from '@/store/authStore';

export const ProfileCard: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) return <div>Not logged in</div>;

  return (
    <div>
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
      <p>Company: {user?.companyName}</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

### Permission-Aware UI

```typescript
import { useHasPermission } from '@/utils/permissions';

export const ActionBar: React.FC = () => {
  const canCreate = useHasPermission('candidates:create');
  const canExport = useHasPermission('candidates:export');

  return (
    <div className="flex gap-2">
      {canCreate && <button>+ New Candidate</button>}
      {canExport && <button>📥 Export</button>}
    </div>
  );
};
```

### Protected Component

```typescript
import { ProtectedRoute } from '@/routes/AppRoutes';

export const AdminPanel: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>Admin settings...</div>
    </ProtectedRoute>
  );
};
```

---

## Token Management

**Token Storage:**
```
localStorage
├── ats_access_token      # JWT access token (short-lived, ~1 hour)
├── ats_refresh_token     # JWT refresh token (long-lived, ~7 days)
├── ats_user              # Stringified user object
└── ats_expires_at        # Token expiration timestamp
```

**Token Expiration:**
- Access token: 3600 seconds (1 hour)
- Refresh token: Longer duration
- Buffer: 60 seconds before expiration (refresh early to avoid gaps)

**Token Storage Utilities:**
```typescript
import { getAccessToken, getRefreshToken, isTokenExpired, clearTokens } from '@/auth/tokenStorage';

const token = getAccessToken();
const isExpired = isTokenExpired(token);
clearTokens();  // On logout
```

---

## Multi-Tenant Architecture

The frontend is fully multi-tenant aware:

1. **Company ID in JWT:** Extracted during login, stored in user object
2. **Tenant Context:** Available via `getTenantContext()` in auth store
3. **Automatic Filtering:** All API requests filtered by company ID on backend
4. **Isolation:** Users can only access their own company's data

```typescript
const { user } = useAuthStore();
const companyId = user?.companyId;  // Current company

// Backend ensures only this company's data is returned
const candidates = await apiClient.get('/candidates');
```

---

## Security Considerations

1. **JWT Storage:** Stored in localStorage (production: consider httpOnly cookies)
2. **Token Refresh:** Automatic on 401, with queue to prevent race conditions
3. **CORS:** Backend must allow frontend origin
4. **HTTPS:** Required in production (configured via API_URL)
5. **Permission Checking:** Both frontend (UX) and backend (security)

---

## Styling

Uses Tailwind CSS utility-first approach:

- **Responsive:** Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Colors:** Blue primary (`blue-600`), gray neutrals
- **Layout:** Flexbox and CSS Grid
- **Components:** Pre-built utility classes

**Global Styles:**
- `src/index.css` - Tailwind imports + base styles
- `src/App.css` - App-level styles

---

## Next Steps

1. **Connect to Backend:** Update `VITE_API_URL` to your backend
2. **Test Login:** Verify login flow works with backend
3. **Build Features:** Use foundation to build business screens
4. **Deploy:** Build with `npm run build`, serve `dist/` folder

---

## Troubleshooting

### 401 Loop
- Check refresh token is valid
- Verify backend refresh endpoint works
- Check token storage is persisting

### CORS Errors
- Verify backend allows frontend origin
- Check API_URL is correct
- Ensure credentials are sent if needed

### State Not Updating
- Zustand uses shallow equality
- Check browser DevTools Redux extension for state changes
- Verify you're using hooks (not accessing store incorrectly)

### Token Not Attached
- Check localStorage has token
- Verify request interceptor runs
- Check Authorization header in Network tab

---

## API Reference

**Zustand Auth Store:**
```typescript
interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login(email: string, password: string): Promise<void>;
  logout(): void;
  refreshToken(): Promise<void>;
  initializeAuth(): Promise<void>;
  clearError(): void;
  
  // Permissions
  hasPermission(permission: string): boolean;
  hasRole(role: string): boolean;
  hasAnyPermission(permissions: string[]): boolean;
  hasAllPermissions(permissions: string[]): boolean;
  hasAnyRole(roles: string[]): boolean;
  
  // Tenant
  getTenantContext(): { companyId: string; userId: string } | null;
}
```

---

**Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Foundation Complete - Ready for Feature Development
