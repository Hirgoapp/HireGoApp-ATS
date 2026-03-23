/**
 * Smoke test: DB + API + (optional) both Vite dev servers.
 * Run from repo root after `npm run dev:full` (or at least API).
 *
 *   node scripts/dev-smoke.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

const API = `http://127.0.0.1:${process.env.PORT || 3001}`;
const FRONTENDS = [
    { name: 'business', url: 'http://127.0.0.1:5180/login' },
    { name: 'super-admin', url: 'http://127.0.0.1:5174/login' },
];

async function fetchJson(url, opts = {}) {
    const res = await fetch(url, {
        ...opts,
        headers: { Accept: 'application/json', ...(opts.headers || {}) },
    });
    const text = await res.text();
    let body;
    try {
        body = JSON.parse(text);
    } catch {
        body = text.slice(0, 200);
    }
    return { ok: res.ok, status: res.status, body };
}

async function main() {
    const results = { db: null, api: [], tenant: null, superAdmin: null, frontends: [] };

    // --- Database: connectivity + dashboard SQL (submissions.current_stage) ---
    const pg = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'ats_saas',
    });
    try {
        await pg.connect();
        const one = await pg.query(`SELECT id::text FROM companies LIMIT 1`);
        const companyId = one.rows[0]?.id;
        if (!companyId) {
            results.db = { ok: true, note: 'No company row; skipped dashboard SQL' };
        } else {
            await pg.query(
                `SELECT
                    COUNT(*)::int AS total_submissions,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(current_stage, '')) = 'interview')::int AS interviewed_count
                 FROM submissions
                 WHERE company_id = $1 AND deleted_at IS NULL`,
                [companyId],
            );
            results.db = { ok: true, companySample: companyId.slice(0, 8) + '…' };
        }
        await pg.end();
    } catch (e) {
        results.db = { ok: false, error: e.message };
        try {
            await pg.end();
        } catch {
            /* ignore */
        }
    }

    // --- API public routes ---
    for (const path of ['/health', '/']) {
        try {
            const r = await fetchJson(API + path);
            results.api.push({
                path,
                ok: r.ok,
                status: r.status,
                hint: r.ok ? 'ok' : r.body,
            });
        } catch (e) {
            results.api.push({ path, ok: false, error: e.message });
        }
    }

    // --- Tenant login + dashboard overview (demo seed) ---
    try {
        const login = await fetchJson(`${API}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'demo.admin@dummy.com',
                password: 'DemoPass@123',
            }),
        });
        const token =
            login.body?.data?.token ||
            login.body?.token ||
            login.body?.access_token ||
            login.body?.accessToken;
        if (!login.ok || !token) {
            results.tenant = {
                ok: false,
                status: login.status,
                note: 'Demo tenant login failed (run `npm run seed:demo` if you need demo users)',
            };
        } else {
            const dash = await fetchJson(`${API}/api/v1/dashboard/overview`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const kpis = dash.body?.data?.kpis ?? dash.body?.kpis;
            results.tenant = {
                ok: dash.ok && kpis != null,
                status: dash.status,
                kpis: kpis || dash.body,
            };
        }
    } catch (e) {
        results.tenant = { ok: false, error: e.message };
    }

    // --- Super admin login ---
    try {
        const sa = await fetchJson(`${API}/api/super-admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@ats.com',
                password: 'ChangeMe@123',
            }),
        });
        results.superAdmin = {
            ok: sa.ok && !!(sa.body?.data?.accessToken || sa.body?.accessToken),
            status: sa.status,
            note: sa.ok ? 'ok' : 'If 401, run super-admin seed once (see README)',
        };
    } catch (e) {
        results.superAdmin = { ok: false, error: e.message };
    }

    // --- Frontends ---
    for (const f of FRONTENDS) {
        try {
            const r = await fetch(f.url, { redirect: 'manual' });
            const ok = r.status === 200 || r.status === 304 || (r.status >= 300 && r.status < 400);
            results.frontends.push({ name: f.name, url: f.url, ok, status: r.status });
        } catch (e) {
            results.frontends.push({ name: f.name, url: f.url, ok: false, error: e.message });
        }
    }

    console.log(JSON.stringify(results, null, 2));

    const failed =
        !results.db?.ok ||
        results.api.some((a) => !a.ok) ||
        !results.tenant?.ok ||
        results.frontends.some((f) => !f.ok);
    process.exit(failed ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
