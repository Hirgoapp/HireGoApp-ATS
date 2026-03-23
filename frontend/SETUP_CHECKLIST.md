# Frontend Foundation - Setup & Deployment Checklist

## Pre-Development Setup ✅

### 1. Installation

```bash
cd frontend
npm install
```

**Expected packages:**
- ✅ react@18.2.0
- ✅ react-dom@18.2.0
- ✅ react-router-dom@6.20.0
- ✅ axios@1.6.0
- ✅ zustand@4.4.0
- ✅ tailwindcss@3.3.6
- ✅ typescript@5.3.3
- ✅ vite@5.0.8

### 2. Environment Configuration

Create `.env.local`:
```
VITE_API_URL=http://localhost:3000/api/v1
```

Verify in `src/api/apiConfig.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
```

### 3. Start Development Server

```bash
npm run dev
```

- Opens on `http://localhost:5173`
- Hot reload enabled
- Proxy configured for `/api` → `http://localhost:3000`

### 4. Backend Verification

Ensure backend is running on `http://localhost:3000` with:
- ✅ POST `/api/v1/auth/login` endpoint
- ✅ POST `/api/v1/auth/refresh` endpoint
- ✅ POST `/api/v1/auth/logout` endpoint
- ✅ GET `/api/v1/auth/me` endpoint
- ✅ GET `/api/v1/auth/verify` endpoint

---

## Feature & File Checklist

### Core Structure
- ✅ `src/api/` - API client with interceptors
- ✅ `src/auth/` - Token storage and auth service
- ✅ `src/store/` - Zustand auth store
- ✅ `src/routes/` - Router configuration
- ✅ `src/pages/` - Foundation pages
- ✅ `src/layout/` - Global layout
- ✅ `src/types/` - TypeScript types
- ✅ `src/utils/` - Permission and error utilities

### Key Files
- ✅ `src/store/authStore.ts` - Zustand store (auth, permissions, roles)
- ✅ `src/api/apiClient.ts` - Axios with interceptors
- ✅ `src/routes/AppRoutes.tsx` - ProtectedRoute component
- ✅ `src/layout/Header.tsx` - User menu with logout
- ✅ `src/layout/Sidebar.tsx` - Navigation with permissions
- ✅ `src/pages/LoginPage.tsx` - Login form
- ✅ `src/pages/DashboardPage.tsx` - Dashboard
- ✅ `src/App.tsx` - Root component with Router

### Configuration
- ✅ `package.json` - Dependencies (Zustand added)
- ✅ `vite.config.ts` - Dev server + proxy
- ✅ `tsconfig.json` - TypeScript strict mode
- ✅ `tailwind.config.js` - Tailwind configuration
- ✅ `postcss.config.js` - PostCSS plugins
- ✅ `.env.example` - Environment template
- ✅ `.gitignore` - Git patterns

---

## Authentication Testing

### 1. Login Test
```
URL: http://localhost:5173/login
Test: Enter credentials → Sign In
Expected: Redirect to /dashboard
Verify: localStorage has ats_* keys
```

### 2. Protected Route Test
```
Logout → Try to access /dashboard
Expected: Redirect to /login
Verify: isAuthenticated = false
```

### 3. Token Refresh Test
```
- Set token expiration to 5 seconds
- Login
- Wait 6 seconds
- Make API call
Expected: 401 → refresh → retry → success
Verify: New token in localStorage
```

### 4. Permission Test
```
Check user permissions in browser console:
const { user } = useAuthStore.getState();
console.log(user.permissions);
```

---

## Code Integration Checklist

### Using Auth Store

```typescript
✅ import { useAuthStore } from '@/store/authStore';
✅ const { user, isAuthenticated } = useAuthStore();
✅ Automatic persistence (localStorage)
✅ Automatic token refresh on 401
```

### Using Protected Routes

```typescript
✅ import { ProtectedRoute } from '@/routes/AppRoutes';
✅ <ProtectedRoute requiredPermission="candidates:read">
✅ Automatic redirect to /login if not authenticated
✅ Automatic redirect to /unauthorized if missing permission
```

### Using API Client

```typescript
✅ import { apiClient } from '@/api/apiClient';
✅ Automatic token attachment
✅ Automatic 401 handling
✅ Token refresh queue prevents race conditions
```

### Using Permissions

```typescript
✅ import { useHasPermission, PERMISSIONS } from '@/utils/permissions';
✅ const canRead = useHasPermission('candidates:read');
✅ Type-safe permission constants
```

---

## API Endpoint Verification

### Test Login Endpoint

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

Expected Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "User Name",
    "companyId": "comp_123",
    "companyName": "Company Name",
    "role": "recruiter",
    "permissions": ["candidates:read", ...]
  }
}
```

### Test Refresh Endpoint

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {refreshToken}"
```

Expected Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

---

## Browser DevTools Debugging

### Check Auth State
```javascript
// Console
import { useAuthStore } from 'src/store/authStore';
const store = useAuthStore.getState();
console.log({
  user: store.user,
  isAuthenticated: store.isAuthenticated,
  accessToken: store.accessToken ? 'SET' : 'NONE',
  permissions: store.user?.permissions
});
```

### Check localStorage
```javascript
// Console
Object.keys(localStorage)
  .filter(k => k.startsWith('ats_'))
  .forEach(k => console.log(k, localStorage.getItem(k)));
```

### Check Network Requests
1. Open DevTools → Network tab
2. Filter for `api` requests
3. Click request → Headers
4. Verify: `Authorization: Bearer <token>`

### Check Token Expiration
```javascript
// Console
import { isTokenExpired, getTokenExpiresAt } from 'src/auth/tokenStorage';
const expiresAt = getTokenExpiresAt();
console.log('Expires at:', new Date(expiresAt!));
console.log('Is expired:', isTokenExpired());
console.log('Minutes remaining:', (expiresAt! - Date.now()) / 60000);
```

---

## Production Build

### Build

```bash
npm run build
```

Output: `dist/` directory

### Preview Build

```bash
npm run preview
```

Opens preview on `http://localhost:4173`

### Deployment

1. **Copy `dist/` contents** to CDN or web server
2. **Configure backend URL** via `VITE_API_URL` environment variable
3. **Ensure CORS** is configured on backend
4. **Use HTTPS** in production
5. **Configure httpOnly cookies** for tokens (future)

### Deploy Environment Variables

Set `VITE_API_URL` during build:

```bash
VITE_API_URL=https://api.example.com/api/v1 npm run build
```

---

## Type Checking & Linting

### Type Check
```bash
npm run type-check
```

Should return no errors before deployment.

### Lint
```bash
npm run lint
```

If configured with ESLint.

---

## Performance Checklist

- ✅ Code splitting via React Router lazy loading
- ✅ Zustand store subscription (no unnecessary renders)
- ✅ Tailwind CSS optimized for production
- ✅ Vite minification and terser enabled
- ✅ Source maps disabled in production
- ✅ Token refresh queue prevents duplicate requests
- ✅ localStorage caching for auth state

---

## Security Checklist

- ✅ JWT token attachment via interceptors
- ✅ Automatic logout on refresh failure
- ✅ Protected routes prevent unauthorized access
- ✅ Permission checking blocks UI access
- ✅ CORS validation at backend
- ✅ 60-second token expiration buffer
- ⚠️ TODO: Use httpOnly cookies instead of localStorage
- ⚠️ TODO: Implement CSRF tokens if needed

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **White screen on load** | Check browser console for errors, verify vite.config.ts |
| **CORS errors** | Verify backend allows frontend origin, check API_URL |
| **Infinite 401 loop** | Verify refresh endpoint works, check token storage |
| **Token not attaching** | Check request interceptor in apiClient.ts |
| **Lost auth on reload** | Verify localStorage persisting, check isAuthenticated logic |
| **Permissions not working** | Verify user.permissions from backend, check permission names |
| **State not updating** | Ensure using hooks, not getState() outside effects |

---

## Next: Feature Development

Once foundation is verified:

1. **Create Feature Page**
   ```bash
   touch src/pages/CandidatesPage.tsx
   ```

2. **Add Route**
   ```typescript
   <Route path="/candidates" element={
     <ProtectedRoute requiredPermission="candidates:read">
       <MainLayout><CandidatesPage /></MainLayout>
     </ProtectedRoute>
   } />
   ```

3. **Use Store & API**
   ```typescript
   const { user, hasPermission } = useAuthStore();
   const data = await apiClient.get('/candidates');
   ```

4. **Handle Errors**
   ```typescript
   import { getUserFriendlyMessage } from '@/utils/errors';
   ```

---

## Documentation Links

- 📖 [FRONTEND_FOUNDATION.md](FRONTEND_FOUNDATION.md) - Complete guide
- ⚡ [QUICK_START.md](QUICK_START.md) - Quick reference
- 🏗️ [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
- 📋 [Backend API_ENDPOINTS.md](../API_ENDPOINTS.md) - API reference

---

**Status**: ✅ Foundation Ready for Development  
**Last Updated**: December 2024  
**Next Step**: Connect to backend and start building features
