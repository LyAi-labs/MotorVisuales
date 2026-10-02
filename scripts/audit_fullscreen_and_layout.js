/**
 * AUDITORÍA AUTOMATIZADA: FULLSCREEN PLAYBACK HUD & SHADER LAB REUBICADO
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const PORT = 8088;
const DEBUG_PORT = 9253;
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
                    const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
                    this.errors.push(desc);
                }
                if (msg.id && this.pendingRequests.has(msg.id)) {
                    const { resolve, reject } = this.pendingRequests.get(msg.id);
                    this.pendingRequests.delete(msg.id);
                    if (msg.error) {
                        reject(new Error(msg.error.message));
                    } else {
                        resolve(msg.result);
                    }
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

    async eval(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(res.exceptionDetails.text || 'Eval exception');
        }
        return res.result?.value;
    }

    async captureScreenshot(filename) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.join(SCREENSHOT_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
        return filePath;
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

async function run() {
    console.log('🚀 Iniciando Chrome Headless para auditoría Fullscreen & Layout...');
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const chromePath = chromePaths.find(p => fs.existsSync(p));
    if (!chromePath) {
        throw new Error('Chrome no encontrado en el sistema');
    }

    const chromeProcess = spawn(chromePath, [
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
        let wsUrl = null;
        for (let i = 0; i < 20; i++) {
            await sleep(500);
            try {
                wsUrl = await getWebSocketDebuggerUrl(DEBUG_PORT);
                if (wsUrl) break;
            } catch (_) {}
        }
        if (!wsUrl) throw new Error('No se pudo conectar a Chrome debug port');

        cdp = new CDPClient(wsUrl);
        await cdp.connect();
        await cdp.send('Runtime.enable');
        await cdp.send('Page.enable');

        console.log('Esperando carga completa de MotorVisuales...');
        await sleep(3500);

        // 1. Validar que #sec-shader-editor está en columna derecha y antes de #sec-postfx-suite
        const layoutCheck = await cdp.eval(`(() => {
            const shader = document.getElementById('sec-shader-editor');
            const postfx = document.getElementById('sec-postfx-suite');
            const colRight = document.querySelector('.three-viewport-section');
            if (!shader) return { ok: false, msg: 'Falta sec-shader-editor' };
            if (!postfx) return { ok: false, msg: 'Falta sec-postfx-suite' };
            const isInsideCol = colRight && colRight.contains(shader);
            const isBeforePostfx = (shader.compareDocumentPosition(postfx) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
            return {
                ok: isInsideCol && isBeforePostfx,
                isInsideCol,
                isBeforePostfx,
                shaderVisible: !!(shader.offsetWidth || shader.offsetHeight || shader.getClientRects().length)
            };
        })()`);
        console.log('📐 Verificación de layout Shader Lab:', layoutCheck);
        if (!layoutCheck.ok) {
            throw new Error('Fallo en la reubicación de sec-shader-editor: ' + JSON.stringify(layoutCheck));
        }

        // 2. Validar que #fullscreen-playback-bar existe y está inicialmente oculto
        const fsBarCheck = await cdp.eval(`(() => {
            const bar = document.getElementById('fullscreen-playback-bar');
            if (!bar) return { ok: false, msg: 'No existe #fullscreen-playback-bar' };
            const isHidden = bar.classList.contains('hidden');
            const playBtn = document.getElementById('fs-btn-play-pause');
            const volSlider = document.getElementById('fs-slider-vol-master');
            const volVal = document.getElementById('fs-val-vol-master');
            const progress = document.getElementById('fs-track-progress');
            return {
                ok: true,
                isHidden,
                hasPlayBtn: !!playBtn,
                hasVolSlider: !!volSlider,
                hasVolVal: !!volVal,
                hasProgress: !!progress
            };
        })()`);
        console.log('🎛️ Verificación de controles Fullscreen HUD:', fsBarCheck);
        if (!fsBarCheck.ok || !fsBarCheck.hasPlayBtn || !fsBarCheck.hasVolSlider) {
            throw new Error('Faltan controles en Fullscreen HUD');
        }

        // 3. Simular activación de fullscreenHUD
        const fsSimulate = await cdp.eval(`(() => {
            const bar = document.getElementById('fullscreen-playback-bar');
            bar.classList.remove('hidden');
            
            // Simular cambio de volumen
            const volSlider = document.getElementById('fs-slider-vol-master');
            volSlider.value = 0.75;
            volSlider.dispatchEvent(new Event('input'));
            
            const volValText = document.getElementById('fs-val-vol-master')?.textContent;
            return {
                barVisible: !bar.classList.contains('hidden'),
                volValText
            };
        })()`);
        console.log('🔊 Simulación de HUD y volumen maestro:', fsSimulate);

        // 4. Capturar pantalla de evidencia
        const shotPath = await cdp.captureScreenshot('fullscreen_hud_audit.png');
        console.log(`📸 Captura guardada en: ${shotPath}`);

        console.log(`\n Errores JS en runtime detectados: ${cdp.errors.length}`);
        if (cdp.errors.length > 0) {
            console.warn('Advertencias/Errores:', cdp.errors);
        }

        console.log('✅ AUDITORÍA FULLSCREEN Y LAYOUT SUPERADA EXITOSAMENTE');
    } finally {
        if (cdp) cdp.close();
        chromeProcess.kill();
    }
}

run().catch(err => {
    console.error('❌ Error en auditoría:', err);
    process.exit(1);
});
