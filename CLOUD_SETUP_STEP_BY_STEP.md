# Cloud setup: step-by-step (GitHub + Azure)

Use this **in order**. You are still in **development** with **no production users** yet, so this path is: get a **staging / dev-in-cloud** environment first; harden for real production later.

**What you already have:** GitHub account, Azure account, your own domain, Microsoft 365 (email).  
**What this app needs in the cloud:** PostgreSQL, Redis (for Bull jobs), Node API (NestJS), two static React sites (Vite builds).

### Already done in this repo (no Azure login required)

| Item | Purpose |
|------|--------|
| Root [`.gitignore`](./.gitignore) | Keeps `.env` and build artifacts out of Git |
| [`.env.example`](./.env.example) | Template including `REDIS_TLS` for Azure Redis |
| [`.github/workflows/azure-api-app-service.yml`](./.github/workflows/azure-api-app-service.yml) | Zips `dist` + prod `node_modules`, deploys to App Service (**manual** *Run workflow*) |
| [`.github/workflows/azure-swa-business.yml`](./.github/workflows/azure-swa-business.yml) | Deploys `frontend/business` to Static Web Apps |
| [`.github/workflows/azure-swa-super-admin.yml`](./.github/workflows/azure-swa-super-admin.yml) | Deploys `frontend/super-admin` to Static Web Apps |
| [`frontend/*/staticwebapp.config.json`](./frontend/business/staticwebapp.config.json) | SPA fallback for React Router on Azure |
| Bull Redis TLS | Set `REDIS_TLS=true` with Azure Cache for Redis (port **6380**) — see [`async-jobs.module.ts`](./src/modules/async-jobs/async-jobs.module.ts) |

**GitHub configuration after Azure resources exist**

| Where | Name | Value |
|-------|------|--------|
| **Secrets** | `AZURE_WEBAPP_PUBLISH_PROFILE` | Contents of App Service *Get publish profile* |
| **Secrets** | `AZURE_STATIC_WEB_APPS_API_TOKEN_BUSINESS` | Static Web App → *Manage deployment token* |
| **Secrets** | `AZURE_STATIC_WEB_APPS_API_TOKEN_SUPER_ADMIN` | Second Static Web App token |
| **Variables** | `AZURE_WEBAPP_NAME` | App Service name only (e.g. `ats-api-dev`) |
| **Variables** | `VITE_API_BASE_URL_BUSINESS` | e.g. `https://YOUR-API.azurewebsites.net/api/v1` |
| **Variables** | `VITE_API_BASE_URL_SUPER_ADMIN` | e.g. `https://YOUR-API.azurewebsites.net/api` |

Then: **Actions** → run **Azure — deploy API**, then each Static Web Apps workflow. App Service **Startup Command** should be `node dist/main.js`.

---

## Before step 1 — know where your domain’s DNS lives

Your **email** can be Microsoft 365 while **DNS** (A/CNAME records) lives somewhere else (GoDaddy, Cloudflare, registrar, etc.).

- Log in where you **bought the domain** or where **nameservers** point.
- You will add records like `api.yourdomain.com` → Azure later.

You do **not** need to share passwords with anyone; only **you** add DNS when the guide says so.

---

## Step 1 — Put the code on GitHub

1. On GitHub: **New repository** (private recommended), e.g. `ats-saas`.
2. On your PC, in the project folder (this repo):
   - If not already a git repo: `git init`
   - A root **`.gitignore`** is already included (`.env`, `node_modules`, `dist`, etc.).
   - **Never commit** real `.env` files or API keys.
3. Add remote, commit, push:
   - `git remote add origin https://github.com/YOUR_USER/ats-saas.git`
   - `git add -A` → `git commit -m "Initial push"` → `git push -u origin main` (or `master`).

**Done when:** Code is visible in GitHub (private is fine).

---

## Step 2 — Azure: subscription, resource group, region

1. Sign in to [Azure Portal](https://portal.azure.com).
2. Confirm **Subscription** is active (you mentioned credits — that’s fine for dev).
3. **Create a resource group**, e.g. `rg-ats-dev`, in one region close to you (e.g. **India Central** if that’s your audience).

**Done when:** Empty resource group exists.

---

## Step 3 — PostgreSQL (Azure Database for PostgreSQL – Flexible Server)

1. **Create** → search **Azure Database for PostgreSQL** → **Flexible server**.
2. Settings that usually work for dev:
   - **Workload:** Development (or smallest general SKU).
   - **Admin username / password:** save in a password manager (you’ll use these in Step 6).
   - **Networking:** For simplest first deploy, allow Azure services; you can tighten firewall later. Add your **current PC public IP** for admin tools if you use pgAdmin from home.
3. After create: note **host** (FQDN), **port** (5432), database name (create `ats_saas` or match `DB_DATABASE` in your `.env`).

**Backend env vars (for later):** `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`.

**Done when:** Server is running and you can connect (optional: test with pgAdmin).

---

## Step 4 — Redis (Azure Cache for Redis)

1. **Create** → **Azure Cache for Redis**.
2. Choose a **small** tier for dev (e.g. Basic C0 — enough to verify Bull).
3. After create: note **host**, **port**, **access key** (primary).

**Backend env vars (for later):** `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.

**Note:** Azure Cache for Redis usually uses **port 6380** and **TLS**. Your current Bull config only passes host/port/password; if the API fails to connect to Redis, the next fix is adding TLS options in code (we can do that when you reach this step).

**Done when:** Cache shows “Running” and you have host/port/key.

---

## Step 5 — App Service plan + Web App (API only)

1. **Create** → **Web App** (publish: **Code**, runtime: **Node 20 LTS**, OS **Linux**).
2. Put it in `rg-ats-dev`, pick a **unique** name → URL will be `https://YOUR-APP-NAME.azurewebsites.net`.
3. Under **Configuration** → **General settings**:
   - **Startup command** (typical for Nest): `node dist/main.js` (after build produces `dist/`).
   - **WebSockets:** On (for Socket.io).
4. **Deployment:** Easiest first path — **Deployment Center** → source **GitHub** → authorize → pick repo/branch → Azure builds and deploys.  
   - Your repo must build with something like `npm ci` + `npm run build` at the **root** (backend). If the repo is monorepo-only root, that’s fine; if Azure needs a subfolder, set **Application settings** or use a custom build command in Azure DevOps / GitHub Actions later.

**Important for Nest on App Service:**

- Listen on **`process.env.PORT`** (your `main.ts` already uses `PORT`; Azure sets `PORT` automatically — often **8080**).
- Set **`WEBSITES_PORT=8080`** in Application settings if docs require it for your stack.
- **`HOST=0.0.0.0`** is typical for containers/App Service.

**Done when:** The app URL returns something (even an error) — proves deploy pipeline works.

---

## Step 6 — Point the API at PostgreSQL + Redis

In App Service → **Configuration** → **Application settings**, add (values from Steps 3–4):

| Name | Example / note |
|------|------------------|
| `DB_HOST` | Flexible Server hostname |
| `DB_PORT` | `5432` |
| `DB_USERNAME` | admin user |
| `DB_PASSWORD` | (as secret) |
| `DB_DATABASE` | `ats_saas` |
| `REDIS_HOST` | Redis hostname |
| `REDIS_PORT` | Azure Redis port (often `6380` with SSL — verify in portal) |
| `REDIS_PASSWORD` | primary key |
| `NODE_ENV` | `production` |
| `JWT_SECRET` / others | copy from your local `.env` **without** committing them |

Copy **all** other required vars from your **local** `.env` (Google OAuth, S3, email, etc.) — still no secrets in Git.

Then run migrations **once** against cloud DB (from your PC is OK):

```bash
# Locally, point .env at Azure PostgreSQL (or use env vars), then:
npm run migration:run
```

**Done when:** API starts without DB errors and `/health` works if you have it.

---

## Step 7 — CORS and public URL

1. In Application settings set **`CORS_ORIGIN`** (or whatever your code reads — your `main.ts` uses `CORS_ORIGIN`) to your **future** frontend URLs, e.g. `https://your-business-app.azurestaticapps.net,https://your-admin-app.azurestaticapps.net` (comma-separated if supported by your code).
2. Set **`PUBLIC_HOST`** to your public API hostname (e.g. `https://YOUR-APP.azurewebsites.net` or custom domain later).

**Done when:** Browser calls from deployed SPA don’t fail on CORS for preflight.

---

## Step 8 — Deploy the two React apps (Static Web Apps)

Repeat **twice** (business + super-admin), or use two apps in one SWA with monorepo config (advanced).

**Simple path — two Static Web Apps:**

1. **Create** → **Static Web App** → link **GitHub** same repo.
2. **App location:** `frontend/business` or `frontend/super-admin`.
3. **Build:** `npm run build` (Azure suggests `react` preset; Vite output is usually `dist`).
4. **Output location:** `dist`.

For **production**, set **Application settings** in each Static Web App (or build-time env in GitHub Actions workflow Azure generates):

- **`VITE_API_BASE_URL`** = `https://YOUR-API.azurewebsites.net/api/v1` (business)  
- Super-admin: **`VITE_API_BASE_URL`** = `https://YOUR-API.azurewebsites.net/api` (match your [API_URL.md](./API_URL.md) prefixes)

**Done when:** Both sites load in the browser and can call the API (you may need Step 7 CORS updates).

---

## Step 9 — Custom domain + HTTPS (optional but recommended)

1. **App Service** → **Custom domains** → add `api.yourdomain.com` → follow wizard → add the **TXT/CNAME** records at your DNS host.
2. **Static Web Apps** → **Custom domains** for `app.yourdomain.com` and `admin.yourdomain.com` (or your chosen hostnames).
3. Update **`CORS_ORIGIN`** and **`VITE_API_BASE_URL`** to use `https://api.yourdomain.com`.

**Done when:** HTTPS works on your domain.

---

## Step 10 — OAuth, email, and third-party dashboards

1. **Google / SAML:** Add **authorized redirect URIs** for production URLs (Azure app URL or `https://api.yourdomain.com/...`).
2. **SendGrid / SMTP:** Ensure production sender domain is verified if required.
3. **AWS S3:** Bucket policy / CORS if the browser uploads directly; API keys stay in App Service settings.

**Done when:** Login and file upload flows work end-to-end on cloud URLs.

---

## What I need from you (only when you reach that step)

| When | What |
|------|------|
| Step 1 | Nothing — you push code yourself. |
| Step 3–4 | You choose **region** and **passwords**; keep them private. |
| Step 5 | If deploy fails: **exact error text** from Azure “Logs” or GitHub Actions (no secrets). |
| Step 8–9 | **Where DNS is managed** (registrar name is enough). |
| OAuth | **Redirect URL** your app uses (path after login) — from your Nest auth module. |

You don’t need to send domain passwords or Azure keys to anyone.

---

## After your app is “production ready”

- Add **backups** on PostgreSQL, **staging** slot or second resource group, **Application Insights**, **Key Vault** references instead of plain app settings, and **alerts**.
- Review **Redis TLS** and **Bull** settings for your exact Azure Redis tier.

---

## Next action for you

**Do Step 1 only** (GitHub push). When that’s done, open **Step 2** in the portal and create the resource group. If anything blocks you (e.g. Azure build fails), paste the **error message** (redact secrets) and we can fix that step next.
