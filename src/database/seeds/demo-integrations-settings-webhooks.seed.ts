import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { createHash } from 'crypto';

dotenv.config();

const DEMO_COMPANY_ID = 'aee933be-7729-434e-b078-17c2f9ae4119';

function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

function sha256(s: string) {
    return createHash('sha256').update(s).digest('hex');
}

function pick<T>(arr: readonly T[], idx: number) {
    return arr[idx % arr.length];
}

async function main() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'ats_saas',
        synchronize: false,
    });

    await dataSource.initialize();
    console.log('✅ Database connected');

    const admin = await dataSource.query(
        `select id from users where company_id=$1 and email=$2 limit 1`,
        [DEMO_COMPANY_ID, 'demo.admin@dummy.com'],
    );
    if (!admin?.[0]?.id) throw new Error('Demo admin missing. Run seed:demo first.');
    const adminId = admin[0].id as string;

    // -------------------------
    // Integrations
    // -------------------------
    const integrations = [
        {
            integration_type: 'slack',
            config: { workspace: 'demo-workspace', channel: '#demo-alerts', is_demo: true },
            is_active: true,
        },
        {
            integration_type: 'google_calendar',
            config: { connected: false, reason: 'demo_mode', is_demo: true },
            is_active: false,
        },
        {
            integration_type: 'email',
            config: { provider: 'graph', connected: false, is_demo: true },
            is_active: false,
        },
    ] as const;

    let integrationsUpserted = 0;
    for (const i of integrations) {
        const existing = await dataSource.query(
            `select id from integrations where company_id=$1 and integration_type=$2 limit 1`,
            [DEMO_COMPANY_ID, i.integration_type],
        );
        if (existing?.[0]?.id) {
            await dataSource.query(
                `update integrations set config=$3::jsonb, is_active=$4, updated_at=now() where id=$1 and company_id=$2`,
                [existing[0].id, DEMO_COMPANY_ID, JSON.stringify(i.config), i.is_active],
            );
        } else {
            await dataSource.query(
                `insert into integrations (company_id, integration_type, config, is_active) values ($1,$2,$3::jsonb,$4)`,
                [DEMO_COMPANY_ID, i.integration_type, JSON.stringify(i.config), i.is_active],
            );
        }
        integrationsUpserted++;
    }
    console.log(`✅ Integrations ensured: ${integrationsUpserted}`);

    // -------------------------
    // Settings
    // -------------------------
    const settings = [
        { key: 'branding', value: { brandColor: '#2563EB', logoUrl: null, is_demo: true } },
        { key: 'email', value: { fromName: 'Demo Account ATS', fromEmail: 'demo@dummy.com', is_demo: true } },
        { key: 'security', value: { mfaRequired: false, sessionTimeoutMinutes: 60, is_demo: true } },
        { key: 'recruiting', value: { defaultCurrency: 'USD', defaultCountry: 'USA', is_demo: true } },
    ] as const;

    let settingsUpserted = 0;
    for (const s of settings) {
        const existing = await dataSource.query(
            `select id from settings where company_id=$1 and setting_key=$2 limit 1`,
            [DEMO_COMPANY_ID, s.key],
        );
        if (existing?.[0]?.id) {
            await dataSource.query(
                `update settings set setting_value=$3::jsonb, updated_at=now() where id=$1 and company_id=$2`,
                [existing[0].id, DEMO_COMPANY_ID, JSON.stringify(s.value)],
            );
        } else {
            await dataSource.query(
                `insert into settings (company_id, setting_key, setting_value) values ($1,$2,$3::jsonb)`,
                [DEMO_COMPANY_ID, s.key, JSON.stringify(s.value)],
            );
        }
        settingsUpserted++;
    }
    console.log(`✅ Settings ensured: ${settingsUpserted}`);

    // -------------------------
    // Feature flags (global registry) + company_feature_flags (tenant toggles)
    // -------------------------
    const flags = [
        { name: 'demo_mode_banner', description: 'Show demo mode banner in UI', flag_type: 'ui', status: 'active' },
        { name: 'advanced_search', description: 'Enable advanced search filters', flag_type: 'ui', status: 'active' },
        { name: 'webhooks', description: 'Enable webhook subscriptions', flag_type: 'backend', status: 'active' },
        { name: 'offers', description: 'Enable offers module', flag_type: 'module', status: 'active' },
        { name: 'interviews', description: 'Enable interviews module', flag_type: 'module', status: 'active' },
    ] as const;

    let flagsEnsured = 0;
    for (const f of flags) {
        const existing = await dataSource.query(`select id from feature_flags where name=$1 limit 1`, [f.name]);
        if (existing?.[0]?.id) {
            await dataSource.query(
                `update feature_flags set description=$2, flag_type=$3, status=$4, updated_at=now() where id=$1`,
                [existing[0].id, f.description, f.flag_type, f.status],
            );
        } else {
            await dataSource.query(
                `insert into feature_flags (name, description, flag_type, status, is_enabled_globally, config, created_by_id)
                 values ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
                [f.name, f.description, f.flag_type, f.status, false, JSON.stringify({ is_demo: true }), adminId],
            );
        }
        flagsEnsured++;
    }

    let companyFlagsEnsured = 0;
    for (const f of flags) {
        const existing = await dataSource.query(
            `select id from company_feature_flags where company_id=$1 and feature_key=$2 limit 1`,
            [DEMO_COMPANY_ID, f.name],
        );
        if (existing?.[0]?.id) {
            await dataSource.query(
                `update company_feature_flags set is_enabled=$3, updated_at=now() where id=$1 and company_id=$2`,
                [existing[0].id, DEMO_COMPANY_ID, true],
            );
        } else {
            await dataSource.query(
                `insert into company_feature_flags (company_id, feature_key, is_enabled) values ($1,$2,$3)`,
                [DEMO_COMPANY_ID, f.name, true],
            );
        }
        companyFlagsEnsured++;
    }

    console.log(`✅ Feature flags ensured: global=${flagsEnsured}, company=${companyFlagsEnsured}`);

    // -------------------------
    // API keys + usage
    // -------------------------
    const apiKeys = [
        { name: 'Demo Key (Read Only)', scopes: ['read'], preview: 'demo_ro_****' },
        { name: 'Demo Key (Read/Write)', scopes: ['read', 'write'], preview: 'demo_rw_****' },
    ] as const;

    let apiKeysEnsured = 0;
    const ensuredIds: string[] = [];
    for (let i = 0; i < apiKeys.length; i++) {
        const k = apiKeys[i];
        const existing = await dataSource.query(
            `select id from api_keys where company_id=$1 and name=$2 and deleted_at is null limit 1`,
            [DEMO_COMPANY_ID, k.name],
        );
        if (existing?.[0]?.id) {
            ensuredIds.push(existing[0].id);
            apiKeysEnsured++;
            continue;
        }

        const rawKey = `demo_${i}_${DEMO_COMPANY_ID}_${k.name}`; // never exposed; hash only
        const key_hash = sha256(rawKey);
        const ins = await dataSource.query(
            `insert into api_keys (company_id, key_hash, key_preview, name, scopes, is_active, last_used_at, created_by_id, expires_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             returning id`,
            [
                DEMO_COMPANY_ID,
                key_hash,
                k.preview,
                k.name,
                k.scopes,
                true,
                daysAgo(3 + i).toISOString().slice(0, 19).replace('T', ' '),
                adminId,
                null,
            ],
        );
        ensuredIds.push(ins[0].id);
        apiKeysEnsured++;
    }
    console.log(`✅ API keys ensured: ${apiKeysEnsured}`);

    // Seed a small amount of usage data for charts/filters
    const usageBefore = await dataSource.query(
        `select count(*)::int as n from api_key_usage where company_id=$1`,
        [DEMO_COMPANY_ID],
    );
    const usageBeforeTotal = Number(usageBefore?.[0]?.n ?? 0);
    const usageTarget = 80;
    let usageInserted = 0;
    const paths = ['/api/v1/jobs', '/api/v1/candidates', '/api/v1/submissions', '/api/v1/reports'] as const;
    const methods = ['GET', 'POST', 'PATCH'] as const;

    let cursor = 0;
    while (usageBeforeTotal + usageInserted < usageTarget && cursor < 2000) {
        const apiKeyId = pick(ensuredIds, cursor);
        const path = pick(paths, cursor);
        const method = pick(methods, cursor);
        const status_code = pick([200, 200, 200, 201, 400, 401, 429], cursor);

        await dataSource.query(
            `insert into api_key_usage (company_id, api_key_id, path, method, ip_address, user_agent, status_code, created_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
                DEMO_COMPANY_ID,
                apiKeyId,
                path,
                method,
                '192.168.10.20',
                'DemoSeed/1.0',
                status_code,
                daysAgo(20 - (cursor % 18)).toISOString().slice(0, 19).replace('T', ' '),
            ],
        );

        usageInserted++;
        cursor++;
    }
    console.log(`✅ API key usage seeded: +${usageInserted} (before=${usageBeforeTotal}, target=${usageTarget})`);

    // -------------------------
    // Webhooks + logs
    // -------------------------
    const webhookEvents = ['candidate.created', 'submission.created', 'interview.scheduled', 'offer.issued'] as const;
    const webhookBase = 'https://webhook.site/demo-ats';

    const subsEnsured: string[] = [];
    let webhooksEnsured = 0;
    for (let i = 0; i < webhookEvents.length; i++) {
        const event_type = webhookEvents[i];
        const existing = await dataSource.query(
            `select id from webhook_subscriptions where company_id=$1 and event_type=$2 and deleted_at is null limit 1`,
            [DEMO_COMPANY_ID, event_type],
        );
        if (existing?.[0]?.id) {
            subsEnsured.push(existing[0].id);
            webhooksEnsured++;
            continue;
        }

        const ins = await dataSource.query(
            `insert into webhook_subscriptions
              (company_id, event_type, webhook_url, is_active, headers, created_by_id, target_url, secret, description, retry_config)
             values
              ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10::jsonb)
             returning id`,
            [
                DEMO_COMPANY_ID,
                event_type,
                `${webhookBase}/${event_type}`,
                true,
                JSON.stringify({ 'X-Demo': 'true' }),
                adminId,
                `${webhookBase}/${event_type}`,
                'demo_secret',
                'Demo webhook subscription (non-production)',
                JSON.stringify({ max_retries: 3, retry_delay: 60 }),
            ],
        );
        subsEnsured.push(ins[0].id);
        webhooksEnsured++;
    }
    console.log(`✅ Webhook subscriptions ensured: ${webhooksEnsured}`);

    const logsBefore = await dataSource.query(
        `select count(*)::int as n from webhook_logs where company_id=$1`,
        [DEMO_COMPANY_ID],
    );
    const logsBeforeTotal = Number(logsBefore?.[0]?.n ?? 0);
    const logsTarget = 60;
    let logsInserted = 0;
    cursor = 0;

    while (logsBeforeTotal + logsInserted < logsTarget && cursor < 2000) {
        const subscription_id = pick(subsEnsured, cursor);
        const event_type = pick(webhookEvents, cursor);
        const ok = cursor % 6 !== 0;

        await dataSource.query(
            `insert into webhook_logs
              (company_id, subscription_id, event_type, payload, status_code, is_successful, error_message, attempt_number, created_at, status, http_status, response_body, retry_count, next_retry_at)
             values
              ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [
                DEMO_COMPANY_ID,
                subscription_id,
                event_type,
                JSON.stringify({ is_demo: true, event_type, sample: true }),
                ok ? 200 : 500,
                ok,
                ok ? null : 'Simulated delivery failure (demo)',
                ok ? 1 : 2,
                daysAgo(18 - (cursor % 15)).toISOString().slice(0, 19).replace('T', ' '),
                ok ? 'delivered' : 'failed',
                ok ? 200 : 500,
                ok ? '{"ok":true}' : '{"ok":false}',
                ok ? 0 : 1,
                ok ? null : daysAgo(-(1 + (cursor % 5))).toISOString(),
            ],
        );

        logsInserted++;
        cursor++;
    }
    console.log(`✅ Webhook logs seeded: +${logsInserted} (before=${logsBeforeTotal}, target=${logsTarget})`);

    await dataSource.destroy();
    console.log('✅ Demo integrations/settings/flags/api-keys/webhooks seed complete');
}

main().catch((err) => {
    console.error('❌ Demo integrations/settings seed error:', err);
    process.exit(1);
});

