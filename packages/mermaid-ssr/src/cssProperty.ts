/**
 * Resolution of inherited SVG presentation properties.
 *
 * JSDOM implements only a subset of CSS in `getComputedStyle`, and returns an
 * empty string for SVG presentation properties such as `text-anchor` and
 * `font-family`. Mermaid sets several of them from the stylesheet it embeds in
 * the diagram rather than from attributes, so the lookup is done here by hand:
 * inline style, then presentation attribute, then the diagram's own stylesheet,
 * walking up the tree because these properties inherit.
 */

/** The outermost `<svg>` at or above `el` — the diagram root that carries the stylesheet. */
export function outermostSvg(el: Element): Element | null {
  let svg = el.closest('svg');
  let up = svg?.parentElement?.closest('svg');
  while (up) {
    svg = up;
    up = up.parentElement?.closest('svg');
  }
  return svg;
}

interface Rule {
  selector: string;
  value: string;
}

const RE_COMMENT = /\/\*[\S\s]*?\*\//g;
const RE_BLOCK = /([^{}]+){([^{}]*)}/g;

const ruleCache = new WeakMap<Element, Map<string, Rule[]>>();

/** Declarations of `prop` in the diagram's stylesheet, in source order. */
function stylesheetRules(root: Element, prop: string): Rule[] {
  let byProp = ruleCache.get(root);
  if (!byProp) {
    byProp = new Map();
    ruleCache.set(root, byProp);
  }
  const cached = byProp.get(prop);
  if (cached) {
    return cached;
  }

  const declaration = new RegExp(String.raw`(?:^|;)\s*${prop}\s*:\s*([^;]+)`, 'i');
  const rules: Rule[] = [];
  for (const style of root.querySelectorAll('style')) {
    const css = (style.textContent ?? '').replaceAll(RE_COMMENT, '');
    for (const [, selector, body] of css.matchAll(RE_BLOCK)) {
      const trimmed = selector.trim();
      if (!trimmed || trimmed.startsWith('@')) {
        continue;
      }
      const match = declaration.exec(body);
      if (match) {
        rules.push({ selector: trimmed, value: match[1].trim() });
      }
    }
  }
  byProp.set(prop, rules);
  return rules;
}

function fromStylesheet(el: Element, prop: string): string | undefined {
  const root = outermostSvg(el);
  if (!root) {
    return undefined;
  }
  let found: string | undefined;
  for (const rule of stylesheetRules(root, prop)) {
    try {
      if (el.matches(rule.selector)) {
        found = rule.value; // later rules win, approximating the cascade
      }
    } catch {
      // A selector JSDOM cannot parse simply does not match.
    }
  }
  return found;
}

function fromElement(el: Element, prop: string, inlineRe: RegExp): string | undefined {
  const inline = inlineRe.exec(el.getAttribute('style') ?? '');
  if (inline) {
    return inline[1].trim();
  }
  const attr = el.getAttribute(prop);
  if (attr) {
    return attr.trim();
  }
  return fromStylesheet(el, prop);
}

/**
 * Resolve an inherited presentation property for `el`, or `undefined` when
 * nothing in the tree or the stylesheet sets it.
 */
export function resolveInheritedProperty(el: Element, prop: string): string | undefined {
  const inlineRe = new RegExp(String.raw`(?:^|;)\s*${prop}\s*:\s*([^;]+)`, 'i');
  for (let node: Element | null = el; node; node = node.parentElement) {
    const value = fromElement(node, prop, inlineRe);
    if (value !== undefined && value !== 'inherit') {
      return value;
    }
  }
  return undefined;
}

export type TextAnchor = 'start' | 'middle' | 'end';

/** The effective `text-anchor` for `el`, defaulting to `start` as SVG does. */
export function textAnchorOf(el: Element): TextAnchor {
  const value = resolveInheritedProperty(el, 'text-anchor')?.toLowerCase();
  return value === 'middle' || value === 'end' ? value : 'start';
}

/**
 * Distance from the anchor point to the left edge of a run `width` px wide.
 * `start` anchors the left edge, `middle` the centre, `end` the right edge.
 */
export function anchorOffset(anchor: TextAnchor, width: number): number {
  if (anchor === 'middle') {
    return -width / 2;
  }
  return anchor === 'end' ? -width : 0;
}
