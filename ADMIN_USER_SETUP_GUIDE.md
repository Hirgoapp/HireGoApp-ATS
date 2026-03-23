# Admin User Setup Guide

Complete guide to create your first admin user for the ATS backend.

## Overview

Two approaches available:

1. **Automated** (Recommended) - Use the Node.js setup script
2. **Manual** - Execute SQL directly in your database tool

---

## Approach 1: Automated (Recommended) ⭐

### Prerequisites

- Backend running: `npm run dev`
- Dependencies installed: `npm install`
- PostgreSQL accessible with `.env` configured
- Node.js installed

### Run the Script

```bash
# From src/ directory
npx ts-node scripts/create-admin-user.ts
```

### What It Does

The script will:
1. ✅ Connect to your PostgreSQL database
2. ✅ Display all available companies
3. ✅ Let you select a company
4. ✅ Check/create Admin role automatically
5. ✅ Ask for first name, last name, email, password
6. ✅ Generate bcrypt hash automatically
7. ✅ Insert user into database
8. ✅ Display login credentials

### Example Run

```
╔════════════════════════════════════════════╗
║    ATS Admin User Creation Script          ║
╚════════════════════════════════════════════╝

📡 Connecting to PostgreSQL...

✅ Connected to database

📋 Available Companies:

  1. Tech Recruiter Inc.
     ID: 550e8400-e29b-41d4-a716-446655440000

  2. Global HR Solutions
     ID: 660e8400-e29b-41d4-a716-446655440001

Select company number (1-2): 1

✅ Selected: Tech Recruiter Inc. (550e8400-e29b-41d4-a716-446655440000)

🔍 Looking for Admin role...

✅ Found Admin role: 770e8400-e29b-41d4-a716-446655440002

First name [Admin]: Sarah
Last name [User]: Johnson
Email [admin@example.com]: sarah@recruiter.com
Password [Admin123!]: MySecure123!

🔐 Generating bcrypt hash...

✅ Hash generated

📝 Inserting admin user...

✅ Admin user created successfully!

╔════════════════════════════════════════════╗
║          User Created                      ║
╚════════════════════════════════════════════╝

User ID:        880e8400-e29b-41d4-a716-446655440003
Company:        Tech Recruiter Inc.
Email:          sarah@recruiter.com
Name:           Sarah Johnson
Role:           Admin
Status:         Active ✅

🎉 You can now login with these credentials!

Login URL:      http://localhost:5173/login
Email:          sarah@recruiter.com
Password:       MySecure123!

⚠️  IMPORTANT: Change this password after first login!
```

---

## Approach 2: Manual SQL ⚠️

Only choose this if the automated script doesn't work.

### Step 1: Connect to PostgreSQL

Use any of these tools:
- **DBeaver** (GUI, recommended)
- **pgAdmin** (Web UI)
- **psql** (Command line)
- **VS Code** with PostgreSQL extension

Connect to:
```
Host: localhost (or your DB_HOST)
Port: 5432 (or your DB_PORT)
Username: postgres (or your DB_USERNAME)
Password: (your DB_PASSWORD)
Database: ats_saas (or your DB_NAME)
```

### Step 2: Get Company ID

Run this SQL:

```sql
SELECT id, name FROM companies;
```

**Copy one company_id** (e.g., `550e8400-e29b-41d4-a716-446655440000`)

### Step 3: Get or Create Admin Role

Run this:

```sql
SELECT id FROM roles 
WHERE company_id = '<company_id>' 
AND slug = 'admin';
```

Replace `<company_id>` with actual ID from Step 2.

**If you get a result:**
- Copy the `id` value → this is your `<admin_role_id>`
- Skip to Step 5

**If no result:**
- Go to Step 4

### Step 4: Create Admin Role (if needed)

If Step 3 returned no results, run:

```sql
INSERT INTO roles (
    id, 
    company_id, 
    name, 
    slug, 
    description, 
    is_system, 
    is_default, 
    display_order, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    '<company_id>',
    'Admin',
    'admin',
    'Full system access',
    true,
    false,
    1,
    NOW(),
    NOW()
) RETURNING id;
```

**Copy the returned `id`** → this is your `<admin_role_id>`

### Step 5: Generate Password Hash

Open a terminal and run:

```bash
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('Admin123!',10).then(console.log)"
```

Or with a custom password:

```bash
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YourPassword123!',10).then(console.log)"
```

**Copy the entire hash output** → this is your `<bcrypt_hash>`

Example output:
```
$2b$10$xyz...rest...of...hash
```

### Step 6: Insert Admin User

Run this SQL (replace all `<placeholders>`):

```sql
INSERT INTO users (
    id, 
    company_id, 
    first_name, 
    last_name, 
    email,
    password_hash, 
    auth_provider,
    role_id, 
    is_active, 
    email_verified,
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    '<company_id>',                              -- From Step 2
    'Admin',                                     -- Change if desired
    'User',                                      -- Change if desired
    'admin@example.com',                         -- CHANGE THIS EMAIL
    '<bcrypt_hash>',                             -- From Step 5 (entire hash)
    'email',
    '<admin_role_id>',                           -- From Step 3 or 4
    TRUE,
    TRUE,
    NOW(),
    NOW()
)
RETURNING id, email, first_name, last_name;
```

### Step 7: Verify User Created

Run:

```sql
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.is_active,
    u.email_verified,
    r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.company_id = '<company_id>'
ORDER BY u.created_at DESC
LIMIT 5;
```

You should see your new user in the results!

---

## Login Test

1. Ensure frontend is running: `npm run dev` (from `frontend/` folder)
2. Open browser: `http://localhost:5173/login`
3. Enter email and password from admin creation
4. Click "Login"
5. You should see the Dashboard

---

## Troubleshooting

### Error: "Database connection failed"

Check `.env` file in `src/` directory:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=ats_saas
```

Verify PostgreSQL is running:
```bash
# Windows
psql -U postgres -c "SELECT 1"

# If error, start PostgreSQL service
```

### Error: "No companies found"

You need to create a company first:

```bash
# While backend is running (npm run dev)
# Create company via API:

curl -X POST http://localhost:3000/api/v1/companies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "email": "company@example.com",
    "industry": "Technology"
  }'
```

Or insert directly:

```sql
INSERT INTO companies (id, name, email, license_tier, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'My Company',
    'company@example.com',
    'professional',
    TRUE,
    NOW(),
    NOW()
) RETURNING id;
```

### Error: "User already exists"

Change the email in Step 6 or delete existing user:

```sql
DELETE FROM users 
WHERE company_id = '<company_id>' 
AND email = 'admin@example.com';
```

### Error: "Invalid role_id"

Make sure:
1. Role ID is correct (not too short/long)
2. Role belongs to the same company_id
3. Role hasn't been deleted

---

## Security Notes

⚠️ **Important:**

1. **Change default password immediately** after first login
2. **Don't hardcode passwords** in production
3. **Use strong passwords** (min 12 chars, upper/lowercase, numbers, symbols)
4. **Store credentials securely** (password manager, secrets vault)
5. **Audit logs** track all login attempts

---

## Using SQL Script File

If using the provided SQL file (`src/database/scripts/create-admin-user.sql`):

1. Open in DBeaver or pgAdmin
2. Replace all `<placeholders>`
3. Run sections in order
4. Verify results

---

## Next Steps

✅ Admin user created  
✅ Backend ready  
✅ Frontend ready  

1. **Change password** - Log in and update password
2. **Invite team members** - From Settings page
3. **Configure roles** - Assign recruiter/hiring manager roles
4. **Set up company settings** - From company settings page

---

## Support

If issues persist:

1. Check `.env` file is correct
2. Verify PostgreSQL is running
3. Check server logs: `npm run dev`
4. Verify database connections: `psql -U postgres`
5. Review error messages carefully

---

*Last updated: December 31, 2025*
