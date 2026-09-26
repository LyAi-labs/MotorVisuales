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






