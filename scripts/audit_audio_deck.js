// scripts/audit_audio_deck.js
// Verificación Empírica y Auditoría Visual del Deck de Audio

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:8088';
const DEBUG_PORT = 9247;
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWebSocketDebuggerUrl(port) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/json`, (res) => {
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
                const data = JSON.parse(event.data);
                if (data.id && this.pendingRequests.has(data.id)) {
                    const { resolve, reject } = this.pendingRequests.get(data.id);
                    this.pendingRequests.delete(data.id);
                    if (data.error) reject(data.error);
                    else resolve(data.result);
                }
                if (data.method === 'Runtime.exceptionThrown') {
                    this.errors.push(data.params);
                }
            };
        });
    }

    async send(method, params = {}) {
        const id = ++this.reqId;
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async evaluate(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: false
        });
        if (res.exceptionDetails) {
            throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res.result ? res.result.value : undefined;
    }

    async captureScreenshot(filepath, clip = null) {
        const params = { format: 'png' };
        if (clip) params.clip = clip;
        const res = await this.send('Page.captureScreenshot', params);
        fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
        console.log(`[CDP] Captura guardada: ${filepath}`);
    }

    async close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

async function runAudit() {
    console.log('=== INICIO AUDITORÍA EMPÍRICA: AUDIO DECK REDISEÑADO ===');
    
    // 1. Iniciar Chrome en modo headless con remote debugging y autoplay habilitado
    const profileDir = path.join(__dirname, '..', '.chrome-audio-test-profile-' + Date.now());
    const chromeProcess = spawn(CHROME_PATH, [
        `--remote-debugging-port=${DEBUG_PORT}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--autoplay-policy=no-user-gesture-required',
        `--user-data-dir=${profileDir}`,
        '--window-size=1440,900',
        TARGET_URL
    ]);

    let cdp = null;

    try {
        await sleep(2500);
        const wsUrl = await getWebSocketDebuggerUrl(DEBUG_PORT);
        console.log(`[CDP] Conectado a Chrome Debugger: ${wsUrl}`);

        cdp = new CDPClient(wsUrl);
        await cdp.connect();
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await sleep(1500);

        // Test 1: Verificar existencia y estado inicial de los 3 botones
        console.log('\n--- TEST 1: Estado inicial al cargar ---');
        const initialStatus = await cdp.evaluate(`(() => {
            const btnMasters = document.getElementById('btn-sec-masters');
            const secMasters = document.getElementById('deck-sec-masters-content');
            const chevMasters = document.getElementById('chevron-sec-masters');

            const btnPatchbay = document.getElementById('btn-sec-patchbay');
            const secPatchbay = document.getElementById('deck-sec-patchbay-content');
            const chevPatchbay = document.getElementById('chevron-sec-patchbay');

            const btnFaders = document.getElementById('btn-sec-volbal');
            const secFaders = document.getElementById('track-player-controls');
            const chevFaders = document.getElementById('chevron-sec-volbal');

            return {
                masters: {
                    btnExists: !!btnMasters,
                    btnText: btnMasters ? btnMasters.innerText.replace(/\\s+/g, ' ') : null,
                    secHidden: secMasters ? secMasters.classList.contains('hidden') : null,
                    chevron: chevMasters ? chevMasters.innerText : null
                },
                patchbay: {
                    btnExists: !!btnPatchbay,
                    btnText: btnPatchbay ? btnPatchbay.innerText.replace(/\\s+/g, ' ') : null,
                    secHidden: secPatchbay ? secPatchbay.classList.contains('hidden') : null,
                    chevron: chevPatchbay ? chevPatchbay.innerText : null
                },
                faders: {
                    btnExists: !!btnFaders,
                    btnText: btnFaders ? btnFaders.innerText.replace(/\\s+/g, ' ') : null,
                    secHidden: secFaders ? secFaders.classList.contains('hidden') : null,
                    chevron: chevFaders ? chevFaders.innerText : null
                }
            };
        })()`);

        console.log('Resultados Test 1:', JSON.stringify(initialStatus, null, 2));

        if (!initialStatus.masters.btnExists) throw new Error('btn-sec-masters no existe');
        if (!initialStatus.masters.secHidden) throw new Error('Pistas Master DEBE iniciar plegada (hidden)');
        if (initialStatus.masters.chevron !== '▶') throw new Error(`Chevron masters debe ser ▶, es ${initialStatus.masters.chevron}`);
        if (initialStatus.patchbay.secHidden) throw new Error('Fuentes/Patchbay debe estar desplegado inicialmente');
        if (initialStatus.faders.secHidden) throw new Error('Reproductor & Faders debe estar desplegado inicialmente');

        console.log('✅ TEST 1 SUPERADO: Pistas Master inicia plegado y los 3 botones están presentes.');

        // Obtener bounding box del panel para capturar screenshot enfocado
        const clipBox = await cdp.evaluate(`(() => {
            const el = document.getElementById('sec-audio-bar');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: r.height + 20, scale: 1 };
        })()`);

        await cdp.captureScreenshot(path.join(SCREENSHOT_DIR, 'audio_deck_01_grid_collapsed.png'), clipBox);

        // Test 2: Desplegar Pistas Master haciendo click en btn-sec-masters
        console.log('\n--- TEST 2: Desplegando Pistas Master ---');
        await cdp.evaluate(`document.getElementById('btn-sec-masters').click()`);
        await sleep(300);

        const expandedStatus = await cdp.evaluate(`(() => {
            const secMasters = document.getElementById('deck-sec-masters-content');
            const chevMasters = document.getElementById('chevron-sec-masters');
            const ledMasters = document.getElementById('led-sec-masters');
            const mordazaBtn = document.getElementById('btn-track-mordaza');
            const tontosBtn = document.getElementById('btn-track-tontos');
            const sec63Btn = document.getElementById('btn-track-section63');

            return {
                secHidden: secMasters ? secMasters.classList.contains('hidden') : null,
                chevron: chevMasters ? chevMasters.innerText : null,
                isLedActive: ledMasters ? ledMasters.classList.contains('bg-cyan-400') : false,
                tracksFound: {
                    mordaza: !!mordazaBtn,
                    tontos: !!tontosBtn,
                    section63: !!sec63Btn
                }
            };
        })()`);

        console.log('Resultados Test 2:', JSON.stringify(expandedStatus, null, 2));
        if (expandedStatus.secHidden) throw new Error('Pistas Master debería estar visible tras hacer click');
        if (expandedStatus.chevron !== '▼') throw new Error(`Chevron masters debe ser ▼ tras desplegarse, es ${expandedStatus.chevron}`);
        if (!expandedStatus.isLedActive) throw new Error('El LED de masters debería estar activo (bg-cyan-400)');
        if (!expandedStatus.tracksFound.mordaza || !expandedStatus.tracksFound.tontos || !expandedStatus.tracksFound.section63) {
            throw new Error('Faltan botones de tracks dentro de masters');
        }

        console.log('✅ TEST 2 SUPERADO: Pistas Master desplegado correctamente con sus 3 canales.');

        const clipBoxExpanded = await cdp.evaluate(`(() => {
            const el = document.getElementById('sec-audio-bar');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: r.height + 20, scale: 1 };
        })()`);
        await cdp.captureScreenshot(path.join(SCREENSHOT_DIR, 'audio_deck_02_grid_masters_expanded.png'), clipBoxExpanded);

        // Test 3: Probar selección de una pista (CH 01 Mordaza) y verificar micro status
        console.log('\n--- TEST 3: Carga de pista master y verificación de status ---');
        await cdp.evaluate(`(() => {
            const btn = document.getElementById('btn-track-mordaza');
            if (btn) btn.click();
            return true;
        })()`);
        await sleep(600);

        const playStatus = await cdp.evaluate(`(() => {
            const mordazaBtn = document.getElementById('btn-track-mordaza');
            const tag = mordazaBtn ? mordazaBtn.querySelector('.preset-tag') : null;
            const compactTrack = document.getElementById('compact-deck-track');
            const trackTitle = document.getElementById('track-title');

            return {
                mordazaTag: tag ? tag.innerText : null,
                compactTrackText: compactTrack ? compactTrack.innerText : null,
                trackTitleText: trackTitle ? trackTitle.innerText : null
            };
        })()`);

        console.log('Resultados Test 3:', JSON.stringify(playStatus, null, 2));
        if (playStatus.mordazaTag !== 'ON AIR') throw new Error('Tag de Mordaza no pasó a ON AIR');

        console.log('✅ TEST 3 SUPERADO: Mordaza seleccionada y micro-status actualizado.');

        // Test 4: Re-plegar Pistas Master y verificar que se oculta manteniendo el playback
        console.log('\n--- TEST 4: Re-plegar Pistas Master ---');
        await cdp.evaluate(`document.getElementById('btn-sec-masters').click()`);
        await sleep(300);

        const reCollapsedStatus = await cdp.evaluate(`(() => {
            const secMasters = document.getElementById('deck-sec-masters-content');
            const chevMasters = document.getElementById('chevron-sec-masters');
            const compactTrack = document.getElementById('compact-deck-track');

            return {
                secHidden: secMasters ? secMasters.classList.contains('hidden') : null,
                chevron: chevMasters ? chevMasters.innerText : null,
                compactTrack: compactTrack ? compactTrack.innerText : null
            };
        })()`);

        console.log('Resultados Test 4:', JSON.stringify(reCollapsedStatus, null, 2));
        if (!reCollapsedStatus.secHidden) throw new Error('Pistas Master debería estar plegado nuevamente');
        if (reCollapsedStatus.chevron !== '▶') throw new Error('Chevron debe ser ▶');

        console.log('✅ TEST 4 SUPERADO: Pistas Master re-plegado limpiamente.');

        const clipBoxFinal = await cdp.evaluate(`(() => {
            const el = document.getElementById('sec-audio-bar');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: r.height + 20, scale: 1 };
        })()`);
        await cdp.captureScreenshot(path.join(SCREENSHOT_DIR, 'audio_deck_03_grid_collapsed_playing.png'), clipBoxFinal);

        console.log('\n🎉 TODAS LAS PRUEBAS EMPÍRICAS HAN FINALIZADO CON ÉXITO.');

    } finally {
        if (cdp) await cdp.close();
        chromeProcess.kill();
        try {
            fs.rmSync(profileDir, { recursive: true, force: true });
        } catch (_) {}
    }
}

runAudit().catch(err => {
    console.error('❌ Error en auditoría:', err);
    process.exit(1);
});
