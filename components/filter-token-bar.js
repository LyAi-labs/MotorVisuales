/**
 * FilterTokenBar — Pure Vanilla JS Port & Architecture
 * Inspired by: https://21st.dev/@laziekiki/components/filter-token-bar (Linear-style filter token bar)
 * Zero Bloatware, 100% Vanilla JS, High Performance, Keyboard Accessible.
 *
 * Características:
 * - Tokens composables: [Campo] · [Operador] · [Valores] · [✕]
 * - Popovers desacoplados anclados a cada segmento con auto-posicionamiento y prevención de desbordamiento
 * - Soporte para selección simple y múltiple (con checkboxes reactivos)
 * - Búsqueda en vivo dentro de las opciones de cada campo
 * - Botón de "+ Filtro" y "Limpiar todo"
 * - Evento reactivo `onChange(activeFilters)` para filtrado instantáneo a 60 FPS
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.FilterTokenBar = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    let stylesInjected = false;

    function injectStyles() {
        if (stylesInjected) return;
        stylesInjected = true;

        const style = document.createElement('style');
        style.id = 'filter-token-bar-styles';
        style.textContent = `
            /* ─── Filter Token Bar Styles ────────────────────────────────────────── */
            .ftb-root {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 6px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 12px;
                color: #e4e4e7;
                user-select: none;
            }

            .ftb-tokens-wrapper {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 6px;
            }

            /* Token Pill */
            .ftb-token {
                display: inline-flex;
                align-items: center;
                background: rgba(18, 20, 29, 0.92);
                border: 1px solid rgba(255, 255, 255, 0.10);
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
                transition: border-color 0.15s ease, background 0.15s ease;
                overflow: hidden;
            }
            .ftb-token:hover {
                border-color: rgba(255, 255, 255, 0.22);
            }

            /* Segments */
            .ftb-seg {
                padding: 4px 8px;
                display: flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
                transition: background 0.12s ease, color 0.12s ease;
                white-space: nowrap;
            }
            .ftb-seg:hover {
                background: rgba(255, 255, 255, 0.08);
            }

            .ftb-seg-field {
                font-weight: 600;
                color: #f4f4f5;
                border-right: 1px solid rgba(255, 255, 255, 0.08);
            }
            .ftb-seg-field-icon {
                font-size: 13px;
                line-height: 1;
                display: inline-flex;
                align-items: center;
            }

            .ftb-seg-op {
                font-family: ui-monospace, monospace;
                font-size: 11px;
                color: #a1a1aa;
                border-right: 1px solid rgba(255, 255, 255, 0.08);
            }
            .ftb-seg-op:hover {
                color: #e4e4e7;
            }

            .ftb-seg-val {
                font-weight: 500;
                color: #38bdf8;
                max-width: 240px;
                overflow: hidden;
                text-overflow: ellipsis;
                gap: 4px;
            }

            .ftb-val-pill {
                display: inline-flex;
                align-items: center;
                gap: 3px;
                background: rgba(56, 189, 248, 0.12);
                color: #7dd3fc;
                border: 1px solid rgba(56, 189, 248, 0.25);
                border-radius: 4px;
                padding: 1px 5px;
                font-size: 11px;
            }

            .ftb-token-del {
                padding: 4px 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #71717a;
                border-left: 1px solid rgba(255, 255, 255, 0.08);
                cursor: pointer;
                transition: color 0.12s, background 0.12s;
            }
            .ftb-token-del:hover {
                color: #f87171;
                background: rgba(239, 68, 68, 0.12);
            }

            /* Add Filter Button */
            .ftb-btn-add {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 4px 10px;
                border-radius: 8px;
                border: 1px dashed rgba(255, 255, 255, 0.18);
                background: rgba(255, 255, 255, 0.02);
                color: #a1a1aa;
                cursor: pointer;
                transition: all 0.15s ease;
                font-size: 11px;
                font-weight: 500;
            }
            .ftb-btn-add:hover {
                border-color: #38bdf8;
                color: #f4f4f5;
                background: rgba(56, 189, 248, 0.06);
            }

            /* Clear Button */
            .ftb-btn-clear {
                background: transparent;
                border: none;
                color: #71717a;
                font-size: 11px;
                padding: 4px 8px;
                cursor: pointer;
                transition: color 0.15s;
                border-radius: 6px;
            }
            .ftb-btn-clear:hover {
                color: #d4d4d8;
                background: rgba(255, 255, 255, 0.05);
            }

            /* ─── Popover Dropdown ─────────────────────────────────────────────── */
            .ftb-popover {
                position: fixed;
                z-index: 9999999;
                background: #0d0f17;
                border: 1px solid rgba(255, 255, 255, 0.14);
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.15);
                width: 260px;
                max-width: 90vw;
                padding: 6px;
                display: none;
                animation: ftbFadeIn 0.12s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .ftb-popover.is-open {
                display: block;
            }

            @keyframes ftbFadeIn {
                from { opacity: 0; transform: translateY(-4px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .ftb-popover-search {
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.10);
                border-radius: 6px;
                padding: 6px 8px;
                font-size: 12px;
                color: #f4f4f5;
                outline: none;
                margin-bottom: 6px;
                box-sizing: border-box;
            }
            .ftb-popover-search:focus {
                border-color: #38bdf8;
                background: rgba(56, 189, 248, 0.06);
            }

            .ftb-popover-list {
                max-height: 220px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .ftb-popover-list::-webkit-scrollbar {
                width: 4px;
            }
            .ftb-popover-list::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
            }

            .ftb-popover-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 8px;
                border-radius: 6px;
                font-size: 12px;
                color: #d4d4d8;
                cursor: pointer;
                transition: background 0.1s, color 0.1s;
            }
            .ftb-popover-item:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #ffffff;
            }
            .ftb-popover-item.is-selected {
                background: rgba(56, 189, 248, 0.14);
                color: #38bdf8;
                font-weight: 500;
            }
            .ftb-popover-item-left {
                display: flex;
                align-items: center;
                gap: 7px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .ftb-popover-item-check {
                font-size: 11px;
                color: #38bdf8;
            }
            .ftb-popover-empty {
                padding: 12px 8px;
                text-align: center;
                color: #71717a;
                font-size: 11px;
            }
        `;
        document.head.appendChild(style);
    }

    class FilterTokenBar {
        /**
         * @param {Object} options
         * @param {HTMLElement} options.container - Contenedor DOM donde renderizar la barra
         * @param {Array} options.fields - Definición de campos disponibles
         * @param {Array} [options.value] - Filtros iniciales: [{ id, field, operator, values }]
         * @param {Function} [options.onChange] - Callback invocado al mutar los filtros
         */
        constructor(options = {}) {
            injectStyles();

            this.container = options.container;
            this.fields = options.fields || [];
            this.onChange = options.onChange || (() => {});
            this.filters = Array.isArray(options.value) ? JSON.parse(JSON.stringify(options.value)) : [];

            this.activePopover = null;
            this.popoverEl = null;

            this.initDOM();
            this.bindGlobalEvents();
            this.render();
        }

        initDOM() {
            if (!this.container) return;

            this.container.innerHTML = `
                <div class="ftb-root">
                    <div class="ftb-tokens-wrapper"></div>
                    <button type="button" class="ftb-btn-add">
                        <span>+</span><span>Filtro</span>
                    </button>
                    <button type="button" class="ftb-btn-clear" style="display: none;">
                        Limpiar
                    </button>
                </div>
            `;

            this.tokensWrapper = this.container.querySelector('.ftb-tokens-wrapper');
            this.btnAdd = this.container.querySelector('.ftb-btn-add');
            this.btnClear = this.container.querySelector('.ftb-btn-clear');

            this.btnAdd.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openFieldsMenu(this.btnAdd);
            });

            this.btnClear.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearAll();
            });

            // Popover flotante único compartido
            this.popoverEl = document.createElement('div');
            this.popoverEl.className = 'ftb-popover';
            document.body.appendChild(this.popoverEl);
        }

        bindGlobalEvents() {
            this._onDocClick = (e) => {
                if (this.popoverEl && !this.popoverEl.contains(e.target) && !e.target.closest('.ftb-seg') && !e.target.closest('.ftb-btn-add')) {
                    this.closePopover();
                }
            };

            this._onKeyDown = (e) => {
                if (e.key === 'Escape') {
                    this.closePopover();
                }
            };

            this._onResize = () => {
                this.closePopover();
            };

            document.addEventListener('click', this._onDocClick);
            document.addEventListener('keydown', this._onKeyDown);
            window.addEventListener('resize', this._onResize);
        }

        render() {
            if (!this.tokensWrapper) return;
            this.tokensWrapper.innerHTML = '';

            this.filters.forEach((filter, index) => {
                const fieldDef = this.getFieldDef(filter.field);
                if (!fieldDef) return;

                const tokenEl = document.createElement('div');
                tokenEl.className = 'ftb-token';
                tokenEl.dataset.filterIndex = index;

                // 1. Field Segment
                const segField = document.createElement('div');
                segField.className = 'ftb-seg ftb-seg-field';
                segField.innerHTML = `
                    <span class="ftb-seg-field-icon">${fieldDef.icon || '🏷️'}</span>
                    <span>${fieldDef.label}</span>
                `;
                segField.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openFieldsMenu(segField, index);
                });

                // 2. Operator Segment
                const segOp = document.createElement('div');
                segOp.className = 'ftb-seg ftb-seg-op';
                const opLabel = this.getOperatorLabel(fieldDef, filter.operator);
                segOp.textContent = opLabel;
                segOp.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openOperatorsMenu(segOp, index);
                });

                // 3. Values Segment
                const segVal = document.createElement('div');
                segVal.className = 'ftb-seg ftb-seg-val';
                segVal.innerHTML = this.renderValuesPreview(fieldDef, filter);
                segVal.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openValuesMenu(segVal, index);
                });

                // 4. Delete Segment
                const segDel = document.createElement('div');
                segDel.className = 'ftb-token-del';
                segDel.innerHTML = '✕';
                segDel.title = 'Eliminar filtro';
                segDel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeFilter(index);
                });

                tokenEl.appendChild(segField);
                tokenEl.appendChild(segOp);
                tokenEl.appendChild(segVal);
                tokenEl.appendChild(segDel);

                this.tokensWrapper.appendChild(tokenEl);
            });

            // Visibilidad del botón "Limpiar"
            if (this.btnClear) {
                this.btnClear.style.display = this.filters.length > 0 ? 'inline-block' : 'none';
            }
        }

        renderValuesPreview(fieldDef, filter) {
            const values = Array.isArray(filter.values) ? filter.values : [filter.values].filter(Boolean);
            if (values.length === 0) {
                return '<span class="text-zinc-500 font-mono text-[11px] italic">seleccionar...</span>';
            }

            return values.map(val => {
                const opt = (fieldDef.options || []).find(o => o.value === val);
                const label = opt ? opt.label : val;
                const glyph = opt && opt.glyph ? `<span class="ftb-val-glyph">${opt.glyph}</span>` : '';
                return `<span class="ftb-val-pill">${glyph}${label}</span>`;
            }).join('');
        }

        getFieldDef(fieldId) {
            return this.fields.find(f => f.id === fieldId);
        }

        getOperatorLabel(fieldDef, opValue) {
            const op = (fieldDef.operators || []).find(o => o.value === opValue);
            return op ? op.label : opValue;
        }

        isMultiOperator(fieldDef, opValue) {
            const op = (fieldDef.operators || []).find(o => o.value === opValue);
            return op ? !!op.multi : false;
        }

        // ─── Popovers & Menús ───────────────────────────────────────────────

        positionPopover(anchorEl) {
            const rect = anchorEl.getBoundingClientRect();
            const popoverW = 260;
            let top = rect.bottom + 6;
            let left = rect.left;

            // Prevenir desbordamiento inferior
            if (top + 260 > window.innerHeight) {
                top = rect.top - 266;
            }
            // Prevenir desbordamiento derecho
            if (left + popoverW > window.innerWidth - 12) {
                left = window.innerWidth - popoverW - 12;
            }
            // Prevenir desbordamiento izquierdo
            if (left < 12) left = 12;

            this.popoverEl.style.top = `${Math.max(12, top)}px`;
            this.popoverEl.style.left = `${Math.max(12, left)}px`;
            this.popoverEl.classList.add('is-open');
        }

        closePopover() {
            if (this.popoverEl) {
                this.popoverEl.classList.remove('is-open');
                this.popoverEl.innerHTML = '';
            }
            this.activePopover = null;
        }

        openFieldsMenu(anchorEl, filterIndex = null) {
            this.closePopover();
            this.activePopover = { type: 'fields', filterIndex };

            this.popoverEl.innerHTML = `
                <input type="text" class="ftb-popover-search" placeholder="Filtrar campos..." autofocus>
                <div class="ftb-popover-list">
                    ${this.fields.map(f => `
                        <div class="ftb-popover-item" data-field-id="${f.id}">
                            <div class="ftb-popover-item-left">
                                <span class="ftb-seg-field-icon">${f.icon || '🏷️'}</span>
                                <span>${f.label}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            const searchInput = this.popoverEl.querySelector('.ftb-popover-search');
            const list = this.popoverEl.querySelector('.ftb-popover-list');

            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase().trim();
                Array.from(list.children).forEach(child => {
                    const fid = child.dataset.fieldId;
                    const f = this.getFieldDef(fid);
                    const match = !q || f.label.toLowerCase().includes(q) || f.id.toLowerCase().includes(q);
                    child.style.display = match ? 'flex' : 'none';
                });
            });

            list.addEventListener('click', (e) => {
                const item = e.target.closest('.ftb-popover-item');
                if (!item) return;
                const fieldId = item.dataset.fieldId;
                const fieldDef = this.getFieldDef(fieldId);
                const defaultOp = fieldDef.operators?.[0]?.value || 'is';

                if (filterIndex !== null) {
                    // Reemplazar campo existente
                    this.filters[filterIndex].field = fieldId;
                    this.filters[filterIndex].operator = defaultOp;
                    this.filters[filterIndex].values = [];
                    this.closePopover();
                    this.render();
                    this.notifyChange();
                } else {
                    // Agregar nuevo filtro
                    const newFilter = {
                        id: 'ftb-' + Date.now(),
                        field: fieldId,
                        operator: defaultOp,
                        values: []
                    };
                    this.filters.push(newFilter);
                    this.closePopover();
                    this.render();
                    this.notifyChange();

                    // Abrir de inmediato el menú de valores para el nuevo filtro
                    const newIndex = this.filters.length - 1;
                    setTimeout(() => {
                        const tokenEls = this.tokensWrapper.querySelectorAll('.ftb-token');
                        const lastToken = tokenEls[tokenEls.length - 1];
                        if (lastToken) {
                            const valSeg = lastToken.querySelector('.ftb-seg-val');
                            if (valSeg) this.openValuesMenu(valSeg, newIndex);
                        }
                    }, 50);
                }
            });

            this.positionPopover(anchorEl);
            setTimeout(() => searchInput.focus(), 20);
        }

        openOperatorsMenu(anchorEl, filterIndex) {
            this.closePopover();
            this.activePopover = { type: 'operators', filterIndex };

            const filter = this.filters[filterIndex];
            const fieldDef = this.getFieldDef(filter.field);
            if (!fieldDef || !fieldDef.operators) return;

            this.popoverEl.innerHTML = `
                <div class="ftb-popover-list">
                    ${fieldDef.operators.map(op => `
                        <div class="ftb-popover-item ${op.value === filter.operator ? 'is-selected' : ''}" data-op-value="${op.value}">
                            <div class="ftb-popover-item-left">
                                <span class="font-mono text-xs">${op.label}</span>
                            </div>
                            ${op.value === filter.operator ? '<span class="ftb-popover-item-check">✓</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            `;

            this.popoverEl.querySelector('.ftb-popover-list').addEventListener('click', (e) => {
                const item = e.target.closest('.ftb-popover-item');
                if (!item) return;
                const opVal = item.dataset.opValue;
                filter.operator = opVal;
                
                // Si el nuevo operador no es multi y hay varios valores, conservar solo el primero
                if (!this.isMultiOperator(fieldDef, opVal) && Array.isArray(filter.values) && filter.values.length > 1) {
                    filter.values = [filter.values[0]];
                }

                this.closePopover();
                this.render();
                this.notifyChange();
            });

            this.positionPopover(anchorEl);
        }

        openValuesMenu(anchorEl, filterIndex) {
            this.closePopover();
            this.activePopover = { type: 'values', filterIndex };

            const filter = this.filters[filterIndex];
            const fieldDef = this.getFieldDef(filter.field);
            if (!fieldDef) return;

            const isMulti = this.isMultiOperator(fieldDef, filter.operator);
            const selectedVals = new Set(Array.isArray(filter.values) ? filter.values : [filter.values].filter(Boolean));

            const renderList = (opts) => {
                if (opts.length === 0) {
                    return '<div class="ftb-popover-empty">No hay opciones disponibles</div>';
                }
                return opts.map(opt => {
                    const isChecked = selectedVals.has(opt.value);
                    return `
                        <div class="ftb-popover-item ${isChecked ? 'is-selected' : ''}" data-val="${opt.value}">
                            <div class="ftb-popover-item-left">
                                ${opt.glyph ? `<span>${opt.glyph}</span>` : ''}
                                <span>${opt.label}</span>
                            </div>
                            ${isChecked ? '<span class="ftb-popover-item-check">✓</span>' : ''}
                        </div>
                    `;
                }).join('');
            };

            const options = fieldDef.options || [];

            this.popoverEl.innerHTML = `
                <input type="text" class="ftb-popover-search" placeholder="Buscar ${fieldDef.label}..." autofocus>
                <div class="ftb-popover-list">
                    ${renderList(options)}
                </div>
            `;

            const searchInput = this.popoverEl.querySelector('.ftb-popover-search');
            const list = this.popoverEl.querySelector('.ftb-popover-list');

            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase().trim();
                const filtered = options.filter(o => !q || o.label.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q));
                list.innerHTML = renderList(filtered);
            });

            list.addEventListener('click', (e) => {
                const item = e.target.closest('.ftb-popover-item');
                if (!item) return;
                const val = item.dataset.val;

                if (isMulti) {
                    if (selectedVals.has(val)) {
                        selectedVals.delete(val);
                    } else {
                        selectedVals.add(val);
                    }
                    filter.values = Array.from(selectedVals);
                    item.classList.toggle('is-selected', selectedVals.has(val));
                    item.querySelector('.ftb-popover-item-check')?.remove();
                    if (selectedVals.has(val)) {
                        const check = document.createElement('span');
                        check.className = 'ftb-popover-item-check';
                        check.textContent = '✓';
                        item.appendChild(check);
                    }
                    this.render();
                    this.notifyChange();
                } else {
                    filter.values = [val];
                    this.closePopover();
                    this.render();
                    this.notifyChange();
                }
            });

            this.positionPopover(anchorEl);
            setTimeout(() => searchInput.focus(), 20);
        }

        // ─── Mutaciones y Estado ──────────────────────────────────────────

        removeFilter(index) {
            this.filters.splice(index, 1);
            this.render();
            this.notifyChange();
        }

        clearAll() {
            this.filters = [];
            this.closePopover();
            this.render();
            this.notifyChange();
        }

        setFilters(newFilters) {
            this.filters = Array.isArray(newFilters) ? JSON.parse(JSON.stringify(newFilters)) : [];
            this.render();
            this.notifyChange();
        }

        getFilters() {
            return JSON.parse(JSON.stringify(this.filters));
        }

        notifyChange() {
            if (typeof this.onChange === 'function') {
                this.onChange(this.getFilters());
            }
        }

        destroy() {
            document.removeEventListener('click', this._onDocClick);
            document.removeEventListener('keydown', this._onKeyDown);
            window.removeEventListener('resize', this._onResize);
            if (this.popoverEl && this.popoverEl.parentNode) {
                this.popoverEl.parentNode.removeChild(this.popoverEl);
            }
            if (this.container) {
                this.container.innerHTML = '';
            }
        }
    }

    return FilterTokenBar;
}));
