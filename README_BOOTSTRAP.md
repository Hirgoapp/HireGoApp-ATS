# 🚀 QUICK START - Bootstrap Admin Seed

## The One Command You Need

```bash
npm run seed
```

That's it. Seriously.

---

## What Happens

```
You type: npm run seed
    ↓
Script connects to PostgreSQL
    ↓
Creates (or reuses):
  ✅ Company (Default Company)
  ✅ Permissions (10 admin permissions)
  ✅ Role (Admin role with all perms)
  ✅ User (admin@example.com with bcrypt password)
    ↓
Displays login credentials
    ↓
You login: admin@example.com / Admin123!
    ↓
🎉 Dashboard appears!
```

---

## 3 Steps to Working System

### Step 1: Install Dependencies
```bash
npm install
```
⏱️ Takes ~3 minutes

### Step 2: Create Database Schema
```bash
npm run migration:run
```
⏱️ Takes ~30 seconds

### Step 3: Bootstrap Admin (ONE COMMAND)
```bash
npm run seed
```
⏱️ Takes ~5 seconds

✅ **System ready!**

---

## Login Details (After Bootstrap)

```
URL:      http://localhost:5173/login
Email:    admin@example.com
Password: Admin123!
```

**⚠️ Change password on first login!**

---

## What Gets Created

| Item | Value |
|------|-------|
| **Company** | Default Company |
| **Admin Email** | admin@example.com |
| **Password** | Admin123! (bcrypt hashed) |
| **Role** | Admin (10 permissions) |
| **Status** | Active, email verified |

---

## Verify It Worked

### Check 1: Database
```sql
SELECT email FROM users WHERE email = 'admin@example.com';
-- Should return: admin@example.com ✅
```

### Check 2: Login
```
Go to: http://localhost:5173/login
Enter: admin@example.com / Admin123!
Click: Login
Expected: Dashboard appears ✅
```

### Check 3: Backend
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
Expected: JWT tokens returned ✅
```

---

## Full Setup (10 minutes)

```bash
# Terminal 1: Backend setup
cd g:\ATS
npm install                 # 3 min
npm run migration:run       # 30 sec
npm run seed               # 5 sec
npm run dev                # Starts server

# Terminal 2: Frontend setup
cd g:\ATS\frontend
npm install                 # 3 min
npm run dev                # Starts on 5173

# Browser: Login
http://localhost:5173/login
Email: admin@example.com
Password: Admin123!
```

**✅ DONE!** ATS system fully operational

---

## Customization (Optional)

Edit `src/database/run-seeds.ts`:

```typescript
await bootstrapAdminUser(dataSource, {
  email: 'your@email.com',           // Change email
  password: 'YourPassword123!',       // Change password
  firstName: 'Your Name',             // Change name
  lastName: 'Your Last Name',         // Change last name
});
```

Then: `npm run seed`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "DB connection failed" | Ensure PostgreSQL running, check .env |
| "Entity not found" | Run migrations first: `npm run migration:run` |
| "User already exists" | That's OK! Idempotent = reuses existing |
| "Can't connect frontend to backend" | Ensure backend on port 3000, frontend on 5173 |

---

## Security Reminders

- ✅ Password is bcrypt hashed in database (never plain text)
- ✅ Admin user is active and email verified
- ✅ Idempotent (safe to run multiple times)
- ⚠️ Change default password after login
- ⚠️ Use strong passwords
- ⚠️ Don't hardcode passwords

---

## NPM Commands Reference

```bash
# Seeding
npm run seed               # Run bootstrap seed
npm run seed:bootstrap     # Run just bootstrap

# Development
npm run dev               # Start dev server
npm run build             # Build for prod
npm start                 # Run compiled version

# Database
npm run migration:run     # Create tables
npm run migration:revert  # Undo migration

# Testing
npm test                  # Run tests
npm run lint              # Check code style
npm run format            # Format code
```

---

## What's in Bootstrap Seed?

The script:
1. ✅ Checks if company exists (creates if not)
2. ✅ Checks if permissions exist (creates if not)
3. ✅ Checks if admin role exists (creates if not)
4. ✅ Checks if admin user exists (creates if not)
5. ✅ Hashes password with bcrypt
6. ✅ Returns login credentials

**Result:** You can login immediately!

---

## Files Created

| File | Size | Purpose |
|------|------|---------|
| `src/database/seeds/0-bootstrap-admin.ts` | 280 lines | Bootstrap logic |
| `src/database/run-seeds.ts` | 120 lines | Seed runner |
| `package.json` | 100 lines | Scripts & deps |
| Documentation | 1,500+ lines | Guides & refs |

---

## Next Steps

1. [ ] Run: `npm run seed`
2. [ ] Login: admin@example.com / Admin123!
3. [ ] Change password
4. [ ] Invite team members
5. [ ] Start recruiting!

---

## Complete Docs

- 📖 **Guide:** [BOOTSTRAP_SEED_GUIDE.md](BOOTSTRAP_SEED_GUIDE.md)
- 📋 **Checklist:** [BACKEND_SETUP_CHECKLIST.md](BACKEND_SETUP_CHECKLIST.md)
- 📄 **Implementation:** [BOOTSTRAP_IMPLEMENTATION_SUMMARY.md](BOOTSTRAP_IMPLEMENTATION_SUMMARY.md)

---

## Summary

| Aspect | Status |
|--------|--------|
| Command | `npm run seed` ✅ |
| Time | 5 seconds ⚡ |
| Idempotent | Yes ✅ |
| Bcrypt Hashed | Yes ✅ |
| Documentation | Complete 📚 |
| Ready to Use | Yes 🚀 |

---

**TLDR:** 

```bash
npm run seed  # Creates admin user
npm run dev   # Starts backend
cd frontend && npm run dev  # Starts frontend
# Login: admin@example.com / Admin123!
# Dashboard appears!
```

🎉 **You're done!**

---

*Last updated: December 31, 2025*
