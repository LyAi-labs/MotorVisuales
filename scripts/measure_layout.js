const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const PORT = 8088;
const DEBUG_PORT = 9254;
const URL = `http://localhost:${PORT}/index.html`;

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
        await sleep(3000);

        const metrics = await cdp.eval(`(() => {
            const header = document.querySelector('header');
            const cockpit = document.querySelector('[class*="sticky"][class*="top-12"]');
            const main = document.querySelector('main');
            const leftCol = document.getElementById('left-dock-column');
            const secAudio = document.getElementById('sec-audio-bar');
            const tierGrid = leftCol?.parentElement;

            return {
                header: header ? { top: header.getBoundingClientRect().top, bottom: header.getBoundingClientRect().bottom, height: header.offsetHeight } : null,
                cockpit: cockpit ? { top: cockpit.getBoundingClientRect().top, bottom: cockpit.getBoundingClientRect().bottom, height: cockpit.offsetHeight, position: getComputedStyle(cockpit).position } : null,
                main: main ? { top: main.getBoundingClientRect().top, paddingTop: getComputedStyle(main).paddingTop } : null,
                leftCol: leftCol ? { top: leftCol.getBoundingClientRect().top, display: getComputedStyle(leftCol).display, height: leftCol.offsetHeight } : null,
                secAudio: secAudio ? { top: secAudio.getBoundingClientRect().top, height: secAudio.offsetHeight } : null,
                tierGrid: tierGrid ? { top: tierGrid.getBoundingClientRect().top, className: tierGrid.className.substring(0, 100) } : null,
                scrollY: window.scrollY,
                viewportHeight: window.innerHeight,
                viewportWidth: window.innerWidth,
            };
        })()`);

        console.log(JSON.stringify(metrics, null, 2));
        cdp.close();
    } finally {
        proc.kill();
    }
}

run().catch(err => { console.error('Error:', err); process.exit(1); });
