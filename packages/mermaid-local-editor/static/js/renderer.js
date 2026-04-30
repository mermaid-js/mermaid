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

    preview.replaceChildren();

    if (IS_E2E) {
      const cleanSvg = DOMPurify.sanitize(svg, {
        ADD_TAGS: ['foreignObject'],
        ADD_ATTR: ['xmlns'],
      });

      const doc = new DOMParser().parseFromString(cleanSvg, 'image/svg+xml');
      preview.replaceChildren(doc.documentElement);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-same-origin';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    preview.appendChild(iframe);
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

    setTimeout(() => {
      rebuildNavNodes();
    }, 0);

    requestAnimationFrame(() => {
      const svgEl = iframe.contentDocument?.querySelector('svg');
      if (!svgEl) {
        return;
      }

      svgEl.style.transformOrigin = '0 0';
      svgEl.style.display = 'block';
    });

    const style = doc.createElement('style');
    style.textContent = `
      text { fill: #e6e6e6 !important; }
      .node rect, .node polygon, .node path {
        transition: fill 120ms ease, filter 120ms ease;
      }

      .node:hover rect,
      .node:hover polygon,
      .node:hover path {
        fill: rgba(0, 170, 255, 0.25);
        filter: drop-shadow(0 0 11px rgba(0, 170, 255, 0.6));
      }

      g.node.selected-node rect,
      g.node.selected-node polygon,
      g.node.selected-node path {
        fill: rgba(0, 170, 255, 0.35) !important;
        stroke: #00aaff !important;
        stroke-width: 2px !important;
        filter: drop-shadow(0 0 16px rgba(0, 170, 255, 1)) !important;
      }

      g.node.selected-node text {
        fill: #ffffff !important;
        font-weight: bold !important;
      }

      body {
        margin: 0;
        overflow: hidden;
      }
    `;
    doc.head.appendChild(style);

    iframe.addEventListener('load', () => {
      window.focus();
    });

    doc.onwheel = null;
    doc.onmousedown = null;
    doc.onmouseup = null;
    doc.onmousemove = null;

    let isPanningLocal = false;
    let startXLocal = 0;
    let startYLocal = 0;

    doc.onwheel = (e) => {
      e.preventDefault();
      state.scale += e.deltaY * -0.0015;
      state.scale = Math.min(Math.max(0.2, state.scale), 4);
      applyTransform();
    };

    doc.onmousedown = (e) => {
      isPanningLocal = true;
      startXLocal = e.clientX - state.panX;
      startYLocal = e.clientY - state.panY;
      doc.body.style.cursor = 'grabbing';
    };

    doc.onmouseup = () => {
      isPanningLocal = false;
      doc.body.style.cursor = 'default';
    };

    doc.onmousemove = (e) => {
      if (!isPanningLocal) {
        return;
      }
      state.panX = e.clientX - startXLocal;
      state.panY = e.clientY - startYLocal;
      applyTransform();
    };
  } catch (e) {
    preview.replaceChildren();

    const pre = document.createElement('pre');
    pre.style.color = '#ff6b6b';
    pre.textContent = e.message;

    preview.appendChild(pre);
  }
}
