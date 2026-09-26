---
name: antigravity-design-expert
description: >-
  Expert guide for designing spatial, dimensional, weightless, and highly interactive user interfaces.
  Use when designing floating HUDs, 3D CSS transforms, advanced glassmorphism, focal depth layers,
  physics-based motion, and immersive spatial web experiences.
---

# Antigravity Design Expert

Guía de diseño para interfaces espaciales, ingrávidas (*weightless*) y con profundidad dimensional tridimensional. Especializada en experiencias inmersivas, consolas de audio/video y dashboards de nueva generación.

---

## 1. Principios Fundamentales del Diseño Antigravedad

1. **Ingravidez Visual (*Weightlessness*):**
   - Los elementos de control no reposan de forma rígida sobre el fondo; flotan sobre la escena con distintos niveles de elevación en el eje Z.
   - Utilizar docks flotantes tipo píldora (`border-radius: 9999px` o `rounded-2xl`), barras desacopladas y tarjetas suspendidas.

2. **Profundidad Focal y Capas Z:**
   - **Plano 0 (Base / Canvas):** Escena 3D WebGL o contenido visual a pantalla completa.
   - **Plano 1 (Atmósfera):** Sombras de oclusión ambiental suaves (`box-shadow: 0 20px 50px rgba(0,0,0,0.7)`).
   - **Plano 2 (Cristal / Racks):** Superficies translúcidas con refracción óptica (`backdrop-filter: blur(16px)`).
   - **Plano 3 (Controles Activos):** Indicadores luminiscentes, sliders activos y tooltips flotantes.

3. **Refracción Óptica y Glassmorphism Avanzado:**
   - **Fondo:** `background: rgba(10, 12, 20, 0.75)` a `rgba(18, 20, 32, 0.85)`.
   - **Filtro de desenfoque:** `backdrop-filter: blur(16px) saturate(180%)`.
   - **Borde especular:** No usar bordes planos opacos. Usar `border: 1px solid rgba(255, 255, 255, 0.12)`.
   - **Reflejo de borde superior:** `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 10px 30px rgba(0, 0, 0, 0.5)`.

---

## 2. Transformaciones 3D y Espacio Perspectivo

Para interfaces que reaccionan al cursor o a la orientación:
```css
.spatial-container {
    perspective: 1200px;
    transform-style: preserve-3d;
}

.spatial-card {
    transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    will-change: transform;
}

.spatial-card:hover {
    transform: translateZ(12px) rotateX(2deg) rotateY(-2deg);
}
```

---

## 3. Microinteracciones Cinemáticas y Motion

- **Aceleración por GPU:** Usar exclusivamente `transform` y `opacity` para animaciones a 60/120 FPS.
- **Curvas de Tiempo Físicas:**
  - Despliegue de paneles: `cubic-bezier(0.16, 1, 0.3, 1)` (Out-Expo / rebote elástico suave).
  - Hover states: `cubic-bezier(0.4, 0, 0.2, 1)` (150ms).
- **Indicadores de Estado Pulsantes:**
  - Micro-luces LED con `box-shadow: 0 0 12px currentColor`.

---

## 4. Checklist para Implementar Diseños Antigravedad

- [ ] ¿El canvas 3D o visual principal respira libremente sin verse asfixiado por cajas sólidas opacas?
- [ ] ¿Los paneles HUD cuentan con desenfoque de fondo (`backdrop-filter`) y borde especular sutil?
- [ ] ¿Los botones y píldoras flotantes tienen contraste suficiente sobre fondos oscuros o claros?
- [ ] ¿Las micro-interacciones ocurren con transiciones aceleradas por hardware sin bloquear el render loop?
