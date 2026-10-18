/**
 * Auto-starts the Legalyze 2.0 engine (a local Python service) alongside the
 * Node backend, so the "International Law" chat mode works out of the box.
 *
 * Safe by design:
 *   - if the engine is already listening on its port, it does nothing;
 *   - if Python or the engine folder is missing, it logs and gives up
 *     (the chat UI then shows a clear "start the engine" message).
 */
const net = require('net');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const ENGINE_PORT = Number(process.env.LEGALYZE2_PORT || 8100);
const ENGINE_DIR = path.join(__dirname, '..', '..', 'Legalyze-2.0');
const PY = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');

function isPortOpen(port, host = '127.0.0.1', timeout = 800) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let done = false;
        const finish = (open) => { if (!done) { done = true; socket.destroy(); resolve(open); } };
        socket.setTimeout(timeout);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
        socket.connect(port, host);
    });
}

async function startLegalyze2Engine() {
    if (process.env.LEGALYZE2_AUTOSTART === 'false') {
        console.log('🌐 Legalyze 2.0 engine autostart disabled (LEGALYZE2_AUTOSTART=false).');
        return;
    }
    if (await isPortOpen(ENGINE_PORT)) {
        console.log(`🌐 Legalyze 2.0 engine already running on :${ENGINE_PORT}.`);
        return;
    }
    const script = path.join(ENGINE_DIR, 'service.py');
    if (!fs.existsSync(script)) {
        console.warn(`🌐 Legalyze 2.0 engine not found at ${script}; International Law mode will be offline.`);
        return;
    }
    try {
        const child = spawn(PY, ['service.py', String(ENGINE_PORT)], {
            cwd: ENGINE_DIR,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        child.stdout.on('data', (d) => process.stdout.write(`[legalyze2] ${d}`));
        child.stderr.on('data', (d) => process.stderr.write(`[legalyze2] ${d}`));
        child.on('error', (e) =>
            console.warn(`🌐 Could not start Legalyze 2.0 engine (${e.message}); International Law mode will be offline.`));
        child.on('exit', (code) => {
            if (code && code !== 0) console.warn(`🌐 Legalyze 2.0 engine exited (code ${code}).`);
        });
        console.log(`🌐 Starting Legalyze 2.0 engine (${PY} service.py ${ENGINE_PORT}) …`);
    } catch (e) {
        console.warn(`🌐 Could not start Legalyze 2.0 engine (${e.message}); International Law mode will be offline.`);
    }
}

module.exports = { startLegalyze2Engine };
