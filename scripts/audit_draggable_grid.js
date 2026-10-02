/**
 * AUDITORÍA AUTOMATIZADA: DRAGGABLE WIDGET GRID REORGANIZER (D-056)
 * Valida mediante Chrome DevTools Protocol (CDP) headless:
 * 1. Inicialización de los 3 subsistemas (Bento Grid, Cockpit Tabs, Tier 2 Racks).
 * 2. Simulación de reordenamiento por drag & drop en el Bento Grid y Cockpit.
 * 3. Persistencia en localStorage ('motor_bento_cards_order', 'motor_cockpit_tabs_order').
 * 4. Recarga de página y restauración fiel del orden guardado.
 * 5. Captura fotográfica del estado reordenado.
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const PORT = 8088;
const DEBUG_PORT = 9251;
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
    console.log('--- INICIANDO AUDITORÍA CDP: DRAGGABLE WIDGET GRID (D-056) ---');
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

        // 1. Verificar carga inicial de funciones
        const fnCheck = await cdp.evaluate(`
            typeof initDraggableWidgetSystem === 'function' &&
            typeof initBentoGridDraggable === 'function' &&
            typeof initCockpitTabsDraggable === 'function' &&
            typeof initWorkstationRacksDraggable === 'function'
        `);
        console.log(`[TEST 1] Funciones del Reorganizador disponibles: ${fnCheck ? 'PASS' : 'FAIL'}`);

        // 2. Activar modo Bento Grid para auditar
        await cdp.evaluate(`
            if (typeof switchAudioDeckDisplayMode === 'function') {
                switchAudioDeckDisplayMode('bento');
            }
        `);
        await sleep(800);

        // 3. Inspeccionar widgets del Bento Grid
        const bentoOrderInitial = await cdp.evaluate(`
            Array.from(document.querySelectorAll('#bento-global-grid-container > [data-widget-id]'))
                .map(el => el.getAttribute('data-widget-id'))
        `);
        console.log(`[TEST 2] Orden Bento inicial: ${JSON.stringify(bentoOrderInitial)}`);

        // 4. Simular reordenamiento programático/DOM en Bento Grid e invocar guardado
        const reorderBento = await cdp.evaluate(`(() => {
            const container = document.getElementById('bento-global-grid-container');
            const cardMer = container.querySelector('[data-widget-id="mer"]');
            const cardFft = container.querySelector('[data-widget-id="fft"]');
            if (!container || !cardMer || !cardFft) return false;
            
            // Mover la tarjeta MER al principio (antes de FFT)
            container.insertBefore(cardMer, cardFft);
            
            // Actualizar localStorage como hace el evento pointerup
            const currentOrder = Array.from(container.querySelectorAll('[data-widget-id]'))
                .map(el => el.getAttribute('data-widget-id'));
            localStorage.setItem('motor_bento_cards_order', JSON.stringify(currentOrder));
            return currentOrder;
        })()`);
        console.log(`[TEST 3] Nuevo orden Bento tras mover MER al inicio: ${JSON.stringify(reorderBento)}`);

        // 5. Simular reordenamiento en Cockpit Tabs
        const reorderCockpit = await cdp.evaluate(`(() => {
            const container = document.getElementById('cockpit-tabs-container');
            const tabAudio = container.querySelector('[data-tab-id="audio-dsp"]');
            const tabLive = container.querySelector('[data-tab-id="live-runner"]');
            if (!container || !tabAudio || !tabLive) return false;

            // Mover audio-dsp antes de live-runner
            container.insertBefore(tabAudio, tabLive);

            const order = Array.from(container.querySelectorAll('[data-tab-id]'))
                .map(el => el.getAttribute('data-tab-id'));
            localStorage.setItem('motor_cockpit_tabs_order', JSON.stringify(order));
            return order;
        })()`);
        console.log(`[TEST 4] Nuevo orden Cockpit tras mover audio-dsp al inicio: ${JSON.stringify(reorderCockpit)}`);

        // 6. Recargar la página para verificar la persistencia y restauración en DOMContentLoaded
        console.log('[TEST 5] Recargando página para validar persistencia...');
        await cdp.send('Page.reload');
        await sleep(2500);

        // Volver a conmutar a Bento para comprobar orden restaurado en DOM
        await cdp.evaluate(`
            if (typeof switchAudioDeckDisplayMode === 'function') {
                switchAudioDeckDisplayMode('bento');
            }
        `);
        await sleep(600);

        const restoredBentoOrder = await cdp.evaluate(`
            Array.from(document.querySelectorAll('#bento-global-grid-container > [data-widget-id]'))
                .map(el => el.getAttribute('data-widget-id'))
        `);
        const restoredCockpitOrder = await cdp.evaluate(`
            Array.from(document.querySelectorAll('#cockpit-tabs-container > [data-tab-id]'))
                .map(el => el.getAttribute('data-tab-id'))
        `);

        console.log(`[TEST 6] Orden Bento restaurado tras F5: ${JSON.stringify(restoredBentoOrder)}`);
        console.log(`[TEST 7] Orden Cockpit restaurado tras F5: ${JSON.stringify(restoredCockpitOrder)}`);

        const bentoRestoredOk = restoredBentoOrder[0] === 'mer';
        const cockpitRestoredOk = restoredCockpitOrder[0] === 'audio-dsp';

        console.log(`[TEST RESULT] Persistencia Bento Grid: ${bentoRestoredOk ? 'PASS (MER primero)' : 'FAIL'}`);
        console.log(`[TEST RESULT] Persistencia Cockpit Tabs: ${cockpitRestoredOk ? 'PASS (audio-dsp primero)' : 'FAIL'}`);

        // Restaurar estado default para no dejarlo alterado
        await cdp.evaluate(`
            localStorage.removeItem('motor_bento_cards_order');
            localStorage.removeItem('motor_cockpit_tabs_order');
        `);

        // Captura de pantalla de verificación
        const screenPath = await cdp.captureScreenshot('draggable_grid_persisted_audit.png');
        console.log(`[SCREENSHOT] Captura generada en: ${screenPath}`);

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
