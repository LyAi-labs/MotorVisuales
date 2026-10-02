/**
 * SpotlightCard — Vanilla JS Port
 * Original: https://21st.dev/@easemize/components/spotlight-card (React + shadcn/ui)
 * Portado a: Vanilla JS + CSS custom properties — sin dependencias externas
 *
 * USO:
 *   // 1. Añadir clase "spotlight-card" al elemento contenedor
 *   // 2. Llamar SpotlightCard.init() una vez en DOMContentLoaded
 *   // 3. Llamar SpotlightCard.refresh() si añades tarjetas dinámicamente al DOM
 *
 * CONFIGURACIÓN por atributo data-*:
 *   data-spotlight-color="rgba(6,182,212,0.15)"   — color del haz de luz
 *   data-spotlight-size="600"                      — radio en px del gradiente
 *   data-spotlight-border="rgba(6,182,212,0.4)"   — color del borde iluminado
 *
 * EJEMPLO HTML:
 *   <div class="spotlight-card" data-spotlight-color="rgba(6,182,212,0.12)">
 *     <div class="spotlight-card__inner">contenido...</div>
 *   </div>
 *
 * EJEMPLO CSS MÍNIMO (ya incluido en el <style> embebido que inyecta init()):
 *   Las clases .spotlight-card y .spotlight-card::before son inyectadas automáticamente.
 */

const SpotlightCard = (() => {
    // CSS inyectado una sola vez en <head> cuando se llama init()
    const CSS = `
        .spotlight-card {
            position: relative;
            overflow: hidden;
            border-radius: 1rem;
            background: #0b0c14;
            border: 1px solid rgba(255,255,255,0.06);
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
            will-change: transform;
        }
        .spotlight-card::before {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(
                var(--spotlight-size, 500px) circle at var(--mouse-x, -9999px) var(--mouse-y, -9999px),
                var(--spotlight-color, rgba(6,182,212,0.13)),
                transparent 65%
            );
            opacity: 0;
            transition: opacity 0.35s ease;
            pointer-events: none;
            z-index: 0;
            border-radius: inherit;
        }
        .spotlight-card:hover::before {
            opacity: 1;
        }
        .spotlight-card::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            border: 1px solid transparent;
            background:
                radial-gradient(
                    var(--spotlight-size, 500px) circle at var(--mouse-x, -9999px) var(--mouse-y, -9999px),
                    var(--spotlight-border, rgba(6,182,212,0.35)),
                    transparent 65%
                ) border-box;
            -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
            opacity: 0;
            transition: opacity 0.35s ease;
            pointer-events: none;
            z-index: 0;
        }
        .spotlight-card:hover::after {
            opacity: 1;
        }
        .spotlight-card__inner {
            position: relative;
            z-index: 1;
        }
    `;

    let initialized = false;

    function _injectCSS() {
        if (document.getElementById('spotlight-card-styles')) return;
        const style = document.createElement('style');
        style.id = 'spotlight-card-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function _applyConfig(card) {
        const color  = card.dataset.spotlightColor  || 'rgba(6,182,212,0.13)';
        const size   = card.dataset.spotlightSize   || '500';
        const border = card.dataset.spotlightBorder || 'rgba(6,182,212,0.35)';
        card.style.setProperty('--spotlight-color',  color);
        card.style.setProperty('--spotlight-size',   size + 'px');
        card.style.setProperty('--spotlight-border', border);
    }

    function _onMouseMove(e) {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--mouse-y', (e.clientY - rect.top)  + 'px');
    }

    function _onMouseLeave(e) {
        // Mover el gradiente fuera del área visible para evitar parpadeos al re-entrar
        e.currentTarget.style.setProperty('--mouse-x', '-9999px');
        e.currentTarget.style.setProperty('--mouse-y', '-9999px');
    }

    function _bind(card) {
        if (card._spotlightBound) return; // Evitar duplicar listeners
        _applyConfig(card);
        card.addEventListener('mousemove',  _onMouseMove,  { passive: true });
        card.addEventListener('mouseleave', _onMouseLeave, { passive: true });
        card._spotlightBound = true;
    }

    /**
     * init() — Inyecta CSS y enlaza listeners en todos los .spotlight-card del DOM.
     * Llamar una vez en DOMContentLoaded.
     */
    function init() {
        _injectCSS();
        document.querySelectorAll('.spotlight-card').forEach(_bind);
        initialized = true;
    }

    /**
     * refresh() — Enlaza nuevos .spotlight-card añadidos dinámicamente.
     * No re-procesa tarjetas ya inicializadas (O(n) incremental).
     */
    function refresh() {
        if (!initialized) { init(); return; }
        document.querySelectorAll('.spotlight-card').forEach(_bind);
    }

    /**
     * create(element, options) — Convierte un elemento existente en SpotlightCard
     * sin necesidad de la clase CSS .spotlight-card en el HTML.
     * @param {HTMLElement} element
     * @param {Object} [options] — { color, size, border }
     */
    function create(element, options = {}) {
        _injectCSS();
        element.classList.add('spotlight-card');
        if (options.color)  element.dataset.spotlightColor  = options.color;
        if (options.size)   element.dataset.spotlightSize   = String(options.size);
        if (options.border) element.dataset.spotlightBorder = options.border;
        _bind(element);
    }

    return { init, refresh, create };
})();

// Auto-init en DOMContentLoaded si este script se carga como módulo independiente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SpotlightCard.init);
} else {
    SpotlightCard.init();
}
