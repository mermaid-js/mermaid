/**
 * The per-item colour palette is opt-in per diagram. A shape or container stamps a
 * `data-color-id` slot on its rendered element, and the diagram's stylesheet maps that
 * slot to a border and fill. Both halves need the same answers to the same three
 * questions — is this a colour theme, does it actually carry a palette, and which slot
 * does this item get — so they live here rather than being restated per diagram.
 *
 * Before this module the `COLOR_THEMES` list existed in five copies and the stamping
 * block was duplicated verbatim between `clusters.js` and `classBox.ts`. Two idioms for
 * the same gate had already appeared: `er/styles.ts` keys off the theme name while
 * `requirement/styles.js` keys off the array being non-empty. Anything added here is
 * added once.
 */
import type { D3Selection } from '../../types.js';

/** Themes that carry a categorical palette for per-item colouring. */
export const COLOR_THEMES = new Set(['redux-color', 'redux-dark-color']);

/** How many palette slots to emit when the theme does not say. */
export const DEFAULT_COLOR_SLOTS = 12;

/**
 * Upper bound on slots. Every shipped palette has 12 entries, so this is generous -- it
 * exists to bound the loop, not to express a design limit. See `colorSlotCount`.
 */
export const MAX_COLOR_SLOTS = 64;

/**
 * A palette array is usable only if it is genuinely a non-empty array. A truthy `.length`
 * check passes for a plain string too, which would yield a per-character "palette" and
 * declarations like `stroke: r;`.
 */
export const hasPalette = (palette: unknown): palette is string[] =>
  Array.isArray(palette) && palette.length > 0;

/** Whether `theme` should render per-item colour at all. */
export const isColorTheme = (theme: string | undefined, palette: unknown): boolean =>
  theme != null && COLOR_THEMES.has(theme) && hasPalette(palette);

/**
 * `look` is interpolated into a CSS selector by every stylesheet that emits palette
 * rules, and it is a top-level config key — so it is settable from diagram text via
 * frontmatter or an init directive, and `config.sanitize` only removes values containing
 * `<`, `>` or `url(data:`. Braces and quotes survive, which is enough to close the
 * attribute selector early and open a rule block of the caller's choosing, escaping the
 * `#svgId` scoping stylis applies.
 *
 * Every real look is a bare word, so anything else is rejected outright rather than
 * escaped. Validate here, at the point of interpolation, so no caller has to remember.
 */
const SAFE_LOOK = /^[\w-]+$/;

export const safeLook = (look: string | undefined): string =>
  look != null && SAFE_LOOK.test(look) ? look : 'classic';

/**
 * Number of palette slots a stylesheet should emit.
 *
 * A missing, non-integer, non-positive or absurdly large `THEME_COLOR_LIMIT` falls back to
 * the default. The stylesheets use the result directly as a `for` bound, so it has to be a
 * value a loop can finish on: `typeof x === 'number' && x > 0` was not, because `Infinity`
 * satisfies both. That is reachable from diagram text rather than only site config --
 * `THEME_COLOR_LIMIT: .inf` in front matter parses to `Infinity` under the `JSON_SCHEMA`
 * mermaid loads YAML with -- and a large finite value such as `1e9` wedges generation just
 * as effectively.
 *
 * Beyond that, the count must cover every slot `stampColorSlot` can actually assign, which
 * is `palette.length` -- it wraps there, not at the limit. A palette longer than the limit
 * would otherwise have its tail stamped as `color-N` with no rule emitted for it, and those
 * items would render uncoloured beside their neighbours. Both shipped colour themes carry
 * exactly `THEME_COLOR_LIMIT` entries, so that only bites a `themeVariables` override --
 * but the two counts agreeing today is what hid it.
 *
 * Passing no palette keeps the plain limit, for callers that emit slots without stamping.
 */
export const colorSlotCount = (themeColorLimit: unknown, palette?: unknown): number => {
  const limit =
    typeof themeColorLimit === 'number' &&
    Number.isInteger(themeColorLimit) &&
    themeColorLimit > 0 &&
    themeColorLimit <= MAX_COLOR_SLOTS
      ? themeColorLimit
      : DEFAULT_COLOR_SLOTS;
  // A real palette is inherently bounded, but cap anyway so no single input can make the
  // bound unusable.
  return hasPalette(palette) ? Math.min(Math.max(limit, palette.length), MAX_COLOR_SLOTS) : limit;
};

/**
 * Stamp the element with its palette slot, so the diagram's `[data-color-id]` rules can
 * find it. A no-op for every theme without a palette, which is what keeps this safe to
 * call from shared rendering code used by diagrams that never opt in.
 *
 * The slot wraps at the palette length rather than indexing raw, so a palette shorter
 * than the emitted slot count cannot produce `stroke: undefined`.
 */
export const stampColorSlot = <T extends SVGGraphicsElement>(
  shapeSvg: D3Selection<T>,
  colorIndex: number | undefined,
  theme: string | undefined,
  palette: unknown
): void => {
  if (!isColorTheme(theme, palette)) {
    return;
  }
  const slot = (colorIndex ?? 0) % (palette as string[]).length;
  shapeSvg.attr('data-color-id', `color-${slot}`);
};
