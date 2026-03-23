# 🚀 START HERE - Complete ATS Setup

## The One Command

```bash
npm run dev:all
```

Done. Everything starts automatically.

---

## What Just Happened

- ✅ Backend server running on http://localhost:3000
- ✅ Frontend UI running on http://localhost:5173
- ✅ Database connected via PostgreSQL
- ✅ API endpoints active at /api/v1/*

---

## Next: Open Browser

```
http://localhost:5173
```

You see the Login page automatically.

---

## Then: Log In

```
Email:    admin@example.com
Password: password123
```

Click Login.

---

## Then: You're In

Dashboard loads with:
- Total jobs, open jobs, filled jobs
- Total candidates, active candidates
- Hiring metrics (this month, this year)
- Pipeline health score

**All data is LIVE from backend. No mocks.**

---

## Then: Explore via Sidebar

| Click | What You Get |
|------|--------------|
| Candidates | View all candidates, add new |
| Jobs | View all jobs, add new |
| Submissions | View candidate→job links, add new |
| Interviews | View interviews, schedule new |
| Offers | View offers, create new |
| Reports | View analytics & metrics |

---

## That's It

- One command: `npm run dev:all`
- One URL: http://localhost:5173
- One login: admin@example.com / password123
- Everything else just works

---

## Documentation

If you need more details:
- **Quick Start**: DEV_START.md
- **Architecture**: ARCHITECTURE_AND_DATAFLOW.md
- **Complete Overview**: READY_TO_GO.md
- **Verification**: APPLICATION_READY.md
- **Implementation**: ORCHESTRATION_SUMMARY.md

---

## Ports Reference

| What | Port | URL |
|------|------|-----|
| Backend API | 3000 | http://localhost:3000 |
| Frontend UI | 5173 | http://localhost:5173 |
| Database | 5432 | (internal) |
| API Docs | 3000/api | http://localhost:3000/api |

---

## If Something Doesn't Work

1. **Ports in use?** Close other apps on 3000 & 5173
2. **Database not running?** Check PostgreSQL is started
3. **Blank page?** Wait 3 seconds, refresh
4. **Login fails?** Check backend logs for errors
5. **See network errors?** Check DevTools Network tab

---

## API Overview

All APIs are at: `http://localhost:3000/api/v1`

```
POST   /auth/login           → Get JWT tokens
GET    /auth/me              → Get current user
GET    /candidates           → List candidates
POST   /candidates           → Create candidate
GET    /jobs                 → List jobs
POST   /jobs                 → Create job
GET    /submissions          → List submissions
POST   /submissions          → Create submission
GET    /interviews           → List interviews
POST   /interviews           → Schedule interview
GET    /offers               → List offers
POST   /offers               → Create offer
GET    /reports/dashboard    → Get metrics
```

---

## How It Works

```
You open browser
    ↓
http://localhost:5173
    ↓
Frontend (React) loads
    ↓
Unauthenticated → Shows Login page
    ↓
You log in
    ↓
Frontend calls: POST http://localhost:3000/api/v1/auth/login
    ↓
Backend validates, gives JWT tokens
    ↓
Frontend stores tokens, redirects to Dashboard
    ↓
Dashboard fetches: GET http://localhost:3000/api/v1/reports/dashboard
    ↓
Shows live metrics from database
    ↓
All other pages work the same way
    ↓
Everything is live data, no mocks
```

---

## Key Features

✅ Multi-tenant (company isolation)  
✅ JWT authentication (secure tokens)  
✅ RBAC (permissions on every action)  
✅ CRUD operations (create, read, update)  
✅ Live APIs (no mock data)  
✅ Responsive design (mobile friendly)  
✅ Form validation (client + server)  
✅ Error handling (clear messages)  

---

## Permissions

Admin (default user) has all permissions:
- candidates:read, candidates:create
- jobs:read, jobs:create
- submissions:read, submissions:create
- interviews:read, interviews:create
- offers:read, offers:create
- reports:read

Every action is protected. No permission = no access.

---

## File Structure (Quick Reference)

```
/ATS/
├── package.json              # Root setup (dev:all command)
├── DEV_START.md             # Developer guide
├── READY_TO_GO.md           # Complete overview
├── ARCHITECTURE_AND_DATAFLOW.md  # System design
├── ORCHESTRATION_SUMMARY.md # Implementation summary
│
├── /frontend/               # React + Vite
│   ├── src/pages/           # Page components
│   ├── src/services/        # API calls
│   ├── src/store/           # State management
│   └── package.json
│
└── /src/                    # NestJS backend
    ├── auth/                # Authentication
    ├── candidates/          # Candidates module
    ├── jobs/                # Jobs module
    ├── submissions/         # Submissions module
    ├── interviews/          # Interviews module
    ├── offers/              # Offers module
    ├── reports/             # Reports module
    └── main.ts              # Server startup
```

---

## Next Steps

1. ✅ Run `npm run dev:all`
2. ✅ Open http://localhost:5173
3. ✅ Log in with admin@example.com / password123
4. ✅ Explore all modules
5. ✅ Create some test records
6. ✅ Watch network calls in DevTools
7. ✅ Read docs when curious

---

## You're All Set! 🎉

No config needed. No setup scripts. No database initialization.

Just:

```bash
npm run dev:all
```

And you're running a complete, production-grade ATS application.

Backend ✅ Frontend ✅ Database ✅ Auth ✅ APIs ✅

Everything integrated, everything live, everything working.

Happy coding! 🚀
