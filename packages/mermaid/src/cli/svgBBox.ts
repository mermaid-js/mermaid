/**
 * SVG bounding-box estimation without a browser.
 *
 * Walks the SVG element tree and computes approximate bounding boxes
 * from tag names, attributes, and text content — replacing the
 * browser-native `getBBox()`.
 */
import { svgPathBbox } from 'svg-path-bbox';
import {
  getFontSize,
  getFontWeight,
  measureTextWidth,
  lineBoxHeight,
  parseEmValue,
} from './fontMetrics.js';

/** Simple {x, y, width, height} rectangle. */
export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ZERO_BOX: BBox = { x: 0, y: 0, width: 0, height: 0 };

// ── Helpers ────────────────────────────────────────────────────────────

/** Read a numeric attribute, returning 0 when absent or NaN. */
function numAttr(el: Element, name: string): number {
  const v = parseFloat(el.getAttribute(name) ?? '');
  return Number.isFinite(v) ? v : 0;
}

/** Get the full text content of an element. */
export function getTextContent(el: Element): string {
  return el.textContent ?? '';
}

const RE_TRANSLATE = /translate\(\s*([^,)]+)\s*(?:,\s*([^)]+))?\s*\)/;

// ── Leaf geometry ──────────────────────────────────────────────────────

function rectBBox(el: Element): BBox {
  return {
    x: numAttr(el, 'x'),
    y: numAttr(el, 'y'),
    width: numAttr(el, 'width'),
    height: numAttr(el, 'height'),
  };
}

function circleBBox(el: Element): BBox {
  const cx = numAttr(el, 'cx'),
    cy = numAttr(el, 'cy'),
    r = numAttr(el, 'r');
  return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
}

function ellipseBBox(el: Element): BBox {
  const cx = numAttr(el, 'cx'),
    cy = numAttr(el, 'cy');
  const rx = numAttr(el, 'rx'),
    ry = numAttr(el, 'ry');
  return { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 };
}

function lineBBox(el: Element): BBox {
  const x1 = numAttr(el, 'x1'),
    y1 = numAttr(el, 'y1');
  const x2 = numAttr(el, 'x2'),
    y2 = numAttr(el, 'y2');
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

// ── Points-based shapes ────────────────────────────────────────────────

function pointsBBox(el: Element): BBox {
  const coords = (el.getAttribute('points') ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter(Number.isFinite);
  if (coords.length < 4) {
    return ZERO_BOX;
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i < coords.length - 1; i += 2) {
    minX = Math.min(minX, coords[i]);
    maxX = Math.max(maxX, coords[i]);
    minY = Math.min(minY, coords[i + 1]);
    maxY = Math.max(maxY, coords[i + 1]);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function pathBBox(el: Element): BBox {
  const d = el.getAttribute('d');
  if (!d) {
    return ZERO_BOX;
  }
  try {
    const [minX, minY, maxX, maxY] = svgPathBbox(d);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } catch {
    return ZERO_BOX;
  }
}

// ── Text elements ──────────────────────────────────────────────────────

function textBBox(el: Element): BBox {
  const fontSize = getFontSize(el);
  const fontWeight = getFontWeight(el);
  const tspans = el.querySelectorAll('tspan');

  if (tspans.length > 0) {
    const textY = numAttr(el, 'y');
    // Tuned to better match browser getBBox() for Mermaid's svg <text>/<tspan> labels.
    const ascent = fontSize * 0.94;
    const descent = fontSize * 0.25;
    let hasVisibleText = false;
    let totalMinY = 0;
    let totalMaxY = 0;
    let maxW = 0;
    let currentBaseline = textY;

    for (let i = 0; i < tspans.length; i++) {
      const ts = tspans[i];
      const lineText = ts.textContent ?? '';
      if (lineText.trim()) {
        hasVisibleText = true;
      }
      const w = measureTextWidth(lineText, fontSize, fontWeight);
      if (w > maxW) {
        maxW = w;
      }

      const dyAttr = ts.getAttribute('dy') ?? '';
      const dyPx = parseEmValue(dyAttr, fontSize) ?? (parseFloat(dyAttr) || 0);

      const yAttr = ts.getAttribute('y') ?? '';
      let baseline: number;
      const yEm = parseEmValue(yAttr, fontSize);
      if (yEm !== undefined) {
        baseline = yEm;
      } else if (yAttr) {
        baseline = parseFloat(yAttr) || 0;
      } else {
        baseline = i === 0 ? textY : currentBaseline;
      }

      baseline += dyPx;
      currentBaseline = baseline;

      const lineTop = baseline - ascent;
      const lineBottom = baseline + descent;
      if (i === 0 || lineTop < totalMinY) {
        totalMinY = lineTop;
      }
      if (i === 0 || lineBottom > totalMaxY) {
        totalMaxY = lineBottom;
      }
    }

    if (!hasVisibleText) {
      return ZERO_BOX;
    }

    return {
      x: numAttr(el, 'x'),
      y: totalMinY,
      width: maxW,
      height: Math.max(totalMaxY - totalMinY, ascent + descent),
    };
  }

  // Single-line text (no tspan children)
  const text = getTextContent(el);
  if (!text.trim()) {
    return ZERO_BOX;
  }
  const w = measureTextWidth(text, fontSize, fontWeight);
  const h = lineBoxHeight(fontSize);
  return { x: numAttr(el, 'x'), y: numAttr(el, 'y') - h, width: w, height: h };
}

// ── foreignObject ──────────────────────────────────────────────────────

function foreignObjectBBox(el: Element): BBox {
  return {
    x: numAttr(el, 'x'),
    y: numAttr(el, 'y'),
    width: numAttr(el, 'width') || 100,
    height: numAttr(el, 'height') || 100,
  };
}

// ── Non-visual tags to skip ────────────────────────────────────────────

const SKIP_TAGS = new Set(['style', 'defs', 'marker']);

// ── Main estimator ─────────────────────────────────────────────────────

/** Tag → specialised bbox handler. */
const TAG_HANDLERS: Record<string, (el: Element) => BBox> = {
  rect: rectBBox,
  circle: circleBBox,
  ellipse: ellipseBBox,
  line: lineBBox,
  polygon: pointsBBox,
  polyline: pointsBBox,
  path: pathBBox,
  text: textBBox,
  tspan: textBBox,
  foreignobject: foreignObjectBBox,
};

/**
 * Estimate the bounding box of an SVG element by inspecting its tag,
 * attributes, text content, and children.
 *
 * This is the drop-in replacement for the browser's native `getBBox()`.
 */
export function estimateBBox(el: Element): BBox {
  const tag = el.tagName?.toLowerCase();

  // Fast path: known element types
  const handler = TAG_HANDLERS[tag];
  if (handler) {
    return handler(el);
  }

  // Container elements (g, svg, …): union of child bounding boxes
  const children = el.children;
  if (children.length === 0) {
    const text = getTextContent(el);
    if (text.trim()) {
      const fontSize = getFontSize(el);
      const fontWeight = getFontWeight(el);
      return {
        x: 0,
        y: 0,
        width: measureTextWidth(text, fontSize, fontWeight),
        height: lineBoxHeight(fontSize),
      };
    }
    return ZERO_BOX;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (SKIP_TAGS.has(child.tagName?.toLowerCase())) {
      continue;
    }

    const cb = estimateBBox(child);

    // Apply translate() transform
    let tx = 0;
    let ty = 0;
    const transform = child.getAttribute('transform');
    if (transform) {
      const m = RE_TRANSLATE.exec(transform);
      if (m) {
        tx = parseFloat(m[1]) || 0;
        ty = parseFloat(m[2] ?? '0') || 0;
      }
    }

    const bx = cb.x + tx;
    const by = cb.y + ty;
    if (cb.width > 0 || cb.height > 0) {
      minX = Math.min(minX, bx);
      minY = Math.min(minY, by);
      maxX = Math.max(maxX, bx + cb.width);
      maxY = Math.max(maxY, by + cb.height);
    }
  }

  if (!Number.isFinite(minX)) {
    return ZERO_BOX;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
