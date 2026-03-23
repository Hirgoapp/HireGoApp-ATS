# Super Admin Quick Reference

**API Base**: `http://localhost:3000/api/super-admin`

---

## 1. Authentication

### Login
```bash
curl -X POST http://localhost:3000/api/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ats.com","password":"ChangeMe@123"}'
```
**Response**: `accessToken`, `refreshToken`, `user`

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/super-admin/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"{TOKEN}"}'
```

### Change Password
```bash
curl -X POST http://localhost:3000/api/super-admin/auth/change-password \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"old","newPassword":"new"}'
```

---

## 2. Company Management

### Create Company
```bash
curl -X POST http://localhost:3000/api/super-admin/companies \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Company Name",
    "slug":"company-slug",
    "email":"admin@company.com",
    "licenseTier":"premium",
    "initialAdmin":{
      "firstName":"Admin",
      "lastName":"User",
      "email":"admin@company.com",
      "password":"SecurePass123"
    }
  }'
```

### List Companies
```bash
curl -X GET "http://localhost:3000/api/super-admin/companies?page=1&limit=20&search=acme&isActive=true" \
  -H "Authorization: Bearer {TOKEN}"
```

### Get Company
```bash
curl -X GET http://localhost:3000/api/super-admin/companies/{companyId} \
  -H "Authorization: Bearer {TOKEN}"
```

### Update Company
```bash
curl -X PATCH http://localhost:3000/api/super-admin/companies/{companyId} \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","isActive":true}'
```

---

## 3. License Management

### Assign License
```bash
curl -X POST http://localhost:3000/api/super-admin/licenses \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId":"{companyId}",
    "tier":"premium",
    "billingCycle":"monthly",
    "startsAt":"2026-01-02T00:00:00Z",
    "expiresAt":"2026-02-02T00:00:00Z",
    "autoRenew":true
  }'
```

### Get License
```bash
curl -X GET http://localhost:3000/api/super-admin/licenses/{companyId} \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 4. Feature Modules

### Get All Modules
```bash
curl -X GET http://localhost:3000/api/super-admin/modules/{companyId} \
  -H "Authorization: Bearer {TOKEN}"
```

### Enable Module
```bash
curl -X POST http://localhost:3000/api/super-admin/modules/{companyId}/enable \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"module":"api"}'
```

### Disable Module
```bash
curl -X POST http://localhost:3000/api/super-admin/modules/{companyId}/disable \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"module":"webhooks","reason":"Downgrade"}'
```

**Available Modules**:
- `jobs`, `candidates`, `interviews`, `offers`, `submissions`, `reports`
- `api`, `webhooks`, `sso`, `analytics`
- `custom_fields`, `bulk_import`

---

## 5. Company Admin Users

### Create Admin
```bash
curl -X POST http://localhost:3000/api/super-admin/companies/{companyId}/admins \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Jane",
    "lastName":"Doe",
    "email":"jane@company.com",
    "password":"SecurePass456"
  }'
```

### List Admins
```bash
curl -X GET http://localhost:3000/api/super-admin/companies/{companyId}/admins \
  -H "Authorization: Bearer {TOKEN}"
```

---

## Key Details

| Item | Value |
|------|-------|
| **Default Super Admin Email** | `admin@ats.com` |
| **Default Super Admin Password** | `ChangeMe@123` ⚠️ Change in production! |
| **Demo Company Slug** | `demo-company` |
| **Access Token Expiry** | 24 hours |
| **Refresh Token Expiry** | 7 days |

---

## Common Headers

```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (wrong token type or insufficient permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate email/slug) |

---

## Response Format

### Success
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error
```json
{
  "statusCode": 400,
  "message": "Error description"
}
```

---

## Setup (First Time)

```bash
# 1. Run migrations
npm run typeorm migration:run

# 2. Seed demo data
npm run seed:super-admin

# 3. Start server
npm run start

# 4. Login
curl -X POST http://localhost:3000/api/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ats.com","password":"ChangeMe@123"}'
```

---

## Typical Workflow

```bash
# 1. Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ats.com","password":"ChangeMe@123"}' | jq -r '.data.accessToken')

# 2. Create company
COMPANY=$(curl -s -X POST http://localhost:3000/api/super-admin/companies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}')
COMPANY_ID=$(echo $COMPANY | jq -r '.data.company.id')

# 3. Enable features
curl -X POST http://localhost:3000/api/super-admin/modules/$COMPANY_ID/enable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"module":"api"}'

# 4. Company admin can now login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"..."}'
```

---

## Environment Variables

```env
SUPER_ADMIN_JWT_SECRET=your-secret-key
SUPER_ADMIN_JWT_REFRESH_SECRET=your-refresh-secret
SUPER_ADMIN_JWT_EXPIRY=24h
SUPER_ADMIN_JWT_REFRESH_EXPIRY=7d
JWT_SECRET=company-users-secret-key
JWT_REFRESH_SECRET=company-users-refresh-secret
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
```

---

## Useful SQL Queries

```sql
-- Check super admin user
SELECT id, email, is_active FROM super_admin_users 
WHERE email = 'admin@ats.com';

-- List all companies
SELECT id, name, slug, license_tier, is_active FROM companies;

-- Check company admins
SELECT id, email, role FROM users 
WHERE company_id = '{companyId}' AND role = 'admin';

-- Check feature flags for company
SELECT feature_flags FROM companies WHERE id = '{companyId}';

-- View audit logs
SELECT action, entity_type, changes, performed_by, created_at 
FROM audit_logs 
WHERE action LIKE 'SUPER_ADMIN%' 
ORDER BY created_at DESC LIMIT 20;
```

---

## Documentation

📖 **[SUPER_ADMIN_DESIGN.md](./SUPER_ADMIN_DESIGN.md)** - Architecture & design  
📖 **[SUPER_ADMIN_IMPLEMENTATION_GUIDE.md](./SUPER_ADMIN_IMPLEMENTATION_GUIDE.md)** - How to use (comprehensive)  
📖 **[SUPER_ADMIN_TECHNICAL_REFERENCE.md](./SUPER_ADMIN_TECHNICAL_REFERENCE.md)** - Technical details  
📖 **[SUPER_ADMIN_IMPLEMENTATION_CHECKLIST.md](./SUPER_ADMIN_IMPLEMENTATION_CHECKLIST.md)** - Deployment checklist  
📖 **[SUPER_ADMIN_DELIVERY_SUMMARY.md](./SUPER_ADMIN_DELIVERY_SUMMARY.md)** - Complete summary

---

## Important Notes

⚠️ **Change default password in production**  
⚠️ **Use strong JWT secrets**  
⚠️ **Enable database backups**  
⚠️ **Monitor audit logs**  
⚠️ **Use HTTPS in production**  

---

**Questions?** See the full documentation files above.
