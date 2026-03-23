# 🚀 ATS Application - Developer Quick Start

## One Command to Rule Them All

### Start the Full Application (Backend + Frontend)

```bash
npm run dev:all
```

This starts:
- **Backend API** → http://localhost:3000 (NestJS)
- **Frontend UI** → http://localhost:5173 (React + Vite)

---

## 📖 Step-by-Step Flow

### 1️⃣ **Start Application**
```bash
npm run dev:all
```

Wait for both servers to start:
```
concurrent processes started (2 total)
...
[0] [Nest] 1/6/2026, 10:00:00 AM   LOG [NestFactory] Nest application successfully started
[1] ...your frontend build info...
```

### 2️⃣ **Open Browser**
Navigate to: **http://localhost:5173**

You will see the **Login Page** (automatic redirect for unauthenticated users)

### 3️⃣ **Log In with Admin Credentials**

| Field | Value |
|-------|-------|
| **Email** | `admin@example.com` |
| **Password** | `password123` |

Click **Login** → You're authenticated!

### 4️⃣ **Explore the Dashboard**

After login, you land on the **Dashboard** showing:
- Total Jobs, Open Jobs, Filled Jobs
- Total Candidates, Active Candidates
- Hiring metrics (This Month, This Year)
- Pipeline health score and avg time to hire

### 5️⃣ **Navigate via Sidebar**

Use the **left sidebar** to navigate to:

| Module | What It Does | Data Source |
|--------|--------------|-------------|
| **Dashboard** | Overview metrics | `/api/v1/reports/dashboard` |
| **Candidates** | View/Create candidates | `/api/v1/candidates` |
| **Jobs** | View/Create jobs | `/api/v1/jobs` |
| **Submissions** | View/Create submissions (candidate → job links) | `/api/v1/submissions` |
| **Interviews** | View/Schedule interviews | `/api/v1/interviews` |
| **Offers** | View/Create offers | `/api/v1/offers` |
| **Reports** | Analytics & metrics dashboard | `/api/v1/reports/dashboard` |

---

## 🔐 Permission-Based Access

All modules are **protected by permission checks**:
- Admin user has all permissions
- Create actions require `{module}:create` permission
- List pages require `{module}:read` permission
- Unauthorized access redirects to `/unauthorized`

---

## 🛑 Stopping the Application

Press `Ctrl+C` in the terminal to stop both backend and frontend cleanly.

---

## 🐛 Troubleshooting

### **Port 3000 already in use?**
- Backend won't start if another app is using port 3000
- Kill the process or use: `netstat -ano | findstr :3000` (Windows) to find it

### **Port 5173 already in use?**
- Frontend will try a different port automatically
- Check terminal output for the actual port

### **Frontend shows blank page?**
- Wait 2-3 seconds for the frontend build to complete
- Check browser console (F12) for errors
- Verify backend is running: `curl http://localhost:3000/health` (or check terminal)

### **Login fails?**
- Ensure backend is running (you should see NestJS startup logs)
- Check database connection in backend logs
- Verify admin user seed ran: `npm run seed:bootstrap` (in /backend if needed)

### **Data not loading on pages?**
- Open browser DevTools (F12) → Network tab
- Check if API requests are successful
- Verify you're logged in (dashboard should show user name in top-right)

---

## 📚 Project Structure

```
/ATS
├── package.json              ← Root orchestration (dev:all script here)
├── backend/                  ← NestJS API (port 3000)
│   ├── src/
│   └── package.json
├── frontend/                 ← React + Vite UI (port 5173)
│   ├── src/
│   └── package.json
└── DEV_START.md             ← This file
```

---

## 🎯 Key Points

✅ **One command:** `npm run dev:all`  
✅ **One URL:** http://localhost:5173  
✅ **Frontend only:** No backend UI served  
✅ **Live APIs:** All data comes from backend (no mocks)  
✅ **Permissions enforced:** RBAC on every page  
✅ **Auto-redirects:** Unauthenticated → /login  

---

## 🔗 Useful Commands (Individual)

```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Build for production
cd backend && npm run build
cd frontend && npm run build

# Run tests
cd backend && npm run test
cd frontend && npm run test
```

---

## 📝 Notes

- Backend API docs available at: http://localhost:3000/api/docs
- Frontend compiled to `/frontend/dist` on build
- All credentials are demo data; change in production
- Environment variables configured via `.env` files in respective directories

---

**Happy coding! 🎉**
