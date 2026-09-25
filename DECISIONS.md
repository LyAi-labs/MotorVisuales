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


