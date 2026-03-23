const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const net = require('node:net');

const rootDir = process.cwd();
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/**
 * Kill any process listening on `port` before we try to bind it.
 * On Windows we use netstat + taskkill; on POSIX we use fuser/lsof.
 */
function killPortSync(port) {
    if (process.platform === 'win32') {
        try {
            const result = spawnSync('cmd.exe', ['/d', '/s', '/c', `netstat -ano | findstr :${port}`], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            });
            const pids = new Set();
            for (const line of (result.stdout || '').split('\n')) {
                // Only match lines where our port is in the LOCAL address column (col 2)
                const m = line.match(/\s+[\d.:]+:(\d+)\s+[\d.:]+:\S+\s+\S+\s+(\d+)/);
                if (m && Number(m[1]) === port) {
                    pids.add(m[2]);
                }
            }
            for (const pid of pids) {
                spawnSync('taskkill', ['/pid', pid, '/f'], { stdio: 'ignore' });
            }
            if (pids.size > 0) {
                console.log(`[dev-full] Killed ${pids.size} process(es) on port ${port}`);
                // Give the OS a moment to release the socket
                spawnSync('cmd.exe', ['/d', '/s', '/c', 'ping -n 2 127.0.0.1 > nul'], { stdio: 'ignore' });
            }
        } catch {
            // best-effort – proceed regardless
        }
    } else {
        spawnSync('fuser', ['-k', `${port}/tcp`], { stdio: 'ignore' });
    }
}

const processes = [];
let shuttingDown = false;

const commands = [
    {
        name: 'api',
        cwd: rootDir,
        args: ['run', 'dev'],
    },
    {
        name: 'super-admin',
        cwd: path.join(rootDir, 'frontend', 'super-admin'),
        args: ['run', 'dev'],
    },
    {
        name: 'business',
        cwd: path.join(rootDir, 'frontend', 'business'),
        args: ['run', 'dev'],
    },
];

function writePrefixed(stream, label, chunk) {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const isLastEmptyLine = index === lines.length - 1 && line.length === 0;
        if (isLastEmptyLine) {
            continue;
        }

        stream.write(`[${label}] ${line}\n`);
    }
}

function killChildTree(child) {
    if (!child || child.killed || !child.pid) {
        return;
    }

    if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
        return;
    }

    child.kill('SIGTERM');
}

function shutdown(exitCode) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    for (const child of processes) {
        killChildTree(child);
    }

    setTimeout(() => {
        process.exit(exitCode);
    }, 50);
}

function startCommand(command) {
    const executable = process.platform === 'win32' ? 'cmd.exe' : npmCmd;
    const args = process.platform === 'win32'
        ? ['/d', '/s', '/c', npmCmd, ...command.args]
        : command.args;

    const child = spawn(executable, args, {
        cwd: command.cwd,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        windowsHide: false,
    });

    child.stdout.on('data', (chunk) => writePrefixed(process.stdout, command.name, chunk));
    child.stderr.on('data', (chunk) => writePrefixed(process.stderr, command.name, chunk));

    child.on('exit', (code, signal) => {
        if (shuttingDown) {
            return;
        }

        if (signal) {
            writePrefixed(process.stderr, command.name, `exited due to signal ${signal}`);
            shutdown(1);
            return;
        }

        if (code !== 0) {
            writePrefixed(process.stderr, command.name, `exited with code ${code}`);
            shutdown(code || 1);
            return;
        }

        writePrefixed(process.stdout, command.name, 'exited cleanly');
        shutdown(0);
    });

    child.on('error', (error) => {
        if (shuttingDown) {
            return;
        }

        writePrefixed(process.stderr, command.name, `failed to start: ${error.message}`);
        shutdown(1);
    });

    processes.push(child);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// Free ports before processes try to bind them (API PORT=3001 in root .env)
killPortSync(3001);
killPortSync(5174);
killPortSync(5180);

for (const command of commands) {
    startCommand(command);
}