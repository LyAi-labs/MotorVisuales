// scripts/mobile_visual_audit.js
// Automated Visual Validation & Mobile Split-Screen 100dvh Audit via Chrome DevTools Protocol (CDP)

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:8088';
const DEBUG_PORT = 9231;
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-screenshots');
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'C:\\Users\\Glado\\.gemini\\antigravity\\brain\\72a067f4-6128-4386-acb0-7ed5239ed05e';

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.reqId = 0;
        this.pendingRequests = new Map();
        this.consoleLogs = [];
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
                    if (data.error) {
                        reject(new Error(JSON.stringify(data.error)));
                    } else {
                        resolve(data.result);
                    }
                } else if (data.method === 'Runtime.consoleAPICalled') {
                    const type = data.params.type;
                    const text = data.params.args.map(a => a.value || a.description || '').join(' ');
                    this.consoleLogs.push({ type, text });
                    if (type === 'error') {
                        this.errors.push(text);
                    }
                } else if (data.method === 'Runtime.exceptionThrown') {
                    const desc = data.params.exceptionDetails?.exception?.description || 'Exception';
                    this.errors.push(desc);
                }
            };
        });
    }

    async send(method, params = {}) {
        const id = ++this.reqId;
        const msg = JSON.stringify({ id, method, params });
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.ws.send(msg);
        });
    }

    async evaluate(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        return res.result ? res.result.value : null;
    }

    async captureScreenshot(filename) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        const buffer = Buffer.from(res.data, 'base64');
        const localPath = path.join(SCREENSHOT_DIR, filename);
        const artifactPath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(localPath, buffer);
        fs.writeFileSync(artifactPath, buffer);
        return { localPath, artifactPath, size: buffer.length };
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

async function runAudit() {
    console.log('=== INICIANDO AUDITORÍA VISUAL Y DE ERGONOMÍA MÓVIL 100DVH ===');
    console.log(`Objetivo: ${TARGET_URL}`);

    // Launch Chrome Headless
    const tempProfile = path.join(__dirname, '..', '.temp_audit_profile_2');
    const chromeArgs = [
        '--headless=new',
        `--remote-debugging-port=${DEBUG_PORT}`,
        `--user-data-dir=${tempProfile}`,
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=400,900',
        'about:blank'
    ];

    console.log(`Lanzando Chrome en puerto de depuración ${DEBUG_PORT}...`);
    const chromeProc = spawn(CHROME_PATH, chromeArgs, { stdio: 'ignore' });

    // Wait for CDP endpoint to be available
    let targets = null;
    for (let i = 0; i < 20; i++) {
        await sleep(300);
        try {
            const resp = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
            if (resp.ok) {
                targets = await resp.json();
                if (targets && targets.length > 0) break;
            }
        } catch (e) {}
    }

    if (!targets || targets.length === 0) {
        chromeProc.kill();
        throw new Error('No se pudo conectar a Chrome CDP en el puerto ' + DEBUG_PORT);
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log(`Conectado a la página Chrome vía CDP: ${pageTarget.title}`);

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    const auditResults = {
        devicesTested: [],
        layoutIntegrity: {},
        deckTabsTested: [],
        errorsFound: []
    };

    // DEVICE 1: iPhone 14 / Standard Mobile (390 x 844)
    console.log('\n--- PRUEBA 1: Dispositivo Móvil Estándar (390 x 844 px) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true,
        fitWindow: false,
        screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

    console.log('Navegando a ' + TARGET_URL + '...');
    await cdp.send('Page.navigate', { url: TARGET_URL });

    // Wait for layout to settle and Three.js to initialize
    await sleep(2500);

    // Evaluate Layout and 100dvh compliance
    const metrics390 = await cdp.evaluate(`
        (() => {
            const winH = window.innerHeight;
            const winW = window.innerWidth;
            const docH = document.documentElement.scrollHeight;
            const bodyH = document.body.scrollHeight;
            const scrollY = window.scrollY || document.documentElement.scrollTop;

            const threeContainer = document.getElementById('three-canvas-container');
            const tacticalDeck = document.getElementById('mobile-tactical-deck');
            const bottomBar = document.getElementById('mobile-bottom-tab-bar');
            const vpSec = document.getElementById('sec-viewport-3d');
            const leftCol = document.getElementById('left-dock-column');
            const tier2 = document.getElementById('tier2-studios');
            const tier2Sub = document.getElementById('tier2-subgrid');
            const resizer = document.getElementById('three-viewport-resizer');
            const vpHud = document.getElementById('mobile-viewport-hud');

            const threeRect = threeContainer ? threeContainer.getBoundingClientRect() : null;
            const deckRect = tacticalDeck ? tacticalDeck.getBoundingClientRect() : null;
            const barRect = bottomBar ? bottomBar.getBoundingClientRect() : null;

            // Audit audio panel order
            const audioPanel = document.getElementById('m-panel-audio');
            const mordazaBtn = audioPanel ? audioPanel.querySelector('#btn-track-mordaza-m') : null;
            const ytPatchBtn = audioPanel ? audioPanel.querySelector('button[onclick*="selectYouTubeMobileSource"]') : null;
            const faderMaster = audioPanel ? audioPanel.querySelector('#m-master-volume') : null;

            return {
                window: { width: winW, height: winH },
                documentScrollHeight: docH,
                bodyScrollHeight: bodyH,
                scrollY: scrollY,
                isZeroWindowScroll: (docH <= winH + 1 && bodyH <= winH + 1),
                threeContainer: {
                    offsetHeight: threeContainer ? threeContainer.offsetHeight : 0,
                    bounds: threeRect,
                    expectedDvh35: Math.round(winH * 0.35)
                },
                tacticalDeck: {
                    offsetHeight: tacticalDeck ? tacticalDeck.offsetHeight : 0,
                    scrollHeight: tacticalDeck ? tacticalDeck.scrollHeight : 0,
                    bounds: deckRect,
                    isScrollable: tacticalDeck ? tacticalDeck.scrollHeight > tacticalDeck.clientHeight : false
                },
                bottomBar: {
                    offsetHeight: bottomBar ? bottomBar.offsetHeight : 0,
                    bounds: barRect,
                    isVisible: bottomBar ? !bottomBar.classList.contains('hidden') : false
                },
                desktopElementsHidden: {
                    leftColHidden: leftCol ? leftCol.classList.contains('hidden') || getComputedStyle(leftCol).display === 'none' : true,
                    tier2Hidden: tier2 ? tier2.classList.contains('hidden') || getComputedStyle(tier2).display === 'none' : true,
                    tier2SubHidden: tier2Sub ? tier2Sub.classList.contains('hidden') || getComputedStyle(tier2Sub).display === 'none' : true,
                    resizerHidden: resizer ? resizer.classList.contains('hidden') || getComputedStyle(resizer).display === 'none' : true
                },
                mobileElementsVisible: {
                    vpHudVisible: vpHud ? !vpHud.classList.contains('hidden') : false,
                    tacticalDeckVisible: tacticalDeck ? !tacticalDeck.classList.contains('hidden') : false,
                    bottomBarVisible: bottomBar ? !bottomBar.classList.contains('hidden') : false
                },
                audioPanelIntegrity: {
                    masterTrackMordazaPresent: !!mordazaBtn,
                    patchbayYtPresent: !!ytPatchBtn,
                    faderMasterPresent: !!faderMaster
                }
            };
        })()
    `);

    auditResults.layoutIntegrity = metrics390;
    auditResults.devicesTested.push({ name: 'iPhone 14 / Mobile 390x844', metrics: metrics390 });

    console.log('Metadatos de Layout Móvil (390 x 844):', JSON.stringify(metrics390, null, 2));

    // Capture baseline Audio tab screenshot
    const shotAudio = await cdp.captureScreenshot('mobile_390_tab_audio.png');
    console.log(`[Screenshot] Tab Audio capturado: ${shotAudio.artifactPath} (${shotAudio.size} bytes)`);

    // TEST ALL 6 TACTICAL DECK TABS WITH REAL BUTTON CLICKS
    const tabsToTest = [
        { btnId: 'm-tab-btn-stems', panelKey: 'stems', panelId: 'm-panel-stems', name: 'Stems 8 Biquad DSP', file: 'mobile_390_tab_stems.png' },
        { btnId: 'm-tab-btn-mundos', panelKey: 'mundos', panelId: 'm-panel-mundos', name: '14 Mundos Escénicos', file: 'mobile_390_tab_worlds.png' },
        { btnId: 'm-tab-btn-fx', panelKey: 'fx', panelId: 'm-panel-fx', name: 'Pedalboard 9 WebGL Passes', file: 'mobile_390_tab_fx.png' },
        { btnId: 'm-tab-btn-shaders', panelKey: 'shaders', panelId: 'm-panel-shaders', name: 'Live GLSL Shader Studio', file: 'mobile_390_tab_glsl.png' },
        { btnId: 'm-tab-btn-cloud', panelKey: 'cloud', panelId: 'm-panel-cloud', name: 'Macro Pad Cloud & Herramientas', file: 'mobile_390_tab_tools.png' },
        { btnId: 'm-tab-btn-audio', panelKey: 'audio', panelId: 'm-panel-audio', name: 'Audio & Ingesta Master', file: 'mobile_390_tab_audio_restored.png' }
    ];

    for (const t of tabsToTest) {
        console.log(`\nProbando conmutación a pestaña: [${t.name}]...`);
        const switchRes = await cdp.evaluate(`
            (() => {
                const btn = document.getElementById('${t.btnId}');
                if (btn) {
                    btn.click();
                } else if (typeof switchMobileTacticalDeck === 'function') {
                    switchMobileTacticalDeck('${t.panelKey}');
                }
                const panel = document.getElementById('${t.panelId}');
                return {
                    clicked: !!btn,
                    panelActive: panel ? !panel.classList.contains('hidden') : false,
                    panelHeight: panel ? panel.offsetHeight : 0,
                    panelChildren: panel ? panel.children.length : 0
                };
            })()
        `);
        await sleep(600);
        const shot = await cdp.captureScreenshot(t.file);
        auditResults.deckTabsTested.push({ tab: t.name, result: switchRes, screenshot: t.file });
        console.log(`  -> Panel activo: ${switchRes.panelActive} (alto: ${switchRes.panelHeight}px, hijos: ${switchRes.panelChildren}), screenshot: ${shot.artifactPath}`);
    }

    // DEVICE 2: Android Pixel 7 / Samsung Galaxy (412 x 915)
    console.log('\n--- PRUEBA 2: Dispositivo Android Pantalla Amplia (412 x 915 px) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 412,
        height: 915,
        deviceScaleFactor: 2.625,
        mobile: true,
        fitWindow: false,
        screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });
    await sleep(800);

    const metrics412 = await cdp.evaluate(`
        (() => {
            const winH = window.innerHeight;
            const docH = document.documentElement.scrollHeight;
            const bodyH = document.body.scrollHeight;
            return {
                window: { width: window.innerWidth, height: winH },
                documentScrollHeight: docH,
                isZeroWindowScroll: (docH <= winH + 1 && bodyH <= winH + 1),
                threeContainerH: document.getElementById('three-canvas-container')?.offsetHeight,
                tacticalDeckH: document.getElementById('mobile-tactical-deck')?.offsetHeight
            };
        })()
    `);
    console.log('Metadatos de Layout Android 412x915:', JSON.stringify(metrics412, null, 2));
    auditResults.devicesTested.push({ name: 'Android Pixel 7 (412x915)', metrics: metrics412 });

    const shotAndroid = await cdp.captureScreenshot('mobile_412_android_view.png');
    console.log(`[Screenshot] Android 412 capturado: ${shotAndroid.artifactPath}`);

    // TEST BOTTOM SHEET MODAL (YouTube Assistant)
    console.log('\n--- PRUEBA 3: Verificación de Bottom Sheet Modal táctil (YouTube Assistant) ---');
    const modalTestRes = await cdp.evaluate(`
        (() => {
            const ytBtn = document.getElementById('btn-yt-mobile') || document.querySelector('button[onclick*="openYouTubeMobileAssistant"]');
            if (ytBtn) ytBtn.click();
            else if (typeof openYouTubeMobileAssistant === 'function') openYouTubeMobileAssistant();

            const modal = document.getElementById('yt-mobile-modal');
            const isVisible = modal ? !modal.classList.contains('hidden') : false;
            const modalBox = modal ? modal.querySelector('div') : null;
            const isBottomSheet = modalBox ? modalBox.classList.contains('rounded-t-2xl') || modal.classList.contains('items-end') : false;
            return {
                opened: isVisible,
                isBottomSheet,
                modalId: 'yt-mobile-modal'
            };
        })()
    `);
    await sleep(600);
    const shotModal = await cdp.captureScreenshot('mobile_390_bottom_sheet_modal.png');
    console.log(`[Screenshot] Modal Bottom Sheet capturado: ${shotModal.artifactPath}`, modalTestRes);

    // Close modal
    await cdp.evaluate(`
        (() => {
            const closeBtn = document.querySelector('#yt-mobile-modal button[onclick*="close"]');
            if (closeBtn) closeBtn.click();
            else {
                const modal = document.getElementById('yt-mobile-modal');
                if (modal) modal.classList.add('hidden');
            }
        })()
    `);
    await sleep(300);

    // AUDIT LOGS AND ERRORS
    auditResults.errorsFound = cdp.errors;
    console.log(`\nAuditoría finalizada con ${cdp.errors.length} errores de consola detectados.`);

    // Cleanup
    cdp.close();
    chromeProc.kill();
    await sleep(800);
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch (e) {}

    // Save final report to JSON
    const reportPath = path.join(ARTIFACT_DIR, 'mobile_audit_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
    console.log(`\nInforme guardado en: ${reportPath}`);

    return auditResults;
}

runAudit().then(res => {
    console.log('\n✅ AUDITORÍA VISUAL MÓVIL COMPLETADA CON ÉXITO');
    process.exit(0);
}).catch(err => {
    console.error('\n❌ ERROR EN AUDITORÍA:', err);
    process.exit(1);
});
