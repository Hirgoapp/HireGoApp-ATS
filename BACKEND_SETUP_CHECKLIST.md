# Complete Backend Setup Checklist

**Goal:** Get backend running with admin user in minimal steps

---

## ✅ Prerequisites (5 min)

- [ ] Node.js 18+ installed: `node --version`
- [ ] PostgreSQL running: `psql -U postgres -c "SELECT 1"`
- [ ] Redis running (optional for now)
- [ ] `.env` file created in root with:
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=password
  DB_NAME=ats_saas
  NODE_ENV=development
  JWT_SECRET=your-secret-key-min-32-chars
  ```

---

## ✅ Step 1: Install Dependencies (3 min)

```bash
cd g:\ATS
npm install
```

**What it does:**
- Installs NestJS, TypeORM, bcrypt, etc.
- Creates `node_modules/`

**Output:** 
```
added 500+ packages in 45s
```

---

## ✅ Step 2: Run Database Migrations (2 min)

```bash
npm run migration:run
```

**What it does:**
- Creates all database tables (companies, users, roles, etc.)
- Runs TypeORM migrations from `src/database/migrations/`

**Output:**
```
✓ 23 migrations executed (1234ms)
```

**If error:**
- Check PostgreSQL is running
- Check `.env` DB credentials
- Check database exists: `psql -U postgres -l`

---

## ✅ Step 3: Bootstrap Admin User (1 min)

```bash
npm run seed
```

**What it does:**
- Creates default company
- Creates admin permissions & role
- Creates admin user with bcrypt-hashed password

**Output:**
```
╔═══════════════════════════════════════════════╗
║      ATS SaaS - Database Seed Runner         ║
╚═══════════════════════════════════════════════╝

✅ Connected to database
✅ Using existing company: Default Company
✅ Found 10 permissions
✅ Using existing Admin role
✅ Admin user already exists: admin@example.com

🎉 Ready to login!
   URL:        http://localhost:5173/login
   Email:      admin@example.com
   Password:   Admin123!
```

**Credentials saved:**
- ✅ Email: `admin@example.com`
- ✅ Password: `Admin123!`
- ✅ Role: Admin
- ✅ Company: Default Company

---

## ✅ Step 4: Start Backend Server (1 min)

```bash
npm run dev
```

**What it does:**
- Starts NestJS dev server with auto-reload
- Listens on `http://localhost:3000`

**Output:**
```
[NestFactory] Starting Nest application...
✓ Nest application successfully started
✓ NestJS server listening on port 3000
```

**Keep this running!** (Ctrl+C to stop)

---

## ✅ Step 5: Verify Backend is Running (1 min)

**Option A: Open in browser**
```
http://localhost:3000/api
```
Should show API docs or welcome page

**Option B: Test login endpoint**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

Should return:
```json
{
  "token": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "firstName": "Admin",
    "role": "Admin",
    "company": {
      "id": "...",
      "name": "Default Company"
    }
  }
}
```

---

## ✅ Step 6: Start Frontend (in new terminal)

```bash
cd frontend
npm install
npm run dev
```

**Output:**
```
  ➜  Local:   http://localhost:5173/
```

---

## ✅ Step 7: Login to Frontend (1 min)

1. Open `http://localhost:5173/login`
2. Enter:
   - Email: `admin@example.com`
   - Password: `Admin123!`
3. Click "Login"
4. You should see Dashboard

**If successful:**
- ✅ User name in top-right
- ✅ Company name visible
- ✅ Sidebar with navigation
- ✅ Welcome message

---

## ✅ Step 8: Change Default Password (IMPORTANT!)

1. Go to Settings page (or user menu)
2. Find "Change Password"
3. Enter:
   - Current: `Admin123!`
   - New: Your secure password
4. Save

**Why:** Default passwords are security risk

---

## 🎯 SUCCESS CHECKLIST

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running
- [ ] `.env` configured
- [ ] Dependencies installed: `npm install`
- [ ] Migrations ran: `npm run migration:run`
- [ ] Bootstrap seed ran: `npm run seed`
- [ ] Backend started: `npm run dev`
- [ ] Backend accessible: `http://localhost:3000/api`
- [ ] Frontend installed: `cd frontend && npm install`
- [ ] Frontend started: `cd frontend && npm run dev`
- [ ] Frontend accessible: `http://localhost:5173`
- [ ] Login works: admin@example.com / Admin123!
- [ ] Dashboard visible
- [ ] Default password changed ⚠️

---

## 📋 Quick Command Reference

```bash
# Backend setup
npm install                    # Install dependencies
npm run migration:run          # Create database schema
npm run seed                   # Create admin user

# Backend development
npm run dev                    # Start dev server (watch mode)
npm run build                  # Build for production
npm start                      # Start production server

# Database
npm run migration:generate     # Generate migration from entities
npm run migration:revert       # Undo last migration

# Testing
npm test                       # Run unit tests
npm run test:e2e              # Run E2E tests
npm run test:cov              # Coverage report

# Code quality
npm run lint                   # Check code style
npm run lint:fix              # Fix code style
npm run format                # Format code with prettier
```

---

## 🚨 Common Issues

### "Cannot find module '@nestjs/common'"
**Solution:** `npm install` (missing dependencies)

### "connect ECONNREFUSED 127.0.0.1:5432"
**Solution:** PostgreSQL not running
```bash
# Windows
pg_ctl -D "C:\Program Files\PostgreSQL\data" start

# Or use Docker
docker run -d -e POSTGRES_PASSWORD=password postgres:15
```

### "relation \"users\" does not exist"
**Solution:** Run migrations: `npm run migration:run`

### "Admin user already exists"
**Solution:** That's normal! Script is idempotent. User was created.

### Frontend can't connect to backend
**Solution:** 
- Check backend running on port 3000
- Check `.env` in frontend has correct API URL
- Check CORS is enabled

### "Password mismatch" on login
**Solution:**
- Verify you used default: `Admin123!`
- Not `admin123` (case-sensitive)
- Check for extra spaces

---

## 📊 Architecture After Setup

```
Frontend (Vite)
├─ Zustand (state)
├─ Axios (HTTP client)
└─ React Router (navigation)
     ↓ (API calls to port 3000)
Backend (NestJS)
├─ Auth Module (JWT, login)
├─ Companies Module
├─ Users Module
├─ Candidates Module
├─ Jobs Module
└─ ... (other modules)
     ↓ (SQL queries)
PostgreSQL
├─ companies table
├─ users table
├─ roles table
├─ permissions table
└─ ... (other tables)
```

---

## 📞 Troubleshooting Help

**Still stuck?** Check these docs:

1. [BOOTSTRAP_SEED_GUIDE.md](BOOTSTRAP_SEED_GUIDE.md) - Detailed seed documentation
2. [SEED_QUICK_REFERENCE.md](SEED_QUICK_REFERENCE.md) - Quick command reference
3. [README.md](README.md) - Project overview
4. [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
5. [API_ENDPOINTS.md](API_ENDPOINTS.md) - API reference

---

## ⏱️ Total Time: ~15-20 minutes

| Step | Time | Command |
|------|------|---------|
| 1. Install | 3 min | `npm install` |
| 2. Migrations | 2 min | `npm run migration:run` |
| 3. Bootstrap | 1 min | `npm run seed` |
| 4. Backend | 1 min | `npm run dev` |
| 5. Verify | 1 min | Curl test |
| 6. Frontend | 3 min | `cd frontend && npm install && npm run dev` |
| 7. Login | 1 min | Open and test |
| 8. Password | 2 min | Change default password |

---

## 🎉 Ready to Build!

Once you complete this checklist:

✅ **Backend is running** on port 3000  
✅ **Frontend is running** on port 5173  
✅ **Admin user can login**  
✅ **Database is populated**  
✅ **Ready for feature development**

---

**Next:** Start building features (Candidates, Jobs, etc.)

See [ARCHITECTURE.md](ARCHITECTURE.md) for system design  
See [API_ENDPOINTS.md](API_ENDPOINTS.md) for available endpoints

---

*Last updated: December 31, 2025*
