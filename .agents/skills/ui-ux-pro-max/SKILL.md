---
name: ui-ux-pro-max
description: >-
  Systematic design intelligence for professional-grade, multi-platform UI/UX, complex dashboards,
  and dense production consoles. Use when designing design systems, dense toolbars, rack layouts,
  ergonomic sliders, precision controls, font pairings, visual hierarchies, and accessibility standards.
---

# UI/UX Pro Max

Sistema integral de inteligencia de diseño y ergonomía para software creativo profesional, consolas densas de audio/video (DAWs, VJing, 3D Suites) y dashboards de producción.

---

## 1. Sistema de Espaciado y Cuadrícula (8pt / 4pt Grid)

- **Unidad base:** 4px para microespacios y paddings internos; 8px para márgenes y layouts.
- **Jerarquía de Espaciado:**
  - `p-1` (4px): Espaciado entre iconos y etiquetas compactas.
  - `p-2` (8px): Padding interno de tarjetas de control y botones compactos.
  - `p-3` o `p-3.5` (12-14px): Padding de contenedores de rack.
  - `gap-2` (8px) o `gap-3` (12px): Separación estándar entre módulos interactivos.

---

## 2. Ergonomía de Consolas Profesionales (DAW / Studio Rack)

1. **Agrupación Modular en Racks:**
   - Organizar controles en módulos temáticos autocontenidos (ej. DSP, Generación, Post-Procesado, Cámara).
   - Cada rack debe poseer su propia barra de cabecera con toggles maestros ("Todo ON", "Todo OFF", "Reset").
2. **Controles de Alta Precisión:**
   - **Sliders de Rango:** Acompañados siempre de valor numérico editable o legible a la derecha con ancho fijo (`w-6` a `w-8`) para evitar saltos de layout cuando el número cambia de decimales.
   - **Selectores de Menú:** Estilo oscuro con bordes sutiles, cursor pointer y contraste mínimo de 4.5:1.
   - **Toggles / Switches:** Estado activo resaltado con color temático (cyan, pink, amber) y estado inactivo en gris neutral desaturado (`text-zinc-500`, `border-white/10`).

---

## 3. Armonía Cromática en Modo Oscuro (Dark Theme Optics)

- **Fondo Primario:** `#050508` a `#09090b` (no negro puro `#000000` plano, para evitar halos de contraste extremo).
- **Superficies de Tarjetas:** `#121217` o `#18181b` con borde `rgba(255, 255, 255, 0.08)`.
- **Paleta de Acentos Funcionales:**
  - **Cyan / Teal (`#06b6d4`, `#22d3ee`):** Audio DSP, telemetría y flujo primario.
  - **Rosa / Fucsia (`#ec4899`, `#f43f5e`):** Shaders GLSL, transitorios y distorsión.
  - **Ámbar / Oro (`#f59e0b`, `#fbbf24`):** Advertencias, parámetros físicos y dinámica.
  - **Esmeralda / Verde (`#10b981`, `#34d399`):** Estado OK, render 60 FPS y éxito.

---

## 4. Tipografía y Jerarquía de Información

- **Textos de UI y Etiquetas:** Fuente sans-serif neutra y legible (`system-ui`, `-apple-system`, `Inter`, `Roboto`).
- **Valores Numéricos y Telemetría:** Fuente monoespaciada (`font-mono`, `ui-monospace`, `Courier New`) para garantizar alineación numérica vertical en tiempo real sin trepidación horizontal.
- **Tamaños Estrictos:**
  - Micro-etiquetas y badges: `9px` a `10px` (`text-[9px]`, `text-[10px]`, `uppercase`, `tracking-wider`).
  - Textos de control: `11px` a `12px` (`text-xs`).
  - Títulos de sección: `13px` a `14px` (`text-sm`, `font-bold`).

---

## 5. Estados Interactivos (Feedback en Tiempo Real)

- **Hover:** Aumento sutil de luminosidad en el fondo (`hover:bg-zinc-800`), borde iluminado (`hover:border-cyan-500/40`) y cambio de cursor.
- **Active / Drag:** Feedback táctil inmediato.
- **Tooltips:** Los controles no deben ser misteriosos; cada slider o botón debe informar al usuario qué parámetro modifica y cómo responde.
