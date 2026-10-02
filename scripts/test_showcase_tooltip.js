const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const PORT = 8088;
const DEBUG_PORT = 9260;
const URL = `http://localhost:${PORT}/components/project-showcase-demo.html`;

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
        await sleep(1500);

        // Get Presets button position
        const btnRect = await cdp.eval(`
            (() => {
                const b = document.getElementById('btn-demo-presets');
                const r = b.getBoundingClientRect();
                return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height };
            })()
        `);
        console.log('Button rect:', btnRect);

        // Dispatch mouseMoved to hover over Presets button
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: Math.round(btnRect.x),
            y: Math.round(btnRect.y)
        });

        // Wait for lerp animation and appearance
        await sleep(600);

        // Read tooltip state
        const tooltipState = await cdp.eval(`
            (() => {
                const hud = document.getElementById('mv-showcase-hud');
                if (!hud) return null;
                const r = hud.getBoundingClientRect();
                return {
                    visible: hud.classList.contains('is-visible'),
                    className: hud.className,
                    transform: hud.style.transform,
                    opacity: window.getComputedStyle(hud).opacity,
                    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
                    category: hud.querySelector('.mv-hud-category')?.textContent,
                    title: hud.querySelector('.mv-hud-title')?.textContent,
                    desc: hud.querySelector('.mv-hud-desc')?.textContent,
                    keycap: hud.querySelector('.mv-hud-keycap')?.textContent,
                    keycapDisplay: hud.querySelector('.mv-hud-keycap')?.style.display
                };
            })()
        `);
        console.log('Tooltip state:', JSON.stringify(tooltipState, null, 2));

        // Take a screenshot
        const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.mkdirSync('test-screenshots', { recursive: true });
        fs.writeFileSync('test-screenshots/showcase-tooltip-demo.png', Buffer.from(screenshot.data, 'base64'));
        console.log('Screenshot saved to test-screenshots/showcase-tooltip-demo.png');

        cdp.close();
    } finally {
        proc.kill();
    }
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
