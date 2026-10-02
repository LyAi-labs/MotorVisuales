/**
 * ProjectShowcaseTooltip — Vanilla JS Port & Enhancement
 * Inspired by: https://21st.dev/@jatin-yadav05/components/project-showcase
 * Ported & adapted for MotorVisuales: Zero-bloatware, Pure Vanilla JS, Lerp physics & glassmorphism.
 *
 * Subeleganza en tooltips/hover cards:
 * - Cancela el tooltip nativo del navegador (title="...") y lo sustituye por un HUD flotante.
 * - Física Lerp con requestAnimationFrame a 60 FPS (cero lag, reposo a 0% CPU).
 * - Detección inteligente de bordes de pantalla y volteo automático arriba/abajo.
 * - Badges de categoría dinámicos, atajos de teclado en estilo keycap mecánico y telemetría en vivo.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ProjectShowcase = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Inyección de estilos CSS optimizados para GPU
    const CSS_STYLES = `
        /* ─── MotorVisuales Cyber-Showcase Floating HUD Tooltip ─────────────────── */
        .mv-showcase-hud {
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 999999;
            width: max-content;
            max-width: 320px;
            opacity: 0;
            visibility: hidden;
            transform: translate3d(-9999px, -9999px, 0) scale(0.94);
            transform-origin: center bottom;
            transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.18s;
            will-change: transform, opacity;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .mv-showcase-hud.is-visible {
            opacity: 1;
            visibility: visible;
        }

        .mv-showcase-hud .mv-hud-card {
            position: relative;
            padding: 11px 14px;
            background: rgba(9, 11, 20, 0.92);
            backdrop-filter: blur(20px) saturate(190%);
            -webkit-backdrop-filter: blur(20px) saturate(190%);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 14px;
            box-shadow: 
                inset 0 1px 0 0 rgba(255, 255, 255, 0.22),
                0 18px 45px -10px rgba(0, 0, 0, 0.9),
                0 0 25px -4px var(--hud-glow-color, rgba(34, 211, 238, 0.25));
            overflow: hidden;
        }

        /* Micro-línea especular en el borde superior */
        .mv-showcase-hud .mv-hud-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 15%;
            right: 15%;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--hud-accent-color, #22d3ee), transparent);
            opacity: 0.95;
        }

        .mv-hud-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
        }

        .mv-hud-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 2px 7px;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .mv-hud-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: var(--hud-accent-color, #22d3ee);
            box-shadow: 0 0 8px var(--hud-accent-color, #22d3ee);
            animation: mvHudDotPulse 2s infinite ease-in-out;
        }

        @keyframes mvHudDotPulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
        }

        .mv-hud-category {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.08em;
            color: var(--hud-accent-color, #22d3ee);
            text-transform: uppercase;
        }

        .mv-hud-keycap {
            display: inline-block;
            padding: 1.5px 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 9px;
            font-weight: 700;
            color: #e4e4e7;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 4px;
            box-shadow: 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .mv-hud-title-wrap {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .mv-hud-icon {
            font-size: 13px;
            line-height: 1;
            flex-shrink: 0;
        }

        .mv-hud-title {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.01em;
            color: #ffffff;
            line-height: 1.3;
            margin: 0;
        }

        .mv-hud-desc {
            font-size: 11px;
            line-height: 1.45;
            color: #a1a1aa;
            margin: 5px 0 0 0;
        }

        .mv-hud-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 8.5px;
            color: #71717a;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        .mv-hud-telemetry {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #a1a1aa;
        }

        .mv-hud-telemetry-dot {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 6px #10b981;
        }

        .mv-hud-action {
            color: var(--hud-accent-color, #22d3ee);
            opacity: 0.95;
            font-weight: 700;
        }

        /* ─── Paletas temáticas dinámicas ─── */
        .mv-hud-theme-cyan {
            --hud-accent-color: #22d3ee;
            --hud-glow-color: rgba(34, 211, 238, 0.28);
        }
        .mv-hud-theme-sky {
            --hud-accent-color: #38bdf8;
            --hud-glow-color: rgba(56, 189, 248, 0.28);
        }
        .mv-hud-theme-purple {
            --hud-accent-color: #c084fc;
            --hud-glow-color: rgba(192, 132, 252, 0.28);
        }
        .mv-hud-theme-amber {
            --hud-accent-color: #f59e0b;
            --hud-glow-color: rgba(245, 158, 11, 0.28);
        }
        .mv-hud-theme-emerald {
            --hud-accent-color: #34d399;
            --hud-glow-color: rgba(52, 211, 153, 0.28);
        }
        .mv-hud-theme-teal {
            --hud-accent-color: #2dd4bf;
            --hud-glow-color: rgba(45, 212, 191, 0.28);
        }
        .mv-hud-theme-rose {
            --hud-accent-color: #fb7185;
            --hud-glow-color: rgba(251, 113, 133, 0.28);
        }
        .mv-hud-theme-indigo {
            --hud-accent-color: #818cf8;
            --hud-glow-color: rgba(129, 140, 248, 0.28);
        }
    `;

    // Diccionario de enriquecimiento estético para botones del sistema
    const FEATURE_REGISTRY = {
        'presets': {
            category: 'CLOUD HUB',
            title: 'Hub de Presets Comunitarios Cloud',
            desc: 'Explora, descarga y sincroniza presets audiovisuales en la nube comunitaria de MotorVisuales.',
            shortcut: 'PRESETS',
            theme: 'sky',
            icon: '🌐'
        },
        'hub de presets comunitarios cloud': {
            category: 'CLOUD HUB',
            title: 'Hub de Presets Comunitarios Cloud',
            desc: 'Explora, descarga y sincroniza presets audiovisuales en la nube comunitaria de MotorVisuales.',
            shortcut: 'PRESETS',
            theme: 'sky',
            icon: '🌐'
        },
        'pista': {
            category: 'AUDIO ENGINE',
            title: 'Reproducir Pista de Referencia',
            desc: 'Inicia la reproducción de la pista activa con análisis FFT y descomposición de stems en tiempo real.',
            shortcut: 'PLAY',
            theme: 'cyan',
            icon: '▶'
        },
        'mic': {
            category: 'AUDIO INGEST',
            title: 'Ingesta de Micrófono en Vivo',
            desc: 'Captura señal acústica en vivo desde la tarjeta de sonido o micrófono con latencia ultra-baja.',
            shortcut: 'MIC',
            theme: 'cyan',
            icon: '🎙️'
        },
        'cam': {
            category: 'VISION FEED',
            title: 'Cámara Web en Tiempo Real',
            desc: 'Alimenta el stream de video externo como sampler dinámico y textura UV para los shaders WebGL.',
            shortcut: 'CAM',
            theme: 'teal',
            icon: '📹'
        },
        'cámara en vivo': {
            category: 'VISION FEED',
            title: 'Cámara Web en Tiempo Real',
            desc: 'Alimenta el stream de video externo como sampler dinámico y textura UV para los shaders WebGL.',
            shortcut: 'CAM',
            theme: 'teal',
            icon: '📹'
        },
        'synth': {
            category: 'DSP SYNTH',
            title: 'Sintetizador Procedural',
            desc: 'Generador de ondas puras y armónicos matemáticos para pruebas de respuesta en frecuencia.',
            shortcut: 'SYNTH',
            theme: 'amber',
            icon: '⚡'
        },
        'creador ia': {
            category: 'AI AGENT',
            title: 'Director Creativo Autónomo (Auto-VJ)',
            desc: 'Agente autónomo que muta paletas cromáticas, geometrías y parámetros reactivos al compás del tempo.',
            shortcut: 'AUTO-VJ',
            theme: 'purple',
            icon: '✨'
        },
        'creador ia autónomo (auto-vj & mutación)': {
            category: 'AI AGENT',
            title: 'Director Creativo Autónomo (Auto-VJ)',
            desc: 'Agente autónomo que muta paletas cromáticas, geometrías y parámetros reactivos al compás del tempo.',
            shortcut: 'AUTO-VJ',
            theme: 'purple',
            icon: '✨'
        },
        'génesis': {
            category: 'AI GENERATIVE',
            title: 'Génesis Autónoma de Arte',
            desc: 'Re-concibe los visuales desde cero creando combinaciones armónicas y paletas cromáticas inéditas.',
            shortcut: 'GENESIS',
            theme: 'purple',
            icon: '🔮'
        },
        'génesis autónoma de arte': {
            category: 'AI GENERATIVE',
            title: 'Génesis Autónoma de Arte',
            desc: 'Re-concibe los visuales desde cero creando combinaciones armónicas y paletas cromáticas inéditas.',
            shortcut: 'GENESIS',
            theme: 'purple',
            icon: '🔮'
        },
        'vj': {
            category: 'VJ TIMELINE',
            title: 'Timeline & Secuenciador VJ',
            desc: 'Despliega la línea de tiempo para programar disparos de clips, automatizaciones y transiciones.',
            shortcut: 'VJ',
            theme: 'teal',
            icon: '⏱️'
        },
        'plegar / desplegar timeline vj': {
            category: 'VJ TIMELINE',
            title: 'Timeline & Secuenciador VJ',
            desc: 'Despliega la línea de tiempo para programar disparos de clips, automatizaciones y transiciones.',
            shortcut: 'VJ',
            theme: 'teal',
            icon: '⏱️'
        },
        '3d': {
            category: '3D TOPOGRAPHY',
            title: 'Escultura 3D Topográfica',
            desc: 'Congela la malla de relieve espectral y exporta archivos STL para impresión 3D, OBJ o GLB.',
            shortcut: '3D VFX',
            theme: 'amber',
            icon: '🧊'
        },
        'escultura 3d stl/obj': {
            category: '3D TOPOGRAPHY',
            title: 'Escultura 3D Topográfica',
            desc: 'Congela la malla de relieve espectral y exporta archivos STL para impresión 3D, OBJ o GLB.',
            shortcut: '3D VFX',
            theme: 'amber',
            icon: '🧊'
        },
        'clips': {
            category: 'AI CINEMA',
            title: 'Estudio de Creación de Clips IA',
            desc: 'Suite de producción narrativa con generación de guiones visuales y secuencias sincronizadas.',
            shortcut: 'CLIPS',
            theme: 'purple',
            icon: '🎬'
        },
        'estudio de creación narrativa & clips ia': {
            category: 'AI CINEMA',
            title: 'Estudio de Creación de Clips IA',
            desc: 'Suite de producción narrativa con generación de guiones visuales y secuencias sincronizadas.',
            shortcut: 'CLIPS',
            theme: 'purple',
            icon: '🎬'
        },
        '4k': {
            category: 'CAPTURE VFX',
            title: 'Captura Ultra-HD (4K / 8K SSAA)',
            desc: 'Renderiza una instantánea fija a máxima resolución con Super-Sampling Anti-Aliasing.',
            shortcut: 'P',
            theme: 'amber',
            icon: '📸'
        },
        'captura 4k instantánea [p]': {
            category: 'CAPTURE VFX',
            title: 'Captura Ultra-HD (4K / 8K SSAA)',
            desc: 'Renderiza una instantánea fija a máxima resolución con Super-Sampling Anti-Aliasing.',
            shortcut: 'P',
            theme: 'amber',
            icon: '📸'
        },
        'órbita': {
            category: '3D CAMERA',
            title: 'Órbita Cinemática Automática',
            desc: 'Activa la trayectoria de cámara giroscópica continua alrededor del nodo visual central.',
            shortcut: 'CAM',
            theme: 'indigo',
            icon: '🎥'
        },
        'fullscreen': {
            category: 'DISPLAY',
            title: 'Modo Pantalla Completa',
            desc: 'Maximiza el lienzo visual sin distracciones del sistema operativo ni barras de navegador.',
            shortcut: 'F11',
            theme: 'sky',
            icon: '⛶'
        },
        'salir cine ✕': {
            category: 'WORKFLOW',
            title: 'Salir de Studio Cinema',
            desc: 'Restaura los docks de control, consolas de ecualización y paneles de ingeniería acústica.',
            shortcut: 'ESC',
            theme: 'rose',
            icon: '✕'
        }
    };

    let tooltipEl = null;
    let badgeEl = null;
    let catEl = null;
    let keycapEl = null;
    let iconEl = null;
    let titleEl = null;
    let descEl = null;
    let telemetryEl = null;
    let actionEl = null;

    let isVisible = false;
    let currentX = -9999;
    let currentY = -9999;
    let targetX = -9999;
    let targetY = -9999;
    let currentScale = 0.94;
    let targetScale = 0.94;
    let rafId = null;
    let currentTriggerEl = null;

    /**
     * Inyecta el contenedor DOM y estilos CSS una sola vez
     */
    function injectDOM() {
        if (document.getElementById('mv-showcase-hud')) {
            tooltipEl = document.getElementById('mv-showcase-hud');
            cacheDOMElements();
            return;
        }

        // Inyectar CSS
        const style = document.createElement('style');
        style.id = 'mv-showcase-hud-styles';
        style.textContent = CSS_STYLES;
        document.head.appendChild(style);

        // Crear Markup
        const hud = document.createElement('div');
        hud.id = 'mv-showcase-hud';
        hud.className = 'mv-showcase-hud mv-hud-theme-cyan';
        hud.setAttribute('aria-hidden', 'true');
        hud.innerHTML = `
            <div class="mv-hud-card">
                <div class="mv-hud-header">
                    <div class="mv-hud-badge">
                        <span class="mv-hud-dot"></span>
                        <span class="mv-hud-category">SHOWCASE</span>
                    </div>
                    <span class="mv-hud-keycap" style="display: none;">[P]</span>
                </div>
                <div class="mv-hud-title-wrap">
                    <span class="mv-hud-icon">⚡</span>
                    <h4 class="mv-hud-title">Característica</h4>
                </div>
                <p class="mv-hud-desc">Descripción detallada del módulo o acción interactiva.</p>
                <div class="mv-hud-footer">
                    <span class="mv-hud-telemetry"><span class="mv-hud-telemetry-dot"></span>READY • 60 FPS</span>
                    <span class="mv-hud-action">CLICK PARA EJECUTAR</span>
                </div>
            </div>
        `;
        document.body.appendChild(hud);
        tooltipEl = hud;
        cacheDOMElements();
    }

    function cacheDOMElements() {
        if (!tooltipEl) return;
        catEl = tooltipEl.querySelector('.mv-hud-category');
        keycapEl = tooltipEl.querySelector('.mv-hud-keycap');
        iconEl = tooltipEl.querySelector('.mv-hud-icon');
        titleEl = tooltipEl.querySelector('.mv-hud-title');
        descEl = tooltipEl.querySelector('.mv-hud-desc');
        telemetryEl = tooltipEl.querySelector('.mv-hud-telemetry');
        actionEl = tooltipEl.querySelector('.mv-hud-action');
    }

    /**
     * Bucle de animación Lerp a 60 FPS (Zero CPU overhead cuando está quieto)
     */
    function lerpLoop() {
        if (!isVisible && Math.abs(currentScale - targetScale) < 0.01 && tooltipEl && tooltipEl.style.opacity === '0') {
            rafId = null;
            return;
        }

        // Interpolación lineal fluida (factor 0.20)
        currentX += (targetX - currentX) * 0.20;
        currentY += (targetY - currentY) * 0.20;
        currentScale += (targetScale - currentScale) * 0.22;

        if (tooltipEl) {
            tooltipEl.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0) scale(${currentScale.toFixed(3)})`;
        }

        rafId = requestAnimationFrame(lerpLoop);
    }

    function startLerp() {
        if (!rafId) {
            rafId = requestAnimationFrame(lerpLoop);
        }
    }

    /**
     * Analiza el elemento y extrae la metadata enriquecida
     */
    function extractMetadata(el) {
        // 1. Prohibir y cancelar title nativo del navegador de inmediato
        let rawTitle = '';
        if (el.hasAttribute('title')) {
            rawTitle = el.getAttribute('title').trim();
            el.dataset.mvTitle = rawTitle;
            el.removeAttribute('title'); // ¡Elimina el tooltip feo del navegador!
        } else if (el.dataset.mvTitle) {
            rawTitle = el.dataset.mvTitle.trim();
        }

        // 2. Extraer campos data-tooltip explícitos si existen
        const customCat = el.dataset.tooltipCat || el.dataset.tooltipCategory;
        const customTitle = el.dataset.tooltipTitle;
        const customDesc = el.dataset.tooltipDesc;
        const customShortcut = el.dataset.tooltipShortcut || el.dataset.tooltipKey;
        const customTheme = el.dataset.tooltipTheme;
        const customIcon = el.dataset.tooltipIcon;

        // 3. Revisar si coincide con el registro predefinido de MotorVisuales
        const btnTextKey = el.textContent.trim().toLowerCase();
        const rawTitleKey = rawTitle.toLowerCase();
        const registryMatch = FEATURE_REGISTRY[btnTextKey] || FEATURE_REGISTRY[rawTitleKey];

        let category = customCat || (registryMatch ? registryMatch.category : 'ACCION DE CONTROL');
        let title = customTitle || (registryMatch ? registryMatch.title : rawTitle || el.textContent.trim());
        let desc = customDesc || (registryMatch ? registryMatch.desc : '');
        let shortcut = customShortcut || (registryMatch ? registryMatch.shortcut : '');
        let theme = customTheme || (registryMatch ? registryMatch.theme : 'cyan');
        let icon = customIcon || (registryMatch ? registryMatch.icon : '⚡');

        // 4. Parser inteligente de atajos en corchetes ej: "Captura Ultra-HD [Atajo: P]"
        if (!shortcut) {
            const bracketMatch = title.match(/\[([^\]]+)\]/);
            if (bracketMatch) {
                shortcut = bracketMatch[1].replace(/atajo:\s*/i, '').trim();
                title = title.replace(/\[([^\]]+)\]/, '').trim();
            }
        }

        // 5. Separación inteligente de subtítulos si el título contiene " - " o " · " o ":"
        if (!desc && title.includes(' · ')) {
            const parts = title.split(' · ');
            title = parts[0].trim();
            desc = parts.slice(1).join(' · ').trim();
        } else if (!desc && title.includes('(') && title.endsWith(')')) {
            const parenMatch = title.match(/^(.*?)\s*\((.*?)\)$/);
            if (parenMatch && parenMatch[1].length > 3) {
                title = parenMatch[1].trim();
                desc = parenMatch[2].trim();
            }
        }

        // 6. Si no hay descripción, inferir según el contexto
        if (!desc) {
            if (el.closest('.studio-pill-dock')) {
                desc = 'Acceso rápido en modo Studio Cinema con renderizado acelerado por GPU.';
            } else if (el.closest('header')) {
                desc = 'Herramienta global de la estación de trabajo audiovisual.';
            } else if (el.closest('#cockpit-tabs-container')) {
                desc = 'Pestaña del cockpit principal. Haz click para alternar la vista.';
            } else {
                desc = 'Parámetro interactivo de la consola de visuales y audio DSP.';
            }
        }

        return { category, title, desc, shortcut, theme, icon };
    }

    /**
     * Muestra el HUD para un elemento dado y posición del cursor
     */
    function show(el, mouseX, mouseY) {
        if (!tooltipEl) injectDOM();
        currentTriggerEl = el;

        const data = extractMetadata(el);

        // Actualizar contenido DOM
        catEl.textContent = data.category;
        titleEl.textContent = data.title;
        descEl.textContent = data.desc;
        iconEl.textContent = data.icon;

        if (data.shortcut) {
            keycapEl.textContent = data.shortcut;
            keycapEl.style.display = 'inline-block';
        } else {
            keycapEl.style.display = 'none';
        }

        // Aplicar clase temática de color
        tooltipEl.className = `mv-showcase-hud is-visible mv-hud-theme-${data.theme}`;

        // Posicionamiento inteligente con detección de colisiones de pantalla
        updateTargetPosition(el, mouseX, mouseY);

        // Si era la primera vez que se muestra, inicializar coordenadas en target para evitar salto
        if (!isVisible) {
            currentX = targetX;
            currentY = targetY;
            currentScale = 0.94;
        }

        isVisible = true;
        targetScale = 1.0;
        startLerp();
    }

    /**
     * Actualiza la posición de destino targetX, targetY considerando bordes y centrado ergonómico
     */
    function updateTargetPosition(el, mouseX, mouseY) {
        if (!tooltipEl) return;

        const hudRect = tooltipEl.getBoundingClientRect();
        const hudW = Math.max(hudRect.width, 240);
        const hudH = Math.max(hudRect.height, 90);
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Centrado horizontal sobre el cursor para sensación física de balance
        let x = mouseX - (hudW / 2);

        // Determinación vertical inteligente: si está en el tercio inferior o cerca de la barra inferior
        let y;
        const isDockElement = el && (el.closest('.studio-pill-dock') || el.closest('#fullscreen-playback-bar'));
        const isNearBottom = isDockElement || (mouseY > winH - 140) || (el && el.getBoundingClientRect().bottom > winH - 90);

        if (isNearBottom) {
            // Posicionar ARRIBA del elemento/cursor
            if (el) {
                const elRect = el.getBoundingClientRect();
                y = elRect.top - hudH - 14;
            } else {
                y = mouseY - hudH - 18;
            }
        } else {
            // Posicionar DEBAJO del elemento/cursor
            if (el) {
                const elRect = el.getBoundingClientRect();
                y = elRect.bottom + 14;
            } else {
                y = mouseY + 18;
            }
        }

        // Clamping estricto dentro de los márgenes de la ventana (12px)
        x = Math.max(12, Math.min(winW - hudW - 12, x));
        y = Math.max(12, Math.min(winH - hudH - 12, y));

        targetX = x;
        targetY = y;
    }

    /**
     * Oculta el HUD con transición de salida
     */
    function hide() {
        if (!isVisible) return;
        isVisible = false;
        currentTriggerEl = null;
        targetScale = 0.94;

        if (tooltipEl) {
            tooltipEl.classList.remove('is-visible');
        }
        startLerp();
    }

    /**
     * Escanea el DOM y suprime proactivamente todos los atributos title nativos
     */
    function sanitizeTitles(rootEl = document) {
        const elements = rootEl.querySelectorAll('[title]');
        elements.forEach(el => {
            const t = el.getAttribute('title').trim();
            if (t) {
                el.dataset.mvTitle = t;
                el.removeAttribute('title');
            }
        });
    }

    /**
     * Inicialización del sistema con delegación global de eventos
     */
    function init() {
        injectDOM();
        sanitizeTitles();

        // Observador de mutaciones para suprimir títulos de nodos dinámicos
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type === 'childList') {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.hasAttribute('title')) {
                                node.dataset.mvTitle = node.getAttribute('title');
                                node.removeAttribute('title');
                            }
                            sanitizeTitles(node);
                        }
                    });
                } else if (m.type === 'attributes' && m.attributeName === 'title') {
                    if (m.target.hasAttribute('title')) {
                        m.target.dataset.mvTitle = m.target.getAttribute('title');
                        m.target.removeAttribute('title');
                    }
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['title'] });

        // Delegación de eventos pointerover / pointerout
        document.addEventListener('pointerover', e => {
            const target = e.target.closest('[data-mv-title], [title], [data-tooltip-title], [data-tooltip-desc], .studio-pill-dock button');
            if (target) {
                show(target, e.clientX, e.clientY);
            }
        }, { passive: true });

        document.addEventListener('pointermove', e => {
            if (isVisible && currentTriggerEl) {
                updateTargetPosition(currentTriggerEl, e.clientX, e.clientY);
            }
        }, { passive: true });

        document.addEventListener('pointerout', e => {
            if (currentTriggerEl && !currentTriggerEl.contains(e.relatedTarget)) {
                hide();
            }
        }, { passive: true });

        // Ocultar si se hace scroll o click
        window.addEventListener('scroll', hide, { passive: true });
        window.addEventListener('click', hide, { passive: true });
        window.addEventListener('blur', hide, { passive: true });
    }

    return {
        init,
        show,
        hide,
        sanitizeTitles,
        FEATURE_REGISTRY
    };
}));
