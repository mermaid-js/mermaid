/**
 * Font metrics for estimating text dimensions without a browser.
 *
 * Uses standard Helvetica AFM (Adobe Font Metrics) advance widths which
 * closely match Arial and other common sans-serif fonts used by Mermaid.
 */

// ── Helvetica AFM per-character advance widths (units per 1000 em) ──────────

/* prettier-ignore */
const HELVETICA_WIDTHS: Record<string, number> = {
  A: 667, B: 667, C: 722, D: 722, E: 611, F: 556, G: 778, H: 722,
  I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667,
  Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667,
  Y: 667, Z: 611,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556,
  i: 222, j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556,
  q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500,
  y: 500, z: 500,
  '0': 556, '1': 556, '2': 556, '3': 556, '4': 556,
  '5': 556, '6': 556, '7': 556, '8': 556, '9': 556,
  ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889,
  '&': 667, "'": 191, '(': 333, ')': 333, '*': 389, '+': 584,
  ',': 278, '-': 333, '.': 278, '/': 278, ':': 278, ';': 278,
  '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015, '[': 278,
  '\\': 278, ']': 278, '^': 469, '_': 556, '`': 333, '{': 334,
  '|': 260, '}': 334, '~': 584,
};

/** Fallback advance width for characters not in the table. */
const DEFAULT_CHAR_WIDTH = 512;

/** Helvetica ascender height (units per 1000 em). */
const ASCENDER = 718;
/** Helvetica descender depth (units per 1000 em, absolute value). */
const DESCENDER = 207;
/** Total line-box height per em: ascender + |descender|. */
const FONT_BBOX_HEIGHT_PER_EM = ASCENDER + DESCENDER; // 925

/** Width multiplier for bold text (font-weight ≥ 600). */
const BOLD_WIDTH_MULTIPLIER = 1.1;

/** Default font-size in px when nothing is specified. */
export const DEFAULT_FONT_SIZE = 16;

// ── Font property extraction ────────────────────────────────────────────────

const RE_FONT_SIZE_PX = /font-size:\s*([\d.]+)\s*px/;
const RE_FONT_SIZE_PT = /font-size:\s*([\d.]+)\s*pt/;
const RE_FONT_WEIGHT = /font-weight:\s*([\da-z]+)/i;
const RE_EM_VALUE = /^(-?[\d.]+)\s*em$/;

/** Extract font-size (px) from an element, walking up the tree as needed. */
export function getFontSize(el: Element): number {
  const style = el.getAttribute('style') ?? '';

  const pxMatch = RE_FONT_SIZE_PX.exec(style);
  if (pxMatch) {
    return parseFloat(pxMatch[1]);
  }

  const ptMatch = RE_FONT_SIZE_PT.exec(style);
  if (ptMatch) {
    return parseFloat(ptMatch[1]) * 1.333; // 1 pt ≈ 1.333 px
  }

  const attr = el.getAttribute('font-size');
  if (attr) {
    const n = parseFloat(attr);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }

  if (el.parentElement) {
    return getFontSize(el.parentElement);
  }
  return DEFAULT_FONT_SIZE;
}

/** Extract font-weight from an element, walking up the tree as needed. */
export function getFontWeight(el: Element): number {
  const style = el.getAttribute('style') ?? '';
  const wMatch = RE_FONT_WEIGHT.exec(style);
  if (wMatch) {
    const v = wMatch[1].toLowerCase();
    if (v === 'bold') {
      return 700;
    }
    if (v === 'normal' || v === 'lighter') {
      return 400;
    }
    const n = parseInt(v, 10);
    if (Number.isFinite(n)) {
      return n;
    }
  }

  const attr = el.getAttribute('font-weight');
  if (attr) {
    if (attr === 'bold') {
      return 700;
    }
    const n = parseInt(attr, 10);
    if (Number.isFinite(n)) {
      return n;
    }
  }

  if (el.parentElement) {
    return getFontWeight(el.parentElement);
  }
  return 400;
}

// ── Text measurement ────────────────────────────────────────────────────────

/** Measure pixel width of `text` using per-character Helvetica AFM widths. */
export function measureTextWidth(text: string, fontSize: number, fontWeight: number): number {
  if (!text) {
    return 0;
  }
  const bold = fontWeight >= 600 ? BOLD_WIDTH_MULTIPLIER : 1.0;
  const scale = fontSize / 1000; // AFM units → px
  let width = 0;
  for (const ch of text) {
    width += (HELVETICA_WIDTHS[ch] ?? DEFAULT_CHAR_WIDTH) * scale * bold;
  }
  return width;
}

/** Height of a single line of text (ascender + descender) at `fontSize`. */
export function lineBoxHeight(fontSize: number): number {
  return (FONT_BBOX_HEIGHT_PER_EM / 1000) * fontSize;
}

/** Parse a CSS/SVG value that may be in `em` units, returning px. */
export function parseEmValue(value: string, fontSize: number): number | undefined {
  const m = RE_EM_VALUE.exec(value);
  if (m) {
    return parseFloat(m[1]) * fontSize;
  }
  return undefined;
}
