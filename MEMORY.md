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
4. **Motor 3D (Three.js WebGL):** 3 escenas intercambiables
   - Nebulosa 30.000 partículas (reactiva a sub+bass y treble+air)
   - Túnel infinito (reactivo a treble y bass)
   - Monolito (reactivo a bass y mids)
5. **Agente IA "Director de Arte":** Ciclo automático cada 15s, llama a `gemini-2.5-flash` para generar prompts artísticos y paletas de color que mutan la escena 3D en vivo. Fallback heurístico local si falla la API.
6. **Modelo Afectivo MER:** Pad Russell Circumplex (Valencia x Arousal), auto-tracking basado en RMS + Centroide.
7. **Grabador de Video:** MediaRecorder WebM 60FPS con mezcla de audio.

### Nodo de Audio (grafo)
```
Source → masterGainNode → mainAnalyser
                        → audioDestNode (MediaRecorder)
                        → filterStem[0..7] → gainStem → analyserStem
```

### Variables Globales Clave
- `stemsData` — Objeto con los 8 stems (filter, gain, analyser, dataArray, value, muted)
- `stemConfigs` — Array de configuración de los 8 stems
- `liveAudioMetrics` — {rms, spectralCentroid, spectralFlux, zcr, rolloff, isOnset, valence, arousal}
- `particlesMesh`, `tunnelMesh`, `monolithMesh` — Objetos Three.js
- `threeScene`, `threeCamera`, `threeRenderer`
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

- ✅ Soporte para shaders de post-procesado (UnrealBloomPass reactivo y ChromaticAberration ShaderPass con EffectComposer)
- ✅ Presets de mapeo acústico (Importación/Exportación JSON con perfiles de fábrica y descarga/carga de presets personalizados)
- ✅ Cámara orbital cinemática multieje reactiva al audio (modos Círculo, Espiral, Lemniscata ∞ y Fly-by dramático con retroalimentación en HUD y controles interactivos)
- ✅ Editor de shaders GLSL en vivo con Hot-Reload WebGL, consola de errores en pantalla, 4 presets (Plasma, Raymarching SDF, Espectro, Voronoi), exportación/importación y vinculación a los 8 stems DSP
- ✅ Bucle maestro de renderizado (`masterRenderLoop`) unificado a 60 FPS vinculando en tiempo real el análisis DSP (`runAudioDSP`), espectrograma y renderizado Three.js
- ✅ Enrutamiento persistente de Web Audio API con elemento `<audio id="html5-audio-player">` en el DOM estático, eliminando desconexiones y resolviendo la reactividad de `tema.mp3` y archivos de usuario

## Próximas Ideas / Pendientes
- [ ] Renderizado de audio-reactividad a múltiples texturas / mapas de altura WebGL
- [ ] Exportación directa de animaciones WebM con shader personalizado activo
