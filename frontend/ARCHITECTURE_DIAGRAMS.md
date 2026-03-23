# Frontend Architecture Diagram

## Application Layer Stack

```
┌───────────────────────────────────────────────────────┐
│                    React Application                  │
│                  (React 18 + TypeScript)              │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │         Application Routes (React Router v6)    │ │
│  │                                                 │ │
│  │  /login → LoginPage (public)                    │ │
│  │  /dashboard → Dashboard (protected)             │ │
│  │  /candidates → Candidates (permission-gated)    │ │
│  │  /jobs → Jobs (permission-gated)                │ │
│  │  /submissions, /reports, /settings → ...        │ │
│  └─────────────────────────────────────────────────┘ │
│                      │                                │
│                      ▼                                │
│  ┌─────────────────────────────────────────────────┐ │
│  │         ProtectedRoute Component                │ │
│  │                                                 │ │
│  │  1. Check isAuthenticated (from Zustand)       │ │
│  │  2. Check requiredPermission (if provided)     │ │
│  │  3. Check requiredRole (if provided)           │ │
│  │  4. Redirect to /login or /unauthorized        │ │
│  └─────────────────────────────────────────────────┘ │
│                      │                                │
│                      ▼                                │
│  ┌─────────────────────────────────────────────────┐ │
│  │         MainLayout Wrapper                      │ │
│  │   (Header + Sidebar + Page Content)             │ │
│  │                                                 │ │
│  │  ┌─────────────────────────────────────────┐   │ │
│  │  │ Header Component                        │   │ │
│  │  │ - Company Name + Role Badge             │   │ │
│  │  │ - User Menu (Profile + Logout)          │   │ │
│  │  │ - Uses: useAuthStore for user data      │   │ │
│  │  └─────────────────────────────────────────┘   │ │
│  │                                                 │ │
│  │  ┌──────────────┐  ┌──────────────────────┐    │ │
│  │  │   Sidebar    │  │   Page Content       │    │ │
│  │  │              │  │                      │    │ │
│  │  │ Navigation:  │  │ Dashboard/           │    │ │
│  │  │ - Dashboard  │  │ Candidates/          │    │ │
│  │  │ - Candidates │  │ Jobs/...             │    │ │
│  │  │ - Jobs       │  │                      │    │ │
│  │  │ - Reports    │  │ Uses:                │    │ │
│  │  │ - Settings   │  │ - useAuthStore       │    │ │
│  │  │              │  │ - apiClient          │    │ │
│  │  │ Filters:     │  │ - handleErrors()     │    │ │
│  │  │ - By perms   │  │                      │    │ │
│  │  │ - By role    │  │                      │    │ │
│  │  │              │  │                      │    │ │
│  │  │ Uses:        │  │                      │    │ │
│  │  │ - useAuth    │  │                      │    │ │
│  │  │ - hasPerms   │  │                      │    │ │
│  │  └──────────────┘  └──────────────────────┘    │ │
│  └─────────────────────────────────────────────────┘ │
│                      │                                │
└──────────────────────┼────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Zustand Auth Store         │
        │   (src/store/authStore.ts)   │
        │                              │
        │ State:                       │
        │ - user: User | null          │
        │ - isAuthenticated: boolean   │
        │ - isLoading: boolean         │
        │ - error: string | null       │
        │ - accessToken: string | null │
        │ - refreshToken: string | null│
        │                              │
        │ Actions:                     │
        │ - login(email, password)     │
        │ - logout()                   │
        │ - refreshToken()             │
        │ - initializeAuth()           │
        │ - clearError()               │
        │                              │
        │ Permissions:                 │
        │ - hasPermission(perm)        │
        │ - hasRole(role)              │
        │ - hasAnyPermission(perms[])  │
        │ - hasAllPermissions(perms[]) │
        │                              │
        │ Persistence:                 │
        │ - Zustand persist middleware │
        │ - localStorage storage       │
        │ - devtools integration       │
        └──────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
         ▼                            ▼
    ┌─────────────────┐      ┌─────────────────┐
    │ localStorage    │      │ API Client      │
    │                 │      │ (Axios Instance)│
    │ Keys:           │      │                 │
    │ - ats_access... │      │ Interceptors:   │
    │ - ats_refresh..│      │                 │
    │ - ats_user      │      │ Request:        │
    │ - ats_expires_at│      │ - Add JWT token │
    │                 │      │   to header     │
    │ Read/Write:     │      │                 │
    │ - tokenStorage. │      │ Response:       │
    │   ts helpers    │      │ - Detect 401    │
    │                 │      │ - Auto refresh  │
    └─────────────────┘      │ - Retry request │
                             │ - Handle errors │
                             │                 │
                             └────────┬────────┘
                                      │
                                      ▼
                              ┌──────────────────┐
                              │   HTTP Requests  │
                              │   (to Backend)   │
                              │                  │
                              │ Base URL:        │
                              │ http://localhost:│
                              │ 3000/api/v1      │
                              │                  │
                              │ Endpoints:       │
                              │ - /auth/login    │
                              │ - /auth/refresh  │
                              │ - /auth/logout   │
                              │ - /auth/me       │
                              │ - /candidates    │
                              │ - /jobs          │
                              │ - /submissions   │
                              │ - /reports       │
                              └──────────────────┘
```

---

## State Management Flow

```
User Action (Click Login Button)
        │
        ▼
LoginPage Component
        │
        ├─ setState(email, password)
        │
        ▼
handleSubmit()
        │
        ├─ await authStore.login(email, password)
        │
        ▼
Zustand Store: login()
        │
        ├─ await authService.login({email, password})
        │
        ▼
apiClient.post('/auth/login', data)
        │
        ├─ Request Interceptor:
        │   └─ (no token yet on first request)
        │
        ▼
Backend: POST /auth/login
        │
        ▼
Backend Response:
{
  accessToken,
  refreshToken,
  user: {...},
  expiresIn
}
        │
        ▼
Zustand Store:
        │
        ├─ saveTokens() → localStorage
        ├─ saveUser() → localStorage
        ├─ setUser(userData)
        ├─ setAccessToken()
        ├─ setRefreshToken()
        ├─ setIsAuthenticated(true)
        │
        ▼
Zustand State Updated
        │
        ├─ All subscribers notified
        ├─ LoginPage re-renders
        ├─ useAuthStore() hook updates
        │
        ▼
LoginPage detects isAuthenticated = true
        │
        ├─ navigate('/dashboard')
        │
        ▼
Dashboard Renders
        │
        ├─ ProtectedRoute passes (already authenticated)
        ├─ MainLayout renders
        ├─ Header shows user info
        ├─ Sidebar shows permission-filtered nav
        │
        ▼
API Call from Dashboard:
await apiClient.get('/candidates')
        │
        ├─ Request Interceptor:
        │   └─ getAccessToken() → attaches JWT
        │   └─ Authorization: Bearer <token>
        │
        ▼
Backend processes request
        │
        ├─ Validates JWT signature
        ├─ Extracts company_id, user_id
        ├─ Filters data by company_id
        │
        ▼
Success Response (200)
        │
        ├─ Response Interceptor: passes through
        ├─ Dashboard receives data
        ├─ Component renders
        │
        ▼
Or 401 Response (token expired)
        │
        ├─ Response Interceptor detects 401
        ├─ Checks refreshTokenPromise (queue)
        ├─ Calls authService.refreshToken()
        │
        ▼
Backend: POST /auth/refresh
        │
        ▼
Backend returns new tokens
        │
        ├─ Response Interceptor:
        │   ├─ saveTokens() → localStorage
        │   ├─ Updates Authorization header
        │   ├─ Retries original request
        │
        ▼
Original Request Retried (with new token)
        │
        ├─ Backend validates new token
        ├─ Returns data (200)
        ├─ Response Interceptor passes through
        ├─ Dashboard receives data
        │
        ▼
Application Continues Normal Flow
```

---

## Authentication State Diagram

```
┌─────────────────────────────────────────────┐
│        Application Initialization           │
│            (App.tsx useEffect)              │
└────────────────┬────────────────────────────┘
                 │
                 ├─ initializeAuth()
                 │
                 ▼
    ┌────────────────────────────────┐
    │ Load from localStorage          │
    │ - accessToken                  │
    │ - refreshToken                 │
    │ - user                         │
    │ - expiresAt                    │
    └────────────────┬───────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
 Token? User?   Token Valid?    No Data
     │               │               │
     YES             YES            NO
     │               │               │
     ▼               ▼               ▼
  Set State   Try Refresh        Clear All
     │        (if expired)       Tokens
     │               │               │
     ├─ user      Refresh OK     setAuth
     ├─ tokens       │           false
     ├─ authed    Try Refresh
     │            Failed
     │               │
     │               ▼
     │            Clear Tokens
     │            Set Auth false
     │
     └──────────┬──────────────┘
                │
                ▼
    ┌──────────────────────┐
    │  isLoading = false   │
    │  (ready to render)   │
    └────────────┬─────────┘
                 │
                 ▼
    ┌──────────────────────┐
    │  Route Rendering     │
    │                      │
    │  if !authed:         │
    │   → /login           │
    │  else:               │
    │   → /dashboard       │
    └──────────────────────┘


DURING USER SESSION:

┌─────────────────────────────────┐
│  User Clicks Item               │
│  → Navigates to Route           │
└────────────┬────────────────────┘
             │
             ▼
   ┌─────────────────────┐
   │  ProtectedRoute     │
   │  Component          │
   └────────────┬────────┘
                │
                ├─ isLoading? → Show spinner
                │
                ├─ !isAuthenticated?
                │  → Navigate to /login
                │
                ├─ requiredPermission?
                │  ├─ has permission?
                │  │ ├─ YES → Render
                │  │ └─ NO → /unauthorized
                │
                ├─ requiredRole?
                │  ├─ has role?
                │  │ ├─ YES → Render
                │  │ └─ NO → /unauthorized
                │
                └─ ALL CHECKS PASS
                   → Render Component


ON API ERROR:

┌──────────────────────────┐
│  Response Interceptor    │
│  Detects Error           │
└────────────┬─────────────┘
             │
       ┌─────┼─────┐
       │     │     │
       ▼     ▼     ▼
      401   403   Other
       │     │     │
       ▼     ▼     ▼
    Token  Forbid Return
   Refresh Error  Error
       │
       ▼
  Try Refresh
       │
    ┌──┴──┐
    │     │
    ▼     ▼
  OK   FAIL
    │     │
    ▼     ▼
 Retry  Logout
 Req   Redirect
        /login
```

---

## Permission & Role Decision Tree

```
User Accesses Feature
        │
        ▼
ProtectedRoute evaluates:
        │
        ├─ [1] User authenticated?
        │  ├─ NO → Redirect to /login
        │  └─ YES → Continue
        │
        ├─ [2] requiredPermission provided?
        │  ├─ NO → Continue
        │  └─ YES → Has permission?
        │     ├─ NO → Redirect to /unauthorized
        │     └─ YES → Continue
        │
        ├─ [3] requiredRole provided?
        │  ├─ NO → Continue
        │  └─ YES → Has role?
        │     ├─ NO → Redirect to /unauthorized
        │     └─ YES → Continue
        │
        └─ [4] ALL CHECKS PASS
           └─ Render Component
              └─ Component can use:
                 ├─ useAuthStore()
                 ├─ useHasPermission()
                 ├─ useHasRole()
                 ├─ apiClient
                 └─ error utils
```

---

## Token Lifecycle

```
┌──────────────────────┐
│  User Logs In        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Backend generates:  │
│  - accessToken       │
│  - refreshToken      │
│  - expiresIn (3600s) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Frontend receives   │
│  - Stores in state   │
│  - Saves to storage  │
│  - Calculates        │
│    expiresAt time    │
└──────────┬───────────┘
           │
      [Active Session]
      [User Makes Requests]
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
 Token OK    Token Near
 (< 60s        Expiry
  before       (< 60s)
  expiry)
    │             │
    ▼             ▼
 Attach       Auto Refresh
 to Request    (if used)
    │             │
    ├─────────────┘
    │
    ▼
┌──────────────────────┐
│  Backend validates   │
│  - JWT signature     │
│  - Token not expired │
│  - Company ID match  │
└──────────┬───────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
    Valid     Invalid
      │         │
      ▼         ▼
   200 OK    401 Error
      │         │
      ▼         ▼
  Return     Attempt
  Data      Refresh
      │         │
      │     ┌───┴────┐
      │     │        │
      │     ▼        ▼
      │  Success   Failed
      │     │        │
      │     │        ▼
      │     │    Clear Tokens
      │     │    Logout User
      │     │    /login
      │     │
      │     └────────┐
      │              │
      └──────────────┤
                     │
                     ▼
         ┌──────────────────────┐
         │  New Token Stored    │
         │  Session Continues   │
         └──────────────────────┘


TIMELINE EXAMPLE:

Time    Action                 Token Status
────────────────────────────────────────────
0:00    User logs in          Fresh (1h)
1:30    User uses app         Valid (58m 30s)
0:59    Session active        Valid (1m) ← Auto refresh triggered
1:00    Token refreshed       Fresh (1h)
2:00    User still active     Valid (59m)
...
Expiry  User sees /login      Logged out
```

---

## Component Dependency Graph

```
App.tsx (Root)
    │
    ├─ useAuthStore hook
    │  └─ initializeAuth on mount
    │
    ├─ Router (React Router v6)
    │  │
    │  ├─ Route: /login
    │  │   └─ LoginPage
    │  │      ├─ useAuthStore (login)
    │  │      └─ useNavigate
    │  │
    │  ├─ Route: /dashboard (ProtectedRoute)
    │  │   ├─ MainLayout
    │  │   │  ├─ Header
    │  │   │  │  └─ useAuthStore (user, logout)
    │  │   │  │
    │  │   │  ├─ Sidebar
    │  │   │  │  ├─ useAuthStore (permissions)
    │  │   │  │  ├─ useHasPermission
    │  │   │  │  └─ useHasRole
    │  │   │  │
    │  │   │  └─ DashboardPage
    │  │   │     ├─ useAuthStore (user)
    │  │   │     ├─ apiClient.get()
    │  │   │     └─ getUserFriendlyMessage()
    │  │   │
    │  │   └─ ProtectedRoute (wrapper)
    │  │      ├─ useAuthStore checks
    │  │      └─ Conditional rendering
    │  │
    │  ├─ Route: /candidates (ProtectedRoute)
    │  │   └─ ProtectedRoute (requiredPermission)
    │  │      └─ CandidatesPage
    │  │
    │  ├─ Route: /unauthorized
    │  │   └─ UnauthorizedPage
    │  │
    │  └─ Route: /*
    │      └─ NotFoundPage
    │
    └─ Hooks & Utils (used throughout)
       ├─ useAuthStore (src/store/)
       ├─ useHasPermission (src/utils/)
       ├─ apiClient (src/api/)
       └─ error utilities (src/utils/)
```

---

**Last Updated:** December 2024  
**Architecture Version:** 1.0  
**Status:** Complete
