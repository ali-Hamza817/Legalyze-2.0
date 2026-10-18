/**
 * downloadFullJudgments.js — download the original signed Supreme Court judgment
 * PDFs that the official Quarterly Case Law Updates link to.
 *
 * The court's server (supremecourt.gov.pk) sits behind Akamai bot-protection that
 * rejects plain HTTP clients, but serves a real browser. We drive a real Chromium
 * via puppeteer: visit the homepage once to acquire the Akamai/session cookies and
 * clear the JS challenge, then fetch each PDF *inside the page context* (so it
 * carries the browser's cookies + fingerprint) and write the bytes to disk.
 *
 * Reads:  Legal Corpus/judgments/scp_case_law_updates/full_judgment_urls.txt
 * Writes: Legal Corpus/judgments/full_judgments/<name>.pdf
 *
 * Polite: sequential, ~2s between files, resumable (skips files already present).
 *
 *   node scripts/downloadFullJudgments.js [limit]      # limit = max files (test)
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..', '..', 'Legal Corpus', 'judgments');
const URLS = path.join(ROOT, 'scp_case_law_updates', 'full_judgment_urls.txt');
const OUT = path.join(ROOT, 'full_judgments');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function nameFor(u) { return path.basename(new URL(u).pathname).replace(/[^\w.-]+/g, '_'); }

async function run() {
    const limit = process.argv[2] ? parseInt(process.argv[2], 10) : Infinity;
    if (!fs.existsSync(URLS)) throw new Error(`url list not found: ${URLS}`);
    if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
    let urls = fs.readFileSync(URLS, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
        .filter((u) => /supremecourt\.gov\.pk/i.test(u));
    urls = urls.slice(0, limit);
    console.log(`Target: ${urls.length} judgment PDFs → ${OUT}`);

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] });
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1366, height: 900 });

    console.log('Warming up session (homepage, for Akamai cookies)…');
    try { await page.goto('https://www.supremecourt.gov.pk/', { waitUntil: 'networkidle2', timeout: 60000 }); } catch (e) { console.log('  homepage warmup note:', e.message); }
    await sleep(2500);

    let ok = 0, skip = 0, fail = 0; const failed = [];
    for (let i = 0; i < urls.length; i++) {
        const u = urls[i]; const out = path.join(OUT, nameFor(u));
        if (fs.existsSync(out) && fs.statSync(out).size > 2000) { skip++; continue; }
        try {
            const res = await page.evaluate(async (url) => {
                try {
                    const r = await fetch(url, { credentials: 'include' });
                    if (!r.ok) return { ok: false, status: r.status };
                    const buf = new Uint8Array(await r.arrayBuffer());
                    let bin = ''; const C = 0x8000;
                    for (let j = 0; j < buf.length; j += C) bin += String.fromCharCode.apply(null, buf.subarray(j, j + C));
                    return { ok: true, status: r.status, b64: btoa(bin), len: buf.length };
                } catch (e) { return { ok: false, error: String(e) }; }
            }, u);
            if (res.ok && res.b64 && res.len > 2000) {
                const buf = Buffer.from(res.b64, 'base64');
                if (buf.slice(0, 4).toString() === '%PDF') { fs.writeFileSync(out, buf); ok++; process.stdout.write(`[${i + 1}/${urls.length}] ✓ ${nameFor(u)} (${buf.length}b)\n`); }
                else { fail++; failed.push(u); process.stdout.write(`[${i + 1}/${urls.length}] ✗ not-PDF ${nameFor(u)}\n`); }
            } else { fail++; failed.push(u); process.stdout.write(`[${i + 1}/${urls.length}] ✗ HTTP ${res.status || res.error} ${nameFor(u)}\n`); }
        } catch (e) { fail++; failed.push(u); process.stdout.write(`[${i + 1}/${urls.length}] ✗ ${e.message}\n`); }
        await sleep(1800 + Math.random() * 1200);
    }
    await browser.close();
    if (failed.length) fs.writeFileSync(path.join(OUT, '_failed.txt'), failed.join('\n'));
    console.log(`\nDone. downloaded ${ok}, skipped ${skip}, failed ${fail}. (failed list: _failed.txt)`);
}

run().catch((e) => { console.error('❌ downloadFullJudgments failed:', e); process.exit(1); });
