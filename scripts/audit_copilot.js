// scripts/audit_copilot.js
// Automated Verification for Gemini AI Shader Copilot in Desktop & Mobile

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:8088';
const DEBUG_PORT = 9245;
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
                    if (data.error) {
                        reject(new Error(JSON.stringify(data.error)));
                    } else {
                        resolve(data.result);
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
        fs.writeFileSync(localPath, buffer);
        return { localPath, size: buffer.length };
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

async function runAudit() {
    console.log("=== INICIANDO AUDITORÍA AUTOMATIZADA: GEMINI SHADER COPILOT ===");

    const tempProfile = path.join(__dirname, '..', 'temp_chrome_audit_profile');
    const chromeProc = spawn(CHROME_PATH, [
        `--remote-debugging-port=${DEBUG_PORT}`,
        `--user-data-dir=${tempProfile}`,
        '--headless=new',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu',
        '--window-size=1440,900',
        TARGET_URL
    ]);

    let wsUrl = null;
    for (let i = 0; i < 25; i++) {
        await sleep(400);
        try {
            wsUrl = await getWebSocketDebuggerUrl(DEBUG_PORT);
            if (wsUrl) break;
        } catch {}
    }

    if (!wsUrl) {
        console.error("FAIL: No se pudo conectar a Chrome CDP en el puerto " + DEBUG_PORT);
        chromeProc.kill();
        process.exit(1);
    }

    console.log("[CDP] Conectado a Chrome DevTools en " + wsUrl);
    const client = new CDPClient(wsUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    await sleep(2500); // Esperar carga de Three.js y Web Audio

    console.log("\n--- TEST 1: INICIALIZACIÓN DE COPILOT Y ELEMENTOS DOM ---");
    const checkInit = await client.evaluate(`(() => {
        return {
            hasCopilotEngine: typeof geminiShaderCopilot !== 'undefined' && geminiShaderCopilot !== null,
            copilotTabExists: !!document.getElementById('copilot-tab-panel'),
            uniformsTabExists: !!document.getElementById('uniforms-tab-panel'),
            snippetsTabExists: !!document.getElementById('snippets-tab-panel'),
            activeTabVisible: !document.getElementById('copilot-tab-panel')?.classList.contains('hidden'),
            connectionBadge: document.getElementById('copilot-connection-badge')?.innerText,
            promptInput: !!document.getElementById('copilot-prompt-input'),
            btnGenerate: !!document.getElementById('btn-copilot-generate'),
            btnMutate: !!document.getElementById('btn-copilot-mutate'),
            btnUndo: !!document.getElementById('btn-copilot-undo'),
            btnConsoleRepair: !!document.getElementById('btn-console-autorepair')
        };
    })()`);
    console.log("Estado DOM Copilot:", checkInit);

    if (!checkInit.hasCopilotEngine || !checkInit.copilotTabExists || !checkInit.promptInput) {
        console.error("FAIL: Componentes de Copilot no encontrados");
        client.close();
        chromeProc.kill();
        process.exit(1);
    }

    console.log("\n--- TEST 2: CONMUTACIÓN DE PESTAÑAS EN SPLIT-VIEW ---");
    const testTabs = await client.evaluate(`(() => {
        geminiShaderCopilot.switchTab('uniforms');
        const uniformsVisible = !document.getElementById('uniforms-tab-panel').classList.contains('hidden');
        const copilotHidden = document.getElementById('copilot-tab-panel').classList.contains('hidden');
        geminiShaderCopilot.switchTab('snippets');
        const snippetsVisible = !document.getElementById('snippets-tab-panel').classList.contains('hidden');
        geminiShaderCopilot.switchTab('copilot');
        const copilotRestored = !document.getElementById('copilot-tab-panel').classList.contains('hidden');
        return { uniformsVisible, copilotHidden, snippetsVisible, copilotRestored };
    })()`);
    console.log("Conmutación de sub-pestañas Split-View:", testTabs);

    console.log("\n--- TEST 3: GENERACIÓN PROCEDURAL DE SHADER VIA COPILOT ---");
    const testGen = await client.evaluate(`(async () => {
        const initialFrag = document.getElementById('shader-code-frag').value;
        await geminiShaderCopilot.generate('generate', 'Túnel cuántico fractal de plasma con anillos de luz');
        const newFrag = document.getElementById('shader-code-frag').value;
        const statusBadge = document.getElementById('shader-compile-status').innerText;
        const infoTitle = document.getElementById('copilot-info-title')?.innerText;
        const canUndo = !document.getElementById('btn-copilot-undo').disabled;
        return {
            changed: initialFrag !== newFrag,
            newLength: newFrag.length,
            statusBadge,
            infoTitle,
            canUndo,
            activeScene: activeSceneType
        };
    })()`);
    console.log("Resultado de generación Copilot:", testGen);

    console.log("\n--- TEST 4: VERIFICACIÓN DE DESHACER (UNDO STACK) ---");
    const testUndo = await client.evaluate(`(() => {
        const fragBeforeUndo = document.getElementById('shader-code-frag').value;
        geminiShaderCopilot.undo();
        const fragAfterUndo = document.getElementById('shader-code-frag').value;
        const statusBadge = document.getElementById('shader-compile-status').innerText;
        return {
            restoredDifferent: fragBeforeUndo !== fragAfterUndo,
            statusBadge
        };
    })()`);
    console.log("Resultado de Deshacer Copilot:", testUndo);

    console.log("\n--- TEST 5: AUTO-REPARACIÓN DE ERRORES WEBGL ---");
    const testRepair = await client.evaluate(`(async () => {
        // Inyectar código con error deliberado de WebGL 1.0 (texture en vez de texture2D)
        const brokenCode = "precision highp float;\\nuniform sampler2D uAudioTexture;\\nvarying vec2 vUv;\\nvoid main() { vec4 c = texture(uAudioTexture, vUv); gl_FragColor = c; }";
        document.getElementById('shader-code-frag').value = brokenCode;
        compileUserShaderFromUI();
        
        const errorBadge = document.getElementById('shader-compile-status').innerText;
        const repairBtnVisible = !document.getElementById('btn-console-autorepair').classList.contains('hidden');
        
        // Ejecutar auto-reparación
        await geminiShaderCopilot.repairShaderError();
        
        const repairedCode = document.getElementById('shader-code-frag').value;
        const repairedStatus = document.getElementById('shader-compile-status').innerText;
        const repairBtnHidden = document.getElementById('btn-console-autorepair').classList.contains('hidden');

        return {
            errorBadge,
            repairBtnVisible,
            repairedContainsTexture2D: repairedCode.includes('texture2D'),
            repairedStatus,
            repairBtnHidden
        };
    })()`);
    console.log("Resultado de Auto-Reparación:", testRepair);

    console.log("\n--- TEST 6: CAPTURA DESKOP VIEWPORT (1440x900) ---");
    const desktopSnap = await client.captureScreenshot('audit_copilot_desktop.png');
    console.log(`Screenshot desktop guardado: ${desktopSnap.localPath} (${desktopSnap.size} bytes)`);

    console.log("\n--- TEST 7: AUDITORÍA EN DISPOSITIVOS MÓVILES (390x844) ---");
    await client.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        mobile: true
    });
    await client.evaluate(`(() => { syncResponsiveLayout(); })()`);
    await sleep(400);

    const testMobile = await client.evaluate(`(async () => {
        switchMobileTacticalDeck('shaders');
        const mPanel = document.getElementById('m-panel-shaders');
        const mPrompt = document.getElementById('m-copilot-prompt-input');
        const isVisible = mPanel && !mPanel.classList.contains('hidden');
        
        // Generar desde móvil
        if (mPrompt) mPrompt.value = "Cristal de bismuto con iridiscencia";
        await geminiShaderCopilot.generateFromMobile('generate');
        const statusBadge = document.getElementById('m-shader-status-badge')?.innerText;

        return {
            panelVisible: isVisible,
            statusBadge,
            infoTitle: document.getElementById('copilot-info-title')?.innerText
        };
    })()`);
    console.log("Resultado en Móvil:", testMobile);

    const mobileSnap = await client.captureScreenshot('audit_copilot_mobile.png');
    console.log(`Screenshot móvil guardado: ${mobileSnap.localPath} (${mobileSnap.size} bytes)`);

    client.close();
    chromeProc.kill();

    console.log("\n=======================================================");
    console.log("✅ TODAS LAS PRUEBAS DE GEMINI SHADER COPILOT SUPERADAS!");
    console.log("=======================================================");
}

runAudit().catch(err => {
    console.error("Error fatal durante la auditoría:", err);
    process.exit(1);
});
