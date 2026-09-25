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

