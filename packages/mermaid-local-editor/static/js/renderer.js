/* global mermaid, DOMPurify */

export async function renderDiagram({
  srcValue,
  preview,
  state,
  IS_E2E,
  applyTransform,
  rebuildNavNodes,
}) {
  try {
    const { svg } = await mermaid.render(IS_E2E ? 'm1' : 'm' + Date.now(), srcValue);

    // Tear down previous render and all its event listeners
    preview.replaceChildren();
    state.iframeRef = null;
    if (state.abortController) {
      state.abortController.abort();
    }
    state.abortController = new AbortController();
    const { signal } = state.abortController;

    if (IS_E2E) {
      const cleanSvg = DOMPurify.sanitize(svg, {
        ADD_TAGS: ['foreignObject'],
        ADD_ATTR: ['xmlns'],
      });
      const doc = new DOMParser().parseFromString(cleanSvg, 'image/svg+xml');
      preview.replaceChildren(doc.documentElement);
      return;
    }

    // iframe renders the SVG but never receives pointer events
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-same-origin';
    iframe.style.cssText = 'width:100%;height:100%;border:none;pointer-events:none;display:block;';

    // Overlay sits on top and captures all mouse/wheel events in parent coordinate space
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;z-index:10;cursor:default;';

    preview.style.position = 'relative';
    preview.appendChild(iframe);
    preview.appendChild(overlay);
    state.iframeRef = iframe;

    const cleanSvg = DOMPurify.sanitize(svg, {
      ADD_TAGS: ['foreignObject'],
      ADD_ATTR: ['xmlns'],
    });

    const parsed = new DOMParser().parseFromString(cleanSvg, 'image/svg+xml');
    const svgEl = parsed.documentElement;
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgEl.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    const doc = iframe.contentDocument;
    doc.open();
    doc.close();
    doc.body.appendChild(doc.importNode(svgEl, true));

    setTimeout(() => rebuildNavNodes(), 0);

    requestAnimationFrame(() => {
      const s = iframe.contentDocument?.querySelector('svg');
      if (s) {
        s.style.transformOrigin = '0 0';
        s.style.display = 'block';
      }
    });

    const style = doc.createElement('style');
    style.textContent = `
      .node rect, .node polygon, .node path {
        transition: fill 120ms ease, filter 120ms ease;
      }
      .node:hover rect,
      .node:hover polygon,
      .node:hover path {
        filter: drop-shadow(0 0 8px rgba(0, 120, 220, 0.55));
      }
      g.node.selected-node rect,
      g.node.selected-node polygon,
      g.node.selected-node path {
        stroke: #0078dc !important;
        stroke-width: 2.5px !important;
        filter: drop-shadow(0 0 12px rgba(0, 120, 220, 0.8)) !important;
      }
      body {
        margin: 0;
        overflow: hidden;
        background: #ffffff;
      }
    `;
    doc.head.appendChild(style);

    // ── Zoom (cursor-anchored, multiplicative) ────────────────────────────────
    overlay.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const rect = overlay.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        const oldScale = state.scale;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        state.scale = Math.min(Math.max(0.05, oldScale * factor), 20);

        const ratio = state.scale / oldScale;
        state.panX = cx - ratio * (cx - state.panX);
        state.panY = cy - ratio * (cy - state.panY);

        applyTransform();
      },
      { passive: false, signal }
    );

    // ── Panning ───────────────────────────────────────────────────────────────
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    overlay.addEventListener(
      'mousedown',
      (e) => {
        isPanning = true;
        startX = e.clientX - state.panX;
        startY = e.clientY - state.panY;
        overlay.style.cursor = 'grabbing';
      },
      { signal }
    );

    document.addEventListener(
      'mouseup',
      () => {
        if (!isPanning) {
          return;
        }
        isPanning = false;
        overlay.style.cursor = 'default';
      },
      { signal }
    );

    document.addEventListener(
      'mousemove',
      (e) => {
        if (!isPanning) {
          return;
        }
        state.panX = e.clientX - startX;
        state.panY = e.clientY - startY;
        applyTransform();
      },
      { signal }
    );
  } catch (e) {
    preview.replaceChildren();
    const pre = document.createElement('pre');
    pre.style.color = '#ff6b6b';
    pre.textContent = e.message;
    preview.appendChild(pre);
  }
}
