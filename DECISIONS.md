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








