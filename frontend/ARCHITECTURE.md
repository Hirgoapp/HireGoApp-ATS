# ATS Frontend - Architecture Reference

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            AppRoutes (config/routes.tsx)            │  │
│  │            (Route definitions & config)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AuthProvider (context/AuthContext.tsx)      │  │
│  │    (Global auth state, login/logout, tokens)        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│              ┌───────────┴────────────┬────────────┐        │
│              │                        │            │        │
│              ▼                        ▼            ▼        │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────┐    │
│  │ Public Routes     │  │ Protected Routes │  │ Error│    │
│  │ (Login)           │  │ (Dashboard, etc) │  │Pages │    │
│  └───────────────────┘  └──────────────────┘  └──────┘    │
│         │                       │                           │
│         ▼                       ▼                           │
│  ┌──────────────────────────────────────┐                 │
│  │    Pages & Components                │                 │
│  │  - LoginPage                         │                 │
│  │  - DashboardPage + MainLayout        │                 │
│  │    (Header, Sidebar)                 │                 │
│  └──────────────────────────────────────┘                 │
│         │                                                   │
│         └────────────────┬──────────────────────┐          │
│                          │                      │          │
│                          ▼                      ▼          │
│            ┌──────────────────────┐  ┌────────────────┐   │
│            │ useAuth Hook         │  │ API Services   │   │
│            │ (hooks/useAuth.ts)   │  │ (services/)    │   │
│            └──────────────────────┘  └────────────────┘   │
│                          │                      │          │
│                          └────────────┬─────────┘          │
│                                       │                    │
│                                       ▼                    │
│                      ┌─────────────────────────┐           │
│                      │  API Client             │           │
│                      │ (services/apiClient.ts) │           │
│                      │                         │           │
│                      │ ┌─────────────────────┐ │           │
│                      │ │ Request Interceptor │ │           │
│                      │ │ (Add JWT token)     │ │           │
│                      │ └─────────────────────┘ │           │
│                      │ ┌─────────────────────┐ │           │
│                      │ │Response Interceptor │ │           │
│                      │ │(Handle 401 & refresh)           │
│                      │ └─────────────────────┘ │           │
│                      └─────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                   Backend API (NestJS)
                   (Port 3000, REST)
```

---

## Authentication Flow

```
┌─────────────────┐
│  User on Login  │
└────────┬────────┘
         │
         │ Enter credentials
         ▼
    ┌────────────┐
    │ LoginPage  │ Calls authService.login()
    └────┬───────┘
         │
         ▼
    ┌──────────────────────┐
    │ authService.login()  │ POST /auth/login
    └────┬─────────────────┘
         │
         ▼
    ┌────────────────────────────────────┐
    │ Backend Response:                  │
    │ - accessToken                      │
    │ - refreshToken                     │
    │ - user                             │
    │ - expiresIn                        │
    └────┬──────────────────────────────┘
         │
         ▼
    ┌────────────────────┐
    │ AuthContext        │ Save to state
    │ - saveTokens()     │ Save to localStorage
    │ - saveUser()       │ Redirect to dashboard
    └────────────────────┘
         │
         ▼
    ┌────────────────────┐
    │ Protected Routes   │ isAuthenticated = true
    │ Can access all    │ User data available
    │ pages             │ Token in requests
    └────────────────────┘
```

---

## Token Refresh Flow

```
┌─────────────────────────┐
│ User Makes API Request  │
└────────┬────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ Request Interceptor  │
    │ Add JWT to header    │ Authorization: Bearer {token}
    └────┬─────────────────┘
         │
         ▼
    ┌──────────────────┐
    │ Backend Receives │
    └────┬─────────────┘
         │
         ├─ 200 OK ──────────────────────┐
         │                               │
         │ 401 Unauthorized ──────┐      │
         │                        │      │
         ▼                        ▼      ▼
    ┌────────┐         ┌──────────────────────┐
    │ Success│         │ Response Interceptor │
    └────────┘         │ Handle 401 Error     │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌────────────────────────┐
                       │ POST /auth/refresh     │
                       │ Send refresh token     │
                       └──────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
            ┌──────────────────┐      ┌─────────────────┐
            │ New Tokens       │      │ Refresh Failed  │
            │ Update storage   │      │ Clear tokens    │
            │ Retry request    │      │ Redirect login  │
            └──────────────────┘      └─────────────────┘
```

---

## Permission Check Flow

```
┌──────────────────────┐
│ <ProtectedRoute>     │
│ requiredPermission=" │
│ candidates:read"     │
└──────────┬───────────┘
           │
           ▼
    ┌────────────────┐
    │ Check if auth  │
    │ (isAuthenticated)
    └────┬───────────┘
         │
    ┌────┴────────┐
    │             │
    ▼             ▼
┌─────────┐  ┌──────────────┐
│ Logged  │  │ Not Logged In│
│   in    │  │ Redirect to  │
│         │  │ /login       │
└────┬────┘  └──────────────┘
     │
     ▼
┌────────────────────────┐
│ Check permissions      │
│ user.permissions.      │
│ includes(permission)   │
└────┬───────────────────┘
     │
  ┌──┴──────────────┐
  │                 │
  ▼                 ▼
┌──────────┐  ┌───────────────────┐
│ Has      │  │ No permission      │
│ access   │  │ Redirect to        │
│ Render   │  │ /unauthorized (403)│
│ component   └───────────────────┘
└──────────┘
```

---

## State Management

### Global Auth State (AuthContext)

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    companyId: string;
    companyName: string;
    role: string;
    permissions: string[];
  },
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### LocalStorage

```
localStorage
├── ats_access_token: "eyJhbGc..."
├── ats_refresh_token: "eyJhbGc..."
├── ats_user: "{...user object}"
└── ats_expires_at: "1704067200000"
```

### Component State (Component-level)

```
LoginPage:
├── email: string
├── password: string
├── error: string
└── isLoading: boolean

Sidebar:
├── sidebarOpen: boolean
```

---

## API Interceptor Flow

### Request Interceptor

```typescript
config => {
  // 1. Get token from storage
  const token = getAccessToken();
  
  // 2. Attach to header if exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // 3. Return config
  return config;
}
```

### Response Interceptor

```typescript
response => {
  // 1. Success - return as is
  return response;
}

error => {
  // 1. Check if 401
  if (error.response?.status === 401) {
    // 2. If not already retrying
    if (!originalRequest._retry) {
      // 3. Mark as retrying (prevent infinite loop)
      originalRequest._retry = true;
      
      // 4. Call refresh endpoint
      const newTokens = await apiClient.post('/auth/refresh');
      
      // 5. Save new tokens
      saveTokens(newTokens);
      
      // 6. Retry original request
      return client(originalRequest);
    }
  }
  
  // 7. Other errors - reject
  return Promise.reject(error);
}
```

---

## Data Flow Example: Login to Dashboard

```
1. User navigates to /login
   └─> LoginPage renders

2. User enters email & password
   └─> State updates (email, password)

3. User clicks "Sign In"
   └─> handleSubmit() calls login(email, password)

4. login() calls authService.login()
   └─> POST /auth/login with credentials

5. Backend returns tokens + user
   └─> authService returns response

6. AuthContext updates:
   └─> saveTokens() to localStorage
   └─> saveUser() to localStorage
   └─> setUser(userData)

7. useAuth hook notifies subscribers
   └─> user state updated in all components

8. LoginPage checks isAuthenticated
   └─> navigate('/dashboard')

9. Dashboard renders
   └─> Wrapped in ProtectedRoute
   └─> MainLayout renders
   └─> Sidebar shows menu items based on permissions

10. Subsequent API calls
    └─> Request interceptor adds token
    └─> Response interceptor handles 401 (if needed)
```

---

## Component Hierarchy

```
App.tsx
├── AppRoutes
    ├── <Router>
        ├── <AuthProvider>
            ├── <Routes>
                ├── /login
                │   └── LoginPage
                ├── /dashboard
                │   └── <ProtectedRoute>
                │       └── DashboardPage
                │           └── MainLayout
                │               ├── Sidebar
                │               ├── Header
                │               └── Main content
                ├── /candidates
                │   └── <ProtectedRoute requiredPermission="candidates:read">
                │       └── CandidatesPage
                ├── /unauthorized
                │   └── UnauthorizedPage
                ├── /not-found
                │   └── NotFoundPage
                └── /* (wildcard)
                    └── NotFoundPage
```

---

## API Call Examples

### Simple GET Request
```typescript
// Component
const { user } = useAuth();

useEffect(() => {
  const fetchData = async () => {
    const response = await apiClient.get('/candidates');
    setData(response.data);
  };
  fetchData();
}, []);

// Flow
// 1. Request Interceptor adds Authorization header
// 2. GET /candidates with token
// 3. Response returned or error handled
```

### Request with 401 Handling
```typescript
// User makes API call with expired token

// Flow
// 1. Request interceptor adds token
// 2. Backend returns 401 Unauthorized
// 3. Response interceptor detects 401
// 4. Calls POST /auth/refresh with refresh token
// 5. Gets new access token
// 6. Updates localStorage
// 7. Retries original request with new token
// 8. Component receives data
// 9. If refresh fails, redirects to login
```

---

## Permission & Role Checking

### Has Permission
```typescript
const { hasPermission } = useAuth();

if (hasPermission('candidates:read')) {
  // Show candidates section
}
```

### Has Role
```typescript
const { hasRole } = useAuth();

if (hasRole('admin')) {
  // Show admin options
}
```

### Protected Route
```typescript
<ProtectedRoute requiredPermission="candidates:read">
  <CandidatesPage />
</ProtectedRoute>
```

---

## Error Handling Strategy

### Authentication Errors
- 401 Unauthorized → Token refresh → Retry
- Refresh fails → Clear tokens → Redirect to login

### Network Errors
- Display error message to user
- Retry button optional

### Permission Errors
- 403 Forbidden → Redirect to /unauthorized

### Not Found Errors
- 404 Not Found → Redirect to /not-found

---

## Performance Considerations

1. **Token Refresh Queue**: Prevents multiple simultaneous refreshes
2. **Route-level Code Splitting**: Each route is a separate chunk
3. **Component Memoization**: Prevent unnecessary re-renders
4. **Token Expiration Buffer**: Refresh 60s before actual expiration
5. **localStorage Caching**: Persist auth state across page refreshes

---

## Security Layers

```
Layer 1: Request Level
├─ JWT in Authorization header
├─ HTTPS in production
└─ Secure cookies (future)

Layer 2: Application Level
├─ AuthContext validates tokens
├─ ProtectedRoute blocks unauth access
├─ hasPermission() checks before render
└─ Token refresh before expiration

Layer 3: API Level
├─ Backend verifies JWT signature
├─ Backend validates permissions
├─ Backend enforces multi-tenancy
└─ Backend logs access
```

---

**Architecture Version**: 1.0  
**Last Updated**: 2024
