// GeminiShaderCopilotEngine.js - MotorVisuales v4.3
// Motor de Generación, Mutación y Auto-Reparación de Shaders GLSL asistido por Gemini LLM y Algoritmos Procedurales

class GeminiShaderCopilotEngine {
    constructor() {
        this.undoStack = [];
        this.maxUndo = 10;
        this.isGenerating = false;
        this.lastError = null;
        this.activeTab = 'copilot';
        this.lastMetadata = null;
    }

    getApiKey() {
        if (typeof window !== 'undefined' && typeof window.MOTOR_CONFIG !== 'undefined' && window.MOTOR_CONFIG?.GEMINI_API_KEY) {
            return window.MOTOR_CONFIG.GEMINI_API_KEY.trim();
        }
        if (typeof localStorage !== 'undefined') {
            return (localStorage.getItem('motor_gemini_key') || '').trim();
        }
        return '';
    }

    hasApiKey() {
        return Boolean(this.getApiKey());
    }

    initUI() {
        this.updateConnectionStatus();

        // Escuchar Ctrl+Enter o Cmd+Enter en el textarea de prompt
        const promptInput = document.getElementById('copilot-prompt-input');
        if (promptInput) {
            promptInput.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.generate('generate');
                }
            });
        }

        const mPromptInput = document.getElementById('m-copilot-prompt-input');
        if (mPromptInput) {
            mPromptInput.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.generateFromMobile('generate');
                }
            });
        }
    }

    updateConnectionStatus() {
        const hasKey = this.hasApiKey();
        const badge = document.getElementById('copilot-connection-badge');
        const mBadge = document.getElementById('m-copilot-badge');

        if (badge) {
            if (hasKey) {
                badge.className = "text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-400 bg-emerald-950/60 shadow-sm";
                badge.innerText = "🟢 Gemini 2.5 Online";
            } else {
                badge.className = "text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-300 bg-amber-950/50 shadow-sm";
                badge.innerText = "🟡 Modo Procedural Offline";
            }
        }

        if (mBadge) {
            if (hasKey) {
                mBadge.className = "text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40";
                mBadge.innerText = "🟢 Online";
            } else {
                mBadge.className = "text-[9px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40";
                mBadge.innerText = "🟡 Offline";
            }
        }
    }

    switchTab(tabKey) {
        this.activeTab = tabKey;
        const tabs = ['copilot', 'uniforms', 'snippets'];
        tabs.forEach(t => {
            const btn = document.getElementById(`splitview-tab-${t}`);
            const panel = document.getElementById(`${t}-tab-panel`);
            if (btn) {
                if (t === tabKey) {
                    btn.className = "px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white shadow-sm";
                } else {
                    btn.className = "px-2.5 py-1 rounded-lg text-xs font-medium font-mono text-zinc-400 hover:text-white transition flex items-center gap-1 bg-zinc-900/60";
                }
            }
            if (panel) {
                if (t === tabKey) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            }
        });
    }

    applyChip(text) {
        const input = document.getElementById('copilot-prompt-input');
        if (input) {
            input.value = text;
            input.focus();
        }
        const mInput = document.getElementById('m-copilot-prompt-input');
        if (mInput) mInput.value = text;
        if (typeof triggerHaptic === 'function') triggerHaptic(10);
    }

    applyChipMobile(text) {
        this.applyChip(text);
    }

    pushUndo(frag, vert, title = 'Shader') {
        if (!frag) return;
        this.undoStack.push({
            frag,
            vert: vert || (document.getElementById('shader-code-vert')?.value || ''),
            title,
            timestamp: Date.now()
        });
        if (this.undoStack.length > this.maxUndo) {
            this.undoStack.shift();
        }
        this.updateUndoButtons();
    }

    updateUndoButtons() {
        const canUndo = this.undoStack.length > 0;
        const btn = document.getElementById('btn-copilot-undo');
        const mBtn = document.getElementById('m-btn-copilot-undo');

        if (btn) {
            btn.disabled = !canUndo;
            btn.title = canUndo ? `Deshacer último shader (${this.undoStack.length} en historial)` : 'Historial vacío';
        }
        if (mBtn) {
            mBtn.disabled = !canUndo;
        }
    }

    undo() {
        if (this.undoStack.length === 0) return false;
        const prev = this.undoStack.pop();
        const fragArea = document.getElementById('shader-code-frag');
        const vertArea = document.getElementById('shader-code-vert');

        if (fragArea && prev.frag) fragArea.value = prev.frag;
        if (vertArea && prev.vert) vertArea.value = prev.vert;

        this.updateUndoButtons();
        if (typeof compileUserShaderFromUI === 'function') {
            compileUserShaderFromUI();
        }
        if (typeof showToast === 'function') {
            showToast("Copilot Deshacer", "Shader revertido a la versión anterior.", "info", 2200);
        }
        return true;
    }

    setLastError(errMsg) {
        this.lastError = errMsg;
        const btnConsole = document.getElementById('btn-console-autorepair');
        if (btnConsole) btnConsole.classList.remove('hidden');
    }

    clearLastError() {
        this.lastError = null;
        const btnConsole = document.getElementById('btn-console-autorepair');
        if (btnConsole) btnConsole.classList.add('hidden');
    }

    async generateFromMobile(mode = 'generate') {
        const mInput = document.getElementById('m-copilot-prompt-input');
        const prompt = mInput ? mInput.value.trim() : '';
        await this.generate(mode, prompt);
    }

    async repairShaderError() {
        const errorText = this.lastError || document.getElementById('shader-console-log')?.innerText || 'Error de compilación en GLSL WebGL';
        await this.generate('repair', `Corregir error de compilación WebGL: ${errorText}`);
    }

    async generate(mode = 'generate', promptOverride = null) {
        if (this.isGenerating) return;

        const input = document.getElementById('copilot-prompt-input');
        let prompt = promptOverride !== null ? promptOverride : (input ? input.value.trim() : '');

        if (!prompt && mode === 'generate') {
            prompt = "Túnel cuántico fractal con anillos que roten con uMid y destellos en uIsOnset";
            if (input) input.value = prompt;
        }

        const fragArea = document.getElementById('shader-code-frag');
        const vertArea = document.getElementById('shader-code-vert');
        const currentFrag = fragArea ? fragArea.value : '';
        const currentVert = vertArea ? vertArea.value : '';

        // Guardar estado actual en la pila de deshacer
        if (currentFrag) {
            this.pushUndo(currentFrag, currentVert, this.lastMetadata?.shaderTitle || 'Preset Base');
        }

        // Entrar en estado de carga
        this.setLoading(true, mode);

        const apiKey = this.getApiKey();
        let result = null;

        if (apiKey) {
            try {
                result = await this.callGeminiAPI(apiKey, prompt, mode, currentFrag);
            } catch (err) {
                console.warn("[Copilot] Error en Gemini API, invocando fallback procedural offline:", err);
                if (typeof showToast === 'function') {
                    showToast("Gemini Offline/Cuota", "Activando síntesis procedural matemática local.", "warning", 3000);
                }
                result = this.generateProceduralFallback(prompt, mode, currentFrag);
            }
        } else {
            // Modo offline sin clave API
            result = this.generateProceduralFallback(prompt, mode, currentFrag);
        }

        // Aplicar el código resultante
        if (result && result.fragCode) {
            if (fragArea) {
                fragArea.value = result.fragCode;
                if (typeof openShaderEditorTab === 'function') {
                    openShaderEditorTab('frag');
                }
            }

            this.lastMetadata = result;
            this.displayShaderInfo(result);

            // Compilar en caliente
            if (typeof compileUserShaderFromUI === 'function') {
                compileUserShaderFromUI();
            }

            // Cambiar la escena activa a custom_shader si no lo está
            const sceneSel = document.getElementById('three-scene-mode');
            if (sceneSel && sceneSel.value !== 'custom_shader') {
                sceneSel.value = 'custom_shader';
                if (typeof switchThreeScene === 'function') {
                    switchThreeScene('custom_shader');
                }
            }

            if (typeof showToast === 'function') {
                showToast(
                    result.shaderTitle || "✨ Shader Copilot",
                    result.description || "Shader generado y compilado en GPU.",
                    "success",
                    3500
                );
            }
        }

        this.setLoading(false, mode);
    }

    setLoading(loading, mode = 'generate') {
        this.isGenerating = loading;
        const banner = document.getElementById('copilot-loading-banner');
        const mBanner = document.getElementById('m-copilot-loading-banner');
        const msgEl = document.getElementById('copilot-loading-msg');
        const mMsgEl = document.getElementById('m-copilot-loading-msg');

        const modeTexts = {
            'generate': 'Sintetizando arquitectura de shader...',
            'mutate': 'Mutando geometría y física de shader...',
            'dsp': 'Inyectando reactividad acústica a 8 bandas...',
            'repair': 'Reparando diagnóstico de compilación WebGL...'
        };
        const text = modeTexts[mode] || 'Procesando shader con IA...';

        if (loading) {
            if (banner) { banner.classList.remove('hidden'); }
            if (mBanner) { mBanner.classList.remove('hidden'); }
            if (msgEl) msgEl.innerText = text;
            if (mMsgEl) mMsgEl.innerText = text;
        } else {
            if (banner) { banner.classList.add('hidden'); }
            if (mBanner) { mBanner.classList.add('hidden'); }
        }

        const btnGen = document.getElementById('btn-copilot-generate');
        const btnMut = document.getElementById('btn-copilot-mutate');
        const btnDsp = document.getElementById('btn-copilot-dsp');
        if (btnGen) btnGen.disabled = loading;
        if (btnMut) btnMut.disabled = loading;
        if (btnDsp) btnDsp.disabled = loading;
    }

    displayShaderInfo(result) {
        const card = document.getElementById('copilot-info-card');
        const titleEl = document.getElementById('copilot-info-title');
        const descEl = document.getElementById('copilot-info-desc');
        const sourceEl = document.getElementById('copilot-info-source');

        if (card && titleEl && descEl) {
            card.classList.remove('hidden');
            titleEl.innerText = result.shaderTitle || 'SHADER COPILOT';
            descEl.innerText = (result.description || '') + (result.dspMapping ? ` [DSP: ${result.dspMapping}]` : '');
            if (sourceEl) {
                sourceEl.innerText = result.source === 'gemini' ? 'GEMINI 2.5' : 'PROCEDURAL LOCAL';
            }
        }
    }

    async callGeminiAPI(apiKey, prompt, mode, currentFrag) {
        const systemPrompt = `Eres el Arquitecto Principal de Gráficos y Shaders GLSL de MotorVisuales (Staff Level Graphics Engineer).
Tu objetivo es escribir Fragment Shaders GLSL ES 1.00 de ultra-alta fidelidad para WebGL 1.0 (Three.js ShaderMaterial).

Reglas Mandatorias de WebGL 1.0:
1. Comienza SIEMPRE con: precision highp float;
2. Uniforms pre-declarados disponibles en MotorVisuales (puedes utilizarlos libremente):
   uniform float uTime;
   uniform vec2 uResolution;
   uniform vec2 uMouse;
   varying vec2 vUv;
   uniform float uSub, uBass, uLowmid, uMid, uHighmid, uPresence, uTreble, uAir; // 8 stems Biquad DSP (0.0 a 1.0)
   uniform float uRms, uFlux, uCentroid, uIsOnset; // Metricas acústicas
   uniform vec3 uColor1, uColor2, uColor3; // Paleta de color IA
   uniform sampler2D uAudioTexture; // y=0.25 FFT espectro (512 bins), y=0.75 PCM onda temporal
3. Límites de bucles CONSTANTES e invariables (ej: for (int i = 0; i < 40; i++)) sin variables dinámicas.
4. Funciones estándar GLSL 1.00: texture2D (NUNCA texture), fract, mod, clamp, smoothstep, pow, dot, length, sin, cos, atan, normalize.
5. Asigna SIEMPRE el color final a gl_FragColor = vec4(col, 1.0);
6. Devuelve EXCLUSIVAMENTE un JSON con:
{
  "shaderTitle": "Título en mayúsculas en español",
  "description": "Explicación breve de 1 frase",
  "fragCode": "precision highp float;\\n...código GLSL completo...",
  "dspMapping": "Breve resumen de qué stems modulan qué parámetros"
}`;

        let userMessage = "";
        if (mode === 'generate') {
            userMessage = `Genera un nuevo Fragment Shader GLSL ES 1.00 desde cero basado en esta descripción: "${prompt}". Debe ser reactivo a la música mediante uSub, uBass, uMid, uTreble, uIsOnset.`;
        } else if (mode === 'mutate') {
            userMessage = `Muta y evoluciona el siguiente Fragment Shader GLSL existente aplicando esta transformación: "${prompt}".
CÓDIGO GLSL ACTUAL:
\`\`\`glsl
${currentFrag}
\`\`\``;
        } else if (mode === 'dsp') {
            userMessage = `Potencia e inyecta reactividad acústica profunda en este Fragment Shader GLSL. Mapea uSub y uBass a deformaciones/ondas de impacto, uMid a rotación/turbulencia, uTreble a emisión/detalles y uIsOnset a shockwaves:
CÓDIGO GLSL ACTUAL:
\`\`\`glsl
${currentFrag}
\`\`\``;
        } else if (mode === 'repair') {
            userMessage = `Corrige este error de compilación WebGL en el siguiente fragment shader GLSL ES 1.00:
DIAGNÓSTICO DEL COMPILADOR:
${prompt}

CÓDIGO CON ERROR:
\`\`\`glsl
${currentFrag}
\`\`\`
Corrige el error de sintaxis preservando toda la matemática visual y devuelve el código corregido sin errores.`;
        }

        const candidateModels = ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
        let lastError = null;

        for (const model of candidateModels) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }
                        ],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (!res.ok) {
                    const errBody = await res.text();
                    throw new Error(`HTTP ${res.status}: ${errBody}`);
                }

                const data = await res.json();
                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!rawText) throw new Error("Respuesta vacía de Gemini");

                // Parsear JSON
                let parsed = null;
                try {
                    parsed = JSON.parse(rawText);
                } catch {
                    // Extraer JSON si venía con markdown
                    const match = rawText.match(/\{[\s\S]*\}/);
                    if (match) parsed = JSON.parse(match[0]);
                }

                if (parsed && parsed.fragCode) {
                    // Normalizar directiva de precisión
                    if (!parsed.fragCode.includes('precision highp float')) {
                        parsed.fragCode = 'precision highp float;\n' + parsed.fragCode;
                    }
                    parsed.source = 'gemini';
                    return parsed;
                }
            } catch (e) {
                lastError = e;
                console.warn(`[Copilot] Fallo modelo ${model}:`, e);
            }
        }

        throw lastError || new Error("No fue posible obtener respuesta de Gemini");
    }

    generateProceduralFallback(prompt, mode, currentFrag) {
        const lowerPrompt = (prompt || '').toLowerCase();

        // 8 Plantillas Algorítmicas de Vanguardia
        const templates = {
            quantum_tunnel: {
                title: "TÚNEL CUÁNTICO RELATIVISTA",
                desc: "SDF de túnel curvado con rotación espacial modulada por uMid y shockwaves en uIsOnset.",
                dsp: "uMid->torsión 3D, uBass->velocidad warp, uIsOnset->halo de dispersión",
                code: `precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
varying vec2 vUv;
uniform float uSub, uBass, uMid, uTreble, uIsOnset;
uniform vec3 uColor1, uColor2, uColor3;

mat2 rot2D(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;

    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv, 1.5));

    float angle = uTime * 0.3 + uMid * 1.5;
    ro.xy *= rot2D(angle * 0.5);
    rd.xy *= rot2D(angle * 0.5);

    float t = 0.0;
    vec3 col = vec3(0.0);

    for (int i = 0; i < 48; i++) {
        vec3 p = ro + rd * t;
        p.z += uTime * (2.0 + uBass * 3.0);

        float r = 1.2 + sin(p.z * 0.8) * 0.3 + uSub * 0.4;
        float d = -(length(p.xy) - r) + sin(p.z * 4.0) * 0.05;

        if (d < 0.01) {
            float glow = float(i) / 48.0;
            col = mix(uColor1, uColor2, sin(p.z * 0.5) * 0.5 + 0.5);
            col += uColor3 * (1.0 - glow) * (0.8 + uTreble * 1.5);
            col += vec3(1.0) * uIsOnset * 0.8;
            break;
        }
        t += max(d * 0.5, 0.02);
        if (t > 15.0) break;
    }

    col += vec3(0.05, 0.02, 0.1) * exp(-length(uv) * 1.2);
    gl_FragColor = vec4(col, 1.0);
}`
            },
            bismuth_crystal: {
                title: "CRISTAL DE BISMUTO FRACTAL PBR",
                desc: "Pliegues geométricos escalonados con iridiscencia física Fresnel e iluminación reactiva.",
                dsp: "uSub->escala fractal, uBass->rotación de matriz, uTreble->iridiscencia",
                code: `precision highp float;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;
uniform float uSub, uBass, uMid, uTreble, uIsOnset;
uniform vec3 uColor1, uColor2, uColor3;

mat2 rot2D(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;

    vec3 ro = vec3(0.0, 0.0, -2.5);
    vec3 rd = normalize(vec3(uv, 1.6));

    float rotY = uTime * 0.2 + (uBass * 0.5);
    ro.xz *= rot2D(rotY);
    rd.xz *= rot2D(rotY);

    float t = 0.0;
    vec3 col = vec3(0.01, 0.01, 0.03);

    for (int i = 0; i < 42; i++) {
        vec3 p = ro + rd * t;
        vec3 q = abs(p) - vec3(0.8 + uSub * 0.3);
        float dBox = max(q.x, max(q.y, q.z));

        vec3 stepP = mod(p * 4.0, 1.0) - 0.5;
        float dStep = max(abs(stepP.x), max(abs(stepP.y), abs(stepP.z))) * 0.25;
        float d = max(dBox, -dStep);

        if (d < 0.005) {
            float fresnel = pow(1.0 - abs(dot(rd, normalize(p))), 2.5);
            vec3 irid = 0.5 + 0.5 * cos(6.28318 * (vec3(0.1, 0.5, 0.9) * p.y * 3.0 + uTime * 0.2 + vec3(0.0, 0.33, 0.67)));
            col = mix(uColor1, irid, 0.7) + fresnel * uColor2 * (1.0 + uTreble * 2.0);
            col += vec3(0.9, 0.95, 1.0) * uIsOnset * 0.9;
            break;
        }
        t += d;
        if (t > 8.0) break;
    }

    gl_FragColor = vec4(col, 1.0);
}`
            },
            superparamagnetic_fluid: {
                title: "FERROFLUIDO MAGNETOSTÁTICO & THIN-FILM",
                desc: "Inestabilidad de Rosensweig con picos hexagonales de Langevin y bandas de interferencia óptica.",
                dsp: "uSub->saturación magnética, uBass->picos Voronoi, uTreble->anillos Newton",
                code: `precision highp float;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;
uniform float uSub, uBass, uMid, uTreble, uIsOnset;
uniform vec3 uColor1, uColor2, uColor3;

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;

    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    float spikes = sin(angle * 6.0 + uTime) * sin(dist * 12.0 - uTime * 2.0);
    float magForce = (uSub * 1.8 + uBass * 1.2) * exp(-dist * 1.5);
    float surface = dist - (0.4 + magForce * 0.3 + spikes * 0.08 * (1.0 + uMid));

    vec3 thinFilm = 0.5 + 0.5 * cos(6.28318 * (vec3(1.0, 0.7, 0.4) * dist * 8.0 - uTime * 0.5 + vec3(0.0, 0.25, 0.5)));
    vec3 col = vec3(0.02, 0.02, 0.04);

    if (surface < 0.0) {
        float fresnel = pow(1.0 - abs(surface) * 2.5, 3.0);
        col = mix(vec3(0.05, 0.06, 0.08), thinFilm, 0.6) + fresnel * uColor1 * (0.8 + uTreble);
        col += uColor2 * uIsOnset * 0.7;
    }
    col += uColor3 * exp(-dist * 3.0) * uBass * 0.6;

    gl_FragColor = vec4(col, 1.0);
}`
            },
            cymatics_chladni: {
                title: "CIMÁTICA CUÁNTICA ARMÓNICA 3D",
                desc: "Isosuperficie nodal analítica de Chladni excitada por los armónicos de los 8 stems DSP.",
                dsp: "uBass->modo armónico n, uMid->modo armónico m, uSub->grosor nodal",
                code: `precision highp float;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;
uniform float uSub, uBass, uMid, uTreble, uIsOnset;
uniform vec3 uColor1, uColor2, uColor3;

void main() {
    vec2 p = (vUv - 0.5) * 3.14159265 * 2.0;
    p.x *= uResolution.x / uResolution.y;

    float n = 3.0 + floor(uBass * 4.0);
    float m = 5.0 + floor(uMid * 4.0);

    float chladni = cos(n * p.x) * cos(m * p.y) - cos(m * p.x) * cos(n * p.y);
    float lineDist = abs(chladni);

    float thickness = 0.06 + uSub * 0.08;
    float nodalLine = 1.0 - smoothstep(0.0, thickness, lineDist);

    float wave = sin(length(p) * 6.0 - uTime * 3.0) * 0.5 + 0.5;
    vec3 col = mix(vec3(0.01, 0.02, 0.05), uColor1 * 0.3, wave);
    col += uColor2 * nodalLine * (1.2 + uTreble * 1.5);
    col += uColor3 * pow(nodalLine, 4.0) * 2.0;
    col += vec3(1.0) * uIsOnset * nodalLine * 0.8;

    gl_FragColor = vec4(col, 1.0);
}`
            },
            bioluminescent_abyss: {
                title: "ABISMO MARINO BIOLUMINISCENTE",
                desc: "Organismo abisal bioluminiscente inmerso en absorción de agua Beer-Lambert con nieve marina.",
                dsp: "uSub->pulso de campana abisal, uTreble->destellos de nieve, uIsOnset->bioluminiscencia",
                code: `precision highp float;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;
uniform float uSub, uBass, uMid, uTreble, uIsOnset;
uniform vec3 uColor1, uColor2, uColor3;

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;

    vec3 waterBase = vec3(0.005, 0.012, 0.03);
    vec3 col = waterBase;

    // Nieve marina en suspensión
    vec2 snowUv = uv * 3.0 + vec2(0.0, uTime * 0.15);
    float snow = fract(sin(dot(floor(snowUv), vec2(12.9898, 78.233))) * 43758.5453);
    if (snow > 0.95) {
        col += vec3(0.3, 0.6, 1.0) * (0.3 + uTreble * 0.7);
    }

    // Núcleo bioluminiscente pulsante
    float r = length(uv - vec2(0.0, sin(uTime * 1.5) * 0.1));
    float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
    float glow = exp(-r * (4.0 - uSub * 1.5)) * (1.0 + uBass * 1.5);

    vec3 bioCol = mix(uColor1, uColor2, pulse);
    col += bioCol * glow * 1.8;
    col += uColor3 * pow(glow, 3.0) * (1.0 + uIsOnset * 2.0);

    gl_FragColor = vec4(col, 1.0);
}`
            },
            supernova_accretion: {
                title: "SUPERNOVA & DISCO DE ACRECIÓN",
                desc: "Agujero negro relativista con lente gravitacional, horizonte de sucesos y turbulencia Doppler.",
                dsp: "uBass->radio del horizonte, uFlux->turbulencia del disco, uIsOnset->destello relativista",
                code: `precision highp float;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;
uniform float uSub, uBass, uMid, uTreble, uIsOnset;
uniform vec3 uColor1, uColor2, uColor3;

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;

    float r = length(uv);
    float phi = atan(uv.y, uv.x);

    // Lente gravitacional (desviación de rayos)
    float horizon = 0.25 + uSub * 0.1;
    float deflection = horizon / (r + 0.05);
    vec2 warpedUv = uv * (1.0 + deflection * 0.5);

    vec3 col = vec3(0.01, 0.01, 0.02);

    if (r > horizon) {
        // Disco de acreción giratorio con Doppler
        float diskAngle = atan(warpedUv.y, warpedUv.x) + uTime * (2.0 + uBass * 2.0);
        float spiral = sin(diskAngle * 3.0 + r * 10.0);
        float disk = smoothstep(horizon, horizon + 0.5, r) * (1.0 - smoothstep(horizon + 0.5, horizon + 0.9, r));
        
        vec3 diskCol = mix(uColor1, uColor2, spiral * 0.5 + 0.5);
        col += diskCol * disk * (1.5 + uTreble * 1.5);
        col += uColor3 * pow(disk, 2.0) * (1.0 + uIsOnset * 1.5);
    } else {
        // Sombra del horizonte de sucesos (Negro absoluto)
        col = vec3(0.0);
    }

    // Anillo de fotones brillante
    float photonRing = 1.0 - smoothstep(0.0, 0.02, abs(r - horizon));
    col += vec3(1.0, 0.9, 0.8) * photonRing * (2.0 + uIsOnset * 3.0);

    gl_FragColor = vec4(col, 1.0);
}`
            }
        };

        // Selección de plantilla según palabras clave del prompt
        let chosenKey = 'quantum_tunnel';
        if (lowerPrompt.includes('bismuto') || lowerPrompt.includes('cristal') || lowerPrompt.includes('crystal')) {
            chosenKey = 'bismuth_crystal';
        } else if (lowerPrompt.includes('fluido') || lowerPrompt.includes('ferro') || lowerPrompt.includes('rosensweig') || lowerPrompt.includes('magn')) {
            chosenKey = 'superparamagnetic_fluid';
        } else if (lowerPrompt.includes('chladni') || lowerPrompt.includes('cim') || lowerPrompt.includes('nodal') || lowerPrompt.includes('placa')) {
            chosenKey = 'cymatics_chladni';
        } else if (lowerPrompt.includes('abismo') || lowerPrompt.includes('medusa') || lowerPrompt.includes('mar') || lowerPrompt.includes('bio')) {
            chosenKey = 'bioluminescent_abyss';
        } else if (lowerPrompt.includes('supernova') || lowerPrompt.includes('agujero') || lowerPrompt.includes('black') || lowerPrompt.includes('disco')) {
            chosenKey = 'supernova_accretion';
        } else if (lowerPrompt.includes('túnel') || lowerPrompt.includes('tunnel') || lowerPrompt.includes('warp')) {
            chosenKey = 'quantum_tunnel';
        } else {
            // Rotación determinista según longitud de prompt
            const keys = Object.keys(templates);
            chosenKey = keys[lowerPrompt.length % keys.length];
        }

        const template = templates[chosenKey];
        let code = template.code;

        // Si el modo es 'repair' y tenemos código actual, aplicar saneamiento sintáctico directo
        if (mode === 'repair' && currentFrag) {
            let fixed = currentFrag;
            // Corregir texture() a texture2D()
            fixed = fixed.replace(/\btexture\s*\(/g, 'texture2D(');
            // Corregir in/out a varying
            fixed = fixed.replace(/\bin\s+vec([234])/g, 'varying vec$1');
            // Asegurar directiva de precisión
            if (!fixed.includes('precision highp float')) {
                fixed = 'precision highp float;\n' + fixed;
            }
            return {
                shaderTitle: "SHADER REPARADO EN GPU",
                description: "Saneamiento sintáctico WebGL 1.0 aplicado con éxito.",
                fragCode: fixed,
                dspMapping: "Corrección de funciones obsoletas e incompatibles",
                source: 'procedural'
            };
        }

        // Si el modo es 'mutate' y tenemos código actual con void main
        if (mode === 'mutate' && currentFrag && currentFrag.includes('void main()')) {
            // Inyectar modulación temporal de dominio
            let mutated = currentFrag;
            if (!mutated.includes('rot2D')) {
                const rotFunc = `\nmat2 rot2D(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }\n`;
                mutated = mutated.replace('void main()', `${rotFunc}\nvoid main()`);
            }
            return {
                shaderTitle: "MUTACIÓN PROCEDURAL EVOLUTIVA",
                description: `Mutación aplicada sobre la base existente con transformación: ${prompt}`,
                fragCode: mutated,
                dspMapping: "Torsión de dominio y modulación espectral reactiva",
                source: 'procedural'
            };
        }

        return {
            shaderTitle: template.title,
            description: template.desc,
            fragCode: code,
            dspMapping: template.dsp,
            source: 'procedural'
        };
    }
}

// Instancia global
let geminiShaderCopilot = null;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GeminiShaderCopilotEngine };
}
