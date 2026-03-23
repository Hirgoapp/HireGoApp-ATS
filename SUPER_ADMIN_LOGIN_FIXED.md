# 🎯 QUICK START GUIDE - Super Admin Login Fixed

## ✅ What Was Fixed

**Problem:** Login failed with "Invalid credentials" error
**Root Cause:** `.env` file had wrong API URL
- ❌ Was: `VITE_API_BASE_URL=http://localhost:3000/api/v1`
- ✅ Fixed: `VITE_API_BASE_URL=http://localhost:3000/api`

## 🚀 How to Start Everything (ONE COMMAND)

```powershell
npm run dev:full
```

This starts:
- **Backend** on port `3000`
- **Super Admin UI** on port `5174` (or `5175` if 5174 is busy)
- **Business UI** on port `5180` (or `5181` if 5180 is busy)

## 🔑 Super Admin Login Credentials

**URL:** http://localhost:5174 (or check terminal for actual port)

**Login:**
- Email: `super@admin.com`
- Password: `SuperAdmin123!`

## 📊 How to Check Service Status

Run this command:
```powershell
.\check-services.ps1
```

## 🐛 How to Debug Login Issues

1. **Open Browser Console** (F12)
2. **Go to Console tab**
3. **Try logging in**
4. **Look for blue logs** showing:
   - `🔵 Frontend: API_BASE_URL = http://localhost:3000/api` (should NOT have `/v1` at end)
   - `🔵 Frontend: Full URL = http://localhost:3000/api/super-admin/auth/login`

5. **Check Backend Terminal** - you should see:
   - `🔍 Super Admin Login Attempt: { email: 'super@admin.com' }`
   - `🔍 User found: YES (super@admin.com)`
   - `🔍 Password valid: true`

## ✅ Success Indicators

**Frontend Console:**
- ✅ `🔵 Frontend: Login successful!`
- ✅ Redirects to Companies page

**Backend Logs:**
- ✅ `🔍 Super Admin Login Attempt`
- ✅ `🔍 User found: YES`
- ✅ `🔍 Password valid: true`

## ❌ Error Indicators & Solutions

### Error: "Network Error" in browser console
**Solution:** Backend is not running
```powershell
# Stop any running services (Ctrl+C)
npm run dev:full
```

### Error: "This site can't be reached"
**Solution:** Frontend UI is not running
- Check terminal for the actual port number
- Frontend might be on port 5175 or 5181 instead

### Error: "Invalid credentials" but backend shows NO logs
**Solution:** Frontend can't reach backend
- Check `.env` file: `VITE_API_BASE_URL` should be `http://localhost:3000/api`
- Restart frontend after changing `.env`

### Error: Backend shows login attempt but "Invalid credentials"
**Solution:** Wrong password or user doesn't exist
- Check credentials: `super@admin.com` / `SuperAdmin123!`
- Check if user exists in database

## 📝 Files Changed

1. **frontend/super-admin/.env** - Fixed API_BASE_URL
2. **frontend/super-admin/src/stores/authStore.ts** - Added debug logs
3. **src/super-admin/services/super-admin-auth.service.ts** - Added debug logs

## 🎉 Expected Result

After fixing and restarting:
1. Login page shows at http://localhost:5174
2. Enter credentials
3. Browser console shows successful login
4. Backend shows login attempt with password validation
5. You're redirected to the Super Admin dashboard

---

**Need help?** Check the terminal output where `npm run dev:full` is running to see which ports are actually being used.
