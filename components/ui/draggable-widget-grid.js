/**
 * DraggableWidgetGrid - Vanilla JS Implementation
 * Transpiled from React/Motion to Native Web APIs (PointerEvents, Touch, CSS Grid)
 * Zero bloatware, zero React runtime dependency.
 */

(function (global) {
  'use strict';

  const SPANS = {
    sm: { col: 1, row: 1 },
    wide: { col: 2, row: 1 },
    tall: { col: 1, row: 2 },
    lg: { col: 2, row: 2 },
  };

  const TILING_BUDGET = 20000;
  const SETTLE_MS = 40;
  const LANDED_MS = 620;
  const LONG_PRESS_MS = 350;
  const PRESS_SLOP = 8;
  const ENTER = 0.18;

  function spanOf(item, columns) {
    const s = SPANS[item.size] || { col: 1, row: 1 };
    return { w: Math.min(s.col, columns), h: s.row };
  }

  function overlaps(a, b) {
    return (
      a.col < b.col + b.w &&
      b.col < a.col + a.w &&
      a.row < b.row + b.h &&
      b.row < a.row + a.h
    );
  }

  function contains(outer, inner) {
    return (
      inner.col >= outer.col &&
      inner.row >= outer.row &&
      inner.col + inner.w <= outer.col + outer.w &&
      inner.row + inner.h <= outer.row + outer.h
    );
  }

  function tile(items, columns) {
    const spans = items.map((item) => spanOf(item, columns));
    const area = spans.reduce((n, s) => n + s.w * s.h, 0);
    const rows = Math.ceil(area / columns);
    const grid = new Array(rows * columns).fill(false);
    const used = new Array(items.length).fill(false);
    const out = [];
    let budget = TILING_BUDGET;

    const fits = (w, h, r, c) => {
      if (c + w > columns || r + h > rows) return false;
      for (let y = r; y < r + h; y++) {
        for (let x = c; x < c + w; x++) {
          if (grid[y * columns + x]) return false;
        }
      }
      return true;
    };

    const mark = (w, h, r, c, v) => {
      for (let y = r; y < r + h; y++) {
        for (let x = c; x < c + w; x++) {
          grid[y * columns + x] = v;
        }
      }
    };

    const place = (count) => {
      if (count === items.length) return true;
      if (--budget < 0) return false;
      const i = grid.indexOf(false);
      if (i < 0) return false;
      const r = Math.floor(i / columns);
      const c = i % columns;
      const tried = new Set();
      for (let k = 0; k < items.length; k++) {
        if (used[k]) continue;
        const { w, h } = spans[k];
        const shape = `${w}x${h}`;
        if (tried.has(shape) || !fits(w, h, r, c)) continue;
        tried.add(shape);
        used[k] = true;
        mark(w, h, r, c, true);
        out.push({ id: items[k].id, col: c, row: r, w, h });
        if (place(count + 1)) return true;
        out.pop();
        mark(w, h, r, c, false);
        used[k] = false;
      }
      return false;
    };

    return place(0) ? out : null;
  }

  function pack(items, columns) {
    const out = [];
    let row = 0;
    let queue = items.map((item) => ({ id: item.id, ...spanOf(item, columns) }));

    while (queue.length > 0) {
      const height = Math.max(...queue.slice(0, columns).map((q) => q.h));
      const cells = new Array(height * columns).fill(false);
      const band = [];
      const rest = [];

      for (const q of queue) {
        let spot = -1;
        for (let i = 0; i < cells.length && spot < 0; i++) {
          const r = Math.floor(i / columns);
          const c = i % columns;
          if (c + q.w > columns || r + q.h > height) continue;
          let free = true;
          for (let y = r; y < r + q.h && free; y++) {
            for (let x = c; x < c + q.w && free; x++) {
              if (cells[y * columns + x]) free = false;
            }
          }
          if (free) spot = i;
        }
        if (spot < 0 || rest.length > 0) {
          rest.push(q);
          continue;
        }
        const r = Math.floor(spot / columns);
        const c = spot % columns;
        for (let y = r; y < r + q.h; y++) {
          for (let x = c; x < c + q.w; x++) cells[y * columns + x] = true;
        }
        band.push({ id: q.id, col: c, row: r, w: q.w, h: q.h });
      }

      for (let i = 0; i < cells.length; i++) {
        if (cells[i]) continue;
        const r = Math.floor(i / columns);
        const c = i % columns;
        const left = band.find(
          (p) => p.col + p.w === c && p.row <= r && p.row + p.h > r && p.h === 1
        );
        const above = band.find(
          (p) => p.row + p.h === r && p.col === c && p.w === 1
        );
        const grow = left ?? above;
        if (!grow) continue;
        if (grow === left) grow.w += 1;
        else grow.h += 1;
        cells[i] = true;
      }

      out.push(...band.map((p) => ({ ...p, row: p.row + row })));
      row += height;
      queue = rest;
    }
    return out;
  }

  function layout(items, columns) {
    if (columns < 1 || items.length === 0) return [];
    return tile(items, columns) ?? pack(items, columns);
  }

  function moveTo(items, id, index) {
    const from = items.findIndex((item) => item.id === id);
    if (from < 0 || from === index || index < 0 || index >= items.length) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    return next;
  }

  function canonical(items, columns) {
    const places = layout(items, columns);
    if (places.length !== items.length) return items;
    const byId = new Map(items.map((item) => [item.id, item]));
    const sorted = [...places]
      .sort((a, b) => a.row - b.row || a.col - b.col)
      .map((p) => byId.get(p.id));
    if (sorted.every((item, i) => item === items[i])) return items;
    const at = new Map(places.map((p) => [p.id, p]));
    const same = layout(sorted, columns).every((p) => {
      const q = at.get(p.id);
      return q && q.col === p.col && q.row === p.row && q.w === p.w && q.h === p.h;
    });
    return same ? sorted : items;
  }

  function candidatesFor(items, id, columns, toSlot) {
    const places = layout(items, columns);
    const me = places.find((p) => p.id === id);
    if (!me) return [];
    const byId = new Map(items.map((item) => [item.id, item]));
    const rows = Math.max(...places.map((p) => p.row + p.h));
    const out = [];

    for (let row = 0; row + me.h <= rows; row++) {
      for (let col = 0; col + me.w <= columns; col++) {
        const area = { col, row, w: me.w, h: me.h };
        if (overlaps(area, me)) continue;
        const group = places.filter((p) => overlaps(p, area));
        if (group.length < 2 || !group.every((p) => contains(area, p))) continue;
        const moved = places.map((p) =>
          p.id === id
            ? { ...p, col, row }
            : group.includes(p)
            ? { ...p, col: p.col - col + me.col, row: p.row - row + me.row }
            : p
        );
        moved.sort((a, b) => a.row - b.row || a.col - b.col);
        out.push({
          order: moved.map((p) => byId.get(p.id)),
          slot: toSlot(area),
        });
      }
    }

    const from = items.findIndex((item) => item.id === id);
    for (let i = 0; i < items.length; i++) {
      if (i === from) continue;
      const order = moveTo(items, id, i);
      const p = layout(order, columns).find((q) => q.id === id);
      if (p) out.push({ order, slot: toSlot(p) });
    }
    return out;
  }

  function choose(home, candidates, cx, cy) {
    const distance = (s, inset) => {
      const ix = (s.right - s.left) * inset;
      const iy = (s.bottom - s.top) * inset;
      const dx = Math.max(s.left + ix - cx, 0, cx - (s.right - ix));
      const dy = Math.max(s.top + iy - cy, 0, cy - (s.bottom - iy));
      return Math.hypot(dx, dy);
    };
    const toCentre = (s) =>
      Math.hypot((s.left + s.right) / 2 - cx, (s.top + s.bottom) / 2 - cy);

    let best = distance(home, 0);
    if (best === 0) return null;
    let pick = null;
    let bestCentre = Infinity;
    for (const { order, slot } of candidates) {
      const d = distance(slot, ENTER);
      const c = toCentre(slot);
      if (d < best || (d === best && pick && c < bestCentre)) {
        best = d;
        bestCentre = c;
        pick = order;
      }
    }
    return pick;
  }

  class DraggableWidgetGridVanilla {
    constructor(container, options = {}) {
      this.container = container;
      this.items = [...(options.items || [])];
      this.onChange = options.onChange || null;
      this.renderItem = options.renderItem || null;
      this.editable = options.editable !== false;
      this.maxColumns = options.maxColumns || 4;
      this.cellSize = options.cellSize || 215;
      this.gap = options.gap || 12;
      this.radius = options.radius || 24;

      this.metrics = { unit: 0, columns: 0 };
      this.heldId = null;
      this.raisedId = null;
      this.landedId = null;
      this.draggingId = null;
      this.startOrder = null;
      this.frame = 0;
      this.lastMove = 0;
      this.swallowUntil = 0;
      this.ringTimer = null;
      this.longPressTimer = null;

      this.init();
    }

    init() {
      this.container.classList.add('relative', 'w-full', 'select-none');
      this.container.style.setProperty('--widget-radius', `${this.radius}px`);

      this.gridEl = document.createElement('div');
      this.gridEl.setAttribute('role', 'list');
      this.gridEl.className = 'grid w-full transition-all duration-300';
      this.container.appendChild(this.gridEl);

      this.measure();
      this.ro = new ResizeObserver(() => this.measure());
      this.ro.observe(this.container);

      this.render();
    }

    measure() {
      const width = this.container.getBoundingClientRect().width;
      if (width < 1) return;
      const minColumns = Math.min(2, Math.max(1, this.maxColumns));
      const columns = Math.max(
        minColumns,
        Math.min(this.maxColumns, Math.round(width / this.cellSize))
      );
      const unit = (width - this.gap * (columns - 1)) / columns;

      if (this.metrics.columns !== columns || Math.abs(this.metrics.unit - unit) >= 0.5) {
        this.metrics = { unit, columns };
        this.updateGridStyles();
        this.applyPlacements(false);
      }
    }

    updateGridStyles() {
      const { unit, columns } = this.metrics;
      this.gridEl.style.gap = `${this.gap}px`;
      this.gridEl.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
      this.gridEl.style.gridAutoRows = unit ? `${Math.round(unit)}px` : `${this.cellSize * 0.75}px`;
    }

    toSlot(box) {
      const rect = this.gridEl.getBoundingClientRect();
      const { unit } = this.metrics;
      const colStep = unit + this.gap;
      const rowStep = Math.round(unit) + this.gap;
      const left = rect.left + box.col * colStep;
      const top = rect.top + box.row * rowStep;
      return {
        left,
        top,
        right: left + box.w * colStep - this.gap,
        bottom: top + box.h * rowStep - this.gap,
      };
    }

    render() {
      this.gridEl.innerHTML = '';
      this.widgetEls = new Map();

      for (const item of this.items) {
        const el = document.createElement('div');
        el.className = 'relative min-w-0 transition-transform duration-300 ease-out outline-none select-none';
        el.style.borderRadius = 'var(--widget-radius)';
        el.setAttribute('data-widget-id', item.id);
        el.setAttribute('tabindex', this.editable ? '0' : '-1');

        if (this.editable) {
          el.classList.add('cursor-grab', 'active:cursor-grabbing');
        }

        const inner = document.createElement('div');
        inner.className = 'relative isolate flex h-full w-full flex-col overflow-hidden bg-[#141417] text-[#fafafa] ring-1 ring-[#27272a] shadow-md transition-shadow duration-300';
        inner.style.borderRadius = 'var(--widget-radius)';
        inner.style.clipPath = 'inset(0 round var(--widget-radius))';

        if (this.renderItem) {
          const content = this.renderItem(item);
          if (typeof content === 'string') inner.innerHTML = content;
          else if (content instanceof HTMLElement) inner.appendChild(content);
        } else {
          inner.innerHTML = `<div class="p-4 text-xs font-mono text-neutral-400">${item.label || item.id}</div>`;
        }

        el.appendChild(inner);
        this.bindEvents(el, item);
        this.gridEl.appendChild(el);
        this.widgetEls.set(item.id, el);
      }

      this.applyPlacements(false);
    }

    bindEvents(el, item) {
      if (!this.editable) return;

      let startX = 0, startY = 0;
      let isLifted = false;

      const onPointerDown = (e) => {
        if (e.button !== 0) return;
        startX = e.clientX;
        startY = e.clientY;

        if (e.pointerType === 'touch') {
          this.longPressTimer = setTimeout(() => {
            isLifted = true;
            if (navigator.vibrate) navigator.vibrate(10);
            this.startDrag(item.id, e);
          }, LONG_PRESS_MS);

          const cancelTouch = (ev) => {
            if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > PRESS_SLOP) {
              clearTimeout(this.longPressTimer);
            }
          };
          window.addEventListener('pointermove', cancelTouch, { once: true });
        } else {
          this.startDrag(item.id, e);
        }
      };

      el.addEventListener('pointerdown', onPointerDown);

      el.addEventListener('keydown', (e) => {
        if (!e.altKey) return;
        const delta =
          e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 :
          e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!delta) return;
        e.preventDefault();

        const from = this.items.findIndex((it) => it.id === item.id);
        for (let to = from + delta; to >= 0 && to < this.items.length; to += delta) {
          const next = canonical(moveTo(this.items, item.id, to), this.metrics.columns);
          if (JSON.stringify(next) === JSON.stringify(this.items)) continue;
          this.items = next;
          this.applyPlacements(true);
          if (this.onChange) this.onChange(this.items);
          const newEl = this.widgetEls.get(item.id);
          newEl?.focus();
          break;
        }
      });
    }

    startDrag(id, e) {
      this.draggingId = id;
      this.startOrder = [...this.items];
      this.heldId = id;
      this.lastMove = 0;

      const targetEl = this.widgetEls.get(id);
      if (targetEl) {
        targetEl.style.zIndex = '30';
        targetEl.style.transform = 'scale(1.05)';
        targetEl.classList.add('shadow-2xl');
      }

      const onPointerMove = (ev) => {
        if (!this.draggingId) return;
        if (!this.frame) {
          this.frame = requestAnimationFrame(() => this.stepDrag(ev));
        }
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        clearTimeout(this.longPressTimer);
        cancelAnimationFrame(this.frame);
        this.frame = 0;

        if (targetEl) {
          targetEl.style.zIndex = '';
          targetEl.style.transform = '';
          targetEl.classList.remove('shadow-2xl');
        }

        const moved = JSON.stringify(this.startOrder) !== JSON.stringify(this.items);
        this.draggingId = null;
        this.heldId = null;

        if (moved && this.onChange) {
          this.onChange(this.items);
        }
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }

    stepDrag(ev) {
      this.frame = 0;
      if (!this.draggingId || !this.metrics.columns) return;
      const now = performance.now();
      if (now - this.lastMove < SETTLE_MS) {
        this.frame = requestAnimationFrame(() => this.stepDrag(ev));
        return;
      }

      const me = layout(this.items, this.metrics.columns).find((p) => p.id === this.draggingId);
      if (!me) return;

      const el = this.widgetEls.get(this.draggingId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = ev.clientX || (r.left + r.width / 2);
      const cy = ev.clientY || (r.top + r.height / 2);

      const order = choose(
        this.toSlot(me),
        candidatesFor(this.items, this.draggingId, this.metrics.columns, (b) => this.toSlot(b)),
        cx,
        cy
      );

      if (order) {
        this.lastMove = now;
        this.items = canonical(order, this.metrics.columns);
        this.applyPlacements(true);
      }
    }

    applyPlacements(animate = true) {
      if (!this.metrics.columns) return;
      const places = layout(this.items, this.metrics.columns);

      for (const p of places) {
        const el = this.widgetEls.get(p.id);
        if (!el) continue;
        el.style.gridColumn = `${p.col + 1} / span ${p.w}`;
        el.style.gridRow = `${p.row + 1} / span ${p.h}`;
      }
    }

    destroy() {
      if (this.ro) this.ro.disconnect();
      this.container.innerHTML = '';
    }
  }

  global.DraggableWidgetGridVanilla = DraggableWidgetGridVanilla;
})(window);
