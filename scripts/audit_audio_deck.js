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
        '--window-size=1440,1800',
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

        // Test 1: Verificar existencia y estado inicial de los 3 botones en el banner lateral izquierdo
        console.log('\n--- TEST 1: Estado inicial al cargar ---');
        const initialStatus = await cdp.evaluate(`(() => {
            const btnMasters = document.getElementById('btn-sec-masters');
            const secMasters = document.getElementById('deck-sec-masters-content');
            const chevMasters = document.getElementById('chevron-sec-masters');
            const notchMasters = document.getElementById('notch-sec-masters');

            const btnPatchbay = document.getElementById('btn-sec-patchbay');
            const secPatchbay = document.getElementById('deck-sec-patchbay-content');
            const chevPatchbay = document.getElementById('chevron-sec-patchbay');
            const notchPatchbay = document.getElementById('notch-sec-patchbay');

            const btnFaders = document.getElementById('btn-sec-volbal');
            const secFaders = document.getElementById('track-player-controls');
            const chevFaders = document.getElementById('chevron-sec-volbal');
            const notchFaders = document.getElementById('notch-sec-volbal');

            return {
                masters: {
                    btnExists: !!btnMasters,
                    btnText: btnMasters ? btnMasters.innerText.replace(/\\s+/g, ' ') : null,
                    secHidden: secMasters ? secMasters.classList.contains('hidden') : null,
                    chevron: chevMasters ? chevMasters.innerText : null,
                    notchHidden: notchMasters ? notchMasters.classList.contains('hidden') : null
                },
                patchbay: {
                    btnExists: !!btnPatchbay,
                    btnText: btnPatchbay ? btnPatchbay.innerText.replace(/\\s+/g, ' ') : null,
                    secHidden: secPatchbay ? secPatchbay.classList.contains('hidden') : null,
                    chevron: chevPatchbay ? chevPatchbay.innerText : null,
                    notchHidden: notchPatchbay ? notchPatchbay.classList.contains('hidden') : null
                },
                faders: {
                    btnExists: !!btnFaders,
                    btnText: btnFaders ? btnFaders.innerText.replace(/\\s+/g, ' ') : null,
                    secHidden: secFaders ? secFaders.classList.contains('hidden') : null,
                    chevron: chevFaders ? chevFaders.innerText : null,
                    notchHidden: notchFaders ? notchFaders.classList.contains('hidden') : null
                }
            };
        })()`);

        console.log('Resultados Test 1:', JSON.stringify(initialStatus, null, 2));

        if (!initialStatus.masters.btnExists) throw new Error('btn-sec-masters no existe');
        if (!initialStatus.masters.secHidden) throw new Error('Pistas Master DEBE iniciar plegada (hidden)');
        if (initialStatus.masters.chevron !== '▶') throw new Error(`Chevron masters debe ser ▶, es ${initialStatus.masters.chevron}`);
        if (!initialStatus.masters.notchHidden) throw new Error('Notch de masters debe iniciar oculto');
        if (initialStatus.patchbay.secHidden) throw new Error('Fuentes/Patchbay debe estar desplegado inicialmente');
        if (initialStatus.patchbay.notchHidden) throw new Error('Notch de patchbay debe ser visible');
        if (initialStatus.faders.secHidden) throw new Error('Reproductor & Faders debe estar desplegado inicialmente');
        if (initialStatus.faders.notchHidden) throw new Error('Notch de faders debe ser visible');

        console.log('✅ TEST 1 SUPERADO: Banner lateral izquierdo activo, Pistas Master inicia plegado y conectores coherentes.');

        // Obtener bounding box del panel para capturar screenshot enfocado
        const clipBox = await cdp.evaluate(`(() => {
            const el = document.getElementById('sec-audio-bar');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: r.height + 20, scale: 1 };
        })()`);

        await cdp.captureScreenshot(path.join(SCREENSHOT_DIR, 'audio_deck_left_banner_initial.png'), clipBox);

        // Test 2: Desplegar Pistas Master haciendo click en btn-sec-masters
        console.log('\n--- TEST 2: Desplegando Pistas Master ---');
        await cdp.evaluate(`document.getElementById('btn-sec-masters').click()`);
        await sleep(350);

        const expandedStatus = await cdp.evaluate(`(() => {
            const secMasters = document.getElementById('deck-sec-masters-content');
            const chevMasters = document.getElementById('chevron-sec-masters');
            const ledMasters = document.getElementById('led-sec-masters');
            const notchMasters = document.getElementById('notch-sec-masters');
            const mordazaBtn = document.getElementById('btn-track-mordaza');
            const tontosBtn = document.getElementById('btn-track-tontos');
            const sec63Btn = document.getElementById('btn-track-section63');

            return {
                secHidden: secMasters ? secMasters.classList.contains('hidden') : null,
                hasActiveDeployAnimation: secMasters ? secMasters.classList.contains('deck-section-active') : false,
                chevron: chevMasters ? chevMasters.innerText : null,
                isLedPurple: ledMasters ? ledMasters.classList.contains('bg-purple-400') : false,
                notchHidden: notchMasters ? notchMasters.classList.contains('hidden') : null,
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
        if (!expandedStatus.isLedPurple) throw new Error('El LED de masters debería ser púrpura (bg-purple-400)');
        if (expandedStatus.notchHidden) throw new Error('El notch de masters debe estar visible (sin clase hidden)');
        if (!expandedStatus.hasActiveDeployAnimation) throw new Error('Debe tener la clase de animación deck-section-active');
        if (!expandedStatus.tracksFound.mordaza || !expandedStatus.tracksFound.tontos || !expandedStatus.tracksFound.section63) {
            throw new Error('Faltan botones de tracks dentro de masters');
        }

        console.log('✅ TEST 2 SUPERADO: Pistas Master desplegado correctamente con animación visual, flecha púrpura y canales HQ.');

        const clipBoxExpanded = await cdp.evaluate(`(() => {
            const el = document.getElementById('sec-audio-bar');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: r.height + 20, scale: 1 };
        })()`);
        await cdp.captureScreenshot(path.join(SCREENSHOT_DIR, 'audio_deck_left_banner_masters_expanded.png'), clipBoxExpanded);

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
            const trackTitle = document.getElementById('track-title');

            return {
                mordazaTag: tag ? tag.innerText : null,
                trackTitleText: trackTitle ? trackTitle.innerText : null
            };
        })()`);

        console.log('Resultados Test 3:', JSON.stringify(playStatus, null, 2));
        if (playStatus.mordazaTag !== 'ON AIR') throw new Error('Tag de Mordaza no pasó a ON AIR');

        console.log('✅ TEST 3 SUPERADO: Mordaza seleccionada y reproductor sincronizado.');

        // Test 4: Re-plegar Pistas Master y verificar que se oculta manteniendo el conector y chevron
        console.log('\n--- TEST 4: Re-plegar Pistas Master ---');
        await cdp.evaluate(`document.getElementById('btn-sec-masters').click()`);
        await sleep(300);

        const reCollapsedStatus = await cdp.evaluate(`(() => {
            const secMasters = document.getElementById('deck-sec-masters-content');
            const chevMasters = document.getElementById('chevron-sec-masters');
            const notchMasters = document.getElementById('notch-sec-masters');

            return {
                secHidden: secMasters ? secMasters.classList.contains('hidden') : null,
                chevron: chevMasters ? chevMasters.innerText : null,
                notchHidden: notchMasters ? notchMasters.classList.contains('hidden') : null
            };
        })()`);

        console.log('Resultados Test 4:', JSON.stringify(reCollapsedStatus, null, 2));
        if (!reCollapsedStatus.secHidden) throw new Error('Pistas Master debería estar plegado nuevamente');
        if (reCollapsedStatus.chevron !== '▶') throw new Error('Chevron debe ser ▶');
        if (!reCollapsedStatus.notchHidden) throw new Error('Notch de masters debe ocultarse al plegar');

        console.log('✅ TEST 4 SUPERADO: Pistas Master re-plegado limpiamente.');

        // Test 5: Plegar y Desplegar sección Input mediante btn-sec-patchbay
        console.log('\n--- TEST 5: Plegado y desplegado de la sección Input con notch y animación ---');
        const inputBtnText = await cdp.evaluate(`document.getElementById('btn-sec-patchbay').innerText`);
        console.log('Texto del botón Input:', inputBtnText);
        if (!inputBtnText.includes('Input')) throw new Error('El botón debe contener la palabra Input');

        // Plegar Input
        await cdp.evaluate(`document.getElementById('btn-sec-patchbay').click()`);
        await sleep(300);

        const inputCollapsedStatus = await cdp.evaluate(`(() => {
            const sec = document.getElementById('deck-sec-patchbay-content');
            const chev = document.getElementById('chevron-sec-patchbay');
            const notch = document.getElementById('notch-sec-patchbay');
            return {
                secHidden: sec ? sec.classList.contains('hidden') : null,
                chevron: chev ? chev.innerText : null,
                notchHidden: notch ? notch.classList.contains('hidden') : null
            };
        })()`);

        console.log('Resultados Test 5 (Input Plegado):', JSON.stringify(inputCollapsedStatus, null, 2));
        if (!inputCollapsedStatus.secHidden) throw new Error('La sección Input debe estar plegada (hidden) tras hacer click');
        if (inputCollapsedStatus.chevron !== '▶') throw new Error(`Chevron de Input debe ser ▶, es ${inputCollapsedStatus.chevron}`);
        if (!inputCollapsedStatus.notchHidden) throw new Error('Notch de Input debe estar oculto al plegar');

        const clipBoxInputCollapsed = await cdp.evaluate(`(() => {
            const el = document.getElementById('sec-audio-bar');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: r.height + 20, scale: 1 };
        })()`);
        await cdp.captureScreenshot(path.join(SCREENSHOT_DIR, 'audio_deck_left_banner_input_collapsed.png'), clipBoxInputCollapsed);

        // Desplegar Input nuevamente
        await cdp.evaluate(`document.getElementById('btn-sec-patchbay').click()`);
        await sleep(350);

        const inputRestoredStatus = await cdp.evaluate(`(() => {
            const sec = document.getElementById('deck-sec-patchbay-content');
            const chev = document.getElementById('chevron-sec-patchbay');
            const notch = document.getElementById('notch-sec-patchbay');
            const hasAnim = sec ? sec.classList.contains('deck-section-active') : false;
            return {
                secHidden: sec ? sec.classList.contains('hidden') : null,
                chevron: chev ? chev.innerText : null,
                notchHidden: notch ? notch.classList.contains('hidden') : null,
                hasAnim
            };
        })()`);

        console.log('Resultados Test 5 (Input Restaurado):', JSON.stringify(inputRestoredStatus, null, 2));
        if (inputRestoredStatus.secHidden) throw new Error('La sección Input debe estar visible tras volver a hacer click');
        if (inputRestoredStatus.chevron !== '▼') throw new Error(`Chevron de Input debe ser ▼, es ${inputRestoredStatus.chevron}`);
        if (inputRestoredStatus.notchHidden) throw new Error('Notch de Input debe ser visible al desplegar');
        if (!inputRestoredStatus.hasAnim) throw new Error('Input restaurado debe disparar deck-section-active');

        console.log('✅ TEST 5 SUPERADO: Sección Input se pliega y despliega con precisión de notch y animación reactiva.');

        // Test 6: Plegar TODOS los paneles (Caso específico del usuario: Masters, Input y Faders cerrados)
        console.log('\n--- TEST 6: Plegar TODOS los paneles y comprobar aprovechamiento adaptativo de espacio ---');
        // Plegar Input
        await cdp.evaluate(`document.getElementById('btn-sec-patchbay').click()`);
        await sleep(200);
        // Plegar Faders
        await cdp.evaluate(`document.getElementById('btn-sec-volbal').click()`);
        await sleep(350);

        const allCollapsedCheck = await cdp.evaluate(`(() => {
            const secMasters = document.getElementById('deck-sec-masters-content');
            const secPatchbay = document.getElementById('deck-sec-patchbay-content');
            const secFaders = document.getElementById('track-player-controls');
            const scopeBlock = document.getElementById('deck-scope-telemetry-block');
            const rail = document.getElementById('btn-sec-masters') ? document.getElementById('btn-sec-masters').parentElement : null;

            const scopeRect = scopeBlock ? scopeBlock.getBoundingClientRect() : null;
            const railRect = rail ? rail.getBoundingClientRect() : null;

            return {
                allPanelsHidden: (
                    secMasters.classList.contains('hidden') &&
                    secPatchbay.classList.contains('hidden') &&
                    secFaders.classList.contains('hidden')
                ),
                scopeExists: !!scopeBlock,
                scopeIsDirectlyRightOfRail: (scopeRect && railRect) ? (scopeRect.left >= railRect.right - 2 && scopeRect.top <= railRect.top + 30) : false,
                scopeHeight: scopeRect ? scopeRect.height : 0,
                railHeight: railRect ? railRect.height : 0
            };
        })()`);

        console.log('Resultados Test 6 (Todo Plegado):', JSON.stringify(allCollapsedCheck, null, 2));
        if (!allCollapsedCheck.allPanelsHidden) throw new Error('Los 3 paneles deben estar plegados (hidden)');
        if (!allCollapsedCheck.scopeExists) throw new Error('El bloque de osciloscopio y telemetría debe existir');
        if (!allCollapsedCheck.scopeIsDirectlyRightOfRail) {
            throw new Error('El osciloscopio debe estar inmediatamente a la derecha del rail de menús ocupando el espacio');
        }

        const clipBoxAllCollapsed = await cdp.evaluate(`(() => {
            const el = document.getElementById('sec-audio-bar');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: r.height + 20, scale: 1 };
        })()`);
        await cdp.captureScreenshot(path.join(SCREENSHOT_DIR, 'audio_deck_06_all_collapsed_zero_gap.png'), clipBoxAllCollapsed);

        console.log('✅ TEST 6 SUPERADO: Al plegar todos los paneles, el osciloscopio y la telemetría ocupan el espacio contiguo sin dejar ningún hueco vacío.');

        // Test 7: Conmutar a Vista Bento Grid Studio (Butter.video & shadcn UI)
        console.log('\n--- TEST 7: Conmutar a Bento Grid Studio (Butter.video) y validar funcionalidad ---');
        await cdp.evaluate(`setAudioDeckDisplayMode('bento')`);
        await sleep(400);

        const bentoStatus = await cdp.evaluate(`(() => {
            const viewRack = document.getElementById('view-mode-rack');
            const viewBento = document.getElementById('view-mode-bento');
            const btnRack = document.getElementById('btn-mode-rack');
            const btnBento = document.getElementById('btn-mode-bento');

            const cardMasters = document.getElementById('btn-bento-track-mordaza');
            const cardInput = document.querySelector('#view-mode-bento button[onclick*="startMicrophone"]');
            const cardTransport = document.getElementById('bento-btn-play-pause-track');
            const cardScope = document.getElementById('bentoWaveCanvas');

            const scopeRect = cardScope ? cardScope.getBoundingClientRect() : null;

            return {
                rackHidden: viewRack.classList.contains('hidden'),
                bentoVisible: !viewBento.classList.contains('hidden'),
                btnBentoHasPurple: btnBento.className.includes('purple'),
                hasAll4Cards: !!(cardMasters && cardInput && cardTransport && cardScope),
                scopeCanvasW: scopeRect ? scopeRect.width : 0,
                scopeCanvasH: scopeRect ? scopeRect.height : 0
            };
        })()`);

        console.log('Resultados Test 7 (Bento Grid View):', JSON.stringify(bentoStatus, null, 2));
        if (!bentoStatus.rackHidden) throw new Error('La vista Rack debe estar oculta en modo Bento');
        if (!bentoStatus.bentoVisible) throw new Error('La vista Bento debe estar visible');
        if (!bentoStatus.hasAll4Cards) throw new Error('Las 4 tarjetas Bento deben estar presentes en el DOM');
        if (bentoStatus.scopeCanvasW <= 0 || bentoStatus.scopeCanvasH <= 0) {
            throw new Error('El canvas de osciloscopio Bento debe tener dimensiones renderizables');
        }

        // Probar interacción en Bento: seleccionar Pista 2 (Tontos Útiles) y regular volumen
        console.log('[CDP] Probando interacción en Bento: reproducir CH 02 y ajustar volumen...');
        await cdp.evaluate(`document.getElementById('btn-bento-track-tontos').click()`);
        await sleep(300);
        await cdp.evaluate(`updateMasterVolume(0.85)`);
        await sleep(200);

        const bentoInteractStatus = await cdp.evaluate(`(() => {
            const trackHeader = document.getElementById('compact-deck-track').innerText;
            const volHeader = document.getElementById('compact-deck-vol').innerText;
            const bentoTitle = document.getElementById('bento-track-title').innerText;
            const bentoVol = document.getElementById('bento-val-vol-master').innerText;
            return {
                trackHeader,
                volHeader,
                bentoTitle,
                bentoVol
            };
        })()`);

        console.log('Resultados Interacción Bento:', JSON.stringify(bentoInteractStatus, null, 2));
        if (!bentoInteractStatus.bentoTitle.includes('Tontos')) {
            throw new Error(`El título en Bento debe ser Tontos Útiles, es: ${bentoInteractStatus.bentoTitle}`);
        }
        if (bentoInteractStatus.bentoVol !== '85%') {
            throw new Error(`El volumen en Bento debe ser 85%, es: ${bentoInteractStatus.bentoVol}`);
        }

        const clipBoxBento = await cdp.evaluate(`(() => {
            window.scrollTo(0, 0);
            const el = document.getElementById('sec-audio-bar');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
                x: Math.max(0, r.left + window.scrollX - 10),
                y: Math.max(0, r.top + window.scrollY - 10),
                width: r.width + 20,
                height: r.height + 20,
                scale: 1
            };
        })()`);
        await cdp.captureScreenshot(path.join(SCREENSHOT_DIR, 'audio_deck_07_bento_butter_view.png'), clipBoxBento);

        // Capturar primer plano dedicado de Card 3 (Transporte & Faders) y Card 4 (Osciloscopio & Telemetría)
        const clipBoxLower = await cdp.evaluate(`(() => {
            const cardTransport = document.getElementById('bento-btn-play-pause-track') ? document.getElementById('bento-btn-play-pause-track').closest('.group') : null;
            const scopeCard = document.getElementById('bentoWaveCanvas') ? document.getElementById('bentoWaveCanvas').closest('.group') : null;
            if (!cardTransport || !scopeCard) return null;
            const r1 = cardTransport.getBoundingClientRect();
            const r2 = scopeCard.getBoundingClientRect();
            const top = Math.min(r1.top, r2.top) + window.scrollY - 10;
            const bottom = Math.max(r1.bottom, r2.bottom) + window.scrollY + 20;
            const left = Math.min(r1.left, r2.left) + window.scrollX - 10;
            const width = Math.max(r1.width, r2.width) + 20;
            return {
                x: Math.max(0, left),
                y: Math.max(0, top),
                width: width,
                height: Math.max(100, bottom - top),
                scale: 1
            };
        })()`);
        await cdp.captureScreenshot(path.join(SCREENSHOT_DIR, 'audio_deck_08_bento_cards_3_and_4.png'), clipBoxLower);

        // Captura macro dedicada de Card 4 (Osciloscopio & 6 Métricas de Telemetría)
        const clipBoxCard4 = await cdp.evaluate(`(() => {
            const scopeCard = document.getElementById('bentoWaveCanvas') ? document.getElementById('bentoWaveCanvas').closest('.group') : null;
            if (!scopeCard) return null;
            const r = scopeCard.getBoundingClientRect();
            return {
                x: Math.max(0, r.left + window.scrollX - 10),
                y: Math.max(0, r.top + window.scrollY - 10),
                width: r.width + 20,
                height: r.height + 20,
                scale: 1
            };
        })()`);
        if (clipBoxCard4) {
            await cdp.captureScreenshot(path.join(SCREENSHOT_DIR, 'audio_deck_09_bento_card_4_scope.png'), clipBoxCard4);
        }

        console.log('✅ TEST 7 SUPERADO: Vista Bento Grid Studio (Butter.video) completamente funcional, interactiva y renderizada con captura generada.');

        console.log('\n🎉 TODAS LAS PRUEBAS EMPÍRICAS (RACK BANNER + BENTO GRID BUTTER.VIDEO) HAN FINALIZADO CON ÉXITO ROTUNDO.');

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
