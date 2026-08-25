/**
 * Post-process Mermaid SVG for CSS-variable themes and web embedding.
 *
 * Thin in-tree mirror of https://github.com/openshellorg/mermaid-svg-css-vars
 * Kept local so Mermaid does not depend on that package.
 *
 * Why: khroma derives theme colors from concrete values, so CSS vars cannot be
 * themeVariable *inputs*. Emit `var(--mermaid-<slot>, <resolved>)` after render.
 *
 * @see https://github.com/mermaid-js/mermaid/issues/8007
 * @see https://github.com/mermaid-js/mermaid/issues/6860
 */
// cspell:ignore openshellorg

const DEFAULT_PREFIX = '--mermaid-';

const NON_COLOR_KEYS = new Set([
  'darkMode',
  'fontFamily',
  'fontSize',
  'THEME_COLOR_LIMIT',
  'theme',
  'look',
  'radius',
  'strokeWidth',
]);

const LOOKS_LIKE_COLOR =
  /^(#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i;

export type ThemeVariablesRecord = Record<string, string | number | boolean | undefined | null>;

export type CssVariableThemeOption = boolean | { prefix?: string };

export type WebCompatibilityOption =
  | boolean
  | {
      responsiveWidth?: boolean;
      responsiveHeight?: boolean;
      ensureViewBox?: boolean;
      stripBackground?: boolean;
      /** When missing on the SVG: string value to set, or false to leave unchanged. */
      preserveAspectRatio?: string | boolean;
    };

function isConcreteColor(value: string): boolean {
  const v = value.trim();
  if (!v || v === 'calculated' || v === 'none' || v === 'transparent') {
    return false;
  }
  if (v.startsWith('var(')) {
    return false;
  }
  return LOOKS_LIKE_COLOR.test(v);
}

function normalizeHex(value: string): string | null {
  const m = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value.trim());
  if (!m) {
    return null;
  }
  const h = m[1].toLowerCase();
  if (h.length === 3 || h.length === 4) {
    return `#${[...h].map((c) => c + c).join('')}`;
  }
  return `#${h}`;
}

function colorKey(value: string): string {
  const trimmed = value.trim();
  const hex = normalizeHex(trimmed);
  if (hex) {
    return hex;
  }
  if (/^(rgba?|hsla?)\(/i.test(trimmed)) {
    return trimmed.replace(/\s+/g, '').toLowerCase();
  }
  return trimmed.toLowerCase();
}

function escapeRegExp(s: string): string {
  return s.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
}

/** Shorthand only when each expanded pair is a doubled digit (`#aabbcc` → `abc`). */
function toPairedShorthand(long: string): string | null {
  let short = '';
  for (let i = 0; i < long.length; i += 2) {
    if (long[i] !== long[i + 1]) {
      return null;
    }
    short += long[i];
  }
  return short;
}

function colorOccurrenceRegex(fallback: string): RegExp {
  const hex = normalizeHex(fallback);
  if (hex) {
    if (hex.length === 7 || hex.length === 9) {
      const long = hex.slice(1);
      const short = toPairedShorthand(long);
      return new RegExp(short ? `#(?:${long}|${short})` : `#${long}`, 'gi');
    }
    return new RegExp(escapeRegExp(hex), 'gi');
  }
  if (/^(rgba?|hsla?)\(/i.test(fallback.trim())) {
    const trimmed = fallback.trim();
    const fn = /^(rgba?|hsla?)/i.exec(trimmed)![1];
    const inner = trimmed.replace(/^(rgba?|hsla?)\(/i, '').replace(/\)$/, '');
    const parts = inner.split(',').map((p) => escapeRegExp(p.trim()));
    return new RegExp(`${fn}\\(\\s*${parts.join('\\s*,\\s*')}\\s*\\)`, 'gi');
  }
  return new RegExp(`(?<![\\w-])${escapeRegExp(fallback.trim())}(?![\\w-])`, 'gi');
}

interface ColorBinding {
  cssVar: string;
  fallback: string;
}

function buildBindings(themeVariables: ThemeVariablesRecord, prefix: string): ColorBinding[] {
  const byKey = new Map<string, ColorBinding>();
  for (const [rawName, rawValue] of Object.entries(themeVariables)) {
    if (typeof rawValue !== 'string' || NON_COLOR_KEYS.has(rawName)) {
      continue;
    }
    if (!isConcreteColor(rawValue)) {
      continue;
    }
    const key = colorKey(rawValue);
    if (!byKey.has(key)) {
      byKey.set(key, {
        cssVar: `${sanitizeCssIdent(prefix)}${rawName}`,
        fallback: rawValue.trim(),
      });
    }
  }
  return [...byKey.values()].sort((a, b) => b.fallback.length - a.fallback.length);
}

/**
 * Rewrite concrete theme colors in SVG to `var(--mermaid-<name>, <fallback>)`.
 */
export function rewriteMermaidSvgCssVars(
  svg: string,
  themeVariables: ThemeVariablesRecord,
  options: { prefix?: string } = {}
): string {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const bindings = buildBindings(themeVariables, prefix);
  if (bindings.length === 0) {
    return svg;
  }

  return rewritePaintContexts(svg, (chunk) => applyColorBindings(chunk, bindings));
}

const PAINT_PROPERTIES = 'fill|stroke|stop-color|color|flood-color|lighting-color';

/** CSS custom-property-safe ident (defense in depth vs directive injection). */
function sanitizeCssIdent(value: string): string {
  const cleaned = value.replace(/[^\w-]/g, '');
  if (!cleaned) {
    return DEFAULT_PREFIX;
  }
  return cleaned.startsWith('--') ? cleaned : `--${cleaned}`;
}

function rewritePaintDeclarations(css: string, rewrite: (chunk: string) => string): string {
  const paintDecl = new RegExp(`(^|[{;]\\s*)(${PAINT_PROPERTIES})\\s*:\\s*([^;}"']+)`, 'gi');
  return css.replace(paintDecl, (_full, prefix: string, prop: string, value: string) => {
    return `${prefix}${prop}: ${rewrite(value.trim())}`;
  });
}

function applyColorBindings(chunk: string, bindings: ColorBinding[]): string {
  let out = chunk;
  for (const binding of bindings) {
    const re = colorOccurrenceRegex(binding.fallback);
    const source = out;
    out = source.replace(re, (match, offset: number) => {
      const before = source.slice(Math.max(0, offset - 80), offset);
      if (/var\s*\(\s*--[\w-]*\s*(?:,\s*)?$/i.test(before) || /var\s*\([^)]*$/i.test(before)) {
        return match;
      }
      return `var(${binding.cssVar}, ${match})`;
    });
  }
  return out;
}

/**
 * Rewrite colors only in paint contexts: `<style>` CSS and fill/stroke/style attrs.
 * Never touch element text (labels like "Red Team").
 */
function rewritePaintContexts(svg: string, rewrite: (chunk: string) => string): string {
  let out = svg.replace(/<style\b[^>]*>[\S\s]*?<\/style>/gi, (block) =>
    rewritePaintDeclarations(block, rewrite)
  );
  out = out.replace(
    new RegExp(`\\b(${PAINT_PROPERTIES})\\s*=\\s*("[^"]*"|'[^']*')`, 'gi'),
    (_full, name: string, quoted: string) => {
      const q = quoted[0];
      return `${name}=${q}${rewrite(quoted.slice(1, -1))}${q}`;
    }
  );
  out = out.replace(/\bstyle\s*=\s*("[^"]*"|'[^']*')/gi, (_full, quoted: string) => {
    const q = quoted[0];
    return `style=${q}${rewritePaintDeclarations(quoted.slice(1, -1), rewrite)}${q}`;
  });
  return out;
}

function findRootSvgOpenTag(svg: string): { start: number; end: number; tag: string } | null {
  const m = /<svg\b[^>]*>/i.exec(svg);
  if (m?.index === undefined) {
    return null;
  }
  return { start: m.index, end: m.index + m[0].length, tag: m[0] };
}

function getAttr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i');
  const m = tag.match(re);
  if (!m) {
    return null;
  }
  return m[2] ?? m[3] ?? null;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function setAttr(tag: string, name: string, value: string): string {
  const safe = escapeAttr(value);
  const re = new RegExp(`\\s*${name}\\s*=\\s*("[^"]*"|'[^']*')`, 'i');
  if (re.test(tag)) {
    return tag.replace(re, ` ${name}="${safe}"`);
  }
  return tag.replace(/>$/, ` ${name}="${safe}">`);
}

function removeAttr(tag: string, name: string): string {
  return tag.replace(new RegExp(`\\s*${name}\\s*=\\s*("[^"]*"|'[^']*')`, 'i'), '');
}

function parseLength(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const m = /^(\d+(?:\.\d+)?)/.exec(value.trim());
  return m ? Number(m[1]) : null;
}

/**
 * Normalize SVG for responsive web embedding (viewBox, width/height, backgrounds).
 */
export function normalizeMermaidSvgForWeb(
  svg: string,
  options: Exclude<WebCompatibilityOption, boolean> = {}
): string {
  const opts = {
    responsiveWidth: options.responsiveWidth ?? true,
    responsiveHeight: options.responsiveHeight ?? true,
    ensureViewBox: options.ensureViewBox ?? true,
    stripBackground: options.stripBackground ?? false,
    preserveAspectRatio:
      options.preserveAspectRatio === undefined
        ? 'xMidYMid meet'
        : options.preserveAspectRatio === true
          ? 'xMidYMid meet'
          : options.preserveAspectRatio,
  };

  const root = findRootSvgOpenTag(svg);
  if (!root) {
    return svg;
  }

  let tag = root.tag;
  const viewBoxAttr = getAttr(tag, 'viewBox') ?? getAttr(tag, 'viewbox');
  if (opts.ensureViewBox && !viewBoxAttr) {
    const w = parseLength(getAttr(tag, 'width'));
    const h = parseLength(getAttr(tag, 'height'));
    if (w !== null && h !== null && w > 0 && h > 0) {
      tag = setAttr(tag, 'viewBox', `0 0 ${w} ${h}`);
    }
  }
  if (opts.responsiveWidth) {
    tag = setAttr(tag, 'width', '100%');
  }
  if (opts.responsiveHeight) {
    tag = setAttr(tag, 'height', 'auto');
  }
  if (opts.preserveAspectRatio !== false && !getAttr(tag, 'preserveAspectRatio')) {
    tag = setAttr(tag, 'preserveAspectRatio', opts.preserveAspectRatio);
  }

  let out = svg.slice(0, root.start) + tag + svg.slice(root.end);

  if (opts.stripBackground) {
    const root2 = findRootSvgOpenTag(out);
    if (root2) {
      const style = getAttr(root2.tag, 'style');
      if (style && /background/i.test(style)) {
        const cleaned = style
          .replace(/(?:^|;)\s*background(?:-color)?\s*:\s*[^;]+/gi, '')
          .replace(/^;+|;+$/g, '')
          .trim();
        const t = cleaned ? setAttr(root2.tag, 'style', cleaned) : removeAttr(root2.tag, 'style');
        out = out.slice(0, root2.start) + t + out.slice(root2.end);
      }
    }
  }

  return out;
}

function resolveCssVariableTheme(option: CssVariableThemeOption | undefined): {
  enabled: boolean;
  prefix: string;
} {
  if (!option) {
    return { enabled: false, prefix: DEFAULT_PREFIX };
  }
  if (option === true) {
    return { enabled: true, prefix: DEFAULT_PREFIX };
  }
  return { enabled: true, prefix: sanitizeCssIdent(option.prefix ?? DEFAULT_PREFIX) };
}

/**
 * Apply `cssVariableTheme` and/or `webCompatibility` to serialized SVG.
 */
export function prepareMermaidSvgForWeb(
  svg: string,
  options: {
    themeVariables?: ThemeVariablesRecord;
    cssVariableTheme?: CssVariableThemeOption;
    webCompatibility?: WebCompatibilityOption;
  }
): string {
  let out = svg;
  const css = resolveCssVariableTheme(options.cssVariableTheme);
  if (css.enabled && options.themeVariables) {
    out = rewriteMermaidSvgCssVars(out, options.themeVariables, { prefix: css.prefix });
  }
  if (options.webCompatibility) {
    const webOpts = options.webCompatibility === true ? {} : options.webCompatibility;
    out = normalizeMermaidSvgForWeb(out, webOpts);
  }
  return out;
}
