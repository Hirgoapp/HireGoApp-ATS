# ✅ ATS Migration Checklist - New Device Setup

Use this checklist to track your progress. Check off each item as you complete it.

---

## 🔧 PHASE 1: Install Required Software

- [ ] **Step 1.1: Install Node.js**
  - [ ] Downloaded from nodejs.org
  - [ ] Installer completed
  - [ ] Verified: `node --version` shows version number
  - [ ] Verified: `npm --version` shows version number

- [ ] **Step 1.2: Install PostgreSQL**
  - [ ] Downloaded from postgresql.org
  - [ ] Installer completed
  - [ ] Set password to: `password`
  - [ ] Set port to: `5432`
  - [ ] Verified: `psql --version` shows version number

- [ ] **Step 1.3: Install Git**
  - [ ] Downloaded from git-scm.com
  - [ ] Installer completed
  - [ ] Verified: `git --version` shows version number

---

## 📦 PHASE 2: Get the Project Code

### Option A: Via Git
- [ ] Got Git repository URL from current device
- [ ] Ran: `git clone [URL]`
- [ ] Project folder created successfully
- [ ] Navigated into project folder with PowerShell

### Option B: Via ZIP File
- [ ] Created ZIP file on current device
- [ ] Transferred ZIP to new device
- [ ] Extracted ZIP file to `C:\Projects\`
- [ ] Navigated into project folder with PowerShell

**Final Check:**
- [ ] Current folder contains `package.json` file
- [ ] Current folder contains `.env` file
- [ ] PowerShell shows path like: `C:\Projects\ats`

---

## 💾 PHASE 3: Set Up PostgreSQL Database

- [ ] **Step 3.1: Create database**
  - [ ] Ran: `Create database ats_saas` command
  - [ ] Got success message: `CREATE DATABASE`

- [ ] **Step 3.2: Verify database created**
  - [ ] Verified database with psql command
  - [ ] Got response showing tables status

---

## ⚙️ PHASE 4: Configure and Install Project

- [ ] **Step 4.1: Install dependencies**
  - [ ] Ran: `npm install`
  - [ ] Process completed (took 5-10 minutes)
  - [ ] See: `added XXX packages` message

- [ ] **Step 4.2: Verify .env file**
  - [ ] `.env` file exists in project folder
  - [ ] Contains database settings
  - [ ] Shows: `DB_HOST=127.0.0.1`, `DB_PASSWORD=password`, etc.

- [ ] **Step 4.3: Run database migrations**
  - [ ] Ran: `npm run migration:run`
  - [ ] See: "All migrations completed" (or similar)
  - [ ] See: Multiple migration names listed

- [ ] **Step 4.4: Seed initial data**
  - [ ] Ran: `npm run seed:bootstrap`
  - [ ] See: "Admin user created" (or similar)
  - [ ] Optionally ran: `npm run seed:demo`

---

## 🏗️ PHASE 5: Build and Start the Project

- [ ] **Step 5.1: Build the project**
  - [ ] Ran: `npm run build`
  - [ ] Build completed successfully
  - [ ] See: "Successfully compiled" message

- [ ] **Step 5.2: Start the server** (Choose ONE)
  - [ ] Development mode: Ran `npm run dev` 
    - OR
  - [ ] Production mode: Ran `npm start`
  - [ ] Server is running and NOT showing errors
  - [ ] See: "Nest application successfully started"

---

## ✅ PHASE 6: Verification & Testing

- [ ] **Step 6.1: Test the API**
  - [ ] Opened Chrome
  - [ ] Went to: `http://localhost:3000/api/health`
  - [ ] Saw response with `status` field

- [ ] **Step 6.2: Test database connection**
  - [ ] Opened new PowerShell window
  - [ ] Ran database query command
  - [ ] Got a numeric response (table count)

- [ ] **Step 6.3: Test Super Admin login**
  - [ ] Tested login endpoint or saw API responding
  - [ ] Got meaningful response (token or error)

---

## 🎉 Migration Complete!

✅ **All checks passed?** Your ATS project is now running on the new device!

### Quick Access

- **Application URL:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health
- **Database Server:** localhost:5432
- **Project Folder:** C:\Projects\ats (or your location)

### Daily Startup

Next time you want to use the project:
1. Open PowerShell
2. Navigate to project folder
3. Run: `npm run dev` (development) or `npm start` (production)
4. Wait for "Nest application successfully started"
5. Access at http://localhost:3000

### Troubleshooting

If something doesn't work:
- Check `MIGRATION_GUIDE_NEW_DEVICE.md` (Troubleshooting section)
- Verify PostgreSQL is running
- Check .env file has correct credentials
- Look at PowerShell error messages carefully

---

## 📝 Important Credentials

**PostgreSQL Connection:**
```
Host: 127.0.0.1
Port: 5432
Username: postgres
Password: password
Database: ats_saas
```

**Super Admin Login** (if seed ran):
```
Email: admin@ats.com
Password: ChangeMe@123
```

---

**Date Started:** _______________  
**Date Completed:** _______________  
**By:** _______________  

---
