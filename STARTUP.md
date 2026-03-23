# 🚀 ATS SaaS - Quick Start Guide

## One-Command Startup

### Option 1: PowerShell Script (Recommended)
**Starts PostgreSQL + Backend + Frontend:**
```powershell
npm run start:complete
```
or directly:
```powershell
.\start-all.ps1
```

### Option 2: Backend + Frontend Only
**If PostgreSQL is already running:**
```bash
npm run dev:all
```

---

## What Gets Started

| Service | URL | Port |
|---------|-----|------|
| **Backend API** | http://localhost:3000 | 3000 |
| **Frontend** | http://localhost:5173 | 5173 |
| **PostgreSQL** | localhost | 5432 |

---

## Individual Service Commands

### PostgreSQL Database
```powershell
# Check status
Get-Service postgresql-x64-16

# Start manually
Start-Service postgresql-x64-16

# Stop
Stop-Service postgresql-x64-16
```

### Backend Only
```bash
npm run dev          # Development with hot-reload
npm start            # Production mode
```

### Frontend Only
```bash
cd frontend
npm run dev          # Development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## Login Credentials

**Admin Account:**
- **URL:** http://localhost:5173/login
- **Email:** `admin@example.com`
- **Password:** `Admin123!`

---

## Troubleshooting

### Port Already in Use
```powershell
# Find what's using port 3000 (backend)
netstat -ano | findstr :3000

# Find what's using port 5173 (frontend)
netstat -ano | findstr :5173

# Kill process by PID
taskkill /PID <PID> /F
```

### Database Connection Failed
```powershell
# Test connection
psql -h 127.0.0.1 -U postgres -d ats_saas

# If password fails, check .env file
# DB_PASSWORD should match PostgreSQL password
```

### Reset Everything
```powershell
# Stop all services
# Press Ctrl+C in the terminal running start-all.ps1

# Or manually:
Stop-Service postgresql-x64-16
# Then kill any node processes in Task Manager
```

---

## Development Workflow

1. **Start everything:**
   ```powershell
   npm run start:complete
   ```

2. **Make changes** - Both backend and frontend auto-reload

3. **Test in browser:**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:3000/api (if Swagger is configured)

4. **Stop everything:**
   - Press `Ctrl+C` in the terminal

---

## Notes

- The `start-all.ps1` script automatically checks and starts PostgreSQL
- Backend runs on port 3000 with hot-reload
- Frontend runs on port 5173 with Vite dev server
- All services log to the same terminal (colorized)
- Database remains running after you stop the script
