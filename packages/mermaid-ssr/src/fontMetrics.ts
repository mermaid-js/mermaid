import { outermostSvg } from './cssProperty.js';
import { resolveFont } from './fonts.js';

export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_FONT_FAMILY = '"trebuchet ms", verdana, arial, sans-serif';

export interface FontSpec {
  family: string;
  size: number;
  weight: number;
}

const RE_FONT_SIZE_PX = /font-size:\s*([\d.]+)\s*px/;
const RE_FONT_SIZE_PT = /font-size:\s*([\d.]+)\s*pt/;
const RE_FONT_WEIGHT = /font-weight:\s*([\da-z]+)/i;
const RE_FONT_FAMILY = /font-family:\s*([^;}]+)/;
const RE_EM_VALUE = /^(-?[\d.]+)\s*em$/;
const RE_REGEXP_SPECIAL = /[$()*+.?[\\\]^{|}]/g;

interface RootStyle {
  family?: string;
  size?: number;
}

const rootStyleCache = new WeakMap<Element, RootStyle>();

/** Font declarations from the `#<svg id> { ... }` rule of the diagram's own stylesheet. */
function getRootStyle(el: Element): RootStyle {
  const svg = outermostSvg(el);
  if (!svg) {
    return {};
  }
  const cached = rootStyleCache.get(svg);
  if (cached) {
    return cached;
  }
  const result: RootStyle = {};
  const id = svg.getAttribute('id');
  const css = svg.querySelector('style')?.textContent ?? '';
  if (id && css) {
    const escaped = id.replaceAll(RE_REGEXP_SPECIAL, String.raw`\$&`);
    const rule = new RegExp(String.raw`#${escaped}\s*\{([^}]*)\}`).exec(css)?.[1] ?? '';
    const family = RE_FONT_FAMILY.exec(rule)?.[1]?.trim();
    if (family) {
      result.family = family;
    }
    const px = RE_FONT_SIZE_PX.exec(rule);
    if (px) {
      result.size = parseFloat(px[1]);
    }
  }
  rootStyleCache.set(svg, result);
  return result;
}

function inlineFontSize(el: Element): number | undefined {
  const style = el.getAttribute('style') ?? '';

  const pxMatch = RE_FONT_SIZE_PX.exec(style);
  if (pxMatch) {
    return parseFloat(pxMatch[1]);
  }

  const ptMatch = RE_FONT_SIZE_PT.exec(style);
  if (ptMatch) {
    return parseFloat(ptMatch[1]) * 1.333;
  }

  const attr = el.getAttribute('font-size');
  if (attr) {
    const n = parseFloat(attr);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }

  return el.parentElement ? inlineFontSize(el.parentElement) : undefined;
}

function inlineFontFamily(el: Element): string | undefined {
  const style = el.getAttribute('style') ?? '';
  const styleMatch = RE_FONT_FAMILY.exec(style);
  if (styleMatch) {
    return styleMatch[1].trim();
  }

  const attr = el.getAttribute('font-family');
  if (attr) {
    return attr.trim();
  }

  return el.parentElement ? inlineFontFamily(el.parentElement) : undefined;
}

/** Font size in px: inline style or attribute (walking up), then the root svg stylesheet. */
export function getFontSize(el: Element): number {
  return inlineFontSize(el) ?? getRootStyle(el).size ?? DEFAULT_FONT_SIZE;
}

/** Font family: inline style or attribute (walking up), then the root svg stylesheet. */
export function getFontFamily(el: Element): string {
  return inlineFontFamily(el) ?? getRootStyle(el).family ?? DEFAULT_FONT_FAMILY;
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

export function fontOf(el: Element): FontSpec {
  return { family: getFontFamily(el), size: getFontSize(el), weight: getFontWeight(el) };
}

/** Advance width of `text` in px, including kerning. */
export function measureTextWidth(text: string, spec: FontSpec): number {
  if (!text) {
    return 0;
  }
  return resolveFont(spec.family, spec.weight).getAdvanceWidth(text, spec.size, { kerning: true });
}

/**
 * Ascent and descent in px. Each part is rounded to whole pixels, matching how
 * Chromium reports SVG text bounding boxes.
 */
export function lineMetrics(spec: FontSpec): { ascent: number; descent: number } {
  const font = resolveFont(spec.family, spec.weight);
  const scale = spec.size / font.unitsPerEm;
  return {
    ascent: Math.round(font.ascender * scale),
    descent: Math.round(-font.descender * scale),
  };
}

/** Height of a single line of text at the given font. */
export function lineBoxHeight(spec: FontSpec): number {
  const { ascent, descent } = lineMetrics(spec);
  return ascent + descent;
}

/** Parse a CSS/SVG value that may be in `em` units, returning px. */
export function parseEmValue(value: string, fontSize: number): number | undefined {
  const m = RE_EM_VALUE.exec(value);
  if (m) {
    return parseFloat(m[1]) * fontSize;
  }
  return undefined;
}
