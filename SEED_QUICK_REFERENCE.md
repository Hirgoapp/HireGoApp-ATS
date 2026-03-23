# Bootstrap Seed - Quick Reference

## TL;DR

**Run this ONE command:**

```bash
npm run seed
```

**Result:**
- ✅ Company created (or reused)
- ✅ Admin role created
- ✅ Admin user created with bcrypt hash

**Login:**
- Email: `admin@example.com`
- Password: `Admin123!`
- URL: `http://localhost:5173/login`

---

## What Gets Created

```
Default Company (ID: 00000000-0000-0000-0000-000000000001)
├── Admin Role (with 10 permissions)
└── Admin User (admin@example.com / Admin123!)
```

---

## Files

| File | Purpose |
|------|---------|
| `src/database/seeds/0-bootstrap-admin.ts` | Bootstrap logic |
| `src/database/run-seeds.ts` | Seed runner |
| `package.json` | NPM scripts |

---

## NPM Scripts

```bash
npm run seed              # Run all seeds (including bootstrap)
npm run seed:bootstrap    # Run bootstrap only
```

---

## How It Works

1. **Connects to PostgreSQL** using `.env` config
2. **Creates/checks Company** (ID: `00000000-0000-0000-0000-000000000001`)
3. **Creates/checks Permissions** (10 global admin permissions)
4. **Creates/checks Admin Role** (linked to all permissions)
5. **Creates/checks Admin User** with bcrypt-hashed password

**All steps are idempotent** → Safe to run multiple times

---

## Customize (Optional)

Edit `src/database/run-seeds.ts`:

```typescript
await bootstrapAdminUser(dataSource, {
  email: 'your@email.com',
  password: 'YourPassword123!',
  firstName: 'Your Name',
  lastName: 'Your Last',
});
```

Then run:
```bash
npm run seed
```

---

## Database Check

Verify admin user was created:

```sql
-- Check user
SELECT email, is_active, email_verified FROM users 
WHERE email = 'admin@example.com';

-- Check role
SELECT name FROM roles WHERE slug = 'admin';

-- Check permissions
SELECT name FROM permissions LIMIT 10;
```

---

## Password

- **Default:** `Admin123!`
- **⚠️ IMPORTANT:** Change after first login
- **Hash:** bcrypt (10 rounds)
- **Never commit** passwords to git

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "DB connection failed" | Check `.env` and PostgreSQL running |
| "Entity not found" | Run `npm run migration:run` first |
| "Already exists" | That's OK! Idempotent = no duplicates |
| Script hangs | Check DB connection, Ctrl+C to stop |

---

## Next Steps

1. ✅ Run: `npm run seed`
2. ✅ Login: `admin@example.com` / `Admin123!`
3. ✅ Change password (Settings page)
4. ✅ Invite team members
5. ✅ Start recruiting!

---

**Full Guide:** See [BOOTSTRAP_SEED_GUIDE.md](BOOTSTRAP_SEED_GUIDE.md)
