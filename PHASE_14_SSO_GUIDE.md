# Phase 14: SSO & Advanced Authentication - Implementation Guide

## Overview
Phase 14 adds enterprise-grade authentication features including Single Sign-On (SSO) with SAML 2.0 and OAuth 2.0 providers, along with Multi-Factor Authentication (MFA/2FA).

## Features Delivered

### 1. SSO Providers
- **OAuth 2.0**: Google (extensible to Microsoft, GitHub)
- **SAML 2.0**: Enterprise identity providers (Okta, Azure AD, OneLogin)
- Dynamic configuration per company
- Just-In-Time (JIT) user provisioning
- Role mapping from SSO groups

### 2. Multi-Factor Authentication (MFA/2FA)
- TOTP-based authentication (compatible with Google Authenticator, Authy)
- QR code generation for easy setup
- Backup codes for account recovery
- Encrypted secret storage

### 3. Session Management
- SSO session tracking
- Active session listing
- Session revocation

## Database Schema

### Tables Created
1. **sso_configurations**: SSO provider settings per company
2. **sso_sessions**: Active SSO sessions
3. **mfa_secrets**: MFA secrets and backup codes

### Migration
Run the migration:
```bash
npm run migration:run
```

Migration file: `src/database/migrations/1736273400000-CreateSsoTables.ts`

## API Endpoints

### SSO Configuration Management

#### Create SSO Config
```http
POST /api/v1/auth/sso/config
Authorization: Bearer <token>
Permission: settings:write

{
  "provider": "google",
  "configuration": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "callbackUrl": "http://localhost:3000/api/v1/auth/sso/google/callback"
  },
  "enable_jit_provisioning": true,
  "domain": "@acme.com",
  "role_mapping": {
    "sourceAttribute": "groups",
    "mappings": {
      "Admin": "admin",
      "HR": "recruiter"
    },
    "defaultRole": "viewer"
  }
}
```

#### List SSO Configs
```http
GET /api/v1/auth/sso/config
Authorization: Bearer <token>
Permission: settings:read
```

#### Update SSO Config
```http
PUT /api/v1/auth/sso/config/:id
Authorization: Bearer <token>
Permission: settings:write
```

#### Delete SSO Config
```http
DELETE /api/v1/auth/sso/config/:id
Authorization: Bearer <token>
Permission: settings:write
```

#### Test SSO Config
```http
POST /api/v1/auth/sso/config/:id/test
Authorization: Bearer <token>
Permission: settings:write
```

### SSO Authentication Flow

#### Google OAuth
```http
# 1. Initiate login (redirects to Google)
GET /api/v1/auth/sso/google/login

# 2. Callback (handled automatically)
GET /api/v1/auth/sso/google/callback
```

#### SAML 2.0
```http
# 1. Initiate login
GET /api/v1/auth/sso/saml/login?company_id=<uuid>

# 2. Callback (POST from IdP)
POST /api/v1/auth/sso/saml/callback

# 3. Get SAML metadata
GET /api/v1/auth/sso/saml/metadata?company_id=<uuid>
```

### SSO Session Management

#### Get Active Sessions
```http
GET /api/v1/auth/sso/sessions
Authorization: Bearer <token>
```

#### Revoke Session
```http
POST /api/v1/auth/sso/sessions/:token/revoke
Authorization: Bearer <token>
```

### MFA/2FA

#### Setup MFA
```http
POST /api/v1/auth/mfa/setup
Authorization: Bearer <token>

Response:
{
  "secret": "BASE32SECRET",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["ABCD1234", "EFGH5678", ...]
}
```

#### Verify and Enable MFA
```http
POST /api/v1/auth/mfa/verify
Authorization: Bearer <token>

{
  "token": "123456"
}
```

#### Get MFA Status
```http
GET /api/v1/auth/mfa/status
Authorization: Bearer <token>

Response:
{
  "enabled": true,
  "backupCodesRemaining": 8
}
```

#### Disable MFA
```http
DELETE /api/v1/auth/mfa
Authorization: Bearer <token>
```

#### Regenerate Backup Codes
```http
POST /api/v1/auth/mfa/backup-codes/regenerate
Authorization: Bearer <token>

Response:
{
  "backupCodes": ["NEW1234", "NEW5678", ...]
}
```

## Environment Variables

Add to your `.env`:

```bash
# SSO Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/sso/google/callback

# SAML (optional, can be configured per company via API)
SAML_ENTRY_POINT=https://idp.example.com/sso/saml
SAML_ISSUER=ats-saas-app
SAML_CALLBACK_URL=http://localhost:3000/api/v1/auth/sso/saml/callback
SAML_CERT=-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----

# MFA Encryption
MFA_ENCRYPTION_KEY=your-32-byte-hex-key

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3001
```

## Configuration Examples

### Google OAuth Setup

1. **Create OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/v1/auth/sso/google/callback`

2. **Configure in ATS**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/sso/config \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "configuration": {
      "clientId": "your-client-id.apps.googleusercontent.com",
      "clientSecret": "your-client-secret",
      "callbackUrl": "http://localhost:3000/api/v1/auth/sso/google/callback"
    },
    "enable_jit_provisioning": true,
    "domain": "@yourcompany.com"
  }'
```

### SAML 2.0 Setup (Okta Example)

1. **Create SAML App in Okta**:
   - Single sign-on URL: `http://localhost:3000/api/v1/auth/sso/saml/callback`
   - Audience URI: `ats-saas-app`
   - Default RelayState: (leave empty)
   - Name ID format: EmailAddress
   - Application username: Email

2. **Get Certificate**:
   - Download certificate from Okta
   - Copy contents to configuration

3. **Configure in ATS**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/sso/config \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "saml",
    "configuration": {
      "entryPoint": "https://yourorg.okta.com/app/yourapp/exk.../sso/saml",
      "issuer": "ats-saas-app",
      "cert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
      "callbackUrl": "http://localhost:3000/api/v1/auth/sso/saml/callback"
    },
    "attribute_mapping": {
      "email": "email",
      "firstName": "firstName",
      "lastName": "lastName",
      "groups": "groups"
    },
    "role_mapping": {
      "sourceAttribute": "groups",
      "mappings": {
        "Admins": "admin",
        "HR Team": "recruiter",
        "Hiring Managers": "hiring_manager"
      },
      "defaultRole": "viewer"
    },
    "enable_jit_provisioning": true
  }'
```

## Frontend Integration

### SSO Login Flow

```typescript
// Initiate Google SSO
function loginWithGoogle() {
  window.location.href = 'http://localhost:3000/api/v1/auth/sso/google/login';
}

// Handle callback (on /auth/callback page)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const refreshToken = params.get('refresh');
  
  if (token) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    navigate('/dashboard');
  }
}, []);
```

### MFA Setup Flow

```typescript
// 1. Setup MFA
async function setupMFA() {
  const response = await fetch('/api/v1/auth/mfa/setup', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const { secret, qrCode, backupCodes } = await response.json();
  
  // Display QR code to user
  setQrCodeImage(qrCode);
  
  // Show backup codes (user should save these!)
  setBackupCodes(backupCodes);
}

// 2. Verify MFA token
async function verifyMFA(token: string) {
  const response = await fetch('/api/v1/auth/mfa/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  
  if (response.ok) {
    alert('MFA enabled successfully!');
  }
}

// 3. During login (if MFA enabled)
async function loginWithMFA(email: string, password: string, mfaToken: string) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, mfaToken }),
  });
  
  return response.json();
}
```

## Security Considerations

### MFA Secret Storage
- Secrets are encrypted using AES-256-CBC
- Encryption key must be stored securely (use AWS Secrets Manager in production)
- Never expose raw secrets in logs

### SSO Security
- Always validate SAML assertions
- Verify OAuth tokens with provider
- Use HTTPS in production
- Implement CSRF protection
- Validate redirect URLs

### Session Management
- SSO sessions expire after 24 hours
- Implement session renewal
- Allow users to revoke sessions
- Log all session activities

## Testing

### Test MFA Flow
```bash
# 1. Setup MFA
curl -X POST http://localhost:3000/api/v1/auth/mfa/setup \
  -H "Authorization: Bearer <token>"

# 2. Use Google Authenticator app to scan QR code

# 3. Verify with TOTP token
curl -X POST http://localhost:3000/api/v1/auth/mfa/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'

# 4. Check status
curl -X GET http://localhost:3000/api/v1/auth/mfa/status \
  -H "Authorization: Bearer <token>"
```

### Test SSO Configuration
```bash
# Create test config
curl -X POST http://localhost:3000/api/v1/auth/sso/config \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d @sso-config.json

# Test config
curl -X POST http://localhost:3000/api/v1/auth/sso/config/<config-id>/test \
  -H "Authorization: Bearer <admin-token>"
```

## Files Created

### Entities
- `src/auth/sso/entities/sso-configuration.entity.ts`
- `src/auth/sso/entities/sso-session.entity.ts`
- `src/auth/sso/entities/mfa-secret.entity.ts`

### Services
- `src/auth/sso/services/sso.service.ts`
- `src/auth/sso/services/mfa.service.ts`

### Strategies
- `src/auth/sso/strategies/google.strategy.ts`
- `src/auth/sso/strategies/saml.strategy.ts`

### Controllers
- `src/auth/sso/controllers/sso.controller.ts`
- `src/auth/sso/controllers/mfa.controller.ts`

### DTOs
- `src/auth/sso/dto/sso-config.dto.ts`
- `src/auth/sso/dto/mfa.dto.ts`

### Module
- `src/auth/sso/sso.module.ts`

### Migration
- `src/database/migrations/1736273400000-CreateSsoTables.ts`

## Dependencies Added
```json
{
  "passport-saml": "^3.2.4",
  "@node-saml/node-saml": "^latest",
  "@node-saml/passport-saml": "^latest",
  "passport-oauth2": "^1.7.0",
  "passport-google-oauth20": "^2.0.0",
  "@nestjs/passport": "^latest",
  "passport": "^0.6.0",
  "speakeasy": "^2.0.0",
  "qrcode": "^1.5.3"
}
```

## Next Steps

### Phase 15: AI Features
- Resume parsing with AI
- Smart candidate matching
- Automated screening questions
- Interview intelligence

### Optional Enhancements for Phase 14
- Microsoft OAuth provider
- GitHub OAuth provider
- LDAP/Active Directory integration
- SCIM user provisioning
- WebAuthn/FIDO2 support

---

**Status**: ✅ Phase 14 COMPLETE  
**Date**: January 7, 2026
