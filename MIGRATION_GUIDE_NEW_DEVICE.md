# 🚀 Complete Migration Guide: Moving ATS Project to New Device

**Target Device Status:** Fresh, only has Visual Studio Code, Internet, and Chrome

---

## 📋 Overview
This guide has **5 main phases**:
1. ✅ Install required software
2. ✅ Get the project code
3. ✅ Set up PostgreSQL database
4. ✅ Configure and run the project
5. ✅ Verify everything works

**Time Estimate:** 45-60 minutes (depending on internet speed)

---

## 🔧 PHASE 1: Install Required Software (15 minutes)

### Step 1.1: Install Node.js
1. Open Chrome
2. Go to: https://nodejs.org
3. Click **"LTS"** (left side) - currently v20 or v22
4. Click **Download**
5. Run the installer
6. Click **Next** → **Next** → **Next** → **Install**
7. **Close** the installer

**Verify Installation:**
- Open **PowerShell** (Right-click → Run as Administrator)
- Type: `node --version`
- Type: `npm --version`
- You should see version numbers (e.g., v20.11.0)

---

### Step 1.2: Install PostgreSQL
1. Open Chrome
2. Go to: https://www.postgresql.org/download/windows/
3. Click **Interactive installer by EDB**
4. Download the **latest version** (v16 or v17)
5. Run the installer
6. Click **Next** → Accept license → **Next**
7. **Installation Directory:** Leave as default (`C:\Program Files\PostgreSQL\16`)
8. **Select Components:** Keep all checked (PostgreSQL Server, pgAdmin, Command Line Tools)
9. **Password:** Enter: `password` (same as current setup)
10. **Port:** Keep as `5432`
11. **Continue** through remaining steps → **Finish**

**Verify Installation:**
- Open new **PowerShell** window
- Type: `psql --version`
- You should see version number

---

### Step 1.3: Install Git (Optional but highly recommended)
1. Open Chrome
2. Go to: https://git-scm.com/download/win
3. Download the latest version
4. Run installer: **Next** → **Next** → Accept defaults → **Install** → **Finish**

**Verify Installation:**
- Open new **PowerShell** window
- Type: `git --version`

---

## 📦 PHASE 2: Get the Project Code (10 minutes)

### Option A: Via Git (Recommended if you have Git repository access)

**Step 2A.1:** Get the repository URL from your current device
- On your **current device**, open the project folder in PowerShell
- Run: `git remote -v`
- Copy the URL shown (e.g., `https://github.com/yourname/ats-saas.git`)

**Step 2A.2:** Clone on new device
- On **new device**, Open PowerShell
- Create a folder: `cd C:\Projects` (or any location)
- Run: `git clone [PASTE_THE_URL_YOU_COPIED]`
- Wait for it to complete
- Run: `cd ats` (or your project folder name)

---

### Option B: Via ZIP File (If no Git repository)

**Step 2B.1:** On your **current device**
- Go to `g:\ATS` folder
- Right-click → **Send to** → **Compressed (zipped) folder**
- Name it: `ats-project.zip`

**Step 2B.2:** Transfer the ZIP file
- Copy `ats-project.zip` to USB drive/Cloud (Google Drive, OneDrive, etc.)
- Transfer to new device

**Step 2B.3:** On **new device**
- Extract the ZIP file to `C:\Projects\ats`
- Open PowerShell
- Run: `cd C:\Projects\ats`

---

## 💾 PHASE 3: Set Up PostgreSQL Database (10 minutes)

### Step 3.1: Create the database
1. Open **PowerShell** (as Administrator)
2. Run this command:
```powershell
$env:PGPASSWORD='password'
psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE ats_saas;"
```

3. You should see: `CREATE DATABASE`

**Verify:**
```powershell
$env:PGPASSWORD='password'
psql -h 127.0.0.1 -U postgres -d ats_saas -c "\dt"
```
Should show: `(0 rows)` - empty tables, which is correct

---

## ⚙️ PHASE 4: Configure and Install Project (15 minutes)

### Step 4.1: Install Project Dependencies
1. In PowerShell, navigate to your project:
```powershell
cd C:\Projects\ats
```

2. Install all npm packages:
```powershell
npm install
```

This will take 5-10 minutes. **Do not interrupt.**

**Wait for completion** - you should see:
```
added XXX packages in XXm
```

---

### Step 4.2: Verify .env file exists
1. In PowerShell, check if `.env` file exists:
```powershell
Test-Path .\.env
```

Should return: `True`

2. If `False`, copy .env from your current device to new device:
   - Get the `.env` file from `g:\ATS\.env`
   - Copy to new device in the project root

---

### Step 4.3: Run Database Migrations
Migrations create all the necessary tables:

```powershell
npm run migration:run
```

**Expected Output:**
```
Query runner initialized
✓ Running migration: 1704067200000-CreateCompaniesTable
✓ Running migration: 1704067201000-CreateUsersTable
... (many more migrations)
✓ All migrations completed
```

**⚠️ If you see errors:**
- Make sure PostgreSQL is running
- Make sure database `ats_saas` was created in Phase 3
- Make sure `.env` file exists with correct credentials

---

### Step 4.4: Seed Initial Data
This creates a super admin user and demo data:

```powershell
npm run seed:bootstrap
```

**Expected Output:**
```
🌱 Bootstrapping admin user...
✓ Admin user created
```

Optional - Add demo data (jobs, candidates, etc.):
```powershell
npm run seed:demo
```

---

## 🏗️ PHASE 5: Build and Start the Project (5 minutes)

### Step 5.1: Build the project
```powershell
npm run build
```

**Expected Output:**
```
✓ Successfully compiled
```

**Wait for completion** - should finish in 1-2 minutes.

---

### Step 5.2: Start the server
**Option 1 - Development mode** (with live reload):
```powershell
npm run dev
```

**Option 2 - Production mode** (faster):
```powershell
npm start
```

**Expected Output:**
```
[Nest] 12345  - 2026-03-18 10:30:45     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 2026-03-18 10:30:46     LOG [InstanceLoader] ...
[Nest] 12345  - 2026-03-18 10:30:47     LOG [RoutesResolver] AppController {/api}:
[Nest] 12345  - 2026-03-18 10:30:47     LOG [NestApplication] Nest application successfully started
```

**The server is running!** 🎉

---

## ✅ PHASE 6: Verification & Testing (10 minutes)

### Step 6.1: Test the API
1. Open Chrome
2. Go to: `http://localhost:3000/api/health`
3. You should see: `{"status":"ok"}` or similar

---

### Step 6.2: Test Database Connection
1. Open **new PowerShell window** (don't close the server window)
2. Run:
```powershell
$env:PGPASSWORD='password'
psql -h 127.0.0.1 -U postgres -d ats_saas -c "SELECT COUNT(*) FROM companies;"
```

Should show a number (at least 1 if you ran seeds)

---

### Step 6.3: Test Super Admin Login
1. Open Chrome
2. Go to: `http://localhost:3000/api/super-admin/auth/login`
3. You'll see a 405 error - this is expected (GET not allowed)
4. That means the API is responding correctly!

Or use PowerShell to test login:
```powershell
$body = @{
    email = 'admin@ats.com'
    password = 'ChangeMe@123'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/super-admin/auth/login' `
  -Method POST `
  -ContentType 'application/json' `
  -Body $body
```

Should return a token (if seed ran successfully).

---

## 🔄 Going Forward: Daily Start Guide

### Every time you want to use the project:

**Step 1: Start PostgreSQL** (usually auto-starts on Windows)
- Open PowerShell
- Verify: `psql -h 127.0.0.1 -U postgres -d ats_saas -c "SELECT 1"`

**Step 2: Start the application**
- Open PowerShell
- Navigate to project: `cd C:\Projects\ats`
- Run: `npm run dev` (development) OR `npm start` (production)
- Wait for "Nest application successfully started"

**Step 3: Access the application**
- Backend API: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

**To stop:**
- Press `Ctrl + C` in the PowerShell window running the server

---

## 🛠️ Troubleshooting

### Problem: "PostgreSQL connection failed"
**Solution:**
```powershell
# Check if PostgreSQL is running
Get-Service postgresql-x64-16 | Start-Service

# Or open pgAdmin and start manually
```

### Problem: "npm ERR! missing script"
**Solution:**
- Make sure you ran `npm install` successfully
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

### Problem: "Port 3000 already in use"
**Solution:**
```powershell
# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000

# Kill the process
Stop-Process -Id [PID] -Force
```

### Problem: "Cannot find module 'ts-node'"
**Solution:**
```powershell
npm install -D ts-node typescript
npm run build
```

### Problem: "Migration runner not found"
**Solution:**
```powershell
npm install typeorm
npm run migration:run
```

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run migrations | `npm run migration:run` |
| Seed bootstrap admin | `npm run seed:bootstrap` |
| Seed demo data | `npm run seed:demo` |
| Start development | `npm run dev` |
| Start production | `npm start` |
| Build | `npm run build` |
| Check API health | `curl http://localhost:3000/api/health` |

---

## 📝 Important Notes

1. **Database Password:** Currently set to `password` (see in `.env`)
   - Change in production using environment variables

2. **Frontend:** This guide covers backend only
   - Frontend is separate (React app in `frontend/` folder if it exists)
   - Typically runs on `http://localhost:5173` or `5180`

3. **Environment Variables:** All configuration is in `.env`
   - Don't share this file publicly
   - Never commit it to Git

4. **Backups:** Your PostgreSQL data is stored at:
   - `C:\ProgramData\PostgreSQL\16\data`
   - Keep this folder backed up!

5. **Performance:**
   - Development mode (`npm run dev`) is slower
   - Production mode (`npm start`) is faster
   - Use production for actual testing

---

## ✨ You're Done!

Your ATS project is now running on the new device. 

**Next Steps:**
- If there's a frontend, follow similar steps for the `frontend/` folder
- Test all APIs and functionality
- Set up monitoring/logging tools if needed
- Configure email integrations (SparkPost, AWS SES, etc.)

**Questions?** Check the documentation files in the project:
- `README.md` - Project overview
- `ARCHITECTURE.md` - System design
- `BACKEND_QUICK_START.md` - Backend specifics
- API documentation files

---

Good luck! 🚀
