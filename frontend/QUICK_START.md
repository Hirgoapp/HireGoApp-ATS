# ATS Frontend - Quick Reference Guide

> **Note:** The root `frontend/` Vite app was removed. Only **two** UIs exist: `frontend/super-admin` and `frontend/business`. See `frontend/README.md`.

## Installation & Running

**Super Admin (platform owner):**

```bash
cd frontend/super-admin
npm install
npm run dev
```

Opens on **http://localhost:5174**

**Business portal (tenant companies):**

```bash
cd frontend/business
npm install
npm run dev
```

Opens on **http://localhost:5180**

**All-in-one (from repo root):** `npm run dev:full`

---

## Core Usage Patterns

### 1. Get Auth State

```typescript
import { useAuthStore } from '@/store/authStore';

const { user, isAuthenticated, isLoading } = useAuthStore();
```

### 2. Login User

```typescript
const { login, error } = useAuthStore();

try {
  await login(email, password);
  // Auto-redirects to /dashboard
} catch (error) {
  // Error in store.error
}
```

### 3. Check Permission

```typescript
import { useHasPermission } from '@/utils/permissions';

const canRead = useHasPermission('candidates:read');

if (canRead) {
  return <CandidatesPage />;
}
```

### 4. Protect Route

```typescript
import { ProtectedRoute } from '@/routes/AppRoutes';

<ProtectedRoute requiredPermission="candidates:read">
  <CandidatesPage />
</ProtectedRoute>
```

### 5. API Request with Auto-Token

```typescript
import { apiClient } from '@/api/apiClient';

// Token automatically attached
const candidates = await apiClient.get('/candidates');

// 401 auto-refreshes token and retries
```

### 6. Handle Errors

```typescript
import { getUserFriendlyMessage } from '@/utils/errors';

try {
  // ...
} catch (error) {
  const msg = getUserFriendlyMessage(error);
  alert(msg);
}
```

---

## Directory Cheat Sheet

| Directory | Purpose |
|-----------|---------|
| `src/api/` | Axios client + config |
| `src/auth/` | Token storage + auth service |
| `src/store/` | Zustand auth store |
| `src/routes/` | Route definitions + ProtectedRoute |
| `src/pages/` | Page components |
| `src/layout/` | Header, Sidebar, MainLayout |
| `src/types/` | TypeScript interfaces |
| `src/utils/` | Permissions, errors, helpers |

---

## Common Imports

```typescript
// Auth
import { useAuthStore } from '@/store/authStore';
import { useHasPermission, PERMISSIONS, ROLES } from '@/utils/permissions';

// API
import { apiClient } from '@/api/apiClient';

// Routes
import { ProtectedRoute } from '@/routes/AppRoutes';

// Errors
import { getUserFriendlyMessage, logError } from '@/utils/errors';
```

---

## Permission Examples

```typescript
// Check single permission
useHasPermission('candidates:read')

// Check role
useHasRole('admin')

// Check multiple permissions
useHasAnyPermission(['candidates:read', 'candidates:create'])
useHasAllPermissions(['candidates:read', 'candidates:create'])

// Check multiple roles
useHasAnyRole(['admin', 'manager'])

// Use constants (type-safe)
PERMISSIONS.CANDIDATES_READ
ROLES.ADMIN
```

---

## Store Methods

```typescript
const {
  // State
  user,           // User object or null
  isAuthenticated, // Boolean
  isLoading,      // Boolean
  error,          // Error message
  
  // Auth actions
  login,          // async (email, password)
  logout,         // sync
  refreshToken,   // async
  initializeAuth, // async
  clearError,     // sync
  
  // Permission checks
  hasPermission,  // (perm: string) => boolean
  hasRole,        // (role: string) => boolean
  hasAnyPermission,  // (perms: string[]) => boolean
  hasAllPermissions, // (perms: string[]) => boolean
  hasAnyRole,     // (roles: string[]) => boolean
  getTenantContext, // () => { companyId, userId }
} = useAuthStore();
```

---

## Environment Configuration

Create `.env.local`:
```
VITE_API_URL=http://localhost:3000/api/v1
```

---

## File Structure Overview

```
src/
├── api/
│   ├── apiClient.ts      (Axios + interceptors)
│   └── apiConfig.ts      (Endpoints, defaults)
├── auth/
│   ├── authService.ts    (API calls)
│   └── tokenStorage.ts   (localStorage helpers)
├── store/
│   └── authStore.ts      (Zustand auth store)
├── routes/
│   └── AppRoutes.tsx     (Routes + ProtectedRoute)
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── NotFoundPage.tsx
│   └── UnauthorizedPage.tsx
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── MainLayout.tsx
├── types/
│   ├── auth.ts
│   └── api.ts
├── utils/
│   ├── permissions.ts    (Permission checks)
│   └── errors.ts         (Error handling)
├── App.tsx               (Root component)
└── main.tsx              (Entry point)
```

---

## Build & Deploy

```bash
# Type check
npm run type-check

# Build
npm run build

# Preview build
npm run preview

# Lint (if configured)
npm run lint
```

Output: `dist/` directory (ready for deployment)

---

## Debugging

### Check Auth State
```typescript
// In browser console
import { useAuthStore } from 'src/store/authStore';
const store = useAuthStore.getState();
console.log(store.user, store.isAuthenticated);
```

### Check localStorage
```
Open DevTools → Application → Local Storage → ats_*
```

### Check API Calls
```
Open DevTools → Network → Filter 'api'
Check Authorization header in request
```

### Check Token Expiration
```typescript
import { isTokenExpired, getTokenExpiresAt } from '@/auth/tokenStorage';
console.log('Expires at:', new Date(getTokenExpiresAt()));
console.log('Is expired:', isTokenExpired());
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Infinite 401 loop | Verify refresh token works on backend |
| Token not attached | Check localStorage and request interceptor |
| State not updating | Ensure using hooks, not getState() |
| CORS errors | Check backend allows your origin |
| Lost auth on refresh | Check localStorage persisting |

---

## Next: Building Features

Once foundation is running, add feature pages:

1. Create new page in `src/pages/`
2. Add route in `App.tsx` with `<ProtectedRoute>`
3. Use `useAuthStore()` for permissions
4. Use `apiClient` for API calls
5. Handle errors with `getUserFriendlyMessage()`

---

**Status:** ✅ Foundation Ready  
**Tech Stack:** React 18 + TypeScript + Vite + Zustand + Axios + Tailwind  
**Multi-Tenant:** ✅ Fully supported  
**RBAC:** ✅ Permission & role checking  
**JWT:** ✅ Auto-refresh on 401  
