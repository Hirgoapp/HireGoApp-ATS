# Canonical API port & URLs (single source of truth)

This project uses **one HTTP port for the backend API**:

| Item | Value |
|------|--------|
| **Port** | **3001** |
| **Local base URL** | **http://localhost:3001** |
| **Tenant API prefix** | **http://localhost:3001/api/v1** |
| **Super-admin API prefix** | **http://localhost:3001/api** (e.g. `/api/super-admin/...`) |
| **Swagger UI** | **http://localhost:3001/api** |
| **Health** | **http://localhost:3001/health** |
| **Root (API info + portal links)** | **http://localhost:3001/** — public JSON, no login token |

## Configuration

- Set **`PORT=3001`** in the repo root **`.env`** (already the default in code).
- **Do not** run multiple API processes; if **3001** is busy, stop the old one (`npm run ports:check`).
- Frontends (dev):
  - **Business:** `frontend/business/.env` → `VITE_API_PROXY_TARGET=http://localhost:3001`
  - **Super Admin:** `frontend/super-admin/.env` → `VITE_API_PROXY_TARGET=http://localhost:3001` and `VITE_API_BASE_URL` pointing at the same host/port.

## LAN / another machine

If you use your PC’s IP (e.g. **`192.168.x.x`**), only the **host** changes; the **port stays 3001**:

- **http://192.168.10.4:3001** (example — match your `PUBLIC_HOST` + `PORT`)

The backend **does not** auto-switch to 3002, 3006, etc. If startup fails with “port in use”, free **3001** and restart.

## JD file uploads (PDF scans)

If a PDF has **no text layer** (common for scans), the API can **rasterize pages** (`pdf-to-img` / PDF.js) and run **Tesseract OCR**. Configure in `.env` (see `.env.example`): `JD_PDF_OCR_ENABLED`, `JD_PDF_OCR_MIN_CHARS`, `JD_PDF_OCR_MAX_PAGES`, `JD_PDF_OCR_LANG`. **Requires Node 20+** (pdf-to-img). First OCR run may download language data; quality depends on scan resolution.

## Frontends (dev) — login URLs

| App | URL (try this first) | If the browser says it can’t find `localhost` |
|-----|----------------------|-----------------------------------------------|
| **Business** | **http://localhost:5180/login** | **http://127.0.0.1:5180/login** |
| **Super Admin** | **http://localhost:5174/login** | **http://127.0.0.1:5174/login** |

Use **`http://`** (not `https://`). From another device on your Wi‑Fi, use your PC’s LAN IP (Vite prints **Network:** in the terminal), e.g. **http://192.168.x.x:5174/login**.

Vite is configured with **`strictPort: true`**: Super Admin must stay on **5174** and Business on **5180**. If that port is busy, fix the conflict (stop the other process) and restart **`npm run dev:full`** — the app will not silently move to another port.

## Tenant API — search & matching (quick reference)

| Area | Base path | Notes |
|------|-----------|--------|
| **Global text search** | `GET /api/v1/search?q=…` | Cross-entity search (requires `search:view`). |
| **Semantic / embeddings / analytics** | `/api/v1/search/semantic/...` | e.g. `POST .../candidates`, `GET .../health` (not under bare `/search/...`). |
| **Job match suggestions** | `GET /api/v1/matching/jobs/:jobId/suggestions` | Rule-based ranking; requires `jobs:view` and `jobs_module` feature. |
| **Submissions embeds** | `GET /api/v1/submissions?...&include=candidate,job` | Comma-separated: `candidate` / `job` (or plural forms). Same `include` on job- and candidate-scoped submission routes. |
