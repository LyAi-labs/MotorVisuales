const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const PORT = 8088;
const DEBUG_PORT = 9265;
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

        // Activar Studio Mode para desplegar el dock flotante exactamente como en la captura del usuario
        await cdp.eval(`
            (() => {
                if (typeof toggleStudioMode === 'function' && !document.body.classList.contains('studio-mode')) {
                    toggleStudioMode();
                } else {
                    document.body.classList.add('studio-mode');
                }
            })()
        `);
        // Esperar a que la animación/transición de layout y Three.js resize termine al 100%
        await sleep(1500);

        // Instrumentar listeners para registrar qué evento dispara hide
        await cdp.eval(`
            (() => {
                window.__eventTrace = [];
                ['scroll', 'blur', 'click', 'pointerout', 'mouseout', 'pointerleave', 'mouseleave'].forEach(evt => {
                    window.addEventListener(evt, e => {
                        window.__eventTrace.push({
                            type: evt,
                            target: e.target?.id || e.target?.tagName,
                            related: e.relatedTarget?.id || e.relatedTarget?.tagName,
                            t: Math.round(performance.now())
                        });
                    }, { capture: true, passive: true });
                });
            })()
        `);

        // Medir posición del botón Presets en el dock flotante
        const btnRect = await cdp.eval(`
            (() => {
                const b = document.getElementById('dock-btn-presets') || document.querySelector('.studio-pill-dock button:nth-child(8)');
                if (!b) return null;
                const r = b.getBoundingClientRect();
                return {
                    x: r.left + r.width / 2,
                    y: r.top + r.height / 2,
                    width: r.width,
                    height: r.height,
                    text: b.textContent.trim(),
                    hasTitle: b.hasAttribute('title'),
                    dataTitle: b.dataset.mvTitle || b.dataset.tooltipTitle
                };
            })()
        `);
        console.log('Button rect & attributes:', JSON.stringify(btnRect, null, 2));

        if (!btnRect) {
            throw new Error('Button not found');
        }

        // Mover el cursor sobre el botón Presets
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: Math.round(btnRect.x),
            y: Math.round(btnRect.y)
        });

        // Esperar interpolación Lerp y renderizado
        await sleep(700);

        const events = await cdp.eval(`window.__eventTrace`);
        console.log('Events trace during hover:', JSON.stringify(events, null, 2));

        // Medir y verificar estado del HUD flotante
        const hudState = await cdp.eval(`
            (() => {
                const hud = document.getElementById('mv-showcase-hud');
                if (!hud) return null;
                const r = hud.getBoundingClientRect();
                const style = window.getComputedStyle(hud);
                return {
                    visible: hud.classList.contains('is-visible'),
                    className: hud.className,
                    opacity: style.opacity,
                    visibility: style.visibility,
                    transform: hud.style.transform,
                    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
                    category: hud.querySelector('.mv-hud-category')?.textContent,
                    title: hud.querySelector('.mv-hud-title')?.textContent,
                    desc: hud.querySelector('.mv-hud-desc')?.textContent,
                    keycap: hud.querySelector('.mv-hud-keycap')?.textContent,
                    keycapDisplay: hud.querySelector('.mv-hud-keycap')?.style.display
                };
            })()
        `);
        console.log('Live HUD state:', JSON.stringify(hudState, null, 2));

        // Capturar pantalla de alta fidelidad
        const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.mkdirSync('test-screenshots', { recursive: true });
        fs.writeFileSync('test-screenshots/live-studio-mode-showcase.png', Buffer.from(screenshot.data, 'base64'));
        console.log('Screenshot saved to test-screenshots/live-studio-mode-showcase.png');

        cdp.close();
    } finally {
        proc.kill();
    }
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
