# ATS Frontend - Setup & Architecture Guide

## Overview

This is the frontend foundation for the ATS (Applicant Tracking System) SaaS application built with React, TypeScript, and Vite.

**Tech Stack**:
- React 18 + TypeScript
- Vite (build tool & dev server)
- React Router v6 (routing)
- Axios (HTTP client)
- Tailwind CSS (styling)

---

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   └── ProtectedRoute.tsx
│   ├── config/              # Configuration files
│   │   ├── api.ts           # API configuration
│   │   └── routes.tsx       # Route definitions
│   ├── context/             # React Context
│   │   └── AuthContext.tsx  # Authentication context
│   ├── hooks/               # Custom React hooks
│   │   └── useAuth.ts       # Auth hook
│   ├── layout/              # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── pages/               # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── UnauthorizedPage.tsx
│   ├── services/            # API services
│   │   ├── apiClient.ts     # Axios instance with interceptors
│   │   └── authService.ts   # Auth API calls
│   ├── types/               # TypeScript types
│   │   └── auth.ts          # Auth types
│   ├── utils/               # Utility functions
│   │   └── tokenStorage.ts  # Token management
│   ├── App.tsx              # Root component
│   ├── App.css              # App styles
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html               # HTML entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind config
├── postcss.config.js        # PostCSS config
├── package.json             # Dependencies
├── .env.example             # Example env variables
└── README.md                # This file
```

---

## Installation & Setup

### Prerequisites
- Node.js 16+ (npm or yarn)
- Backend API running on `http://localhost:3000`

### Steps

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env if backend is on different URL
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```

---

## Authentication Flow

### 1. Login Page
- User enters email and password
- `LoginPage` calls `authService.login()`

### 2. Authentication Context
- AuthContext stores user state globally
- Token stored in localStorage
- User data persisted across refreshes

### 3. API Interceptors
- Axios automatically adds JWT token to all requests
- 401 errors trigger token refresh
- Failed refresh redirects to login

### 4. Protected Routes
- `ProtectedRoute` component checks auth status
- Redirects unauthenticated users to login
- Supports permission-based access

### Token Storage
```typescript
// Tokens stored in localStorage
localStorage.getItem('ats_access_token')
localStorage.getItem('ats_refresh_token')
localStorage.getItem('ats_user')
localStorage.getItem('ats_expires_at')
```

---

## Key Components

### AuthContext (`context/AuthContext.tsx`)
Manages authentication state:
- `user` - Current authenticated user
- `isAuthenticated` - Boolean auth status
- `isLoading` - Loading state
- `error` - Error message
- `login()` - Login function
- `logout()` - Logout function
- `refresh()` - Refresh token
- `hasPermission()` - Check permission
- `hasRole()` - Check role

### API Client (`services/apiClient.ts`)
Axios instance with interceptors:
- Automatically attaches JWT token
- Handles 401 errors with token refresh
- Manages refresh queue to prevent race conditions
- Configurable base URL and timeout

### Protected Route (`components/ProtectedRoute.tsx`)
Route guard component:
- Checks authentication status
- Supports optional permission checking
- Supports optional role checking
- Shows loading spinner while checking auth

### Main Layout (`layout/MainLayout.tsx`)
Global layout with:
- Sidebar navigation
- Header with user info
- Responsive design
- Mobile menu toggle

---

## Usage Examples

### Using Authentication Hook
```typescript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, login, logout, hasPermission } = useAuth();

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <p>Welcome, {user.name}</p>
      {hasPermission('candidates:read') && <Candidates />}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes
```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

<ProtectedRoute requiredPermission="candidates:read">
  <CandidatesPage />
</ProtectedRoute>

<ProtectedRoute requiredRole="admin">
  <AdminPage />
</ProtectedRoute>
```

### Making API Calls
```typescript
import { apiClient } from '../services/apiClient';

// GET request
const response = await apiClient.get('/candidates');

// POST request
const response = await apiClient.post('/candidates', {
  name: 'John',
  email: 'john@example.com',
});

// Token is automatically included!
```

---

## API Integration

### Backend Expected Endpoints

**Authentication**:
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user
- `GET /auth/verify` - Verify token

### Response Format

**Login Response**:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "companyId": "company-id",
    "companyName": "Company Name",
    "role": "recruiter",
    "permissions": ["candidates:read", "jobs:read"]
  }
}
```

---

## Environment Variables

Create `.env` file:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Features Implemented

✅ **JWT Authentication**
- Login/logout
- Token refresh
- Automatic token attachment to requests

✅ **Protected Routes**
- Authentication check
- Permission-based access
- Role-based access

✅ **Global Layout**
- Sidebar navigation
- Header with user menu
- Responsive design
- Mobile-friendly

✅ **API Integration**
- Axios client with interceptors
- Error handling
- Request/response transformation

✅ **TypeScript Support**
- Full type safety
- Auth types defined
- Component types

✅ **Tailwind CSS**
- Utility-first CSS
- Responsive design
- Dark mode ready

---

## Development

### Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173`

### Build for Production
```bash
npm run build
```
Output in `dist/` directory

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

---

## Folder Organization by Feature

### Authentication (`context`, `hooks`, `services/authService.ts`)
- AuthContext for global state
- useAuth hook for easy access
- authService for API calls

### API Communication (`services/apiClient.ts`, `utils/tokenStorage.ts`)
- Axios instance with interceptors
- Token management utilities
- Automatic JWT attachment

### Routing (`config/routes.tsx`, `components/ProtectedRoute.tsx`)
- Route definitions
- Protected route component
- Permission/role checks

### UI Components (`layout/`, `pages/`, `components/`)
- Reusable Header and Sidebar
- Full page components
- Protected Route wrapper

### Configuration (`config/`, `types/`)
- API config
- Route definitions
- TypeScript types

---

## Next Steps

### To Add New Pages
1. Create page in `src/pages/`
2. Add route in `config/routes.tsx`
3. Add sidebar navigation item in `layout/Sidebar.tsx`

### To Add API Integration
1. Create service in `src/services/`
2. Use `apiClient` for HTTP requests
3. Define types in `src/types/`

### To Add Protected Feature
1. Create component/page
2. Wrap with `<ProtectedRoute requiredPermission="..." />`
3. Or use `hasPermission()` hook to conditionally render

### To Add Styling
- Use Tailwind utility classes
- Custom styles in component CSS files
- Global styles in `src/index.css`

---

## Troubleshooting

### CORS Errors
- Check backend CORS configuration
- Ensure API URL is correct in `.env`
- Verify requests are to correct endpoint

### 401 Unauthorized
- Token may have expired
- Check localStorage for tokens
- Try logging in again

### Routes Not Working
- Ensure route is defined in `config/routes.tsx`
- Check if route requires authentication
- Verify component exists

### Styling Issues
- Ensure Tailwind CSS is imported in `index.css`
- Run `npm install` to ensure packages installed
- Clear browser cache and rebuild

---

## Performance Tips

1. **Code Splitting**: React Router automatically code splits routes
2. **Lazy Loading**: Use `React.lazy()` for heavy components
3. **Memoization**: Use `React.memo()` for expensive renders
4. **Token Refresh**: Automatic refresh prevents re-login
5. **Caching**: Consider caching API responses

---

## Security Notes

✅ JWT tokens stored in localStorage (consider httpOnly cookies for production)  
✅ Automatic token refresh before expiration  
✅ 401 errors trigger logout  
✅ Protected routes check authentication  
✅ Permission-based access control  
✅ HTTPS recommended for production  

---

## Production Deployment

1. **Build**
   ```bash
   npm run build
   ```

2. **Environment**
   - Set `VITE_API_URL` to production backend URL
   - Ensure CORS is configured on backend

3. **Server**
   - Serve `dist/` directory
   - Configure routing to redirect to `index.html`
   - Enable gzip compression

4. **Security**
   - Use HTTPS
   - Set secure cookies (httpOnly for tokens)
   - Configure CSP headers
   - Enable HSTS

---

## Support & Maintenance

This foundation is ready for:
- Adding new pages and routes
- Integrating new API endpoints
- Adding permission-based features
- Building out full ATS functionality

No breaking changes expected as you extend this foundation.

---

**Version**: 1.0.0  
**Created**: 2024  
**Status**: Production Ready
