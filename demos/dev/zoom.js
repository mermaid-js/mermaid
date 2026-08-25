// Zoom / pan tool for the diagram dev pages.
//
// Drop `<script src="/dev/zoom.js"></script>` at the end of any page that
// renders `.mermaid` blocks — the dev server serves this file at the root, so
// pages under `cypress/platform` can use it too (same as `/dev/reload.js`).
//
// Every rendered diagram gets a toolbar (zoom out / level / zoom in / fit /
// 1:1 / open full window), ctrl-or-cmd+wheel zoom, drag to pan and
// double-click to zoom in at the pointer. The full-window view zooms on a
// plain wheel and closes with Escape. Nothing about the diagram itself is
// changed, so this stays safe to leave on a page used for visual checks.

const MIN_SCALE = 0.05;
const MAX_SCALE = 40;
const STEP = 1.3;

const STYLES = `
.mzoom {
  position: relative;
  border: 1px solid #ddd;
  margin-bottom: 1em;
  padding: 0;
  background: #fff;
}
.mzoom-bar {
  display: flex;
  align-items: center;
  gap: 0.25em;
  padding: 0.25em 0.4em;
  border-bottom: 1px solid #eee;
  background: #fafafa;
  font: 12px/1.4 sans-serif;
  color: #444;
}
.mzoom-bar button {
  font: inherit;
  min-width: 2em;
  padding: 0.15em 0.5em;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #fff;
  color: #333;
  cursor: pointer;
}
.mzoom-bar button:hover {
  background: #f0f0f0;
}
.mzoom-level {
  min-width: 4em;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.mzoom-hint {
  margin-left: auto;
  color: #888;
}
.mzoom-viewport {
  position: relative;
  overflow: hidden;
  resize: vertical;
  cursor: grab;
  touch-action: none;
  background:
    repeating-conic-gradient(#f6f6f6 0% 25%, #fff 0% 50%) 0 0 / 16px 16px;
}
.mzoom-viewport.mzoom-dragging {
  cursor: grabbing;
}
.mzoom-canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}
.mzoom-canvas > svg {
  display: block;
}
.mzoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.98);
}
.mzoom-overlay .mzoom-viewport {
  flex: 1;
  resize: none;
}
`;

function injectStyles() {
  if (document.querySelector('#mzoom-styles')) return;
  const style = document.createElement('style');
  style.id = 'mzoom-styles';
  style.textContent = STYLES;
  document.head.append(style);
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Intrinsic drawing size of a rendered mermaid svg, from its viewBox. */
function naturalSize(svg) {
  const box = svg.viewBox?.baseVal;
  if (box && box.width > 0 && box.height > 0) {
    return { width: box.width, height: box.height };
  }
  const rect = svg.getBoundingClientRect();
  return { width: rect.width > 0 ? rect.width : 400, height: rect.height > 0 ? rect.height : 300 };
}

function button(label, title, onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.title = title;
  element.addEventListener('click', onClick);
  return element;
}

function makeToolbar(view, { overlay }) {
  const bar = document.createElement('div');
  bar.className = 'mzoom-bar';

  const level = document.createElement('span');
  level.className = 'mzoom-level';
  level.title = 'Current zoom — click to reset to 100%';

  const hint = document.createElement('span');
  hint.className = 'mzoom-hint';
  hint.textContent = overlay
    ? 'scroll to zoom · drag to pan · esc to close'
    : 'ctrl/⌘ + scroll to zoom · drag to pan · double-click to zoom in';

  bar.append(
    button('−', 'Zoom out', () => view.zoomByStep(1 / STEP)),
    level,
    button('+', 'Zoom in', () => view.zoomByStep(STEP)),
    button('Fit', 'Fit the whole diagram in the frame', () => view.fit()),
    button('1:1', 'Show at actual size', () => view.actualSize())
  );
  if (overlay) {
    bar.append(button('✕', 'Close (esc)', () => view.close()));
  } else {
    bar.append(button('⤢', 'Open in the full window', () => view.open()));
  }
  bar.append(hint);

  level.addEventListener('click', () => view.actualSize());
  view.onScale((scale) => {
    level.textContent = `${Math.round(scale * 100)}%`;
  });

  return bar;
}

/**
 * Wheel / drag / double-click zoom-pan on one viewport. `wheelNeedsModifier`
 * keeps a plain wheel scrolling the page on the inline frames, where several
 * diagrams share a long page.
 */
function bindGestures(viewport, view, { wheelNeedsModifier }) {
  viewport.addEventListener(
    'wheel',
    (event) => {
      if (wheelNeedsModifier && !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const point = view.pointIn(viewport, event);
      view.zoomAt(view.scale * Math.exp(-event.deltaY * 0.0015), point);
    },
    { passive: false }
  );

  let panning = null;
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    panning = { id: event.pointerId, x: event.clientX, y: event.clientY };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('mzoom-dragging');
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!panning || event.pointerId !== panning.id) return;
    view.panBy(event.clientX - panning.x, event.clientY - panning.y);
    panning.x = event.clientX;
    panning.y = event.clientY;
  });
  const endPan = (event) => {
    if (!panning || event.pointerId !== panning.id) return;
    panning = null;
    viewport.classList.remove('mzoom-dragging');
  };
  viewport.addEventListener('pointerup', endPan);
  viewport.addEventListener('pointercancel', endPan);

  viewport.addEventListener('dblclick', (event) => {
    event.preventDefault();
    const factor = event.altKey || event.shiftKey ? 1 / STEP / STEP : STEP * STEP;
    view.zoomAt(view.scale * factor, view.pointIn(viewport, event));
  });
}

/** Turn one rendered `.mermaid` block into a zoomable frame. */
function attach(host, svg) {
  const natural = naturalSize(svg);
  svg.style.maxWidth = 'none';
  svg.style.width = `${natural.width}px`;
  svg.style.height = `${natural.height}px`;
  svg.setAttribute('width', natural.width);
  svg.setAttribute('height', natural.height);

  const canvas = document.createElement('div');
  canvas.className = 'mzoom-canvas';
  canvas.append(svg);

  const viewport = document.createElement('div');
  viewport.className = 'mzoom-viewport';
  viewport.style.height = `${clamp(natural.height + 16, 200, window.innerHeight * 0.7)}px`;
  viewport.append(canvas);

  host.classList.add('mzoom');
  host.dataset.mzoom = 'on';

  const state = { scale: 1, x: 0, y: 0 };
  const scaleListeners = [];
  let overlay = null;

  const frame = () => overlay?.viewport ?? viewport;

  const apply = () => {
    canvas.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
    for (const listener of scaleListeners) listener(state.scale);
  };

  const view = {
    get scale() {
      return state.scale;
    },
    onScale(listener) {
      scaleListeners.push(listener);
      listener(state.scale);
    },
    pointIn(element, event) {
      const rect = element.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    },
    zoomAt(scale, point) {
      const next = clamp(scale, MIN_SCALE, MAX_SCALE);
      const factor = next / state.scale;
      state.x = point.x - factor * (point.x - state.x);
      state.y = point.y - factor * (point.y - state.y);
      state.scale = next;
      apply();
    },
    zoomByStep(factor) {
      const rect = frame().getBoundingClientRect();
      view.zoomAt(state.scale * factor, { x: rect.width / 2, y: rect.height / 2 });
    },
    panBy(dx, dy) {
      state.x += dx;
      state.y += dy;
      apply();
    },
    center(scale) {
      const rect = frame().getBoundingClientRect();
      state.scale = clamp(scale, MIN_SCALE, MAX_SCALE);
      state.x = (rect.width - natural.width * state.scale) / 2;
      state.y = (rect.height - natural.height * state.scale) / 2;
      apply();
    },
    fit(cap = MAX_SCALE) {
      const rect = frame().getBoundingClientRect();
      const margin = 16;
      view.center(
        Math.min((rect.width - margin) / natural.width, (rect.height - margin) / natural.height, cap)
      );
    },
    actualSize() {
      view.center(1);
    },
    open() {
      if (overlay) return;
      const root = document.createElement('div');
      root.className = 'mzoom-overlay';
      const bigViewport = document.createElement('div');
      bigViewport.className = 'mzoom-viewport';
      bigViewport.append(canvas);
      overlay = { root, viewport: bigViewport, saved: { ...state } };
      root.append(makeToolbar(view, { overlay: true }), bigViewport);
      document.body.append(root);
      bindGestures(bigViewport, view, { wheelNeedsModifier: false });
      document.addEventListener('keydown', onKeydown);
      view.fit();
    },
    close() {
      if (!overlay) return;
      const { root, saved } = overlay;
      viewport.append(canvas);
      root.remove();
      overlay = null;
      document.removeEventListener('keydown', onKeydown);
      Object.assign(state, saved);
      apply();
    },
  };

  function onKeydown(event) {
    if (!overlay) return;
    if (event.key === 'Escape') view.close();
    else if (event.key === '+' || event.key === '=') view.zoomByStep(STEP);
    else if (event.key === '-') view.zoomByStep(1 / STEP);
    else if (event.key === '0') view.fit();
    else if (event.key === '1') view.actualSize();
    else return;
    event.preventDefault();
  }

  host.append(makeToolbar(view, { overlay: false }), viewport);
  bindGestures(viewport, view, { wheelNeedsModifier: true });
  // Start with the whole diagram visible, but never blown up past its own size.
  view.fit(1);
}

function scan() {
  for (const host of document.querySelectorAll('.mermaid')) {
    if (host.dataset.mzoom || host.closest('.mzoom-overlay')) continue;
    const svg = host.querySelector(':scope > svg');
    if (svg) attach(host, svg);
  }
}

let queued = false;
function scheduleScan() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    injectStyles();
    scan();
  });
}

scheduleScan();
new MutationObserver(scheduleScan).observe(document.documentElement, {
  subtree: true,
  childList: true,
});
