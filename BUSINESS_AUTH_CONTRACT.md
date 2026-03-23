# Business Auth Contract (Confirmed from Backend Code)

This document summarizes the real backend authentication contract for the Business (tenant) UI. All details are taken directly from the NestJS backend source under `src/auth/**`.

- Base path prefix: `/api/v1`
- Controller: `AuthController` at `src/auth/controllers/auth.controller.ts`
- Service: `AuthService` at `src/auth/services/auth.service.ts`

## A) Business Auth APIs

### 1) Login
- Endpoint: `POST /api/v1/auth/login`
- Request body (from `LoginDto`):
  ```json
  {
    "email": "string (email)",
    "password": "string (min 6)"
  }
  ```
- Response (from `AuthService.login`):
  ```json
  {
    "success": true,
    "data": {
      "token": "<JWT access token>",
      "refreshToken": "<JWT refresh token>",
      "user": {
        "id": "string",
        "email": "string",
        "firstName": "string",
        "role": "string",
        "permissions": ["string", "..."],
        "company": {
          "id": "string",
          "name": "string"
        }
      }
    }
  }
  ```
  Notes:
  - Access token field is named `token` (NOT `accessToken`).
  - `user.company` is included inside the `user` object.
  - Current implementation returns a fixed company `{ id: "default", name: "ATS System" }` (single-tenant simplification in code).

### 2) Refresh
- Endpoint: `POST /api/v1/auth/refresh`
- Request body (from `RefreshTokenDto`):
  ```json
  {
    "refreshToken": "string"
  }
  ```
- Response (from `AuthService.refreshToken`):
  ```json
  {
    "success": true,
    "data": {
      "token": "<new JWT access token>",
      "refreshToken": "<new JWT refresh token>"
    }
  }
  ```

### 3) Logout
- Endpoint: `POST /api/v1/auth/logout`
- Auth: Requires `Authorization: Bearer <token>` and tenant context (`TenantGuard`).
- Request body: none.
- Response:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 4) Useful auxiliary endpoints (optional for later)
- Get effective permissions: `GET /api/v1/auth/me/permissions` (Tenant & Role guarded) → `{ success, data: { permissions: string[] } }`
- Check permission: `POST /api/v1/auth/check-permission` with `{ permission }` → `{ success, data: { hasPermission, permission } }`

## Response Field Reference (from code)
- Access token: `data.token` (string)
- Refresh token: `data.refreshToken` (string)
- User: `data.user`
  - `id` (string)
  - `email` (string)
  - `firstName` (string)
  - `role` (string)
  - `permissions` (string[])
  - `company` (object with `id`, `name`)

Source links:
- `src/auth/controllers/auth.controller.ts`
- `src/auth/services/auth.service.ts`
- `src/auth/dtos/login.dto.ts`
- `src/auth/dtos/refresh-token.dto.ts`

## B) Who Logs In Here? (Roles)

Login is available to active company users. Default system roles created per company (from `src/database/seeds/default-roles-permissions.seed.ts`):
- Admin (`slug: admin`)
- Recruiter (`slug: recruiter`)
- Hiring Manager (`slug: hiring_manager`)
- Viewer (`slug: viewer`)

Notes:
- Interview participation roles (`InterviewerRole` enum with values `interviewer | hiring_manager | recruiter`) exist specifically for interview assignments under `src/modules/interviews/**`. These are not a separate login role by default.
- Additional roles can be created per company; the four above are the seeded defaults.

## Implementation Notes for Business UI (Auth Only)
- Use `POST /api/v1/auth/login` with `{ email, password }`.
- Store `token` and `refreshToken` from the response.
- Attach `Authorization: Bearer <token>` for authenticated requests.
- On 401, call `POST /api/v1/auth/refresh` with the stored `refreshToken` and rotate both tokens.
- For logout, call `POST /api/v1/auth/logout` with the current `Bearer` token; then clear tokens locally.

This contract is confirmed directly from backend code and safe to implement against.
