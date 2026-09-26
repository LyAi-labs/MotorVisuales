---
name: Cybernetic AV Workstation
colors:
  surface: '#121318'
  surface-dim: '#121318'
  surface-bright: '#38393f'
  surface-container-lowest: '#0d0e13'
  surface-container-low: '#1a1b21'
  surface-container: '#1e1f25'
  surface-container-high: '#292a2f'
  surface-container-highest: '#34343a'
  on-surface: '#e3e1e9'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e3e1e9'
  inverse-on-surface: '#2f3036'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dce6'
  primary: '#e0fdff'
  on-primary: '#00373a'
  primary-container: '#00f2fe'
  on-primary-container: '#006a70'
  inverse-primary: '#00696f'
  secondary: '#fface9'
  on-secondary: '#5d0054'
  secondary-container: '#ad009c'
  on-secondary-container: '#ffc8ed'
  tertiary: '#e1ffec'
  on-tertiary: '#003824'
  tertiary-container: '#67f4b7'
  on-tertiary-container: '#006e4b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ff6ff'
  primary-fixed-dim: '#00dce6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#ffd7f1'
  secondary-fixed-dim: '#fface9'
  on-secondary-fixed: '#3a0033'
  on-secondary-fixed-variant: '#840077'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#121318'
  on-background: '#e3e1e9'
  surface-variant: '#34343a'
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.12em
  telemetry-xs:
    fontFamily: JetBrains Mono
    fontSize: 9px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.15em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.5rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-mobile: 0.75rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system projects an uncompromising, high-precision instrument aesthetic tailored for creative technologists, audio engineers, demoscene coders, and live visual performers. It bridges the tactical precision of a professional Digital Audio Workstation (DAW) with the generative dynamism of real-time GPU shader environments and demoscene software.

### Aesthetic Pillars
- **Cyber-Tactile Instrument:** Interfaces are treated as calibrated hardware consoles translated to the browser. Every control conveys state, signal path, and dynamic feedback through luminous accents rather than arbitrary decoration.
- **Deep Space Immersion:** High-contrast dark field substrates isolate visualizers and live spectral feedback, eliminating ambient visual pollution.
- **Glassmorphic Precision:** Semi-translucent panels with frosted refraction (`backdrop-filter: blur(12px)`) maintain awareness of background 3D canvas renderers and GLSL buffers without sacrificing legibility.
- **Telemetry-Driven Clarity:** Micro-typography, technical metrics, frequency band indicators, and real-time state badges mimic high-end avionics and modular synthesizer racks.

## Colors

The palette operates in a calibrated dark-field space where neon wavelengths signal active computation, audio amplitude, and pipeline state.

### Core Swatches
- **Primary (`#00f2fe`):** Hyper-cyan. Designated for primary interactive nodes, active fader thumbs, selected visual nodes, and signal focus indicators.
- **Secondary (`#f355da`):** Laser magenta. Governs AI generative directives, GLSL live compilation warnings/highlights, and stem layer 2 routing.
- **Tertiary (`#10b981`):** Electric phosphor green. Standard safe-level audio telemetry, active DSP stem state, and nominal frame-rate (60 FPS) readouts.
- **Neutral (`#0a0b10`):** Obsidian void. Core application canvas and baseline viewport substrate.

### Functional & Signal Accents
- **Peak / Warning Amber (`#f59e0b`):** Signal saturation, -3dB pre-clipping, and GPU memory pressure alerts.
- **Clip / Error Crimson (`#ef4444`):** 0dB audio clipping, GLSL syntax errors, and pipeline dropouts.
- **Surface Elevation 1 (`#10121a`):** Base panel chassis and rack dividers.
- **Surface Elevation 2 (`#161926`):** Modular rack cards, code editor gutter, and active channel strips.
- **Surface Elevation 3 (`#1f2438`):** Hover states, active modal frames, and popover layers.
- **Border Ghost (`rgba(0, 242, 254, 0.15)`): Crisp instrument borders and slot outlines.

## Typography

Typography functions as a structural grid element. Space Grotesk delivers geometric, sharp, modern framing for primary UI hierarchy and navigation, while JetBrains Mono provides tabular numerical alignment and syntactic clarity for live coding, telemetry, and hardware knobs.

### Rules of Application
- All telemetry indicators, dB meters, timecode counters, and frequency bins must use `label-sm` or `telemetry-xs` with uppercase transformation and tabular figure alignment (`font-variant-numeric: tabular-nums`).
- Live shader editors and node expression fields strictly render in `code-md` or `code-sm` to maintain character-grid vertical alignment.
- Headlines maintain dense line heights and tight tracking to preserve compact vertical screen real estate for viewport visualization.

## Layout & Spacing

The layout employs an ultra-dense, responsive cockpit grid designed to prioritize uninterrupted visualizer viewports while keeping multi-channel stem controls within thumb or peripheral reach.

### Grid & Layout Structure
- **Desktop (1440px+):** Tri-panel docking workstation.
  - Left dock: DSP Stems mixer & Audio Signal chain (width: 320px).
  - Center viewport: Three.js canvas / WebGL viewport (fluid 1fr) with floating overlay HUDs.
  - Right dock: Collapsible GLSL Live Coding Console & AI Art Director inspector (width: 420px).
  - Bottom strip: Transport controls, master oscilloscope, and global timeline (height: 96px).
- **Tablet / Laptop (1024px - 1439px):** Side panels convert to slide-over drawers with persistent icon tabs; viewport remains primary.
- **Mobile (<1023px):** Single-pane viewport with modular modal sheets for channel strips and GLSL syntax terminals.

### Rhythmic Density
- The system enforces a strict 4px grid baseline (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 16px).
- Gutters within parameter panels are fixed at `gutter-sm` (8px) to maximize parameter density and minimize scroll exhaustion during live performances.

## Elevation & Depth

Visual hierarchy does not rely on traditional drop shadows, which muddy dark canvas scenes. Depth is achieved strictly through tonal layering, glassmorphic refraction, and laser-edge luminescent outlines.

### Depth Hierarchy
- **Level 0 (Canvas Surface):** Pure `#0a0b10` background or direct Three.js / WebGL output viewport.
- **Level 1 (Docked Racks & Panels):** `#10121a` at 85% opacity with `backdrop-filter: blur(16px)` and a subtle interior border: `1px solid rgba(255, 255, 255, 0.05)`.
- **Level 2 (Active Cards & Channel Modules):** `#161926` at 90% opacity, bordered by `1px solid rgba(0, 242, 254, 0.12)`.
- **Level 3 (Modals, Context Trays, Floating HUDs):** `#1f2438` at 95% opacity with ambient cyan back-glow: `box-shadow: 0 0 24px -4px rgba(0, 242, 254, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.1)`.
- **Level 4 (Active Focus / Dragged Node):** Dynamic reactive glow: `box-shadow: 0 0 16px 0px rgba(0, 242, 254, 0.45)`.

## Shapes

The interface embraces a chamfered, high-precision technical profile. Roundedness is strictly constrained to Level 1 (`rounded` = 0.25rem / 4px, `rounded-lg` = 0.5rem / 8px).

### Geometrics
- **Panels and Channel Strips:** 4px radius edges. Clean, geometric, and modular, permitting seamless zero-gap stacking.
- **Terminal & Monitor Frames:** 4px radius with optional cut-corner chamfers (via CSS `clip-path`) on primary visualizer controls to reinforce the avionics/demotool aesthetic.
- **Controls & Knobs:** Circular dials and pill toggles are reserved strictly for circular hardware paradigms (e.g., pan pots, rotary encoders, and bypass switches).

## Components

### Buttons & Transport Controls
- **Primary Cyber Button:** Height 36px. Border radius 4px. Cyan solid fill (`#00f2fe`) with obsidian typography (`#0a0b10`, `JetBrains Mono`, bold). Hover introduces a cyan radiance: `box-shadow: 0 0 16px rgba(0, 242, 254, 0.6)`. Active state shifts to magenta (`#f355da`).
- **Ghost Tactical Button:** Transparent fill, `1px solid rgba(0, 242, 254, 0.25)`, uppercase monospace label. Hover shifts border to 100% opacity with cyan text illumination.
- **Transport Toggles (Play, Record, Loop):** Square 40x40px modules. Active recording glows electric crimson (`#ef4444`) with pulsing indicator telemetry.

### Audio Faders & Rotary Knobs
- **Vertical Stem Fader:** Track width 4px with a background of `#161926` and luminous track fill showing current audio level. Thumb: 16x24px chamfered block in `#00f2fe` with knurled grip lines. Includes a floating `JetBrains Mono` dB display readout on hover and drag.
- **Rotary Parameter Knobs:** Dual-ring SVG controllers. Inner ring indicates current value using an open arc of cyan or violet; center displays the raw parameter float value.

### Telemetry Badges & Status Chips
- **Format:** Micro-capsules with 2px border radius, heights of 18px-22px, padding of 0 6px.
- **Color Coding:** 
  - `SYNC / 60FPS`: Phosphor green background (`rgba(16, 185, 129, 0.1)`), green text and active blinking pip.
  - `AI DIRECTING`: Magenta background (`rgba(243, 85, 218, 0.12)`), magenta border and text.
  - `DSP CLIP`: Crimson background (`rgba(239, 68, 68, 0.15)`), red text.

### Oscilloscopes & Visualizer Nodes
- **Signal Displays:** Embedded SVG/Canvas screens framed with `#161926` and `1px solid rgba(0, 242, 254, 0.2)`. Background features a 10px technical grid in `rgba(0, 242, 254, 0.05)`.
- **Waveform Lines:** Anti-aliased 1.5px paths rendered with drop-shadow neon glow matching the track's stem assignment (Cyan: Vocals/Lead, Magenta: Bass/Synth, Green: Drums/Percussion).

### Input Fields & GLSL Terminal
- **Inputs:** Dark field `#10121a` with inset border `1px solid rgba(255, 255, 255, 0.08)`. Focus states trigger a `1px solid #00f2fe` stroke and cyan inner glow. Text in `JetBrains Mono`.
- **Live Code Panel:** Dark obsidian slate (`#07080c`) with line numbers in muted gray-blue (`#4b5563`). Active cursor is an amber block with steady blink. Syntax highlighting strictly uses primary cyan, secondary magenta, amber, and phosphor green.

### Modular Cards & Rack Mounts
- **Module Enclosure:** 4px radius with a dedicated top header bar (height 28px) displaying module name in `label-sm`, hardware slot index (e.g., `SLOT::04`), and bypass toggles.
- **Mute / Solo Triggers:** Compact, dual-state buttons. Solo renders bright amber (`#f59e0b`), Mute renders muted red (`rgba(239, 68, 68, 0.4)`).