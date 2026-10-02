const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const PORT = 8088;
const DEBUG_PORT = 9255;
const URL = `http://localhost:${PORT}/index.html`;
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getWsUrl(debugPort) {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${debugPort}/json`, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                const data = JSON.parse(body);
                const page = data.find(t => t.type === 'page');
                page ? resolve(page.webSocketDebuggerUrl) : reject('no page');
            });
        }).on('error', reject);
    });
}

class CDP {
    constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
    static async connect(url) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(url);
            const c = new CDP(ws);
            ws.onopen = () => resolve(c);
            ws.onerror = reject;
            ws.onmessage = e => {
                const m = JSON.parse(e.data);
                if (m.id && c.pending.has(m.id)) {
                    const { resolve, reject } = c.pending.get(m.id);
                    c.pending.delete(m.id);
                    m.error ? reject(m.error) : resolve(m.result);
                }
            };
        });
    }
    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = ++this.id;
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }
    async eval(expr) {
        const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        return r.result?.value;
    }
    async screenshot(filename) {
        const r = await this.send('Page.captureScreenshot', { format: 'png' });
        const fp = path.join(SCREENSHOT_DIR, filename);
        fs.writeFileSync(fp, Buffer.from(r.data, 'base64'));
        return fp;
    }
    close() { this.ws.close(); }
}

async function run() {
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const chromePath = chromePaths.find(p => fs.existsSync(p));
    if (!chromePath) throw new Error('Chrome not found');

    const proc = spawn(chromePath, [
        `--remote-debugging-port=${DEBUG_PORT}`,
        '--headless=new', '--disable-gpu', '--no-sandbox',
        '--window-size=1920,1080', '--mute-audio', URL
    ]);

    try {
        let wsUrl;
        for (let i = 0; i < 20; i++) {
            await sleep(500);
            try { wsUrl = await getWsUrl(DEBUG_PORT); if (wsUrl) break; } catch (_) {}
        }
        if (!wsUrl) throw new Error('No WS URL');

        const cdp = await CDP.connect(wsUrl);
        await cdp.send('Runtime.enable');
        await cdp.send('Page.enable');
        await sleep(3500);

        const shot = await cdp.screenshot('layout_fix_verification.png');
        console.log('Captura guardada:', shot);

        cdp.close();
    } finally {
        proc.kill();
    }
}

run().catch(err => { console.error('Error:', err); process.exit(1); });
