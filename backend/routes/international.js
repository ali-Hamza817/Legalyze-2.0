/**
 * International Law route — bridges the Legalyze product to the Legalyze 2.0
 * engine (a local Python service). This does NOT touch the Pakistan-law chat
 * flow; it only serves the "International Law" mode in the chat UI.
 *
 *   POST /api/international   { question }  ->  structured 2.0 answer JSON
 *   GET  /api/international/health          ->  engine liveness + corpus stats
 */
const express = require('express');
const http = require('http');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Where the Legalyze 2.0 Python engine service listens.
const ENGINE_URL = process.env.LEGALYZE2_URL || 'http://127.0.0.1:8100';

/** Minimal JSON POST/GET to the local engine, no external deps. */
function engineRequest(method, path, payload) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, ENGINE_URL);
        const body = payload ? JSON.stringify(payload) : null;
        const req = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
                },
                timeout: 120000,
            },
            (res) => {
                let data = '';
                res.on('data', (c) => (data += c));
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, json: JSON.parse(data || '{}') });
                    } catch (e) {
                        reject(new Error('Bad response from engine'));
                    }
                });
            }
        );
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('Engine timed out')));
        if (body) req.write(body);
        req.end();
    });
}

// Ask the Legalyze 2.0 engine an international-law question.
router.post('/', protect, async (req, res) => {
    const question = (req.body && req.body.question ? String(req.body.question) : '').trim();
    if (!question) {
        return res.status(400).json({ success: false, message: 'Question is required.' });
    }
    try {
        const { status, json } = await engineRequest('POST', '/ask', { question });
        if (status !== 200) {
            return res.status(502).json({ success: false, message: json.error || 'Engine error.' });
        }
        return res.status(200).json({ success: true, data: json });
    } catch (err) {
        // Engine not running / unreachable — tell the UI clearly, don't crash.
        return res.status(503).json({
            success: false,
            engineOffline: true,
            message:
                'The Legalyze 2.0 International Law engine is not running. Start it with: ' +
                'python service.py  (in the Legalyze-2.0 folder).',
        });
    }
});

// Health/liveness for the engine.
router.get('/health', protect, async (req, res) => {
    try {
        const { status, json } = await engineRequest('GET', '/health', null);
        return res.status(200).json({ success: status === 200, data: json });
    } catch (err) {
        return res.status(503).json({ success: false, engineOffline: true, message: 'Engine offline.' });
    }
});

module.exports = router;
