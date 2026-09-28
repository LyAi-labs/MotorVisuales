# MEMORY.md — MotorVisuales

## Contexto del Proyecto
- **Proyecto:** MotorVisuales — Visualizador de audio reactivo en tiempo real
- **Archivo principal:** `c:\MotorVisuales\index.html` (~1580 líneas)
- **Servidor:** `python -m http.server 8088` (puertos 3000 y 5000 ocupados)
- **URL local:** `http://localhost:8088`
- **Navegador:** Google Chrome

## Preferencias del Usuario
- **Idioma:** Español (toda la UI y comunicación)
- **Modo:** Permisos Turbo — ejecutar directamente sin pedir confirmación
- **Track de prueba:** `c:\MotorVisuales\tema.mp3` ("Mordaza", 4.5 MB)
- **Enlaces Clickeables:** Todas las URLs (ej: localhost, puertos, docs) y enlaces a archivos DEBEN ser SIEMPRE enlaces markdown clickeables (ej: [http://localhost:8088](http://localhost:8088)), NUNCA texto plano o código inline entre backticks.

## Arquitectura Técnica

### Stack
- HTML/CSS/JS puro (sin framework)
- Tailwind CSS (CDN)
- Three.js r128 (`three.min.js` local)
- Web Audio API (DSP nativo del navegador)
- Google Gemini API (`gemini-2.5-flash`)

### Módulos Principales
1. **Matriz de Ingesta Master & Patchbay (Hardware Rack):**
   - 3 Pistas Master de Referencia (`CH-01 // MORDAZA`, `CH-02 // TONTOS ÚTILES`, `CH-03 // SECTION 63 - YouTube Direct`) con micro-LEDs de estado `[ON AIR]` / `[STANDBY]`.
   - Patchbay de 6 fuentes: Micrófono analógico, YouTube Direct Stream, Pestaña Loopback (`suppressLocalAudioPlayback`), Carga Local WAV/FLAC, Sintetizador DSP Procedural y Corte Mute de emergencia.
2. **DSP — Banco de 8 Stems Biquad:**
   - Sub-Graves (<60Hz), Graves (60-250Hz), Medios-Bajos (250-500Hz), Medios (500-2kHz), Medios-Altos (2k-4kHz), Presencia (4k-6kHz), Agudos (6k-10kHz), Aire (>10kHz)
   - Variables: `stemsData[id].value` (0.0 a 1.0)
3. **Telemetría en tiempo real:** RMS, Centroide Espectral, Flujo Espectral, ZCR, Rolloff, Beat/Onset, Vúmetro Mid/Side y Goniómetro Lissajous PiP
4. **Motor 3D (Three.js WebGL):** 10 escenas intercambiables
   - Nebulosa 30.000 partículas (reactiva a sub+bass y treble+air)
   - Túnel infinito (reactivo a treble y bass)
   - Monolito (reactivo a bass y mids)
   - ⚡ Shader GLSL en Vivo (Custom ShaderMaterial con 22 presets, incluyendo Cristal de Bismuto Fractal y Medusa Bioluminiscente Abisal)
   - ⚛️ GPU Compute Engine (GPGPU Shaders FBO): 65.536 partículas, Gray-Scott y Ondas de Superficie
   - 🔮 Génesis Autónoma (Arte & Mundos IA): 6 arquetipos procedurales con deformación en GPU
   - 🔮 Cimática Cuántica 3D: Isosuperficie nodal armónica de Chladni renderizada por raymarching
   - 🌀 Espacio No Euclidiano (Bola de Poincaré $\mathbb{H}^3$): Geometría hiperbólica fractal
   - 🧲 Ferrofluido Magnético & Óptica Thin-Film (FHD Lab): Inestabilidad de Rosensweig y Newton
   - 🌌 Cámara FHD: Levitación Magnética Cuadrupolar 360° (Masa suspendida en gravedad cero)
5. **Laboratorio de Física FHD & Magnetostática:**
   - 4 condiciones magnéticas: 0: Sin campo, 1: Diamagnético repulsivo, 2: Paramagnético lineal, 3: Superparamagnético no lineal (Langevin)
   - Polaridad $\beta \in \{-1, +1\}$ (Tirar constructivo vs Empujar destructivo) y sliders de $H_0$, $\alpha$, $H_c$, $\eta$ y Thin-Film
6. **Suite de Post-Procesado WebGL (9 Passes) & Director IA FX Autónomo:**
   - Passes: Bloom Glow, Aberración RGB, Audio Glitch, Shockwave Radial, CRT/VHS Scanlines, Caleidoscopio N-caras, Film Grain 35mm, Inversor Negativo Solar y Pixelación Retro 8-bit.
   - Director IA FX (`aiFxDirector`): Orquestación autónoma coordinada con 6 arquetipos (*Cine 35mm*, *Cyberpunk Glitch*, *Psicodelia Astral*, *Arcade VHS*, *Negativo Solar*, *Minimal Zen*), LERP a 60 FPS y micro-spikes transitorios.
7. **Estudio de Cómputo Dual (WebGPU WGSL + Three.js GLSL FBO):**
   - Motor WebGPU WGSL interactivo con 4 kernels (Reacción-Difusión Laplaciana, Guía de Onda Plasma RF, Interferencia Cuántica, Morfogénesis de Turing).
   - Inyector de shaders GLSL en caliente en el pipeline FBO de Three.js (`velMat`, `posMat`, `morphMat`) gobernando 65.536 partículas y relieve 3D.
   - Orquestador Creativo Autónomo sincronizado con transitorios de audio $dE/dt$, coordenadas MER y arquetipos de IA.
8. **Agente IA "Director de Arte" & Modelo Afectivo MER:** Russell Circumplex (Valencia x Arousal), auto-tracking basado en RMS + Centroide.
9. **Grabador de Video & Exportadores:** MediaRecorder WebM 60FPS, WebP Animado cuantizado al tempo y capturas Ultra-HD 4K/8K con SSAA.
10. **Estudio de Creación Narrativa & Clips IA Multicapa (`AiClipStudioEngine` / D-040):** 6 arquetipos procedurales a 60 FPS (Anime Sakuga, Cómic Noir & Halftone, Cine 35mm, Aventura/Fantasía, Cyberpunk 2099, Acuarela Onírica), storyboards musicales autónomos con Gemini 2.5 Flash, transmutación GLSL y proyección universal en Three.js (`uVideoTexture`).

11. **Hub Comunitario de Presets Cloud & ADN Visual (Despliegue Hetzner / D-042):**
   - Serialización de estado visual determinista (Visual DNA): Escena 3D (1-14), 9 passes WebGL FX analógicos, modo de cámara, paleta de color y shaders GLSL.
   - Modal con 3 pestañas: Explorar Comunidad (feed con carga en directo a 1-clic y votaciones), Publicar mi Visual (con captura instantánea del canvas WebGL) y Mis Presets Locales (exportador .mvp).
   - Backend propio en server-hetzner/ (Node.js Express + SQLite WAL, <40MB RAM) empaquetado con Docker Compose para Hetzner.

### Nodo de Audio (grafo)
```
Source → masterGainNode → mainAnalyser → DataTexture (uAudioTexture 512x2)
                        → audioDestNode (MediaRecorder)
                        → filterStem[0..7] → gainStem → analyserStem
```

### Variables Globales Clave
- `stemsData` — Objeto con los 8 stems (filter, gain, analyser, dataArray, value, muted)
- `stemConfigs` — Array de configuración de los 8 stems
- `liveAudioMetrics` — {rms, spectralCentroid, spectralFlux, zcr, rolloff, isOnset, valence, arousal}
- `particlesMesh`, `tunnelMesh`, `monolithMesh`, `customShaderMesh` — Objetos Three.js
- `gpuComputeManager` — Gestor de simulación GPGPU FBO (partículas y morphogénesis)
- `autonomousGenesisManager` — Gestor de síntesis autónoma de arte editorial/procedural
- `audioDataTexture`, `audioTextureBytes` — Textura de datos FFT y PCM para shaders
- `threeScene`, `threeCamera`, `threeRenderer`, `threeComposer`
- `merX`, `merY` — Coordenadas del pad emocional (0..1)

## Bugs Conocidos / Resueltos
- ✅ Zoom en canvas sin scroll de página (`passive: false` + `e.preventDefault()`)
- ✅ Materiales visibles desde dentro (`THREE.DoubleSide`)
- ✅ Sensibilidad afecta a los stems (masterGainNode conectado antes del banco de filtros)
- ✅ Tab Capture sin echo (no conectar a `audioCtx.destination`)
- ✅ API Key Gemini persistida en `localStorage` (key: `motor_gemini_key`)
- ✅ Errores 429/API visibles en pantalla en lugar de fallback silencioso
- ✅ Intervalo del ciclo IA configurable (15s/30s/60s/120s, default 60s) para mitigar 429
- ✅ Mapeo individual y granular de los 8 stems a variables y transformaciones 3D
- ✅ Shaders GLSL en la Nebulosa (Vertex/Fragment shaders con partículas circulares, halo glow y uniforms reactivos)
- ✅ Modo pantalla completa (Fullscreen) para el canvas 3D con auto-ajuste de aspect ratio y resolución
- ✅ Soporte para shaders de post-procesado: Suite Completa de 9 FX reactivos al audio (Unreal Bloom, Aberración Cromática, Audio Glitch & Block Displacement, Radial Zoom Shockwave, Monitor CRT/VHS con scanlines, Caleidoscopio Master N-caras, Film Grain 35mm con viñeta, Inversor Negativo/Solarización y Pixelación Retro 8-Bit) modulados individualmente a 60 FPS por los 8 stems DSP y onsets.
- ✅ Presets de mapeo acústico (Importación/Exportación JSON v1.1 con perfiles de fábrica, estado de los 9 FX y descarga/carga de presets personalizados)
- ✅ Cámara orbital cinemática multieje reactiva al audio (modos Círculo, Espiral, Lemniscata ∞ y Fly-by dramático con retroalimentación en HUD y controles interactivos)
- ✅ Editor de shaders GLSL en vivo con Hot-Reload WebGL, consola de errores en pantalla, 18 presets de alta fidelidad (Plasma, Raymarching SDF, Espectro, Voronoi, Synthwave 80s, Agujero Negro, Caleidoscopio, Esfera Tesla, Topografía Cuántica, Túnel Hexagonal Sci-Fi, Sinapsis Neural Cuántica, Aurora Boreal Fluida Volumétrica, Mandelbulb 3D Hipercomplejo, Lluvia Matrix Cybercore, Supernova Estelar Relativista, Cimática Cuántica 3D de Chladni, Geometría Hiperbólica no Euclidiana en Poincaré H³ y Ferrofluido Magnético con Óptica Thin-Film).
- ✅ Bucle maestro de renderizado (`masterRenderLoop`) unificado a 60 FPS vinculando en tiempo real el análisis DSP (`runAudioDSP`), espectrograma y renderizado Three.js
- ✅ Enrutamiento persistente de Web Audio API con elemento `<audio id="html5-audio-player">` en el DOM estático, eliminando desconexiones y resolviendo la reactividad de `tema.mp3` y archivos de usuario
- ✅ Transmisión de Audio-Reactividad a Texturas WebGL (`uAudioTexture` 512x2 DataTexture muestreable por GLSL: fila 0 = espectro FFT, fila 1 = oscilograma PCM)
- ✅ Motor GPU Compute Shader (GPGPU Shaders FBO) con simulación física continua a 60 FPS: Enjambre de 65.536 partículas con Curl Noise 3D y atractor gravitatorio, Morfogénesis de Turing (Reacción-Difusión Gray-Scott) y Ecuación de Ondas 2D sobre malla tridimensional de relieve.
- ✅ Exportación de animaciones WebM sincronizada a 60 FPS compatible con shaders personalizados y escenas de cómputo GPU.
- ✅ Modo Studio Cinema / Zen Focus con docking colapsable de racks y pill dock flotante interactivo para visualización inmersiva.
- ✅ Selector dinámico de calidad de renderizado GPU (Ultra 1.0x / Balanceado 0.85x / Eco 0.65x DPR) con re-escalado dinámico de Three.js y shaders en caliente.
- ✅ 7 Presets instantáneos para el motor GPGPU Compute (Galaxia Kepleriana, Tormenta Vórtices, Nebulosa Bio, Turing Leopardo, Laberinto Turing, Ondas Líquidas y Resonancia Marina).
- ✅ Renderizado volumétrico por Raymarching de niebla cuántica basada en densidad de partículas GPGPU (integración física de absorción Beer-Lambert, dispersión lumínica Henyey-Greenstein, singularidad lumínica central atenuada, 48 pasos de raymarching con dither jittering y acoplamiento directo a las 65.536 partículas y velocidades del FBO a 60 FPS con presets "Niebla Cuántica Volumétrica" y "Plasma Gravitatorio & Raymarching").
- ✅ Exportador de presets de shaders en formato de paquete web independiente (HTML auto-contenido): empaqueta en un único archivo HTML (~15KB) ejecutable 100% offline sin servidor ni dependencias externas, con motor WebGL puro, sintetizador procedural integrado a 124 BPM, micrófono en vivo, carga/drag-and-drop de archivos de audio locales, banco DSP de 8 stems Biquad, textura de datos FFT/PCM (`uAudioTexture`), controles de sensibilidad y paleta de color interactiva.
- ✅ Skills de diseño instaladas en `.agents/skills/`: `antigravity-design-expert` (interfaces espaciales, ingravidez, 3D CSS y glassmorphism), `ui-ux-pro-max` (ergonomía de consolas de producción, grid 8pt/4pt, jerarquías cromáticas) y `frontend-design` (dirección de arte anti-AI-slop, intencionalidad estética y atmósfera cinemática).
- ✅ Sistema de Tooltips interactivos y barra descriptiva dinámica en vivo para la suite de 9 efectos de post-procesado (categoría óptica, comportamiento visual y reactividad DSP detallada).
- ✅ Configuración de claves API local desacoplada vía `config.js` (con soporte prioritario en `index.html`, feedback visual en panel, fallback a `localStorage` e ignorado por Git vía `.gitignore`).
- ✅ Exportación de capturas fijas de ultra-alta resolución (4K UHD / 8K Cinema Master / 2K QHD / 1080p FHD) con súper-muestreo SSAA (Super-Sampling Anti-Aliasing), renderizado offscreen sin alteración de layout (`updateStyle: false`), feedback táctil con flash de obturador y sintetizador acústico de clic mecánico dual con Web Audio API, atajo de teclado `P` para captura rápida y modal dedicado de configuración.
- ✅ Exportador de Audio Stems Multitrack (banco de 8 bandas Biquad DSP) en formato WAV broadcast (PCM 16-bit) y estudio (32-bit Float IEEE) mediante `OfflineAudioContext` (procesamiento ultrarrápido a 64-bit en CPU para archivos locales y `tema.mp3`), descarga por lote (Batch) con barra de progreso en tiempo real y botones individuales `⬇ WAV` en cada tarjeta de canal de stem.
- ✅ Sistema de notificaciones toast flotantes glassmorphic (`showToast`) y atajos de teclado de producción (`P` para 4K, `Shift+S` para modal de captura, `Shift+W` para modal de stems, `Escape` para cerrar modales).
- ✅ Sincronización cromática integral del Director de Arte IA y suavizado cinemático continuo (Color Lerp a 60 FPS) entre todas las escenas 3D (Nebulosa, Túnel, Monolito, Raymarching Procedural y FBO GPGPU 65k), niebla atmosférica y `pointLight` dinámico reactivo a transitorios (D-017 / L-013).
- ✅ Motor de Génesis Autónoma de Arte & Síntesis de Universos Visuales: La IA concibe y programa autónomamente mundos visuales únicos para cada track a través de 6 arquetipos procedimentales (Prensa Escrita / Rotativa con fotograma de espectrograma FFT en trama de semitonos Halftone, Cyberdeck CRT con osciloscopio analógico, Planos aeroespaciales Blueprint CAD, Microscopía biológica confocal, Estelas rúnicas de basalto y Constructivismo Bauhaus), con física 3D de viento/ondas en GPU, deformación reactiva a los 8 stems DSP, cámara coreografiada y HUD card técnico interactivo (D-018 / L-014).
- ✅ Suite de 3 Visuales de Vanguardia Matemática & Física Cuántica: Cimática Cuántica 3D de Chladni volumétrico analítico, Geometría Hiperbólica No Euclidiana en Bola de Poincaré $\mathbb{H}^3$ con teselación fractal de Coxeter, y Ferrofluido Magnético con Inestabilidad de Rosensweig e Interferencia Óptica física multiespectral Thin-Film (D-019 / L-015).
- ✅ **MotorVisuales v4.2-PRO — Estación Audiovisual y Electromagnética Ciberfísica (D-020):**
  - **Conexión Google Stitch MCP:** Integración nativa del Model Context Protocol sobre HTTP (`stitch.googleapis.com/mcp`) con el proyecto Stitch `4507385985753386393` y descarga de pantallas de diseño de ultra-alta fidelidad en `diseños/`.
  - **Bus Unificado de Registros ($Q_1 \dots Q_{64}$):** Vector de 64 floats instanciado en `window.qVars` mapeando transitorios $dE/dt$, densidad RMS, rotor de fase, SNR dB, coordenadas Vector XY, flujo espectral, exponente de Lyapunov y los 8 stems DSP, inyectado como uniforms en tiempo real a shaders GLSL y pases FBO GPGPU.
  - **Lookahead Ring Buffer (+30 fotogramas):** Buffer circular de 1024 muestras calculando la derivada anticipatoria $\frac{dE}{dt}$ para shockwaves y disparos de transitorios sin latencia perceptible.
  - **Suite de Atractores Caóticos y Modulador Vector XY:** Integración numérica RK4/Euler a 60 FPS para Lorenz 3D (mariposa), Rössler (pliegue sinusoidal), Chen (doble vórtice) y Clifford (toroide 2D). Pad Vector XY con físicas de arrastre, retorno por resorte elástico (Spring), inercia suave y modo Sample & Hold caótico.
  - **Matriz de Ingesta RF / SDR:** Soporte de hardware para HackRF One (20 MSPS), RTL-SDR v4, ADALM-Pluto y archivos sintéticos IQ .WAV; sintonizador de portadoras (104.700 MHz, 2.412 GHz, 1.090 GHz, 433.92 MHz); canvases a 60 FPS de constelación IQ en plano complejo, espectrograma Waterfall térmico continuo y relieve 3D WebGPU de Reacción-Difusión con operador laplaciano.
  - **Consola DSP de 64 Bandas:** FFT logarítmica con gradiente cian-fucsia y 4 perfiles acústicos de género (*Stage Rave*, *Ambient Sphere*, *Drum & Bass*, *Peak Techno*).
  - **Preset 19 GLSL & Proyección 3D Directa:** Shader procedimental `attractor_quantum_rf` acoplado al bus $Q_1..Q_{64}$ y al atractor caótico activo, con botón instantáneo `👁️ Proyectar en Viewport 3D` desde Chaos Lab y RF/SDR Matrix.
  - **Cockpit Multivista Modular:** Barra de sub-navegación con 5 vistas (`LIVE RUNNER`, `AUDIO DSP`, `RF / SDR MATRIX`, `CHAOS LAB`, `SYSTEM CONFIG`) y chips de telemetría viva en la cabecera.
- ✅ **Enrutamiento Estéreo Universal, HUD Live Dinámico y Reactividad YouTube (D-017 / L-018):**
  - Conexión del grafo estéreo `stereoSplitterNode -> gainLeftNode / gainRightNode -> stereoMergerNode -> outputMasterGain` a todas las entradas en vivo (YouTube Móvil, Micrófono y Audio de Pestaña/Sistema), permitiendo que los faders L y R y el volumen general regulen directamente la escucha en auriculares.
  - Botón de monitoreo `[🎧 Monitoreo: ACTIVO / MUTE]` para alternar la salida de audio sin desconectar el análisis DSP.
  - Actualización inmediata de la barra de reproducción (`updatePlaybackBar`): al activar YouTube, se muestra el título dinámico `🔴 YouTube Móvil (Audio en Vivo)`, el scrubber de archivo se transmuta en un vúmetro en vivo con indicador de nivel dB y botones de preamplificación rápida (`[1x] [2.5x] [4.5x] [8x]`).
  - Control Automático de Ganancia (AGC) adaptativo y detector de onsets por pico relativo de flujo espectral (`flux > avgSpectralFlux * 1.35`), logrando que las visuales 3D y los 8 stems Biquad reaccionen con máxima contundencia ante cualquier nivel de audio de YouTube.
- ✅ **Ingesta Directa YouTube HQ, 3 Tracks HQ y Balance Estéreo L/R en Auriculares (D-018 / L-019):**
  - Incorporación permanente de `section-63.mp3` ("Section 63 - Manipulation EP") descargado en alta calidad.
  - Ampliación del rack de temas disponibles a `3 TRACKS HQ` ("Mordaza", "Tontos Útiles", "Section 63 (YouTube)").
  - Botón de acción instantánea en `▶ YouTube Móvil`: reproduce de inmediato el tema de YouTube a través de Web Audio API, alimentando el analizador DSP de 8 stems a 60 FPS y enviando audio estéreo a `stereoSplitterNode -> gainLeftNode / gainRightNode -> stereoMergerNode -> outputMasterGain -> destination`.
  - Los faders Master, L (izquierdo) y R (derecho) modulan con precisión el volumen de cada auricular, resolviendo el problema de aislamiento de Android.
  - Botón de configuración (`⚙️`) con modal asistente de 4 métodos e información clara sobre el sandboxing del sistema operativo móvil.
- ✅ **Progressive Web App (PWA) de Alto Rendimiento para Android (D-021):**
  - **Web App Manifest (`manifest.json`):** Configurado con `display: standalone`, `display_override: ["window-controls-overlay", "standalone", "minimal-ui"]`, `theme_color: #0a0a0f`, `background_color: #050508`, accesos directos (*shortcuts*) a YouTube Móvil, Shaders 3D y Chaos Lab.
  - **Iconografía Cyberpunk Multiresolución (`icons/`):** Generados iconos PNG estándar y *maskable* (con padding de zona segura para Android 8+) a 192x192 y 512x512 px, además de `favicon.ico` y vector `icon.svg`.
  - **Service Worker (`sw.js`):** Precaché del App Shell (`index.html`, `three.min.js`, iconos, manifiesto) con estrategia *Stale-While-Revalidate* y bypass absoluto de red para peticiones de streaming (`/api/yt-stream`, `Range: bytes=...`, archivos `.mp3`/`.wav`) garantizando que Web Audio API y el reproductor multimedia operen sin cortes ni corrupción de búfer.
  - **Prompt de Instalación Nativo:** Captura del evento `beforeinstallprompt` con botón táctico `[📲 Instalar App]` visible en la cabecera cuando el navegador móvil lo permite.
  - **Screen Wake Lock API:** Mantiene la pantalla del teléfono Android encendida automáticamente mientras suena la música o se proyectan los visuales 3D, liberando el bloqueo al pausar.
  - **Despliegue Sincronizado en Hetzner (`motorvisuales.site`):** Servido bajo Traefik con SSL Let's Encrypt y volumen montado en el contenedor para actualizaciones en caliente sin rebuild.

- ✅ **Goniómetro de Fase Lissajous, Matriz MIDI USB y Exportador de Loop WebP Cuantizado (D-022):**
  - **Visualizador de Fase Goniométrica & Lissajous (X/Y Phase Scope):** Analizadores estéreo dedicados `phaseAnalyserL / phaseAnalyserR` sobre `stereoSplitterNode` evaluando coeficiente de Pearson $r \in [-1, +1]$, osciloscopio Lissajous con modos Mid/Side 45° (Broadcast) y X/Y Directo, retícula polar con persistencia analógica de fósforo CRT, aguja y vúmetro de compatibilidad mono (`MONO SAFE` / `WIDE` / `OUT OF PHASE`), balance L/R, energía Mid/Side en dB, inyección en bus de variables $Q_{17} \dots Q_{19}$, y mini overlay PiP flotante proyectable sobre el Viewport 3D.
  - **Soporte Web MIDI USB Físico (`navigator.requestMIDIAccess`):** Mapeo plug-and-play de controladores DJ/VJ con detección de puertos USB en caliente, monitor de tráfico con LED interactivo, modo interactivo MIDI Learn (asigna cualquier control físico con un toque), compatibilidad con faders de los 8 stems DSP, sensibilidad, volumen master, modulador Vector XY y efectos GLSL, con presets de fábrica para Korg nanoKONTROL2, Akai APC Mini / MIDIMIX y controladores genéricos, más exportación/importación JSON.
  - **Exportador a WebP Animado en Bucle Cuantizado Acústico:** Sincronización temporal exacta de 2, 4 u 8 compases según BPM (con Tap Tempo y detección automática), Downbeat Snap para iniciar la captura en el compás 1.1, y codificador nativo estándar RIFF WEBP de 24 bits ensamblado 100% en JavaScript sin dependencias externas, con previsualización en bucle y descarga inmediata.

- ✅ **Adaptación Ergonómica para Smartphones & Mobile Workstation Zero-Scroll (D-023 / L-021):**
  - **Viewport 3D Superior Dinámico (`order-1 lg:order-2`):** En smartphones (< 1024px), el canvas 3D WebGL se ancla inmediatamente en la parte superior con altura fluida adaptada (`h-[32dvh] min-h-[210px] max-h-[290px] sm:h-[440px] lg:h-[580px]`), manteniendo la visualización reactiva siempre visible sin necesidad de scroll.
  - **Mobile Deck Switcher (5 Pestañas Tácticas):** Selector ergonómico de cubierta (`lg:hidden`) para control directo con el pulgar:
    - `[🎵 Audio]`: 3 Tracks HQ, micrófono, YouTube Móvil, fader master, balance L/R, osciloscopio PCM y 6 métricas de telemetría acústica.
    - `[🎚️ Stems]`: Banco de 8 filtros Biquad con vúmetros independientes, mutes y descarga WAV.
    - `[✨ PostFX]`: Suite completa de 9 efectos reactivos (Bloom, Aberración RGB, Glitch, etc.).
    - `[⚡ GLSL]`: Editor de shaders hot-reload con los 19 presets y compilación instantánea.
    - `[🧠 IA / MER]`: Agente Director de Arte IA, paleta cromática, radar Russell MER Circumplex y espectrograma FFT.
  - **Zero Window Scrolling (`mobile-deck-scrollable`):** Contenedor interno auto-contenido con `max-h-[calc(100dvh-420px)] overflow-y-auto overscroll-behavior: contain; -webkit-overflow-scrolling: touch;`, permitiendo operar cualquier slider o parámetro sin arrastrar la página global.
  - **Integridad Absoluta de Escritorio:** En pantallas >= 1024px, todos los racks permanecen simultáneamente visibles en sus respectivas columnas y cuadrículas sin alteración visual ni de rendimiento.
  - **Service Worker v3:** Precaché actualizado a `motorvisuales-v3` garantizando entrega inmediata del nuevo diseño PWA móvil.

- ✅ **Visualizador de Espectrograma 3D Waterfall en Cascada Tridimensional Navegable (D-025):**
  - **Malla Dinámica en GPU (128x128 = 16.384 Vértices):** Desplazamiento topográfico de elevación ejecutado directamente en vertex shader mediante `DataTexture` RGBA dinámico, actualizando el búfer de historial en memoria con `Uint8Array.copyWithin()` en $<0.3\text{ms}$ por frame a 60 FPS sin sobrecarga de CPU.
  - **Cálculo Numérico de Normales en GPU:** Sombreado dinámico con derivadas espaciales finitas por textura de gradiente en el shader, soportando iluminación difusa y reflejos especulares sobre la superficie de relieve.
  - **5 Mapas de Color Topográficos:** Turbo/Térmico, Cyberpunk Neón (Cian a Fucsia), Synthwave 80s (Atardecer Púrpura/Ámbar), Matrix Bio-Digital (Verdes fósforo) y Sincronización Dinámica con la Paleta del Director de Arte IA.
  - **3 Modos de Relieve & Isolíneas:** Superficie sólida con curvas de nivel cartográficas antialiased (`smoothstep`), Wireframe geométrico con atenuación en horizonte y Nube de Puntos (Point Cloud) estelar.
  - **Rack de Controles Interactivo:** Panel dedicado acoplado al Viewport 3D con factor de relieve dinámico ($0.2\times \dots 3.5\times$), velocidad temporal y atajo en el selector de escenas Three.js (`11. 🌊 Espectrograma 3D Waterfall`).

- ✅ **Pasarela Open Sound Control (OSC) Bidireccional por WebSockets (D-026):**
  - **Servidor Gateway Python (`osc_bridge.py`):** Bridge asíncrono ultra-liviano (`asyncio` + `websockets` + `socket` UDP nativo) escuchando en `ws://127.0.0.1:8089`, reenviando y recibiendo datagramas UDP OSC estándar hacia TouchDesigner, Resolume Arena, Max/MSP y sintetizadores externos (puerto 9000 salida, 9001 entrada).
  - **Codec Binario Nativo OSC 1.0 en JavaScript:** Empaquetador y desempaquetador atómico implementado en Vanilla JS con `ArrayBuffer` y `DataView` sin dependencias externas, con alineación a 4 bytes, cadenas terminadas en null y decodificación de tipos `f` (float32), `i` (int32) y `s` (string).
  - **Telemetría Outbound a 30 FPS:** Transmisión estructurada de métricas acústicas (`/motor/audio/rms`, `/motor/audio/flux`), stems DSP (`/motor/stem/{sub,bass,...}`), registros de bus (`/motor/q/1..24`), cursor Vector XY (`/motor/xy`) y correlación de fase stereo (`/motor/phase/corr`).
  - **Consola de Control en UI:** Monitor en tiempo real de paquetes y bytes TX/RX en vista `SYSTEM CONFIG`, filtros configurables de telemetría saliente, control de reconexión y despacho de comandos entrantes hacia escenas, stems, volumen y pads.

- ✅ **Audio Multicanal Surround 5.1 / 7.1 Espacializado 3D (D-027):**
  - **Motor Binaural HRTF 3D:** Integración con `AudioListener` acoplado en tiempo real (60 FPS) a la posición `threeCamera.position` y vectores directores `forward` y `up` de Three.js.
  - **Matriz de Salida Discreta 5.1:** Conmutación de hardware multicanal (`channelCount: 6`, `channelInterpretation: 'discrete'`) con crossover subgraves dedicado a 80 Hz (`BiquadFilter lowpass`) alimentando el canal 3 (LFE) con la energía acústica de los stems `sub` y `bass`.
  - **Radar Polar Interactivo 2D/3D (`#spatialRadarCanvas`):** Control gestual con arrastre táctil y de ratón de azimut y distancia, órbitas automáticas 3D y modo anclado a la geometría de la escena Three.js activa (Túnel, Monolito, Waterfall).
  - **Vúmetro de 6 Canales en Tiempo Real:** Monitorización de niveles L, R, C, LFE, SL y SR con retroalimentación instantánea en la sub-vista `[🎧 SPATIAL 3D & 5.1]` del Cockpit Bar.

- ✅ **Ajustes Específicos & Refinamientos de MotorVisuales (Cockpit, Bus Q, Telemetría Viva):**
  - **Botón y Sub-Vista Cockpit `[🎧 SPATIAL 3D & 5.1]`:** Conmutación fluida en la barra modular de navegación sin recarga de página.
  - **Chips de Telemetría en Cabecera:** Indicadores en vivo en desktop y móvil para estado 3D (`3D: STEREO / BINAURAL / 5.1`) y conexión OSC (`OSC: ONLINE / OFF`).
  - **Ampliación del Bus de Registros $Q_1 \dots Q_{64}$:** Asignados $Q_{20}$ (Azimuth polar), $Q_{21}$ (Elevación), $Q_{22}$ (Distancia normalizada), $Q_{23}$ (Factor de relieve Waterfall) y $Q_{24}$ (Estado del enlace OSC), propagados como uniforms en shaders GLSL.

- ✅ **Motor de Interpretación Acústica Narrativa, Reloj Fluido, Morfogénesis en GPU & Auto-VJ (V5 / D-030):**
  - **Reloj Perceptual Fluido (`flowTime`):** Desacopla la evolución de shaders del tiempo plano de CPU, acelerando o frenando el tiempo visual de forma elástica según la energía RMS, subgraves y onsets.
  - **Detector de Fases Musicales en Tiempo Real:** Detección automática de *Intro Etérea*, *Build-up de Tensión*, *Drop Explosivo*, *Groove Rítmico* y *Breakdown*.
  - **Shockwaves & Destellos de Impacto en Drops:** Disparo de flash fotográfico analógico (`#hud-drop-flash`), saltos cinemáticos de cámara (Jump Cuts), mutación de paleta y dispersión física de partículas por onda expansiva.
  - **Morfogénesis Analítica de la Nebulosa (5 Arquetipos Cuánticos):** Evaluación en GPU sin sobrecarga de CPU entre *Esfera Cuántica*, *Galaxia Espiral*, *Toroide Vórtice*, *Cimática 3D* y *Hélice ADN*.
  - **Túnel Serpentino & Monolito Giroscópico:** Ondulación 3D en serpentina con velocidad warp en drops para el Túnel, y doble anillo giroscópico ortogonal reactivo para el Monolito.
  - **Modo Auto-VJ Autónomo:** Transiciones inteligentes de escena y preset cada 16-28 segundos o en picos/drops con botón `[⚡ AUTO-VJ: ON / OFF]` en Viewport y chip `FLOW:` en el Cockpit Bar.

- ✅ **Sincronización Hetzner / Claude (`server-real-implementations-2026-09-27`):**
  - **Prevención de Eco/Duplicación en Captura de Pestaña:** `connectSpeakers = false` en `startTabCapture()` para evitar que el audio del sistema se reproduzca dos veces (salida nativa + audioCtx).
  - **Navegación al Hub:** Botón `‹` integrado en cabecera hacia `milkdropagent.motorvisuales.site`.
  - **Funciones Reales de RF y WebGPU:** `resetRfComputeBuffer()`, `stepRfDiffusionCPU()`, mapas de normales analíticos, modo Magic Eye 3D anáglifo, `snapshotIqConstellation()`, comprobador de latencia de red `checkMcpBridgeStatus()`.
  - **Docker Compose Unificado:** Red externa `traefik_traefik` y montura de volúmenes persistentes.

- ✅ **Motor de Universos Escénicos Vivos `ScenicWorldEngine` (Anti-MilkDrop V6 / D-031):**
  - **Salto Paradigmático Radical:** Salida del concepto clásico de figuras geométricas flotando en fondo negro (MilkDrop 2001) hacia **Mundos Escénicos Completos** con geología viva, horizonte, fluidos físicos PBR y atmósfera meteorológica reactiva.
  - **Mar de Mercurio Líquido (Ondas Trocoidales de Gerstner en GPU):** Malla planar de $160\times 160$ quads deformada analíticamente en vertex shader con 4 trenes de ondas cruzadas, normales de derivadas continuas exactas, Fresnel metálico de mercurio puro ($F_0 = 0.82$), dispersión cromática especular en crestas y ondas de choque hiperbólicas concéntricas en los drops.
  - **26 Megalitos de Basalto Hexagonal Brutalista:** Columnas colosales dispuestas en espiral áurea con texturizado de roca volcánica, vetas verticales de cuarzo cuántico luminiscente moduladas por medios/agudos y oscilación geológica vertical en pistones titánicos sincronizados con el ritmo musical.
  - **Bóveda Celeste & Meteorología de Plasma:** Cúpula cósmica con horizonte crepuscular y relámpagos volumétricos estroboscópicos reactivos que iluminan el mar de mercurio en cada impacto percusivo (onset/drop).
  - **Cinematografía FPV Inteligente:** Dron de cine con trayectorias 3D rasantes, alabeo dinámico aerodinámico (Bank Roll), micro-vibración por sub-graves y saltos cinemáticos de cámara (Jump Cuts) ante drops acústicos.
  - **Iluminación Base Radiante & Centrado Dinámico:** Integración de luz solar direccional y ambiental base con vetas de neón activas al 85% en reposo, desacoplamiento orbital exclusivo en `renderThreeFrame` y seguimiento dinámico de la cúpula celeste en la posición de cámara (L-029).
  - **Activación:** Escena 12 en selector Three.js (`12. 🌊 Universo Escénico: Océano de Mercurio & Megalitos`) y seleccionada por defecto al iniciar el motor.

- ✅ **Laboratorio GLSL Split-View IDE (D-032):**
  - **Eliminación del Espacio Muerto:** Rediseño del bloque de shaders a doble columna responsive (`lg:grid-cols-12`). La columna izquierda (66%) alberga el editor de código con altura expandida y la columna derecha (33%) un **Inspector de Uniforms en Vivo & Inyector de Snippets**.
  - **Telemetría en Vivo de Uniforms:** Medidores gráficos en tiempo real (60 FPS) de `uSub`, `uBass`, `uMid`, `uTreble` con barras de nivel reactivas, monitor de `uTime`, RMS y LED estroboscópico de `uIsOnset`.
  - **Botonera de Snippets Matemáticos (1 Clic):** Inserción instantánea de funciones complejas al cursor (`rot2D`, `snoise(vec3)`, `fresnel(N,V)` y `cosPalette(t)`).

- ✅ **Segundo Universo Escénico: Valle de Cristales & Nebulosa H-Alfa (D-033):**
  - **36 Cristales Polimórficos Flotantes:** Icosaedros, octaedros y dodecaedros dispersos a diferentes altitudes ($Y = 40\dots 240$), dotados de shader custom con dispersión cromática angular Fresnel en RGB ($\eta_R, \eta_G, \eta_B$), aristas reflectantes y pulso interior audio-reactivo sintonizado a frecuencias medias y agudas (`uMid`, `uTreble`).
  - **Vórtice Espiral de 12.000 Partículas H-Alfa:** Nebulosa turbulenta con filamentos de Hidrógeno H-Alfa ($656.3\text{ nm}$) y Oxígeno III ($500.7\text{ nm}$), con rotación espiral y turbulencia vertical acelerada por sub-graves y bombo (`uSub`, `uBass`).
  - **Cinemática FPV Crystal Drone:** Vuelo acrobático entre las formaciones de cristal con slalom envolvente, ascenso vertiginoso por el vórtice, alabeo dinámico y saltos cinemáticos ante drops.
  - **Bóveda Celeste Multiespectral:** Transición de cielo en GPU gobernada por `uWorldMode` entre el crepúsculo de Mercurio y el espacio profundo interestelar.
  - **Selección:** Accesible en `#three-scene-mode` como opción `13. 💎 Universo Escénico: Valle de Cristales & Nebulosa H-Alfa`.

- ✅ **Audio Multicanal Surround 7.1 y Dolby Atmos 7.1.4 (D-034):**
  - **Expansión a 12 Canales Discretos:** Matriz ampliada que soporta Estéreo, Binaural HRTF 360°, Surround 5.1 (6 canales), Surround 7.1 (8 canales con Back Surrounds dedicados BL y BR) y Dolby Atmos 7.1.4 (12 canales con 4 altavoces cenitales de techo: TFL, TFR, TRL, TRR).
  - **Gestión Inteligente de Hardware:** Consulta `AudioDestinationNode.maxChannelCount` y conmuta limpiamente a canales discretos si el hardware lo soporta, manteniendo simulación continua en los vúmetros visuales con render Binaural HRTF si se detectan limitaciones de salida.
  - **Registros Cuánticos $Q_{25} \dots Q_{28}$:** Asignados $Q_{25}$ (Surround BL), $Q_{26}$ (Surround BR), $Q_{27}$ (Promedio de Altura Frontal TFL + TFR) y $Q_{28}$ (Promedio de Altura Trasera TRL + TRR).
  - **Radar Polar 2D/3D Actualizado:** Visualización de altavoces físicos 7.1 perimetrales y los 4 altavoces de techo Atmos en el anillo medio, con brillo y halos lumínicos modulados dinámicamente por la energía de cada canal.

- ✅ **Exportador VFX OpenEXR / TIFF 32-Bit Float para Pipelines de Render (D-035):**
  - **Generadores Binarios Nativos sin Dependencias:** Codificación en `ArrayBuffer` y `DataView` de especificación OpenEXR 2.0 scanline uncompressed e imagen TIFF con `SampleFormat = 3` (IEEE 754 Float32).
  - **Empaquetado de Datos para VFX:** Canal R = Densidad espectral FFT; Canal G = Derivada temporal de frecuencia $dF/dt$; Canal B = Detección de transitorios y onsets; Canal A/Z = Mapa de desplazamiento / relieve para Houdini, Blender, Unreal Engine, Maya y Nuke.
  - **Integración en UI:** Botones dedicados `[🏔️ Exportar EXR (.exr)]` y `[🖼️ Exportar TIFF (.tiff)]` en el rack de Waterfall.

- ✅ **Enlace WebRTC P2P & Consola VJ Remota Serverless (D-036):**
  - **DataChannel Peer-to-Peer:** Canal de datos UDP-like (`ordered: false, maxRetransmits: 0`) para transmisión de telemetría audio-reactiva a 60 FPS y control remoto inter-dispositivo con latencia inferior a 15ms en red local.
  - **Señalización Serverless / Air-Gapped:** Intercambio de ofertas y respuestas mediante tokens base64 autocontenidos sin requerir servidores de señalización en internet.
  - **Emparejamiento Rápido LAN (`Auto-Pair LAN`):** Auto-descubrimiento en red local a través del puerto WebSocket local (8089).
  - **Control Remoto VJ:** Roles conmutables (Host / Emisor vs Consola VJ Remota / Controlador), gatillos remotos para forzar drops, alternar mundos escénicos y cambiar presets aleatorios, con monitorización de paquetes TX/RX y latencia RTT.

- ✅ **Timeline de Automatización VJ y Grabador de Sesión Q-Bus (.mvj) (D-037):**
  - **Motor `VjSessionTimelineEngine`:** Muestreador continuo a 30 FPS en `masterRenderLoop` registrando fotogramas de telemetría ($Q_1 \dots Q_{24}$, RMS, Spectral Flux, 8 stems Biquad, onsets, drops y cambios de escena).
  - **Timeline Gráfico Interactivo en Canvas 2D:** Visualización multipista con curvas de área (RMS en fucsia, Q1 en cian), marcadores de drops amarillos, scrubbing con arrastre táctil / ratón e interpolación fluida de keyframes.
  - **Transporte y Exportación:** Controles `[REC]`, `[PLAY / PAUSE]`, `[STOP]`, `[LOOP]` y exportador / importador nativo de archivos `.mvj` (JSON estructurado).

- ✅ **Congelador de Topografía Acústica 3D & Exportador Estanco STL / OBJ / GLB (D-038):**
  - **Motor `MeshFreeze3DEngine`:** Congela instantáneamente la matriz de elevación ($128 \times 128$) de la cascada Waterfall o del Océano de Mercurio.
  - **Geometría Sólida Estanca (Watertight Manifold):** Genera tapa superior deformada acústicamente, base plana inferior ($Y_{\text{bottom}} = Y_{\text{min}} - \text{baseThicknessMm}$) y 4 faldones perimetrales cerrados, produciendo un sólido 100% libre de bordes abiertos ($65.532$ triángulos con normales calculadas hacia afuera).
  - **Exportadores Binarios Nativos:** Generación sin dependencias externas de archivos STL binario (para Cura, PrusaSlicer, Bambu Studio), Wavefront OBJ (para Blender, ZBrush) y glTF 2.0 binario `.glb` (con material PBR para visualización 3D y AR).

- ✅ **Ingesta de Video en Vivo & Webcam / NDI con Chroma Key en GPU (D-039):**
  - **Motor `LiveVideoIngestEngine`:** Entrada de video directo vía `getUserMedia` a 60 FPS con selector dinámico de cámaras y OBS Virtual Cam.
  - **Procesador de Chroma Key en GPU:** Eliminación de fondo por color clave (verde, azul, negro) con tolerancia y suavizado `smoothstep`.
  - **Monolito Holográfico Flotante:** Pantalla curva gigante integrada en `ScenicWorldEngine` sobre el Océano de Mercurio con scanlines CRT, halo lumínico y glitch reactivo a los transitorios de audio.
  - **Textura Universal:** Exposición de uniforms `uVideoTexture` y `uVideoActive` en todos los 22 shaders GLSL del Live Shader Studio.

- ✅ **Composición Multicapa, Síntesis de Arquetipos IA, Exportador 1080p y Universo 14 (D-041):**
  - **Composición Multicapa (Layer Blending):** Desacoplamiento de generación en 3 capas simultáneas (Fondo, Sujeto/Personaje y FX/Overlays) con opacidades y modos de fusión (`source-over`, `screen`, `lighter`, `multiply`), permitiendo combinaciones ilimitadas.
  - **Sintetizador de Arquetipos con Gemini IA:** Generador dinámico en el modal a partir de prompts de texto ("Prompt-to-Visual") integrado con la API de Gemini 2.5 Flash y fallback local heurístico.
  - **Exportador de Videoclip Completo 1080p Master:** Renderizado a 60 FPS con `MediaRecorder` mezclando video de alta resolución y audio master en un contenedor `.webm` con HUD de progreso y descarga directa.
  - **Tercer Universo Escénico: Abismo Oceánico & 4.096 Boids Bioluminiscentes (Escena 14):** Fondo marino abisal PBR, monolito sumergido para videoclips, 4.096 criaturas simuladas con boids a 60 FPS en `THREE.InstancedMesh` con dispersión reactiva a bombos y emisión bioluminiscente cian/azul modulada por frecuencias medias y agudas, con cinemática FPV submarina.

- ✅ **Rediseño Ergonómico y Arquitectura Modular de Menús Táctiles para Android PWA (D-043):**
  - **Viewport 3D Superior Dinámico:** `#three-canvas-container` adaptado a `35dvh` con HUD flotante (`#mobile-viewport-hud`) que incluye botón Play/Pause grande (48px), chip de escena 1-toque, telemetría en vivo RMS/FPS y accesos rápidos Auto-VJ y Órbita.
  - **Deck Táctico Ergonómico Móvil (`#mobile-tactical-deck`):** 6 paneles modulares con contención de scroll (`.mobile-deck-scrollable`, zero window scroll):
    - *Audio:* Fader Master táctil con dB/%, selector balance L/R con botón `CENTER`, 4 presets preamp y patchbay de 6 fuentes.
    - *Stems:* 8 stems Biquad DSP con vúmetros LED a 60 FPS, faders horizontales y botones de MUTE gigante (mínimo 48x48px).
    - *Mundos:* Cuadrícula táctil 2 columnas para los 14 mundos escénicos con micro-LEDs de estado activo.
    - *FX:* Pedalboard para los 9 Passes WebGL con switches stomp-box ON/OFF (48px) y sliders adaptados al pulgar.
    - *GLSL:* Selector de 22 presets, botón de compilación de 48px, Macro Pad de 4 snippets y monitor reactivo de uniforms.
    - *Cloud & Tools:* Macro Pad táctico de 8 botones para Presets Hetzner, Timeline VJ, Captura 4K, STL 3D, Clips IA, NDI, Spatial y PWA.
  - **Barra Táctica Fija Inferior (`#mobile-bottom-tab-bar`):** Dock fijo en la base de la pantalla con botones de 52px en la *thumb-zone* y safe areas adaptadas a la barra de gestos de Android.
  - **Bottom Sheets Táctiles:** Conversión automática de modales a hojas deslizables desde abajo (`rounded-t-2xl`, animación slideUpSheet).
  - **Telemetría a 60 FPS y Feedback Háptico:** Sincronización continua en `runAudioDSP()` y `masterRenderLoop()`, y vibración táctil suave (`triggerHaptic`).

- ✅ **Toolbar Adaptativa y Splitter Arrastrable para Viewport 3D (D-044):**
  - **Cabecera Adaptativa:** Eliminación de desbordamientos con flex-wrap, selector de mundos con ancho elástico y utilidades en formato icon-first con tooltips.
  - **Splitter Vertical (#three-viewport-resizer):** Borde inferior interactivo con agarre táctil y de ratón a 60 FPS, actualización inmediata de Three.js (triggerThreeResize), persistencia en localStorage y reset por doble clic.

- ✅ **Conectividad Remota Android PWA vía Túnel TLS Seguro (D-045):**
  - Superación del aislamiento de Policy-Based Routing en Android (USB Tethering) mediante túnel HTTPS directo con terminación TLS ([https://fd533eea1f4613.lhr.life](https://fd533eea1f4613.lhr.life)), permitiendo probar la app en vivo en Chrome móvil sin fricción.

- ✅ **Inputs de Sonido en Primer Orden Visual y Scope Extensions PWA (D-046):**
  - **Inputs Arriba del Todo en Móvil:** Reordenamiento con order-1 para left-dock-column y order-2 para el viewport 3D, situando las 3 Pistas Master y la Matriz Patchbay como primer elemento visual en pantallas móviles.
  - **PWA Multi-Subdominio Sin Barra de Navegador:** Configuración de scope_extensions hacia [https://milkdropagent.motorvisuales.site](https://milkdropagent.motorvisuales.site) y modo fullscreen en manifest.json, con retorno nativo history.back() en el botón ‹ para evitar la apertura de Chrome Custom Tabs.

- ✅ **Asistente Unificado de Ingesta de YouTube en Móvil, Streaming Hetzner y Captura PiP (D-047):**
  - **Resolución de Modales Anidados y Touch Targets >= 44px:** Corrección de la jerarquía de cierre HTML en `#stems-export-modal` para independizar `#yt-mobile-modal` directamente bajo `body`. Botón de opciones `⚙️` redimensionado a 44x38px con feedback háptico.
  - **Apertura Universal sin Pistas Forzadas:** Ambos botones (`[YT] YouTube Móvil` y `⚙️`) abren ahora el Asistente Modal de Ingesta, eliminando la reproducción hardcoded no solicitada de `section-63.mp3`.
  - **Rediseño Centrado en Casos de Uso Reales:** 
    - *Método 1 (Stream Online HQ):* Input amplio con botón `[📋 Pegar]` (`navigator.clipboard.readText`) y banner de autodetección inteligente de enlaces de YouTube en el portapapeles. Streaming conectado al Gateway propio en Hetzner (`https://motorvisuales.site/api/yt-stream`) con fallback a Invidious/Piped.
    - *Método 2 (Escucha Acústica en Vivo para PiP/Altavoz):* Optimizado específicamente para cuando el usuario reproduce la app de YouTube en ventana flotante Picture-in-Picture (PiP) o altavoz externo en Android; activa el micrófono Hi-Fi adaptativo con ganancia 4.5x sin interrumpir la reproducción externa.
    - *Método 3 (Audio Digital Loopback):* Captura directa de pestaña/sistema (`startTabCapture`).
    - *Método 4 (Demos Opcionales & Archivo Local):* Cuadrícula de 3 chips de referencia (`Section 63`, `Mordaza`, `Tontos Útiles`) y carga local de archivos de audio.
  - **Corrección de Backend Gateway Hetzner:** Despliegue de fix en [server.py](file:///c:/MotorVisuales/server.py) con comprobación `os.path.isfile("cookies.txt") and os.path.getsize("cookies.txt") > 10` y normalización del archivo de cookies para erradicar el error `[Errno 21] Is a directory` en Docker.

- ✅ **Arquitectura Split-Screen 100dvh Fija para Móviles (< 1024px) en Rama Aislada (D-048):**
  - **Aislamiento en Rama:** Desarrollo y publicación en la rama de Git `feature/mobile-splitscreen-100dvh` en GitHub, garantizando cero impacto en la versión web/escritorio.
  - **Split-Screen 100dvh Zero-Scroll:** `html, body { height: 100dvh !important; overflow: hidden !important; }` y `main { height: calc(100dvh - 46px) !important; flex-direction: column !important; }`.
  - **Visor 3D Superior Fijo (~35dvh):** `#three-canvas-container` acotado a `35dvh` permanente con su HUD compacto flotante y controles táctiles de rotación y zoom.
  - **Deck Táctico Modular (~55dvh):** `#mobile-tactical-deck` (`flex-grow: 1`) con contención de scroll interno para los paneles modulares (`Audio`, `Stems`, `Mundos`, `FX`, `GLSL`, `Más`) y barra táctica fija de 54px en la base.
  - **Inputs de Audio en Cabecera:** Pistas Master de Referencia y Matriz Patchbay situadas en el primer orden visual dentro del panel de audio móvil, seguidas de Fader Master, Balance L/R y Preamp.
  - **Aislamiento DOM y Limpieza de Alturas:** `#left-dock-column` y `#three-viewport-resizer` ocultos en móvil; `syncResponsiveLayout()` oculta racks pesados de escritorio (`tier2Studios`, `tier2Subgrid`) y limpia `container.style.height` inline para que rijan las reglas `35dvh`; la restauración de altura personalizada queda restringida a `>= 1024px`.
  - **Validación Visual y Corrección de Anidamiento DOM (L-044):** Auditoría automatizada con Chrome DevTools Protocol en 390×844 px y 412×915 px ([scripts/mobile_visual_audit.js](file:///c:/MotorVisuales/scripts/mobile_visual_audit.js)), corrección de tag `</div>` espurio en línea 2498 que exponía a `#tier2-subgrid` a la regla flex de `#v4-view-live-runner > div.grid`, confirmación empírica de 100dvh Zero-Scroll (`scrollY = 0`), expansión del deck táctico a ~55dvh y verificación completa de las 6 pestañas tácticas y modales bottom sheets.

## Próximas Ideas / Pendientes
- [ ] Gemini AI Shader Copilot en Split-View IDE (Generación y mutación de shaders asistida por LLM).
- [ ] Control de iluminación DMX / ArtNet vía WebSockets para sincronizar luces de escenario con MotorVisuales.
- [ ] Soporte para modelos 3D GLTF/GLB importables por el usuario dentro de los Universos Escénicos.

