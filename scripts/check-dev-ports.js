/**
 * Print which common dev ports are free vs in use (bind probe on 0.0.0.0).
 * Run: node scripts/check-dev-ports.js
 *
 * Canonical API port for this repo: 3001 — see API_URL.md
 */
const net = require('node:net');

const HOST = process.env.HOST || '0.0.0.0';
const PORTS = (process.env.CHECK_PORTS || '3000,3001,3002,3003,3004,3005,3006,5174,5180')
    .split(',')
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => !Number.isNaN(n));

function probePort(host, port) {
    return new Promise((resolve) => {
        const srv = net.createServer();
        srv.unref();
        srv.once('error', () => resolve({ port, free: false }));
        srv.listen({ port, host, exclusive: true }, () => {
            srv.close(() => resolve({ port, free: true }));
        });
    });
}

async function main() {
    console.log(`\n🔍 Dev port check (bind probe on ${HOST})\n`);
    const results = [];
    for (const port of PORTS) {
        // eslint-disable-next-line no-await-in-loop
        results.push(await probePort(HOST, port));
    }
    const free = results.filter((r) => r.free).map((r) => r.port);
    const busy = results.filter((r) => !r.free).map((r) => r.port);

    for (const r of results) {
        console.log(`   ${r.free ? '✅ FREE ' : '⛔ BUSY'}  ${r.port}`);
    }

    console.log('\n📌 Summary');
    console.log(`   Free:  ${free.length ? free.join(', ') : '(none in list)'}`);
    console.log(`   Busy:  ${busy.length ? busy.join(', ') : '(none)'}`);
    if (free.length) {
        console.log(`\n💡 Backend API must use port 3001 only (see API_URL.md).`);
        if (!free.includes(3001)) {
            console.log('   ⚠️  3001 is BUSY — free it before starting the API, or the server will exit.');
        } else {
            console.log('   ✅ 3001 is free — OK to start the API.');
        }
        console.log('   Frontends: VITE_API_PROXY_TARGET=http://localhost:3001');
    }
    console.log('');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
