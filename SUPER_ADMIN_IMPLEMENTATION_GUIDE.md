# Super Admin Implementation Guide

**Date**: January 2, 2026  
**Status**: Production Ready  
**Version**: 1.0

---

## Quick Start

### 1. Initialize Super Admin & Demo Setup

```bash
npm run seed:super-admin
```

This will:
- Create `super_admin_users` table
- Create default Super Admin user (`admin@ats.com` / `ChangeMe@123`)
- Create demo company (`demo-company`)
- Create demo company admin user (`admin@demo-company.com` / `DemoAdmin@123`)
- Enable all feature modules for demo company

### 2. Super Admin Login

```bash
curl -X POST http://localhost:3000/api/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ats.com",
    "password": "ChangeMe@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@ats.com",
      "firstName": "System",
      "lastName": "Administrator",
      "role": "super_admin"
    }
  }
}
```

**Save the `accessToken` for all subsequent Super Admin requests.**

---

## Complete API Reference

### Authentication

#### Login Super Admin
```bash
POST /api/super-admin/auth/login
Content-Type: application/json

{
  "email": "admin@ats.com",
  "password": "password123"
}
```

#### Refresh Token
```bash
POST /api/super-admin/auth/refresh
Content-Type: application/json

{
  "refreshToken": "{refreshToken}"
}
```

#### Logout
```bash
POST /api/super-admin/auth/logout
Authorization: Bearer {accessToken}
```

#### Change Password
```bash
POST /api/super-admin/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "oldPassword": "current_password",
  "newPassword": "new_password"
}
```

---

### Company Management

#### Create Company with Admin User
```bash
POST /api/super-admin/companies
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "email": "admin@acme.com",
  "licenseTier": "premium",
  "initialAdmin": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@acme.com",
    "password": "SecurePassword123"
  },
  "settings": {
    "timezone": "America/New_York",
    "dateFormat": "MM/DD/YYYY"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "id": "company-uuid",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "email": "admin@acme.com",
      "licenseTier": "premium",
      "isActive": true,
      "createdAt": "2026-01-02T10:00:00Z"
    },
    "admin": {
      "id": "user-uuid",
      "email": "john@acme.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "companyId": "company-uuid"
    }
  }
}
```

#### List All Companies
```bash
GET /api/super-admin/companies?page=1&limit=20&search=acme&isActive=true
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "company-uuid",
        "name": "Acme Corporation",
        "slug": "acme-corp",
        "email": "admin@acme.com",
        "licenseTier": "premium",
        "isActive": true,
        "createdAt": "2026-01-02T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42
    }
  }
}
```

#### Get Company Details
```bash
GET /api/super-admin/companies/{companyId}
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company-uuid",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "email": "admin@acme.com",
    "licenseTier": "premium",
    "isActive": true,
    "settings": {
      "timezone": "America/New_York"
    },
    "featureFlags": {
      "jobs": true,
      "candidates": true,
      "interviews": true,
      "offers": true,
      "submissions": true,
      "reports": true,
      "api": false,
      "webhooks": false,
      "sso": false,
      "analytics": true
    },
    "userCount": 15,
    "createdAt": "2026-01-02T10:00:00Z",
    "updatedAt": "2026-01-02T10:00:00Z"
  }
}
```

#### Update Company
```bash
PATCH /api/super-admin/companies/{companyId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Acme Corporation Updated",
  "email": "newadmin@acme.com",
  "isActive": true,
  "licenseTier": "enterprise",
  "settings": {
    "timezone": "America/Los_Angeles"
  }
}
```

---

### License Management

#### Assign License
```bash
POST /api/super-admin/licenses
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "companyId": "company-uuid",
  "tier": "enterprise",
  "billingCycle": "annual",
  "startsAt": "2026-01-02T00:00:00Z",
  "expiresAt": "2027-01-02T00:00:00Z",
  "autoRenew": true,
  "customLimits": {
    "maxUsers": 500,
    "maxCandidates": 50000,
    "apiCallsPerDay": 1000000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "License tier 'enterprise' assigned to company"
  }
}
```

#### Get License Details
```bash
GET /api/super-admin/licenses/{companyId}
Authorization: Bearer {accessToken}
```

---

### Feature Module Management

#### Get All Modules for Company
```bash
GET /api/super-admin/modules/{companyId}
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-uuid",
    "modules": {
      "jobs": true,
      "candidates": true,
      "interviews": true,
      "offers": true,
      "submissions": true,
      "reports": true,
      "api": false,
      "webhooks": false,
      "sso": false,
      "analytics": true,
      "custom_fields": true,
      "bulk_import": false
    }
  }
}
```

#### Enable Module
```bash
POST /api/super-admin/modules/{companyId}/enable
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "module": "api",
  "reason": "Customer upgraded to Premium"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "module": "api",
    "isEnabled": true,
    "enabledAt": "2026-01-02T10:00:00Z"
  }
}
```

#### Disable Module
```bash
POST /api/super-admin/modules/{companyId}/disable
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "module": "webhooks",
  "reason": "Customer downgraded to Basic"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "module": "webhooks",
    "isEnabled": false,
    "disabledAt": "2026-01-02T10:00:00Z"
  }
}
```

---

### Company Admin User Management

#### Create Company Admin
```bash
POST /api/super-admin/companies/{companyId}/admins
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@acme.com",
  "password": "SecurePassword456",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "jane@acme.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "admin",
    "companyId": "company-uuid",
    "createdAt": "2026-01-02T10:00:00Z"
  }
}
```

#### Get Company Admins
```bash
GET /api/super-admin/companies/{companyId}/admins
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-uuid",
    "admins": [
      {
        "id": "user-uuid",
        "email": "john@acme.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "admin",
        "isActive": true,
        "lastLoginAt": "2026-01-01T15:30:00Z",
        "createdAt": "2026-01-02T10:00:00Z"
      }
    ]
  }
}
```

---

## Typical Workflows

### Workflow 1: Create New Customer with Full Setup

```bash
# Step 1: Login as Super Admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ats.com","password":"ChangeMe@123"}' \
  | jq -r '.data.accessToken')

# Step 2: Create Company with Admin
COMPANY_ID=$(curl -s -X POST http://localhost:3000/api/super-admin/companies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"New Company",
    "slug":"new-company",
    "email":"admin@new-company.com",
    "licenseTier":"premium",
    "initialAdmin":{
      "firstName":"Admin",
      "lastName":"User",
      "email":"admin@new-company.com",
      "password":"SecurePass123"
    }
  }' | jq -r '.data.company.id')

# Step 3: Assign License
curl -s -X POST http://localhost:3000/api/super-admin/licenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"companyId\":\"$COMPANY_ID\",
    \"tier\":\"premium\",
    \"billingCycle\":\"monthly\",
    \"startsAt\":\"$(date -Iseconds)\",
    \"expiresAt\":\"$(date -d '+30 days' -Iseconds)\"
  }"

# Step 4: Enable API Module
curl -s -X POST http://localhost:3000/api/super-admin/modules/$COMPANY_ID/enable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"module":"api"}'

echo "✅ Company setup complete!"
echo "Company ID: $COMPANY_ID"
```

### Workflow 2: Upgrade Existing Customer License

```bash
TOKEN="your_super_admin_token"
COMPANY_ID="existing-company-uuid"

# Upgrade to Enterprise
curl -X POST http://localhost:3000/api/super-admin/licenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"companyId\":\"$COMPANY_ID\",
    \"tier\":\"enterprise\",
    \"billingCycle\":\"annual\",
    \"startsAt\":\"$(date -Iseconds)\",
    \"expiresAt\":\"$(date -d '+1 year' -Iseconds)\",
    \"autoRenew\":true,
    \"customLimits\":{
      \"maxUsers\":null,
      \"maxCandidates\":null,
      \"apiCallsPerDay\":null
    }
  }"

# Enable all premium features
for module in api webhooks sso bulk_import; do
  curl -X POST http://localhost:3000/api/super-admin/modules/$COMPANY_ID/enable \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"module\":\"$module\"}"
done

echo "✅ Customer upgraded successfully!"
```

### Workflow 3: Company User Login (After Super Admin Setup)

```bash
# Company admin can login to their company portal
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecurePassword123"
  }'

# Returns company-scoped JWT token with:
# - companyId (ties them to Acme Corp)
# - type: "company_user"
# - company permissions
```

---

## Data Model

### super_admin_users Table

```sql
CREATE TABLE super_admin_users (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'super_admin',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_super_admin_users_email ON super_admin_users(email);
CREATE INDEX idx_super_admin_users_is_active ON super_admin_users(is_active);
```

**Key Differences from regular users:**
- ❌ NO `company_id` - Super Admin is not tied to any company
- ✅ Separate table for security and clarity
- ✅ Own role/permission system

---

## Token Structure

### Super Admin Token

```typescript
{
  userId: "super-admin-uuid",
  email: "admin@ats.com",
  type: "super_admin",              // ← KEY DIFFERENTIATOR
  role: "super_admin",
  permissions: ["*"],
  iat: 1704211200,
  exp: 1704297600
}
```

### Company User Token

```typescript
{
  userId: "user-uuid",
  companyId: "company-uuid",        // ← KEY DIFFERENTIATOR
  email: "recruiter@company.com",
  type: "company_user",             // ← KEY DIFFERENTIATOR
  role: "admin",
  permissions: ["jobs:*", "candidates:*"],
  iat: 1704211200,
  exp: 1704297600
}
```

---

## Security Architecture

### 1. Token Isolation
- Super Admin token: `type: 'super_admin'`
- Company token: `type: 'company_user'`
- Guards prevent token mixing

### 2. Separate Auth Flows
- Super Admin: `/api/super-admin/auth/*`
- Company Users: `/api/auth/*`
- Different JWT secrets

### 3. Route Protection
- All `/api/super-admin/*` routes require `SuperAdminGuard`
- Guard checks `token.type === 'super_admin'`
- Prevents company tokens from accessing super admin endpoints

### 4. Audit Logging
- All Super Admin operations logged
- Actions: SUPER_ADMIN_LOGIN, SUPER_ADMIN_COMPANY_CREATED, etc.
- Tracks who performed each action

### 5. Multi-Tenancy Isolation
- Super Admin operations: `companyId: null` in audit logs
- Company operations: `companyId` in audit logs
- Database queries always scoped to company

---

## Environment Variables

Add to `.env`:

```env
# Super Admin JWT Configuration
SUPER_ADMIN_JWT_SECRET=your-super-admin-secret-key-change-in-production
SUPER_ADMIN_JWT_REFRESH_SECRET=your-super-admin-refresh-secret-key-change
SUPER_ADMIN_JWT_EXPIRY=24h
SUPER_ADMIN_JWT_REFRESH_EXPIRY=7d

# Company User JWT Configuration (existing)
JWT_SECRET=your-company-jwt-secret-key
JWT_REFRESH_SECRET=your-company-refresh-secret-key
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
```

---

## Troubleshooting

### "Super Admin access required"
- Check token `Authorization: Bearer {token}` header
- Verify token type is `super_admin`
- Regenerate token if expired

### "Invalid email or password"
- Verify credentials against demo config or your super admin user
- Check user exists in `super_admin_users` table
- Verify `is_active = true`

### "Company slug already exists"
- Use unique slug when creating company
- Check existing companies with `GET /api/super-admin/companies`

### "Email already in use"
- Email is globally unique across all companies
- Try different email for admin user

### Tokens not working
- Verify `SUPER_ADMIN_JWT_SECRET` environment variable is set
- Check JWT secrets are different for super admin vs company
- Verify token hasn't expired

---

## Production Deployment

### Before Going Live

1. **Change Default Credentials**
   ```bash
   # Change super admin password immediately
   curl -X POST http://localhost:3000/api/super-admin/auth/change-password \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"oldPassword":"ChangeMe@123","newPassword":"YourSecurePassword123"}'
   ```

2. **Generate Strong Secret Keys**
   ```bash
   openssl rand -base64 32  # For JWT secrets
   ```

3. **Set Environment Variables**
   - Use strong random keys for both JWT secrets
   - Store in secure vault (AWS Secrets Manager, Azure Key Vault, etc.)

4. **Enable Database Backups**
   - Super admin table should be part of regular backups
   - Test restore procedures

5. **Enable Audit Logging**
   - Monitor `SUPER_ADMIN_*` audit events
   - Set up alerts for unusual activity

6. **Rate Limiting**
   - Consider adding rate limiting to auth endpoints
   - Prevent brute force attacks

7. **MFA (Optional)**
   - Consider adding MFA for super admin accounts
   - Implement TOTP or similar

---

## API Testing with Postman

See [SUPER_ADMIN_POSTMAN_COLLECTION.json](./postman-collection.json) for complete Postman collection with all endpoints pre-configured.

---

## Next Steps

1. ✅ Deploy migration: `npm run typeorm migration:run`
2. ✅ Run seed script: `npm run seed:super-admin`
3. ✅ Test Super Admin login
4. ✅ Create test company
5. ✅ Test company user login
6. ✅ Deploy to staging
7. ✅ Deploy to production
8. ✅ Change default credentials
9. ✅ Monitor audit logs

---

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review audit logs in database
3. Check application logs for errors
4. Refer to SUPER_ADMIN_DESIGN.md for architecture details
