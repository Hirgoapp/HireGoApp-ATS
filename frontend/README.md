# ATS frontends (two portals only)

This folder contains **exactly two** production UIs:

| Portal | Folder | Dev command | Default URL |
|--------|--------|-------------|-------------|
| **Super Admin** (multi-tenant / platform owner) | `super-admin/` | `npm run dev` | http://localhost:5174 |
| **Business** (tenant company users) | `business/` | `npm run dev` | http://localhost:5180 |

## Where did the “third” app go?

Previously there was a **separate** Vite app at `frontend/` root (`frontend/src`, HireGoApp / “Recruitment platform” login). That was an **older / parallel scaffold**, not the same as the dedicated Super Admin or Business apps. It has been **removed** so only the two portals remain.

## Run everything (API + both UIs)

From the **repository root** (`E:\ATS`):

```bash
npm run dev:full
```

This runs `scripts/dev-full.js`: backend + `frontend/super-admin` + `frontend/business`.

## API port — **3001 only**

The backend uses **exactly one port: `3001`** (see repo root **`API_URL.md`**). It does **not** auto-switch to 3002/3006.

- Root `.env`: **`PORT=3001`**
- `frontend/business/.env`: **`VITE_API_PROXY_TARGET=http://localhost:3001`**
- `frontend/super-admin/.env`: **`VITE_API_PROXY_TARGET=http://localhost:3001`** and **`VITE_API_BASE_URL`** on the same host/port

`npm run dev:full` frees **3001** before starting the API. If **3001** is still busy, stop the other process (`npm run ports:check`).

## Legacy `frontend/node_modules`

If `frontend/node_modules` still exists after removing the root app, some files may be locked while a dev server is running. **Stop all Node/Vite processes**, then delete `frontend/node_modules` manually (Explorer or `Remove-Item -Recurse -Force frontend\node_modules`).
