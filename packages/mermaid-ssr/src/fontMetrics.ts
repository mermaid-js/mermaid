import { declaredProperty, resolveInheritedProperty } from './cssProperty.js';
import { resolveFont } from './fonts.js';

export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_FONT_FAMILY = '"trebuchet ms", verdana, arial, sans-serif';

/** Depth guard for the recursive font-size walk. */
const MAX_INHERIT_DEPTH = 64;

export interface FontSpec {
  family: string;
  size: number;
  weight: number;
}

const RE_ABSOLUTE_SIZE = /^([\d.]+)\s*(px|pt)?$/i;
const RE_RELATIVE_SIZE = /^([\d.]+)\s*(em|rem|%)$/i;
const RE_EM_VALUE = /^(-?[\d.]+)\s*em$/;

/** A font-size in absolute px, or undefined when the value is relative. */
function absoluteSize(value: string): number | undefined {
  const match = RE_ABSOLUTE_SIZE.exec(value);
  if (!match) {
    return undefined;
  }
  const size = Number.parseFloat(match[1]);
  if (!Number.isFinite(size) || size <= 0) {
    return undefined;
  }
  return match[2]?.toLowerCase() === 'pt' ? size * 1.333 : size;
}

/** A font-size given as a multiple of another size, e.g. `0.75em` or `82%`. */
function relativeSize(value: string): { factor: number; ofRoot: boolean } | undefined {
  const match = RE_RELATIVE_SIZE.exec(value);
  if (!match) {
    return undefined;
  }
  const raw = Number.parseFloat(match[1]);
  if (!Number.isFinite(raw)) {
    return undefined;
  }
  const unit = match[2].toLowerCase();
  return { factor: unit === '%' ? raw / 100 : raw, ofRoot: unit === 'rem' };
}

/**
 * Font size in px.
 *
 * Walks up to the nearest element that declares one. Relative units are
 * resolved against the size that element inherits, which is how mermaid sizes
 * c4's secondary label rows (`font-size: 0.75em` under a 14px label).
 */
export function getFontSize(el: Element | null, depth = 0): number {
  if (!el || depth > MAX_INHERIT_DEPTH) {
    return DEFAULT_FONT_SIZE;
  }
  const declared = declaredProperty(el, 'font-size');
  if (!declared || declared === 'inherit') {
    return getFontSize(el.parentElement, depth + 1);
  }
  const absolute = absoluteSize(declared);
  if (absolute !== undefined) {
    return absolute;
  }
  const relative = relativeSize(declared);
  if (relative) {
    const base = relative.ofRoot ? DEFAULT_FONT_SIZE : getFontSize(el.parentElement, depth + 1);
    return relative.factor * base;
  }
  return getFontSize(el.parentElement, depth + 1);
}

/** Font family, as the CSS font-family list it was declared with. */
export function getFontFamily(el: Element): string {
  return resolveInheritedProperty(el, 'font-family') ?? DEFAULT_FONT_FAMILY;
}

/** Font weight as a number, mapping the CSS keywords onto their numeric values. */
export function getFontWeight(el: Element): number {
  const declared = resolveInheritedProperty(el, 'font-weight')?.toLowerCase();
  if (!declared) {
    return 400;
  }
  if (declared === 'bold' || declared === 'bolder') {
    return 700;
  }
  if (declared === 'normal' || declared === 'lighter') {
    return 400;
  }
  const numeric = Number.parseInt(declared, 10);
  return Number.isFinite(numeric) ? numeric : 400;
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
    return Number.parseFloat(m[1]) * fontSize;
  }
  return undefined;
}
