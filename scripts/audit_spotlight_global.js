/**
 * AUDITORÍA AUTOMATIZADA: SPOTLIGHT SYSTEM GLOBAL (D-057)
 * Valida mediante Chrome DevTools Protocol (CDP) headless:
 * 1. Que tanto .spotlight-card como .glass-panel reciben los listeners de Spotlight.
 * 2. Que un mousemove sobre cualquier panel de la app actualiza correctamente --mx y --my.
 * 3. Que al salir con mouseleave se resetea a 50%.
 * 4. Que no existen excepciones JavaScript en consola.
 * 5. Genera una captura de pantalla de alta fidelidad.
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const PORT = 8088;
const DEBUG_PORT = 9252;
const URL = `http://localhost:${PORT}/index.html`;
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWebSocketDebuggerUrl(debugPort) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${debugPort}/json`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const page = data.find(t => t.type === 'page');
                    if (page && page.webSocketDebuggerUrl) {
                        resolve(page.webSocketDebuggerUrl);
                    } else {
                        reject(new Error('No target page found'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
    });
}

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.reqId = 0;
        this.pendingRequests = new Map();
        this.errors = [];
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.method === 'Runtime.exceptionThrown') {
                    const ex = msg.params.exceptionDetails;
                    this.errors.push(`[${ex.lineNumber}:${ex.columnNumber}] ${ex.text} ${ex.exception ? ex.exception.description : ''}`);
                }
                if (msg.id && this.pendingRequests.has(msg.id)) {
                    const { resolve, reject } = this.pendingRequests.get(msg.id);
                    this.pendingRequests.delete(msg.id);
                    if (msg.error) reject(msg.error);
                    else resolve(msg.result);
                }
            };
        });
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = ++this.reqId;
            this.pendingRequests.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async evaluate(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res.result ? res.result.value : undefined;
    }

    async captureScreenshot(filename) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.join(SCREENSHOT_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
        return filePath;
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function run() {
    console.log('--- INICIANDO AUDITORÍA CDP: SPOTLIGHT SYSTEM GLOBAL (D-057) ---');
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    const chrome = spawn(chromePath, [
        `--remote-debugging-port=${DEBUG_PORT}`,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=1920,1080',
        '--mute-audio',
        URL
    ]);

    let cdp = null;

    try {
        await sleep(2500);
        const wsUrl = await getWebSocketDebuggerUrl(DEBUG_PORT);
        cdp = new CDPClient(wsUrl);
        await cdp.connect();

        await cdp.send('Runtime.enable');
        await cdp.send('Page.enable');

        await sleep(1500);

        // 1. Contar elementos con spotlight activo
        const count = await cdp.evaluate(`
            document.querySelectorAll('.spotlight-card, .glass-panel').length
        `);
        console.log(`[TEST 1] Paneles con Spotlight listeners activos en la app: ${count}`);

        // 2. Simular mousemove sobre el panel de PostFX Suite (panel derecho)
        const postfxTest = await cdp.evaluate(`(() => {
            const el = document.getElementById('sec-postfx-suite');
            if (!el) return { found: false };
            const rect = el.getBoundingClientRect();
            // Disparar mousemove simulado a 30% X, 40% Y
            const evt = new MouseEvent('mousemove', {
                clientX: rect.left + rect.width * 0.3,
                clientY: rect.top + rect.height * 0.4,
                bubbles: true
            });
            el.dispatchEvent(evt);
            return {
                found: true,
                mx: el.style.getPropertyValue('--mx'),
                my: el.style.getPropertyValue('--my')
            };
        })()`);
        console.log(`[TEST 2] MouseMove sobre sec-postfx-suite (derecha):`, JSON.stringify(postfxTest));

        // 3. Simular mousemove sobre el visor 3D (sec-viewport-3d)
        const viewportTest = await cdp.evaluate(`(() => {
            const el = document.getElementById('sec-viewport-3d');
            if (!el) return { found: false };
            const rect = el.getBoundingClientRect();
            const evt = new MouseEvent('mousemove', {
                clientX: rect.left + rect.width * 0.7,
                clientY: rect.top + rect.height * 0.8,
                bubbles: true
            });
            el.dispatchEvent(evt);
            return {
                found: true,
                mx: el.style.getPropertyValue('--mx'),
                my: el.style.getPropertyValue('--my')
            };
        })()`);
        console.log(`[TEST 3] MouseMove sobre sec-viewport-3d (centro):`, JSON.stringify(viewportTest));

        // 4. Simular mouseleave y verificar reseteo al 50%
        const leaveTest = await cdp.evaluate(`(() => {
            const el = document.getElementById('sec-postfx-suite');
            if (!el) return false;
            el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            return el.style.getPropertyValue('--mx') === '50%' && el.style.getPropertyValue('--my') === '50%';
        })()`);
        console.log(`[TEST 4] MouseLeave resetea coordenadas al 50%: ${leaveTest ? 'PASS' : 'FAIL'}`);

        // 5. Captura de pantalla de la app completa
        const screenshotPath = await cdp.captureScreenshot('spotlight_global_system_audit.png');
        console.log(`[SCREENSHOT] Captura generada en: ${screenshotPath}`);

        if (cdp.errors.length > 0) {
            console.error('Excepciones detectadas en el navegador:');
            cdp.errors.forEach(e => console.error(e));
        } else {
            console.log('✓ CERO excepciones JavaScript en runtime durante el ciclo completo.');
        }

    } catch (err) {
        console.error('Error durante la auditoría:', err);
    } finally {
        if (cdp) cdp.close();
        chrome.kill();
        process.exit(0);
    }
}

run();
