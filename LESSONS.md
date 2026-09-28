# LESSONS.md — Lecciones del Proyecto MotorVisuales
> Lecciones específicas de este proyecto. Ver también lecciones globales en `~/.gemini/config/LESSONS.md`

---

### L-001
- **Tags:** #threejs #rendering #camera
- **Síntoma:** El Monolito y el Túnel desaparecen cuando la cámara hace zoom hasta entrar dentro de ellos
- **Causa raíz:** Three.js usa `FrontSide` por defecto; al estar dentro del mesh, el interior no se renderiza
- **Solución:** Añadir `side: THREE.DoubleSide` al material de cualquier mesh que deba verse desde dentro
- **Trigger:** Al crear cualquier geometría cerrada o en la que la cámara pueda entrar

---

### L-002
- **Tags:** #browser #events #threejs #zoom
- **Síntoma:** El scroll del ratón sobre el canvas 3D hace scroll en la página en lugar de hacer zoom
- **Causa raíz:** Los event listeners `passive: true` (por defecto) no permiten llamar a `e.preventDefault()`
- **Solución:** Registrar el listener con `{ passive: false }` y llamar a `e.preventDefault()` explícitamente
- **Código correcto:**
  ```js
  canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      threeCamera.position.z += e.deltaY * 0.3;
  }, { passive: false });
  ```
- **Trigger:** Al añadir cualquier evento de rueda/scroll sobre un canvas

---

### L-003
- **Tags:** #webaudio #routing #stems #gain
- **Síntoma:** El control de "Sensibilidad General" sube el volumen de salida pero los stems y el análisis DSP no reaccionan más
- **Causa raíz:** Los stems estaban conectados directamente desde `mainSourceNode`, saltándose el `masterGainNode`
- **Solución:** Conectar `masterGainNode` → filtros de stems (no `source` → filtros)
- **Grafo correcto:**
  ```
  source → masterGainNode → mainAnalyser
                          → audioDestNode
                          → filterStem[0..7]
  ```
- **Trigger:** Al modificar el grafo de nodos de Web Audio API

---

### L-004
- **Tags:** #webaudio #tab-capture #echo
- **Síntoma:** Al capturar audio de una pestaña del navegador se escucha el audio duplicado (eco)
- **Causa raíz:** Chrome ya reproduce el audio de la pestaña capturada por los altavoces nativamente. Si además conectamos `masterGainNode` a `audioCtx.destination`, se duplica.
- **Solución:** Para la fuente Tab Capture, NO conectar a `audioCtx.destination`. Solo conectar al pipeline de análisis.
- **Trigger:** Al implementar cualquier modo de captura de audio del sistema o pestaña

---

### L-005
- **Tags:** #gemini-api #json #parsing
- **Síntoma:** El JSON devuelto por Gemini falla al hacer `JSON.parse()` porque viene envuelto en ```json ... ```
- **Causa raíz:** El modelo por defecto envuelve el JSON en bloques de código markdown
- **Solución:** Usar `responseMimeType: "application/json"` en `generationConfig` para forzar JSON puro
- **Código correcto:**
  ```js
  body: JSON.stringify({
      contents: [...],
      generationConfig: { responseMimeType: "application/json" }
  })
  ```
- **Trigger:** Al pedir a Gemini que devuelva JSON estructurado

---

### L-006
- **Tags:** #webaudio #mediaelementsource #cors #dsp #telemetry
- **Síntoma:** El elemento `<audio>` o `new Audio()` suena por los altavoces pero `AnalyserNode` / stems devuelven ceros (RMS 0.00, espectro plano, gráficos congelados).
- **Causa raíz:** Las políticas de seguridad de origen en navegadores silenciaron la salida hacia Web Audio API (CORS origin-clean) al no declarar `crossOrigin = 'anonymous'`, y en re-reproducción `mediaElementSource` no se reconectaba al pipeline si `stopAudio()` desconectaba nodos.
- **Solución:** Configurar `audioElement.crossOrigin = 'anonymous'`, asegurar que `connectSourceToPipeline(mediaElementSource)` se ejecuta siempre que se prepara la pista y llamar a `audioCtx.resume()` explícitamente tras la promesa de `play()`.
- **Trigger:** Al utilizar `createMediaElementSource` con archivos de audio locales o remotos.

---

### L-007
- **Tags:** #animation #renderloop #dsp #threejs #requestanimationframe
- **Síntoma:** El audio suena al hacer click pero el osciloscopio PCM, telemetría y los 8 stems no reaccionan.
- **Causa raíz:** La función `masterRenderLoop()` era llamada en `DOMContentLoaded` pero no existía en el script, impidiendo que `runAudioDSP()`, `updateRealFrequencyChart()` y `renderThreeFrame()` se ejecutaran a 60 FPS con `requestAnimationFrame`.
- **Solución:** Declarar `masterRenderLoop(timestamp)` con `requestAnimationFrame(masterRenderLoop)` invocando secuencialmente el análisis DSP (`runAudioDSP`), actualización de espectrograma y renderizado Three.js.
- **Trigger:** Al depurar congelamiento de métricas y visualizadores en tiempo real.

---

### L-008
- **Tags:** #webgl #gpgpu #computeshaders #fbo #pingpong #datatexture
- **Síntoma:** Al implementar simulaciones GPGPU (Ping-Pong FBO), la pantalla parpadea en negro o los valores de posición colapsan a NaN / 0.
- **Causa raíz:** Inicialización directa de render targets sin datos válidos, o intentar escribir y leer del mismo render target en el mismo fotograma (feedback loop no permitido en WebGL), o falta de soporte para FloatType en navegadores que requieren OES_texture_float.
- **Solución:**
  1. Utilizar siempre doble búfer (Ping-Pong: `targetA` y `targetB`) alternando índices `currentIdx = 1 - currentIdx`.
  2. Detectar soporte de precisión: `renderer.capabilities.isWebGL2 || renderer.extensions.get('OES_texture_float') ? THREE.FloatType : THREE.HalfFloatType`.
  3. Sembrar datos iniciales mediante un pase de renderizado con textura `DataTexture` + quad ortográfico, asegurando estado flotante normalizado previo a la primera iteración.
  4. Enviar `audioDataTexture` como `THREE.UnsignedByteType` con `THREE.LinearFilter` para interpolación continua del espectro acústico en fragment shaders.
- **Trigger:** Al desarrollar shaders compute o simulaciones masivas de partículas/fluidos sobre WebGL.

---

### L-009
- **Tags:** #gemini-api #models #endpoints #v1beta
- **Síntoma:** Error HTTP 404 al invocar `gemini-2.5-flash` ("This model is no longer available to new users").
- **Causa raíz:** En la API v1beta de Google Generative AI, los modelos Flash recomendados y activos para cuentas recientes son `gemini-3.5-flash` y `gemini-3.8-flash`.
- **Solución:** Utilizar `models/gemini-3.5-flash` o `models/gemini-flash-latest` en las URLs de endpoints REST para garantizar compatibilidad continua.
- **Trigger:** Al actualizar o configurar endpoints de Gemini API para el Director de Arte.

---

### L-010
- **Tags:** #threejs #screenshots #super-sampling #offscreen #rendertarget
- **Síntoma:** Al redimensionar el renderer para capturas fijas en 4K/8K, el layout de la página se deforma, el canvas desborda el viewport o la imagen final aparece estirada o recortada.
- **Causa raíz:** Llamar a `renderer.setSize(w, h)` sin el tercer parámetro (`updateStyle = false`) inyecta estilos CSS inline (`width: 3840px; height: 2160px`) en el elemento `<canvas>`.
- **Solución:** Pasar `threeRenderer.setSize(renderW, renderH, false)`, actualizar la matriz de proyección con el nuevo aspect ratio (`threeCamera.aspect = renderW / renderH; threeCamera.updateProjectionMatrix();`), sincronizar `threeComposer.setSize(renderW, renderH)`, extraer el blob PNG con `canvas.toBlob()`, y restaurar inmediatamente el DPR y dimensiones previas con `triggerThreeResize()`.
- **Trigger:** Al implementar capturas de alta resolución o exportación de fotogramas en Three.js.

---

### L-011
- **Tags:** #webaudio #offlineaudiocontext #stems #wav #pcm
- **Síntoma:** La exportación de audio en tiempo real requiere esperar la duración completa de la canción y se ve afectada por fluctuaciones de CPU del navegador.
- **Causa raíz:** Usar nodos en tiempo real (`MediaRecorder` o `AudioDestinationNode`) para exportación de audio puro.
- **Solución:** Emplear `OfflineAudioContext(channels, length, sampleRate)` con `BufferSourceNode` y los mismos filtros Biquad, ejecutando `startRendering()`. Esto procesa el audio a máxima velocidad de hardware en segundos sin latencia, y construir el contenedor RIFF WAVE directamente en memoria (`DataView`) con cabecera estándar de 44 bytes para 16-bit PCM o 32-bit Float.
- **Trigger:** Al implementar exportación de pistas o stems en Web Audio API.

---

### L-012
- **Tags:** #gemini-api #flash-lite #fallback #telemetry #audit
- **Síntoma:** El visualizador muestra un prompt estático repetitivo pero el selector indica "Google Gemini API (Cloud LLM)", haciendo dudar al usuario de si realmente se está usando el LLM o un generador local.
- **Causa raíz:** 
  1. El endpoint `gemini-3.5-flash` sufre picos temporales de error HTTP 503 ("This model is currently experiencing high demand").
  2. En el bloque `catch`, el error de la API llamaba inmediatamente a `generateHeuristicPrompt()`, el cual sobreescribía el texto del error en microsegundos con una plantilla hardcodeada fija (`aiThemes.energetic`), ocultando el fallo de conexión.
  3. No existía un indicador visual permanente que auditara la fuente del prompt (Cloud vs Local) ni la latencia.
- **Solución:**
  1. Configurar `models/gemini-3.5-flash-lite` como modelo primario (responde en ~300ms con alta disponibilidad), con lista de fallback a `gemini-3.5-flash` y `gemini-flash-latest`.
  2. Incorporar badges de estado en vivo en la UI: `🟢 LLM EN VIVO (gemini-3.5-flash-lite) • ⚡ Latencia • Tokens` vs `🟡 MOTOR HEURÍSTICO LOCAL` vs `🔴 FALLBACK (Error API)`.
  3. Añadir botón interactivo "⚡ Probar Conexión LLM" que ejecuta un ping de verificación en caliente y expone el estado de la API al usuario.
- **Trigger:** Al depurar llamadas a Gemini API y fallbacks de prompts generativos.

---

### L-013
- **Tags:** #threejs #pointlight #color-lerp #ai-palette #shaders
- **Síntoma:** Al actualizar la directiva de arte IA, los colores cambiaban de forma brusca e instantánea, y la luz puntual `pointLight` no reflejaba el color de la IA, manteniéndose en un espectro fijo azul-verde-rojo.
- **Causa raíz:**
  1. En el render loop a 60 FPS (`renderThreeFrame`), `pLight.color.setHSL((0.66 + sPresence * 0.4) % 1.0, 1.0, 0.6)` se ejecutaba cada 16.6ms, destruyendo y sobreescribiendo inmediatamente cualquier color asignado por `applyAiDirectionToThree`.
  2. La mutación directa de `material.color.copy()` en el callback de la IA genera un salto cromático abrupto (corte óptico duro).
- **Solución:**
  1. Desacoplar el estado cromático en dos objetos: `aiColorsCurrent` y `aiColorsTarget` (`prim`, `accent`, `fog`).
  2. Interpolar suavemente en cada frame mediante `aiColorsCurrent.lerp(aiColorsTarget, 0.05)` a 60 FPS.
  3. Fijar `pLight.color.copy(aiColorsCurrent.prim)` preservando el matiz de la IA y modular dinámicamente su intensidad y transitorios con `(2.0 + sPresence * 3.5) * (liveAudioMetrics.isOnset ? 1.5 : 1.0)`.
  4. Pasar la paleta interpolada a todas las escenas (Nebulosa, Túnel, Monolito, Raymarching Procedural y FBO GPGPU 65k).
- **Trigger:** Al vincular paletas cromáticas externas o generativas con el grafo de escena Three.js y shaders WebGL.

---

### L-014
- **Tags:** #threejs #offscreen-canvas #canvas-texture #performance #fft-halftone
- **Síntoma:** Al renderizar gráficos vectoriales y tipografía procedimental en un canvas 2D para proyectarlo en Three.js con `CanvasTexture`, redibujar todo el canvas en cada fotograma a 60 FPS colapsa la CPU del navegador.
- **Causa raíz:** Las operaciones de texto (`ctx.fillText`, `ctx.strokeRect`, `measureText`) sobre un canvas de 1024x1024 px son costosas y saturan el hilo principal del DOM.
- **Solución:**
  1. Dibujar la estructura estática (fondos, cabeceras, columnas de texto y marcos) una sola vez al concebir el mundo (`renderCanvas()`).
  2. Almacenar el bounding box del marco fotográfico dinámico (`this.photoRect`).
  3. En cada fotograma del render loop, redibujar únicamente la sub-región del marco fotográfico (`updateLivePhotoFrame()`) con las barras FFT / trama de semitonos y activar `canvasTexture.needsUpdate = true`.
- **Trigger:** Al proyectar canvas 2D dinámicos o interfaces gráficas sobre texturas de Three.js.

---

### L-015
- **Tags:** #threejs #glsl #raymarching #cymatics #thin-film #uniforms #webgl
- **Síntoma:** Errores de compilación WebGL (`undeclared identifier: uPresence`) en shaders procedurales complejos, o caídas severas de FPS al intentar representar superficies acústicas continuas (Cimática / Chladni) mediante geometrías poligonales tradicionales.
- **Causa raíz:**
  1. Las superficies nodales tridimensionales continuas generan millones de polígonos que colapsan la memoria si se triangulan en CPU.
  2. Omitir la declaración explícita de uno o más stems Biquad DSP en los uniforms GLSL interrumpe el pipeline de renderizado y dispara errores WebGL en consola.
- **Solución:**
  1. Emplear raymarching volumétrico sobre un quad de pantalla completa evaluando la distancia estimada implícita analítica $d = \frac{|F|}{\|\nabla F\|} - \text{thickness}$ y aproximando el vector normal mediante gradientes numéricos $\nabla F$ en GPU.
  2. Declarar sistemáticamente los 8 stems Biquad como bloque uniforme completo (`uSub`, `uBass`, `uLowmid`, `uMid`, `uHighmid`, `uPresence`, `uTreble`, `uAir`) en todos los shaders de la suite.
  3. Para efectos de iridiscencia nacarada física sobre ferrofluidos, calcular analíticamente la interferencia óptica de ondas multiespectral ($\lambda = 650, 532, 440\,\text{nm}$) en vez de mapear gradientes de color estáticos, obteniendo variación angular natural dependiente del punto de vista.
- **Trigger:** Al desarrollar shaders matemáticos avanzados, raymarching analítico o simulaciones de óptica ondulatoria en GLSL.

---

### L-016
- **Tags:** #mobile #touch #pinch-to-zoom #responsive #webaudio #android
- **Síntoma:** En navegadores móviles (Chrome Android / Safari iOS), el usuario no puede hacer zoom en la app, la navegación superior ocupa ~200px empujando el canvas 3D y controles fuera de pantalla, la escena 3D no responde a gestos táctiles ni pellizco, y el audio puede quedar silenciado.
- **Causa raíz:**
  1. Meta viewport sin `user-scalable=yes` ni rango permitido de escala.
  2. `threeCanvas` solo escuchaba eventos de ratón (`mousedown`, `mousemove`, `wheel`), sin listeners `touchstart`/`touchmove` para rotación 3D ni cálculo de distancia euclidiana para pinch-to-zoom.
  3. La barra de navegación V4.2 envolvía múltiples filas verticales en anchos pequeños (<640px).
  4. Ausencia de desbloqueo proactivo de `AudioContext` en gestos táctiles en navegadores móviles.
- **Solución:**
  1. Configurar `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">` y restringir `touch-action: none` únicamente a los canvas interactivos (`#threeCanvas`, `#vectorXySurface`, `#merCanvas`).
  2. Implementar soporte táctil dual en `threeCanvas`: 1 dedo para rotación orbital/manual y actualización de `uMouse` para GLSL; 2 dedos con cálculo de `Math.hypot(dx, dy)` para pinch-to-zoom suave sobre `cameraOrbitRadius` / `camera.position.z`.
  3. Incorporar botones flotantes de zoom en pantalla (`+`, `−`, `↺`) accesibles para cualquier tamaño de pantalla.
  4. Transformar el cockpit bar en un strip horizontal deslizante con etiquetas responsivas compactas.
  5. Registrar listeners pasivos de desbloqueo de `AudioContext` en `touchstart`/`click` y validar compatibilidad de `getDisplayMedia` en `startTabCapture`.
- **Trigger:** Al optimizar interfaces 3D WebGL / Web Audio para dispositivos táctiles móviles.

---

### L-017
- **Tags:** #webaudio #stereo-panning #mobile-audio #youtube #getusermedia
- **Síntoma:** Al capturar música sonando en el móvil (ej. YouTube por altavoz o split-screen), los graves y agudos desaparecen y el espectro se aplana. Además, no se podía regular independientemente el volumen del canal izquierdo y derecho de la música.
- **Causa raíz:**
  1. `getUserMedia({ audio: true })` activa por defecto en Android e iOS los procesadores DSP de llamada de voz (`echoCancellation: true`, `noiseSuppression: true`), los cuales detectan la música continua y las frecuencias subgraves como ruido indeseado y las cancelan.
  2. La salida a altavoces estaba conectada en bloque monoaural `masterGainNode -> audioCtx.destination` sin separación de canales estéreo.
- **Solución:**
  1. Crear un modo de escucha musical Hi-Fi móvil con constraints explícitos `{ echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 2 }`, preservando el rango dinámico completo de 20Hz a 20kHz.
  2. Enrutar la salida audible a través de `ChannelSplitter(2) -> Gain L (ch0) / Gain R (ch1) -> ChannelMerger(2) -> OutputMasterGain -> destination`, permitiendo atenuación y balance independiente por canal sin alterar el análisis DSP de los 8 stems.
- **Trigger:** Al procesar fuentes estéreo o capturar música ambiental/YouTube en dispositivos móviles.

---

### L-018
- **Tags:** #webaudio #live-ingest #onset-detection #youtube #stereo-routing #agc
- **Síntoma:** Al seleccionar la ingesta de YouTube Móvil o micrófono en vivo, las visuales 3D apenas se movían o no reaccionaban ante la música, los faders de canal L y R solo afectaban a pistas locales, y la barra de reproducción seguía mostrando el título del tema base ("Mordaza") con un scrubber estático.
- **Causa raíz:**
  1. En `startMicrophone()` y `startTabCapture()`, `connectSourceToPipeline(source, false)` pasaba `connectSpeakers = false`, desconectando `masterGainNode` del `stereoSplitterNode`. Como resultado, la señal nunca alcanzaba los nodos `gainLeftNode` ni `gainRightNode`, anulando los faders de canal para fuentes en vivo.
  2. El detector de onsets empleaba umbrales absolutos fijos (`flux > 1.7` o `sub + bass > 0.8`) pensados para audio pre-grabado masterizado a 0 dBFS. Las señales acústicas capturadas por micrófonos de móvil alcanzan niveles de sub/bass de 0.05 a 0.20, por lo que nunca disparaban el transitorio (`isOnset` siempre falso).
  3. `setupAudioElement()` era la única función que modificaba `#track-title`. Al activar YouTube o micrófono, el título y scrubber permanecían anclados a la pista por defecto.
- **Solución:**
  1. Conectar las fuentes en vivo a la cadena estéreo con `connectSpeakers = true` y control de monitoreo `[🎧 Monitoreo: ACTIVO / MUTE]`, garantizando que los faders L y R y el volumen general regulen lo que se escucha en auriculares.
  2. Implementar un Control Automático de Ganancia (AGC) adaptativo y detector de onsets por pico relativo de flujo espectral (`flux > avgSpectralFlux * 1.35`), dinamizando la respuesta visual para cualquier nivel sonoro.
  3. Crear `updatePlaybackBar(sourceType, title)` que transmuta dinámicamente el scrubber temporal en un vúmetro analógico activo `● EN VIVO` con selector de preamplificación rápida (`[1x] [2.5x] [4.5x] [8x]`).
- **Trigger:** Al depurar reactividad de audio en vivo o controles de mezcla estéreo sobre flujos capturados en dispositivos móviles.

---

### L-019
- **Tags:** #android #webaudio #youtube #sandboxing #headphone-isolation #cross-origin #stereo-dsp
- **Síntoma:** Al escuchar YouTube en un teléfono Android con auriculares conectados, al pulsar "YouTube Móvil" en MotorVisuales las visuales no reaccionaban (`RMS = 0.00`) y los controles de balance L/R y volumen general no afectaban al sonido que salía por los auriculares.
- **Causa raíz:**
  1. **Sandboxing de Android:** El sistema operativo móvil Android impide estrictamente por seguridad que una aplicación web en el navegador (Google Chrome) capture o intercepte el flujo de audio digital interno generado por otra aplicación nativa independiente (app de YouTube o ventana PiP).
  2. **Aislamiento Acústico de Auriculares:** Cuando se conectan auriculares (jack 3.5mm o Bluetooth), el hardware del teléfono conmuta la salida de audio exclusivamente a los transductores internos del auricular. El micrófono físico del teléfono queda aislado del exterior y capta silencio ambiental (`RMS = 0.00`), impidiendo que el motor DSP detecte música.
  3. **Inactividad de Ingesta:** La función previa `selectYouTubeMobileSource()` solo actualizaba una etiqueta de texto y abría un modal informativo, sin enviar señal de audio al grafo de Web Audio API.
- **Solución:**
  1. Alojamiento directo del track de YouTube (`section-63.mp3` - "Section 63 - Manipulation EP") en el servidor local/producción e integración como 3er botón permanente de HQ Preset Track (`Section 63 (YouTube)`).
  2. Conectar la pulsación de `YouTube Móvil` para invocar inmediatamente `playPresetTrack('section-63.mp3', 'Section 63 - Manipulation EP (YouTube HQ)', ...)` a través del grafo Web Audio (`mediaElementSource -> masterGainNode -> stereoSplitterNode -> gainLeftNode / gainRightNode -> stereoMergerNode -> outputMasterGain -> audioCtx.destination`).
  3. Al reproducirse a través del pipeline Web Audio de la propia web:
     - El analizador de 8 stems y los detectores de transitorios operan a 60 FPS con máxima reactividad sobre la Nebulosa 30k y los 19 shaders GLSL.
     - Los faders Master, Izquierdo (L) y Derecho (R) modulan directamente la potencia acústica de cada auricular en tiempo real.
     - La barra de reproducción presenta título activo, scrubber de tiempo y controles completos de transporte.
  4. Proveer un botón de opciones avanzadas (`⚙️`) junto a `YouTube Móvil` con un asistente transparente que expone las 4 alternativas (reproducción HQ 1-tap, escucha por micrófono acústico con AGC 4.5x, captura digital de pantalla compartida y carga de archivos locales).
- **Trigger:** Al integrar audio de YouTube o aplicaciones de terceros en navegadores móviles con auriculares conectados.


---

### L-020
- **Tags:** #webaudio #phase-correlation #goniometer #web-midi #animated-webp #riff-muxer
- **Síntoma:**
  1. Al representar la correlación de fase estéreo con señales ricas en transitorios, el coeficiente sufre fluctuaciones erráticas si se evalúa fotograma a fotograma sin suavizado.
  2. La exportación de bucles visuales continuos a GIF tradicional genera artefactos de cuantización de color severos (límite de 256 colores) y los navegadores carecen de API nativa canvas.toBlob('image/webp-animated') directa.
  3. En controladores MIDI físicos, el giro rápido de encoders rotatorios o faders emite decenas de eventos CC por segundo que pueden saturar la interfaz si se manipula el DOM de forma síncrona.
- **Causa raíz:**
  1. La correlación instantánea entre bloques FFT pequeños (512 muestras) varía velozmente en música percusiva.
  2. El estándar WebP Container soporta animación mediante chunks ANMF y ANIM en el formato RIFF, pero HTMLCanvasElement solo genera imágenes WebP estáticas individuales (VP8 o VP8L).
  3. Desencadenar document.getElementById o re-renderizados pesados por cada byte MIDI bloquea el hilo principal a 60 FPS.
- **Solución:**
  1. Aplicar filtro IIR/EMA (r_smooth = r_smooth * 0.85 + r * 0.15) sobre el coeficiente normalizado de Pearson r = sum(L*R) / sqrt(sum(L^2)*sum(R^2)), estabilizando la aguja analógica del vúmetro y la retícula Mid/Side 45° con persistencia de fósforo vectorial.
  2. Construir un ensamblador RIFF WEBP de 24-bit nativo en vanilla JS (encodeAnimatedWebP): compone la cabecera RIFF....WEBP, inyecta el chunk de cabecera extendida VP8X (con bit de animación 0x02), el chunk de control ANIM (loop infinito 0x0000) y empaqueta cada frame WebP generado por canvas.toBlob('image/webp') dentro de chunks ANMF con retardo en milisegundos (1000/FPS) y flag de sobreescritura 0x02. Cero librerías externas, alta compresión y calidad fotográfica total.
  3. En el controlador MIDI, aplicar las mutaciones directamente a los objetos de audio en memoria (AudioParam.value, v4XyMod, uniforms WebGL) y actualizar la telemetría del monitor mediante un temporizador debounce con LED CSS de baja sobrecarga.
- **Trigger:** Al implementar medidores de fase broadcast, codificación de bucles WebP en el cliente o mapeo de hardware MIDI USB.

---

### L-021
- **Tags:** #mobile-ui #responsive #viewport #zero-scroll #dvh #overscroll-contain #deck-switcher
- **Síntoma:** En smartphones y pantallas reducidas (< 1024px), el diseño de doble columna de escritorio apilaba verticalmente el rack de audio (1400px), el viewport 3D y la suite de estudios creativos (> 3000px), obligando al usuario a realizar desplazamientos kilométricos para ver la escena 3D y provocando que los gestos táctiles sobre el canvas interceptaran el scroll de la página de forma errática.
- **Causa raíz:** El orden natural del DOM renderizaba la columna izquierda (`#left-dock-column`) antes del canvas Three.js (`#three-viewport-section`), y todos los módulos se mostraban simultáneamente sin discriminación de viewport móvil ni contención de desbordamiento.
- **Solución:**
  1. **Reordenación Flex/Grid:** Asignar `order-1 lg:order-2` al viewport 3D para posicionarlo en la cabecera superior inmediata del teléfono, y `order-2 lg:order-1` al panel de audio/stems.
  2. **Dimensionamiento Dinámico (`dvh`):** Configurar `#three-canvas-container` con altura fluida adaptada a navegadores móviles `h-[32dvh] min-h-[210px] max-h-[290px] sm:h-[440px] lg:h-[580px]`, garantizando visibilidad del canvas 3D y espacio ergonómico inferior.
  3. **Mobile Deck Switcher:** Barra de navegación táctica de 5 pestañas (`[🎵 Audio] [🎚️ Stems] [✨ PostFX] [⚡ GLSL] [🧠 IA / MER]`) visible exclusivamente en móviles (`lg:hidden`), que alterna visibilidad con cero recarga ni caída de FPS.
  4. **Contención de Scroll Aislada (`mobile-deck-scrollable`):** Limitar la altura de los controles en móvil con `max-h-[calc(100dvh-420px)] overflow-y-auto overscroll-behavior: contain; -webkit-overflow-scrolling: touch;`, impidiendo que el scroll de los controles arrastre la ventana completa (Zero Window Scrolling).
  5. **Integridad de Escritorio:** En pantallas `>= 1024px`, los modificadores `lg:block`, `lg:grid` y `lg:overflow-visible` restauran el 100% de la consola sin alterar un solo píxel de la experiencia desktop.
- **Trigger:** Al adaptar consolas densas de audio/video y visualizadores 3D a interfaces de smartphone sin degradar la experiencia de escritorio.

---

### L-022
- **Tags:** #ui-design #pro-audio #hardware-rack #patchbay #led-status #master-tracks #anti-slop
- **Síntoma:** El panel de pistas de audio presentaba el título "Temas Disponibles", botones con gradientes multicolores saturados (fucsia, violeta, rojo), comillas en los nombres y emojis lúdicos (`🔥`, `⚡`), proyectando una imagen infantil y poco seria inadecuada para un entorno de masterización y DSP profesional.
- **Causa raíz:** Enfoque de diseño previo orientado a demostración rápida de biblioteca de música en lugar de estándar de consola de estudio de hardware (tipo Elektron, SSL, Teenage Engineering o Ableton).
- **Solución:**
  1. **Nomenclatura Técnica Rigurosa:** Reemplazar "Temas Disponibles" por **"PISTAS MASTER DE REFERENCIA"** dentro de la **"MATRIZ DE ENTRADA & SEÑAL MASTER"**, con metadatos de canal (`PCM 48kHz Master`, `Dynamic Mix 320k`, `YouTube Direct Feed`).
  2. **Estética Chasis Hardware Rack:** Sustituir gradientes y emojis por botones de aluminio grafito oscuro (`bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/50`), tipografía monospace técnica para serigrafía de canal (`CH 01 // REF`, `CH 02 // REF`, `CH 03 // STREAM`) y micro-indicadores LED de estado (`STANDBY` en gris/apagado vs `ON AIR` con micro-LED verde brillante `bg-emerald-400 shadow-[0_0_8px_#34d399]`).
  3. **Matriz de Ingesta Externa (Patchbay):** Convertir los botones de fuentes secundarias en pulsadores de patchbay de estudio con tags técnicos claros: `[MIC] ANALOG`, `[YT] DIRECT`, `[SYS] LOOP`, `[FILE] LOCAL`, `[SYN] PROC` y `[MUTE] STOP`.
- **Trigger:** Al diseñar interfaces de audio, DSP o consolas de mastering que deban transmitir rigor técnico y máxima ergonomía profesional.

---

### L-023
- **Tags:** #ferrofluids #fhd #magnetostatics #langevin #rosensweig #postfx #ai-director #autonomous-art
- **Síntoma:** 
  1. Para simular ferrofluidos con rigor físico no bastaban ondas trigonométricas simples; se requería modelar Navier-Stokes con densidad de fuerza de Kelvin, saturación de Langevin e inestabilidad hexagonal de Rosensweig con óptica nacarada.
  2. La suite de post-procesado de 9 passes requería una orquestación autónoma coordinada donde la IA pudiera intervenir creativamente en vivo sin saltos bruscos ni desorden visual.
- **Causa raíz:**
  1. En GLSL ES 1.0, la función $\coth(\xi) - 1/\xi$ diverge numéricamente en el origen y requiere aproximación de Taylor para $\xi < 0.08$ y acotación exponencial.
  2. La aleatorización no estructurada de parámetros de post-procesado destruye la estética de la imagen; se requiere un sistema dramatúrgico basado en arquetipos estéticos con interpolación suave LERP a 60 FPS y micro-reactividad a transitorios de audio.
- **Solución:**
  1. Implementación de los 4 modos magnéticos (Sin campo, Diamagnético repulsivo, Paramagnético lineal, Superparamagnético no lineal), control de polaridad $\beta \in \{-1, +1\}$ ("Tirar" constructivo vs "Empujar" destructivo), picos hexagonales de Rosensweig y óptica Thin-Film Newtoniana ($\lambda \in \{650, 532, 440\}\,\text{nm}$) en los presets 18 y 20 de GLSL, gobernados por el panel interactivo `#fhd-controls-rack`.
  2. Implementación de `aiFxDirector` con 6 arquetipos cinematográficos (*Cine 35mm*, *Cyberpunk Glitch*, *Psicodelia Astral*, *Arcade VHS*, *Negativo Solar*, *Minimal Zen*) que interpola armónicamente a 60 FPS hacia los valores objetivo mientras preserva micro-spikes de reacción instantánea en onsets y drops musicales.
- **Trigger:** Al simular fluidos magnetostáticos no lineales o implementar orquestadores de post-procesado visual autónomos guiados por IA.

---

### L-024
- **Tags:** #python #windows #encoding #osc #websockets #utf8 #charmap
- **Síntoma:** El script en segundo plano falla inmediatamente al arrancar o se detiene con `UnicodeEncodeError: 'charmap' codec can't encode character ...` al imprimir mensajes de registro en PowerShell o CMD de Windows.
- **Causa raíz:** En Windows, la consola estándar por defecto utiliza codificaciones heredadas (como CP-1252 o CP-850) para `sys.stdout` y `sys.stderr`. Cualquier carácter fuera del mapa ASCII de 8 bits (incluyendo emojis, flechas o caracteres técnicos tipográficos) provoca una excepción fatal en Python.
- **Solución:** En cualquier script o pasarela Python destinada a correr en terminales Windows, forzar la reconfiguración de los flujos de salida estándar a UTF-8 con reemplazo seguro de errores en el encabezado del archivo:
  ```python
  import sys
  if sys.platform == 'win32':
      try:
          sys.stdout.reconfigure(encoding='utf-8', errors='replace')
          sys.stderr.reconfigure(encoding='utf-8', errors='replace')
      except Exception:
          pass
  ```
- **Trigger:** Al escribir scripts de soporte, daemons, pasarelas OSC o herramientas CLI en Python que impriman logs en Windows.

---

### L-025
- **Tags:** #webaudio #spatial-audio #panner #hrtf #surround #routing #bypass #threejs
- **Síntoma:** Al activar el audio espacial 3D o Binaural HRTF en paralelo a una cadena de mezcla existente, el volumen de salida se duplica o se producen artefactos molestos de filtro peine (comb filtering) y cancelaciones de fase acústicas.
- **Causa raíz:** Si `masterGainNode` alimenta al mismo tiempo a la cadena estéreo tradicional (`stereoMergerNode -> outputMasterGain`) y a la cadena espacializada (`pannerInputGain -> pannerNode -> outputMasterGain`), el oyente recibe la señal original y la señal espacializada con micro-retardo HRTF de forma simultánea, duplicando la amplitud y provocando interferencia destructiva de fase.
- **Solución:** Implementar conmutación de enrutamiento mutuamente excluyente en el grafo (`updateGraphRouting()`):
  - **Modo Binaural 3D HRTF:** Desconectar temporalmente `stereoMergerNode` de `outputMasterGain` y abrir la ganancia del panner (`pannerOutputGain.gain.setValueAtTime(1.0, audioCtx.currentTime)`), enlazando `pannerOutputGain` a `outputMasterGain`.
  - **Modo Estéreo Tradicional (Bypass):** Atenuar la ganancia del panner a cero (`pannerOutputGain.gain.setValueAtTime(0.0, audioCtx.currentTime)`) y reconectar limpiamente `stereoMergerNode` a `outputMasterGain`.
  - **Modo Surround 5.1:** Reconfigurar el destino con `destination.channelCount = 6` y `channelInterpretation = 'discrete'`, derivando las bajas frecuencias mediante un crossover analítico a 80 Hz hacia el canal 3 (LFE Subwoofer).
- **Trigger:** Al integrar procesadores de audio espacial 3D, panners binaurales o matrices multicanal sobre infraestructuras Web Audio existentes.

---

### L-026
- **Tags:** #webgpu #wgsl #gpgpu #threejs #fbo #hot-reload #shader-injection #safe-compile
- **Síntoma:** Intentar ejecutar WebGPU directamente sobre lienzos existentes puede colisionar con contextos 2D/WebGL si ya fueron inicializados, o inyectar código de simulación FBO dinámicamente en Three.js puede congelar la aplicación si la compilación en GPU arroja un error de sintaxis.
- **Causa raíz:**
  1. La especificación del estándar HTML Canvas prohíbe invocar `getContext('webgpu')` sobre un elemento `<canvas>` que ya haya obtenido previamente un contexto `'2d'` o `'webgl'` (arrojando `InvalidStateError` o devolviendo `null`).
  2. Sustituir directamente `material.fragmentShader` en bucles de simulación continua Ping-Pong FBO sin validar la compilación en GPU destruye el pipeline de Three.js ante cualquier error sintáctico, deteniendo el `requestAnimationFrame` de la aplicación.
- **Solución:**
  1. Diseñar el motor WebGPU con arquitectura híbrida JIT resiliente: si el hardware no expone WebGPU nativo, ejecutar la simulación numérica exacta (diferencias finitas laplacianas y advección) en el contexto de dibujo activo, permitiendo que el usuario programe en WGSL y experimente sin romper el canvas.
  2. Para la inyección en caliente de shaders FBO en Three.js (`injectGlslComputePipeline`), instanciar previamente un `THREE.ShaderMaterial` temporal aislado con idénticos uniforms y compilarlo con `threeRenderer.compile(testScene, threeCamera)`. Si la compilación GPU es exitosa, se actualiza el material del FBO en caliente; si falla, se captura el error, se emite feedback claro en la consola de la UI y la simulación previa continúa corriendo a 60 FPS sin parpadeos ni cuelgues.
- **Trigger:** Al diseñar IDEs, editores de shaders o motores de cómputo GPU interactivos con compilación en caliente en tiempo de ejecución.

---

### L-027
- **Tags:** #webaudio #generative-art #auto-vj #musical-narrative #flow-clock #morphogenesis #drops
- **Síntoma:** Las visualizaciones reactivas al audio se sienten estáticas, predecibles y mecánicas (estilo vúmetro 3D) a pesar de utilizar shaders complejos o geometrías densas. El usuario percibe que el motor "no interpreta la música" ni cambia con la evolución dramática de la canción.
- **Causa raíz:**
  1. Utilizar el reloj plano del sistema (`time = performance.now() * 0.001`) para avanzar los uniforms temporales en los shaders, provocando que la velocidad de animación sea indiferente al tempo, a los silencios o a los clímax.
  2. Ausencia de análisis estructural de la música: tratar cada fotograma de forma aislada sin memoria de corto/medio plazo que distinga una introducción etérea de un build-up de tensión o de un drop atronador.
  3. Geometrías fijas que solo se escalan o rotan en bloque en vez de mutar sus ecuaciones topológicas analíticas.
- **Solución:**
  1. **Reloj Perceptual Musical Fluido (`flowTime`):** Integrar un reloj perceptual $\frac{d\theta}{dt} = \omega_{\text{base}} + \alpha \cdot \text{RMS}^{1.5} + \beta \cdot \text{Sub}^{1.2} + \gamma \cdot \text{OnsetValue}$. Cuando la música acelera o gana densidad rítmica, el tiempo visual se acelera orgánicamente y frena con inercia elástica en los pasajes tranquilos.
  2. **Detección de Macro-Estados Narrativos:** Implementar filtros EMA multiescala (energía rápida vs lenta) para detectar *Intro Etérea*, *Build-up de Tensión*, *Drop Explosivo*, *Groove Rítmico* y *Breakdown*.
  3. **Eventos No Lineales de Impacto:** En los Drops musicales, disparar destellos analógicos fotográficos (`#hud-drop-flash`), saltos de cámara aleatorios (Jump Cuts), ondas de choque expansivas de partículas (`uShockwave`) y conmutaciones a paletas de alto contraste.
  4. **Morfogénesis Analítica en GPU:** Evaluar en vertex shader múltiples morfologías paramétricas analíticas (Esfera, Galaxia espiral, Toroide de Clifford, Resonador cimático, Doble hélice) interpolando con `smoothstep` sin sobrecarga en la CPU.
- **Trigger:** Al diseñar motores visuales de audio-reactividad que deban ofrecer una experiencia artística generativa, cambiante y de calidad cinematográfica autónoma.

---

### L-028
- **Tags:** #threejs #shaders #gerstner-waves #pbr #mercury #monoliths #scenic-worlds #anti-milkdrop #git-merge
- **Síntoma:**
  1. Las visuales generadas para música electrónica/rock sufren del "síndrome MilkDrop 2001": formas geométricas o fractales abstractos flotando en un fondo negro vacío, sin línea de horizonte, sin física de fluidos ni geología monumental viva.
  2. Al resolver fusiones complejas de Git entre desarrollo local y un servidor remoto con implementaciones concurrentes (archivos HTML monolíticos de >18.000 líneas), marcadores de conflicto no resueltos o llaves `{}` huérfanas pueden quebrar silenciosamente el parseo de JavaScript.
- **Causa raíz:**
  1. El paradigma de MilkDrop se limitaba a un bucle de retroalimentación 2D per-pixel sin noción de mundo, iluminación PBR, niebla volumétrica ni cámaras cinemáticas con alabeo aerodinámico (Bank Roll).
  2. Resolver bloques de conflicto con herramientas de reemplazo de texto sin un validador sintáctico estricto en JS (`node --check` / parser AST) puede dejar bloques con llaves de cierre omitidas que impiden el arranque del script principal.
- **Solución:**
  1. **Motor de Universos Escénicos (`ScenicWorldEngine`):**
     - **Superficie de Fluido Físico (Ondas Trocoidales de Gerstner en GPU):** Implementar $N$ trenes de ondas cruzadas directamente en el vertex shader sobre una malla planar de $160\times 160$ quads, calculando las derivadas parciales continuas $\nabla P$ analíticamente para obtener normales hiper-precisas sin aproximaciones por diferencias finitas.
     - **Óptica de Metal Líquido (Mercurio PBR):** Aplicar aproximación de Fresnel Schlick con reflectancia base de metal noble ($F_0 = 0.82$), dispersión cromática angular en micro-crestas y sun glint anisotrópico.
     - **Geología Monumental & Vetas Lumínicas:** Disponer prismas hexagonales colosales de basalto volcánico en espiral áurea, con canales emisivos de cuarzo cuántico en las aristas modulados por frecuencias medias/altas y oscilación geológica en pistones armónicos.
     - **Atmósfera Reactiva & Dron FPV:** Integrar cúpula con relámpagos estroboscópicos reactivos a los onsets y cámara con trayectorias 3D suaves, alabeo en curvas y saltos cinemáticos (Jump Cuts) en los drops.
  2. **Técnica de Validación Sintáctica Post-Merge:**
     - Al mergear scripts monolíticos en HTML, aislar el bloque principal en un archivo temporal y verificar la paridad atómica de llaves `{}` con un script tokenizador que ignore cadenas (`"`, `'`, `` ` ``) y comentarios (`//`, `/* */`), seguido de `node --check <file>.js` para garantizar cero errores sintácticos antes de confirmar el commit.
- **Trigger:** Al construir mundos escénicos cinematográficos de vanguardia o al fusionar ramas complejas con código concurrente en un frontend monolítico.

---

### L-029
- **Tags:** #threejs #shaders #lighting #pbr #camera-orbit #frustum-clipping #scenic-worlds #ambient-light
- **Síntoma:** Al seleccionar una escena 3D procedural compleja (como el Universo Escénico de Mercurio & Megalitos), el Viewport aparece completamente negro a pesar de tener 60 FPS estables y HUD activo, o la cámara se aleja a distancias gigantescas impidiendo la experiencia FPV.
- **Causa raíz:**
  1. **Oscuridad en estado de reposo:** Los shaders de cielo, océano y basalto dependían al 100% de la actividad musical (`uHighmid`, `uTreble`, `uLightning`). Con la música pausada o en pasajes tenues, los colores resultantes tenían amplitudes RGB de $0.01 \dots 0.04$.
  2. **Ausencia de iluminación ambiental y solar permanente:** La escena dependía de un `PointLight` de relámpago con intensidad $0.0$ en reposo.
  3. **Conflicto de cinemática de cámara:** El bucle general `renderThreeFrame` aplicaba automáticamente su cámara orbital estándar (`DIST: 657` mirando al origen) sobreescribiendo el vuelo rasante FPV de `ScenicWorldEngine.updateDroneCinematics()`.
  4. **Frustum Clipping de la cúpula celeste:** La esfera del cielo tenía radio $1800$ mientras que `camera.far = 2000`; al orbitar la cámara a distancia $657$, la geometría del cielo superaba el plano de recorte lejano de WebGL.
- **Solución:**
  1. **Iluminación Base Radiante:** Integrar `THREE.DirectionalLight` (sol binario) y `THREE.AmbientLight` constantes en el grupo escénico. En los shaders, asegurar un brillo base mínimo del $85\%$ en las vetas de neón y una paleta crepuscular esmeralda/fucsia en el cielo visible aún en silencio absoluto.
  2. **Desacoplamiento de Cámara:** En `renderThreeFrame`, añadir una excepción condicional explícita para `activeSceneType === 'scenic_mercury_monoliths'`, delegando el gobierno de la cámara al sistema de vuelo cinemático de la escena.
  3. **Centrado Dinámico de la Bóveda Celeste:** Copiar en cada frame la posición de la cámara a la esfera del cielo (`skyDome.position.copy(threeCamera.position)`) para garantizar que nunca sea recortada por el frustum de la GPU.
- **Trigger:** Al desarrollar escenas de entorno 3D completas, mundos abiertos o simulaciones escénicas que deben ser inmediatamente visibles y luminosas sin importar si hay audio reproduciéndose.

---

### L-030
- **Tags:** #webaudio #spatial-audio #surround-sound #openexr #tiff #vfx-pipeline #webrtc #datachannel
- **Síntoma:** Al codificar formatos científicos y de VFX en el cliente (como OpenEXR o TIFF Float32) y al negociar canales de audio discretos superiores a 6 canales (Surround 7.1 y Atmos), los navegadores arrojan excepciones de hardware o las aplicaciones 3D como Houdini/Blender fallan al leer los archivos generados.
- **Causa raíz:**
  1. **Especificación Estricta de Canales en OpenEXR:** La especificación de Industrial Light & Magic exige que los canales dentro de un `chlist` de OpenEXR estén rigurosamente ordenados alfabéticamente por su nombre ASCII ('A', 'B', 'G', 'R'). Si se escriben en orden RGBA o desordenados, Houdini y Nuke rechazan el archivo por corrupción de cabecera.
  2. **Etiquetas Numéricas de TIFF:** En el estándar TIFF, las entradas del IFD (Image File Directory) deben estar estrictamente ordenadas por su Tag ID numérico creciente. Si el tag 256 (ImageWidth) o 258 (BitsPerSample) no siguen el orden, los decodificadores fallan.
  3. **Límites de Canales de Hardware en Web Audio API:** Si se solicita `AudioDestinationNode.channelCount = 8` o `12` en un dispositivo con salida estéreo o auriculares, el navegador lanza una excepción `IndexSizeError` o no produce sonido.
- **Solución:**
  1. **Orden Alfabético y Numérico Estricto en Encoders:** Ordenar los nombres de canales en OpenEXR como `['A', 'B', 'G', 'R']` y escribir las etiquetas TIFF en secuencia ascendente estricta ($256 \dots 339$), configurando `SampleFormat = 3` (IEEE Float).
  2. **Fallback Inteligente de Salida Multicanal:** Comprobar siempre `audioCtx.destination.maxChannelCount`. Si es inferior al canal objetivo (6, 8 o 12), mantener la matriz interna completa y los vúmetros visuales para monitoreo del usuario, pero enrutar la salida acústica a través del PannerNode Binaural HRTF.
  3. **DataChannel WebRTC de Ultra-Baja Latencia:** Configurar `ordered: false` y `maxRetransmits: 0` para telemetría continua de audio-reactividad a 60 FPS, previniendo saturación de colas y bloqueos TCP en enlaces P2P.
- **Trigger:** Al generar archivos de intercambio para suites de postproducción 3D o al implementar protocolos de audio multicanal y telemetría inter-dispositivo en navegadores web.

---

### L-031
- **Tags:** #threejs #3d-printing #stl #obj #gltf #manifold #watertight #heightmap #geometry
- **Síntoma:** Al exportar mallas 3D generadas proceduralmente desde un heightmap (como Waterfall acústico o Gerstner waves) a formato STL u OBJ para slicers de impresión 3D (Cura, PrusaSlicer, Bambu Studio) o motores de modelado, el software arroja errores de geometría no múltiple ("non-manifold mesh", agujeros en la malla, bordes abiertos o volumen no estanco $\partial M \neq \emptyset$), impidiendo rebanar el modelo o calculando normales invertidas.
- **Causa raíz:**
  1. Un heightmap planar estándar solo genera la superficie superior ("open sheet"), dejando los cuatro costados perimetrales y el fondo abiertos.
  2. Al triangular los faldones perimetrales, invertir el orden de los vértices (winding order clockwise vs counter-clockwise) genera normales que apuntan hacia el interior del sólido, desconcertando a los slicers de manufactura aditiva.
  3. Para exportación binaria en Little Endian Float32 sin dependencias npm, una desalineación de bytes en el búfer STL o GLB corrompe la geometría.
- **Solución:**
  1. **Topología Cerrada Estanca (*Watertight Manifold*):** Extraer la matriz de elevación regular ($N \times M$), calcular un plano inferior $Y_{\text{bottom}} = Y_{\text{min}} - \text{baseThicknessMm}$ y construir 4 faldones perimetrales (Norte, Sur, Este, Oeste) más una tapa inferior cerrada con orden de devanado invertido.
  2. **Cálculo de Normales Exteriores por Producto Cruz:** Para cada faceta triangular $(v_0, v_1, v_2)$, calcular analíticamente $\vec{N} = (v_1 - v_0) \times (v_2 - v_0)$ normalizado y verificar que apunte rígidamente hacia el exterior del sólido volumétrico.
  3. **Encoders Binarios Nativos Puros:**
     - **STL Binario:** Cabecera de 80 bytes, `UInt32LE` con conteo de facetas $F = 2 \cdot (N-1)(M-1) \cdot 2 + 2(N-1) \cdot 2 + 2(M-1) \cdot 2$, y bloques de 50 bytes por triángulo (3x Float32 normal + 9x Float32 vértices + 2 bytes attribute byte count).
     - **glTF 2.0 Binario (.glb):** Ensamblado en un solo buffer binario con magic `0x46546C67`, chunk `JSON` alineado a 4 bytes con padding de espacios `0x20` y chunk `BIN\x00` con padding `0x00`, index buffers `UNSIGNED_INT` y attributes `POSITION` / `NORMAL`.
- **Trigger:** Al exportar mallas acústicas o generativas para impresión 3D o intercambio de assets 3D en WebGL.

---

### L-032
- **Tags:** #vj #timeline #q-bus #automation #playback #interpolation #scrubbing
- **Síntoma:** Al reproducir una sesión de automatización VJ grabada o mover el playhead (scrubbing), los visualizadores tartamudean, los parámetros acústicos entran en conflicto con la señal de audio viva en el micrófono/archivo, o el salto brusco entre fotogramas discretos (a 30 FPS) produce jitter visual desagradable en los shaders a 60/120 FPS.
- **Causa raíz:**
  1. Intentar manipular o sobrescribir los nodos del grafo de Web Audio API (`AnalyserNode`, `BiquadFilterNode`) para "reproducir" automatizaciones pasadas corrompe el flujo de audio en vivo y genera latencias o cortes audibles.
  2. Muestrear a 30 FPS y asignar valores discretos en el render loop a 60 FPS genera saltos visibles si no se interpola temporalmente.
  3. Durante la reproducción, la función `runAudioDSP()` del loop maestro sobrescribe continuamente las variables $Q_1 \dots Q_{24}$ con el silencio del micrófono o del reproductor de fondo.
- **Solución:**
  1. **Desacoplamiento Estricto de la Capa de Telemetría (Q-Bus Override):** Al estar en modo `isPlaying`, mantener el motor Web Audio ejecutándose libremente pero interceptar inmediatamente después de `runAudioDSP()` e inyectar en `window.qVars` y en los stems los valores interpolados de la sesión grabada.
  2. **Interpolación Hermite / Lerp Temporal:** Interpolar linealmente entre el fotograma actual y el siguiente según el delta temporal sub-frame ($t - t_{\text{prev}}$), garantizando transiciones de moduladores suaves como la seda a cualquier tasa de refresco (60 Hz, 120 Hz, 144 Hz).
  3. **Scrubbing Bidireccional No Destructivo:** Al arrastrar el cursor sobre el canvas del timeline multipista, pausar automáticamente la grabación y evaluar la interpolación espacial en el frame exacto con búsqueda binaria o acceso $O(1)$ por índice indexado en tiempo real.
- **Trigger:** Al diseñar sistemas de grabación, automatización y reproducción de señales reactivas (VJ timelines, DAW automation lanes, Show Control).

---

### L-033
- **Tags:** #webaudio #tab-capture #getdisplaymedia #suppresslocalaudioplayback #monitoring #echo
- **Síntoma:** Al compartir una pestaña con audio (Suno, YouTube, Spotify Web), el analizador FFT y el vúmetro reciben señal continua (-22 dB, reactividad 3D activa), pero los altavoces o auriculares permanecen en silencio absoluto.
- **Causa raíz:**
  1. Para gobernar el volumen y balance L/R de una pestaña desde el visualizador, se solicita `suppressLocalAudioPlayback: true` en `getDisplayMedia`. Chrome silencia la pestaña en origen.
  2. Debido a la regla histórica contra el eco (L-004), `connectSourceToPipeline` se invocaba con `connectSpeakers = false` (`isAudioMonitoringEnabled = false`), poniendo `outputMasterGain.gain.value = 0.0`.
  3. Al estar la pestaña silenciada por el navegador y la salida de MotorVisuales silenciada por software, el usuario quedaba en silencio total a pesar de ver el vúmetro a 100% de volumen.
- **Solución:**
  1. Evaluar si la pestaña fue silenciada en origen: `const isLocalSuppressed = audioTrack.getSettings()?.suppressLocalAudioPlayback === true`.
  2. Si `isLocalSuppressed === true`, invocar `connectSourceToPipeline(source, true)` para que MotorVisuales reproduzca el audio en `audioCtx.destination`.
  3. Si `isLocalSuppressed === false` (ej. captura de pantalla completa o ventana donde el SO ya reproduce audio), mantener `connectSpeakers = false` por defecto para evitar el eco duplicado de L-004.
  4. Proveer un botón de monitoreo interactivo con estados claros (`🔊 Salida Activa` vs `🔇 Salida Muteada` / `ACTIVO` vs `MUTE`) y reanudar `audioCtx.resume()` tras la interacción con el modal de `getDisplayMedia`.
- **Trigger:** Al implementar captura de pestañas y enrutamiento de Web Audio API con `getDisplayMedia`.

---

### L-034
- **Tags:** #webrtc #getdisplaymedia #tab-capture #audio-quality #hifi #dsp #limiter #clipping
- **Síntoma:** El audio capturado desde una pestaña (Suno, YouTube, Spotify) suena con calidad muy degradada (apagado, sin agudos, como llamada telefónica o bajo el agua) o con distorsión áspera y saturación digital.
- **Causa raíz:**
  1. **Filtros de Voz de WebRTC en Chromium:** Al omitir constraints de audio en `getDisplayMedia`, el navegador aplica el procesamiento por defecto para videoconferencias: `echoCancellation` (filtra agudos >8kHz, corta reverberaciones y colapsa la imagen estéreo a mono), `noiseSuppression` (elimina platillos y armónicos como "ruido") y `autoGainControl` (bombea volumen).
  2. **Clipping Digital por Preamp Ingest:** En el rack de entrada en vivo, un selector de preamp elevado (ej. 4.5x para micrófonos débiles) multiplica la señal de la pestaña (ya masterizada a 0 dBFS) hasta amplitudes de 4.5, recortando brutalmente contra el techo de `audioCtx.destination` sin limitador.
- **Solución:**
  1. Declarar restricciones explícitas de audio Hi-Fi en `getDisplayMedia`: `{ suppressLocalAudioPlayback: true, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 2, min: 2 }, sampleRate: { ideal: 48000 } }`.
  2. Forzar `audioTrack.applyConstraints({ echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 2 })` tras adquirir el stream.
  3. Configurar por defecto el preamp en `1.0x Hi-Fi Puro` para fuentes digitales de pestaña y colocar un limitador transparente (`DynamicsCompressorNode` con umbral -0.3 dBFS, ratio 20:1 y ataque 1 ms) antes de `audioCtx.destination` para inmunidad total al clipping.
- **Trigger:** Al capturar o reproducir audio de pestañas o pantallas para escucha musical de alta fidelidad.

---

### L-035
- **Tags:** #threejs #glsl #shader-compilation #webglprogram #diagnostics #ui
- **Síntoma:** Al editar código en el IDE de shaders (Laboratorio GLSL) e introducir errores de sintaxis (borrar bloques, omitir `void main()` o tipos incompatibles) y pulsar "Compilar", la interfaz muestra falsamente `✓ Compilado OK` en verde y no reporta ningún error.
- **Causa raíz:** En Three.js, el método `renderer.compile(scene, camera)` **no arroja excepciones JavaScript** cuando un shader falla al compilar o vincular en la GPU. Three.js captura el fallo internamente, escribe en `console.error` y almacena `{ runnable: false }` en `WebGLProgram.diagnostics`. Por ende, un bloque `try { renderer.compile(...) } catch (err)` nunca se entera del error.
- **Solución:**
  1. Validar sintácticamente que tanto Vertex como Fragment Shader incluyan `void main()`.
  2. Interceptar temporalmente `console.error` y `console.warn` durante la invocación de `renderer.compile()` para atrapar los logs formateados de Three.js.
  3. Inspeccionar `renderer.properties.get(testMat).programs` buscando si algún programa tiene `diagnostics.runnable === false`, extrayendo los logs de `fragmentShader.log`, `vertexShader.log` y `programLog`.
  4. Si se detecta cualquier falla, lanzar un `Error` explícito para activar el bloque `catch`, pintar el badge en rojo palpitante (`✕ Error de Compilación`) y renderizar el registro con línea exacta en la consola del editor.
- **Trigger:** Al crear editores de shaders GLSL en vivo o herramientas de compilación dinámica en Three.js.

---

### L-036
- **Tags:** #threejs #scenic-worlds #boids #instancedmesh #clip-studio #gemini-api #routing
- **Síntoma:** Al seleccionar la Escena 14 (Abismo Oceánico & 4.096 Boids Bioluminiscentes), la cámara 3D caía en la órbita estándar de la Nebulosa en lugar del vuelo cinemático submarino FPV, la cúpula celeste conservaba el gradiente solar de Mercurio en vez del océano abisal profundo, o la síntesis de arquetipos generaba errores 404/fallback.
- **Causa raíz:**
  1. En `renderThreeFrame`, los chequeos de excepción cinemática de cámara y actualización del `ScenicWorldEngine` solo contemplaban `scenic_mercury_monoliths` y `scenic_crystal_valley`, omitiendo `scenic_abyss_boids`.
  2. Los métodos `initAbyssBoidsWorld` y `updateAbyssBoids` habían quedado erróneamente anidados en la clase previa (`Waterfall3DManager`) en lugar de `ScenicWorldEngine`.
  3. El shader de la bóveda celeste `uWorldMode` solo alternaba entre 0.0 (Mercurio) y 1.0 (Valle de Cristales), sin evaluar el modo 2.0 (Abismo Marino con gradiente de profundidad y absorción lumínica sin estrellas diurnas).
  4. La llamada de síntesis de arquetipos invocaba `gemini-2.5-flash` en vez de `gemini-3.5-flash-lite` y no consultaba prioritariamente `window.MOTOR_CONFIG.GEMINI_API_KEY` (L-009 / L-012).
- **Solución:**
  1. Reubicar e integrar formalmente los métodos del Abismo dentro de `ScenicWorldEngine`.
  2. Extender las condiciones en `renderThreeFrame` a `activeSceneType === 'scenic_abyss_boids'`, permitiendo que el dron FPV submarino gobierne la cámara a 60 FPS con alabeo dinámico y dispersión acústica.
  3. Extender el fragment shader de la cúpula celeste para soportar `uWorldMode > 1.5` con degradado crepuscular abisal azul medianoche y niebla de profundidad.
  4. Enlazar `abyssScreenMesh.material` a `holoMaterial` de `AiClipStudioEngine` para proyectar el videoclip IA multicapa directamente sobre el monolito submarino central.
  5. Actualizar la síntesis de arquetipos a `gemini-3.5-flash-lite` con fallback heurístico y lectura de `MOTOR_CONFIG`.
- **Trigger:** Al incorporar nuevos mundos escénicos 3D en ScenicWorldEngine o vincular materiales holográficos de proyección universal.

---

### L-037
- **Tags:** #hetzner #docker #traefik #sqlite #wal #presets-hub #rest-api #cors #production
- **Síntoma:** Al desplegar un nuevo microservicio backend en Hetzner (ej. Node.js en puerto 4000 para el Hub de Presets), las peticiones desde el exterior fallan o son rechazadas por UFW Firewall, o los navegadores móviles arrojan errores de Mixed Content al intentar consultar `http://localhost:4000/api`.
- **Causa raíz:**
  1. **Firewall UFW y Traefik File Provider:** En servidores de producción blindados (como el AX102 de Hetzner), UFW únicamente permite tráfico público en los puertos 22, 80 y 443. Publicar puertos adicionales al host está prohibido por políticas de seguridad, y Traefik opera con configuración dinámica en archivo (`routes.yml`) enrutando `Host('motorvisuales.site')` de forma fija al servicio principal `motorvisuales:8000`.
  2. **Cache de Construcción en Docker Compose:** Recrear contenedores con `docker-compose restart` no aplica cambios de código si el contenedor fue construido con una imagen fija sin volúmenes activos en memoria de Docker (`.Mounts` vacío).
  3. **Resolución Rígida de Endpoint en Frontend:** Forzar `http://localhost:4000/api` como fallback en el cliente web bloquea las conexiones en producción y en dispositivos móviles.
- **Solución:**
  1. **Consolidación en Gateway Principal (FastAPI + SQLite WAL):** Integrar los endpoints `/api/presets*` directamente en `server.py` utilizando `sqlite3` estándar con `PRAGMA journal_mode = WAL` y persistencia en `/app/data/presets.db`. Al servirse desde `motorvisuales:8000`, Traefik enruta automáticamente todas las peticiones con SSL de Let's Encrypt y CORS sin tocar `routes.yml` ni abrir puertos en UFW.
  2. **Reconstrucción Determinista:** Ejecutar `docker-compose build && docker-compose up -d` para refrescar la imagen y garantizar monturas persistentes.
  3. **Auto-Detección Inteligente de Endpoint:** En `index.html`, resolver `this.apiEndpoint` dinámicamente: si el origen es `motorvisuales.site` o `localhost:8000`, usar `${origin}/api`; si se corre en local estático (`localhost:8088`), apuntar directamente a `https://motorvisuales.site/api`, permitiendo que el desarrollo local consuma el backend real de producción en vivo sin fricción.
- **Trigger:** Al desplegar APIs y servicios complementarios en Hetzner o conectar interfaces locales con backends en la nube.

---

### L-038
- **Tags:** #android #pwa #mobile #touch #thumb-zone #ergonomics #bottom-sheet #biquad-dsp #haptic #safe-area
- **Síntoma:** En smartphones Android y PWA (< 1024px), las consolas creativas densas sufren de scroll vertical parásito incontrolado, modales flotantes centrados que quedan tapados por el teclado o la barra de gestos, objetivos táctiles menores de 48px que provocan pulsaciones accidentales (*fat-finger*) y desconexión entre el estado gráfico de escritorio y los controles táctiles.
- **Causa raíz:**
  1. **Dimensionamiento del Viewport sin safe areas:** Un canvas superior fijo sin viewport units dinámicas (`dvh`) ni safe area insets colisiona con la barra de gestos de Android o genera desbordamiento vertical forzando scroll en toda la página.
  2. **Contenedores de Scroll no aislados:** Si los paneles tácticos no cuentan con `overscroll-behavior: contain` y `overflow-y: auto` confinado en altura (`max-height: calc(100dvh - 35dvh - 75px)`), el arrastre de faders provoca scroll de la ventana principal rompiendo la interacción en vivo.
  3. **Modales de escritorio en pantallas móviles:** Los modales con `justify-center items-center` obligan al usuario a estirar el pulgar hasta la parte superior de la pantalla para cerrarlos, violando la ergonomía de la *thumb-zone*.
  4. **Falta de feedback sensorial háptico:** En pantallas táctiles capacitivas sin respuesta táctil física, la manipulación de faders de ganancia y mutes instantáneos genera incertidumbre en actuaciones en vivo si no hay micro-vibración háptica (`navigator.vibrate`).
- **Solución:**
  1. **Arquitectura de Dock Fijo Inferior & Thumb-Zone:** Implementar `#mobile-bottom-tab-bar` fija en la base (`bottom-0 z-40`) con padding de `env(safe-area-inset-bottom)` y botones táctiles de 52px, manteniendo todos los controles primarios al alcance natural del pulgar.
  2. **Deck Scrollable Confinado:** Envolver los paneles de control en `.mobile-deck-scrollable` con `overscroll-behavior: contain` y padding inferior compensado (`calc(env(safe-area-inset-bottom, 16px) + 72px)`).
  3. **Bottom Sheets Automáticas en CSS:** Convertir todos los modales en hojas deslizables desde la base (`align-items: flex-end`, `rounded-t-2xl`, max-height 86dvh) mediante media query `@media (max-width: 1023px)`.
  4. **Bucle de Telemetría a 60 FPS Desacoplado:** Sincronizar simultáneamente los elementos DOM de escritorio y móvil dentro de `runAudioDSP()` y `masterRenderLoop()` (vúmetros LED de los 8 stems, telemetría RMS, FPS y medidores de uniforms GLSL).
  5. **Feedback Háptico Resiliente:** Envolver `navigator.vibrate` en función auxiliar protegida con `try/catch` para compatibilidad universal con navegadores móviles.
- **Trigger:** Al diseñar consolas creativas para smartphones, PWAs táctiles o paneles de control densos con requerimientos de uso con una sola mano.

---

### L-039
- **Tags:** #ui-ux #viewport #threejs #resizer #splitter #overflow #toolbar #flex-wrap
- **Síntoma:** Los botones de herramientas del encabezado del visor 3D sobresalen hacia la derecha de la tarjeta sobre el fondo de la página en monitores estándar (1080p), y el usuario no puede alterar la altura del canvas 3D para adaptarlo a su flujo de trabajo.
- **Causa raíz:**
  1. **Contenedor Flex Rígido sin Wrapping:** Una fila horizontal con múltiples selectores y botones de texto largo en `nowrap` excede el ancho disponible cuando la columna de docks de audio está visible.
  2. **Altura Fija en Canvas Three.js:** El elemento `#three-canvas-container` dependía exclusivamente de clases fijas de Tailwind (`h-[580px]`), sin un tirador de separación vertical interactivo.
- **Solución:**
  1. **Toolbar Icon-First con Auto-Wrap:** Implementar `flex-wrap: wrap` en el header, truncar el ancho del selector de escenas y compactar las herramientas secundarias en botones con iconos de 28px y tooltips, expandiendo el texto solo en resoluciones ultra-anchas (`2xl`).
  2. **Splitter Arrastrable en el Borde Inferior:** Añadir `#three-viewport-resizer` en la base del canvas con listeners unificados de ratón (`mousedown/move/up`) y táctil (`touchstart/move/end`), actualizando la altura en tiempo real a 60 FPS sin transiciones parásitas, invocando `triggerThreeResize()`, guardando en `localStorage` y permitiendo reset inmediato con doble clic.
- **Trigger:** Al incorporar múltiples herramientas en barras de herramientas de consolas creativas o requerir redimensionamiento elástico de lienzos WebGL.

---

### L-040
- **Tags:** #android #network #usb-tethering #rndis #policy-routing #tunnel #https #webaudio #pwa
- **Síntoma:** Al intentar acceder al servidor local desde el navegador Chrome en un smartphone Android conectado por cable USB con "Compartir internet por USB" (USB Tethering) a la IP interna asignada (`10.37.227.157:8088`), la conexión expira con `ERR_TIMED_OUT` a pesar de que el ping desde el PC al móvil (`10.37.227.217`) responde con < 1ms.
- **Causa raíz:**
  1. **Policy-Based Routing en Android (Linux kernel / netd):** Todas las aplicaciones de usuario de Android (`UID >= 10000`, como Google Chrome) tienen forzado el enrutamiento de sus sockets hacia la tabla de la interfaz activa con conexión a Internet (habitualmente `wlan0` / Wi-Fi o datos móviles).
  2. **Aislamiento de Interfaz Esclava (Downstream):** La interfaz de anclaje USB (`rndis0`) es gestionada por el daemon de tethering como interfaz esclava (*downstream*) receptora de reenvío NAT hacia la WAN. El kernel de Android no enruta paquetes originados por aplicaciones locales hacia la interfaz `rndis0`. Por tanto, cuando Chrome intenta conectar a `10.37.227.157`, la petición sale por la interfaz Wi-Fi donde esa IP privada no existe, provocando `ERR_TIMED_OUT`.
- **Solución:**
  1. **Túnel Seguro Inmediato con Terminación TLS:** Desplegar un túnel con reenvío de puertos y terminación TLS hacia `localhost:8088` (vía túnel SSH TLS inverso como `ssh -R 80:localhost:8088 nokey@localhost.run` o `cloudflared`). Esto entrega una URL pública HTTPS directa (ej. `https://fd533eea1f4613.lhr.life`) accesible desde Chrome en Android mediante la Wi-Fi habitual, con soporte íntegro para Service Workers, PWA, WebGL y Web Audio API sin pantallas intersticiales.
  2. **Alternativa Privada vía Tailscale:** Aprovechar la interfaz Tailscale activa en el PC (`100.125.237.53`); al conectarse desde la app Tailscale en Android, la conexión se establece a nivel de capa de red virtual (VPN), evitando las limitaciones de enrutamiento del subsistema de tethering.
- **Trigger:** Al intentar acceder a servidores locales de desarrollo desde dispositivos móviles Android conectados mediante anclaje de red por USB.

---

### L-041
- **Tags:** #pwa #android #manifest #scope-extensions #custom-tabs #mobile #ui-order #audio-inputs
- **Síntoma:** Al navegar entre la landing multi-proyecto (`milkdropagent.motorvisuales.site`) y MotorVisuales (`motorvisuales.site`), la PWA se abre con la barra superior del navegador (Chrome Custom Tab con botón X y URL), perdiendo el modo app standalone. Además, en dispositivos móviles, la sección de inputs de sonido quedaba desplazada bajo el visor 3D en lugar de encabezar la experiencia.
- **Causa raíz:**
  1. **Navegación Cross-Subdomain fuera de Scope:** Por especificación de seguridad W3C/Android, navegar a un subdominio no incluido en el `scope` del manifest fuerza a Chrome a abrir una Custom Tab para alertar de un cambio de origen. Al regresar mediante enlaces absolutos forzados (`href`), la sesión queda atrapada dentro del contenedor Custom Tab.
  2. **Jerarquía Visual Invertida en Flex/Grid:** La clase `order-1` en el canvas 3D y `order-2` en la columna de audio relegaba la selección de fuentes de sonido debajo del visor inactivo, forzando al usuario a hacer scroll para iniciar la música.
- **Solución:**
  1. **Scope Extensions & Historial Nativo:** Declarar `"scope_extensions": [{ "origin": "https://milkdropagent.motorvisuales.site" }]` y `"fullscreen"` en `display_override` en [manifest.json](file:///c:/MotorVisuales/manifest.json) para que Chrome trate ambos dominios bajo el mismo shell standalone. En el botón de retroceso `‹`, utilizar `history.back()` condicional si el referrer proviene del ecosistema para no forzar recargas cruzadas.
  2. **Priorización Inmediata de Inputs:** Reasignar `#left-dock-column` a `order-1 lg:order-1` y `#three-viewport-section` a `order-2 lg:order-2`, manteniendo `#sec-audio-bar` visible arriba del todo en móviles con un rack compacto de 3 columnas para Pistas Master y cuadrícula para el Patchbay, con toggleFullscreen de documento completo.
### L-042
- **Tags:** #youtube #mobile #touch-targets #modals #dom-nesting #pip #android #audio-ingest
- **Síntoma:** Al pulsar el botón de opciones `⚙️` junto a "YouTube Móvil" en el smartphone Android no abría ningún diálogo; además, pulsar el botón principal "YouTube Móvil" reproducía forzosamente la pista de demostración `section-63.mp3` en lugar de permitir reproducir el vídeo real que el usuario estaba viendo en su móvil (como YouTube en ventana flotante PiP o por altavoz).
- **Causa raíz:**
  1. **Anidación Oculta de Modales en el DOM:** `#stems-export-modal` carecía de etiquetas de cierre adecuadas, provocando que `#yt-mobile-modal` quedara como nodo hijo de un contenedor con clase `hidden`. Aunque JavaScript ejecutara `classList.remove('hidden')` en el modal hijo, la propiedad CSS `display: none` heredada del ancestro impedía su renderizado en pantalla.
  2. **Touch Targets Subdimensionados en Móvil:** El botón de configuración `⚙️` medía únicamente ~24px de ancho, por debajo de los 44–48px recomendados por directrices W3C/Android/iOS para interacción táctil con el pulgar.
  3. **Comportamiento Hardcoded de Fuente:** `selectYouTubeMobileSource()` invocaba incondicionalmente `playPresetTrack('section-63.mp3')` y el modal destacaba esa demo como "Método 0 Recomendado", ocultando la entrada de URL al final del modal.
- **Solución:**
  1. **Aislamiento Estricto de Modales a Nivel de Body:** Reestructurar los modales para que todos sean hijos directos de `body`, auditando el balance de etiquetas con analizador sintáctico para garantizar profundidad nula en la raíz de cada overlay.
  2. **Unificación Ergonómica y Touch Targets >= 44px:** Dotar al botón de opciones de un área táctil mínima de 44x38px (`min-w-[44px] min-h-[38px] active:scale-90`) y hacer que tanto el botón principal `[YT] YouTube Móvil` como `⚙️` abran directamente el Asistente Modal de Ingesta con feedback háptico (`triggerHaptic(15)`).
  3. **Jerarquía Centrada en Casos de Uso Reales:** Rediseñar `#yt-mobile-modal` situando en primer lugar el campo para pegar enlace de YouTube con botón `[📋 Pegar]` (vía `navigator.clipboard.readText`) y auto-detección de portapapeles, seguido de la **Escucha Acústica en Vivo (Método 2)** para usuarios con YouTube reproduciendo en ventana flotante PiP o por altavoz con preamp 4.5x adaptativo sin cortar el vídeo, relegando las canciones de demo (Section 63, Mordaza, Tontos Útiles) a una cuadrícula de pruebas opcionales.
- **Trigger:** Al depurar modales que no responden tras llamadas a `classList.remove('hidden')`, botones táctiles difíciles de pulsar o flujos de ingesta multimedia que fuerzan pistas de prueba fijas.

---

### L-043
- **Tags:** #mobile-ui #split-screen #100dvh #zero-scroll #layout-overflow #responsive #inline-styles #tactical-deck
- **Síntoma:** En la emulación o visualización adaptable en smartphone (< 1024px), el documento web se estiraba verticalmente hasta ~2915px para poder visualizar todo el contenido de la pantalla principal, forzando scroll vertical continuo y rompiendo la experiencia de aplicación nativa.
- **Causa raíz:**
  1. **Apilamiento Secuencial de Contenedores:** La columna izquierda (`#left-dock-column`) y el visor 3D (`#three-viewport-section`) se renderizaban en serie en el flujo vertical, seguido del deck modular táctico (`#mobile-tactical-deck`) y de los racks pesados de escritorio (`#tier2-studios` y `#tier2-subgrid`), los cuales no eran ocultados adecuadamente en móvil por `syncResponsiveLayout()`.
  2. **Duplicidad de Controles de Audio:** Los controles de audio se mostraban dos veces: arriba en `#sec-audio-bar` y abajo dentro de `m-panel-audio` en el deck táctico.
  3. **Sobreescritura por Estilos Inline del Resizer:** El tirador `#three-viewport-resizer` inyectaba alturas en píxeles fijos (`style.height = ...px`) al arrastrar o restaurar desde `localStorage` en resoluciones `>= 640px`, anulando la clase CSS `35dvh` en tablets y simuladores móviles.
- **Solución:**
  1. **Arquitectura Split-Screen 100dvh Fija:** Aplicar `height: 100dvh !important; overflow: hidden !important; overscroll-behavior: none !important;` en `html, body`, fijar `main` y `#v4-view-live-runner` a `calc(100dvh - 46px)` con `display: flex; flex-direction: column; overflow: hidden;`.
  2. **Aislamiento DOM Quirúrgico:** Ocultar en móvil `#left-dock-column` (`hidden lg:block`), `#three-viewport-resizer` (`hidden lg:flex`) y garantizar que `syncResponsiveLayout()` oculte `tier2Subgrid` y `tier2Studios` en móvil.
  3. **Limpieza Dinámica de Alturas:** En `syncResponsiveLayout()`, limpiar `container.style.height = ''` y `maxHeight = ''` en móvil para que las reglas CSS del 35dvh rijan sin interferencias, y condicionar la restauración de altura de escritorio a `window.innerWidth >= 1024`.
  4. **Inputs de Audio en Cabecera del Deck:** Reordenar `m-panel-audio` para situar las Pistas Master y el Patchbay inmediatamente al principio del deck táctico modular.
- **Trigger:** Al depurar alturas verticales desmedidas o scroll parásito en visualizadores y consolas adaptables móviles.

---

### L-044
- **Tags:** #mobile #html-nesting #dom-tree #flex #tier2 #tactical-deck #split-screen
- **Síntoma:** En la vista móvil (< 1024px), la sección "Director de Arte IA Multimodal" aparecía indebidamente visible debajo del visor 3D, y el deck táctico modular (`#mobile-tactical-deck`) quedaba aplastado a una altura de ~68px.
- **Causa raíz:** Un tag `</div>` espurio en el cierre del editor de shaders cerraba prematuramente `<div id="tier2-studios">`, provocando que `<div id="tier2-subgrid">` quedara como hijo directo de `#v4-view-live-runner`. Al ser un `div.grid` hijo directo, la regla CSS de layout móvil `#v4-view-live-runner > div.grid` le aplicaba `display: flex !important`, ignorando su clase `hidden` y dividiendo la altura flex con el deck táctico.
- **Solución:** Eliminar el `</div>` redundante, manteniendo a `tier2-subgrid` dentro de `tier2-studios` (`hidden lg:block`). Con esto, `tier2-studios` se mantiene en `display: none` en móviles y el deck táctico modular `#mobile-tactical-deck` expande limpiamente a los ~55dvh con scroll interno fluido.
- **Trigger:** Al depurar visibilidad no deseada de paneles o colapso de altura en contenedores flex/grid en móviles.








