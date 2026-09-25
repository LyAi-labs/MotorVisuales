# 🎛️ MotorVisuales

**Motor de Visualización y Síntesis Gráfica Reactiva en Tiempo Real**

MotorVisuales es una plataforma WebGL de alto rendimiento diseñada para la generación de gráficos procedurales, visuales para directos y conciertos, y síntesis artística guiada por Inteligencia Artificial y análisis espectral de audio (DSP).

---

## 🚀 Características Principales

### 1. 🎵 Ingesta de Audio Multi-Canal
- **Micrófono en vivo**: Procesamiento de baja latencia con Web Audio API.
- **Pistas Locales / MP3**: Reproductor integrado con scrubber, bucle y soporte CORS.
- **Captura de Pestaña**: Ingesta de audio digital directo desde YouTube u otras fuentes sin eco.
- **Sintetizador Procedural**: Generador de ritmos a 124 BPM (Kick, Snare, Hi-Hat, Bassline).

### 2. 🎚️ Banco de 8 Stems Biquad DSP
Aislamiento espectral en 8 bandas de frecuencias independientes:
1. **Sub-Graves** (`<60Hz`)
2. **Graves** (`60-250Hz`)
3. **Medios-Bajos** (`250-500Hz`)
4. **Medios** (`500-2kHz`)
5. **Medios-Altos** (`2k-4kHz`)
6. **Presencia** (`4k-6kHz`)
7. **Agudos** (`6k-10kHz`)
8. **Aire** (`>10kHz`)

### 3. 📊 Telemetría y Modelo Afectivo MER
- **Métricas Acústicas en Vivo**: RMS, Centroide Espectral, Flujo Espectral, Tasa de Cruces por Cero (ZCR) y Frecuencia de Rolloff (85%).
- **Detección de Transitorios / Beats**: Algoritmo onset basado en flujo y energía sub/bass.
- **Modelo MER 2D Russell**: Espacio afectivo Valencia × Arousal con seguimiento automático.

### 4. 🌌 Motor Gráfico 3D (Three.js WebGL)
- **Escena 1 — Nebulosa Cuántica**: 30.000 partículas volumétricas con shaders GLSL personalizados y halo glow.
- **Escena 2 — Túnel Infinito**: Estructura cilíndrica de deformación continua modulada por tempo.
- **Escena 3 — Monolito Icosaédrico**: Geometría cristalina con wireframe reactivo.
- **Escena 4 — Shader GLSL Studio**: Quad a pantalla completa con Hot-Reload WebGL en caliente y consola de errores en GPU.

### 5. 🎥 Cámara Cinemática Orbital & Post-Procesado
- **4 Modos de Órbita**: Circular 360°, Espiral Vertical, Lemniscata ∞ y Vuelo Dramático Fly-by.
- **Post-Procesado FX**: Unreal Bloom reactivo y Aberración Cromática (ShaderPass) modulados por transitorios.
- **Grabador de Video**: Exportación en tiempo real a WebM a 60 FPS con audio mezclado sincronizado.

### 6. ✨ Director de Arte con IA Generativa (Google Gemini API)
- Agente multimodal que interpreta métricas de audio y estado emocional para generar prompts artísticos y paletas de color dinámicas que transforman la iluminación y materiales en vivo.

---

## 🛠️ Puesta en Marcha Local

Para ejecutar MotorVisuales localmente:

```bash
# Iniciar servidor estático en el puerto 8088
python -m http.server 8088
```

Abre en tu navegador:
👉 **`http://localhost:8088`**

---

## 📂 Estructura del Proyecto

```
MotorVisuales/
├── index.html        # Aplicación completa (Frontend, DSP, WebGL, UI)
├── three.min.js      # Librería Three.js r128 local
├── tema.mp3          # Pista de audio de prueba ("Mordaza")
├── MEMORY.md         # Arquitectura técnica y memoria del proyecto
├── LESSONS.md        # Registro de lecciones y soluciones técnicas
├── DECISIONS.md      # Registro de decisiones de arquitectura (ADRs)
└── README.md         # Documentación general
```

---

## 📜 Licencia
Proyecto desarrollado por **LyAi-labs**. Todos los derechos reservados.
