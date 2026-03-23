/**
 * One-off / dev helper: list public tables in DB from .env (root .env).
 * Usage: node scripts/db-list-tables.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'ats_saas',
    });

    await client.connect();
    const db = await client.query('SELECT current_database() AS name');
    const ver = await client.query('SELECT version() AS v');

    const tables = await client.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    `);

    let migrationRows = [];
    try {
        const mig = await client.query(
            `SELECT id, timestamp, name FROM migrations ORDER BY timestamp, id`
        );
        migrationRows = mig.rows;
    } catch (e) {
        migrationRows = null;
    }

    await client.end();

    console.log(JSON.stringify({
        database: db.rows[0].name,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        publicBaseTableCount: tables.rows.length,
        tables: tables.rows.map((r) => r.tablename),
        migrationsTableExists: migrationRows !== null,
        migrationsAppliedCount: migrationRows ? migrationRows.length : null,
        postgresVersionPrefix: ver.rows[0].v.split('\n')[0].slice(0, 80),
    }, null, 2));
}

main().catch((err) => {
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exit(1);
});
