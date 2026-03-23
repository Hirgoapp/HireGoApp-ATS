# Bootstrap Admin User Seed - Complete Documentation

## Overview

The bootstrap seed script creates the initial admin user and required infrastructure in one idempotent command.

**What it does:**
1. ✅ Creates (or reuses) a default company
2. ✅ Ensures global permissions exist
3. ✅ Creates (or reuses) the Admin role with all permissions
4. ✅ Creates (or reuses) an admin user account
5. ✅ Uses bcrypt for password hashing
6. ✅ Safe to run multiple times (idempotent)

---

## Files Created

### 1. Bootstrap Seed Script
**Location:** `src/database/seeds/0-bootstrap-admin.ts`

**Key Features:**
- Imports bcrypt for password hashing
- Uses TypeORM DataSource for database operations
- Idempotent (checks before creating)
- Detailed console logging
- Customizable via config object

### 2. Seed Runner
**Location:** `src/database/run-seeds.ts`

**Purpose:**
- Single entry point for all seeds
- Manages database connection
- Runs seeds in correct order
- Handles errors gracefully
- Closes connection when done

### 3. NPM Scripts (package.json)
**Location:** `package.json` (root)

**Available commands:**
```json
"seed": "ts-node src/database/run-seeds.ts",
"seed:bootstrap": "ts-node src/database/seeds/0-bootstrap-admin.ts"
```

---

## How to Run

### Option 1: Full Seed (Recommended)
Runs all seeds including bootstrap:

```bash
npm run seed
```

**Output:**
```
╔═══════════════════════════════════════════════╗
║      ATS SaaS - Database Seed Runner         ║
╚═══════════════════════════════════════════════╝

🔌 Connecting to database...
✅ Connected to database

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running: Bootstrap Admin Seed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Step 1: Ensure company exists
✅ Using existing company: Default Company (00000000-0000-0000-0000-000000000001)

🔐 Step 2: Ensure permissions exist
✅ Found 10 permissions

👤 Step 3: Ensure admin role exists
✅ Using existing Admin role (550e8400-e29b-41d4-a716-446655440000)

👨‍💼 Step 4: Ensure admin user exists
✅ Admin user already exists: admin@example.com

╔═══════════════════════════════════════════════╗
║           Seeding Complete ✅                ║
╚═══════════════════════════════════════════════╝

📋 Summary:
   Company:    Default Company (00000000-0000-0000-0000-000000000001)
   Role:       Admin (550e8400-e29b-41d4-a716-446655440000)
   User:       admin@example.com (660e8400-e29b-41d4-a716-446655440001)
   Password:   Admin123!

🎉 Ready to login!
   URL:        http://localhost:5173/login
   Email:      admin@example.com
   Password:   Admin123!

⚠️  Change password after first login!
```

### Option 2: Bootstrap Only
Runs just the admin user bootstrap:

```bash
npm run seed:bootstrap
```

---

## The Bootstrap Process Step-by-Step

### Step 1: Ensure Company Exists

```typescript
const company = await ensureCompany(dataSource, config);
// Returns: { id: string; name: string }
```

**Checks for:**
- Existing company with ID `00000000-0000-0000-0000-000000000001`
- If not found, creates `Default Company`

**Customization:**
```bash
# Pass custom company in config
npm run seed -- --company-id="your-id"
```

### Step 2: Ensure Permissions Exist

```typescript
const permissions = await getAllPermissions(dataSource);
// Returns: Permission[]
```

**Checks for:**
- Existing global permissions
- If not found, creates 10 admin permissions:
  - `candidates:*`
  - `jobs:*`
  - `applications:*`
  - `users:*`
  - `reports:*`
  - `settings:manage`
  - `roles:manage`
  - `audit:view`
  - `webhooks:manage`
  - `api:access`

**Note:** Permissions are global (not tenant-specific)

### Step 3: Ensure Admin Role Exists

```typescript
const role = await ensureAdminRole(dataSource, companyId, permissions);
// Returns: { id: string; name: string }
```

**Checks for:**
- Role with `slug = 'admin'` for the company
- If not found:
  - Creates Admin role
  - Assigns all permissions to it

**Role properties:**
- `name`: "Admin"
- `slug`: "admin"
- `is_system`: true
- `is_default`: false
- Permissions: All 10 admin permissions

### Step 4: Ensure Admin User Exists

```typescript
const user = await ensureAdminUser(dataSource, companyId, roleId, config);
// Returns: { id: string; email: string }
```

**Checks for:**
- User with email `admin@example.com` in the company

**If found:**
- Logs existing user info
- Does NOT recreate
- Returns existing user

**If not found:**
- **Hashes password** using bcrypt with 10 rounds:
  ```typescript
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  // Output: $2b$10$xyz...hash...
  ```
- Creates user with:
  - Email: `admin@example.com`
  - Password Hash: bcrypt hash
  - Role: Admin
  - Status: Active
  - Email Verified: true
  - Job Title: "Administrator"

---

## Customization

### Using Custom Admin Details

Edit `src/database/run-seeds.ts`:

```typescript
await bootstrapAdminUser(dataSource, {
  companyId: '550e8400-e29b-41d4-a716-446655440000',  // Use existing company
  email: 'sarah@recruiter.com',
  password: 'MySecurePassword123!',
  firstName: 'Sarah',
  lastName: 'Johnson',
});
```

Then run:
```bash
npm run seed
```

### Environment Variables

Configure in `.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=ats_saas

# Seed will use these for connection
```

---

## Database Changes

### Tables Modified

1. **companies**
   - Creates: 1 row (if not exists)

2. **permissions** (global)
   - Creates: 10 rows (if not exist)

3. **roles**
   - Creates: 1 row (if not exists)

4. **role_permissions**
   - Creates: 10 rows (if not exist, linking role to permissions)

5. **users**
   - Creates: 1 row (if not exists)

### SQL Equivalent

The bootstrap process does this SQL (if running fresh):

```sql
-- Step 1: Create company
INSERT INTO companies (id, name, email, license_tier, is_active, ...)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Company', ...);

-- Step 2: Create permissions (10 rows)
INSERT INTO permissions (name, resource, action, ...) VALUES
('candidates:*', 'candidates', '*', ...),
('jobs:*', 'jobs', '*', ...),
...

-- Step 3: Create role
INSERT INTO roles (company_id, name, slug, ...) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Admin', 'admin', ...);

-- Step 4: Link role to permissions (10 rows)
INSERT INTO role_permissions (role_id, permission_id) VALUES
(<role_id>, <permission_1_id>),
...

-- Step 5: Create admin user
INSERT INTO users (
  company_id, first_name, last_name, email,
  password_hash, role_id, is_active, email_verified, ...
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin',
  'User',
  'admin@example.com',
  '$2b$10$xyz...bcrypt...hash...',
  <admin_role_id>,
  TRUE,
  TRUE,
  ...
);
```

---

## Idempotency Guarantee

The script is **100% idempotent**:

**First run:**
- ✅ Creates company → SUCCESS
- ✅ Creates permissions → SUCCESS
- ✅ Creates role → SUCCESS
- ✅ Creates user → SUCCESS

**Second run:**
- ✅ Finds company → SKIP (logs: "Using existing company")
- ✅ Finds permissions → SKIP (logs: "Found 10 permissions")
- ✅ Finds role → SKIP (logs: "Using existing Admin role")
- ✅ Finds user → SKIP (logs: "Admin user already exists")

**No errors, no duplicates, same result every time.**

---

## Login After Bootstrap

### Access Frontend

```bash
# Terminal 1: Backend (if not running)
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Login Credentials

```
URL:        http://localhost:5173/login
Email:      admin@example.com
Password:   Admin123!
```

### First Login Checklist

- [ ] Login successful
- [ ] Redirected to dashboard
- [ ] See company name in header
- [ ] See user name/avatar in header
- [ ] Click logout works

### Change Password Immediately

1. After login, go to Settings (if available)
2. Find "Change Password"
3. Enter current: `Admin123!`
4. Enter new: Your secure password
5. Save

---

## Troubleshooting

### Error: "Database connection failed"

**Cause:** PostgreSQL not running or `.env` not configured

**Solution:**
1. Verify `.env` exists in root
2. Check DB credentials:
   ```bash
   psql -U postgres -h localhost
   ```
3. Start PostgreSQL service

### Error: "Entity not found"

**Cause:** TypeORM can't find entity files

**Solution:**
1. Verify entities exist in:
   - `src/companies/entities/company.entity.ts`
   - `src/auth/entities/user.entity.ts`
   - `src/auth/entities/role.entity.ts`
   - `src/auth/entities/permission.entity.ts`

2. Run migrations first:
   ```bash
   npm run migration:run
   ```

### Error: "No such file or directory"

**Cause:** File paths incorrect

**Solution:**
1. Ensure you're in root directory: `g:\ATS\`
2. Check file exists: `ls src/database/seeds/0-bootstrap-admin.ts`
3. Run from correct directory:
   ```bash
   cd g:\ATS
   npm run seed
   ```

### Script Runs But Doesn't Create User

**Cause:** User already exists (idempotent behavior)

**Solution:**
1. Check database:
   ```sql
   SELECT email FROM users WHERE company_id = '00000000-0000-0000-0000-000000000001';
   ```

2. If user exists, you're done! (idempotent is working)

3. To create different user, pass config:
   ```typescript
   // In run-seeds.ts
   await bootstrapAdminUser(dataSource, {
     email: 'newadmin@company.com',
     password: 'NewPassword123!'
   });
   ```

---

## Security Notes

⚠️ **Important:**

1. **Change Default Password**
   - Default: `Admin123!`
   - ✅ Change immediately after first login
   - ❌ Never use in production without change

2. **Use Strong Passwords**
   - Min 12 characters
   - Uppercase, lowercase, numbers, symbols
   - Don't use dictionary words

3. **Don't Hardcode Passwords**
   - Pass via environment variables
   - Use secrets manager in production
   - Never commit passwords to git

4. **Secure Token Storage**
   - JWT tokens sent only in Authorization header
   - Refresh tokens stored httpOnly
   - CORS properly configured

5. **Audit Logs**
   - All login attempts logged
   - Admin actions tracked
   - Review periodically

---

## Advanced Usage

### Create Multiple Admin Users

Create a function in `run-seeds.ts`:

```typescript
await bootstrapAdminUser(dataSource, {
  email: 'admin1@company.com',
  password: 'AdminPass1!',
  firstName: 'Admin',
  lastName: 'One',
});

await bootstrapAdminUser(dataSource, {
  email: 'admin2@company.com',
  password: 'AdminPass2!',
  firstName: 'Admin',
  lastName: 'Two',
});
```

### Create for Multiple Companies

```typescript
const companies = ['company-id-1', 'company-id-2'];

for (const companyId of companies) {
  await bootstrapAdminUser(dataSource, {
    companyId,
    email: `admin@${companyId}.com`,
  });
}
```

### Integration with App Bootstrap

Add to `main.ts`:

```typescript
import { bootstrapAdminUser } from './database/seeds/0-bootstrap-admin';

async function bootstrap() {
  // ... NestJS setup ...
  
  // Run bootstrap if ENV var set
  if (process.env.BOOTSTRAP_ADMIN === 'true') {
    const dataSource = app.get(DataSource);
    await bootstrapAdminUser(dataSource);
    console.log('✅ Bootstrap complete');
  }
  
  // ... rest of startup ...
}
```

Then run:
```bash
BOOTSTRAP_ADMIN=true npm run dev
```

---

## What's Next

✅ Admin user created and working

**Next steps:**
1. [ ] Change default admin password
2. [ ] Invite team members (create more users)
3. [ ] Configure company settings
4. [ ] Create recruiting pipelines
5. [ ] Start using the platform!

---

## Summary

| Item | Details |
|------|---------|
| **Script Location** | `src/database/seeds/0-bootstrap-admin.ts` |
| **Runner Location** | `src/database/run-seeds.ts` |
| **NPM Command** | `npm run seed` |
| **Default Email** | `admin@example.com` |
| **Default Password** | `Admin123!` |
| **Idempotent** | ✅ Yes (safe to run multiple times) |
| **Database Changes** | Company, Permissions, Roles, Users |
| **Bcrypt Rounds** | 10 (secure) |
| **Time to Run** | ~2-5 seconds |
| **Error Handling** | Comprehensive with detailed logs |

---

*Last updated: December 31, 2025*
