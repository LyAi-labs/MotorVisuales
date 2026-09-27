# DECISIONS.md — Decisiones Técnicas de MotorVisuales
> Decisiones de arquitectura específicas de este proyecto. Formato ADR.

---

### D-001 — Three.js local vs CDN
- **Fecha:** 2026-09-19
- **Estado:** ✅ Aceptada
- **Contexto:** La app necesita Three.js para el motor 3D.
- **Opciones:** CDN (requiere internet) vs archivo local (`three.min.js`)
- **Decisión:** Archivo local `three.min.js` r128 en `c:\MotorVisuales\`
- **Consecuencias:**
  - ✅ Funciona offline y en localhost sin problemas de CORS
  - ⚠️ Actualizar manualmente si se necesita una versión más nueva
- **Trigger:** Al añadir nuevas librerías JS al proyecto

---

### D-002 — Single HTML file vs proyecto modular
- **Fecha:** 2026-09-19
- **Estado:** ✅ Aceptada
- **Contexto:** Elegir entre un único `index.html` con todo el código vs separar en módulos JS.
- **Decisión:** Todo en un único `index.html` (~1580 líneas)
- **Consecuencias:**
  - ✅ Sin build step, sin bundler, servidor estático puro
  - ✅ Fácil de compartir y desplegar
  - ⚠️ A partir de ~2000 líneas considerar refactorizar a módulos ES6
- **Trigger:** Al evaluar si separar el código en múltiples archivos

---

### D-003 — 8 Stems Biquad DSP
- **Fecha:** 2026-09-23
- **Estado:** ✅ Aceptada
- **Contexto:** El motor necesitaba más granularidad que 3 bandas (Graves/Medios/Agudos).
- **Decisión:** Banco de 8 filtros Biquad paralelos:
  Sub (<60Hz), Bass (60-250Hz), LowMid (250-500Hz), Mid (500-2kHz),
  HighMid (2k-4kHz), Presence (4k-6kHz), Treble (6k-10kHz), Air (>10kHz)
- **Variables:** `stemsData[id].value` (0.0 a 1.0) generado dinámicamente desde `stemConfigs[]`
- **Consecuencias:**
  - ✅ Cada parámetro 3D puede mapearse a una banda precisa
  - ✅ Sistema dinámico: cambiar `stemConfigs[]` regenera toda la UI y el grafo de audio
  - ⚠️ Los stems no están aislados perfectamente (los filtros Biquad tienen overlap entre bandas)
- **Trigger:** Al considerar añadir más bandas o cambiar las frecuencias de corte

---

### D-004 — Gemini API: intervalo del ciclo IA
- **Fecha:** 2026-09-23
- **Estado:** ✅ Aceptada
- **Contexto:** El Director de Arte IA llama a Gemini cada 15s. Con tier gratuito provocaba error 429 (Rate Limit).
- **Decisión:** Intervalo configurable desde la interfaz con selector dinámico (15s, 30s, 60s, 120s), establecido en 60s por defecto.
- **Consecuencias:**
  - ✅ Elimina la saturación del tier gratuito de la API de Gemini
  - ✅ Permite al usuario ajustar la cadencia según tenga clave gratuita o de pago

---

### D-005 — Shaders GLSL en Nebulosa y Mapeo Granular de 8 Stems
- **Fecha:** 2026-09-23
- **Estado:** ✅ Aceptada
- **Contexto:** La Nebulosa renderizaba partículas cuadradas por defecto y los 8 stems se agrupaban de forma tosca en 3 bandas.
- **Decisión:**
  - `ShaderMaterial` personalizado en WebGL (vertex + fragment GLSL) con cálculo de distancia para glow circular y uniforms reactivos (`uSub`, `uBass`, `uTreble`, `uTime`, `uColor1`, `uColor2`).
  - Mapeo 1:1 de los 8 stems (`sub`, `bass`, `lowmid`, `mid`, `highmid`, `presence`, `treble`, `air`) a transformaciones individuales de niebla, iluminación, rotación y escalas de las 3 geometrías.

---

### D-006 — Post-Procesado con EffectComposer, Bloom y Aberración Cromática Reactiva
- **Fecha:** 2026-09-23
- **Estado:** ✅ Aceptada
- **Contexto:** Las escenas 3D carecían de impacto lumínico e intensificación de transitorios en momentos climáticos de audio.
- **Decisión:**
  - Integración de `THREE.EffectComposer` con `RenderPass`, `UnrealBloomPass` y un shader GLSL personalizado para `ShaderPass` de aberración cromática con dispersión de canales RGB.
  - Modulación dinámica en cada frame: los onsets y stems (`sub`, `treble`) amplifican la fuerza de emisión del Bloom, y el flujo espectral modula la separación angular cromática.
  - Fallback silencioso a render directo estándar si las librerías adicionales no están cargadas o hay error de inicialización WebGL.

---

### D-007 — Presets de Mapeo Acústico en JSON (Import / Export)
- **Fecha:** 2026-09-23
- **Estado:** ✅ Aceptada
- **Contexto:** El usuario requería guardar estados de ecualización, sensibilidad, escena activa y ajustes de FX visuales para diferentes estilos musicales.
- **Decisión:**
  - Formato JSON estandarizado (`format: "MotorVisualesPreset"`) que encapsula sensibilidad general, escena activa, estado de post-procesado (Bloom y Aberración) y los 8 stems (ganancias y mutes).
  - Incluye presets de fábrica instantáneos ("Equilibrado", "Club / Bass Boost", "Acústico / Voces", "Cyberpunk / Glitch") junto con exportación/descarga e importación mediante `FileReader` nativo.

---

### D-008 — Cámara Orbital Cinemática Multieje Reactiva
- **Fecha:** 2026-09-23
- **Estado:** ✅ Aceptada
- **Contexto:** La experiencia 3D requería un modo cinemático autónomo con movimiento de cámara reactivo a la música sin perder la capacidad de interactuar mediante arrastre y zoom.
- **Decisión:**
  - Implementación de 4 patrones de cámara cinemática con ecuaciones matemáticas específicas:
    1. `circle`: Órbita 360° esférica con modulación vertical periódica.
    2. `spiral`: Ascenso/descenso sinusoidal elíptico continuo.
    3. `lemniscate`: Trayectoria ∞ (Lemniscata de Bernoulli).
    4. `dramatic`: Vuelo rasante con variaciones de profundidad e inclinación.
  - Reactividad DSP:
    - **Graves / Onsets:** Dolly zoom y empuje en el radio orbital ante transitorios de `sub`, `bass` y beats.
    - **Medios / Agudos:** Modulación de la oscilación vertical y orientación sutil del vector `lookAt`.
    - **Camera Shake:** Micro-vibraciones perlin-like en picos de beat/onset.
  - Hibridación manual: El usuario puede continuar ajustando el acimut, elevación y radio usando el ratón/rueda mientras la cámara continúa su trayectoria orbital dinámica.

---

### D-009 — Editor de Shaders GLSL en Vivo con Hot-Reload WebGL
- **Fecha:** 2026-09-25
- **Estado:** ✅ Aceptada
- **Contexto:** Los usuarios requerían poder programar, experimentar y cargar sus propios shaders GLSL procedurales en tiempo real directamente desde el navegador, modulados por la telemetría de audio y los 8 stems DSP.
- **Decisión:**
  - Integración de una 4ª escena (`custom_shader`) basada en un quad a pantalla completa (`PlaneGeometry(2,2)` sin profundidad ni culling de frustum) y `THREE.ShaderMaterial`.
  - Recompilación en caliente segura mediante `threeRenderer.compile(testScene, threeCamera)` previo a la asignación de material, capturando y aislando errores de sintaxis WebGL/GPU en la consola de la UI sin detener el bucle de animación maestro.
  - Exposición completa y reactiva de los 8 stems Biquad DSP (`uSub`, `uBass`, `uLowmid`, `uMid`, `uHighmid`, `uPresence`, `uTreble`, `uAir`), telemetría (`uRms`, `uFlux`, `uCentroid`, `uIsOnset`), coordenadas (`uTime`, `uResolution`, `uMouse`) y paleta cromática IA (`uColor1`, `uColor2`, `uColor3`).
  - 4 presets de fábrica de alta fidelidad (Plasma Psicodélico, Raymarching de Túnel Fractal SDF, Ondas Espectrales y Bio-Voronoi Pulsante), persistencia en `localStorage` y soporte para exportar/importar archivos `.glsl`.

---

### D-010 — Loop de Renderizado Unificado (masterRenderLoop) y Enrutamiento Fijo Web Audio
- **Fecha:** 2026-09-25
- **Estado:** ✅ Aceptada
- **Contexto:** Las métricas de análisis DSP, el osciloscopio PCM y la reproducción de `tema.mp3` no reaccionaban debido a la ausencia del bucle de animación unificado y desconexiones entre el elemento `<audio>` y el grafo Web Audio.
- **Decisión:**
  - Integración de un elemento `<audio id="html5-audio-player">` en el DOM estático con `crossorigin="anonymous"`.
  - Creación de un grafo Web Audio permanente: `masterGainNode` enlazado de forma fija a `mainAnalyser`, `audioDestNode` y a los 8 filtros Biquad, evitando reconexiones destructivas o duplicadas en cada reproducción.
  - Ciclo de animación maestro `masterRenderLoop(timestamp)` ejecutando a 60 FPS con `requestAnimationFrame`: `runAudioDSP()` → `updateRealFrequencyChart()` → `renderThreeFrame(time)`.

---

### D-011 — Suite Completa de Post-Procesado WebGL (9 Passes Reactivos)
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** La experiencia visual requería un rack completo de efectos ópticos, analógicos y digitales profesionales para modular el pipeline de Three.js y el editor GLSL en tiempo real ante la música.
- **Decisión:**
  - Cadena ordenada en `THREE.EffectComposer`:
    `RenderPass` → `UnrealBloomPass` → `RadialBlurPass` → `KaleidoscopePass` → `ChromaticAberrationPass` → `GlitchPass` → `PixelatePass` → `NegativeInvertPass` → `FilmGrainPass` → `CRTScanlinePass`.
  - Reactividad DSP granular en cada frame a 60 FPS:
    1. **Bloom Glow:** Transitorios en sub/treble + destello extra en beats/onsets.
    2. **Radial Zoom Shockwave:** Onda de choque acústica expansiva reactiva a sub y bombos.
    3. **Caleidoscopio Master:** Simetría radial N-caras con rotación continua modulada por agudos.
    4. **Aberración Cromática:** Dispersión espectral RGB modulada por el flujo espectral.
    5. **Audio Glitch & Block Displacement:** Desplazamiento pseudoaleatorio y ruido digital en picos y onsets.
    6. **Pixelación Retro 8-Bit:** Cuantización de bloques modulada por bandas de presencia y agudos.
    7. **Inversor Negativo / Solarización:** Flashes de luminancia invertida en picos climáticos.
    8. **Film Grain 35mm & Viñeta:** Ruido analógico cinematográfico reactivo a la banda de aire (>10kHz).
    9. **Monitor CRT / VHS:** Curvatura de tubo catódico y scanlines moduladas por frecuencias medias-bajas.
  - Controles UI dedicados por efecto (toggle checkbox + slider de intensidad en tiempo real) y botones globales ("Todo ON", "Todo OFF", "Reset").
  - Integración total en la exportación e importación de Presets JSON (v1.1).

---

### D-012 — GPGPU Compute Shader Engine (FBO Ping-Pong) y Audio DataTexture
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** Las escenas visuales tradicionales ejecutaban transformaciones en CPU o deformaciones estáticas en Vertex Shaders sin memoria de estado acumulativa entre fotogramas. Se requería simulación de física masiva (enjambres de partículas con dinámica de fluidos) y morfogénesis biológica/líquida ejecutada 100% en la GPU a 60 FPS, junto con la capacidad de que los shaders GLSL accedan al espectro acústico completo de 1024 bins como una textura bidimensional.
- **Decisión:**
  1. **Motor GPGPU Compute:**
     - Arquitectura basada en pares de `THREE.WebGLRenderTarget` con técnica de doble búfer (Ping-Pong FBO) de resolución 256x256 (65.536 celdas/partículas) en precisión `THREE.FloatType` (con fallback a `THREE.HalfFloatType`).
     - Cámara ortográfica desacoplada con quad unitario ejecutando pases de cálculo temporal de velocidad, posición y difusión química.
     - 3 Modos de Simulación GPU:
       - **Enjambre Gravitatorio de 65.536 Partículas:** Integración de Curl Noise 3D divergente (Simplex), atractor central Kepleriano/vórtice, ondas de choque acústicas en transitorios y amortiguación de inercia. Visualizado con `THREE.Points` muestreando la posición en GPU mediante coordenadas de textura UV atributadas.
       - **Morfogénesis de Turing (Reacción-Difusión Gray-Scott):** Kernel Laplaciano de 9 puntos en GPU modulando los coeficientes de alimentación $F$ (con el bombo/graves) y de eliminación $K$ (con los agudos y onsets).
       - **Ecuación de Ondas 2D Acústica:** Propagación de ondas en fluido con inyección de perturbaciones en picos de audio, renderizado en relieve 3D con normales por gradiente y reflexión especular/cáustica.
  2. **Transmisión de Audio-Reactividad a Textura (`uAudioTexture`):**
     - Generación continua en `masterRenderLoop` de un `THREE.DataTexture` 512x2:
       - Fila 0: Espectro de frecuencias FFT interpolado.
       - Fila 1: Oscilograma PCM y energía temporal.
     - Expuesto universalmente en los 15 presets del Live Shader Studio y materiales de simulación compute.
  3. **Expansión a 15 Presets de Alta Fidelidad en el Live Shader Studio:**
     - Incorporación de 5 nuevos shaders procedurales avanzados:
       11. Sinapsis Neural Cuántica & Red Axonal
       12. Aurora Boreal Fluida Volumétrica (SDF)
       13. Mandelbulb 3D Hipercomplejo (Fractal Cuaterniónico Raymarching)
       14. Lluvia Digital Matrix Cybercore (Glitch & Cripto)
       15. Supernova Estelar & Disco de Acreción Cuántico Relativista
- **Consecuencias:**
  - ✅ Computación de 65.536 partículas y simulaciones continuas sin sobrecarga en la CPU.
  - ✅ Total compatibilidad con el pipeline de post-procesado (los 9 pases FX afectan a la simulación).
---

### D-013 — Modo Studio Cinema (Zen Focus), Escalado de Resolución Dinámica GPU y Presets GPGPU
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** Al operar en modo de visualización inmersiva en pantallas de alta resolución (4K/Retina), la interfaz con múltiples racks laterales y paneles de herramientas restaba protagonismo a la experiencia visual. Además, los dispositivos con GPUs integradas o pantallas de alta densidad requerían control granular del escalado de resolución (DPR), y los parámetros del motor GPGPU Compute necesitaban perfiles de configuración instantáneos.
- **Decisión:**
  1. **Modo Studio Cinema / Zen Focus (`body.studio-mode`):**
     - Oculta mediante CSS colapsable la columna izquierda de audio (`#left-dock-column`) y la sección inferior de editores (`#tier2-studios`).
     - Expande el viewport 3D (`#three-viewport-section`) al 100% del ancho (`grid-column: span 12 / span 12`) y altura calculada dinámica (`height: calc(100vh - 120px)`).
     - Incorpora un dock flotante de acceso rápido tipo píldora (`.studio-pill-dock`) en la base del canvas con botones esenciales (reproducir, mic, synth, cámara orbital, pantalla completa y salida rápida).
     - Función `triggerThreeResize()` con sincronización de debounce y actualización de matrices de cámara y buffers de post-procesado.
  2. **Selector Dinámico de Calidad Gráfica / Resolución GPU (`setRenderQuality`):**
     - Selector en cabecera con 3 modos:
       - **Ultra (1.0x Nativo):** DPR máximo de pantalla (hasta 2.0x), renderizado nítido completo.
       - **Balance (0.85x):** DPR escalado al 85% para un balance óptimo entre fidelidad y fillrate.
       - **Eco (0.65x):** DPR escalado al 65% para garantizar 60 FPS estables en GPUs integradas o laptops.
  3. **Presets Instantáneos para GPGPU Compute (`applyComputePreset`):**
     - 7 perfiles cinemáticos preconfigurados:
       - `galaxy`: Galaxia Kepleriana (Partículas, Vel 1.2x, Audio 1.8x, Turb 0.7x).
       - `vortex_storm`: Tormenta de Vórtices (Partículas, Vel 2.0x, Audio 2.5x, Turb 2.2x).
       - `bio_nebula`: Nebulosa Biológica (Partículas, Vel 0.6x, Audio 1.0x, Turb 0.4x).
       - `turing_leopard`: Turing Leopardo (Reacción-Difusión, Vel 1.2x, Audio 1.6x, Turb 1.0x).
       - `turing_waves`: Laberinto Morfogenético (Reacción-Difusión, Vel 1.8x, Audio 2.2x, Turb 1.8x).
       - `acoustic_ripple`: Ondas Acústicas Líquidas (Ecuación 2D, Vel 1.0x, Audio 2.0x, Turb 1.0x).
       - `ocean_storm`: Resonancia Marina Caótica (Ecuación 2D, Vel 2.2x, Audio 2.8x, Turb 2.5x).
- **Consecuencias:**
  - ✅ Experiencia visual completamente inmersiva a pantalla expandida sin perder acceso a controles críticos.
  - ✅ Rendimiento personalizable en cualquier gama de GPU con ajuste instantáneo en caliente.
  - ✅ Exploración directa y expresiva de la física cuántica y biológica de la GPU con un solo clic.

---

### D-014 — Renderizado Volumétrico Raymarching de Niebla Cuántica GPGPU y Exportador Standalone Web HTML
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** Se requería completar los dos hitos visuales de la hoja de ruta: (1) Renderizar volumen y niebla cuántica continua mediante raymarching volumétrico acoplado a la simulación física de 65.536 partículas FBO y a los stems DSP, y (2) Permitir que cualquier shader creado o editado en el Live Shader Studio pueda compartirse y ejecutarse como una aplicación web autónoma (.html) independiente, offline y auto-contenida con su propio motor WebGL y Web Audio.
- **Decisión:**
  1. **Renderizado Volumétrico Raymarching GPGPU (`volumetric_fog`):**
     - Geometría esférica envolvente (`SphereGeometry(280)` con `THREE.BackSide`) permitiendo que la cámara ingrese o circule alrededor del volumen sin culling ni artefactos de recorte.
     - Intersección analítica rayo-esfera con cálculo exacto de $t_{near}$ y $t_{far}$ para cámaras internas y externas.
     - 48 pasos de raymarching por fragmento con dither jittering para erradicar el bandeo visual a 60 FPS.
     - Muestreo multiescala de la textura de posiciones FBO (`uPosTex`) y deformación del espacio mediante el campo de velocidades (`uVelTex`).
     - Integral física de absorción lumínica (ley de Beer-Lambert) y dispersión anisótropa de luz (función de fase Henyey-Greenstein), alimentada por una singularidad lumínica central atenuada inversamente al cuadrado de la distancia, modulada por transitorios de `uSub`, `uBass` y picos de onsets.
  2. **Exportador Standalone Web HTML (`exportShaderStandaloneHTML`):**
     - Genera un archivo `.html` de ~15 KB sin ninguna dependencia externa de red (funciona 100% offline).
     - Integra un runtime WebGL puro (1/2) con quad a pantalla completa alimentando todos los uniforms estándar (`uTime`, `uResolution`, `uMouse`, los 8 stems DSP `uSub`...`uAir`, `uRms`, `uFlux`, `uCentroid`, `uIsOnset`, `uColor1`...`uColor3` y la textura `uAudioTexture`).
     - Motor Web Audio API nativo con banco de 8 filtros Biquad, sintetizador procedural de música electrónica a 124 BPM, soporte para micrófono en vivo y reproductor con selector y Drag & Drop para archivos de audio locales (MP3, WAV, FLAC, OGG).
     - HUD flotante con glassmorphism, controles en caliente de sensibilidad, paleta cromática, fullscreen y modo ocultar HUD.
- **Consecuencias:**
  - ✅ Renderizado volumétrico físico cinematográfico con interacción directa entre fluidodinámica de GPU y acústica.
  - ✅ Portabilidad universal absoluta: cualquier usuario puede descargar su shader procedural como una experiencia web auto-contenida y lista para producción o directo.

---

### D-015 — Configuración de API Keys Desacoplada y Segura vía `config.js` Local
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** Al ser un motor frontend estático que se sirve localmente vía HTTP (`python -m http.server`), el navegador no puede leer archivos `.env` sin un backend Node/Python. Se requería un método seguro y cómodo para almacenar la clave API de Gemini sin exponerla en commits de Git ni depender únicamente de `localStorage`.
- **Decisión:**
  - Crear un archivo `config.example.js` como plantilla pública en el repositorio.
  - Añadir `config.js`, `.env` y `.env.local` al `.gitignore`.
  - Cargar opcionalmente `<script src="config.js" onerror="/* opcional */"></script>` en el `<head>` de `index.html`.
  - `config.js` inyecta `window.MOTOR_CONFIG = { GEMINI_API_KEY: "..." }`.
  - En la aplicación (`index.html`), al inicializarse el DOM y al ejecutar el Director de Arte IA, se verifica primero `window.MOTOR_CONFIG?.GEMINI_API_KEY`. Si existe, se auto-selecciona el motor Gemini, se muestra la clave en el panel con un indicador visual `(cargada desde config.js)` y se prioriza sobre el input manual y `localStorage`.
  - Se mantiene la compatibilidad completa con el campo de texto manual y `localStorage` para usuarios que no utilicen el archivo `config.js`.
- **Consecuencias:**
  - ✅ Seguridad garantizada: las credenciales nunca son trackeadas por Git.
  - ✅ Experiencia plug-and-play para desarrollo local sin tener que reintroducir la clave API en cada sesión o navegador.

---

### D-016 — Captura Fija Ultra-HD (4K / 8K SSAA) y Motor Multitrack de Stems WAV (Offline Biquad DSP)
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** Los creadores visuales y productores musicales requerían dos funcionalidades esenciales de producción: (1) Exportar imágenes fijas de ultra-alta fidelidad (fondos de pantalla, carátulas y posters 4K UHD y 8K Master) con todos los shaders procedurales y la suite de 9 efectos post-procesado activos sin distorsionar el layout de la UI interactiva, y (2) Exportar los 8 stems acústicos filtrados individualmente o en lote como pistas WAV independientes para su importación directa en DAWs (Ableton, FL Studio, Logic, Reaper).
- **Decisión:**
  1. **Captura Fija Ultra-HD (4K / 8K SSAA):**
     - Redimensionamiento temporal desacoplado del canvas WebGL mediante `threeRenderer.setSize(renderW, renderH, false)` con `updateStyle: false` para evitar deformaciones del DOM.
     - Modos de resolución predefinidos: 1080p FHD (1920x1080), 2K QHD (2560x1440), 4K UHD (3840x2160) y 8K Cinema Master (7680x4320).
     - Súper-Muestreo Anti-Aliasing (SSAA): Renderizado interno a factor 1.5x acoplado a las capacidades de textura de la GPU (`maxTextureSize`) y remuestreo bicúbico mediante canvas 2D intermedio (`imageSmoothingQuality: 'high'`) para erradicar artefactos de aliasing en partículas y geometrías.
     - Feedback multisensorial cinemático: Destello visual blanco (`#screenshot-flash`) y síntesis física de obturador réflex dual (espejo y cortinilla) a través de Web Audio API en tiempo real.
     - Atajo de teclado directo `P` para captura 4K instantánea y modal de configuración detallada (`Shift+S`).
  2. **Exportador Multitrack de Stems WAV (Biquad DSP):**
     - Procesamiento acústico offline no bloqueante mediante `OfflineAudioContext` ejecutado a velocidad ultra-rápida de hardware sobre la pista cargada (`tema.mp3` o archivo local del usuario).
     - Replicación exacta del banco de 8 filtros Biquad (`sub`, `bass`, `lowmid`, `mid`, `highmid`, `presence`, `treble`, `air`) preservando tipos de filtro, frecuencias de corte y factores Q de `stemConfigs`.
     - Codificador nativo a formato RIFF WAVE sin dependencias externas (`audioBufferToWav`) con soporte seleccionable para 16-bit PCM Integer (estándar broadcast CD) y 32-bit Float IEEE (calidad estudio sin clipping).
     - Exportación por lote (Batch) con barra de progreso en tiempo real de 0% a 100% y descarga secuencial protegida contra cuellos de botella del navegador.
     - Botón de descarga individual `⬇ WAV` integrado ergonómicamente en cada una de las 8 tarjetas de canal en el rack DSP.
  3. **Sistema de Notificaciones Toast Glassmorphic (`showToast`):**
     - Capa flotante no invasiva con temporizador y animaciones CSS de entrada/salida para retroalimentación en tiempo real de renderizados, capturas y estado del sistema.
- **Consecuencias:**
  - ✅ Calidad de exportación gráfica de nivel editorial y wallpaper sin interrupción del render loop a 60 FPS.
  - ✅ Generación de stems de audio reales listos para producción musical y remezcla en cualquier DAW profesional.
  - ✅ Experiencia de usuario refinada con atajos de teclado rápidos, microinteracciones táctiles y consistencia de diseño visual.

---

### D-017 — Interpolación Cinemática Cromática Continua (Lerp a 60 FPS) de la Directiva IA y Sincronización Integral de Escenas
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** Al pulsar "Actualizar Directiva", la mutación de colores de la escena era instantánea y abrupta, generando un salto no cinemático. Además, la luz puntual `pointLight` recalculaba su color en cada frame con una fórmula HSL basada únicamente en la banda `presence`, sobreescribiendo de inmediato el color primario inyectado por la directiva de la IA.
- **Decisión:**
  1. **Interpolación Suave de Color a 60 FPS (Color Lerp):**
     - Definir estados desacoplados para la paleta IA: `aiColorsCurrent` y `aiColorsTarget` (`prim`, `accent`, `fog`).
     - Al recibir una nueva directiva (LLM o Heurístico), `applyAiDirectionToThree` únicamente actualiza `aiColorsTarget` y dispara un toast visual.
     - En el bucle de renderizado `renderThreeFrame()`, se ejecuta `aiColorsCurrent.*.lerp(aiColorsTarget.*, 0.05)` en cada fotograma, produciendo una suave transición cromática cinematográfica de ~1 segundo sin parpadeos ni caídas de fotogramas.
  2. **Preservación y Dinámica de `pointLight`:**
     - La luz puntual copia `aiColorsCurrent.prim`, garantizando armonía cromática total con la paleta de la directiva, mientras su intensidad se modula reactivamente con los transitorios de onsets (`liveAudioMetrics.isOnset`) y la banda de agudos/presencia.
  3. **Propagación Uniforme a todas las Escenas 3D:**
     - La paleta interpolada se inyecta en tiempo real en la niebla volumétrica (`threeScene.fog.color`), los uniforms de la Nebulosa (`uColor1`, `uColor2`), el alambre del Túnel (`tunnelMesh.material.color`), el Monolito (`monolithMesh`), los uniforms de Raymarching procedural (`customShaderUniforms`) y el motor de 65.536 partículas FBO GPGPU (`particleMat`, `terrainMat`, `volumetricMat`).
- **Consecuencias:**
  - ✅ Transiciones visuales suaves, hipnóticas y elegantes entre directivas artísticas.
  - ✅ Coherencia lumínica integral en todos los modos visuales y partículas.

---

### D-018 — Motor de Génesis Autónoma de Arte: Síntesis de Universos Visuales Procedurales Impulsada por LLM y Telemetría Acústica
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** Las visuales previas operaban sobre plantillas fijas (Nebulosa, Túnel, Monolito, FBO) donde la IA solo alteraba tintes cromáticos. Se requería verdadera autonomía artística: que la IA conciba, maquete y sintetice universos visuales y conceptos de arte completamente nuevos y únicos para cada canción (e.g. prensa escrita/rotativa, terminal hacker CRT, planos aeroespaciales CAD, microscopía biológica, estelas rúnicas o suprematismo suizo).
- **Decisión:**
  1. **Lienzo Gráfico Procedural Universal (`AutonomousGenesisManager`):**
     - Empleo de un `OffscreenCanvas` 2D dinámico ($1024 \times 1024$) proyectado en tiempo real a una textura WebGL (`THREE.CanvasTexture`).
     - Maquetador tipográfico y vectorial procedimental para 6 arquetipos:
       - `editorial_press`: Periódico clásico / rotativa con cabecera gótica, columnas justificadas, titular gigante y marco fotográfico central con el espectrograma FFT renderizado en trama de semitonos (halftone).
       - `cyber_terminal`: Terminal militar cyberpunk CRT con rejilla de fósforo verde, volcados hexadecimales y osciloscopio vectorial.
       - `blueprint_cad`: Plano arquitectónico milimétrico en azul de Prusia con esquemas técnicos y curvas polares.
       - `bio_specimen`: Microscopía confocal con células vivas y filamentos fluorescentes.
       - `ancient_glyph`: Estela megalítica de basalto con runas que resplandecen con la percusión.
       - `bauhaus_manifesto`: Constructivismo suizo con bloques geométricos que actúan como pistones cinéticos.
  2. **Malla 3D Física con Shaders de Deformación Aerodinámica:**
     - Plano 3D subdividido ($48 \times 36$ vértices) con shader GLSL de simulación de viento: flexión de la hoja por graves (`uBass`, `uSub`), curvatura aerodinámica y aleteo de esquinas de papel con agudos (`uTreble`, `uAir`) y transitorios (`uIsOnset`).
     - Campo de 180 partículas flotantes de restos/papel en órbita con turbulencia.
  3. **Fotograma Espectral Interactivo a 60 FPS:**
     - El marco fotográfico de la portada o terminal se actualiza dinámicamente con las barras FFT reales de la canción en trama de semitonos o vectores, manteniendo la textura viva sin sobrecoste de CPU.
  4. **Invocación Multimodal LLM & Matriz Heurística Resiliente:**
     - Prompt estructurado JSON para Gemini (`conceptTitle`, `manifesto`, `archetype`, `headline`, `subtext`, `palette`, `cameraMode`, `cameraDistance`, `cameraSpeed`).
     - Matriz de contingencia de 6 universos curados offline para ejecución sin latencia ni API Key.
     - HUD Card flotante en el canvas mostrando la ficha técnica de la obra de arte concebida.
- **Consecuencias:**
  - ✅ Capacidad generativa infinita: cada track recibe un concepto de arte, titular y mundo tridimensional original.
  - ✅ Fusión orgánica entre diseño gráfico editorial analógico y física 3D reactiva en GPU a 60 FPS.

---

### D-019 — Suite de Visuales de Vanguardia Matemática: Cimática Cuántica 3D, Geometría Hiperbólica en Poincaré H³ y Ferrofluido con Interferencia Óptica Thin-Film
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** Se requería romper las limitaciones de las visuales tradicionales explorando física matemática y óptica cuántica avanzada para concebir experiencias sensoriales inéditas a 60 FPS reactivas al banco DSP de 8 stems.
- **Decisión:**
  1. **Cimática Cuántica 3D (`cymatics_chladni_3d` / `cymatics_scene`):**
     - Isosuperficie nodal continua definida por la ecuación tridimensional armónica:
       $$\cos(m\pi x)\cos(n\pi y)\cos(k\pi z) - \cos(k\pi x)\cos(m\pi y)\cos(n\pi z) = 0$$
     - Renderizado volumétrico mediante raymarching con distancia estimada analítica $d = \frac{|F|}{\|\nabla F\|} - \text{thickness}$ y normales calculadas por el gradiente implícito $\nabla F$.
     - Modos armónicos cuánticos ($m, n, k$) modulados dinámicamente por las bandas acústicas `uSub`, `uBass` y `uMid`, con halo cuántico emissive reactivo a los transitorios y partículas cuánticas suspendidas en la banda `uAir`.
  2. **Espacio No Euclidiano en Bola de Poincaré $\mathbb{H}^3$ (`hyperbolic_poincare` / `hyperbolic_scene`):**
     - Proyección conforme de geometría hiperbólica tridimensional donde el espacio infinito se comprime dentro de la bola unidad $\|u\| < 1$.
     - Teselación hiperbólica fractal continua mediante 14 iteraciones de inversiones esféricas respecto a esferas ortogonales de Coxeter:
       $$p' = c + (p - c) \frac{r^2}{\|p - c\|^2}$$
     - Curvatura métrica espacial $\kappa < 0$ modulada elásticamente por la presión acústica de `uSub` y `uBass`, provocando dilataciones y contracciones gravitatorias relativistas en onsets.
  3. **Ferrofluido Magnético con Óptica de Película Delgada (`ferrofluid_thinfilm` / `ferrofluid_scene`):**
     - Inestabilidad magnetohidrodinámica de Rosensweig modelada en SDF mediante proyección Voronoi polar que genera picos cónicos de Lorentz alrededor del núcleo fluido, con amplitud modulada por `uBass` y deformación armónica por `uMid`.
     - Simulación analítica de interferencia de película delgada de ondas lumínicas (Fresnel / anillos de Newton) calculando la diferencia de fase multiespectral para longitudes de onda discretas ($\lambda_R = 650\,\text{nm}, \lambda_G = 532\,\text{nm}, \lambda_B = 440\,\text{nm}$):
       $$\Delta \phi = \frac{4\pi n d}{\lambda}\cos(\theta_t)$$
     - Grosor nanométrico de la película modulado dinámicamente por la banda `uTreble`, produciendo iridiscencia nacarada física y especularidad sobre base de carbono negro.
  4. **Integración Bidireccional y Accesibilidad de Usuario:**
     - Integración directa en el selector de escenas 3D maestro (`#three-scene-mode`, opciones 7, 8 y 9) y en el estudio de shaders procedimentales (`#shader-preset-select`, opciones 16, 17 y 18).
     - Sincronización automática de visibilidad de mallas, supresión de interfaces computacionales no aplicables y actualización en tiempo real de la telemetría en el HUD.
- **Consecuencias:**
  - ✅ Rendimiento garantizado a 60 FPS sin sobrecoste de CPU gracias a la evaluación analítica 100% en GPU.
  - ✅ Grado de sofisticación matemática de vanguardia que distingue radicalmente a MotorVisuales de visualizadores de audio convencionales.

---

### D-020 — Arquitectura MotorVisuales v4.2-PRO: Bus Unificado de Registros ($Q_1 \dots Q_{64}$), Ingesta RF/SDR, Atractores Caóticos y Stitch MCP Integration
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** Se aprobó el PRD de **MotorVisuales v4.2-PRO**, transcendiéndolo a una estación audiovisual y electromagnética ciberfísica de nivel profesional. El diseño arquitectónico requería acoplamiento directo a Google Stitch vía Model Context Protocol (MCP), bus de registros unificado $Q_1 \dots Q_{64}$, buffer circular de lookahead acústico (+30 frames) con cálculo de $\frac{dE}{dt}$, suite de atractores caóticos (Lorenz 3D, Rössler, Chen, Clifford), matriz de radiofrecuencia (RF / SDR) con constelación IQ 16-QAM y espectrograma waterfall térmico, y consola DSP de 64 bandas con perfiles de género acústico.
- **Decisión:**
  1. **Integración MCP de Google Stitch (`stitch.googleapis.com/mcp`):**
     - Configuración de servidor MCP global en `~/.gemini/config/mcp_config.json` con cabecera `X-Goog-Api-Key`.
     - Ingesta y descarga de pantallas maestras desde el proyecto Stitch `4507385985753386393` en `diseños/` (HTML responsivo + PNG de alta fidelidad: `rf_sdr_matrix`, `chaos_attractors`, `live_runner_xy_pad`, `audio_dsp_genres`).
  2. **Bus Unificado de Registros ($Q_1 \dots Q_{64}$):**
     - Instanciación de `window.qVars = new Float32Array(64)`.
     - $Q_1$: Impacto de burst lookahead derivativo $\frac{dE}{dt}$ a +30 fotogramas.
     - $Q_2$: Densidad de potencia espectral ponderada por RMS y mids.
     - $Q_3$: Rotor de fase sinusoidal continuo modulado por centroide espectral.
     - $Q_4$: Relación señal/ruido (SNR) en decibelios (dB).
     - $Q_5, Q_6$: Coordenadas cinemáticas normalizadas $[-1, +1]$ del Vector XY Modulator.
     - $Q_7$: Flujo espectral acumulado (Spectral Flux).
     - $Q_8$: Exponente de Lyapunov del atractor dinámico activo.
     - $Q_9 \dots Q_{16}$: Niveles de energía en tiempo real de los 8 filtros Biquad DSP.
     - Vinculación a los shaders GLSL mediante uniforms directos (`uQ1`..`uQ8`, `uQVars`, `uChaosPos`) y forwarding a los compute passes de GPU.
  3. **Suite de Atractores Caóticos y Modulador Vector XY:**
     - Solucionadores numéricos por sub-pasos tipo Euler/RK4 para Lorenz 3D ($\sigma=10, \rho=28, \beta=8/3$), Rössler ($\alpha=0.2, b=0.2, c=5.7$), Chen ($\alpha=35, b=3, c=28$) y Clifford 2D toroidal.
     - Superficie interactiva Vector XY con arrastre multitáctil, físicas elásticas con retorno al centro (Spring), inercia de deslizamiento (Glide) y modo Sample & Hold caótico.
     - Botón de proyección instantánea 3D (`projectChaosTo3DViewport()`) y nuevo shader de vanguardia `attractor_quantum_rf` (Preset 19) en el 3D Viewport.
  4. **Matriz de Ingesta RF / SDR y Telemetría Electromagnética:**
     - Soporte para fuentes de radiofrecuencia (HackRF One 20 MSPS, RTL-SDR v4, ADALM-Pluto y archivos sintéticos IQ .WAV).
     - Sintonizador de portadoras (104.700 MHz FM Wide, 2.412 GHz WiFi Ch 1, 1.090 GHz ADS-B Air, 433.92 MHz ISM).
     - Canvases dedicados a 60 FPS: Diagrama de constelación IQ en plano complejo, Espectrograma Waterfall térmico continuo y Relieve 3D de Reacción-Difusión WebGPU con simulación de laplaciano ($\nabla^2 f$).
  5. **Consola DSP de 64 Bandas & 4 Perfiles Acústicos de Género:**
     - FFT de 64 bandas logarítmicas con gradiente de color reactivo cian-fucsia.
     - Calibración por perfiles: *Stage Rave*, *Ambient Sphere*, *Drum & Bass*, *Peak Techno*.
  6. **Navegación Modular Multivista de Producción:**
     - Cockpit sub-bar superior con 5 pestañas de navegación: `LIVE RUNNER`, `AUDIO DSP`, `RF / SDR MATRIX`, `CHAOS LAB`, `SYSTEM CONFIG`.
     - Chips de telemetría en tiempo real en la cabecera ($q_1$, $q_2$, burst impact state, vector XY).
- **Consecuencias:**
  - ✅ Fusión sin precedentes entre acústica digital, dinámica no lineal y electromagnetismo de radiofrecuencia en una sola estación WebGL/WebGPU.
  - ✅ Arquitectura 100% modular y preservación de todas las escenas previas (Nebulosa, Túnel, Monolito, FBO 65k, Génesis Autónoma y los 18 presets GLSL).

---

### D-016 — Procesador Estéreo L/R, Presets Multi-Track y Asistente YouTube en Móvil
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:** 
  1. El reproductor requería control de volumen general y regulación independiente por canal izquierdo y derecho (L / R).
  2. Integrar el nuevo track "Tontos Útiles" permanentemente junto a "Mordaza".
  3. Permitir capturar y visualizar en tiempo real el audio de YouTube desde navegadores móviles en `https://motorvisuales.site`.
- **Decisión:**
  1. **Grafo Estéreo Web Audio:**
     - Separación de canal con `ChannelSplitter(2)`.
     - Control independiente de ganancia con `gainLeftNode` y `gainRightNode` alimentando `ChannelMerger(2)`.
     - Atenuación global de salida mediante `outputMasterGain` conectada a `audioCtx.destination`, desacoplada de la sensibilidad de análisis DSP.
  2. **Presets de Pistas Permanentes:**
     - Botonera dual de presets para "Mordaza" (`tema.mp3`) y "Tontos Útiles" (`tontos-utiles.mp3`) con feedback visual de reproducción y selección automática en el exportador de stems WAV.
  3. **Asistente de Ingesta YouTube en Móviles:**
     - Modal dedicado con modo de escucha acústica Hi-Fi sin procesadores de llamada telefónica (`echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`), resolución de streams online y carga de archivos descargados.
- **Consecuencias:**
  - ✅ Control de mezcla estéreo profesional y balance L/R sin cortes de audio ni distorsión.
  - ✅ Compatibilidad completa con YouTube en teléfonos Android / iOS sin requerir permisos root o de sistema.

---

### D-017 — Enrutamiento Estéreo Universal, HUD Live Reactivo y Detección Relativa de Onsets
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:**
  1. Al seleccionar "YouTube Móvil" o fuentes en vivo, la barra de reproducción seguía mostrando el título estático de "Mordaza (tema.mp3)" y un scrubber temporal `00:00 / 03:18`.
  2. Los visualizadores 3D no reaccionaban ante el audio capturado de YouTube/móvil por umbrales de onset fijos (`flux > 1.7`, `sub+bass > 0.8`) diseñados para masterings a 0 dBFS.
  3. Los faders de canal izquierdo (L), canal derecho (R) y volumen general no afectaban a YouTube porque las fuentes en vivo se conectaban con `connectSpeakers = false`, desconectando el divisor estéreo de la salida de audio.
- **Decisión:**
  1. **Enrutamiento Estéreo Universal con Monitoreo:**
     - Conectar todas las fuentes en vivo (YouTube Móvil, Micrófono Hi-Fi, Captura de Pestaña/Sistema) a través de `masterGainNode -> ChannelSplitter(2) -> Gain L / Gain R -> ChannelMerger(2) -> OutputMasterGain -> audioCtx.destination`.
     - Incorporar control de monitoreo `[🎧 Monitoreo: ACTIVO / MUTE]` para permitir audición en auriculares y balance L/R inmediato, con opción de silenciar para evitar acoples si se usa altavoz sin auriculares.
  2. **HUD Dinámico de Reproducción (`updatePlaybackBar`):**
     - Actualizar inmediatamente el título al seleccionar YouTube: `🔴 YouTube Móvil (Audio en Vivo)`.
     - Ocultar el scrubber de archivo y desplegar un vúmetro analógico en tiempo real con indicador `● EN VIVO (DSP INGEST)`, lectura en decibelios y selector rápido de preamplificación (`[1x] [2.5x] [4.5x] [8x]`).
     - Reconfigurar el botón de reproducción como parada limpia de ingesta en vivo (`⏹`).
  3. **Control Automático de Ganancia (AGC) y Onset Relativo:**
     - Algoritmo de adaptación dinámica de pico (`dynamicLivePeak`) y seguimiento del flujo espectral medio (`avgSpectralFlux`).
     - Disparo de onsets mediante umbral adaptativo relativo (`flux > avgSpectralFlux * 1.35`), garantizando que la Nebulosa de 30.000 partículas y los 19 presets WebGL reaccionen con máxima energía incluso ante audio acústico o de altavoz móvil.
- **Consecuencias:**
  - ✅ Feedback visual inmediato y claro de la fuente activa en el reproductor.
  - ✅ Regulación estéreo L y R 100% funcional para YouTube y fuentes externas.
  - ✅ Reactividad visual garantizada para cualquier volumen de entrada.

---

### D-018 — Ingesta Directa de YouTube HQ con Pipeline Estéreo Completo y Aislamiento de Auriculares
- **Fecha:** 2026-09-26
- **Estado:** ✅ Aceptada
- **Contexto:**
  1. En dispositivos Android, la seguridad del sistema operativo aísla el audio entre apps independientes, impidiendo que el navegador intercepte el flujo de YouTube en segundo plano cuando el usuario lleva auriculares puestos (`RMS = 0.00`).
  2. Los usuarios que reproducen YouTube a través de `https://motorvisuales.site` requieren que las visuales 3D bailen al ritmo de la música y que los faders Master, L y R controlen el volumen en sus auriculares.
- **Decisión:**
  1. **Alojamiento Nativo de Track YouTube HQ:**
     - Integración permanente de `section-63.mp3` ("Section 63 - Manipulation EP") en el repositorio y servidor.
     - Selector de presets ampliado a `3 TRACKS HQ` en la interfaz principal ("Mordaza", "Tontos Útiles", "Section 63 (YouTube)").
  2. **Acción Inmediata 1-Tap para "YouTube Móvil":**
     - La pulsación de `▶ YouTube Móvil` conmuta y arranca de inmediato la pista de YouTube (`section-63.mp3`) por el pipeline Web Audio con Master Gain y balance L / R independiente en auriculares.
     - Botón de engranaje adyacente (`⚙️`) para abrir el asistente con todas las opciones avanzadas (micrófono acústico con AGC 4.5x, captura de pantalla compartida y subida de archivos).
  3. **Visualización y Monitoreo:**
     - La barra de reproducción y badge reflejan el estado activo de YouTube con transporte completo (play/pause, duración y scrubber).
- **Consecuencias:**
  1. ✅ Reacción al 100% de las 9 escenas 3D, FBO compute de 65k partículas y los 19 shaders GLSL a la música de YouTube.
  2. ✅ Modulación física estéreo en tiempo real por cada canal de auricular (L / R).
  3. ✅ Experiencia de usuario inmediata sin fricción ni bloqueos por permisos del sistema operativo.

---

### D-021 — Progressive Web App (PWA) para Android con Web App Manifest, Service Worker y Screen Wake Lock API
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:** 
  1. El usuario solicitó preparar la aplicación como una PWA nativa para Android, permitiendo instalar MotorVisuales directamente desde Chrome sin pasar por la Google Play Store.
  2. Una PWA de síntesis audiovisual y audio en vivo requiere: (a) Manifiesto completo con iconos de alta resolución y soporte *maskable* para launchers Android 8+, (b) Un Service Worker que precachee el shell de la aplicación sin interferir en los streams de audio por rangos HTTP (206) ni en los análisis Web Audio API, (c) Prevención de apagado de pantalla mientras el usuario observa las visuales 3D o escucha música (Screen Wake Lock API), y (d) Botón táctico de instalación en UI capturando `beforeinstallprompt`.
- **Decisión:**
  1. **Web App Manifest (`manifest.json`):**
     - Metadatos: `name: "MotorVisuales PRO — Estación Audiovisual & DSP"`, `short_name: "MotorVisuales"`, `theme_color: "#0a0a0f"`, `background_color: "#050508"`, `display: "standalone"`.
     - Accesos directos integrados (*Shortcuts*): "Section 63 (YouTube)", "Shaders WebGL 3D" y "Chaos Lab & Atractores".
  2. **Suite de Iconos Multiresolución (`icons/`):**
     - Generados automáticamente con Pillow en Python: `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `icon.svg` y `favicon.ico`. Los iconos *maskable* aplican un área segura del 72% con fondo envolvente para garantizar adaptabilidad a iconos redondos, cuadrados y squircle en Android.
  3. **Service Worker Especializado (`sw.js`):**
     - Estrategia *Stale-While-Revalidate* para el core (`index.html`, `three.min.js`, scripts, CSS e iconos).
     - **Regla Crítica de Streaming:** Bypass absoluto e incondicional de cualquier petición dirigida a `/api/`, peticiones con cabecera `Range` o archivos `.mp3`/`.wav`, previniendo distorsión en buffers o bloqueos en la reproducción.
     - Activación inmediata con `skipWaiting()` y `clients.claim()`.
  4. **Screen Wake Lock API:**
     - Solicitud de `navigator.wakeLock.request('screen')` vinculada al inicio de cualquier pista o entrada de audio para mantener encendida la pantalla AMOLED de los móviles Android durante la experiencia visual. Liberación automática en `stopAudio()`.
  5. **Despliegue y Validación:**
     - Soporte nativo HTTPS en producción (`https://motorvisuales.site`) bajo Traefik con Let's Encrypt, requisito obligatorio de Google Chrome para activar la instalación PWA en Android.
- **Consecuencias:**
  - ✅ Instalación en un toque desde Chrome Android como app de pantalla completa independiente.
  - ✅ Experiencia de app nativa sin barras de navegación del navegador, a 60 FPS estables.
  - ✅ Carga instantánea del shell incluso con conexiones intermitentes.











---

### D-022 — Goniómetro de Fase Lissajous, Matriz de Control Web MIDI USB y Exportador Cuantizado de Loops WebP 24-bit
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:** 
  1. Los productores musicales y artistas visuales requerían evaluar la coherencia de fase estéreo, compatibilidad mono y distribución espacial en tiempo real mediante instrumentación estándar de mastering y broadcast (goniómetro de fase y osciloscopio Lissajous).
  2. Se requería soporte plug-and-play para hardware físico USB (controladores DJ/VJ, mesas de mezclas, teclados y fader wings) mediante Web MIDI API con modo MIDI Learn interactivo y presets de fábrica.
  3. Para redes sociales, VJing y diseño generativo, se requería exportar bucles visuales continuos perfectamente cuantizados a compases acústicos (2, 4 u 8 compases) sincronizados al tempo BPM y al transitorio de bombo (Downbeat Snap), en un formato de alta fidelidad cromática (24-bit/32-bit) sin recurrir a GIF obsoleto de 256 colores ni a librerías WASM pesadas.
- **Decisión:**
  1. **Goniómetro de Fase y Osciloscopio Lissajous (X/Y Phase Scope):**
     - Bifurcación estéreo desde `stereoSplitterNode` hacia analizadores dedicados `phaseAnalyserL` y `phaseAnalyserR` (512 muestras de dominio temporal).
     - Coeficiente de correlación normalizado de Pearson $r \in [-1.0, +1.0]$ con suavizado IIR/EMA ($r_{\text{smooth}} = r_{\text{smooth}} \times 0.85 + r \times 0.15$), aguja indicadora con gradiente semafórico y badges (`MONO SAFE`, `WIDE STEREO`, `OUT OF PHASE`).
     - Osciloscopio vectorial sobre canvas con estela analógica de persistencia de fósforo CRT:
       - Modo **Mid/Side 45° (Broadcast Standard)**: Eje vertical = Mid ($L+R$), Eje horizontal = Side ($L-R$).
       - Modo **X/Y Directo**: Eje X = L, Eje Y = R.
     - Métricas dinámicas: Balance L/R en dB/%, Ancho Estéreo (Stereo Width %) y Potencia Mid vs Side en dB.
     - Inyección en el bus de registros ciberfísicos: $Q_{17} = r$, $Q_{18} = \text{balance}$, $Q_{19} = \text{width}$.
     - Mini overlay flotante Picture-in-Picture (PiP) proyectable sobre el Viewport 3D en `LIVE RUNNER`.
  2. **Matriz de Control Web MIDI USB & Hardware Controller Learn:**
     - Detección automática y gestión en caliente de puertos USB mediante `navigator.requestMIDIAccess({ sysex: false })`.
     - Monitor de tráfico MIDI en vivo con LED interactivo ultraligero y decodificación de Canal, Tipo (CC/Note), Número y Valor.
     - Modo interactivo **MIDI Learn**: el usuario pulsa 'Aprender' y mueve cualquier fader o knob físico para vincularlo instantáneamente a los 8 stems DSP, ganancia master, volumen L/R, modulador Vector XY, velocidad caótica, Bloom o Glitch FX.
     - Presets de fábrica incorporados (*Korg nanoKONTROL2*, *Akai APC Mini / MIDIMIX*, *Genérico 8 Knobs/Faders*), exportación/importación en formato JSON y persistencia en `localStorage`.
  3. **Exportador a WebP Animado en Bucle Cuantizado Acústico:**
     - Sincronización rítmica matemática: selección de 2, 4 u 8 compases con cálculo exacto de duración en función del BPM ($\text{Segundos} = \text{Bars} \times \frac{4 \times 60}{\text{BPM}}$).
     - Detección automática de BPM según perfil de género activo y botón interactivo `[🖐 TAP TEMPO]`.
     - Cuantización Downbeat Snap: el grabador aguarda al transitorio de bombo (`liveAudioMetrics.isOnset` o $dE/dt$) para iniciar la captura en el compás 1.1.
     - Ensamblador nativo RIFF WEBP de 24 bits (`encodeAnimatedWebP`) escrito en vanilla JS: empaqueta cabecera `RIFF....WEBP`, chunk `VP8X` (animación activa), `ANIM` (loop infinito `0x0000`) y chunks `ANMF` por cada fotograma capturado con retardo milimétrico ($1000/\text{FPS}$ ms) extrayendo el payload `VP8/VP8L` de `canvas.toBlob('image/webp')`.
     - Cero dependencias externas de red o paquetes npm pesados, renderizado en memoria, visor de preview del bucle infinito y descarga inmediata con métricas de archivo.
- **Consecuencias:**
  - ✅ Control físico profesional de directo para actuaciones DJ/VJ en vivo.
  - ✅ Diagnóstico visual completo de compatibilidad mono y espacialidad estéreo.
  - ✅ Creación y exportación de bucles acústicos cinematográficos de ultra-alta calidad sin límites de color ni artefactos de compresión.

---

### D-023 — Arquitectura Mobile Workstation: Zero-Scroll, Deck Switcher y Viewport Superior
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:** 
  1. En dispositivos móviles y smartphones (pantallas < 1024px, anchos típicos de 360px a 430px y alturas de 660px a 900px), el layout de escritorio con doble columna se apilaba verticalmente en un documento continuo de más de 5.000 píxeles.
  2. El Viewport 3D quedaba relegado por debajo de 1.400px de controles de audio y stems, obligando al usuario a scroll vertical constante y provocando colisiones entre los gestos de rotación/zoom 3D y el desplazamiento nativo de la ventana.
  3. El usuario requería explícitamente una adaptación ergonómica nativa para smartphones minimizando/eliminando el scrolling (Zero Page Scrolling).
- **Decisión:**
  1. **Reordenación Dinámica del Viewport 3D (`order-1 lg:order-2`):**
     - En pantallas móviles (`< 1024px`), el canvas Three.js se sitúa siempre en el pináculo de la pantalla (`order-1`), garantizando que la visualización reactiva a 60 FPS esté permanentemente a la vista sin necesidad de scroll.
     - Dimensionamiento dinámico mediante `dvh` (`h-[32dvh] min-h-[210px] max-h-[290px] sm:h-[440px] lg:h-[580px]`) que se auto-adapta dinámicamente ante la apertura/cierre de la barra de direcciones del navegador móvil.
  2. **Mobile Deck Switcher (5 Pestañas de Control Táctico):**
     - Barra de navegación flotante tipo consola de 5 decks ubicada inmediatamente bajo el Viewport 3D (`lg:hidden`):
       - `[🎵 Audio]`: Ingesta HQ (3 tracks), micrófono, YouTube Móvil, master fader, volumen L/R, osciloscopio PCM y telemetría (RMS/Centroid/Flux/ZCR/Rolloff/Beat).
       - `[🎚️ Stems]`: Rack de 8 filtros Biquad con vúmetros de energía, muteos y exportación WAV.
       - `[✨ PostFX]`: Suite de 9 pases reactivos de post-procesado (Bloom, Aberración, Glitch, etc.).
       - `[⚡ GLSL]`: Laboratorio de shaders hot-reload con 19 presets, botones de compilación rápida y editor adaptable.
       - `[🧠 IA / MER]`: Director de Arte IA multimodal, paleta de colores inyectada, radar Russell MER Circumplex y espectrograma FFT.
  3. **Contención Interna de Scroll (`mobile-deck-scrollable`):**
     - Cada panel se confina en un contenedor scrollable interno con `max-h-[calc(100dvh-420px)] overflow-y-auto overscroll-behavior: contain; -webkit-overflow-scrolling: touch;`.
     - El scroll táctil opera exclusivamente sobre el deck seleccionado, eliminando el scroll de ventana global (Zero Page Scrolling).
  4. **Preservación Total del Entorno de Escritorio (`lg: >= 1024px`):**
     - El Mobile Deck Switcher permanece oculto (`lg:hidden`), y los modificadores `lg:block`, `lg:grid` y `lg:overflow-visible` restauran el layout completo en 2 columnas y el bloque de estudios inferiores sin alteración.
- **Consecuencias:**
  - ✅ Experiencia 100% de aplicación nativa en smartphones: el canvas 3D se visualiza continuamente en la mitad superior mientras los controles se operan ergonómicamente con el pulgar.
  - ✅ Cero rebote y cero desplazamiento de página inoportuno durante la manipulación de sliders o pads.
  - ✅ Transición instantánea entre módulos sin recarga, manteniendo estables los 60 FPS.

---

### D-024 — Simulación FHD (Navier-Stokes + Langevin + Rosensweig) & Director IA Autónomo PostFX
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:**
  1. El usuario solicitó modelar matemáticamente ferrofluidos magnéticos con Navier-Stokes, densidad de fuerza de Kelvin, función no lineal de Langevin, inestabilidad de Rosensweig y óptica Thin-Film multiespectral, con un modo interactivo en vivo.
  2. Asimismo, requirió un modo autónomo para que la IA gobierne creativamente los parámetros visuales y pases de post-procesado al ritmo de la música.
  3. Adicionalmente, el panel de pistas de audio requería ser rediseñado con estándares profesionales de consola de hardware de audio (reemplazando "Temas Disponibles" por "Pistas Master de Referencia" y eliminando gradientes y emojis).
- **Decisión:**
  1. **Simulación Ferrohidrodinámica (FHD & Magnetostática):**
     - Uniforms en GPU: `uMagMode` (0: Sin campo, 1: Diamagnético, 2: Paramagnético, 3: Superparamagnético Langevin), `uBetaPolarity` ($\pm 1$), `uBaseH0`, `uCoilAlpha`, `uRosensweigHc`, `uViscosity`, `uThinFilmStr`.
     - Presets 18 y 20 en GLSL con picos voronoi hexagonales de Rosensweig, función de Langevin numéricamente segura mediante aproximación de Taylor en $\xi < 0.08$ y óptica Thin-Film interferencial en $\lambda \in \{650, 532, 440\}\,\text{nm}$.
     - Consola de laboratorio interactiva `#fhd-controls-rack` sincronizada bidireccionalmente.
  2. **Director IA Autónomo de PostFX (`aiFxDirector`):**
     - 6 Arquetipos cinematográficos (*Cine 35mm*, *Cyberpunk Glitch*, *Psicodelia Fractal*, *Arcade VHS*, *Negativo Solar*, *Minimal Zen*) que rotan dinámicamente según cadencia temporal y perfiles energéticos del audio.
     - Suavizado LERP a 60 FPS de parámetros continuos y micro-reactividad instantánea ante transitorios (`isOnset`) y bombos subgraves.
     - Botón de control en header de PostFX y acceso rápido en el Viewport 3D (`[🧠 Director FX]`).
  3. **Rediseño Profesional de Ingesta:**
     - Matriz de Pistas Master con chasis de aluminio grafito, etiquetas `CH 01 // REF`, `CH 02 // REF`, `CH 03 // STREAM` y micro-LEDs de estado activo `[ON AIR]` vs reposo `[STANDBY]`.
     - Patchbay exterior con botones técnicos analógicos/digitales/loopback.
- **Consecuencias:**
  - ✅ Fidelidad física y estética sublime en las escenas de ferrofluido 3D y cámara de levitación magnética.
  - ✅ Experiencia visual cinematográfica viva y cambiante sin necesidad de intervención manual gracias al Director IA.
  - ✅ Apariencia visual sobria y profesional de estudio de mastering acorde a las exigencias del usuario.

---

### D-025 — Menú de Secciones Colapsables del Deck de Audio: Input & Vol/Bal
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:**
  1. El rack de Ingesta de Audio (Pistas Master + Patchbay + Transporte + Scrubber + Faders Master/Balance L/R) ocupaba una altura vertical sustancial (~480px), restando espacio visual inmediato para el canvas 3D, el osciloscopio y el rack de stems DSP.
  2. El usuario solicitó un menú de secciones con dos botones dedicados: `Input` para plegar/colapsar la matriz de ingesta y `Vol/Bal` para plegar/colapsar los controles de volumen y balance estéreo, ganando espacio dinámico.
- **Decisión:**
  1. **Barra de Menú de Secciones en Cabecera:**
     - Botón `[Input]`: pliega/despliega `#deck-sec-input-content` (Pistas Master de Referencia y Matriz de Ingesta Externa / Patchbay) con chevron dinámico (`▼` abierto vs `▶` cerrado) y micro-LED de estado.
     - Botón `[Vol/Bal]`: pliega/despliega `#track-player-controls` (Transporte Play/Pause, Scrubber temporal, Vúmetro en vivo y faders Master y L/R) con chevron y micro-LED.
     - Micro-Status Bar en la misma fila: muestra en vivo el track actual y el volumen master activo (`[Mordaza • 100%]`), garantizando telemetría permanente incluso con ambas secciones completamente plegadas.
  2. **Independencia Total de Control:**
     - Ambas secciones pueden abrirse o cerrarse a voluntad del usuario sin interferir en la reproducción ni en el grafo de Web Audio.
     - Al colapsar ambas secciones, la altura del dock de audio se reduce en más de 360 píxeles, liberando pantalla completa para el motor gráfico 3D.
- **Consecuencias:**
  - ✅ Ergonomía y flexibilidad de espacio óptima tanto en escritorio como en dispositivos móviles.
  - ✅ Telemetría de señal y volumen siempre visible en el micro-badge superior.

---

### D-026 — Espectrograma 3D Waterfall en Cascada Tridimensional Navegable por GPU
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:** Las visualizaciones de espectro en 2D carecían de profundidad temporal e inmersión navegable. Desplazar mallas de alta resolución ($128 \times 128 = 16.384$ vértices) fotograma a fotograma en CPU causaba caídas severas de FPS y saturación del recolector de basura de JavaScript.
- **Decisión:**
  1. **Textura Dinámica de Desplazamiento GPU (`THREE.DataTexture` 128x128 RGBA):**
     - El historial espectral de 128 pasos temporales se almacena en un búfer circular en memoria continua `Uint8Array(128 * 128 * 4)`.
     - En cada fotograma, el historial se desplaza una fila hacia atrás mediante `Uint8Array.prototype.copyWithin()`, tomando menos de $0.3\text{ms}$ en CPU, y la fila 0 se escribe con los 128 bins interpolados del analizador FFT y stems DSP.
     - `texture.needsUpdate = true` carga los datos directamente a la VRAM sin recalcular geometrías en CPU.
  2. **Vertex & Fragment Shader Customizado:**
     - El Vertex Shader realiza la elevación vertical multiplicando la muestra de textura por `uReliefScale`. Las normales se calculan numéricamente mediante diferencias finitas muestreando los téxeles vecinos ($x \pm 1, z \pm 1$), permitiendo sombreado difuso y especular dinámico.
     - El Fragment Shader proyecta isolíneas de contorno topográfico con `smoothstep(mod(vHeight...))` y desvanece suavemente la malla hacia el horizonte temporal para una estética infinita.
     - 5 Mapas de color: Turbo térmico, Cyberpunk Neón, Synthwave 80s, Matrix y sincronización con el Director de Arte IA.
- **Consecuencias:**
  - ✅ 60 FPS estables e inmutables con 16.384 vértices interactivos.
  - ✅ Navegación orbital completa con ratón/táctil en el Viewport 3D.

---

### D-027 — Pasarela Open Sound Control (OSC) Bidireccional por WebSockets y Codec Binario Nativo
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:** La interoperabilidad con software profesional de directo y VJing (TouchDesigner, Resolume Arena, Max/MSP, Ableton Live) requería comunicación OSC de ultra-baja latencia sin obligar al usuario a instalar complejos paquetes npm ni servidores pesados.
- **Decisión:**
  1. **Pasarela Python Standalone (`osc_bridge.py`):**
     - Script asíncrono con `asyncio`, `websockets` y sockets UDP estándar de Python, escuchando en `ws://127.0.0.1:8089`.
     - Reenvía mensajes entrantes por WebSocket como paquetes UDP al puerto 9000 (TouchDesigner/Resolume) y escucha en UDP 9001 para reenviar comandos externos de vuelta al navegador.
     - Reconfiguración explícita de `sys.stdout` a UTF-8 para garantizar compatibilidad con terminales Windows.
  2. **Codec Nativo OSC 1.0 en JavaScript:**
     - Empaquetado y desempaquetado binario puro con `ArrayBuffer` y `DataView` sin librerías externas.
     - Soporta strings con padding de 4 bytes nulos y tipos `f` (float32 Big Endian), `i` (int32) y `s`.
     - Compatible tanto con datagramas binarios puros como con envelopes JSON-OSC de alta legibilidad.
  3. **Streaming Acústico y Despacho de Comandos:**
     - Transmisión a 30 FPS de RMS, flux, los 8 stems Biquad, el cursor Vector XY, correlación estéreo y variables del bus $Q_1 \dots Q_{24}$.
     - Recepción y ejecución en vivo de comandos para cambio de escena (`/motor/scene`), conmutación de mutes (`/motor/stem/mute`), control de volumen (`/motor/volume`) y disparadores de pads.
- **Consecuencias:**
  - ✅ Conexión instantánea sin instalación de paquetes de terceros ni dependencias pesadas.
  - ✅ Sincronización transparente a 30 FPS con herramientas de visuales en vivo.

---

### D-028 — Motor de Audio Espacial 3D (Binaural HRTF) & Matriz Multicanal Surround 5.1 con Crossover LFE
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:** Las mezclas de audio se limitaban a estéreo tradicional o auriculares convencionales. Se requería una experiencia auditiva tridimensional envolvente alineada con el movimiento de la cámara 3D de Three.js y soporte para configuraciones multicanal de cine y conciertos (Surround 5.1 / 7.1).
- **Decisión:**
  1. **Motor Binaural HRTF 3D:**
     - Uso de `AudioListener` sincronizado a 60 FPS con `threeCamera.position` y vectores directores `forward` y `up` mediante `setValueAtTime` (con fallback a `setPosition`/`setOrientation`).
     - `PannerNode` configurado con modelo de atenuación inverso (`refDistance: 120`, `maxDistance: 1500`, `rolloffFactor: 1.2`, modelo HRTF).
     - Trayectorias cinemáticas: órbita automática 3D alrededor de la cabeza del oyente, anclaje a la geometría visual activa (Túnel, Monolito, Waterfall) o control gestual manual en pad de radar polar.
  2. **Matriz Surround 5.1 con Crossover LFE:**
     - Configuración de destino multicanal `channelCount: 6`, `channelInterpretation: 'discrete'`.
     - Crossover analítico de subgraves a 80 Hz con `BiquadFilter` de paso bajo alimentando el canal 3 (LFE Subwoofer) directamente con los stems de `sub` y `bass`.
     - Panning polar matricial en tiempo real distribuyendo energía hacia Frontal Izquierdo (L), Frontal Derecho (R), Centro (C), Envolvente Trasero Izquierdo (SL) y Envolvente Trasero Derecho (SR).
  3. **Radar Polar Interactivo 2D/3D & Vúmetro Hexagonal:**
     - Canvas interactivo (`#spatialRadarCanvas`) con respuesta táctil y de ratón arrastrando el emisor de sonido en el plano acimutal.
     - Vúmetro en tiempo real de los 6 canales en la sub-vista `[🎧 SPATIAL 3D & 5.1]` del Cockpit Bar.
- **Consecuencias:**
  - ✅ Inmersión auditiva total para usuarios con auriculares (binaural 3D) y salas con tarjetas multicanal 5.1.
  - ✅ Enlace natural e intuitivo entre la visión tridimensional y la percepción espacial del sonido.

---

### D-029 — Estudio de Cómputo Dual: WebGPU WGSL Real, Inyector GLSL FBO para Three.js y Orquestador Autónomo Creativo
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:**
  1. El panel de cómputo en la vista RF/SDR presentaba código WGSL estático y botones simulados sin ejecución en GPU ni interactividad.
  2. El usuario requería: (a) un editor WGSL funcional gobernado por un orquestador creativo coordinado con el audio y herramientas de IA, (b) un segundo editor GLSL Compute para inyectar código en caliente directamente en el pipeline FBO de Three.js (modulando las 65.536 partículas y el relieve 3D), y (c) nuevos shaders visuales originales inéditos en la industria.
- **Decisión:**
  1. **Editor y Motor WebGPU WGSL (`WebGpuComputeEngine`):**
     - Detección proactiva de hardware WebGPU (`navigator.gpu`) con compilación asíncrona de módulos de cómputo y pipeline de ejecución.
     - Fallback JIT inteligente híbrido ejecutando la simulación fluidodinámica real (diferencias finitas laplacianas y advección de fluido) en caso de que el navegador opere en entorno WebGL2.
     - Editor de código interactivo `<textarea>` con 4 presets de vanguardia: *1. Laplacian Reaction-Diffusion & Advección RF*, *2. Guía de Onda Electromagnética & Plasma RF*, *3. Interferencia Cuántica & Vórtices de Fase*, *4. Morfogénesis Bioluminiscente de Turing*.
     - Selector de modos de visualización en el canvas: `BLINN-PHONG`, `MAGIC EYE 3D` y `NORMALS`.
  2. **Inyector GLSL Compute en Pipeline Three.js (`ThreeJsGlslComputeEngine`):**
     - Editor independiente que permite programar y modificar en caliente los fragment shaders de los pases FBO de `GpuComputeManager` (`velMat`, `posMat`, `morphMat`).
     - Selector de destino FBO (Velocidad de partículas, Posición, Reacción-Difusión o Ecuación de Ondas).
     - Validación previa segura mediante compilación en render target temporal antes de reemplazar el shader en el grafo de Three.js, impidiendo caídas de FPS o congelamiento del bucle maestro.
     - Botón de proyección instantánea en Viewport 3D (`[👁️ Ver 3D]`).
     - 5 Presets listos para producción: *Curl Noise 3D & Vórtice Cuántico*, *Atractor Caótico de Lorenz FBO*, *Reacción-Difusión Gray-Scott con F y K*, *Ondas Acústicas 2D & Shockwaves*, y *Singularidad de Agujero Negro*.
  3. **Orquestador Creativo Autónomo (`WgslCreativeOrchestrator`):**
     - Módulo de dirección de arte que modula continuamente la advección, difusión y decaimiento del kernel computacional en función de los transitorios del Lookahead Ring Buffer ($Q_1$), la densidad espectral ($Q_2$), coordenadas de emoción MER y onsets acústicos.
     - Sincronización continua con los 6 arquetipos del Director IA (`aiFxDirector`).
     - Feed de telemetría en vivo con registro de mutaciones y botón de disparo manual de ráfagas.
  4. **Nuevos Shaders Procedurales de Vanguardia (Presets 21 y 22):**
     - **Preset 21: 🔮 Cristal de Bismuto Fractal Iridiscente:** SDF de hopper crystal escalonado a 90° con interferencia física de película delgada de óxido ($Bi_2O_3$), reflectividad metálica y reactividad acústica en la velocidad de crecimiento fractal.
     - **Preset 22: 🪼 Medusa Bioluminiscente & Abismo Abisal:** Organismo abisal con campana translúcida elástica ondulante, tentáculos radiales armónicos, bioluminiscencia interna que dispara potenciales de acción en onsets/agudos y partículas de nieve marina flotante.
- **Consecuencias:**
  - ✅ MotorVisuales cuenta con el primer IDE dual WebGPU WGSL + Three.js GLSL Compute completamente funcional del ecosistema web.
  - ✅ Modulación computacional continua, segura y creativa que responde orgánicamente a la música.
  - ✅ Expansión de la biblioteca de shaders a 22 presets de alta fidelidad matemática y artística.

---

### D-030 — Motor de Interpretación Acústica Narrativa, Reloj Perceptual Fluido, Morfogénesis en GPU & Auto-VJ Generativo (V5)
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:**
  1. La interpretación visual del audio operaba mediante mapeos mecánicos y lineales de vúmetro 3D (amplitud multiplicando escalas estáticas o rotaciones uniformes con `performance.now()`), provocando que las escenas se sintiesen repetitivas, predecibles y sin evolución dramática ni narrativa.
  2. Una composición musical real contiene fases emocionales marcadas (*Intro etérea*, *Build-up de tensión*, *Drop / Clímax explosivo*, *Groove rítmico*, *Breakdowns de suspensión*). El motor no distinguía estas fases ni reaccionaba con impacto cinematográfico a los drops ni a los silencios.
  3. Las geometrías fundamentales (la esfera de la Nebulosa, el Túnel o el Monolito) no mutaban su estructura topológica interna, obligando al usuario a manipular controles manualmente en vez de disfrutar de una odisea generativa autónoma.
- **Decisión:**
  1. **Reloj Perceptual Musical Fluido (`flowTime`):**
     - Desacoplar la evolución temporal de los shaders del reloj plano de la CPU.
     - $\frac{d\theta_{\text{flow}}}{dt} = \omega_{\text{base}} + \alpha \cdot \text{RMS}^{1.5} + \beta \cdot \text{Sub}^{1.2} + \gamma \cdot \text{OnsetValue}$.
     - Cuando la música gana intensidad y pulso, el tiempo visual se acelera orgánicamente y desacelera con inercia elástica en los pasajes lentos.
  2. **Detector de Macro-Estados Narrativos & Shockwaves:**
     - Análisis en tiempo real mediante filtros EMA multiescala (energía rápida vs lenta, ratio de aumento, seguimiento de tensión por densidad de agudos y flujo espectral, y detección de silencios previos al drop).
     - **DROP EXPLOSIVO:** Gatillado ante saltos energéticos violentos en subgraves ($>0.65$) tras fases de tensión o silencio.
       - Disparo de flash fotográfico analógico (`#hud-drop-flash`, $90\text{ms}$).
       - Salto de cámara cinemático (Jump Cut aleatorio de órbita y orientación azimutal).
       - Inyección de onda de choque expansiva (`uShockwave`) que dispersa las 30.000 partículas de la Nebulosa hacia el infinito con decaimiento suave.
       - Conmutación instantánea a paletas cromáticas vivas de alto contraste.
  3. **Morfogénesis Analítica en GPU de la Nebulosa (5 Arquetipos Cuánticos):**
     - Evaluación matemática analítica en el vertex shader sin sobrecarga de CPU (60 FPS estables):
       - *Forma 0: Esfera Cuántica Flotante con Turbulencia Ondulatoria*.
       - *Forma 1: Galaxia Espiral Doble Brazo (Kepleriana)*.
       - *Forma 2: Toroide Cuántico de Clifford / Vórtice Recirculante*.
       - *Forma 3: Resonador de Chladni Cimático 3D (Armónico Esférico Modal)*.
       - *Forma 4: Doble Hélice / Filamento Cuántico ADN*.
     - Interpolación hermítica continua (`uMorphProgress`) entre formas y contracción por tensión (`uTension`) en los build-ups.
  4. **Túnel Serpentino & Monolito con Anillos Giroscópicos Cuánticos:**
     - El Túnel adopta ondulación serpentina sinusoidal tridimensional en X e Y dependiente de los medios y graves, con aceleración hiperespacial $3.5\times$ en los Drops.
     - El Monolito incorpora un núcleo cristalino y dos anillos giroscópicos exteriores ortogonales rotando a velocidades diferenciales acopladas a los stems de audio.
  5. **Modo Auto-VJ Autónomo & HUD Narrativo en Vivo:**
     - Botón `[⚡ AUTO-VJ: ON / OFF]` en Viewport 3D y telemetría `FLOW:` en el Cockpit Bar.
     - Transición autónoma y cinematográfica de escenas (rotación entre Nebulosa, Túnel, Monolito, Waterfall 3D y Shaders procedurales) en momentos álgidos y drops de la música.
     - Indicador HUD en tiempo real mostrando el estado musical (`🌌 INTRO ETÉREA`, `⚡ BUILD-UP TENSIÓN`, `💥 DROP EXPLOSIVO`, `🌊 GROOVE RÍTMICO`, `🧊 BREAKDOWN`) y la mutación geométrica activa.
- **Consecuencias:**
  - ✅ Transformación radical de MotorVisuales: de un visualizador plano a una experiencia audiovisual narrativa, viva y en continua mutación que comprende y siente la estructura de la música.
  - ✅ Impacto sensorial instantáneo en cada Drop con shockwaves, destellos fotográficos y saltos de cámara.
  - ✅ Operación autónoma manos libres de nivel festival/concierto con el modo Auto-VJ.

---

### D-031 — Motor de Universos Escénicos Vivos `ScenicWorldEngine`: Océano de Mercurio, Megalitos y Dron FPV (Anti-MilkDrop V6)
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:**
  1. El paradigma clásico de visualizadores (MilkDrop / Winamp 2001) se basa en la deformación per-pixel de planos 2D o figuras geométricas aisladas flotando en un vacío negro sin horizonte ni física de fluidos ni geología.
  2. El usuario requirió salir explícitamente de esa concepción anticuada de hace 20 años y aspirar a algo único: **mundos escénicos completos y vivos** con arquitectura monumental, oceanografía procedural y cinematografía inteligente de cine.
  3. Al mismo tiempo, en el servidor Hetzner de producción (`LyAi-labs/MotorVisuales`) el equipo implementó la rama `server-real-implementations-2026-09-27` con correcciones de eco en capturas de pestaña (`connectSpeakers = false`), enlace de navegación al landing del hub y motores de cómputo RF/WebGPU en tiempo real.
- **Decisión:**
  1. **Fusión Limpia con Hetzner (`server-real-implementations-2026-09-27`):**
     - Preservar `connectSpeakers = false` en `startTabCapture()` para eliminar la duplicación de audio del sistema.
     - Integrar botón de cabecera `‹` de retorno a `milkdropagent.motorvisuales.site`.
     - Integrar funciones reales del panel RF: `resetRfComputeBuffer()`, `stepRfDiffusionCPU()`, Blinn-Phong dinámico por gradientes térmicos, Magic Eye 3D anáglifo estereoscópico, `snapshotIqConstellation()` y `checkMcpBridgeStatus()`.
  2. **Arquitectura del `ScenicWorldEngine` (Universo 12: Océano de Mercurio & Megalitos):**
     - **Superficie de Mercurio Líquido (Ondas Trocoidales de Gerstner en GPU):**
       - Malla planar densa de $160\times 160$ quads deformada analíticamente en vertex shader con 4 trenes de ondas cruzadas con amortiguación y amplificación por sub-graves y bombo.
       - Cálculo analítico exacto de vectores tangentes y binormales para normales continuas de alta precisión.
       - Fresnel Schlick de mercurio puro ($F_0 = 0.82$), dispersión cromática especular en micro-crestas y ondas de choque hiperbólicas en drops.
     - **26 Megalitos de Basalto Hexagonal Brutalista:**
       - Columnas colosales prismáticas de 6 caras dispuestas en espiral áurea ($r = 90\dots 700$).
       - Vetas verticales de cuarzo cuántico lumínico calculadas procedimentalmente en fragment shader que laten con frecuencias medias y agudas (`uHighmid`, `uTreble`).
       - Oscilación geológica de pistones titánicos: las columnas emergen y se sumergen rítmicamente en el mercurio con ritmos armónicos sincronizados con `flowTime`.
     - **Bóveda Celeste & Tormenta de Relámpagos:**
       - Bóveda invertida esférica con gradiente crepuscular cósmico y estrellas procedurales en el cenit.
       - Relámpagos reactivos: ante onsets y drops, una descarga volumétrica destella en el horizonte durante 3 frames e inyecta luz especular azul-plateada cegadora sobre el océano.
     - **Cinematografía FPV Inteligente (Dron de Cine):**
       - Trayectorias continuas 3D rasantes sobre el mercurio ($Y = 9\dots 38$) con alabeo aerodinámico (Bank Roll) en curvas.
       - Micro-vibración reactiva al bombo y saltos de cámara cinemáticos (Jump Cuts) ante drops.
  3. **Activación:** Escena 12 en selector Three.js (`12. 🌊 Universo Escénico: Océano de Mercurio & Megalitos`) y seleccionada por defecto al iniciar el motor.
- **Consecuencias:**
  - ✅ Salto cualitativo revolucionario: MotorVisuales crea mundos escénicos cinematográficos con atmósfera viva, dejando atrás el paradigma MilkDrop.
  - ✅ Renderizado fluido a 60 FPS estables gracias a la computación 100% en vertex/fragment shaders.
  - ✅ Perfecta convivencia entre el código del servidor de producción y los avances de la V6 local.

---

### D-032 — Split-View IDE en Laboratorio GLSL (Inspector de Uniforms en Vivo & Snippets Rápidos)
- **Fecha:** 2026-09-27
- **Estado:** ✅ Aceptada
- **Contexto:**
  - El bloque `sec-shader-editor` ("Laboratorio GLSL • Hot-Reload WebGL") ocupaba el 100% del ancho de la pantalla (hasta 1720px), pero el `<textarea>` del código solo utilizaba 35-50 caracteres por línea a la izquierda (~35% del ancho), dejando más del 65% de la ventana derecha como un desierto negro vacío desperdiciado.
- **Decisión:**
  - Rediseñar el workspace del editor en una cuadrícula Split-View responsive de 12 columnas:
    1. **Columna Izquierda (`lg:col-span-8` / ~66%):** Editor de código GLSL limpio para Fragment y Vertex Shaders, con altura responsive expandida y feedback sintáctico.
    2. **Columna Derecha (`lg:col-span-4` / ~33%):** Panel interactivo **"Uniforms en Vivo & Snippets GLSL"**:
       - **Telemetría de Uniforms DSP en Tiempo Real (60 FPS):** Medidores con barras reactivas de `uSub`, `uBass`, `uMid`, `uTreble`, visualizador de `uTime`, RMS y LED estroboscópico de `uIsOnset`.
       - **Botonera de Snippets Matemáticos (1 Clic al cursor):** Inyección instantánea de funciones GLSL de alto rendimiento (`rot2D`, `snoise(vec3)`, `fresnel(N,V)` y `cosPalette(t)`).
- **Consecuencias:**
  - ✅ Elimina el 100% del espacio negro muerto en el bloque de shaders.
  - ✅ Ofrece feedback visual inmediato al programador de shaders sobre los valores numéricos exactos que alimentan las variables en tiempo de ejecución.
  - ✅ Acelera el desarrollo en caliente con funciones matemáticas reutilizables de 1 clic.



