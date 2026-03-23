# Super Admin – Module Testing Checklist (in order)

Test each module **one by one** in this order. Prerequisites: backend API running, super admin frontend running, and at least one super admin user to log in.

---

## Before you start

1. **Start backend** (from project root):
   ```bash
   npm run start:dev
   ```
2. **Start super admin frontend**:
   ```bash
   cd frontend/super-admin && npm run dev
   ```
3. **Have super admin credentials** (e.g. from seed or your env). Default login is often at `http://localhost:5173` (or the port Vite shows).

---

## 1. Login (Auth)

**Route:** `/` or `/login` (redirects to login if not authenticated)

**What to check:**

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Open super admin URL in browser | Login page loads |
| 1.2 | Enter wrong email/password | Error message, no redirect |
| 1.3 | Enter valid super admin email & password | Redirect to dashboard (or `/companies`) |
| 1.4 | Refresh page while logged in | Stay logged in (token persisted) |
| 1.5 | Click Logout | Redirect to login, sidebar disappears |

**APIs used:** `POST /api/super-admin/auth/login`, `POST /api/super-admin/auth/refresh` (on 401).

---

## 2. Dashboard

**Route:** `/dashboard`

**What to check:**

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | After login, go to Dashboard (or click “Dashboard” in sidebar) | Page loads without error |
| 2.2 | Check stat cards | “Total Companies” and “Super Admin Users” show numbers (or 0) |
| 2.3 | Check for error banner | No red error; if API fails, error message is shown |
| 2.4 | Check “System Health” | Shown (e.g. “Operational” or similar) |

**APIs used:** `GET /super-admin/companies?page=1&limit=1`, `GET /super-admin/users?page=1&limit=1`.

**Note:** Dashboard does not call a dedicated “dashboard” API; it uses companies and users list endpoints to derive counts.

---

## 3. Companies

**Route:** `/companies`

**What to check:**

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Click “Companies” in sidebar | Companies list loads (or “No companies found”) |
| 3.2 | Use search box | List filters by name/slug/email (or empty if no match) |
| 3.3 | Click “New Company” | Modal opens with form (name, slug, description, license, initial admin) |
| 3.4 | Submit with invalid data (e.g. empty name) | Validation errors shown, no API call |
| 3.5 | Submit with valid data | Success message, modal closes, new company appears in list |
| 3.6 | Click View (eye) on a company | Navigate to `/companies/:id` (Company Detail) |
| 3.7 | Click Edit (pencil) on a company | Edit modal opens; save updates name/description |
| 3.8 | Click Resend welcome email (mail icon) | Confirm; success or error message |
| 3.9 | Click Delete (trash) on a company | Confirm; company disappears from list (soft-deleted) |
| 3.10 | Pagination (if > 20 companies) | Prev/Next change page and counts |

**APIs used:**  
`GET /super-admin/companies`, `POST /super-admin/companies`, `PATCH /super-admin/companies/:id`, `DELETE /super-admin/companies/:id`, `POST /super-admin/companies/:id/resend-welcome-email`.

---

## 4. Company Detail

**Route:** `/companies/:id`

**What to check:**

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | From Companies list, click View on a company | Company detail page loads |
| 4.2 | Check header | Company name and key info displayed |
| 4.3 | Check “Admins” section | List of company admins (or empty) |
| 4.4 | Check “Modules” / feature toggles (if present) | Modules for this company load |
| 4.5 | “Back to companies” or similar | Returns to `/companies` |

**APIs used:** `GET /super-admin/companies/:id`, `GET /super-admin/companies/:id/admins`, possibly `GET /super-admin/modules/:companyId`.

---

## 5. Users (Super Admin Users)

**Route:** `/users`

**What to check:**

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Click “Users” in sidebar | List of super admin users loads |
| 5.2 | Click “New User” (or Add) | Form modal opens |
| 5.3 | Submit with invalid data (short password, bad email) | Validation errors |
| 5.4 | Submit with valid data | User created, list refreshes, success message |
| 5.5 | Click Delete on a user (not yourself if applicable) | Confirm; user removed from list |
| 5.6 | Pagination / search (if available) | Works as expected |

**APIs used:** `GET /super-admin/users`, `POST /super-admin/users` (or equivalent create), `DELETE /super-admin/users/:id` (if implemented).

---

## 6. Modules (per-company feature toggles)

**Route:** `/modules`

**What to check:**

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Click “Modules” in sidebar | Page loads; company dropdown visible if companies exist |
| 6.2 | Select a company from dropdown | List of feature modules loads for that company |
| 6.3 | Toggle a module ON | Request succeeds; toggle stays ON (and backend stores it) |
| 6.4 | Toggle the same module OFF | Request succeeds; toggle stays OFF |
| 6.5 | Switch to another company | Different company’s module state loads |
| 6.6 | If no companies | Message or empty state, no crash |

**APIs used:** `GET /super-admin/companies` (list), `GET /super-admin/modules/:companyId`, `POST /super-admin/modules/:companyId/enable`, `POST /super-admin/modules/:companyId/disable`.

**Note:** Backend expects request body `{ module: "<key>" }` (fixed in `companyService` to send `module` instead of `moduleKey`).

---

## 7. Licensing

**Route:** `/licensing`

**What to check:**

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Click “Licensing” in sidebar | License tiers (e.g. Basic, Premium, Enterprise) displayed |
| 7.2 | UI for add/edit/delete tier (if present) | Opens forms or modals; no crash |
| 7.3 | Save or create tier (if wired to API) | Success or clear error |

**Note:** This page may use **local/mock data** (e.g. `DEFAULT_TIERS`). If there is no backend for tiers yet, only verify UI and that it doesn’t throw.

---

## 8. Settings (System settings)

**Route:** `/settings`

**What to check:**

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Click “Settings” in sidebar | System settings page loads |
| 8.2 | Change options (e.g. maintenance mode, session timeout) | Values update in UI |
| 8.3 | Click Save | Success message (currently may only persist to `localStorage`) |
| 8.4 | Refresh page | Saved values still shown (if using localStorage) |
| 8.5 | Reset to defaults | Confirmation; settings revert to defaults |

**Note:** Currently may be **localStorage-only** (no backend). Verify UI and persistence as implemented.

---

## Quick reference – test order

1. **Login** – Must work first.
2. **Dashboard** – Quick sanity check (counts).
3. **Companies** – Core CRUD + delete + resend email.
4. **Company Detail** – View one company and its admins/modules.
5. **Users** – Super admin user CRUD.
6. **Modules** – Per-company enable/disable.
7. **Licensing** – Tiers UI (and API if present).
8. **Settings** – System config UI (and API if present).

---

## How to use this checklist

- Run **1. Login** first; fix any auth issues before continuing.
- Then **2. Dashboard** to confirm APIs and navigation.
- Then **3. Companies** (create at least one company for steps 4 and 6).
- Proceed in order; if a step fails, note the step number and error (UI or network) and fix before moving on.

If you tell me which module you’re on (e.g. “we’re testing Companies”), I can give exact steps and what to look for in the Network tab or console for that module.
