# SUPER ADMIN PORTAL - QUICK REFERENCE CARD

**Created**: January 9, 2026 | **Status**: ✅ Production Ready | **Version**: 1.0.0

---

## ⚡ 5-MINUTE QUICK START

### Start Services (3 terminal windows)

**Terminal 1: Database**
```bash
# PostgreSQL should be running
# Database: ats_saas
# User: postgres
```

**Terminal 2: Backend**
```bash
cd backend
npm install
npm run start:dev
# Listens on: http://localhost:3000
```

**Terminal 3: Frontend**
```bash
cd frontend/super-admin
npm install
npm run dev
# Opens at: http://localhost:5174
```

### Login
```
Email: admin@ats.com
Password: ChangeMe@123
```

✅ You're in! Dashboard shows real data from backend.

---

## 🗺️ NAVIGATION

### Pages Available
```
Dashboard (/)
  └─ Real-time metrics + recent activity
  
Companies (/companies)
  └─ CRUD operations + search + pagination
  
Users (/users)
  └─ Super admin user management
  
Settings (/settings)
  └─ System configuration
```

---

## 📡 API ENDPOINTS QUICK REF

**Base URL**: `http://localhost:3000/api`

### Authentication
```
POST /super-admin/auth/login
POST /super-admin/auth/refresh
POST /super-admin/auth/logout
POST /super-admin/auth/change-password
```

### Companies
```
POST /super-admin/companies
GET /super-admin/companies?page=1&limit=20
GET /super-admin/companies/:id
PATCH /super-admin/companies/:id
DELETE /super-admin/companies/:id
```

### Users
```
POST /super-admin/super-admin-users
GET /super-admin/super-admin-users?page=1&limit=20
GET /super-admin/super-admin-users/:id
DELETE /super-admin/super-admin-users/:id
```

### Modules
```
GET /super-admin/modules/:companyId
POST /super-admin/modules/:companyId/enable
POST /super-admin/modules/:companyId/disable
```

### Licenses
```
POST /super-admin/licenses
GET /super-admin/licenses/:id
```

---

## 🗄️ DATABASE QUICK REF

**Database Name**: `ats_saas`  
**Host**: `localhost`  
**Port**: `5432`  
**User**: `postgres`

**Key Tables**:
- `super_admin_users` - Super admin accounts
- `companies` - SaaS clients
- `company_modules` - Feature toggles
- `licenses` - License info
- `audit_logs` - Activity log

**Connect with**:
```bash
psql -U postgres -d ats_saas
```

---

## 🛠️ COMMON COMMANDS

### Backend
```bash
# Start development
npm run start:dev

# Build production
npm run build

# Run migrations
npm run typeorm migration:run

# Seed database
npm run seed

# Run tests
npm test

# Run linter
npm run lint
```

### Frontend
```bash
# Start development
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Format code
npm run format
```

---

## 🔐 AUTHENTICATION FLOW

```
1. User submits login form
   ↓
2. Backend validates and returns JWT tokens
   ├─ access_token (15 min expiry)
   └─ refresh_token (7 day expiry)
   ↓
3. Frontend stores in Zustand store
   ↓
4. All API requests include: Authorization: Bearer {token}
   ↓
5. On 401 response:
   ├─ Refresh token (POST /auth/refresh)
   ├─ Get new access_token
   ├─ Retry original request
   └─ If refresh fails → Auto logout
```

---

## ❌ ERROR CODES

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | ✅ Works |
| 400 | Bad Request | Fix validation errors |
| 401 | Unauthorized | Login again or refresh token |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check URL/ID |
| 409 | Conflict | Unique constraint violated (e.g., email) |
| 500 | Server Error | Check backend logs |

---

## 🧐 DEBUGGING TIPS

### Frontend Issues
```javascript
// Check auth state
console.log(localStorage.getItem('accessToken'))

// Check API base URL
console.log(import.meta.env.VITE_API_BASE_URL)

// Monitor network requests
// DevTools → Network tab → Filter by super-admin

// Check Redux/Zustand store
// React DevTools → Zustand store
```

### Backend Issues
```bash
# Check logs
npm run start:dev  # Watch output

# Test endpoint with curl
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/super-admin/companies

# Check database
psql -U postgres -d ats_saas
SELECT * FROM super_admin_users;
SELECT * FROM companies LIMIT 5;
```

---

## 📊 WHAT EACH PAGE DOES

### Dashboard
- **Purpose**: Overview of system
- **Shows**: Companies count, user count, API requests, recent activity
- **Data Source**: Real backend API calls
- **Updates**: On page load + every 30 seconds

### Companies
- **Purpose**: Manage SaaS client companies
- **Features**:
  - List with pagination (20 per page)
  - Create with form validation
  - Edit company details
  - Delete with confirmation
  - Search by name/slug
- **API**: `/super-admin/companies` endpoints

### Users
- **Purpose**: Manage super admin accounts
- **Features**:
  - List super admins with status
  - Create new super admin user
  - Delete user with confirmation
  - Show last login timestamp
- **API**: `/super-admin/super-admin-users` endpoints

### Settings
- **Purpose**: Configure platform
- **Settings**:
  - Toggle maintenance mode
  - Set max users per company
  - Configure session timeout
  - Set API rate limit
  - Toggle email notifications
- **Storage**: localStorage + optional backend

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Update .env with production secrets
- [ ] Change all passwords
- [ ] Setup SSL/TLS certificates
- [ ] Configure CORS for production domains
- [ ] Setup database backups
- [ ] Configure monitoring (Sentry)
- [ ] Test all functionality

### Deployment
- [ ] Run database migrations
- [ ] Build frontend (npm run build)
- [ ] Deploy backend service
- [ ] Deploy frontend to CDN/static host
- [ ] Verify all endpoints working
- [ ] Test login and CRUD operations

### Post-Deployment
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Verify backups running
- [ ] Test disaster recovery
- [ ] Train support team
- [ ] Document any changes

---

## 📚 DOCUMENTATION GUIDE

### For Quick Answers
→ **This file** (QUICK_REFERENCE_CARD.md)

### For Step-by-Step
→ **IMPLEMENTATION_COMPLETION_SUMMARY.md**

### For Complete Details
→ **SUPER_ADMIN_FINAL_DELIVERY.md**

### For API Reference
→ **API_ENDPOINTS.md**

### For Database Reference
→ **DATABASE_SCHEMA.md**

### For Implementation Details
→ **SUPER_ADMIN_COMPLETE_DOCUMENTATION.md**

---

## 🎯 QUICK TROUBLESHOOTING

### **"Can't login"**
1. Backend running? `npm run start:dev` in backend folder
2. Database connected? Check backend logs
3. Wrong credentials? Try `admin@ats.com` / `ChangeMe@123`

### **"API 404 Not Found"**
1. Check VITE_API_BASE_URL = `http://localhost:3000/api`
2. Backend running on port 3000?
3. Endpoint exists? Check API_ENDPOINTS.md

### **"Token expired / 401"**
1. Auto-refresh should work automatically
2. If keeps failing, try logging out and back in
3. Check SUPER_ADMIN_JWT_REFRESH_SECRET in .env

### **"Database errors"**
1. PostgreSQL running? Check port 5432
2. Database ats_saas exists?
3. Migrations run? `npm run typeorm migration:run`
4. Check backend logs for details

### **"Form validation fails"**
1. Required fields must be filled
2. Email must be valid format
3. Password must be 8+ chars with uppercase
4. Company slug must be unique

---

## 🔄 TYPICAL WORKFLOW

### Creating a New Company
```
1. Login with admin@ats.com
2. Navigate to Companies page
3. Click "Create Company" button
4. Fill form:
   - Name: "Acme Corp"
   - Slug: "acme" (auto-generated)
   - License Type: "enterprise"
5. Click Create
6. See success message
7. Company appears in list
```

### Creating a New Super Admin User
```
1. Navigate to Users page
2. Click "Create Super Admin" button
3. Fill form:
   - Email: "newadmin@ats.com"
   - First Name: "John"
   - Last Name: "Doe"
   - Password: "SecurePass@123"
4. Click Create
5. User added to list
```

### Configuring Settings
```
1. Navigate to Settings page
2. Toggle switches or change values
3. Click "Save Changes"
4. See success message
5. Settings saved
```

---

## ⏱️ TIMEOUTS & LIMITS

| Setting | Value | Notes |
|---------|-------|-------|
| Access Token | 15 min | Auto-refresh on 401 |
| Refresh Token | 7 days | Extend session |
| Session Timeout | 3600 sec | Configurable |
| Rate Limit | 1000 req/hr | Configurable |
| Pagination | 20 items | Per page |
| Request Timeout | 30 sec | API calls |

---

## 📱 RESPONSIVE DESIGN

✅ Works on:
- Desktop (1920x1080+)
- Laptop (1366x768)
- Tablet (1024x768)
- Mobile (375x667) - Basic layout

🎨 Styling: Tailwind CSS dark theme

---

## 🔒 SECURITY HIGHLIGHTS

✅ **Password Security**
- bcrypt hashing (10 salt rounds)
- Cannot see plaintext passwords
- Change password feature available

✅ **API Security**
- JWT authentication required
- CORS configured for allowed origins
- Input validation on all fields
- SQL injection protected (TypeORM)

✅ **Audit Trail**
- All operations logged
- User ID, action, timestamp recorded
- Audit logs viewable on dashboard

✅ **Session Security**
- Auto-logout on token expiry
- Refresh token mechanism
- Secure token storage

---

## 💡 TIPS & TRICKS

### Performance
- Pagination loads 20 items at a time (faster)
- Search is debounced (500ms delay)
- API caching on GET requests (optional)

### Usability
- Form errors show immediately
- Success messages auto-hide after 3s
- Confirmation dialogs prevent accidental deletes
- Loading spinners show during API calls

### Data
- Dashboard updates every 30 seconds
- Audit logs show latest activities first
- Pagination works with search
- Delete is soft-delete (data preserved)

### Development
- TypeScript provides type safety
- Zod validates data at runtime
- Error boundaries prevent crashes
- Console logs in dev mode only

---

## 📞 GETTING HELP

**Problem**? Check:
1. This quick reference
2. Troubleshooting section in SUPER_ADMIN_FINAL_DELIVERY.md
3. API_ENDPOINTS.md for endpoint details
4. DATABASE_SCHEMA.md for database info
5. Backend/Frontend logs

**Still stuck?** Check backend logs:
```bash
# Backend is logging all requests with emoji status:
# ✅ 200 Success
# ⚠️ 400 Bad Request
# 🔒 401 Unauthorized
# 🚫 404 Not Found
# ❌ 500 Server Error
```

---

## ✨ YOU'RE ALL SET!

Everything is ready to use:
- ✅ Backend API (17 endpoints)
- ✅ Frontend UI (5 pages)
- ✅ Database (configured)
- ✅ Authentication (working)
- ✅ Documentation (comprehensive)

**Start with**: `npm run start:dev` in both backend and frontend folders, then login!

---

**Version**: 1.0.0  
**Last Updated**: January 9, 2026  
**Status**: Production Ready ✅

