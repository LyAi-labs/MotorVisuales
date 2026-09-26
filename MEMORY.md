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

## Arquitectura Técnica

### Stack
- HTML/CSS/JS puro (sin framework)
- Tailwind CSS (CDN)
- Three.js r128 (`three.min.js` local)
- Web Audio API (DSP nativo del navegador)
- Google Gemini API (`gemini-2.5-flash`)

### Módulos Principales
1. **Entrada de Audio (5 modos):** Micrófono, Archivo MP3, Sintetizador demo, MP3 fijo (`tema.mp3`), Captura de Pestaña (`getDisplayMedia`)
2. **DSP — Banco de 8 Stems Biquad:**
   - Sub-Graves (<60Hz), Graves (60-250Hz), Medios-Bajos (250-500Hz), Medios (500-2kHz), Medios-Altos (2k-4kHz), Presencia (4k-6kHz), Agudos (6k-10kHz), Aire (>10kHz)
   - Variables: `stemsData[id].value` (0.0 a 1.0)
3. **Telemetría en tiempo real:** RMS, Centroide Espectral, Flujo Espectral, ZCR, Rolloff, Beat/Onset
4. **Motor 3D (Three.js WebGL):** 9 escenas intercambiables
   - Nebulosa 30.000 partículas (reactiva a sub+bass y treble+air)
   - Túnel infinito (reactivo a treble y bass)
   - Monolito (reactivo a bass y mids)
   - ⚡ Shader GLSL en Vivo (Custom ShaderMaterial con 18 presets y editor Hot-Reload)
   - ⚛️ GPU Compute Engine (GPGPU Shaders FBO): Simulación en GPU de 65.536 partículas mediante Curl Noise/atractor central/shockwave, Morfogénesis de Turing (Reacción-Difusión Gray-Scott) y Ecuación de Ondas 2D para líquido acústico con relieve 3D.
   - 🔮 Génesis Autónoma (Arte & Mundos IA): Síntesis procedural de universos visuales con 6 arquetipos (Prensa Escrita Halftone, Terminal Cyberpunk CRT, Planos CAD Blueprint, Microscopía Confocal Bio, Estela Rúnica y Manifiesto Bauhaus) y deformación física 3D en GPU.
   - 🔮 Cimática Cuántica 3D: Isosuperficie nodal armónica continua de Chladni renderizada por raymarching con distancia estimada analítica $d = |F|/\|\nabla F\|$ modulada por sub-graves y medios.
   - 🌀 Espacio No Euclidiano (Bola de Poincaré $\mathbb{H}^3$): Geometría hiperbólica fractal continua generada por inversiones respecto a esferas ortogonales de Coxeter con métrica $\kappa < 0$ reactiva al audio.
   - 🧲 Ferrofluido Magnético & Óptica Thin-Film: Inestabilidad de Rosensweig mediante picos de Lorentz voronoi e interferencia física multiespectral de película delgada ($\lambda = 650, 532, 440\,\text{nm}$) produciendo iridiscencia nacarada sobre negro carbón.
5. **Agente IA "Director de Arte":** Ciclo automático cada 15s, llama a `gemini-2.5-flash` para generar prompts artísticos y paletas de color que mutan la escena 3D en vivo. Fallback heurístico local si falla la API.
6. **Modelo Afectivo MER:** Pad Russell Circumplex (Valencia x Arousal), auto-tracking basado en RMS + Centroide.
7. **Grabador de Video:** MediaRecorder WebM 60FPS con mezcla de audio y soporte para cualquier shader o simulación compute activa.

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

## Próximas Ideas / Pendientes
- [ ] Visualizador de fase goniométrica y correlación estéreo Lissajous (X/Y phase scope)
- [ ] Soporte para mapas MIDI USB físicos (`navigator.requestMIDIAccess`) para controlar los 8 stems, sensibilidad y parámetros FX con controladores hardware DJ/VJ
- [ ] Exportación directa a GIF animado optimizado o WebP en bucle de 4-8 compases acústicos




